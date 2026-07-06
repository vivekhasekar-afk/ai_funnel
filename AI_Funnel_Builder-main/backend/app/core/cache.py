# =============================================================================
# AI FUNNEL BUILDER - CACHING LAYER
# =============================================================================
# Redis-based caching for performance optimization
# =============================================================================

from typing import Any, Optional, Callable, Union
from functools import wraps
import json
import hashlib
import pickle
from datetime import timedelta
import logging

from redis.asyncio import Redis, ConnectionPool
from redis.exceptions import RedisError

from app.core.config import settings

# =============================================================================
# LOGGING
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# REDIS CLIENT SETUP
# =============================================================================

class RedisCache:
    """
    Redis cache manager with async support.
    
    Features:
    - Async operations
    - Automatic serialization
    - TTL management
    - Cache invalidation
    - Key namespacing
    """
    
    def __init__(self):
        self.redis: Optional[Redis] = None
        self._pool: Optional[ConnectionPool] = None
    
    async def connect(self):
        """Initialize Redis connection pool."""
        try:
            # Parse Redis URL
            self._pool = ConnectionPool.from_url(
                settings.redis_cache_url,
                max_connections=settings.REDIS_MAX_CONNECTIONS,
                decode_responses=False,  # We'll handle encoding manually
            )
            
            self.redis = Redis(connection_pool=self._pool)
            
            # Test connection
            await self.redis.ping()
            logger.info(f"✅ Connected to Redis: {settings.redis_cache_url}")
            
        except RedisError as e:
            logger.error(f"❌ Redis connection failed: {e}")
            raise
    
    async def close(self):
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()
            logger.info("Redis connection closed")
    
    async def ping(self) -> bool:
        """Check Redis connection health."""
        try:
            return await self.redis.ping()
        except RedisError as e:
            logger.error(f"Redis ping failed: {e}")
            return False
    
    # -------------------------------------------------------------------------
    # BASIC OPERATIONS
    # -------------------------------------------------------------------------
    
    async def get(
        self,
        key: str,
        deserialize: bool = True
    ) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            deserialize: Whether to deserialize JSON/pickle
        
        Returns:
            Cached value or None
        """
        try:
            value = await self.redis.get(key)
            
            if value is None:
                return None
            
            if deserialize:
                return self._deserialize(value)
            
            return value
            
        except RedisError as e:
            logger.error(f"Cache get error for key '{key}': {e}")
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        serialize: bool = True
    ) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (None = no expiration)
            serialize: Whether to serialize value
        
        Returns:
            True if successful
        """
        try:
            if serialize:
                value = self._serialize(value)
            
            if ttl:
                await self.redis.setex(key, ttl, value)
            else:
                await self.redis.set(key, value)
            
            return True
            
        except RedisError as e:
            logger.error(f"Cache set error for key '{key}': {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.
        
        Args:
            key: Cache key
        
        Returns:
            True if key was deleted
        """
        try:
            result = await self.redis.delete(key)
            return result > 0
        except RedisError as e:
            logger.error(f"Cache delete error for key '{key}': {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        try:
            return await self.redis.exists(key) > 0
        except RedisError as e:
            logger.error(f"Cache exists check error for key '{key}': {e}")
            return False
    
    async def expire(self, key: str, ttl: int) -> bool:
        """
        Set expiration on existing key.
        
        Args:
            key: Cache key
            ttl: Time to live in seconds
        
        Returns:
            True if expiration was set
        """
        try:
            return await self.redis.expire(key, ttl)
        except RedisError as e:
            logger.error(f"Cache expire error for key '{key}': {e}")
            return False
    
    async def ttl(self, key: str) -> int:
        """
        Get remaining TTL for key.
        
        Returns:
            Seconds remaining (-1 = no expiration, -2 = key doesn't exist)
        """
        try:
            return await self.redis.ttl(key)
        except RedisError as e:
            logger.error(f"Cache TTL check error for key '{key}': {e}")
            return -2
    
    # -------------------------------------------------------------------------
    # PATTERN OPERATIONS
    # -------------------------------------------------------------------------
    
    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern.
        
        Args:
            pattern: Redis pattern (e.g., "user:*", "funnel:123:*")
        
        Returns:
            Number of keys deleted
        """
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                return await self.redis.delete(*keys)
            return 0
        except RedisError as e:
            logger.error(f"Cache delete pattern error for '{pattern}': {e}")
            return 0
    
    async def get_keys(self, pattern: str) -> list:
        """Get all keys matching a pattern."""
        try:
            keys = await self.redis.keys(pattern)
            return [key.decode() if isinstance(key, bytes) else key for key in keys]
        except RedisError as e:
            logger.error(f"Cache get keys error for pattern '{pattern}': {e}")
            return []
    
    # -------------------------------------------------------------------------
    # HASH OPERATIONS (for structured data)
    # -------------------------------------------------------------------------
    
    async def hget(self, name: str, key: str) -> Optional[Any]:
        """Get value from hash."""
        try:
            value = await self.redis.hget(name, key)
            if value:
                return self._deserialize(value)
            return None
        except RedisError as e:
            logger.error(f"Cache hget error: {e}")
            return None
    
    async def hset(
        self,
        name: str,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in hash."""
        try:
            value = self._serialize(value)
            await self.redis.hset(name, key, value)
            
            if ttl:
                await self.redis.expire(name, ttl)
            
            return True
        except RedisError as e:
            logger.error(f"Cache hset error: {e}")
            return False
    
    async def hgetall(self, name: str) -> dict:
        """Get all fields from hash."""
        try:
            data = await self.redis.hgetall(name)
            return {
                k.decode(): self._deserialize(v)
                for k, v in data.items()
            }
        except RedisError as e:
            logger.error(f"Cache hgetall error: {e}")
            return {}
    
    # -------------------------------------------------------------------------
    # SERIALIZATION
    # -------------------------------------------------------------------------
    
    def _serialize(self, value: Any) -> bytes:
        """
        Serialize value for storage.
        
        Tries JSON first, falls back to pickle for complex objects.
        """
        try:
            # Try JSON first (faster, more portable)
            return json.dumps(value).encode()
        except (TypeError, ValueError):
            # Fall back to pickle for complex objects
            return pickle.dumps(value)
    
    def _deserialize(self, value: bytes) -> Any:
        """
        Deserialize value from storage.
        
        Tries JSON first, falls back to pickle.
        """
        try:
            # Try JSON first
            return json.loads(value.decode())
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Fall back to pickle
            try:
                return pickle.loads(value)
            except Exception as e:
                logger.error(f"Deserialization error: {e}")
                return None
    
    # -------------------------------------------------------------------------
    # HELPER METHODS
    # -------------------------------------------------------------------------
    
    def generate_key(self, namespace: str, *args, **kwargs) -> str:
        """
        Generate a cache key from namespace and arguments.
        
        Args:
            namespace: Key namespace (e.g., "user", "funnel", "analytics")
            *args: Positional arguments to include in key
            **kwargs: Keyword arguments to include in key
        
        Returns:
            Cache key string
        
        Example:
            key = cache.generate_key("funnel", funnel_id, version=1)
            # Returns: "funnel:abc123:v1"
        """
        parts = [namespace]
        
        # Add positional args
        parts.extend(str(arg) for arg in args)
        
        # Add sorted keyword args
        for k, v in sorted(kwargs.items()):
            parts.append(f"{k}:{v}")
        
        return ":".join(parts)
    
    def hash_key(self, *args) -> str:
        """
        Generate a hash-based cache key.
        
        Useful for complex objects or long keys.
        
        Example:
            key = cache.hash_key("function_name", arg1, arg2, kwarg1=val1)
        """
        key_str = json.dumps(args, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()


# Global cache instance
cache = RedisCache()


# =============================================================================
# CACHE DECORATORS
# =============================================================================

def cached(
    ttl: Optional[int] = None,
    key_prefix: str = "cache",
    key_builder: Optional[Callable] = None
):
    """
    Decorator to cache function results.
    
    Args:
        ttl: Time to live in seconds (None = use default from settings)
        key_prefix: Prefix for cache keys
        key_builder: Custom function to build cache key
    
    Usage:
        @cached(ttl=3600, key_prefix="user")
        async def get_user(user_id: str):
            # Expensive database query
            return user
    
    The result will be cached for 1 hour with key "user:{user_id}"
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default: use function name + args
                key_parts = [key_prefix, func.__name__]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_result = await cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached_result
            
            # Cache miss - execute function
            logger.debug(f"Cache MISS: {cache_key}")
            result = await func(*args, **kwargs)
            
            # Store in cache
            cache_ttl = ttl or settings.CACHE_TTL_ANALYTICS
            await cache.set(cache_key, result, ttl=cache_ttl)
            
            return result
        
        return wrapper
    return decorator


def cache_invalidate(key_pattern: str):
    """
    Decorator to invalidate cache after function execution.
    
    Args:
        key_pattern: Pattern of keys to invalidate (supports wildcards)
    
    Usage:
        @cache_invalidate("user:*")
        async def update_user(user_id: str, data: dict):
            # Update user in database
            # Cache will be invalidated after successful update
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Execute function
            result = await func(*args, **kwargs)
            
            # Invalidate cache
            deleted = await cache.delete_pattern(key_pattern)
            if deleted > 0:
                logger.info(f"Invalidated {deleted} cache keys matching '{key_pattern}'")
            
            return result
        
        return wrapper
    return decorator


# =============================================================================
# SPECIALIZED CACHE FUNCTIONS
# =============================================================================

async def cache_benchmark(category: str, data: dict) -> bool:
    """
    Cache benchmark data with long TTL.
    
    Args:
        category: Benchmark category (e.g., "skincare", "real_estate")
        data: Benchmark data dictionary
    
    Returns:
        True if cached successfully
    """
    key = f"benchmark:{category}"
    ttl = settings.CACHE_TTL_BENCHMARKS
    return await cache.set(key, data, ttl=ttl)


async def get_cached_benchmark(category: str) -> Optional[dict]:
    """Get cached benchmark data."""
    key = f"benchmark:{category}"
    return await cache.get(key)


async def cache_analytics(funnel_id: str, analytics_data: dict) -> bool:
    """
    Cache funnel analytics.
    
    Args:
        funnel_id: Funnel UUID
        analytics_data: Analytics dictionary
    
    Returns:
        True if cached successfully
    """
    key = f"analytics:funnel:{funnel_id}"
    ttl = settings.CACHE_TTL_ANALYTICS
    return await cache.set(key, analytics_data, ttl=ttl)


async def get_cached_analytics(funnel_id: str) -> Optional[dict]:
    """Get cached funnel analytics."""
    key = f"analytics:funnel:{funnel_id}"
    return await cache.get(key)


async def invalidate_funnel_cache(funnel_id: str):
    """
    Invalidate all cache entries for a funnel.
    
    Args:
        funnel_id: Funnel UUID
    """
    patterns = [
        f"funnel:{funnel_id}:*",
        f"analytics:funnel:{funnel_id}*",
        f"responses:funnel:{funnel_id}*",
    ]
    
    total_deleted = 0
    for pattern in patterns:
        deleted = await cache.delete_pattern(pattern)
        total_deleted += deleted
    
    logger.info(f"Invalidated {total_deleted} cache entries for funnel {funnel_id}")


async def cache_user_session(user_id: str, session_data: dict) -> bool:
    """
    Cache user session data.
    
    Args:
        user_id: User UUID
        session_data: Session information
    
    Returns:
        True if cached successfully
    """
    key = f"session:user:{user_id}"
    ttl = settings.CACHE_TTL_USER_SESSION
    return await cache.set(key, session_data, ttl=ttl)


async def get_user_session(user_id: str) -> Optional[dict]:
    """Get cached user session."""
    key = f"session:user:{user_id}"
    return await cache.get(key)


# =============================================================================
# CACHE WARMING (Pre-populate frequently accessed data)
# =============================================================================

async def warm_cache():
    """
    Pre-populate cache with frequently accessed data.
    
    Call this on application startup or periodically.
    """
    logger.info("Starting cache warming...")
    
    try:
        # Example: Pre-cache benchmarks for all categories
        categories = ["skincare", "real_estate", "fitness", "finance"]
        
        for category in categories:
            # This would fetch from database and cache
            # from app.data_pipeline.intelligence.benchmark_builder import get_benchmarks
            # benchmarks = await get_benchmarks(category)
            # await cache_benchmark(category, benchmarks)
            pass
        
        logger.info("✅ Cache warming completed")
        
    except Exception as e:
        logger.error(f"❌ Cache warming failed: {e}")


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "cache",
    "RedisCache",
    "cached",
    "cache_invalidate",
    "cache_benchmark",
    "get_cached_benchmark",
    "cache_analytics",
    "get_cached_analytics",
    "invalidate_funnel_cache",
    "cache_user_session",
    "get_user_session",
    "warm_cache",
]
