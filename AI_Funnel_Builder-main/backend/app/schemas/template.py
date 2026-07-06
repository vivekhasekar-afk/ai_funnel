"""
Template Schemas - Production Grade
===================================
Pydantic schemas for template marketplace - Enterprise Production Grade
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict, HttpUrl
from enum import Enum
from pydantic.types import StrictStr, StrictInt, StrictFloat

# Local imports (minimal dependencies)
from app.schemas import BaseSchema, TimestampSchema
# Assuming TemplateCategoryEnum is defined below, we alias it if needed,
# or use the one defined in this file.


# =============================================================================
# ENUMS
# =============================================================================


class TemplateStatusEnum(str, Enum):
    """Template listing status with lifecycle tracking."""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"
    UNDER_REVIEW = "under_review"
    LIVE = "live"
    SUSPENDED = "suspended"


class TemplateCategoryEnum(str, Enum):
    """Template categories for marketplace organization."""
    LEAD_GENERATION = "lead_generation"
    PRODUCT_RECOMMENDATION = "product_recommendation"
    AUDIENCE_RESEARCH = "audience_research"
    BRAND_PARTNERSHIP = "brand_partnership"
    ENGAGEMENT = "engagement"
    FEEDBACK = "feedback"
    CONTEST = "contest"
    ECOMMERCE = "ecommerce"
    OTHER = "other"


class PricingModelEnum(str, Enum):
    """Pricing models with enterprise billing support."""
    FREE = "free"
    ONE_TIME = "one_time"
    SUBSCRIPTION = "subscription"
    PAY_WHAT_YOU_WANT = "pay_what_you_want"
    ENTERPRISE = "enterprise"


class TemplateReviewStatusEnum(str, Enum):
    """Review moderation status."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED = "flagged"
    SPAM = "spam"


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================


class TemplateCreate(BaseModel):
    """Template creation schema with enterprise validation."""
    title: StrictStr = Field(..., min_length=3, max_length=255, description="Template title")
    slug: Optional[StrictStr] = Field(None, max_length=120, description="URL slug (auto-generated if not provided)")
    description: StrictStr = Field(..., min_length=10, max_length=5000, description="Template description")
    short_description: Optional[StrictStr] = Field(None, max_length=500, description="Brief description for listings")
    
    # Source
    funnel_id: StrictStr = Field(..., description="Source funnel ID to create template from")
    
    # Categorization
    category: TemplateCategoryEnum = Field(..., description="Primary category")
    subcategory: Optional[StrictStr] = Field(None, max_length=100, description="Subcategory")
    niche: Optional[StrictStr] = Field(None, max_length=100, description="Target niche/industry")
    tags: Optional[List[StrictStr]] = Field(default_factory=list, description="Search tags")
    
    # Pricing
    pricing_model: PricingModelEnum = Field(PricingModelEnum.FREE, description="Pricing model")
    price: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"), description="Price in USD")
    suggested_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"), description="Suggested price (PWYW)")
    min_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"), description="Minimum price (PWYW)")
    
    # Media
    thumbnail_url: Optional[HttpUrl] = Field(None, description="Thumbnail image URL")
    preview_images: Optional[List[HttpUrl]] = Field(default_factory=list, description="Preview images")
    demo_url: Optional[HttpUrl] = Field(None, description="Live demo URL")
    video_url: Optional[HttpUrl] = Field(None, description="Demo video URL")
    
    # Metadata
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    seo_keywords: Optional[List[StrictStr]] = Field(default_factory=list, description="SEO keywords")

    model_config = ConfigDict(from_attributes=True)

    @field_validator("tags", "seo_keywords")
    @classmethod
    def limit_list_size(cls, v):
        if v and len(v) > 20:
            raise ValueError("Maximum 20 items allowed")
        return v

    @model_validator(mode='after')
    def validate_price_for_model(self):
        pricing_model = self.pricing_model
        price = self.price
        
        if pricing_model == PricingModelEnum.FREE and price > Decimal("0.00"):
            raise ValueError("Free templates must have price 0")
        if pricing_model in [PricingModelEnum.ONE_TIME, PricingModelEnum.SUBSCRIPTION] and price <= Decimal("0.00"):
            raise ValueError("Paid templates must have price > 0")
        return self


class TemplateUpdate(BaseModel):
    """Template update schema with partial updates."""
    title: Optional[StrictStr] = Field(None, min_length=3, max_length=255)
    description: Optional[StrictStr] = Field(None, min_length=10, max_length=5000)
    short_description: Optional[StrictStr] = Field(None, max_length=500)
    
    category: Optional[TemplateCategoryEnum] = None
    subcategory: Optional[StrictStr] = Field(None, max_length=100)
    niche: Optional[StrictStr] = Field(None, max_length=100)
    tags: Optional[List[StrictStr]] = None
    
    pricing_model: Optional[PricingModelEnum] = None
    price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    suggested_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    min_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    
    thumbnail_url: Optional[HttpUrl] = None
    preview_images: Optional[List[HttpUrl]] = None
    demo_url: Optional[HttpUrl] = None
    video_url: Optional[HttpUrl] = None
    
    metadata: Optional[Dict[str, Any]] = None
    seo_keywords: Optional[List[StrictStr]] = None

    model_config = ConfigDict(extra="allow", from_attributes=True)


