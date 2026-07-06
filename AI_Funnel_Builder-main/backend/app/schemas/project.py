# =============================================================================
# AI FUNNEL BUILDER - PROJECT SCHEMAS
# =============================================================================
# Pydantic schemas for Project resource (create, update, response)
# =============================================================================

from pydantic import BaseModel, Field, ConfigDict, field_validator, computed_field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from app.models.project import BrandVoiceEnum, IndustryEnum

# =============================================================================
# BASE SCHEMAS
# =============================================================================


class ProjectBase(BaseModel):
    """Base project fields shared across schemas."""

    # Use enum values in JSON (e.g. "saas", "professional")
    model_config = ConfigDict(use_enum_values=True)

    name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Project/brand name",
        examples=["Glow Skincare", "FitLife Coaching", "TechStart SaaS"],
    )

    description: Optional[str] = Field(
        None,
        max_length=2000,
        description="Project description",
        examples=["Premium skincare for sensitive skin"],
    )

    industry: Optional[IndustryEnum] = Field(
        None,
        description="Business industry category",
    )

    website: Optional[str] = Field(
        None,
        max_length=500,
        description="Primary website URL",
        examples=["https://glowskincare.com"],
    )

    mission_problem: Optional[str] = Field(
        None,
        max_length=1000,
        description="Brand mission pain/problem this business solves",
        examples=["Helps people achieve clear skin without harsh chemicals"],
    )

    brand_voice: Optional[BrandVoiceEnum] = Field(
        BrandVoiceEnum.PROFESSIONAL,
        description="Brand voice/tone for AI content generation",
    )

    default_audience: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Default target audience profile",
        examples=[
            {
                "age_range": "25-45",
                "gender": "all",
                "interests": ["skincare", "wellness"],
                "pain_points": ["acne", "dry skin"],
            }
        ],
    )

    settings: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Project settings (timezone, currency, language)",
        examples=[
            {
                "timezone": "America/New_York",
                "currency": "USD",
                "language": "en",
                "date_format": "MM/DD/YYYY",
            }
        ],
    )

    # --- Normalization validators for enums ---

    @field_validator("industry", mode="before")
    @classmethod
    def normalize_industry(cls, v):
        """Accept case-insensitive strings and normalize to enum value."""
        if v is None:
            return v
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("brand_voice", mode="before")
    @classmethod
    def normalize_brand_voice(cls, v):
        """Accept case-insensitive strings and normalize to enum value."""
        if v is None:
            return v
        if isinstance(v, str):
            return v.strip().lower()
        return v


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================


class ProjectCreate(ProjectBase):
    """Schema for creating a new project."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Glow Skincare",
                "description": "Premium natural skincare for sensitive skin",
                "industry": "beauty_skincare",
                "website": "https://glowskincare.com",
                "mission_problem": "Helps people achieve clear, healthy skin without harsh chemicals",
                "brand_voice": "friendly",
                "default_audience": {
                    "age_range": "25-45",
                    "gender": "female",
                    "interests": ["skincare", "natural beauty", "wellness"],
                    "pain_points": ["acne", "sensitive skin", "aging"],
                },
                "settings": {
                    "timezone": "America/New_York",
                    "currency": "USD",
                    "language": "en",
                },
            }
        }
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate project name."""
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Project name must be at least 2 characters")
        return v

    @field_validator("website")
    @classmethod
    def validate_website(cls, v: Optional[str]) -> Optional[str]:
        """Validate and normalize website URL."""
        if v:
            v = v.strip()
            if not v.startswith(("http://", "https://")):
                v = f"https://{v}"
        return v

    @field_validator("mission_problem")
    @classmethod
    def validate_mission_problem(cls, v: Optional[str]) -> Optional[str]:
        """Validate mission problem is concise."""
        if v:
            v = v.strip()
            if len(v) > 1000:
                raise ValueError("Mission problem should be concise (max 1000 chars)")
        return v


