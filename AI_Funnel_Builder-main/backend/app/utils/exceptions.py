# =============================================================================
# AI FUNNEL BUILDER - EXCEPTIONS
# =============================================================================
# Custom exception classes for error handling
# =============================================================================

from typing import List, Optional, Dict, Any
from fastapi import status


# =============================================================================
# BASE EXCEPTION
# =============================================================================

class AppException(Exception):
    """
    Base application exception.
    
    All custom exceptions should inherit from this class.
    """

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        """
        Initialize application exception.
        
        Args:
            message: Human-readable error message
            status_code: HTTP status code
            error_code: Application-specific error code
            details: Additional error details/context
        """
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response."""
        response = {
            "error": self.error_code,
            "message": self.message,
        }
        
        if self.details:
            response["details"] = self.details
        
        return response

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(message={self.message}, status_code={self.status_code})"


# =============================================================================
# HTTP EXCEPTIONS
# =============================================================================

class ValidationException(AppException):
    """Validation error (400 Bad Request)."""

    def __init__(
        self,
        message: str = "Validation error",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        """
        Initialize validation exception.
        
        Args:
            message: Error message
            field: Field that failed validation
            details: Validation error details
        """
        if field:
            if not details:
                details = {}
            details["field"] = field
        
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VALIDATION_ERROR",
            details=details,
        )

class AggregationException(AppException):
    """Data aggregation/analytics calculation error."""
    def __init__(
        self,
        message: str = "Aggregation failed",
        aggregation_type: Optional[str] = None,
        dataset: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if aggregation_type:
            details["aggregation_type"] = aggregation_type
        if dataset:
            details["dataset"] = dataset
        
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="AGGREGATION_ERROR",
            metadata=details,
        )

class UnauthorizedException(AppException):
    """Authentication required (401 Unauthorized)."""

    def __init__(
        self,
        message: str = "Authentication required",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
            details=details,
        )


class ForbiddenException(AppException):
    """Insufficient permissions (403 Forbidden)."""

    def __init__(
        self,
        message: str = "You don't have permission to perform this action",
        resource: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if resource:
            if not details:
                details = {}
            details["resource"] = resource
        
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
            details=details,
        )


class NotFoundException(AppException):
    """Resource not found (404 Not Found)."""

    def __init__(
        self,
        message: str = "Resource not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        
        if resource_type:
            details["resource_type"] = resource_type
        if resource_id:
            details["resource_id"] = resource_id
        
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            details=details,
        )


class ConflictException(AppException):
    """Resource conflict (409 Conflict)."""

    def __init__(
        self,
        message: str = "Resource conflict",
        conflicting_field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if conflicting_field:
            if not details:
                details = {}
            details["conflicting_field"] = conflicting_field
        
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code="CONFLICT",
            details=details,
        )


class RateLimitException(AppException):
    """Rate limit exceeded (429 Too Many Requests)."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        limit: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        
        if retry_after:
            details["retry_after"] = retry_after
        if limit:
            details["limit"] = limit
        
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details,
        )


class UnprocessableEntityException(AppException):
    """Unprocessable entity (422)."""

    def __init__(
        self,
        message: str = "Unable to process request",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="UNPROCESSABLE_ENTITY",
            details=details,
        )

# =============================================================================
# QUOTA & RATE LIMIT EXCEPTIONS
# =============================================================================

class QuotaExceededException(AppException):
    """Usage quota exceeded."""
    def __init__(self, quota_type: str, limit: int, used: int):
        detail = f"{quota_type} quota exceeded. Limit: {limit}, Used: {used}"
        metadata = {"quota_type": quota_type, "limit": limit, "used": used}
        super().__init__(status.HTTP_429_TOO_MANY_REQUESTS, detail, "QUOTA_EXCEEDED", metadata)

class RateLimitExceededException(AppException):
    """Rate limit exceeded."""
    def __init__(self, service: str, retry_after: Optional[int] = None):
        detail = f"Rate limit exceeded for {service}"
        metadata = {"retry_after": retry_after}
        super().__init__(status.HTTP_429_TOO_MANY_REQUESTS, detail, "RATE_LIMIT", metadata)

# =============================================================================
# DOMAIN-SPECIFIC EXCEPTIONS
# =============================================================================