class TemplateSubmitForReview(BaseModel):
    """Submit template for marketplace review."""
    template_id: StrictStr = Field(..., description="Template ID")
    notes: Optional[StrictStr] = Field(None, max_length=1000, description="Notes for reviewers")
    model_config = ConfigDict(from_attributes=True)


class TemplateApprove(BaseModel):
    """Approve template (admin only)."""
    template_id: StrictStr = Field(..., description="Template ID")
    featured: bool = Field(False, description="Feature on homepage")
    staff_pick: bool = Field(False, description="Mark as staff pick")
    featured_until: Optional[datetime] = Field(None, description="Featured expiration")
    notes: Optional[StrictStr] = Field(None, max_length=500, description="Approval notes")
    model_config = ConfigDict(from_attributes=True)


class TemplateReject(BaseModel):
    """Reject template (admin only)."""
    template_id: StrictStr = Field(..., description="Template ID")
    reason: StrictStr = Field(..., min_length=10, max_length=1000, description="Rejection reason")
    model_config = ConfigDict(from_attributes=True)


class TemplatePurchase(BaseModel):
    """Purchase template."""
    template_id: StrictStr = Field(..., description="Template ID")
    payment_method_id: Optional[StrictStr] = Field(None, description="Stripe payment method ID")
    
    # For pay-what-you-want
    custom_amount: Optional[Decimal] = Field(None, ge=Decimal("0.00"), description="Custom payment amount")
    
    # Installation options
    install_immediately: bool = Field(True, description="Install to account immediately")
    workspace_id: Optional[StrictStr] = Field(None, description="Target workspace ID")

    model_config = ConfigDict(from_attributes=True)

    @field_validator("custom_amount")
    @classmethod
    def validate_custom_amount(cls, v):
        if v is not None and v < 0:
            raise ValueError("Custom amount must be positive")
        return v


class TemplateInstall(BaseModel):
    """Install purchased template."""
    template_id: StrictStr = Field(..., description="Template ID")
    new_funnel_title: Optional[StrictStr] = Field(None, max_length=255, description="Title for new funnel")
    workspace_id: Optional[StrictStr] = Field(None, description="Target workspace ID")
    model_config = ConfigDict(from_attributes=True)


class TemplateReviewCreate(BaseModel):
    """Create template review."""
    template_id: StrictStr = Field(..., description="Template ID")
    rating: int = Field(..., ge=1, le=5, description="Rating (1-5 stars)")
    title: Optional[StrictStr] = Field(None, max_length=100, description="Review title")
    comment: StrictStr = Field(..., min_length=10, max_length=2000, description="Review text")
    
    # Usage context
    use_case: Optional[StrictStr] = Field(None, max_length=200, description="How you used the template")
    would_recommend: bool = Field(True, description="Would recommend to others")

    model_config = ConfigDict(from_attributes=True)


class TemplateReviewUpdate(BaseModel):
    """Update template review."""
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[StrictStr] = Field(None, max_length=100)
    comment: Optional[StrictStr] = Field(None, min_length=10, max_length=2000)
    would_recommend: Optional[bool] = None
    model_config = ConfigDict(from_attributes=True)


class TemplateSearchRequest(BaseModel):
    """Template marketplace search."""
    query: Optional[StrictStr] = Field(None, max_length=200, description="Search query")
    
    # Filters
    categories: Optional[List[TemplateCategoryEnum]] = None
    niches: Optional[List[StrictStr]] = None
    tags: Optional[List[StrictStr]] = None
    
    # Pricing
    pricing_models: Optional[List[PricingModelEnum]] = None
    min_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    max_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    
    # Quality filters
    min_rating: Optional[float] = Field(None, ge=1, le=5)
    min_usage_count: Optional[int] = Field(None, ge=0)
    
    # Featured
    featured_only: bool = Field(False, description="Show only featured templates")
    staff_picks_only: bool = Field(False, description="Show only staff picks")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: StrictStr = Field("popularity", description="Sort field (popularity, rating, price, newest)")
    sort_order: StrictStr = Field("desc", description="Sort order (asc/desc)")

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================


class TemplateListItem(BaseSchema):
    """Template list card (marketplace grid view)."""
    template_id: StrictStr
    title: StrictStr
    slug: StrictStr
    short_description: Optional[StrictStr] = None
    
    category: TemplateCategoryEnum
    niche: Optional[StrictStr] = None
    
    price: Decimal
    display_price: StrictStr
    pricing_model: PricingModelEnum
    
    thumbnail_url: Optional[StrictStr] = None

    rating_average: StrictFloat
    rating_count: StrictInt
    usage_count: StrictInt
    
    is_featured: bool
    is_staff_pick: bool
    
    tags: List[StrictStr]
    
    creator_id: StrictStr

    model_config = ConfigDict(from_attributes=True)


