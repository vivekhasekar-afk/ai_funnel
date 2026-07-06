"""
OpenAI API Client
=================
Production-grade async OpenAI API wrapper with rate limiting,
retry logic, cost tracking, and comprehensive error handling.

Features:
- Async/await support
- Automatic retries with exponential backoff
- Token counting and cost estimation
- Streaming response support
- Connection pooling
- Rate limiting
- Request/response logging
- Timeout handling

Author: AI Funnel Builder Team
Version: 1.0.0
Last Updated: 2024-01-15
"""

import asyncio
import time
import logging
from typing import Dict, List, Optional, Union, AsyncIterator, Any
from dataclasses import dataclass
from enum import Enum
import hashlib
import json

import backend.run_openai_test as run_openai_test
from backend.run_openai_test import AsyncOpenAI, OpenAIError, RateLimitError, APIError, Timeout
import tiktoken
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)

from app.core.config import settings


# Configure logger
logger = logging.getLogger(__name__)


class OpenAIModel(str, Enum):
    """Supported OpenAI models with metadata"""
    
    GPT_4_TURBO = "gpt-4-turbo-preview"
    GPT_4 = "gpt-4"
    GPT_4_32K = "gpt-4-32k"
    GPT_35_TURBO = "gpt-3.5-turbo"
    GPT_35_TURBO_16K = "gpt-3.5-turbo-16k"
    
    @property
    def max_tokens(self) -> int:
        """Get maximum context window for model"""
        limits = {
            self.GPT_4_TURBO: 128000,
            self.GPT_4: 8192,
            self.GPT_4_32K: 32768,
            self.GPT_35_TURBO: 4096,
            self.GPT_35_TURBO_16K: 16384,
        }
        return limits.get(self, 4096)
    
    @property
    def cost_per_1k_input(self) -> float:
        """Get cost per 1K input tokens in USD"""
        costs = {
            self.GPT_4_TURBO: 0.01,
            self.GPT_4: 0.03,
            self.GPT_4_32K: 0.06,
            self.GPT_35_TURBO: 0.0005,
            self.GPT_35_TURBO_16K: 0.003,
        }
        return costs.get(self, 0.0)
    
    @property
    def cost_per_1k_output(self) -> float:
        """Get cost per 1K output tokens in USD"""
        costs = {
            self.GPT_4_TURBO: 0.03,
            self.GPT_4: 0.06,
            self.GPT_4_32K: 0.12,
            self.GPT_35_TURBO: 0.0015,
            self.GPT_35_TURBO_16K: 0.004,
        }
        return costs.get(self, 0.0)


@dataclass
class TokenUsage:
    """Token usage statistics"""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost: float
    model: str
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            'prompt_tokens': self.prompt_tokens,
            'completion_tokens': self.completion_tokens,
            'total_tokens': self.total_tokens,
            'estimated_cost': self.estimated_cost,
            'model': self.model
        }


@dataclass
class OpenAIResponse:
    """Structured OpenAI API response"""
    content: str
    model: str
    usage: TokenUsage
    finish_reason: str
    latency_ms: float
    request_id: Optional[str] = None
    cached: bool = False
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            'content': self.content,
            'model': self.model,
            'usage': self.usage.to_dict(),
            'finish_reason': self.finish_reason,
            'latency_ms': self.latency_ms,
            'request_id': self.request_id,
            'cached': self.cached
        }


class RateLimiter:
    """Token bucket rate limiter"""
    
    def __init__(self, requests_per_minute: int = 60, tokens_per_minute: int = 90000):
        self.requests_per_minute = requests_per_minute
        self.tokens_per_minute = tokens_per_minute
        
        self.request_tokens = requests_per_minute
        self.token_tokens = tokens_per_minute
        
        self.last_request_refill = time.time()
        self.last_token_refill = time.time()
        
        self._lock = asyncio.Lock()
    
    async def acquire(self, estimated_tokens: int = 1000):
        """
        Acquire rate limit tokens
        
        Args:
            estimated_tokens: Expected tokens for this request
        """
        async with self._lock:
            now = time.time()
            
            # Refill request tokens
            time_since_request = now - self.last_request_refill
            request_refill = int(time_since_request * (self.requests_per_minute / 60))
            if request_refill > 0:
                self.request_tokens = min(
                    self.requests_per_minute,
                    self.request_tokens + request_refill
                )
                self.last_request_refill = now
            
            # Refill token bucket
            time_since_token = now - self.last_token_refill
            token_refill = int(time_since_token * (self.tokens_per_minute / 60))
            if token_refill > 0:
                self.token_tokens = min(
                    self.tokens_per_minute,
                    self.token_tokens + token_refill
                )
                self.last_token_refill = now
            
            # Check if we have enough tokens
            if self.request_tokens < 1 or self.token_tokens < estimated_tokens:
                # Calculate wait time
                wait_for_request = 0 if self.request_tokens >= 1 else (1 - self.request_tokens) * (60 / self.requests_per_minute)
                wait_for_tokens = 0 if self.token_tokens >= estimated_tokens else (estimated_tokens - self.token_tokens) * (60 / self.tokens_per_minute)
                
                wait_time = max(wait_for_request, wait_for_tokens)
                
                logger.warning(f"Rate limit reached, waiting {wait_time:.2f}s")
                await asyncio.sleep(wait_time)
                
                # Try again after waiting
                return await self.acquire(estimated_tokens)
            
            # Consume tokens
            self.request_tokens -= 1
            self.token_tokens -= estimated_tokens


