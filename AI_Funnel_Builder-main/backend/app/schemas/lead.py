"""
Lead Schemas - Production Grade
===============================
Pydantic schemas for lead management and export
"""


from decimal import Decimal
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field, validator, ConfigDict
from enum import Enum

from app.schemas import BaseSchema, TimestampSchema
from app.models.lead import LeadSourceEnum


# =============================================================================
# ENUMS
# =============================================================================


class LeadQualityTierEnum(str, Enum):
    """Lead quality tiers."""
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"
    UNQUALIFIED = "unqualified"


class LeadStatusEnum(str, Enum):
    """Lead lifecycle status."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"
    ARCHIVED = "archived"


class ExportFormatEnum(str, Enum):
    """Export file formats."""
    CSV = "csv"
    JSON = "json"
    XLSX = "xlsx"


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================


class LeadCreate(BaseModel):
    """Manual lead creation schema."""
    email: EmailStr = Field(..., description="Lead email address")
    first_name: Optional[str] = Field(None, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, max_length=100, description="Last name")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    company: Optional[str] = Field(None, max_length=255, description="Company name")

    # Source
    source: Optional[str] = Field(None, max_length=100, description="Lead source")
    funnel_id: Optional[str] = Field(None, description="Associated funnel ID")
    response_id: Optional[str] = Field(None, description="Associated response ID")

    # Metadata
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags")
    custom_fields: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Custom fields")
    notes: Optional[str] = Field(None, max_length=2000, description="Notes")

    # Marketing
    marketing_consent: bool = Field(False, description="Marketing consent")

    @validator("tags")
    def limit_tags(cls, v):
        if v and len(v) > 50:
            raise ValueError("Maximum 50 tags allowed")
        return v

    model_config = ConfigDict(from_attributes=True)


class LeadUpdate(BaseModel):
    """Lead update schema."""
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)

    # Status management
    status: Optional[LeadStatusEnum] = None
    quality_tier: Optional[LeadQualityTierEnum] = None

    # Organization
    tags: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    notes: Optional[str] = Field(None, max_length=2000)

    # Engagement
    is_starred: Optional[bool] = None
    assigned_to: Optional[str] = Field(None, description="Assigned user ID")

    model_config = ConfigDict(from_attributes=True)


class LeadBulkUpdate(BaseModel):
    """Bulk update leads schema."""
    lead_ids: List[str] = Field(..., min_length=1, max_length=100, description="Lead IDs")
    updates: Dict[str, Any] = Field(..., description="Fields to update")

    @validator("lead_ids")
    def validate_lead_ids(cls, v):
        if len(v) == 0:
            raise ValueError("Must provide at least one lead ID")
        return v

    model_config = ConfigDict(from_attributes=True)


class LeadBulkDelete(BaseModel):
    """Bulk delete leads schema."""
    lead_ids: List[str] = Field(..., min_length=1, max_length=100, description="Lead IDs to delete")
    confirm: bool = Field(..., description="Deletion confirmation")

    @validator("confirm")
    def validate_confirmation(cls, v):
        if not v:
            raise ValueError("Must confirm deletion")
        return v


class LeadTagUpdate(BaseModel):
    """Add/remove tags from leads."""
    lead_ids: List[str] = Field(..., min_length=1, description="Lead IDs")
    tags_to_add: Optional[List[str]] = Field(default_factory=list, description="Tags to add")
    tags_to_remove: Optional[List[str]] = Field(default_factory=list, description="Tags to remove")


class LeadEnrich(BaseModel):
    """Lead enrichment request."""
    lead_id: str = Field(..., description="Lead ID to enrich")
    services: List[str] = Field(
        default_factory=list,
        description="Enrichment services to use",
    )


class LeadExportRequest(BaseModel):
    """Lead export request schema."""
    format: ExportFormatEnum = Field(ExportFormatEnum.CSV, description="Export format")

    # Filters
    funnel_ids: Optional[List[str]] = Field(None, description="Filter by funnels")
    quality_tiers: Optional[List[LeadQualityTierEnum]] = Field(None, description="Filter by quality")
    statuses: Optional[List[LeadStatusEnum]] = Field(None, description="Filter by status")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")

    # Date range
    created_after: Optional[date] = Field(None, description="Created after date")
    created_before: Optional[date] = Field(None, description="Created before date")

    # Fields
    fields: Optional[List[str]] = Field(
        default_factory=list,
        description="Fields to include",
    )

    # Options
    include_custom_fields: bool = Field(True, description="Include custom fields")
    include_response_data: bool = Field(False, description="Include funnel response data")

    model_config = ConfigDict(from_attributes=True)


class LeadSearchRequest(BaseModel):
    """Advanced lead search schema."""
    query: Optional[str] = Field(None, max_length=500, description="Search query")

    # Filters
    funnel_ids: Optional[List[str]] = None
    quality_tiers: Optional[List[LeadQualityTierEnum]] = None
    statuses: Optional[List[LeadStatusEnum]] = None
    tags: Optional[List[str]] = None

    # Score range
    min_intent_score: Optional[float] = Field(None, ge=0, le=100)
    max_intent_score: Optional[float] = Field(None, ge=0, le=100)

    # Date filters
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None

    # Boolean filters
    is_starred: Optional[bool] = None
    has_phone: Optional[bool] = None
    has_company: Optional[bool] = None

    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)

    # Sorting
    sort_by: Optional[str] = Field("created_at", description="Sort field")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order")


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================


class LeadResponse(BaseSchema, TimestampSchema):
    """Basic lead response schema."""
    lead_id: str = Field(..., description="Lead ID")
    email: str = Field(..., description="Email address")
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    company: Optional[str] = Field(None, description="Company name")

    # Scoring
    intent_score: float = Field(..., description="Intent score (0-100)")
    quality_tier: LeadQualityTierEnum = Field(..., description="Quality tier")

    # Status
    status: LeadStatusEnum = Field(..., description="Lead status")

    # Source
    source: Optional[str] = Field(None, description="Lead source")
    funnel_id: Optional[str] = Field(None, description="Funnel ID")

    # Organization
    tags: List[str] = Field(default_factory=list, description="Tags")
    is_starred: bool = Field(..., description="Starred status")

    # Engagement
    last_contacted_at: Optional[datetime] = Field(None, description="Last contact date")

    model_config = ConfigDict(from_attributes=True)


class LeadDetail(LeadResponse):
    """Detailed lead response with full data."""
    response_id: Optional[str] = Field(None, description="Response ID")

    # Full profile
    custom_fields: Dict[str, Any] = Field(default_factory=dict, description="Custom fields")
    enrichment_data: Optional[Dict[str, Any]] = Field(None, description="Enrichment data")
    notes: Optional[str] = Field(None, description="Notes")

    # Response data
    response_data: Optional[Dict[str, Any]] = Field(None, description="Funnel response data")
    response_score: Optional[float] = Field(None, description="Funnel score")

    # UTM
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None

    # Tracking
    country_code: Optional[str] = None
    device_type: Optional[str] = None

    # Assignment
    assigned_to: Optional[str] = Field(None, description="Assigned user ID")
    assigned_at: Optional[datetime] = None

    # Marketing
    marketing_consent: bool = Field(..., description="Marketing consent")
    email_verified: bool = Field(..., description="Email verified")

    model_config = ConfigDict(from_attributes=True)


class LeadList(BaseModel):
    """Lead list item (for table views)."""
    lead_id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    intent_score: float
    quality_tier: LeadQualityTierEnum
    status: LeadStatusEnum
    source: Optional[str]
    tags: List[str]
    is_starred: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadStats(BaseModel):
    """Lead statistics for dashboard."""
    total_leads: int = Field(..., description="Total leads")
    new_leads_today: int = Field(..., description="New leads today")
    new_leads_this_week: int = Field(..., description="New leads this week")
    new_leads_this_month: int = Field(..., description="New leads this month")

    # Quality breakdown
    hot_leads: int = Field(..., description="Hot leads count")
    warm_leads: int = Field(..., description="Warm leads count")
    cold_leads: int = Field(..., description="Cold leads count")

    # Status breakdown
    new_status: int = Field(..., description="New status count")
    contacted: int = Field(..., description="Contacted count")
    qualified: int = Field(..., description="Qualified count")
    converted: int = Field(..., description="Converted count")

    # Scoring
    avg_intent_score: float = Field(..., description="Average intent score")

    # Trends
    conversion_rate: float = Field(..., description="Lead to conversion rate")

    model_config = ConfigDict(from_attributes=True)


class LeadExportResponse(BaseModel):
    """Lead export response."""
    export_id: str = Field(..., description="Export job ID")
    status: str = Field(..., description="Export status (processing/completed/failed)")
    format: ExportFormatEnum = Field(..., description="Export format")
    total_leads: int = Field(..., description="Number of leads to export")
    download_url: Optional[str] = Field(None, description="Download URL (when ready)")
    expires_at: Optional[datetime] = Field(None, description="Download link expiration")
    created_at: datetime = Field(..., description="Export creation time")

    model_config = ConfigDict(from_attributes=True)


class LeadEnrichmentResponse(BaseModel):
    """Lead enrichment result."""
    lead_id: str
    enriched: bool = Field(..., description="Whether enrichment was successful")
    data_sources: List[str] = Field(..., description="Data sources used")
    enriched_fields: List[str] = Field(..., description="Fields that were enriched")
    confidence_score: Optional[float] = Field(None, description="Enrichment confidence (0-1)")
    enriched_data: Dict[str, Any] = Field(..., description="Enriched data")

    model_config = ConfigDict(from_attributes=True)


class LeadScoreBreakdown(BaseModel):
    """Detailed lead score breakdown."""
    lead_id: str
    total_score: float = Field(..., ge=0, le=100, description="Total intent score")

    # Component scores
    engagement_score: float = Field(..., description="Engagement component")
    completion_score: float = Field(..., description="Completion component")
    response_quality_score: float = Field(..., description="Response quality component")
    profile_completeness_score: float = Field(..., description="Profile completeness")

    # Factors
    positive_signals: List[str] = Field(..., description="Positive scoring factors")
    negative_signals: List[str] = Field(..., description="Negative scoring factors")

    calculated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# INTEGRATION SCHEMAS
# =============================================================================


class LeadCRMExport(BaseModel):
    """Export leads to CRM."""
    lead_ids: List[str] = Field(..., min_length=1, description="Lead IDs to export")
    crm_type: str = Field(..., description="CRM type (salesforce, hubspot, pipedrive)")
    integration_id: str = Field(..., description="Integration ID")

    # Mapping
    field_mapping: Optional[Dict[str, str]] = Field(None, description="Custom field mapping")

    # Options
    create_contact: bool = Field(True, description="Create contact record")
    create_lead: bool = Field(True, description="Create lead record")
    create_deal: bool = Field(False, description="Create deal/opportunity")

    model_config = ConfigDict(from_attributes=True)


class LeadExport(BaseModel):
    """Lead export configuration for bulk operations."""

    funnel_ids: Optional[List[str]] = Field(None, description="Filter by funnel IDs")
    status: Optional[List[LeadStatusEnum]] = Field(None, description="Filter by status")
    quality_tier: Optional[List[LeadQualityTierEnum]] = Field(None, description="Filter by quality tier")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")

    # Date range
    created_after: Optional[date] = Field(None, description="Created after date")
    created_before: Optional[date] = Field(None, description="Created before date")

    # Score filters
    min_intent_score: Optional[float] = Field(None, ge=0, le=100, description="Minimum intent score")
    max_intent_score: Optional[float] = Field(None, ge=0, le=100, description="Maximum intent score")

    # Export options
    format: ExportFormatEnum = Field(ExportFormatEnum.CSV, description="Export format")
    include_custom_fields: bool = Field(True, description="Include custom fields")
    include_response_data: bool = Field(False, description="Include funnel response data")
    anonymize_pii: bool = Field(False, description="Anonymize PII data")

    model_config = ConfigDict(from_attributes=True)


class LeadImport(BaseModel):
    """Bulk lead import schema from CSV/JSON."""

    leads: List[Dict[str, Any]] = Field(..., min_items=1, max_items=10000, description="List of leads to import")
    source_file: Optional[str] = Field(None, description="Original filename")
    duplicate_strategy: Literal["skip", "update", "error"] = "skip"
    validate_emails: bool = True
    validate_phone: bool = False
    auto_tag_source: bool = True
    default_status: Optional[LeadStatusEnum] = LeadStatusEnum.NEW
    default_quality_tier: Optional[LeadQualityTierEnum] = LeadQualityTierEnum.COLD

    model_config = ConfigDict(from_attributes=True)


class LeadSearchParams(BaseModel):
    """Search and filter parameters for leads."""

    # Basic filters
    funnel_id: Optional[str] = Field(None, description="Filter by funnel ID")
    email: Optional[str] = Field(None, description="Filter by email (partial match)")
    status: Optional[List[LeadStatusEnum]] = Field(None, description="Filter by status")
    source: Optional[List[LeadSourceEnum]] = Field(None, description="Filter by source")

    # Date ranges
    created_after: Optional[datetime] = Field(None, description="Created after date")
    created_before: Optional[datetime] = Field(None, description="Created before date")
    contacted_after: Optional[datetime] = Field(None, description="Contacted after date")

    # Scoring
    min_score: Optional[float] = Field(None, ge=0, le=100, description="Minimum lead score")
    max_score: Optional[float] = Field(None, ge=0, le=100, description="Maximum lead score")

    # Geographic
    country_code: Optional[str] = Field(None, description="Filter by country code")

    # Pagination & sorting
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(50, ge=1, le=1000, description="Items per page")
    sort_by: str = Field("created_at", description="Sort field")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order")

    model_config = ConfigDict(from_attributes=True)


class LeadStatsResponse(BaseModel):
    """Comprehensive lead statistics dashboard."""
    total_leads: int = Field(..., description="Total leads captured")
    new_leads_24h: int = Field(..., description="New leads in last 24 hours")
    qualified_leads: int = Field(..., description="Qualified leads")
    conversion_rate: float = Field(..., ge=0, le=1, description="Lead to opportunity conversion rate")
    avg_time_to_qualify_hours: Optional[float] = Field(None, description="Average time to qualification")

    # Breakdown by source
    leads_by_source: Dict[LeadSourceEnum, int] = Field(default_factory=dict)
    leads_by_quality: Dict[LeadQualityTierEnum, int] = Field(default_factory=dict)

    # Revenue metrics
    pipeline_value: Decimal = Field(..., description="Total pipeline value")
    won_revenue_30d: Decimal = Field(default=Decimal("0"), description="Revenue from leads won in 30 days")

    # Funnel progression
    leads_by_status: Dict[LeadStatusEnum, int] = Field(default_factory=dict)

    # Time series
    leads_trend_7d: List[Dict[str, Any]] = Field(default_factory=list)

    # Top performers
    top_funnels: List[Dict[str, Any]] = Field(default_factory=list)

    timestamp: datetime = Field(..., description="Stats generation timestamp")


class LeadDetailResponse(BaseModel):
    """Individual lead detail with enrichment data."""
    lead_id: str = Field(..., description="Unique lead identifier")
    funnel_id: str = Field(..., description="Source funnel")
    status: LeadStatusEnum = Field(..., description="Current lead status")
    quality_score: float = Field(..., ge=0, le=1, description="AI quality score")
    quality: LeadQualityTierEnum = Field(..., description="Quality tier")

    # Contact info (PII redacted for API)
    email_hash: str = Field(..., description="SHA256 hash of email")
    phone_hash: Optional[str] = Field(None, description="SHA256 hash of phone")

    source: LeadSourceEnum = Field(..., description="Acquisition source")
    created_at: datetime = Field(..., description="Lead creation time")
    first_response_at: Optional[datetime] = Field(None, description="First engagement time")
    qualified_at: Optional[datetime] = Field(None, description="Qualified time")

    # Enrichment
    ip_geolocation: Optional[Dict[str, str]] = Field(None)
    device_info: Optional[Dict[str, str]] = Field(None)

    # Responses
    response_count: int = Field(..., description="Number of responses")
    responses: List[Dict[str, Any]] = Field(default_factory=list)

    # Revenue attribution
    attributed_revenue: Optional[Decimal] = Field(None)
    lifecycle_value: Optional[Decimal] = Field(None)


class LeadListResponse(BaseModel):
    """Paginated lead list."""
    leads: List[LeadDetailResponse] = Field(..., description="Lead records")
    total_count: int = Field(..., description="Total matching leads")
    page: int = Field(..., description="Current page")
    page_size: int = Field(..., description="Page size")
    has_next: bool = Field(..., description="More pages available")


class LeadScoreRequest(BaseModel):
    """Request for AI lead re-scoring."""
    lead_id: str = Field(..., description="Lead to re-score")
    new_responses: Optional[Dict[str, str]] = Field(None, description="Additional responses")


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = [
    # Enums
    "LeadQualityTierEnum",
    "LeadStatusEnum",
    "ExportFormatEnum",

    # Request schemas
    "LeadCreate",
    "LeadUpdate",
    "LeadBulkUpdate",
    "LeadBulkDelete",
    "LeadTagUpdate",
    "LeadEnrich",
    "LeadExportRequest",
    "LeadSearchRequest",

    # Response schemas
    "LeadResponse",
    "LeadDetail",
    "LeadList",
    "LeadStats",
    "LeadExportResponse",
    "LeadEnrichmentResponse",
    "LeadScoreBreakdown",
    "LeadExport",
    "LeadImport",
    "LeadSearchParams",

    # Integration schemas
    "LeadCRMExport",
    "LeadStatsResponse",
    "LeadDetailResponse",
    "LeadListResponse",
    "LeadScoreRequest",
]