class TemplateResponse(BaseSchema, TimestampSchema):
    """Full template response (for creator dashboard and detail pages)."""
    template_id: StrictStr
    creator_id: StrictStr
    funnel_id: Optional[StrictStr] = None
    
    # Basic info
    title: StrictStr
    slug: StrictStr
    description: StrictStr
    short_description: Optional[StrictStr] = None
    
    # Categorization
    category: TemplateCategoryEnum
    subcategory: Optional[StrictStr] = None
    niche: Optional[StrictStr] = None
    tags: List[StrictStr] = Field(default_factory=list)
    
    # Pricing
    pricing_model: PricingModelEnum
    price: Decimal
    suggested_price: Optional[Decimal] = None
    min_price: Optional[Decimal] = None
    
    # Media
    thumbnail_url: Optional[StrictStr] = None
    preview_images: List[StrictStr] = Field(default_factory=list)
    demo_url: Optional[StrictStr] = None
    video_url: Optional[StrictStr] = None
    
    # Status & Moderation
    status: TemplateStatusEnum
    submitted_for_review_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[StrictStr] = None
    
    # Featured & Badges
    is_featured: bool = Field(False)
    is_staff_pick: bool = Field(False)
    featured_until: Optional[datetime] = None
    
    # Performance Stats
    usage_count: StrictInt = Field(0)
    purchase_count: StrictInt = Field(0)
    view_count: StrictInt = Field(0)
    favorite_count: StrictInt = Field(0)
    
    # Ratings & Reviews
    rating_average: StrictFloat = Field(0.0)
    rating_count: StrictInt = Field(0)
    review_count: StrictInt = Field(0)
    
    # Revenue (creator view only)
    total_revenue: Decimal = Field(Decimal("0.00"))
    creator_earnings: Decimal = Field(Decimal("0.00"))
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    seo_keywords: List[StrictStr] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class TemplateDetail(TemplateResponse):
    """Template detail page with complete funnel data and creator info."""
    
    # Full template data
    template_data: Dict[str, Any] = Field(..., description="Complete funnel structure and questions")
    version: StrictInt = Field(..., description="Template version")
    
    # Creator profile (embedded)
    creator_name: Optional[StrictStr] = Field(None, description="Creator display name")
    creator_avatar: Optional[StrictStr] = Field(None, description="Creator avatar URL")
    creator_bio: Optional[StrictStr] = Field(None, max_length=500, description="Creator bio")
    
    # Extended stats
    installs_last_30d: StrictInt = Field(0, description="Installs in last 30 days")
    revenue_last_30d: Decimal = Field(Decimal("0.00"), description="Revenue in last 30 days")
    
    # Recent reviews (first 3)
    recent_reviews: List[Dict[str, Any]] = Field(default_factory=list, description="Latest reviews")
    
    model_config = ConfigDict(from_attributes=True)


class TemplateList(BaseModel):
    """Paginated template list response for marketplace."""
    
    templates: List[TemplateListItem] = Field(..., description="List of templates")
    total: StrictInt = Field(..., description="Total matching templates")
    page: StrictInt = Field(..., description="Current page")
    page_size: StrictInt = Field(..., description="Items per page")
    total_pages: StrictInt = Field(..., description="Total pages")
    
    # Filters applied
    filters_applied: Dict[str, Any] = Field(default_factory=dict, description="Applied filters summary")
    search_query: Optional[StrictStr] = Field(None, description="Search query used")

    model_config = ConfigDict(from_attributes=True)


class TemplateSearchParams(BaseModel):
    """Template marketplace search parameters."""
    query: Optional[str] = Field(None, max_length=200)
    categories: Optional[List[TemplateCategoryEnum]] = None
    niches: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    min_usage_count: Optional[int] = Field(None, ge=0)
    pricing_models: Optional[List[str]] = None
    min_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    max_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    sort_by: str = Field("popularity", pattern="^(popularity|rating|price|newest)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")
    
    model_config = ConfigDict(from_attributes=True)


class TemplateListResponse(BaseModel):
    templates: List[dict] = Field(..., description="List of templates with metadata")
    total_count: int = Field(..., description="Total number of templates")
    model_config = ConfigDict(from_attributes=True)


class TemplateUseRequest(BaseModel):
    template_id: str
    user_id: str
    model_config = ConfigDict(from_attributes=True)


class TemplatePurchaseRequest(BaseModel):
    template_id: str
    payment_method_id: str
    model_config = ConfigDict(from_attributes=True)


class TemplateRatingRequest(BaseModel):
    template_id: str
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = [
    "TemplateStatusEnum",
    "TemplateCategoryEnum",
    "PricingModelEnum",
    "TemplateReviewStatusEnum",
    "TemplateCreate",
    "TemplateSearchParams",
    "TemplateUpdate",
    "TemplateSubmitForReview",
    "TemplateApprove",
    "TemplateReject",
    "TemplatePurchase",
    "TemplateInstall",
    "TemplateReviewCreate",
    "TemplateReviewUpdate",
    "TemplateSearchRequest",
    "TemplateListItem",
    "TemplateResponse",
    "TemplateDetail",
    "TemplateList",
    "TemplateSearchParams",
    "TemplateListResponse",
    "TemplateUseRequest",
    "TemplatePurchaseRequest",
    "TemplateRatingRequest",
]
