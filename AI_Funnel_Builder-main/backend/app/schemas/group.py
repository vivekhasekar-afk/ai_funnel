# =============================================================================
# AI FUNNEL BUILDER - FUNNEL GROUP SCHEMAS
# =============================================================================
# Pydantic schemas for FunnelGroup resource (create, update, response)
# =============================================================================

from pydantic import BaseModel, Field, ConfigDict, field_validator, computed_field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# =============================================================================
# ENUMS (Mirror model enums)
# =============================================================================

class GroupTypeEnum(str, Enum):
    """Type of funnel group."""
    PRODUCT = "product"
    CATEGORY = "category"
    CAMPAIGN = "campaign"
    SERVICE = "service"
    COLLECTION = "collection"


class GroupStatusEnum(str, Enum):
    """Group lifecycle status."""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


# =============================================================================
# BASE SCHEMAS
# =============================================================================

class FunnelGroupBase(BaseModel):
    """Base funnel group fields shared across schemas."""
    
    name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Group name",
        examples=["Acne Treatment Line", "Summer Sale 2025", "Premium Coaching"]
    )
    
    description: Optional[str] = Field(
        None,
        max_length=2000,
        description="Detailed group description",
        examples=["Complete acne treatment system for teenagers and young adults"]
    )
    
    group_type: GroupTypeEnum = Field(
        GroupTypeEnum.PRODUCT,
        description="Type of group: product, category, campaign, service, collection"
    )
    
    positioning_problem: Optional[str] = Field(
        None,
        max_length=500,
        description="Market-level positioning pain this solves (PRD: Group-level problem)",
        examples=["Reduces acne and oil for humid weather", "Helps beginners lose weight safely"]
    )
    
    value_proposition: Optional[str] = Field(
        None,
        max_length=500,
        description="Core value proposition / USP",
        examples=["Clinically proven to reduce acne in 14 days without harsh chemicals"]
    )
    
    product_url: Optional[str] = Field(
        None,
        max_length=1000,
        description="Product page URL for AI scraping",
        examples=["https://glowskincare.com/acne-treatment"]
    )
    
    offer_summary: Optional[str] = Field(
        None,
        max_length=1000,
        description="Brief offer summary (pricing, packages, variants)",
        examples=["$49/month, 3-month commitment, includes cleanser + serum + moisturizer"]
    )
    
    price_range: Optional[str] = Field(
        None,
        max_length=100,
        description="Price range",
        examples=["$29-$99", "Free-$299/mo", "$1,499 one-time"]
    )
    
    audience_override: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Audience override for this group (overrides project default)",
        examples=[{
            "age_range": "16-25",
            "gender": "all",
            "skin_type": ["oily", "combination"],
            "concerns": ["acne", "blackheads"]
        }]
    )
    
    target_demographics: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Specific demographics for this group",
        examples=[{
            "age": "18-30",
            "gender": "female",
            "location": ["US", "CA", "UK"],
            "income": "$30k-$75k"
        }]
    )
    
    thumbnail_url: Optional[str] = Field(
        None,
        max_length=1000,
        description="Group thumbnail/cover image URL",
        examples=["https://cdn.glowskincare.com/groups/acne-treatment.jpg"]
    )
    
    media_assets: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Shared media assets (images, videos, logos)",
        examples=[{
            "hero_image": "https://cdn.../hero.jpg",
            "product_shots": ["https://cdn.../shot1.jpg", "https://cdn.../shot2.jpg"],
            "demo_video": "https://youtube.com/watch?v=..."
        }]
    )
    
    settings: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Group-specific settings",
        examples=[{
            "default_cta": "Shop Now",
            "tracking_pixel": "FB_PIXEL_123",
            "integrations": {"shopify": True}
        }]
    )
    
    tags: Optional[List[str]] = Field(
        default_factory=list,
        max_length=20,
        description="Tags for organizing/filtering",
        examples=[["acne", "skincare", "teenagers", "oily-skin"]]
    )


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class FunnelGroupCreate(FunnelGroupBase):
    """Schema for creating a new funnel group."""
    
    # project_id comes from URL path, not body
    # All fields from FunnelGroupBase are inherited
    
    status: Optional[GroupStatusEnum] = Field(
        GroupStatusEnum.DRAFT,
        description="Initial group status"
    )
    
    start_date: Optional[datetime] = Field(
        None,
        description="Campaign start date (for campaign-type groups)"
    )
    
    end_date: Optional[datetime] = Field(
        None,
        description="Campaign end date (for campaign-type groups)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Acne Treatment Line",
                "description": "Complete acne care system for teens and young adults",
                "group_type": "product",
                "positioning_problem": "Reduces acne and excess oil in humid climates",
                "value_proposition": "Clinically proven to reduce acne in 14 days without harsh chemicals",
                "product_url": "https://glowskincare.com/acne-treatment",
                "offer_summary": "$49/month subscription, cancel anytime",
                "price_range": "$29-$99",
                "audience_override": {
                    "age_range": "16-25",
                    "skin_concerns": ["acne", "oily skin"]
                },
                "tags": ["acne", "skincare", "subscription"],
                "status": "draft"
            }
        }
    )
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate group name."""
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Group name must be at least 2 characters")
        return v
    
    @field_validator("product_url", "thumbnail_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate and normalize URLs."""
        if v:
            v = v.strip()
            if not v.startswith(("http://", "https://")):
                v = f"https://{v}"
        return v
    
    @field_validator("positioning_problem")
    @classmethod
    def validate_positioning_problem(cls, v: Optional[str]) -> Optional[str]:
        """Validate positioning problem is concise."""
        if v:
            v = v.strip()
            if len(v) > 500:
                raise ValueError("Positioning problem should be concise (max 500 chars)")
        return v
    
    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate and clean tags."""
        if v:
            # Remove duplicates, clean whitespace, lowercase
            v = list(set([tag.strip().lower() for tag in v if tag and tag.strip()]))
            if len(v) > 20:
                raise ValueError("Maximum 20 tags allowed")
        return v
    
    @field_validator("end_date")
    @classmethod
    def validate_date_range(cls, v: Optional[datetime], info) -> Optional[datetime]:
        """Validate end_date is after start_date."""
        if v and info.data.get("start_date"):
            if v <= info.data["start_date"]:
                raise ValueError("end_date must be after start_date")
        return v


class FunnelGroupUpdate(BaseModel):
    """Schema for updating a funnel group (all fields optional)."""
    
    name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255,
        description="Group name"
    )
    
    description: Optional[str] = Field(
        None,
        max_length=2000,
        description="Group description"
    )
    
    group_type: Optional[GroupTypeEnum] = Field(
        None,
        description="Group type"
    )
    
    status: Optional[GroupStatusEnum] = Field(
        None,
        description="Group status"
    )
    
    positioning_problem: Optional[str] = Field(
        None,
        max_length=500,
        description="Positioning problem"
    )
    
    value_proposition: Optional[str] = Field(
        None,
        max_length=500,
        description="Value proposition"
    )
    
    product_url: Optional[str] = Field(
        None,
        max_length=1000,
        description="Product page URL"
    )
    
    offer_summary: Optional[str] = Field(
        None,
        max_length=1000,
        description="Offer summary"
    )
    
    price_range: Optional[str] = Field(
        None,
        max_length=100,
        description="Price range"
    )
    
    audience_override: Optional[Dict[str, Any]] = Field(
        None,
        description="Audience override"
    )
    
    target_demographics: Optional[Dict[str, Any]] = Field(
        None,
        description="Target demographics"
    )
    
    thumbnail_url: Optional[str] = Field(
        None,
        max_length=1000,
        description="Thumbnail URL"
    )
    
    media_assets: Optional[Dict[str, Any]] = Field(
        None,
        description="Media assets"
    )
    
    settings: Optional[Dict[str, Any]] = Field(
        None,
        description="Group settings"
    )
    
    tags: Optional[List[str]] = Field(
        None,
        max_length=20,
        description="Tags"
    )
    
    start_date: Optional[datetime] = Field(
        None,
        description="Campaign start date"
    )
    
    end_date: Optional[datetime] = Field(
        None,
        description="Campaign end date"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Group Name",
                "status": "active",
                "positioning_problem": "Updated positioning statement"
            }
        }
    )
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate group name if provided."""
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Group name must be at least 2 characters")
        return v
    
    @field_validator("product_url", "thumbnail_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate and normalize URLs if provided."""
        if v:
            v = v.strip()
            if not v.startswith(("http://", "https://")):
                v = f"https://{v}"
        return v
    
    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate and clean tags if provided."""
        if v is not None:
            v = list(set([tag.strip().lower() for tag in v if tag and tag.strip()]))
            if len(v) > 20:
                raise ValueError("Maximum 20 tags allowed")
        return v


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class FunnelGroupResponse(FunnelGroupBase):
    """Schema for funnel group response (includes IDs, timestamps, stats)."""
    
    group_id: str = Field(
        ...,
        description="Unique group identifier"
    )
    
    project_id: str = Field(
        ...,
        description="Parent project ID"
    )
    
    created_at: datetime = Field(
        ...,
        description="Group creation timestamp"
    )
    
    updated_at: datetime = Field(
        ...,
        description="Last update timestamp"
    )
    
    status: GroupStatusEnum = Field(
        ...,
        description="Group status"
    )
    
    is_deleted: bool = Field(
        ...,
        description="Soft delete flag"
    )
    
    deleted_at: Optional[datetime] = Field(
        None,
        description="Deletion timestamp"
    )
    
    last_activity_at: Optional[datetime] = Field(
        None,
        description="Last activity timestamp"
    )
    
    start_date: Optional[datetime] = Field(
        None,
        description="Campaign start date"
    )
    
    end_date: Optional[datetime] = Field(
        None,
        description="Campaign end date"
    )
    
    # Statistics
    funnels_count: int = Field(
        0,
        description="Total funnels in this group"
    )
    
    active_funnels_count: int = Field(
        0,
        description="Active/published funnels count"
    )
    
    total_leads: int = Field(
        0,
        description="Total leads captured"
    )
    
    total_views: int = Field(
        0,
        description="Total funnel views"
    )
    
    ai_context: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="AI-extracted context from product_url"
    )
    
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional metadata"
    )
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "group_id": "660e8400-e29b-41d4-a716-446655440000",
                "project_id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Acne Treatment Line",
                "description": "Complete acne care system",
                "group_type": "product",
                "status": "active",
                "positioning_problem": "Reduces acne and excess oil",
                "product_url": "https://glowskincare.com/acne",
                "created_at": "2025-12-10T14:30:00Z",
                "updated_at": "2025-12-10T14:30:00Z",
                "funnels_count": 5,
                "active_funnels_count": 3,
                "total_leads": 234,
                "total_views": 1520
            }
        }
    )


class FunnelGroupListItem(BaseModel):
    """Lightweight schema for group list view."""
    
    group_id: str
    project_id: str
    name: str
    description: Optional[str] = None
    group_type: GroupTypeEnum
    status: GroupStatusEnum
    positioning_problem: Optional[str] = None
    thumbnail_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    funnels_count: int = 0
    active_funnels_count: int = 0
    total_leads: int = 0
    total_views: int = 0
    last_activity_at: Optional[datetime] = None
    tags: Optional[List[str]] = None
    
    model_config = ConfigDict(from_attributes=True)


class FunnelGroupList(BaseModel):
    """Paginated list of funnel groups."""
    
    items: List[FunnelGroupListItem] = Field(
        ...,
        description="List of funnel groups"
    )
    
    total: int = Field(
        ...,
        description="Total count of groups"
    )
    
    page: int = Field(
        1,
        ge=1,
        description="Current page number"
    )
    
    page_size: int = Field(
        20,
        ge=1,
        le=100,
        description="Items per page"
    )
    
    has_more: bool = Field(
        ...,
        description="Whether more pages exist"
    )
    
    @computed_field
    @property
    def total_pages(self) -> int:
        """Calculate total pages."""
        return (self.total + self.page_size - 1) // self.page_size


class FunnelGroupStats(BaseModel):
    """Detailed group statistics."""
    
    group_id: str
    funnels_count: int = 0
    active_funnels_count: int = 0
    draft_funnels_count: int = 0
    paused_funnels_count: int = 0
    total_views: int = 0
    total_starts: int = 0
    total_completions: int = 0
    total_leads: int = 0
    conversion_rate: float = Field(0.0, ge=0.0, le=100.0)
    avg_completion_time: Optional[float] = None
    last_lead_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class FunnelGroupDelete(BaseModel):
    """Response for group deletion."""
    
    group_id: str
    message: str = "Funnel group deleted successfully"
    deleted_at: datetime
    hard_delete: bool = False


# =============================================================================
# QUERY PARAMETERS
# =============================================================================

class FunnelGroupQueryParams(BaseModel):
    """Query parameters for filtering/sorting funnel groups."""
    
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")
    
    group_type: Optional[GroupTypeEnum] = Field(None, description="Filter by type")
    status: Optional[GroupStatusEnum] = Field(None, description="Filter by status")
    search: Optional[str] = Field(None, max_length=255, description="Search in name/description")
    tags: Optional[List[str]] = Field(None, description="Filter by tags (OR)")
    
    sort_by: str = Field(
        "created_at",
        description="Sort field",
        pattern="^(created_at|updated_at|name|funnels_count|total_leads|total_views)$"
    )
    
    sort_order: str = Field(
        "desc",
        description="Sort order",
        pattern="^(asc|desc)$"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "page": 1,
                "page_size": 20,
                "group_type": "product",
                "status": "active",
                "search": "acne",
                "tags": ["skincare", "acne"],
                "sort_by": "created_at",
                "sort_order": "desc"
            }
        }
    )


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "GroupTypeEnum",
    "GroupStatusEnum",
    "FunnelGroupBase",
    "FunnelGroupCreate",
    "FunnelGroupUpdate",
    "FunnelGroupResponse",
    "FunnelGroupListItem",
    "FunnelGroupList",
    "FunnelGroupStats",
    "FunnelGroupDelete",
    "FunnelGroupQueryParams",
]
