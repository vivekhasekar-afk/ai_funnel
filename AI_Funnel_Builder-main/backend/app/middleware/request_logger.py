# =============================================================================
# AI FUNNEL BUILDER - REQUEST LOGGER MIDDLEWARE
# =============================================================================
# Production-grade request/response logging with performance monitoring
# =============================================================================

import time
import json
from typing import Optional, Dict, Any, Callable
from io import BytesIO

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from starlette.datastructures import UploadFile

from app.core.config import settings
from app.utils.logger import get_logger, request_id_var, user_id_var
from app.utils.helpers import get_client_ip
from app.utils.formatters import format_file_size

logger = get_logger(__name__)


# =============================================================================
# REQUEST BODY READER
# =============================================================================

class RequestBodyReader:
    """
    Read and cache request body for logging.
    """
    
    @staticmethod
    async def read_body(request: Request, max_size: int = 10000) -> Optional[str]:
        """
        Read request body safely.
        
        Args:
            request: FastAPI request
            max_size: Maximum body size to read (bytes)
        
        Returns:
            Request body as string or None
        """
        try:
            # Get body
            body = await request.body()
            
            # Check size
            if len(body) > max_size:
                return f"[Body too large: {format_file_size(len(body))}]"
            
            # Try to decode as JSON
            try:
                body_dict = json.loads(body)
                # Mask sensitive fields
                body_dict = RequestBodyReader._mask_sensitive_data(body_dict)
                return json.dumps(body_dict, ensure_ascii=False)
            except json.JSONDecodeError:
                # Return as string if not JSON
                return body.decode("utf-8", errors="replace")
        
        except Exception as e:
            logger.debug(f"Failed to read request body: {e}")
            return None
    
    @staticmethod
    def _mask_sensitive_data(data: Any) -> Any:
        """
        Mask sensitive fields in data.
        
        Args:
            data: Data to mask
        
        Returns:
            Masked data
        """
        sensitive_fields = {
            "password", "token", "api_key", "secret", "authorization",
            "credit_card", "ssn", "access_token", "refresh_token",
            "card_number", "cvv", "pin"
        }
        
        if isinstance(data, dict):
            return {
                key: "[REDACTED]" if key.lower() in sensitive_fields else RequestBodyReader._mask_sensitive_data(value)
                for key, value in data.items()
            }
        elif isinstance(data, list):
            return [RequestBodyReader._mask_sensitive_data(item) for item in data]
        else:
            return data


# =============================================================================
# RESPONSE BODY CAPTURER
# =============================================================================

class ResponseBodyCapturer:
    """
    Capture response body for logging.
    """
    
    @staticmethod
    def capture_response_body(
        body: bytes,
        max_size: int = 10000
    ) -> Optional[str]:
        """
        Capture response body safely.
        
        Args:
            body: Response body bytes
            max_size: Maximum body size to capture
        
        Returns:
            Response body as string or None
        """
        try:
            # Check size
            if len(body) > max_size:
                return f"[Body too large: {format_file_size(len(body))}]"
            
            # Try to decode as JSON
            try:
                body_dict = json.loads(body)
                # Mask sensitive fields
                body_dict = RequestBodyReader._mask_sensitive_data(body_dict)
                return json.dumps(body_dict, ensure_ascii=False)
            except json.JSONDecodeError:
                # Return as string if not JSON
                return body.decode("utf-8", errors="replace")
        
        except Exception as e:
            logger.debug(f"Failed to capture response body: {e}")
            return None


# =============================================================================
# REQUEST LOGGER
# =============================================================================

