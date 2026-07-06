# =============================================================================
# AI FUNNEL BUILDER - PYDANTIC SCHEMAS
# =============================================================================
# Central registry for all Pydantic schemas (request/response validation)
# =============================================================================

from typing import Generic, TypeVar, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

# =============================================================================
# BASE SCHEMA CLASSES
# =============================================================================

class BaseSchema(BaseModel):
    """
    Base Pydantic schema with common configuration.
    
    Features:
    - from_attributes mode (formerly orm_mode) for SQLAlchemy models
    - Arbitrary types allowed
    - JSON schema extra configuration
    """
    
    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True,
        use_enum_values=True,
        validate_assignment=True,
        str_strip_whitespace=True)


class TimestampSchema(BaseModel):
    """Mixin for timestamp fields."""
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    model_config = ConfigDict(from_attributes=True)


class IDSchema(BaseModel):
    """Mixin for ID fields."""
    id: str = Field(..., description="Unique identifier (UUID)")
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# PAGINATION SCHEMAS
# =============================================================================

DataT = TypeVar("DataT")


class PaginationParams(BaseModel):
    """Request parameters for pagination."""
    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(20, ge=1, le=100, description="Items per page (max 100)")
    sort_by: Optional[str] = Field(None, description="Sort field")
    sort_order: Optional[str] = Field("desc", description="Sort order (asc/desc)")


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_items: int = Field(..., description="Total number of items")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there's a next page")
    has_previous: bool = Field(..., description="Whether there's a previous page")


class PaginatedResponse(BaseModel, Generic[DataT]):
    """Generic paginated response wrapper."""
    data: List[DataT] = Field(..., description="List of items")
    meta: PaginationMeta = Field(..., description="Pagination metadata")
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# RESPONSE WRAPPERS
# =============================================================================

class SuccessResponse(BaseModel, Generic[DataT]):
    """Generic success response wrapper."""
    success: bool = Field(True, description="Success status")
    data: DataT = Field(..., description="Response data")
    message: Optional[str] = Field(None, description="Optional message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class ErrorDetail(BaseModel):
    """Error detail object."""
    field: Optional[str] = Field(None, description="Field that caused error")
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")


class ErrorResponse(BaseModel):
    """Error response schema."""
    success: bool = Field(False, description="Success status (always false)")
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[List[ErrorDetail]] = Field(None, description="Error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    request_id: Optional[str] = Field(None, description="Request ID for tracking")


class ValidationErrorResponse(ErrorResponse):
    """Validation error response (422)."""
    error: str = Field("validation_error", description="Error type")


class NotFoundErrorResponse(ErrorResponse):
    """Not found error response (404)."""
    error: str = Field("not_found", description="Error type")


class UnauthorizedErrorResponse(ErrorResponse):
    """Unauthorized error response (401)."""
    error: str = Field("unauthorized", description="Error type")


class ForbiddenErrorResponse(ErrorResponse):
    """Forbidden error response (403)."""
    error: str = Field("forbidden", description="Error type")


# =============================================================================
# COMMON RESPONSE MODELS
# =============================================================================

class MessageResponse(BaseModel):
    """Simple message response."""
    message: str = Field(..., description="Response message")
    success: bool = Field(True, description="Success status")


class IDResponse(BaseModel):
    """Response with ID only."""
    id: str = Field(..., description="Resource ID")


class BulkOperationResponse(BaseModel):
    """Response for bulk operations."""
    success_count: int = Field(..., description="Number of successful operations")
    failure_count: int = Field(..., description="Number of failed operations")
    total_count: int = Field(..., description="Total operations attempted")
    errors: Optional[List[ErrorDetail]] = Field(None, description="Errors encountered")


# =============================================================================
# HEALTH CHECK
# =============================================================================

class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str = Field("healthy", description="Service status")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    services: dict = Field(default_factory=dict, description="Service health status")


# =============================================================================
# IMPORT ALL SCHEMAS (for easy access)
# =============================================================================

# User schemas
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserProfile,
    UserSettings,
    UserLogin,
    UserRegister,
    PasswordReset,
    PasswordChange)

# Funnel schemas
from app.schemas.funnel import (
    FunnelCreate,
    FunnelUpdate,
    FunnelResponse,
    FunnelDetail,
    FunnelList,
    FunnelPublish,
    FunnelClone,
    FunnelStats)

# Question schemas
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    QuestionDetail,
    QuestionBulkUpdate,
    QuestionReorder)

