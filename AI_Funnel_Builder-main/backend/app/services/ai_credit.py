"""
AI Credit Manager - Enterprise Grade
====================================
Production-ready AI usage tracking, quota management, and cost calculation.
"""

import asyncio
import redis.asyncio as redis
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
import json
from decimal import Decimal
from functools import lru_cache
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.subscription import Subscription
from app.utils.exceptions import AIQuotaExceededException, AIServiceError
from app.utils.logger import get_logger
from app.data_pipeline.storage.cache import get_cache_client

logger = get_logger(__name__)


class AiCreditManager:
    """
    Enterprise AI credit management system.
    """
    
    def __init__(self):
        self.redis = None
        self._model_pricing = self._load_model_pricing()
    
    async def initialize(self):
        """Initialize Redis connection."""
        if self.redis is None:
            self.redis = await get_cache_client()
    
    @lru_cache(maxsize=128)
    def _load_model_pricing(self) -> Dict[str, Dict[str, Decimal]]:
        """Load AI model pricing from settings."""
        return {
            "gpt-4-turbo": {
                "input_cost_per_1k": Decimal("0.01"),
                "output_cost_per_1k": Decimal("0.03"),
            },
            "gpt-4": {
                "input_cost_per_1k": Decimal("0.03"),
                "output_cost_per_1k": Decimal("0.06"),
            },
            "gpt-3.5-turbo": {
                "input_cost_per_1k": Decimal("0.001"),
                "output_cost_per_1k": Decimal("0.002"),
            },
            "claude-3-opus": {
                "input_cost_per_1k": Decimal("0.015"),
                "output_cost_per_1k": Decimal("0.075"),
            },
        }
    
    # ✅ FIXED: Accept db session as parameter
    async def get_user_quota(self, user_id: str, db: AsyncSession) -> Dict[str, int]:
        """Get user's AI quota based on subscription tier."""
        try:
            # Query subscription
            result = await db.execute(
                select(Subscription).where(Subscription.user_id == user_id)
            )
            subscription = result.scalar_one_or_none()
            
            if not subscription:
                logger.info(f"No subscription found for user {user_id}, using free tier")
                return {"daily_tokens": 10000, "monthly_tokens": 100000}  # Free tier
            
            tier_quotas = {
                "free": {"daily_tokens": 10000, "monthly_tokens": 100000},
                "pro": {"daily_tokens": 100000, "monthly_tokens": 1000000},
                "enterprise": {"daily_tokens": -1, "monthly_tokens": -1},  # Unlimited
            }
            
            quota = tier_quotas.get(subscription.tier, tier_quotas["free"])
            logger.info(f"User {user_id} quota: {quota}")
            return quota
            
        except Exception as e:
            logger.error(f"Error fetching quota for user {user_id}: {str(e)}")
            # Return free tier on error
            return {"daily_tokens": 10000, "monthly_tokens": 100000}
    
    async def get_user_usage(self, user_id: str, period: str = "daily") -> int:
        """Get user's token usage for period."""
        try:
            cache_key = f"ai_usage:{user_id}:{period}"
            cached = await self.redis.get(cache_key)
            
            if cached:
                return int(cached)
            
            # No usage found
            return 0
            
        except Exception as e:
            logger.error(f"Error fetching usage for user {user_id}: {str(e)}")
            return 0
    
    # ✅ FIXED: Accept db session as parameter
    async def check_quota(self, user_id: str, tokens_requested: int, db: AsyncSession) -> bool:
        """Check if user has quota for requested tokens."""
        try:
            quota = await self.get_user_quota(user_id, db)
            usage = await self.get_user_usage(user_id, "daily")
            
            # Check if unlimited
            if quota["daily_tokens"] == -1:
                logger.info(f"User {user_id} has unlimited quota")
                return True
            
            remaining = quota["daily_tokens"] - usage
            
            if tokens_requested > remaining:
                logger.warning(
                    f"Quota exceeded for user {user_id}: "
                    f"requested={tokens_requested}, remaining={remaining}"
                )
                raise AIQuotaExceededException(
                    limit=quota["daily_tokens"],
                    used=usage
                )
            
            logger.info(
                f"Quota check passed for user {user_id}: "
                f"requested={tokens_requested}, remaining={remaining}"
            )
            return True
            
        except AIQuotaExceededException:
            raise
        except Exception as e:
            logger.error(f"Error checking quota: {str(e)}")
            # Allow request on error (fail open)
            return True
    
    def calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> Decimal:
        """Calculate cost for AI request."""
        pricing = self._model_pricing.get(model, self._model_pricing["gpt-3.5-turbo"])
        
        input_cost = (Decimal(input_tokens) / 1000) * pricing["input_cost_per_1k"]
        output_cost = (Decimal(output_tokens) / 1000) * pricing["output_cost_per_1k"]
        
        return input_cost + output_cost
    
    async def track_usage(self, user_id: str, model: str, input_tokens: int, output_tokens: int):
        """Track AI usage and update quotas."""
        try:
            total_tokens = input_tokens + output_tokens
            cost = self.calculate_cost(model, input_tokens, output_tokens)
            
            # Update Redis counters (multi-period)
            pipe = self.redis.pipeline()
            periods = ["daily", "monthly"]
            
            for period in periods:
                key = f"ai_usage:{user_id}:{period}"
                pipe.incrby(key, total_tokens)
                pipe.expire(key, 86400 if period == "daily" else 2592000)  # TTL
            
            # Track costs
            cost_key = f"ai_cost:{user_id}:monthly"
            pipe.incrbyfloat(cost_key, float(cost))
            pipe.expire(cost_key, 2592000)
            
            await pipe.execute()
            
            logger.info(
                f"AI usage tracked: user={user_id}, model={model}, "
                f"tokens={total_tokens}, cost=${cost:.4f}"
            )
            
        except Exception as e:
            logger.error(f"Error tracking usage: {str(e)}")
    
    async def get_rate_limit(self, user_id: str, window: int = 60) -> Tuple[int, int]:
        """Get rate limit remaining for user (tokens per window seconds)."""
        try:
            key = f"ai_rl:{user_id}:{window}"
            remaining = await self.redis.get(key)
            return int(remaining or 1000), window  # Default 1k tokens/min
        except Exception as e:
            logger.error(f"Error getting rate limit: {str(e)}")
            return 1000, window
    
    async def consume_rate_limit(self, user_id: str, tokens: int, window: int = 60) -> bool:
        """Consume rate limit tokens."""
        try:
            key = f"ai_rl:{user_id}:{window}"
            pipe = self.redis.pipeline()
            pipe.decrby(key, tokens)
            pipe.expire(key, window)
            result = await pipe.execute()
            return result[0] >= 0  # Still within limit
        except Exception as e:
            logger.error(f"Error consuming rate limit: {str(e)}")
            return True  # Allow on error


# Global singleton instance
ai_credit_manager = AiCreditManager()
