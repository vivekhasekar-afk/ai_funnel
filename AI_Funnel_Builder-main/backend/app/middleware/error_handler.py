# =============================================================================
# AI FUNNEL BUILDER - ERROR HANDLER MIDDLEWARE
# =============================================================================
# Production-grade error handling with monitoring integration
# =============================================================================

import sys
import traceback
import re
from typing import Optional, Dict, Any, Callable
from datetime import datetime

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.config import settings
from app.utils.logger import get_logger, request_id_var
from app.utils.exceptions import AppException
from app.utils.helpers import get_client_ip

logger = get_logger(__name__)


# =============================================================================
# SENTRY INTEGRATION
# =============================================================================

class SentryIntegration:
    """
    Sentry error tracking integration.
    """
    
    def __init__(self):
        """Initialize Sentry if configured."""
        self.enabled = False
        self._initialize_sentry()
    
    def _initialize_sentry(self):
        """Initialize Sentry SDK."""
        if not settings.SENTRY_DSN:
            logger.info("Sentry DSN not configured, error tracking disabled")
            return
        
        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            from sentry_sdk.integrations.starlette import StarletteIntegration
            from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
            
            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                environment=settings.ENVIRONMENT,
                release=f"{settings.PROJECT_NAME}@{settings.VERSION}",
                traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
                profiles_sample_rate=settings.SENTRY_PROFILES_SAMPLE_RATE,
                integrations=[
                    FastApiIntegration(),
                    StarletteIntegration(),
                    SqlalchemyIntegration(),
                ],
                before_send=self._before_send,
                before_breadcrumb=self._before_breadcrumb,
            )
            
            self.enabled = True
            logger.info("Sentry error tracking initialized")
        
        except ImportError:
            logger.warning("sentry-sdk not installed, error tracking disabled")
        except Exception as e:
            logger.error(f"Failed to initialize Sentry: {e}")
    
    def _before_send(self, event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Filter/modify events before sending to Sentry.
        
        Args:
            event: Sentry event
            hint: Additional context
        
        Returns:
            Modified event or None to skip
        """
        # Don't send certain exceptions to Sentry
        if "exc_info" in hint:
            exc_type, exc_value, tb = hint["exc_info"]
            
            # Skip expected/handled errors
            if isinstance(exc_value, AppException):
                # Only send 5xx errors
                if exc_value.status_code < 500:
                    return None
        
        # Redact sensitive data
        event = self._redact_sensitive_data(event)
        
        return event
    
    def _before_breadcrumb(self, crumb: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Filter/modify breadcrumbs before adding to event.
        
        Args:
            crumb: Breadcrumb data
            hint: Additional context
        
        Returns:
            Modified breadcrumb or None to skip
        """
        # Redact sensitive data from breadcrumbs
        if "message" in crumb:
            crumb["message"] = self._redact_string(crumb["message"])
        
        return crumb
    
    def _redact_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Redact sensitive information from data.
        
        Args:
            data: Data to redact
        
        Returns:
            Redacted data
        """
        sensitive_keys = {
            "password", "token", "api_key", "secret", "authorization",
            "credit_card", "ssn", "access_token", "refresh_token",
        }
        
        def redact_dict(d: dict) -> dict:
            result = {}
            for key, value in d.items():
                if key.lower() in sensitive_keys:
                    result[key] = "[REDACTED]"
                elif isinstance(value, dict):
                    result[key] = redact_dict(value)
                elif isinstance(value, list):
                    result[key] = [redact_dict(item) if isinstance(item, dict) else item for item in value]
                elif isinstance(value, str):
                    result[key] = self._redact_string(value)
                else:
                    result[key] = value
            return result
        
        return redact_dict(data)
    
    def _redact_string(self, text: str) -> str:
        """
        Redact sensitive patterns from string.
        
        Args:
            text: Text to redact
        
        Returns:
            Redacted text
        """
        # Email addresses
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
        
        # Credit card numbers
        text = re.sub(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '[CREDIT_CARD]', text)
        
        # Phone numbers
        text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)
        
        # API keys (common patterns)
        text = re.sub(r'\b[A-Za-z0-9]{32,}\b', '[API_KEY]', text)
        
        return text
    
    def capture_exception(
        self,
        exception: Exception,
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Capture exception in Sentry.
        
        Args:
            exception: Exception to capture
            context: Additional context
        """
        if not self.enabled:
            return
        
        try:
            import sentry_sdk
            
            if context:
                with sentry_sdk.push_scope() as scope:
                    for key, value in context.items():
                        scope.set_context(key, value)
                    sentry_sdk.capture_exception(exception)
            else:
                sentry_sdk.capture_exception(exception)
        
        except Exception as e:
            logger.error(f"Failed to capture exception in Sentry: {e}")
    
    def capture_message(
        self,
        message: str,
        level: str = "info",
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Capture message in Sentry.
        
        Args:
            message: Message to capture
            level: Severity level
            context: Additional context
        """
        if not self.enabled:
            return
        
        try:
            import sentry_sdk
            
            if context:
                with sentry_sdk.push_scope() as scope:
                    for key, value in context.items():
                        scope.set_context(key, value)
                    sentry_sdk.capture_message(message, level)
            else:
                sentry_sdk.capture_message(message, level)
        
        except Exception as e:
            logger.error(f"Failed to capture message in Sentry: {e}")


# =============================================================================
# ERROR CATEGORIZER
# =============================================================================

class ErrorCategorizer:
    """
    Categorize errors for better handling and monitoring.
    """
    
    @staticmethod
    def categorize(exception: Exception) -> str:
        """
        Categorize exception.
        
        Args:
            exception: Exception to categorize
        
        Returns:
            Category string
        """
        exc_type = type(exception).__name__
        
        # Database errors
        if any(term in exc_type.lower() for term in ["database", "sql", "postgres", "connection"]):
            return "database_error"
        
        # Network errors
        if any(term in exc_type.lower() for term in ["timeout", "connection", "network", "http"]):
            return "network_error"
        
        # Validation errors
        if any(term in exc_type.lower() for term in ["validation", "invalid", "parse"]):
            return "validation_error"
        
        # Authentication errors
        if any(term in exc_type.lower() for term in ["auth", "permission", "forbidden", "unauthorized"]):
            return "auth_error"
        
        # Business logic errors
        if isinstance(exception, AppException):
            return "business_logic_error"
        
        # Unknown errors
        return "unknown_error"
    
    @staticmethod
    def should_retry(exception: Exception) -> bool:
        """
        Determine if error is retryable.
        
        Args:
            exception: Exception to check
        
        Returns:
            True if retryable
        """
        retryable_categories = {"network_error", "database_error"}
        category = ErrorCategorizer.categorize(exception)
        return category in retryable_categories


# =============================================================================
# ERROR CONTEXT BUILDER
# =============================================================================

class ErrorContextBuilder:
    """
    Build comprehensive error context for logging and monitoring.
    """
    
    @staticmethod
    def build_context(
        request: Request,
        exception: Exception
    ) -> Dict[str, Any]:
        """
        Build error context from request and exception.
        
        Args:
            request: FastAPI request
            exception: Exception that occurred
        
        Returns:
            Error context dictionary
        """
        context = {
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request_id_var.get(),
            "error_category": ErrorCategorizer.categorize(exception),
            "error_type": type(exception).__name__,
            "error_message": str(exception),
            "should_retry": ErrorCategorizer.should_retry(exception),
        }
        
        # Request information
        context["request"] = {
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": ErrorContextBuilder._sanitize_headers(dict(request.headers)),
            "client_ip": get_client_ip(request),
        }
        
        # User information (if authenticated)
        if hasattr(request.state, "user_id"):
            context["user"] = {
                "user_id": request.state.user_id,
                "email": getattr(request.state, "user_email", None),
            }
        
        # Stack trace (sanitized)
        if settings.ENVIRONMENT != "production":
            context["stack_trace"] = ErrorContextBuilder._get_stack_trace(exception)
        
        return context
    
    @staticmethod
    def _sanitize_headers(headers: Dict[str, str]) -> Dict[str, str]:
        """
        Sanitize request headers.
        
        Args:
            headers: Request headers
        
        Returns:
            Sanitized headers
        """
        sensitive_headers = {
            "authorization", "cookie", "x-api-key", "x-auth-token"
        }
        
        sanitized = {}
        for key, value in headers.items():
            if key.lower() in sensitive_headers:
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = value
        
        return sanitized
    
    @staticmethod
    def _get_stack_trace(exception: Exception) -> str:
        """
        Get formatted stack trace.
        
        Args:
            exception: Exception
        
        Returns:
            Formatted stack trace
        """
        return "".join(traceback.format_exception(
            type(exception),
            exception,
            exception.__traceback__
        ))


# =============================================================================
# ERROR RESPONSE BUILDER
# =============================================================================

class ErrorResponseBuilder:
    """
    Build user-friendly error responses.
    """
    
    @staticmethod
    def build_response(
        exception: Exception,
        request: Request,
        include_details: bool = False
    ) -> JSONResponse:
        """
        Build error response.
        
        Args:
            exception: Exception that occurred
            request: FastAPI request
            include_details: Include detailed error info (dev mode)
        
        Returns:
            JSON error response
        """
        # Get status code
        if isinstance(exception, AppException):
            status_code = exception.status_code
            error_code = exception.error_code
            message = exception.message
            details = exception.details
        else:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            error_code = "INTERNAL_ERROR"
            message = ErrorResponseBuilder._get_user_message(exception)
            details = {}
        
        # Build response content
        content = {
            "error": error_code,
            "message": message,
            "request_id": request_id_var.get(),
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Add details if available
        if details:
            content["details"] = details
        
        # Add retry suggestion
        if ErrorCategorizer.should_retry(exception):
            content["retry_after"] = 5  # seconds
            content["retryable"] = True
        
        # Add debug info in development
        if include_details and settings.ENVIRONMENT != "production":
            content["debug"] = {
                "exception_type": type(exception).__name__,
                "exception_message": str(exception),
                "path": request.url.path,
            }
        
        return JSONResponse(
            status_code=status_code,
            content=content,
        )
    
    @staticmethod
    def _get_user_message(exception: Exception) -> str:
        """
        Get user-friendly error message.
        
        Args:
            exception: Exception
        
        Returns:
            User-friendly message
        """
        category = ErrorCategorizer.categorize(exception)
        
        messages = {
            "database_error": "A database error occurred. Please try again later.",
            "network_error": "A network error occurred. Please check your connection and try again.",
            "validation_error": "Invalid request data. Please check your input.",
            "auth_error": "Authentication failed. Please check your credentials.",
            "business_logic_error": str(exception),
            "unknown_error": "An unexpected error occurred. Our team has been notified.",
        }
        
        return messages.get(category, messages["unknown_error"])


# =============================================================================
# MIDDLEWARE
# =============================================================================

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive error handling middleware.
    """
    
    def __init__(self, app: ASGIApp):
        """
        Initialize middleware.
        
        Args:
            app: ASGI application
        """
        super().__init__(app)
        self.sentry = SentryIntegration()
        self.include_details = settings.ENVIRONMENT != "production"
    
    async def dispatch(self, request: Request, call_next: Callable):
        """
        Process request with error handling.
        
        Args:
            request: FastAPI request
            call_next: Next middleware/handler
        
        Returns:
            Response
        """
        try:
            response = await call_next(request)
            return response
        
        except AppException as exc:
            # Expected application errors
            self._log_app_exception(exc, request)
            
            # Only send 5xx errors to Sentry
            if exc.status_code >= 500:
                context = ErrorContextBuilder.build_context(request, exc)
                self.sentry.capture_exception(exc, context)
            
            return ErrorResponseBuilder.build_response(
                exc, request, self.include_details
            )
        
        except Exception as exc:
            # Unexpected errors
            self._log_unexpected_exception(exc, request)
            
            # Send to Sentry with full context
            context = ErrorContextBuilder.build_context(request, exc)
            self.sentry.capture_exception(exc, context)
            
            return ErrorResponseBuilder.build_response(
                exc, request, self.include_details
            )
    
    def _log_app_exception(self, exception: AppException, request: Request):
        """
        Log application exception.
        
        Args:
            exception: Application exception
            request: FastAPI request
        """
        log_method = logger.error if exception.status_code >= 500 else logger.warning
        
        log_method(
            f"{exception.error_code}: {exception.message}",
            extra={
                "error_code": exception.error_code,
                "status_code": exception.status_code,
                "path": request.url.path,
                "method": request.method,
                "request_id": request_id_var.get(),
                "user_id": getattr(request.state, "user_id", None),
            }
        )
    
    def _log_unexpected_exception(self, exception: Exception, request: Request):
        """
        Log unexpected exception.
        
        Args:
            exception: Unexpected exception
            request: FastAPI request
        """
        logger.error(
            f"Unexpected error: {type(exception).__name__}: {str(exception)}",
            exc_info=True,
            extra={
                "error_type": type(exception).__name__,
                "path": request.url.path,
                "method": request.method,
                "request_id": request_id_var.get(),
                "user_id": getattr(request.state, "user_id", None),
                "category": ErrorCategorizer.categorize(exception),
            }
        )


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "ErrorHandlerMiddleware",
    "SentryIntegration",
    "ErrorCategorizer",
    "ErrorContextBuilder",
    "ErrorResponseBuilder",
]