# Response schemas
from app.schemas.response import (
    ResponseCreate,
    ResponseUpdate,
    ResponseResponse,
    ResponseDetail,
    ResponseSubmit,
    ResponseResume)

# Answer schemas
from app.schemas.answer import (
    AnswerCreate,
    AnswerUpdate,
    AnswerResponse,
    AnswerValidation)

# Lead schemas
from app.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadDetail,
    LeadList,
    LeadExport,
    LeadImport)

# Analytics schemas
from app.schemas.analytics import (
    AnalyticsSummary,
    AnalyticsDetail,
    AnalyticsTimeSeriesResponse,
    AnalyticsBreakdown)

# Event schemas
from app.schemas.event import (
    EventCreate,
    EventResponse,
    EventBatch)

# Template schemas (Phase 2)
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateDetail,
    TemplateList)

# Campaign schemas (Phase 2)
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignDetail,
    CampaignList)

# Benchmark schemas
from app.schemas.benchmark import (
    BenchmarkResponse,
    BenchmarkComparison)

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Base classes
    "BaseSchema",
    "TimestampSchema",
    "IDSchema",
    
    # Pagination
    "PaginationParams",
    "PaginationMeta",
    "PaginatedResponse",
    
    # Response wrappers
    "SuccessResponse",
    "ErrorResponse",
    "ErrorDetail",
    "ValidationErrorResponse",
    "NotFoundErrorResponse",
    "UnauthorizedErrorResponse",
    "ForbiddenErrorResponse",
    "MessageResponse",
    "IDResponse",
    "BulkOperationResponse",
    "HealthCheckResponse",
    
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserProfile",
    "UserSettings",
    "UserLogin",
    "UserRegister",
    "PasswordReset",
    "PasswordChange",
    
    # Funnel
    "FunnelCreate",
    "FunnelUpdate",
    "FunnelResponse",
    "FunnelDetail",
    "FunnelList",
    "FunnelPublish",
    "FunnelClone",
    "FunnelStats",
    
    # Question
    "QuestionCreate",
    "QuestionUpdate",
    "QuestionResponse",
    "QuestionDetail",
    "QuestionBulkUpdate",
    "QuestionReorder",
    
    # Response
    "ResponseCreate",
    "ResponseUpdate",
    "ResponseResponse",
    "ResponseDetail",
    "ResponseSubmit",
    "ResponseResume",
    
    # Answer
    "AnswerCreate",
    "AnswerUpdate",
    "AnswerResponse",
    "AnswerValidation",
    
    # Lead
    "LeadCreate",
    "LeadUpdate",
    "LeadResponse",
    "LeadDetail",
    "LeadList",
    "LeadExport",
    "LeadImport",
    
    # Analytics
    "AnalyticsSummary",
    "AnalyticsDetail",
    "AnalyticsTimeSeriesResponse",
    "AnalyticsBreakdown",
    
    # Event
    "EventCreate",
    "EventResponse",
    "EventBatch",
    
    # Template
    "TemplateCreate",
    "TemplateUpdate",
    "TemplateResponse",
    "TemplateDetail",
    "TemplateList",
    
    # Campaign
    "CampaignCreate",
    "CampaignUpdate",
    "CampaignResponse",
    "CampaignDetail",
    "CampaignList",
    
    # Benchmark
    "BenchmarkResponse",
    "BenchmarkComparison",
]