class FunnelNotFoundException(NotFoundException):
    """Funnel not found."""

    def __init__(self, funnel_id: str):
        super().__init__(
            message=f"Funnel not found",
            resource_type="funnel",
            resource_id=funnel_id,
        )


class QuestionNotFoundException(NotFoundException):
    """Question not found."""

    def __init__(self, question_id: str):
        super().__init__(
            message=f"Question not found",
            resource_type="question",
            resource_id=question_id,
        )


class ResponseNotFoundException(NotFoundException):
    """Response not found."""

    def __init__(self, response_id: str):
        super().__init__(
            message=f"Response not found",
            resource_type="response",
            resource_id=response_id,
        )


class LeadNotFoundException(NotFoundException):
    """Lead not found."""

    def __init__(self, lead_id: str):
        super().__init__(
            message=f"Lead not found",
            resource_type="lead",
            resource_id=lead_id,
        )


class TemplateNotFoundException(NotFoundException):
    """Template not found."""

    def __init__(self, template_id: str):
        super().__init__(
            message=f"Template not found",
            resource_type="template",
            resource_id=template_id,
        )


class CampaignNotFoundException(NotFoundException):
    """Campaign not found."""

    def __init__(self, campaign_id: str):
        super().__init__(
            message=f"Campaign not found",
            resource_type="campaign",
            resource_id=campaign_id,
        )


class UserNotFoundException(NotFoundException):
    """User not found."""

    def __init__(self, user_id: Optional[str] = None):
        super().__init__(
            message=f"User not found",
            resource_type="user",
            resource_id=user_id,
        )

class IntegrationNotFoundException(NotFoundException):
    """Integration Not Found."""

    def __init__(self, integration_id: Optional[str] = None):
        super().__init__(
            message=f"Integration Not Found",
            resource_type="Integration",
            resource_id=integration_id,
        )
# AI Generation Exceptions
class AIGenerationException(AppException):
    """AI generation service errors."""
    def __init__(self, model: str, error: str):
        detail = f"AI generation failed ({model}): {error}"
        super().__init__(status.HTTP_503_SERVICE_UNAVAILABLE, detail, "AI_GENERATION_ERROR")

class AIQuotaExceededException(QuotaExceededException):
    """AI generation quota exceeded."""
    def __init__(self, limit: int, used: int):
        super().__init__("AI generation", limit, used)

# Email Exceptions
class EmailException(AppException):
    """Email delivery/service errors."""
    def __init__(self, provider: str, error: str):
        detail = f"Email delivery failed ({provider}): {error}"
        super().__init__(status.HTTP_503_SERVICE_UNAVAILABLE, detail, "EMAIL_ERROR")
class SubscriptionNotFoundException(NotFoundException):
    """Subscription not found."""
    def __init__(self, subscription_id: str):
        super().__init__("Subscription", subscription_id)

class EmailTemplateNotFoundException(NotFoundException):
    """Email template not found."""
    def __init__(self, template_id: str):
        super().__init__("Email template", template_id)

class EmailRateLimitException(RateLimitExceededException):
    """Email sending rate limit."""
    def __init__(self):
        super().__init__("email service")


# =============================================================================
# BUSINESS LOGIC EXCEPTIONS
# =============================================================================

class QuotaExceededException(AppException):
    """Usage quota exceeded."""

    def __init__(
        self,
        message: str = "Usage quota exceeded",
        quota_type: Optional[str] = None,
        current_usage: Optional[int] = None,
        limit: Optional[int] = None,
    ):
        details = {}
        if quota_type:
            details["quota_type"] = quota_type
        if current_usage is not None:
            details["current_usage"] = current_usage
        if limit is not None:
            details["limit"] = limit
        
        super().__init__(
            message=message,
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            error_code="QUOTA_EXCEEDED",
            details=details,
        )


class SubscriptionRequiredException(AppException):
    """Paid subscription required."""

    def __init__(
        self,
        message: str = "This feature requires a paid subscription",
        required_tier: Optional[str] = None,
        feature: Optional[str] = None,
    ):
        details = {}
        if required_tier:
            details["required_tier"] = required_tier
        if feature:
            details["feature"] = feature
        
        super().__init__(
            message=message,
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            error_code="SUBSCRIPTION_REQUIRED",
            details=details,
        )


