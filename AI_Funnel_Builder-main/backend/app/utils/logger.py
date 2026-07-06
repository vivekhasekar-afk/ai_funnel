# =============================================================================
# AI FUNNEL BUILDER - LOGGER
# =============================================================================
# Logging configuration and utilities
# =============================================================================

import logging
import sys
import json
import time
from typing import Optional, Dict, Any
from datetime import datetime
from functools import wraps
from contextvars import ContextVar

from pythonjsonlogger import jsonlogger


# =============================================================================
# CONTEXT VARIABLES
# =============================================================================

# Request context for correlation IDs
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)


# =============================================================================
# CUSTOM JSON FORMATTER
# =============================================================================

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """
    Custom JSON formatter with additional context.
    """

    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]):
        """Add custom fields to log record."""
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp
        log_record["timestamp"] = datetime.utcnow().isoformat()
        
        # Add log level
        log_record["level"] = record.levelname
        
        # Add logger name
        log_record["logger"] = record.name
        
        # Add request context if available
        request_id = request_id_var.get()
        if request_id:
            log_record["request_id"] = request_id
        
        user_id = user_id_var.get()
        if user_id:
            log_record["user_id"] = user_id
        
        # Add exception info if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)


# =============================================================================
# SETUP LOGGING
# =============================================================================

def setup_logging(
    level: str = "INFO",
    json_logs: bool = False,
    log_file: Optional[str] = None,
) -> None:
    """
    Setup application logging.
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: Use JSON formatting (recommended for production)
        log_file: Optional log file path
    """
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))
    
    # Remove existing handlers
    root_logger.handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level.upper()))
    
    # Set formatter
    if json_logs:
        # JSON formatter for production
        formatter = CustomJsonFormatter(
            "%(timestamp)s %(level)s %(name)s %(message)s"
        )
    else:
        # Human-readable formatter for development
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (optional)
    if log_file:
        from logging.handlers import RotatingFileHandler
        
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5,
        )
        file_handler.setLevel(getattr(logging, level.upper()))
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # Silence noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


# =============================================================================
# GET LOGGER
# =============================================================================

def get_logger(name: str) -> logging.Logger:
    """
    Get logger instance.
    
    Args:
        name: Logger name (typically __name__)
    
    Returns:
        Logger instance
    
    Examples:
        >>> logger = get_logger(__name__)
        >>> logger.info("Application started")
    """
    return logging.getLogger(name)


# =============================================================================
# STRUCTURED LOGGING HELPERS
# =============================================================================

class StructuredLogger:
    """
    Structured logger with additional context.
    """

    def __init__(self, name: str):
        """
        Initialize structured logger.
        
        Args:
            name: Logger name
        """
        self.logger = logging.getLogger(name)

    def _log(
        self,
        level: str,
        message: str,
        extra: Optional[Dict[str, Any]] = None,
        exc_info: bool = False,
    ):
        """
        Log message with structured data.
        
        Args:
            level: Log level
            message: Log message
            extra: Additional context
            exc_info: Include exception info
        """
        log_func = getattr(self.logger, level.lower())
        
        if extra:
            # Format message with extra context
            context_str = " | ".join([f"{k}={v}" for k, v in extra.items()])
            full_message = f"{message} | {context_str}"
        else:
            full_message = message
        
        log_func(full_message, exc_info=exc_info, extra=extra or {})

    def debug(self, message: str, **kwargs):
        """Log debug message."""
        self._log("debug", message, kwargs)

    def info(self, message: str, **kwargs):
        """Log info message."""
        self._log("info", message, kwargs)

    def warning(self, message: str, **kwargs):
        """Log warning message."""
        self._log("warning", message, kwargs)

    def error(self, message: str, exc_info: bool = False, **kwargs):
        """Log error message."""
        self._log("error", message, kwargs, exc_info=exc_info)

    def critical(self, message: str, exc_info: bool = False, **kwargs):
        """Log critical message."""
        self._log("critical", message, kwargs, exc_info=exc_info)