class OpenAIClient:
    """
    Production-grade OpenAI API client
    
    Features:
    - Async/await support
    - Automatic retries
    - Rate limiting
    - Token counting
    - Cost tracking
    - Streaming support
    - Error handling
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        organization: Optional[str] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
        rate_limit_rpm: int = 60,
        rate_limit_tpm: int = 90000
    ):
        """
        Initialize OpenAI client
        
        Args:
            api_key: OpenAI API key (defaults to settings)
            organization: OpenAI organization ID
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries
            rate_limit_rpm: Requests per minute limit
            rate_limit_tpm: Tokens per minute limit
        """
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.organization = organization
        self.timeout = timeout
        self.max_retries = max_retries
        
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        # Initialize async client
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            organization=self.organization,
            timeout=self.timeout,
            max_retries=0  # We handle retries ourselves
        )
        
        # Rate limiter
        self.rate_limiter = RateLimiter(
            requests_per_minute=rate_limit_rpm,
            tokens_per_minute=rate_limit_tpm
        )
        
        # Token encoder cache
        self._encoders = {}
        
        # Metrics
        self.total_requests = 0
        self.total_tokens = 0
        self.total_cost = 0.0
        self.failed_requests = 0
        
        logger.info(f"✅ OpenAI client initialized (RPM: {rate_limit_rpm}, TPM: {rate_limit_tpm})")
    
    def _get_encoder(self, model: str) -> tiktoken.Encoding:
        """
        Get tiktoken encoder for model
        
        Args:
            model: Model name
            
        Returns:
            tiktoken.Encoding: Token encoder
        """
        if model not in self._encoders:
            try:
                self._encoders[model] = tiktoken.encoding_for_model(model)
            except KeyError:
                # Fallback to cl100k_base for unknown models
                self._encoders[model] = tiktoken.get_encoding("cl100k_base")
        
        return self._encoders[model]
    
    def count_tokens(
        self,
        text: Union[str, List[Dict[str, str]]],
        model: str = OpenAIModel.GPT_4_TURBO
    ) -> int:
        """
        Count tokens in text or messages
        
        Args:
            text: String or list of message dicts
            model: Model name for tokenization
            
        Returns:
            int: Token count
        """
        encoder = self._get_encoder(model)
        
        if isinstance(text, str):
            return len(encoder.encode(text))
        
        # Count tokens in messages
        total_tokens = 0
        for message in text:
            # Every message has overhead tokens
            total_tokens += 4  # <im_start>{role}<im_sep>{content}<im_end>
            
            for key, value in message.items():
                total_tokens += len(encoder.encode(str(value)))
        
        total_tokens += 2  # <im_start>assistant
        
        return total_tokens
    
    def estimate_cost(
        self,
        prompt_tokens: int,
        completion_tokens: int,
        model: str = OpenAIModel.GPT_4_TURBO
    ) -> float:
        """
        Estimate cost for token usage
        
        Args:
            prompt_tokens: Number of input tokens
            completion_tokens: Number of output tokens
            model: Model name
            
        Returns:
            float: Estimated cost in USD
        """
        try:
            model_enum = OpenAIModel(model)
            input_cost = (prompt_tokens / 1000) * model_enum.cost_per_1k_input
            output_cost = (completion_tokens / 1000) * model_enum.cost_per_1k_output
            return input_cost + output_cost
        except ValueError:
            logger.warning(f"Unknown model for cost estimation: {model}")
            return 0.0
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((RateLimitError, APIError, Timeout)),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    async def create_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = OpenAIModel.GPT_4_TURBO,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        stop: Optional[List[str]] = None,
        user_id: Optional[str] = None
    ) -> OpenAIResponse:
        """
        Create a chat completion
        
        Args:
            messages: List of message dictionaries
            model: Model to use
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            top_p: Nucleus sampling parameter
            frequency_penalty: Frequency penalty (-2 to 2)
            presence_penalty: Presence penalty (-2 to 2)
            stop: Stop sequences
            user_id: User identifier for tracking
            
        Returns:
            OpenAIResponse: Structured response
        """
        start_time = time.time()
        
        # Validate parameters
        if not 0 <= temperature <= 2:
            raise ValueError("Temperature must be between 0 and 2")
        
        if not 0 <= top_p <= 1:
            raise ValueError("top_p must be between 0 and 1")
        
        # Count input tokens
        prompt_tokens = self.count_tokens(messages, model)
        
        # Rate limiting
        await self.rate_limiter.acquire(estimated_tokens=prompt_tokens + (max_tokens or 1000))
        
        try:
            # Make API call
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                stop=stop,
                user=user_id
            )
            
            # Extract response data
            choice = response.choices[0]
            content = choice.message.content
            finish_reason = choice.finish_reason
            
            # Token usage
            usage = response.usage
            prompt_tokens = usage.prompt_tokens
            completion_tokens = usage.completion_tokens
            total_tokens = usage.total_tokens
            
            # Calculate cost
            estimated_cost = self.estimate_cost(prompt_tokens, completion_tokens, model)
            
            # Update metrics
            self.total_requests += 1
            self.total_tokens += total_tokens
            self.total_cost += estimated_cost
            
            # Calculate latency
            latency_ms = (time.time() - start_time) * 1000
            
            # Create structured response
            token_usage = TokenUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                estimated_cost=estimated_cost,
                model=model
            )
            
            openai_response = OpenAIResponse(
                content=content,
                model=model,
                usage=token_usage,
                finish_reason=finish_reason,
                latency_ms=latency_ms,
                request_id=response.id
            )
            
            # Log successful request
            logger.info(
                f"✅ OpenAI request completed | "
                f"Model: {model} | "
                f"Tokens: {total_tokens} | "
                f"Cost: ${estimated_cost:.4f} | "
                f"Latency: {latency_ms:.0f}ms"
            )
            
            return openai_response
            
        except RateLimitError as e:
            self.failed_requests += 1
            logger.warning(f"⚠️ Rate limit hit: {e}")
            raise
            
        except APIError as e:
            self.failed_requests += 1
            logger.error(f"❌ OpenAI API error: {e}")
            raise
            
        except Timeout as e:
            self.failed_requests += 1
            logger.error(f"❌ Request timeout: {e}")
            raise
            
        except Exception as e:
            self.failed_requests += 1
            logger.error(f"❌ Unexpected error: {e}")
            raise
    
    async def create_completion_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = OpenAIModel.GPT_4_TURBO,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """
        Create a streaming chat completion
        
        Args:
            messages: List of message dictionaries
            model: Model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters
            
        Yields:
            str: Token chunks
        """
        # Count input tokens for rate limiting
        prompt_tokens = self.count_tokens(messages, model)
        await self.rate_limiter.acquire(estimated_tokens=prompt_tokens + (max_tokens or 1000))
        
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
                **kwargs
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"❌ Streaming error: {e}")
            raise
    
    async def create_json_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = OpenAIModel.GPT_4_TURBO,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create completion with JSON response
        
        Args:
            messages: List of message dictionaries
            model: Model to use
            **kwargs: Additional parameters
            
        Returns:
            dict: Parsed JSON response
        """
        # Add JSON instruction to system message
        if messages[0]['role'] == 'system':
            messages[0]['content'] += "\n\nRespond with valid JSON only."
        else:
            messages.insert(0, {
                'role': 'system',
                'content': 'Respond with valid JSON only.'
            })
        
        response = await self.create_completion(
            messages=messages,
            model=model,
            temperature=0.3,  # Lower temperature for structured output
            **kwargs
        )
        
        try:
            return json.loads(response.content)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse JSON response: {e}")
            logger.error(f"Response content: {response.content}")
            raise ValueError(f"Invalid JSON response: {e}")
    
    async def test_connection(self) -> bool:
        """
        Test OpenAI API connection
        
        Returns:
            bool: True if connection successful
        """
        try:
            response = await self.create_completion(
                messages=[{'role': 'user', 'content': 'Hi'}],
                model=OpenAIModel.GPT_35_TURBO,
                max_tokens=5
            )
            logger.info("✅ OpenAI connection test successful")
            return True
        except Exception as e:
            logger.error(f"❌ OpenAI connection test failed: {e}")
            return False
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get client metrics
        
        Returns:
            dict: Usage metrics
        """
        return {
            'total_requests': self.total_requests,
            'failed_requests': self.failed_requests,
            'success_rate': (self.total_requests - self.failed_requests) / max(self.total_requests, 1),
            'total_tokens': self.total_tokens,
            'total_cost': round(self.total_cost, 4),
            'avg_tokens_per_request': self.total_tokens / max(self.total_requests, 1),
            'avg_cost_per_request': self.total_cost / max(self.total_requests, 1)
        }
    
    def close(self):
        """Close client connections"""
        logger.info("🔄 Closing OpenAI client")
        # AsyncOpenAI handles connection cleanup automatically


# Convenience function for quick usage
async def quick_completion(
    prompt: str,
    system_message: str = "You are a helpful assistant.",
    model: str = OpenAIModel.GPT_4_TURBO,
    **kwargs
) -> str:
    """
    Quick completion for simple prompts
    
    Args:
        prompt: User prompt
        system_message: System message
        model: Model to use
        **kwargs: Additional parameters
        
    Returns:
        str: Completion content
    """
    client = OpenAIClient()
    
    messages = [
        {'role': 'system', 'content': system_message},
        {'role': 'user', 'content': prompt}
    ]
    
    response = await client.create_completion(messages=messages, model=model, **kwargs)
    return response.content


# Export
__all__ = [
    'OpenAIClient',
    'OpenAIModel',
    'OpenAIResponse',
    'TokenUsage',
    'RateLimiter',
    'quick_completion'
]