class FunnelLimitExceededException(QuotaExceededException):
    """Funnel creation limit exceeded."""

    def __init__(self, current: int, limit: int):
        super().__init__(
            message=f"Funnel limit exceeded ({current}/{limit}). Upgrade to create more funnels.",
            quota_type="funnels",
            current_usage=current,
            limit=limit,
        )


class LeadLimitExceededException(QuotaExceededException):
    """Lead capture limit exceeded."""

    def __init__(self, current: int, limit: int):
        super().__init__(
            message=f"Monthly lead limit exceeded ({current}/{limit}). Upgrade for more leads.",
            quota_type="leads",
            current_usage=current,
            limit=limit,
        )


class DuplicateEmailException(ConflictException):
    """Email already exists."""

    def __init__(self, email: str):
        super().__init__(
            message=f"Email address already registered",
            conflicting_field="email",
            details={"email": email},
        )


class DuplicateSlugException(ConflictException):
    """Slug already exists."""

    def __init__(self, slug: str, resource_type: str = "resource"):
        super().__init__(
            message=f"{resource_type.capitalize()} with this URL already exists",
            conflicting_field="slug",
            details={"slug": slug, "resource_type": resource_type},
        )


class InvalidCredentialsException(UnauthorizedException):
    """Invalid login credentials."""

    def __init__(self):
        super().__init__(
            message="Invalid email or password",
            details={"error_code": "INVALID_CREDENTIALS"},
        )


class TokenExpiredException(UnauthorizedException):
    """Authentication token expired."""

    def __init__(self):
        super().__init__(
            message="Authentication token has expired",
            details={"error_code": "TOKEN_EXPIRED"},
        )


class InvalidTokenException(UnauthorizedException):
    """Invalid authentication token."""

    def __init__(self):
        super().__init__(
            message="Invalid authentication token",
            details={"error_code": "INVALID_TOKEN"},
        )


# =============================================================================
# INTEGRATION EXCEPTIONS
# =============================================================================