# =============================================================================
# PERFORMANCE LOGGING
# =============================================================================

def log_performance(func_name: Optional[str] = None):
    """
    Decorator to log function execution time.
    
    Args:
        func_name: Custom function name for logging
    
    Examples:
        >>> @log_performance()
        ... def slow_function():
        ...     time.sleep(1)
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            name = func_name or func.__name__
            logger = get_logger(func.__module__)
            
            start_time = time.time()
            logger.debug(f"Starting {name}")
            
            try:
                result = await func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                logger.info(
                    f"Completed {name}",
                    extra={
                        "function": name,
                        "duration_ms": round(duration_ms, 2),
                        "status": "success",
                    }
                )
                
                return result
            
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                
                logger.error(
                    f"Failed {name}: {str(e)}",
                    exc_info=True,
                    extra={
                        "function": name,
                        "duration_ms": round(duration_ms, 2),
                        "status": "error",
                        "error": str(e),
                    }
                )
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            name = func_name or func.__name__
            logger = get_logger(func.__module__)
            
            start_time = time.time()
            logger.debug(f"Starting {name}")
            
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                logger.info(
                    f"Completed {name}",
                    extra={
                        "function": name,
                        "duration_ms": round(duration_ms, 2),
                        "status": "success",
                    }
                )
                
                return result
            
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                
                logger.error(
                    f"Failed {name}: {str(e)}",
                    exc_info=True,
                    extra={
                        "function": name,
                        "duration_ms": round(duration_ms, 2),
                        "status": "error",
                        "error": str(e),
                    }
                )
                raise
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# =============================================================================
# API CALL LOGGING
# =============================================================================

def log_api_call(
    method: str,
    endpoint: str,
    status_code: int,
    duration_ms: float,
    user_id: Optional[str] = None,
    request_id: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
):
    """
    Log API call with structured data.
    
    Args:
        method: HTTP method
        endpoint: API endpoint
        status_code: Response status code
        duration_ms: Request duration in milliseconds
        user_id: User ID (if authenticated)
        request_id: Request correlation ID
        extra: Additional context
    """
    logger = get_logger("api")
    
    log_data = {
        "method": method,
        "endpoint": endpoint,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
    }
    
    if user_id:
        log_data["user_id"] = user_id
    
    if request_id:
        log_data["request_id"] = request_id
    
    if extra:
        log_data.update(extra)
    
    # Determine log level based on status code
    if status_code >= 500:
        logger.error(f"API call failed: {method} {endpoint}", extra=log_data)
    elif status_code >= 400:
        logger.warning(f"API client error: {method} {endpoint}", extra=log_data)
    else:
        logger.info(f"API call: {method} {endpoint}", extra=log_data)


# =============================================================================
# DATABASE LOGGING
# =============================================================================

def log_database_query(
    query_type: str,
    table: str,
    duration_ms: float,
    rows_affected: Optional[int] = None,
):
    """
    Log database query.
    
    Args:
        query_type: Query type (SELECT, INSERT, UPDATE, DELETE)
        table: Table name
        duration_ms: Query duration in milliseconds
        rows_affected: Number of rows affected
    """
    logger = get_logger("database")
    
    log_data = {
        "query_type": query_type,
        "table": table,
        "duration_ms": round(duration_ms, 2),
    }
    
    if rows_affected is not None:
        log_data["rows_affected"] = rows_affected
    
    if duration_ms > 1000:  # Slow query threshold
        logger.warning(f"Slow query: {query_type} {table}", extra=log_data)
    else:
        logger.debug(f"Query: {query_type} {table}", extra=log_data)


# =============================================================================
# INTEGRATION LOGGING
# =============================================================================

def log_integration_call(
    provider: str,
    operation: str,
    status: str,
    duration_ms: float,
    error: Optional[str] = None,
):
    """
    Log third-party integration call.
    
    Args:
        provider: Integration provider (Stripe, Salesforce, etc.)
        operation: Operation name
        status: Status (success, error, timeout)
        duration_ms: Call duration in milliseconds
        error: Error message (if failed)
    """
    logger = get_logger("integration")
    
    log_data = {
        "provider": provider,
        "operation": operation,
        "status": status,
        "duration_ms": round(duration_ms, 2),
    }
    
    if error:
        log_data["error"] = error
    
    if status == "error":
        logger.error(f"Integration call failed: {provider}.{operation}", extra=log_data)
    elif status == "timeout":
        logger.warning(f"Integration call timeout: {provider}.{operation}", extra=log_data)
    else:
        logger.info(f"Integration call: {provider}.{operation}", extra=log_data)


# =============================================================================
# AI LOGGING
# =============================================================================

def log_ai_generation(
    model: str,
    operation: str,
    tokens_used: int,
    duration_ms: float,
    status: str = "success",
    error: Optional[str] = None,
):
    """
    Log AI generation call.
    
    Args:
        model: AI model (gpt-4, gpt-3.5-turbo, etc.)
        operation: Operation type (funnel_generation, optimization, etc.)
        tokens_used: Number of tokens used
        duration_ms: Generation duration
        status: Status (success, error)
        error: Error message (if failed)
    """
    logger = get_logger("ai")
    
    log_data = {
        "model": model,
        "operation": operation,
        "tokens_used": tokens_used,
        "duration_ms": round(duration_ms, 2),
        "status": status,
    }
    
    if error:
        log_data["error"] = error
    
    if status == "error":
        logger.error(f"AI generation failed: {operation}", extra=log_data)
    else:
        logger.info(f"AI generation: {operation}", extra=log_data)


# =============================================================================
# SECURITY LOGGING
# =============================================================================

def log_security_event(
    event_type: str,
    severity: str,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
):
    """
    Log security event.
    
    Args:
        event_type: Event type (login_failed, suspicious_activity, etc.)
        severity: Severity (low, medium, high, critical)
        user_id: User ID (if applicable)
        ip_address: Client IP address
        details: Additional details
    """
    logger = get_logger("security")
    
    log_data = {
        "event_type": event_type,
        "severity": severity,
    }
    
    if user_id:
        log_data["user_id"] = user_id
    
    if ip_address:
        log_data["ip_address"] = ip_address
    
    if details:
        log_data["details"] = details
    
    # Log at appropriate level based on severity
    if severity in ["critical", "high"]:
        logger.error(f"Security event: {event_type}", extra=log_data)
    elif severity == "medium":
        logger.warning(f"Security event: {event_type}", extra=log_data)
    else:
        logger.info(f"Security event: {event_type}", extra=log_data)


# =============================================================================
# CONTEXT MANAGERS
# =============================================================================

class LogContext:
    """
    Context manager for setting request context.
    """

    def __init__(self, request_id: Optional[str] = None, user_id: Optional[str] = None):
        """
        Initialize log context.
        
        Args:
            request_id: Request correlation ID
            user_id: User ID
        """
        self.request_id = request_id
        self.user_id = user_id
        self.request_id_token = None
        self.user_id_token = None

    def __enter__(self):
        """Set context variables."""
        if self.request_id:
            self.request_id_token = request_id_var.set(self.request_id)
        if self.user_id:
            self.user_id_token = user_id_var.set(self.user_id)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Reset context variables."""
        if self.request_id_token:
            request_id_var.reset(self.request_id_token)
        if self.user_id_token:
            user_id_var.reset(self.user_id_token)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Setup
    "setup_logging",
    "get_logger",
    
    # Structured logging
    "StructuredLogger",
    
    # Decorators
    "log_performance",
    
    # Specialized logging
    "log_api_call",
    "log_database_query",
    "log_integration_call",
    "log_ai_generation",
    "log_security_event",
    
    # Context
    "LogContext",
    "request_id_var",
    "user_id_var",
]
