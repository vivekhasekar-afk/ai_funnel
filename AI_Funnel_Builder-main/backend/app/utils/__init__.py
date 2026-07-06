# =============================================================================
# AI FUNNEL BUILDER - UTILS MODULE
# =============================================================================
# Utility functions and helpers
# =============================================================================

"""
Utils module providing common utilities:
- Exception handling
- Validation helpers
- Formatting utilities
- Logger configuration
- Helper functions
"""

from app.utils.exceptions import (
    # Base exceptions
    AppException,
    ValidationException,
    NotFoundException,
    ForbiddenException,
    UnauthorizedException,
    ConflictException,
    RateLimitException,
    
    # Domain-specific exceptions
    FunnelNotFoundException,
    QuestionNotFoundException,
    LeadNotFoundException,
    TemplateNotFoundException,
    IntegrationException,
    PaymentException,
    QuotaExceededException,
)

from app.utils.validators import (
    validate_email,
    validate_url,
    validate_slug,
    validate_color_hex,
    validate_phone,
    sanitize_html,
    validate_json_schema,
)

from app.utils.formatters import (
    format_currency,
    format_percentage,
    format_number,
    truncate_text,
    slugify,
    format_phone_number,
    format_date,
    format_datetime,
)

from app.utils.helpers import (
    generate_unique_id,
    generate_short_id,
    generate_api_key,
    hash_api_key,
    verify_api_key,
    parse_user_agent,
    get_client_ip,
    calculate_completion_rate,
    calculate_percentage_change,
)

from app.utils.logger import (
    get_logger,
    setup_logging,
    log_performance,
    log_api_call,
)

__all__ = [
    # Exceptions
    "AppException",
    "ValidationException",
    "NotFoundException",
    "ForbiddenException",
    "UnauthorizedException",
    "ConflictException",
    "RateLimitException",
    "FunnelNotFoundException",
    "QuestionNotFoundException",
    "LeadNotFoundException",
    "TemplateNotFoundException",
    "IntegrationException",
    "PaymentException",
    "QuotaExceededException",
    
    # Validators
    "validate_email",
    "validate_url",
    "validate_slug",
    "validate_color_hex",
    "validate_phone",
    "sanitize_html",
    "validate_json_schema",
    
    # Formatters
    "format_currency",
    "format_percentage",
    "format_number",
    "truncate_text",
    "slugify",
    "format_phone_number",
    "format_date",
    "format_datetime",
    
    # Helpers
    "generate_unique_id",
    "generate_short_id",
    "generate_api_key",
    "hash_api_key",
    "verify_api_key",
    "parse_user_agent",
    "get_client_ip",
    "calculate_completion_rate",
    "calculate_percentage_change",
    
    # Logger
    "get_logger",
    "setup_logging",
    "log_performance",
    "log_api_call",
]