class ProjectUpdate(BaseModel):
    """Schema for updating a project (all fields optional)."""

    name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255,
        description="Project/brand name",
    )

    description: Optional[str] = Field(
        None,
        max_length=2000,
        description="Project description",
    )

    industry: Optional[IndustryEnum] = Field(
        None,
        description="Business industry category",
    )

    website: Optional[str] = Field(
        None,
        max_length=500,
        description="Primary website URL",
    )

    mission_problem: Optional[str] = Field(
        None,
        max_length=1000,
        description="Brand mission pain/problem",
    )

    brand_voice: Optional[BrandVoiceEnum] = Field(
        None,
        description="Brand voice/tone",
    )

    default_audience: Optional[Dict[str, Any]] = Field(
        None,
        description="Default target audience profile",
    )

    settings: Optional[Dict[str, Any]] = Field(
        None,
        description="Project settings",
    )

    is_active: Optional[bool] = Field(
        None,
        description="Whether project is active",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Project Name",
                "brand_voice": "luxury",
                "is_active": True,
            }
        }
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate project name if provided."""
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Project name must be at least 2 characters")
        return v

    @field_validator("website")
    @classmethod
    def validate_website(cls, v: Optional[str]) -> Optional[str]:
        """Validate and normalize website URL if provided."""
        if v:
            v = v.strip()
            if not v.startswith(("http://", "https://")):
                v = f"https://{v}"
        return v

    @field_validator("industry", mode="before")
    @classmethod
    def normalize_industry(cls, v):
        """Accept case-insensitive strings and normalize to enum value."""
        if v is None:
            return v
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("brand_voice", mode="before")
    @classmethod
    def normalize_brand_voice(cls, v):
        """Accept case-insensitive strings and normalize to enum value."""
        if v is None:
            return v
        if isinstance(v, str):
            return v.strip().lower()
        return v


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================


class ProjectResponse(ProjectBase):
    """Schema for project response (includes IDs, timestamps, stats)."""

    project_id: str = Field(
        ...,
        description="Unique project identifier",
    )

    user_id: str = Field(
        ...,
        description="Owner user ID",
    )

    created_at: datetime = Field(
        ...,
        description="Project creation timestamp",
    )

    updated_at: datetime = Field(
        ...,
        description="Last update timestamp",
    )

    is_active: bool = Field(
        ...,
        description="Whether project is active",
    )

    is_deleted: bool = Field(
        ...,
        description="Soft delete flag",
    )

    deleted_at: Optional[datetime] = Field(
        None,
        description="Deletion timestamp",
    )

    last_activity_at: Optional[datetime] = Field(
        None,
        description="Last activity timestamp",
    )

    # Statistics
    groups_count: int = Field(
        0,
        description="Total funnel groups in this project",
    )

    funnels_count: int = Field(
        0,
        description="Total funnels across all groups",
    )

    total_leads: int = Field(
        0,
        description="Total leads captured across all funnels",
    )

    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional metadata",
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "project_id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Glow Skincare",
                "description": "Premium natural skincare",
                "industry": "beauty_skincare",
                "website": "https://glowskincare.com",
                "mission_problem": "Helps people achieve clear skin without harsh chemicals",
                "brand_voice": "friendly",
                "created_at": "2025-12-10T14:30:00Z",
                "updated_at": "2025-12-10T14:30:00Z",
                "is_active": True,
                "is_deleted": False,
                "groups_count": 3,
                "funnels_count": 12,
                "total_leads": 456,
            }
        },
    )


class ProjectListItem(BaseModel):
    """Lightweight schema for project list view."""

    project_id: str
    name: str
    description: Optional[str] = None
    industry: Optional[IndustryEnum] = None
    brand_voice: Optional[BrandVoiceEnum] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    groups_count: int = 0
    funnels_count: int = 0
    total_leads: int = 0
    last_activity_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class ProjectList(BaseModel):
    """Paginated list of projects."""

    items: List[ProjectListItem] = Field(
        ...,
        description="List of projects",
    )

    total: int = Field(
        ...,
        description="Total count of projects",
    )

    page: int = Field(
        1,
        ge=1,
        description="Current page number",
    )

    page_size: int = Field(
        20,
        ge=1,
        le=100,
        description="Items per page",
    )

    has_more: bool = Field(
        ...,
        description="Whether more pages exist",
    )

    @computed_field
    @property
    def total_pages(self) -> int:
        """Calculate total pages."""
        return (self.total + self.page_size - 1) // self.page_size


class ProjectStats(BaseModel):
    """Detailed project statistics."""

    project_id: str
    groups_count: int = 0
    funnels_count: int = 0
    active_funnels_count: int = 0
    draft_funnels_count: int = 0
    total_views: int = 0
    total_starts: int = 0
    total_completions: int = 0
    total_leads: int = 0
    conversion_rate: float = Field(0.0, ge=0.0, le=100.0)
    avg_completion_time: Optional[float] = None  # seconds
    last_lead_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectDelete(BaseModel):
    """Response for project deletion."""

    project_id: str
    message: str = "Project deleted successfully"
    deleted_at: datetime
    hard_delete: bool = Field(
        False,
        description="Whether hard delete was performed",
    )


# =============================================================================
# QUERY PARAMETERS
# =============================================================================


class ProjectQueryParams(BaseModel):
    """Query parameters for filtering/sorting projects."""

    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")

    industry: Optional[IndustryEnum] = Field(
        None,
        description="Filter by industry",
    )
    is_active: Optional[bool] = Field(
        None,
        description="Filter by active status",
    )
    search: Optional[str] = Field(
        None,
        max_length=255,
        description="Search in name/description",
    )

    sort_by: str = Field(
        "created_at",
        description="Sort field",
        pattern="^(created_at|updated_at|name|groups_count|funnels_count|total_leads)$",
    )

    sort_order: str = Field(
        "desc",
        description="Sort order",
        pattern="^(asc|desc)$",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "page": 1,
                "page_size": 20,
                "industry": "beauty_skincare",
                "is_active": True,
                "search": "skincare",
                "sort_by": "created_at",
                "sort_order": "desc",
            }
        }
    )


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = [
    "IndustryEnum",
    "BrandVoiceEnum",
    "ProjectBase",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "ProjectListItem",
    "ProjectList",
    "ProjectStats",
    "ProjectDelete",
    "ProjectQueryParams",
]