class RequestLogger:
    """
    Log requests with comprehensive information.
    """
    
    def __init__(self):
        """Initialize request logger."""
        self.slow_request_threshold = 1000  # milliseconds
        self.log_request_body = settings.LOG_REQUEST_BODY
        self.log_response_body = settings.LOG_RESPONSE_BODY
        
        # Paths to skip logging
        self.skip_paths = {
            "/health",
            "/health/ready",
            "/health/live",
            "/metrics",
        }
        
        # Paths to log at DEBUG level
        self.debug_paths = {
            "/docs",
            "/redoc",
            "/openapi.json",
            "/static",
        }
    
    def should_log(self, request: Request) -> bool:
        """
        Check if request should be logged.
        
        Args:
            request: FastAPI request
        
        Returns:
            True if should log
        """
        # Skip certain paths
        if request.url.path in self.skip_paths:
            return False
        
        # Skip static files
        if request.url.path.startswith("/static"):
            return False
        
        return True
    
    def get_log_level(self, request: Request, status_code: int) -> str:
        """
        Get appropriate log level.
        
        Args:
            request: FastAPI request
            status_code: Response status code
        
        Returns:
            Log level (debug, info, warning, error)
        """
        # Error responses
        if status_code >= 500:
            return "error"
        elif status_code >= 400:
            return "warning"
        
        # Debug paths
        if any(request.url.path.startswith(path) for path in self.debug_paths):
            return "debug"
        
        # Default to info
        return "info"
    
    async def log_request(
        self,
        request: Request,
        response: Response,
        duration_ms: float
    ):
        """
        Log request with comprehensive details.
        
        Args:
            request: FastAPI request
            response: FastAPI response
            duration_ms: Request duration in milliseconds
        """
        # Check if should log
        if not self.should_log(request):
            return
        
        # Get log level
        log_level = self.get_log_level(request, response.status_code)
        
        # Build log data
        log_data = await self._build_log_data(request, response, duration_ms)
        
        # Log message
        message = (
            f"{request.method} {request.url.path} "
            f"[{response.status_code}] {duration_ms:.2f}ms"
        )
        
        # Log at appropriate level
        log_func = getattr(logger, log_level)
        log_func(message, extra=log_data)
        
        # Warn about slow requests
        if duration_ms > self.slow_request_threshold:
            logger.warning(
                f"Slow request detected: {message}",
                extra=log_data
            )
    
    async def _build_log_data(
        self,
        request: Request,
        response: Response,
        duration_ms: float
    ) -> Dict[str, Any]:
        """
        Build comprehensive log data.
        
        Args:
            request: FastAPI request
            response: FastAPI response
            duration_ms: Request duration
        
        Returns:
            Log data dictionary
        """
        log_data = {
            # Request info
            "method": request.method,
            "path": request.url.path,
            "full_url": str(request.url),
            "query_params": dict(request.query_params) if request.query_params else None,
            
            # Response info
            "status_code": response.status_code,
            "response_size": response.headers.get("content-length"),
            
            # Timing
            "duration_ms": round(duration_ms, 2),
            "is_slow": duration_ms > self.slow_request_threshold,
            
            # Client info
            "client_ip": get_client_ip(request),
            "user_agent": request.headers.get("user-agent"),
            
            # Request ID
            "request_id": request_id_var.get(),
        }
        
        # User info (if authenticated)
        if hasattr(request.state, "user_id"):
            log_data["user_id"] = request.state.user_id
            log_data["user_email"] = getattr(request.state, "user_email", None)
        
        # Request headers (sanitized)
        log_data["headers"] = self._sanitize_headers(dict(request.headers))
        
        # Request body (if enabled and appropriate)
        if self.log_request_body and self._should_log_body(request):
            log_data["request_body"] = await RequestBodyReader.read_body(request)
        
        # Response body (if enabled and appropriate)
        if self.log_response_body and self._should_log_response_body(response):
            if hasattr(response, "body"):
                log_data["response_body"] = ResponseBodyCapturer.capture_response_body(
                    response.body
                )
        
        return log_data
    
    def _should_log_body(self, request: Request) -> bool:
        """
        Check if should log request body.
        
        Args:
            request: FastAPI request
        
        Returns:
            True if should log body
        """
        # Only log for POST, PUT, PATCH
        if request.method not in ["POST", "PUT", "PATCH"]:
            return False
        
        # Don't log file uploads
        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" in content_type:
            return False
        
        return True
    
    def _should_log_response_body(self, response: Response) -> bool:
        """
        Check if should log response body.
        
        Args:
            response: FastAPI response
        
        Returns:
            True if should log body
        """
        # Only log for successful responses
        if response.status_code >= 400:
            return False
        
        # Only log JSON responses
        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return False
        
        return True
    
    def _sanitize_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        """
        Sanitize request headers.
        
        Args:
            headers: Request headers
        
        Returns:
            Sanitized headers
        """
        sensitive_headers = {
            "authorization", "cookie", "x-api-key", "x-auth-token",
            "x-csrf-token", "proxy-authorization"
        }
        
        sanitized = {}
        for key, value in headers.items():
            if key.lower() in sensitive_headers:
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = value
        
        return sanitized