class IntegrationException(AppException):
    """Integration-related error."""

    def __init__(
        self,
        message: str,
        provider: Optional[str] = None,
        integration_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        
        if provider:
            details["provider"] = provider
        if integration_id:
            details["integration_id"] = integration_id
        
        super().__init__(
            message=message,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="INTEGRATION_ERROR",
            details=details,
        )


class IntegrationConnectionException(IntegrationException):
    """Failed to connect to integration."""

    def __init__(self, provider: str, error: Optional[str] = None):
        details = {"provider": provider}
        if error:
            details["error"] = error
        
        super().__init__(
            message=f"Failed to connect to {provider}",
            details=details,
        )


class IntegrationAuthException(IntegrationException):
    """Integration authentication failed."""

    def __init__(self, provider: str):
        super().__init__(
            message=f"Authentication failed for {provider}. Please reconnect your integration.",
            provider=provider,
        )


class IntegrationRateLimitException(IntegrationException):
    """Integration API rate limit exceeded."""

    def __init__(self, provider: str, retry_after: Optional[int] = None):
        details = {"provider": provider}
        if retry_after:
            details["retry_after"] = retry_after
        
        super().__init__(
            message=f"{provider} API rate limit exceeded",
            details=details,
        )


# =============================================================================
# PAYMENT EXCEPTIONS
# =============================================================================

class PaymentException(AppException):
    """Payment-related error."""

    def __init__(
        self,
        message: str = "Payment processing failed",
        payment_error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        
        if payment_error_code:
            details["payment_error_code"] = payment_error_code
        
        super().__init__(
            message=message,
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            error_code="PAYMENT_ERROR",
            details=details,
        )


class PaymentMethodRequiredException(PaymentException):
    """Payment method required."""

    def __init__(self):
        super().__init__(
            message="Please add a payment method to continue",
            payment_error_code="PAYMENT_METHOD_REQUIRED",
        )


class CardDeclinedException(PaymentException):
    """Card declined."""

    def __init__(self, decline_code: Optional[str] = None):
        details = {}
        if decline_code:
            details["decline_code"] = decline_code
        
        super().__init__(
            message="Your card was declined. Please try a different payment method.",
            payment_error_code="CARD_DECLINED",
            details=details,
        )


class InsufficientFundsException(PaymentException):
    """Insufficient funds."""

    def __init__(self):
        super().__init__(
            message="Insufficient funds. Please try a different payment method.",
            payment_error_code="INSUFFICIENT_FUNDS",
        )


# =============================================================================
# AI EXCEPTIONS
# =============================================================================

class AIException(AppException):
    """AI service error."""

    def __init__(
        self,
        message: str = "AI service error",
        service: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        
        if service:
            details["service"] = service
        
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="AI_ERROR",
            details=details,
        )


class AIQuotaExceededException(AIException):
    """AI API quota exceeded."""

    def __init__(self, service: str = "OpenAI"):
        super().__init__(
            message=f"{service} API quota exceeded. Please try again later.",
            service=service,
        )


class AIGenerationFailedException(AIException):
    """AI content generation failed."""

    def __init__(self, reason: Optional[str] = None):
        details = {}
        if reason:
            details["reason"] = reason
        
        super().__init__(
            message="Failed to generate content. Please try again.",
            details=details,
        )


# =============================================================================
# FILE EXCEPTIONS
# =============================================================================

class FileException(AppException):
    """File-related error."""

    def __init__(
        self,
        message: str,
        filename: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        
        if filename:
            details["filename"] = filename
        
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="FILE_ERROR",
            details=details,
        )


class FileTooLargeException(FileException):
    """File size exceeds limit."""

    def __init__(self, size_mb: float, max_mb: float):
        super().__init__(
            message=f"File too large ({size_mb:.1f}MB). Maximum size is {max_mb}MB.",
            details={"size_mb": size_mb, "max_mb": max_mb},
        )


class InvalidFileTypeException(FileException):
    """Invalid file type."""

    def __init__(self, file_type: str, allowed_types: list):
        super().__init__(
            message=f"Invalid file type '{file_type}'. Allowed types: {', '.join(allowed_types)}",
            details={"file_type": file_type, "allowed_types": allowed_types},
        )

# =============================================================================
# AI/ML EXCEPTIONS (503/429)
# =============================================================================

class TestGenerationError(AppException):
    """AI test generation failed."""
    def __init__(
        self,
        message: str = "Test generation failed",
        model: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if model:
            details["model"] = model
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="TEST_GENERATION_ERROR",
            metadata=details,
        )

class AdGenerationError(AppException):
    """AI ad generation failed."""
    def __init__(
        self,
        message: str = "Ad generation failed",
        model: Optional[str] = None,
        ad_type: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if model:
            details["model"] = model
        if ad_type:
            details["ad_type"] = ad_type
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="AD_GENERATION_ERROR",
            metadata=details,
        )

class AnalysisError(AppException):
    """AI analysis service error."""
    def __init__(
        self,
        message: str = "Analysis failed",
        analysis_type: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if analysis_type:
            details["analysis_type"] = analysis_type
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="ANALYSIS_ERROR",
            metadata=details,
        )

class PredictionError(AppException):
    """AI prediction model error."""
    def __init__(
        self,
        message: str = "Prediction failed",
        model_version: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if model_version:
            details["model_version"] = model_version
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="PREDICTION_ERROR",
            metadata=details,
        )

class ScoringError(AppException):
    """Lead/funnel scoring error."""
    def __init__(
        self,
        message: str = "Scoring failed",
        scoring_model: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if scoring_model:
            details["scoring_model"] = scoring_model
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="SCORING_ERROR",
            metadata=details,
        )

class PersonalizationError(AppException):
    """Personalization engine error."""
    def __init__(
        self,
        message: str = "Personalization failed",
        personalization_type: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if personalization_type:
            details["personalization_type"] = personalization_type
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="PERSONALIZATION_ERROR",
            metadata=details,
        )

class RecommendationError(AppException):
    """Recommendation engine error."""
    def __init__(
        self,
        message: str = "Recommendation generation failed",
        recommendation_type: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if recommendation_type:
            details["recommendation_type"] = recommendation_type
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="RECOMMENDATION_ERROR",
            metadata=details,
        )

# =============================================================================
# FUNNEL GENERATION EXCEPTIONS (422/503)
# =============================================================================

class FunnelGenerationError(AppException):
    """AI funnel generation failed."""
    def __init__(
        self,
        message: str = "Funnel generation failed",
        generation_step: Optional[str] = None,
        model: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if generation_step:
            details["generation_step"] = generation_step
        if model:
            details["model"] = model
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="FUNNEL_GENERATION_ERROR",
            metadata=details,
        )

class AIServiceError(AppException):
    """Generic AI service communication error."""
    def __init__(
        self,
        message: str = "AI service unavailable",
        service: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if service:
            details["service"] = service
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="AI_SERVICE_ERROR",
            metadata=details,
        )

# =============================================================================
# VALIDATION & FORMAT EXCEPTIONS (422)
# =============================================================================

class FormatSelectionError(ValidationException):
    """Invalid format selection."""
    def __init__(
        self,
        message: str = "Invalid format selected",
        format_type: Optional[str] = None,
        supported_formats: Optional[List[str]] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if format_type:
            details["format_type"] = format_type
        if supported_formats:
            details["supported_formats"] = supported_formats
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="FORMAT_SELECTION_ERROR",
            metadata=details,
        )

class OptimizationError(AppException):
    """Optimization algorithm error."""
    def __init__(
        self,
        message: str = "Optimization failed",
        optimization_type: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if optimization_type:
            details["optimization_type"] = optimization_type
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="OPTIMIZATION_ERROR",
            metadata=details,
        )

class InsufficientCreditsException(AppException):
    """Exception raised when user lacks sufficient credits."""
    def __init__(
        self,
        message: str = "Insufficient credits to perform this action",
        current_credits: Optional[int] = None,
        required_credits: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if details is None:
            details = {}
        if current_credits is not None:
            details["current_credits"] = current_credits
        if required_credits is not None:
            details["required_credits"] = required_credits

        super().__init__(
            message=message,
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            error_code="INSUFFICIENT_CREDITS",
            metadata=details,
        )
class BatchInsertError(AppException):
    """Batch database insert operation failed."""
    def __init__(
        self,
        message: str = "Batch insert failed",
        batch_size: Optional[int] = None,
        failed_count: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if batch_size:
            details["batch_size"] = batch_size
        if failed_count:
            details["failed_count"] = failed_count
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="BATCH_INSERT_ERROR",
            metadata=details,
        )

class ResponseCollectionError(AppException):
    """Response data collection/processing error."""
    def __init__(
        self,
        message: str = "Response collection failed",
        response_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if not details:
            details = {}
        if response_id:
            details["response_id"] = response_id
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="RESPONSE_COLLECTION_ERROR",
            metadata=details,
        )

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Base
    "AppException",
    
    # HTTP
    "ValidationException",
    "UnauthorizedException",
    "ForbiddenException",
    "NotFoundException",
    "ConflictException",
    "RateLimitException",
    "UnprocessableEntityException",
    
    # Domain-specific
    "FunnelNotFoundException",
    "QuestionNotFoundException",
    "ResponseNotFoundException",
    "LeadNotFoundException",
    "TemplateNotFoundException",
    "CampaignNotFoundException",
    "UserNotFoundException",
    
    # Business logic
    "QuotaExceededException",
    "SubscriptionRequiredException",
    "FunnelLimitExceededException",
    "LeadLimitExceededException",
    "DuplicateEmailException",
    "DuplicateSlugException",
    "InvalidCredentialsException",
    "TokenExpiredException",
    "InvalidTokenException",
    
    # Integration
    "IntegrationException",
    "IntegrationConnectionException",
    "IntegrationAuthException",
    "IntegrationRateLimitException",
    
    # Payment
    "PaymentException",
    "PaymentMethodRequiredException",
    "CardDeclinedException",
    "InsufficientFundsException",
    
    # AI
    "AIException",
    "AIQuotaExceededException",
    "AIGenerationFailedException",
    "InsufficientCreditsException",
    # File
    "FileException",
    "FileTooLargeException",
    "InvalidFileTypeException",

    "AIGenerationException",
    "AIQuotaExceededException",
    "EmailException",
    "EmailTemplateNotFoundException",
    "EmailRateLimitException",
    "SubscriptionNotFoundException",

    "QuotaExceededException",
    "RateLimitExceededException",

    # AI/ML Exceptions
    "TestGenerationError",
    "AdGenerationError", 
    "AnalysisError",
    "PredictionError",
    "ScoringError",
    "PersonalizationError",
    "RecommendationError",
    
    # Funnel Generation
    "FunnelGenerationError",
    "AIServiceError",
    
    # Validation/Format
    "FormatSelectionError",
    "OptimizationError",

    "BatchInsertError",
    "ResponseCollectionError",
    "AggregationException",
]