# =============================================================================
# MIDDLEWARE
# =============================================================================

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """
    Request logging middleware.
    """
    
    def __init__(self, app: ASGIApp):
        """
        Initialize middleware.
        
        Args:
            app: ASGI application
        """
        super().__init__(app)
        self.request_logger = RequestLogger()
    
    async def dispatch(self, request: Request, call_next: Callable):
        """
        Process request with logging.
        
        Args:
            request: FastAPI request
            call_next: Next middleware/handler
        
        Returns:
            Response
        """
        # Start timing
        start_time = time.time()
        
        # Set user context if available
        if hasattr(request.state, "user_id"):
            user_id_var.set(request.state.user_id)
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Log request
        await self.request_logger.log_request(request, response, duration_ms)
        
        return response


# =============================================================================
# PERFORMANCE TRACKER
# =============================================================================

class PerformanceTracker:
    """
    Track and log performance metrics.
    """
    
    def __init__(self):
        """Initialize performance tracker."""
        self.endpoint_stats: Dict[str, Dict[str, Any]] = {}
    
    def record_request(
        self,
        endpoint: str,
        duration_ms: float,
        status_code: int
    ):
        """
        Record request performance.
        
        Args:
            endpoint: API endpoint
            duration_ms: Request duration
            status_code: Response status code
        """
        if endpoint not in self.endpoint_stats:
            self.endpoint_stats[endpoint] = {
                "count": 0,
                "total_duration": 0,
                "min_duration": float("inf"),
                "max_duration": 0,
                "error_count": 0,
            }
        
        stats = self.endpoint_stats[endpoint]
        stats["count"] += 1
        stats["total_duration"] += duration_ms
        stats["min_duration"] = min(stats["min_duration"], duration_ms)
        stats["max_duration"] = max(stats["max_duration"], duration_ms)
        
        if status_code >= 400:
            stats["error_count"] += 1
    
    def get_stats(self, endpoint: Optional[str] = None) -> Dict[str, Any]:
        """
        Get performance statistics.
        
        Args:
            endpoint: Specific endpoint or None for all
        
        Returns:
            Performance statistics
        """
        if endpoint:
            stats = self.endpoint_stats.get(endpoint, {})
            if stats:
                return {
                    "endpoint": endpoint,
                    "total_requests": stats["count"],
                    "avg_duration_ms": stats["total_duration"] / stats["count"],
                    "min_duration_ms": stats["min_duration"],
                    "max_duration_ms": stats["max_duration"],
                    "error_rate": stats["error_count"] / stats["count"],
                }
            return {}
        
        # Return all stats
        result = {}
        for endpoint, stats in self.endpoint_stats.items():
            result[endpoint] = {
                "total_requests": stats["count"],
                "avg_duration_ms": stats["total_duration"] / stats["count"],
                "min_duration_ms": stats["min_duration"],
                "max_duration_ms": stats["max_duration"],
                "error_rate": stats["error_count"] / stats["count"],
            }
        
        return result


# Global performance tracker instance
performance_tracker = PerformanceTracker()


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "RequestLoggerMiddleware",
    "RequestLogger",
    "RequestBodyReader",
    "ResponseBodyCapturer",
    "PerformanceTracker",
    "performance_tracker",
]
