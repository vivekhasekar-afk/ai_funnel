"""
Funnel Schemas - Production Grade
=================================
Pydantic schemas for funnel management (quiz/survey/form),
configuration, publishing, and analytics.

**ENHANCED**: Now supports Project → Group → Funnel hierarchy
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, validator, field_validator, ConfigDict
from enum import Enum

from app.models.funnel import FunnelStatusEnum

# =============================================================================
# BASE SCHEMAS
# =============================================================================

class BaseSchema(BaseModel):
    """Base schema with common config."""
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()  # FIX: Allow model_ prefixed fields
    )

class TimestampSchema(BaseModel):
    """Timestamp schema for created/updated times."""
    created_at: Optional[datetime] = Field(None, description="Created timestamp")
    updated_at: Optional[datetime] = Field(None, description="Updated timestamp")

# =============================================================================
# MISSING SCHEMA (for question.py import)
# =============================================================================

class FunnelResponseMinimal(BaseModel):
    """Minimal funnel response for question schemas."""
    funnel_id: str = Field(..., description="Funnel ID")
    title: str = Field(..., description="Funnel title")
    status: str = Field(..., description="Funnel status")
    
    # NEW: Hierarchy info
    project_id: Optional[str] = Field(None, description="Parent project ID")
    group_id: Optional[str] = Field(None, description="Parent group ID")

    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

# =============================================================================
# ENUMS (matching model enums)
# =============================================================================

class FunnelTypeEnum(str, Enum):
    """Funnel types."""
    QUIZ = "quiz"
    SURVEY = "survey"
    FORM = "form"
    POLL = "poll"
    LEAD_MAGNET = "lead_magnet"
    PRODUCT_LAUNCH = "product_launch"
    WEBINAR = "webinar"
    WAITLIST = "waitlist"

class FunnelVisibilityEnum(str, Enum):
    """Funnel visibility."""
    PRIVATE = "private"
    UNLISTED = "unlisted"
    PUBLIC = "public"

# =============================================================================
# REQUEST SCHEMAS (Input)
# =============================================================================

class FunnelCreate(BaseModel):
    """Funnel creation schema."""
    title: str = Field(..., min_length=3, max_length=255, description="Funnel title")
    description: Optional[str] = Field(None, max_length=2000, description="Funnel description")
    niche: Optional[str] = Field(None, max_length=100, description="Industry/niche")
    primary_goal: Optional[str] = Field(None, max_length=50, description="Primary goal")
    funnel_type: FunnelTypeEnum = Field(FunnelTypeEnum.QUIZ, description="Funnel type")
    language: str = Field("en", max_length=10, description="Language code")

    # NEW: Hierarchy foreign keys
    project_id: Optional[str] = Field(
        None,
        description="Parent project ID (optional - for organized workflows)"
    )
    group_id: Optional[str] = Field(
        None,
        description="Parent funnel group ID (optional - product/category/campaign)"
    )

    # AI generation context (optional)
    ai_prompt: Optional[str] = Field(None, max_length=1000, description="AI generation prompt")
    target_audience: Optional[str] = Field(None, max_length=200, description="Target audience description")
    brand_voice: Optional[str] = Field(None, max_length=100, description="Brand voice")

    # Configuration
    config: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Funnel configuration (theme, layout, logic)",
    )

    # Layout & Theme (NEW: support for visual builder)
    layout: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Page layout structure"
    )
    theme: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Design system (colors, fonts, spacing)"
    )
    
    # Theme preset shortcut
    theme_preset: Optional[str] = Field(
        None,
        description="Apply built-in theme (modern, minimal, bold, elegant)"
    )

    # Tags
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags for organization")
    target_platforms: Optional[List[str]] = Field(default_factory=list, description="Target platforms")

    @field_validator("tags", "target_platforms")
    @classmethod
    def limit_list_size(cls, v):
        """Limit list sizes."""
        if v and len(v) > 20:
            raise ValueError("Maximum 20 items allowed")
        return v

    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelUpdate(BaseModel):
    """Funnel update schema."""
    title: Optional[str] = Field(None, min_length=3, max_length=255, description="Funnel title")
    description: Optional[str] = Field(None, max_length=2000, description="Description")
    niche: Optional[str] = Field(None, max_length=100, description="Niche")
    primary_goal: Optional[str] = Field(None, max_length=50, description="Primary goal")
    visibility: Optional[FunnelVisibilityEnum] = Field(None, description="Visibility setting")
    
    # NEW: Allow moving between projects/groups
    project_id: Optional[str] = Field(None, description="Move to different project (null to unassign)")
    group_id: Optional[str] = Field(None, description="Move to different group (null to unassign)")
    
    config: Optional[Dict[str, Any]] = Field(None, description="Configuration updates")
    layout: Optional[Dict[str, Any]] = Field(None, description="Layout updates")
    theme: Optional[Dict[str, Any]] = Field(None, description="Theme updates")
    tags: Optional[List[str]] = Field(None, description="Tags")
    target_platforms: Optional[List[str]] = Field(None, description="Target platforms")
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelPublish(BaseModel):
    """Funnel publish schema."""
    version: Optional[int] = Field(None, description="Version number for publishing")
    publish_notes: Optional[str] = Field(None, max_length=500, description="Notes about this version")
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelClone(BaseModel):
    """Funnel clone schema."""
    new_title: Optional[str] = Field(None, max_length=255, description="Title for cloned funnel")
    include_stats: bool = Field(False, description="Include performance stats in clone")
    
    # NEW: Clone to different project/group
    target_project_id: Optional[str] = Field(None, description="Clone to different project")
    target_group_id: Optional[str] = Field(None, description="Clone to different group")
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelConfigUpdate(BaseModel):
    """Funnel configuration partial update."""
    theme: Optional[Dict[str, Any]] = Field(None, description="Theme settings")
    layout: Optional[Dict[str, Any]] = Field(None, description="Layout settings")
    logic: Optional[List[Dict[str, Any]]] = Field(None, description="Conditional logic rules")
    scoring: Optional[Dict[str, Any]] = Field(None, description="Scoring configuration")
    results: Optional[Dict[str, Any]] = Field(None, description="Results configuration")
    email_gate: Optional[Dict[str, Any]] = Field(None, description="Email gate settings")
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

# =============================================================================
# RESPONSE SCHEMAS (Output)
# =============================================================================

class FunnelList(BaseSchema):
    """Funnel list item (for dashboard cards)."""
    funnel_id: str = Field(..., description="Funnel ID")
    title: str = Field(..., description="Funnel title")
    slug: str = Field(..., description="URL slug")
    status: FunnelStatusEnum = Field(..., description="Status")
    funnel_type: FunnelTypeEnum = Field(..., description="Type")
    niche: Optional[str] = Field(None, description="Niche")

    # NEW: Hierarchy info
    project_id: Optional[str] = Field(None, description="Parent project ID")
    group_id: Optional[str] = Field(None, description="Parent group ID")
    hierarchy_path: Optional[str] = Field(None, description="Full hierarchy path")

    # Stats
    views_count: int = Field(..., description="Total views")
    starts_count: int = Field(..., description="Total starts")
    completes_count: int = Field(..., description="Total completions")
    leads_count: int = Field(..., description="Total leads")
    completion_rate: float = Field(..., description="Completion rate (0.0-1.0)")

    # Timestamps
    created_at: datetime = Field(..., description="Creation date")
    last_published_at: Optional[datetime] = Field(None, description="Last publish date")

class FunnelResponse(BaseSchema, TimestampSchema):
    """Full funnel response (for creator dashboard)."""
    funnel_id: str = Field(..., description="Funnel ID")
    user_id: str = Field(..., description="Owner user ID")
    title: str = Field(..., description="Funnel title")
    description: Optional[str] = Field(None, description="Description")
    slug: str = Field(..., description="URL slug")
    niche: Optional[str] = Field(None, description="Niche")
    primary_goal: Optional[str] = Field(None, description="Primary goal")
    funnel_type: FunnelTypeEnum = Field(..., description="Type")
    status: FunnelStatusEnum = Field(..., description="Status")
    visibility: FunnelVisibilityEnum = Field(..., description="Visibility")
    language: str = Field(..., description="Language code")

    # NEW: Hierarchy foreign keys
    project_id: Optional[str] = Field(None, description="Parent project ID")
    group_id: Optional[str] = Field(None, description="Parent group ID")
    hierarchy_path: Optional[str] = Field(None, description="Full hierarchy path (Project → Group → Funnel)")

    # Configuration
    config: Dict[str, Any] = Field(..., description="Funnel configuration")
    layout: Optional[Dict[str, Any]] = Field(None, description="Page layout structure")
    theme: Optional[Dict[str, Any]] = Field(None, description="Design system")
    seo_metadata: Optional[Dict[str, Any]] = Field(None, description="SEO metadata")
    ai_metadata: Optional[Dict[str, Any]] = Field(None, description="AI generation metadata")

    # Performance
    views_count: int = Field(..., description="Views")
    starts_count: int = Field(..., description="Starts")
    completes_count: int = Field(..., description="Completions")
    leads_count: int = Field(..., description="Leads")
    completion_rate: float = Field(..., description="Completion rate")
    view_to_lead_rate: float = Field(..., description="View to lead rate")

    # Metadata
    tags: Optional[List[str]] = Field(None, description="Tags")
    target_platforms: Optional[List[str]] = Field(None, description="Target platforms")

    # Publishing
    last_published_at: Optional[datetime] = Field(None, description="Last publish date")
    published_version: Optional[int] = Field(None, description="Published version")

class FunnelDetail(FunnelResponse):
    """Funnel detail with embedded questions."""
    questions: List[Any] = Field(default_factory=list, description="Funnel questions")
    question_count: int = Field(..., description="Total questions")

class FunnelPublic(BaseSchema):
    """Public funnel view (for hosted funnel page)."""
    funnel_id: str = Field(..., description="Funnel ID")
    slug: str = Field(..., description="URL slug")
    title: str = Field(..., description="Title")
    description: Optional[str] = Field(None, description="Description")
    niche: Optional[str] = Field(None, description="Niche")
    funnel_type: FunnelTypeEnum = Field(..., description="Type")
    language: str = Field(..., description="Language")
    config: Dict[str, Any] = Field(..., description="Configuration")
    layout: Optional[Dict[str, Any]] = Field(None, description="Layout")
    theme: Optional[Dict[str, Any]] = Field(None, description="Theme")
    seo_metadata: Optional[Dict[str, Any]] = Field(None, description="SEO metadata")
    questions: List[Any] = Field(default_factory=list, description="Questions")

class FunnelStats(BaseModel):
    """Funnel statistics (detailed)."""
    funnel_id: str = Field(..., description="Funnel ID")

    # Core metrics
    total_views: int = Field(..., description="Total views")
    unique_visitors: int = Field(..., description="Unique visitors")
    total_starts: int = Field(..., description="Total starts")
    total_completes: int = Field(..., description="Total completions")
    total_abandons: int = Field(..., description="Total abandons")
    total_leads: int = Field(..., description="Total leads")

    # Conversion rates
    view_to_start_rate: float = Field(..., description="View to start rate")
    start_to_complete_rate: float = Field(..., description="Start to complete rate")
    view_to_complete_rate: float = Field(..., description="Overall conversion rate")
    view_to_lead_rate: float = Field(..., description="Lead capture rate")
    abandon_rate: float = Field(..., description="Abandon rate")

    # Engagement
    avg_time_to_complete_seconds: Optional[int] = Field(None, description="Avg completion time")
    avg_questions_answered: Optional[float] = Field(None, description="Avg questions answered")

    # Time period
    period_start: Optional[datetime] = Field(None, description="Stats period start")
    period_end: Optional[datetime] = Field(None, description="Stats period end")

    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelStatsBreakdown(BaseModel):
    """Funnel stats with breakdowns."""
    stats: FunnelStats = Field(..., description="Core stats")
    device_breakdown: Dict[str, int] = Field(..., description="Views by device")
    country_breakdown: Dict[str, int] = Field(..., description="Views by country")
    utm_source_breakdown: Dict[str, int] = Field(..., description="Views by UTM source")
    daily_trend: List[Dict[str, Any]] = Field(..., description="Daily metrics")
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelAIInsights(BaseModel):
    """AI-generated insights for funnel optimization."""
    funnel_id: str = Field(..., description="Funnel ID")
    overall_score: float = Field(..., ge=0, le=100, description="Overall performance score (0-100)")

    # Insights
    strengths: List[str] = Field(..., description="What's working well")
    weaknesses: List[str] = Field(..., description="Areas for improvement")
    recommendations: List[str] = Field(..., description="Actionable recommendations")

    # Benchmarks
    completion_rate_vs_benchmark: Dict[str, Any] = Field(..., description="Completion rate comparison")
    lead_rate_vs_benchmark: Dict[str, Any] = Field(..., description="Lead rate comparison")

    # Question performance
    top_performing_questions: List[Dict[str, Any]] = Field(..., description="Best questions")
    problem_questions: List[Dict[str, Any]] = Field(..., description="Questions needing work")

    generated_at: datetime = Field(..., description="When insights were generated")
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelDuplicate(BaseModel):
    """Response for funnel duplication."""
    original_funnel_id: str = Field(..., description="Original funnel ID")
    new_funnel_id: str = Field(..., description="New funnel ID")
    new_slug: str = Field(..., description="New funnel slug")
    message: str = Field(..., description="Success message")
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelShareSettings(BaseModel):
    """Funnel sharing settings update."""
    visibility: FunnelVisibilityEnum = Field(..., description="Visibility level")
    password_protected: bool = Field(False, description="Require password to access")
    password: Optional[str] = Field(None, min_length=6, description="Access password")
    expires_at: Optional[datetime] = Field(None, description="Link expiration")

    @field_validator("password")
    @classmethod
    def validate_password_requirement(cls, v, info):
        """Validate password is provided if password_protected is True."""
        if info.data.get("password_protected") and not v:
            raise ValueError("Password required when password_protected is True")
        return v

    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

# =============================================================================
# BULK OPERATIONS
# =============================================================================

class FunnelBulkDelete(BaseModel):
    """Bulk delete funnels."""
    funnel_ids: List[str] = Field(..., min_length=1, max_length=50, description="Funnel IDs to delete")
    confirm: bool = Field(..., description="Confirmation flag")

    @field_validator("confirm")
    @classmethod
    def validate_confirmation(cls, v):
        """Ensure user confirmed deletion."""
        if not v:
            raise ValueError("You must confirm bulk deletion")
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelBulkArchive(BaseModel):
    """Bulk archive funnels."""
    funnel_ids: List[str] = Field(..., min_length=1, max_length=50, description="Funnel IDs to archive")
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelBulkMove(BaseModel):
    """Bulk move funnels to different project/group (NEW)."""
    funnel_ids: List[str] = Field(..., min_length=1, max_length=50, description="Funnel IDs to move")
    target_project_id: Optional[str] = Field(None, description="Target project (null to unassign)")
    target_group_id: Optional[str] = Field(None, description="Target group (null to unassign)")
    
    @field_validator("funnel_ids")
    @classmethod
    def validate_funnel_ids(cls, v):
        """Remove duplicates and validate count."""
        if not v:
            raise ValueError("At least one funnel ID is required")
        if len(v) > 50:
            raise ValueError("Cannot move more than 50 funnels at once")
        return list(set(v))  # Remove duplicates
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "funnel_ids": ["funnel-1", "funnel-2"],
                "target_project_id": "project-abc",
                "target_group_id": "group-xyz"
            }
        }
    )

class FunnelPublishRequest(BaseModel):
    """Request to publish a funnel (create new version)."""
    publish_version: Optional[int] = Field(None, description="Version number for this publish")
    publish_notes: Optional[str] = Field(None, max_length=500, description="Release notes")
    make_public: Optional[bool] = Field(None, description="Set visibility to public")
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelListResponse(BaseModel):
    """Paginated funnel list response."""
    funnels: List[FunnelList] = Field(..., description="List of funnels")
    total_count: int = Field(..., description="Total number of funnels")
    page: int = Field(1, description="Current page")
    page_size: int = Field(20, description="Items per page")
    
    # NEW: Hierarchy filters applied
    filtered_by_project: Optional[str] = Field(None, description="Project filter applied")
    filtered_by_group: Optional[str] = Field(None, description="Group filter applied")
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

from typing import Dict, List, Any, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# 🎨 LAYOUT SCHEMAS (PRODUCTION-GRADE WITH CONTENT PRESERVATION)
# =============================================================================


class LayoutComponent(BaseModel):
    """
    Individual component within a section.
    
    Examples: Headline, Button, Form Field, Image, Video, etc.
    """
    id: str = Field(..., description="Unique component ID")
    type: str = Field(..., description="Component type (headline, form, button, image, video, etc.)")
    
    # ✅ CRITICAL: Content field for flexible data
    content: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Component content (text, src, value, placeholder, etc.)"
    )
    
    # Props (configuration)
    props: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Component properties and configuration"
    )
    
    # Styles
    styles: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Component-specific styles (CSS-in-JS)"
    )
    
    # Positioning
    position: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Position/layout settings (grid, flex)"
    )
    
    # Behavior
    events: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Event handlers (onClick, onChange, etc.)"
    )
    
    # Validation (for form fields)
    validation: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Validation rules for form components"
    )
    
    # Visibility
    visible: Optional[bool] = Field(default=True)
    conditions: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Conditional rendering rules"
    )
    
    model_config = ConfigDict(
        extra="allow",  # ✅ Allows any extra fields from visual editor
        from_attributes=True,
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "id": "headline-1",
                "type": "headline",
                "content": {
                    "text": "Transform Your Business",
                    "tag": "h1"
                },
                "props": {
                    "align": "center",
                    "animated": True
                },
                "styles": {
                    "fontSize": 48,
                    "fontWeight": "bold",
                    "color": "#111827"
                }
            }
        }
    )


class LayoutSection(BaseModel):
    """
    Section within a step (hero, form, testimonials, CTA, etc.).
    
    A section groups related components together.
    """
    id: str = Field(..., description="Unique section ID")
    type: str = Field(..., description="Section type (hero, form, cta, testimonial, features, etc.)")
    name: Optional[str] = Field(None, description="Human-readable section name")
    
    # ✅ CRITICAL: Content field for section-level data
    content: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Section-level content (headline, subheadline, description, etc.)"
    )
    
    # Layout & Styling
    background: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Background (color, image, gradient, video)"
    )
    padding: Optional[Dict[str, int]] = Field(
        default_factory=dict,
        description="Padding (top, right, bottom, left)"
    )
    margin: Optional[Dict[str, int]] = Field(
        default_factory=dict,
        description="Margin values"
    )
    styles: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional CSS styles"
    )
    
    # Layout type
    layout: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Layout configuration (grid, flex, columns)"
    )
    
    # Components within section
    components: List[LayoutComponent] = Field(
        default_factory=list,
        description="Array of child components"
    )
    
    # Visibility & Animation
    visible: Optional[bool] = Field(default=True)
    animation: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Entry/exit animations"
    )
    conditions: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Conditional rendering rules"
    )
    
    # Order
    order: Optional[int] = Field(default=0, description="Display order within step")
    
    model_config = ConfigDict(
        extra="allow",  # ✅ Allows any extra fields
        from_attributes=True,
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "id": "hero-1",
                "type": "hero",
                "name": "Main Hero Section",
                "content": {
                    "headline": "Welcome to Our Platform",
                    "subheadline": "Get started in minutes",
                    "ctaText": "Start Free Trial",
                    "ctaUrl": "/signup"
                },
                "background": {
                    "type": "gradient",
                    "colors": ["#3B82F6", "#8B5CF6"]
                },
                "padding": {
                    "top": 80,
                    "bottom": 80
                },
                "components": [
                    {
                        "id": "headline-1",
                        "type": "headline",
                        "content": {"text": "Welcome"}
                    }
                ]
            }
        }
    )


class LayoutStep(BaseModel):
    """
    Individual step/page in the funnel.
    
    Each step represents a page or screen in the funnel flow.
    """
    id: str = Field(..., description="Unique step ID")
    name: str = Field(..., description="Step name (for editor/preview)")
    type: Optional[str] = Field(default="page", description="Step type (page, modal, popup)")
    
    # ✅ Content field for step-level data
    content: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Step-level content and metadata"
    )
    
    # Sections within step
    sections: List[LayoutSection] = Field(
        default_factory=list,
        description="Array of sections"
    )
    
    # Step configuration
    path: Optional[str] = Field(None, description="URL path for this step")
    order: Optional[int] = Field(default=0, description="Step order in funnel flow")
    
    # Transitions
    transitions: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Page transition animations"
    )
    
    # Settings
    settings: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Step-level settings (tracking, redirects, etc.)"
    )
    
    # Metadata
    meta: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Step metadata (title, description for preview)"
    )
    
    model_config = ConfigDict(
        extra="allow",  # ✅ Allows any extra fields
        from_attributes=True,
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "id": "step-landing",
                "name": "Landing Page",
                "type": "page",
                "order": 1,
                "sections": [
                    {
                        "id": "hero-1",
                        "type": "hero",
                        "content": {
                            "headline": "Welcome!"
                        }
                    }
                ]
            }
        }
    )


class ResponsiveConfig(BaseModel):
    """Responsive breakpoints and overrides."""
    mobile: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Mobile breakpoint (max-width: 768px)"
    )
    tablet: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Tablet breakpoint (768px - 1024px)"
    )
    desktop: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Desktop breakpoint (min-width: 1024px)"
    )
    
    # Custom breakpoints
    custom: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Custom breakpoints"
    )
    
    model_config = ConfigDict(
        extra="allow",
        from_attributes=True
    )


class FunnelLayoutUpdate(BaseModel):
    """
    Complete layout structure update.
    
    Represents the entire funnel layout with all steps, sections, and components.
    """
    # Template (optional base template)
    template: Optional[str] = Field(
        None,
        description="Base template (minimal, hero-split, multi-step, etc.)"
    )
    
    # Steps (pages)
    steps: List[LayoutStep] = Field(
        default_factory=list,
        description="Array of funnel steps/pages"
    )
    
    # Global settings
    globals: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Global layout variables (colors, fonts, spacing)"
    )
    
    # Responsive configuration
    responsive: Optional[ResponsiveConfig] = Field(
        default_factory=ResponsiveConfig,
        description="Responsive breakpoint configurations"
    )
    
    # Grid system
    grid: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Grid system settings (columns, gutters)"
    )
    
    # Navigation
    navigation: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Navigation settings (progress bar, breadcrumbs)"
    )
    
    # Metadata
    version: Optional[str] = Field(default="1.0.0", description="Layout schema version")
    lastModified: Optional[str] = Field(None, description="Last modification timestamp")
    
    model_config = ConfigDict(
        extra="allow",  # ✅ Critical for flexible layouts
        from_attributes=True,
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "template": "hero-split",
                "steps": [
                    {
                        "id": "step-1",
                        "name": "Landing",
                        "sections": [
                            {
                                "id": "hero-1",
                                "type": "hero",
                                "content": {
                                    "headline": "50% Off Sale",
                                    "subheadline": "Limited time offer"
                                },
                                "components": [
                                    {
                                        "id": "cta-1",
                                        "type": "button",
                                        "content": {
                                            "text": "Shop Now"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "responsive": {
                    "mobile": {"maxWidth": 768},
                    "desktop": {"minWidth": 1024}
                },
                "version": "1.0.0"
            }
        }
    )

# =============================================================================
# 🎨 THEME SCHEMAS (PRODUCTION-GRADE - INTEGER-BASED)
# =============================================================================

from typing import Optional, Dict, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re


# =============================================================================
# COLOR SYSTEM
# =============================================================================

class ThemeColors(BaseModel):
    """
    Color palette with hex validation.
    """
    # Brand colors
    primary: Optional[str] = Field(
        default="#3B82F6",
        pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$',
        description="Primary brand color"
    )
    secondary: Optional[str] = Field(
        default="#8B5CF6",
        pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$'
    )
    accent: Optional[str] = Field(
        default="#F59E0B",
        pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$'
    )
    
    # Surfaces
    background: Optional[str] = Field(
        default="#FFFFFF",
        pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$'
    )
    surface: Optional[str] = Field(
        default="#F9FAFB",
        pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$'
    )
    
    # Text
    text: Optional[str] = Field(
        default="#111827",
        pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$'
    )
    textSecondary: Optional[str] = Field(
        default="#6B7280",
        pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$'
    )
    
    # Borders
    border: Optional[str] = Field(
        default="#E5E7EB",
        pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$'
    )
    
    # Semantic
    success: Optional[str] = Field(default="#10B981", pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$')
    error: Optional[str] = Field(default="#EF4444", pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$')
    warning: Optional[str] = Field(default="#F59E0B", pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$')
    info: Optional[str] = Field(default="#3B82F6", pattern=r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$')
    
    # Advanced
    custom: Optional[Dict[str, str]] = Field(default=None)
    
    @field_validator('custom')
    @classmethod
    def validate_custom_colors(cls, v):
        if v is None:
            return v
        hex_pattern = re.compile(r'^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$')
        for key, color in v.items():
            if not hex_pattern.match(color):
                raise ValueError(f"Custom color '{key}' must be a valid hex code")
        return v
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "primary": "#3B82F6",
                "background": "#FFFFFF",
                "text": "#111827"
            }
        }
    )


# =============================================================================
# TYPOGRAPHY SYSTEM
# =============================================================================

class ThemeTypography(BaseModel):
    """Typography system with explicit validation."""
    
    # Font Families (strings)
    headingFont: str = Field(default="Inter, sans-serif")
    bodyFont: str = Field(default="Inter, sans-serif")
    monoFont: str = Field(default="'IBM Plex Mono', monospace")
    
    # Font Sizes (integers in pixels)
    headingSize: int = Field(default=36, ge=12, le=120, description="Heading size in pixels")
    subheadingSize: int = Field(default=24, ge=12, le=80, description="Subheading size in pixels")
    bodySize: int = Field(default=16, ge=10, le=32, description="Body text size in pixels")
    smallSize: int = Field(default=14, ge=8, le=24, description="Small text size in pixels")
    
    # Font Weights (validated integers)
    headingWeight: Literal[300, 400, 500, 600, 700, 800, 900] = Field(default=700)
    bodyWeight: Literal[300, 400, 500, 600, 700] = Field(default=400)
    boldWeight: Literal[500, 600, 700, 800, 900] = Field(default=600)
    
    # Line Heights (decimals as floats)
    headingLineHeight: float = Field(default=1.2, ge=1.0, le=2.0)
    bodyLineHeight: float = Field(default=1.6, ge=1.0, le=2.5)
    
    # Letter Spacing (integers in pixels, can be negative)
    headingLetterSpacing: int = Field(default=-1, ge=-5, le=10)
    bodyLetterSpacing: int = Field(default=0, ge=-5, le=10)
    
    # Advanced
    customScale: Optional[Dict[str, int]] = Field(default=None)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "headingFont": "Inter, sans-serif",
                "bodyFont": "Roboto, sans-serif",
                "headingSize": 36,
                "bodySize": 16,
                "headingWeight": 700
            }
        }
    )


# =============================================================================
# SPACING SYSTEM (INTEGER-BASED IN PIXELS)
# =============================================================================

class ThemeSpacing(BaseModel):
    """
    Spacing scale in pixels (integers).
    Frontend applies 'px' unit when rendering.
    """
    unit: int = Field(default=8, ge=4, le=16, description="Base unit in pixels")
    
    # Standard scale
    xs: Optional[int] = Field(default=4, ge=0, le=1000)
    sm: Optional[int] = Field(default=8, ge=0, le=1000)
    md: Optional[int] = Field(default=16, ge=0, le=1000)
    lg: Optional[int] = Field(default=24, ge=0, le=1000)
    xl: Optional[int] = Field(default=32, ge=0, le=1000)
    xl2: Optional[int] = Field(default=48, ge=0, le=1000, alias="2xl")
    xl3: Optional[int] = Field(default=64, ge=0, le=1000, alias="3xl")
    
    # Semantic spacing
    sectionPadding: Optional[int] = Field(default=48, ge=0, le=200)
    containerPadding: Optional[int] = Field(default=24, ge=0, le=200)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "unit": 8,
                "sm": 8,
                "md": 16,
                "lg": 24,
                "xl": 32,
                "2xl": 48
            }
        }
    )


# =============================================================================
# BORDER RADIUS SYSTEM (INTEGER-BASED IN PIXELS)
# =============================================================================

class ThemeBorderRadius(BaseModel):
    """Border radius in pixels (integers)."""
    
    none: int = Field(default=0, ge=0, le=1000)
    sm: int = Field(default=4, ge=0, le=100)
    md: int = Field(default=8, ge=0, le=100)
    lg: int = Field(default=12, ge=0, le=100)
    xl: int = Field(default=16, ge=0, le=100)
    xl2: int = Field(default=24, ge=0, le=100, alias="2xl")
    full: int = Field(default=9999, ge=0, le=9999, description="Fully rounded")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "sm": 4,
                "md": 8,
                "lg": 12,
                "2xl": 24,
                "full": 9999
            }
        }
    )


# =============================================================================
# SHADOW SYSTEM (CSS STRINGS)
# =============================================================================

class ThemeShadows(BaseModel):
    """Shadow definitions as CSS strings."""
    
    none: str = Field(default="none")
    sm: str = Field(default="0 1px 2px 0 rgba(0, 0, 0, 0.05)")
    md: str = Field(default="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)")
    lg: str = Field(default="0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)")
    xl: str = Field(default="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)")
    xl2: str = Field(default="0 25px 50px -12px rgba(0, 0, 0, 0.25)", alias="2xl")
    inner: str = Field(default="inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)")
    
    custom: Optional[Dict[str, str]] = Field(default=None)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }
        }
    )


# =============================================================================
# COMPLETE THEME
# =============================================================================

class FunnelThemeUpdate(BaseModel):
    """Complete theme configuration."""
    
    colors: Optional[ThemeColors] = None
    typography: Optional[ThemeTypography] = None
    spacing: Optional[ThemeSpacing] = None
    borderRadius: Optional[ThemeBorderRadius] = None
    shadows: Optional[ThemeShadows] = None
    
    customCSS: Optional[str] = Field(default=None, max_length=10000)
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "colors": {
                    "primary": "#3B82F6",
                    "background": "#FFFFFF"
                },
                "typography": {
                    "headingFont": "Inter, sans-serif",
                    "headingSize": 36,
                    "bodySize": 16
                },
                "spacing": {
                    "unit": 8,
                    "md": 16,
                    "lg": 24
                },
                "borderRadius": {
                    "md": 12,
                    "lg": 16
                }
            }
        }
    )

# =============================================================================
# 📊 SEO SCHEMAS
# =============================================================================

class SEOOpenGraph(BaseModel):
    """Open Graph metadata"""
    title: Optional[str] = Field(None, max_length=60)
    description: Optional[str] = Field(None, max_length=160)
    image: Optional[HttpUrl] = None
    type: Optional[str] = Field("website", pattern=r'^(website|article|product)$')
    url: Optional[HttpUrl] = None
    
    model_config = ConfigDict(protected_namespaces=())

class SEOTwitterCard(BaseModel):
    """Twitter Card metadata"""
    card: Optional[str] = Field("summary_large_image", pattern=r'^(summary|summary_large_image|app|player)$')
    title: Optional[str] = Field(None, max_length=70)
    description: Optional[str] = Field(None, max_length=200)
    image: Optional[HttpUrl] = None
    creator: Optional[str] = Field(None, pattern=r'^@[A-Za-z0-9_]{1,15}$')
    
    model_config = ConfigDict(protected_namespaces=())

class FunnelSEOUpdate(BaseModel):
    """SEO metadata configuration"""
    title: Optional[str] = Field(None, max_length=60, description="Page title (SEO)")
    description: Optional[str] = Field(None, max_length=160, description="Meta description")
    keywords: Optional[List[str]] = Field(default_factory=list, max_length=10)
    og: Optional[SEOOpenGraph] = None
    twitter: Optional[SEOTwitterCard] = None
    canonical: Optional[HttpUrl] = Field(None, description="Canonical URL")
    robots: Optional[str] = Field("index, follow", pattern=r'^(index|noindex), (follow|nofollow)$')
    favicon: Optional[HttpUrl] = None
    
    @field_validator('keywords')
    @classmethod
    def validate_keywords(cls, v):
        if v and len(v) > 10:
            raise ValueError("Maximum 10 keywords allowed")
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

# =============================================================================
# 🎯 A/B TESTING SCHEMAS
# =============================================================================

class ABTestVariant(BaseModel):
    """Individual A/B test variant"""
    id: str = Field(..., description="Variant ID (e.g., 'control', 'variant-a')")
    name: str = Field(..., max_length=100, description="Variant display name")
    weight: int = Field(..., ge=0, le=100, description="Traffic percentage (0-100)")
    layoutOverrides: Optional[Dict[str, Any]] = Field(default_factory=dict)
    themeOverrides: Optional[Dict[str, Any]] = Field(default_factory=dict)
    description: Optional[str] = Field(None, max_length=500)
    
    model_config = ConfigDict(protected_namespaces=())

class FunnelABTestCreate(BaseModel):
    """Create A/B test configuration"""
    test_name: str = Field(..., max_length=100)
    variants: List[ABTestVariant] = Field(..., min_length=2, max_length=5)
    confidence_threshold: Optional[float] = Field(0.95, ge=0.8, le=0.99)
    
    @field_validator('variants')
    @classmethod
    def validate_weights(cls, v):
        total_weight = sum(variant.weight for variant in v)
        if total_weight != 100:
            raise ValueError(f"Variant weights must sum to 100, got {total_weight}")
        return v
    
    @field_validator('variants')
    @classmethod
    def validate_unique_ids(cls, v):
        ids = [variant.id for variant in v]
        if len(ids) != len(set(ids)):
            raise ValueError("Variant IDs must be unique")
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

# =============================================================================
# 📊 STATISTICS SCHEMAS
# =============================================================================

class FunnelStatsResponse(BaseModel):
    """Comprehensive funnel statistics"""
    funnel_id: str
    
    # Raw counts
    views_count: int = Field(..., description="Total page views")
    starts_count: int = Field(..., description="Users who started (answered Q1)")
    completes_count: int = Field(..., description="Users who completed")
    leads_count: int = Field(..., description="Total leads captured")
    
    # Conversion rates
    completion_rate: float = Field(..., ge=0, le=1, description="Completes / Starts")
    view_to_lead_rate: float = Field(..., ge=0, le=1, description="Leads / Views")
    start_rate: float = Field(..., ge=0, le=1, description="Starts / Views")
    abandonment_rate: float = Field(..., ge=0, le=1, description="(Starts - Completes) / Starts")
    
    # Time-based metrics
    period: str = Field(..., description="Time period (7d, 30d, 90d, all)")
    avg_completion_time: Optional[int] = Field(None, description="Average time to complete (seconds)")
    
    # Traffic sources
    traffic_sources: Optional[Dict[str, int]] = Field(default_factory=dict)
    device_breakdown: Optional[Dict[str, int]] = Field(default_factory=dict)
    question_stats: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

# =============================================================================
# EXPORT/IMPORT SCHEMAS
# =============================================================================

class FunnelExport(BaseModel):
    """Export funnel configuration"""
    funnel_id: str
    title: str
    layout: Dict[str, Any]
    theme: Dict[str, Any]
    questions: List[Dict[str, Any]]
    exported_at: datetime
    version: str = "1.0"
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

class FunnelImport(BaseModel):
    """Import funnel configuration"""
    title: str = Field(..., max_length=255)
    layout: Dict[str, Any]
    theme: Dict[str, Any]
    questions: List[Dict[str, Any]]
    
    # NEW: Import into specific project/group
    project_id: Optional[str] = Field(None, description="Import into project")
    group_id: Optional[str] = Field(None, description="Import into group")
    
    @field_validator('layout')
    @classmethod
    def validate_layout(cls, v):
        if not v:
            raise ValueError("Layout cannot be empty")
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Base
    "BaseSchema",
    "TimestampSchema",
    
    # Minimal
    "FunnelResponseMinimal",
    
    # Enums
    "FunnelTypeEnum",
    "FunnelStatusEnum",
    "FunnelVisibilityEnum",

    # Request schemas
    "FunnelCreate",
    "FunnelUpdate",
    "FunnelPublish",
    "FunnelClone",
    "FunnelConfigUpdate",
    "FunnelShareSettings",
    "FunnelBulkDelete",
    "FunnelBulkArchive",
    "FunnelBulkMove",
    "FunnelPublishRequest",

    # Response schemas
    "FunnelList",
    "FunnelResponse",
    "FunnelDetail",
    "FunnelPublic",
    "FunnelStats",
    "FunnelStatsBreakdown",
    "FunnelAIInsights",
    "FunnelDuplicate",
    "FunnelListResponse",

    # Layout schemas
    "LayoutComponent",
    "LayoutSection",
    "LayoutStep",
    "FunnelLayoutUpdate",
    
    # Theme schemas
    "ThemeColors",
    "ThemeTypography",
    "ThemeSpacing",
    "ThemeBorderRadius",
    "FunnelThemeUpdate",
    
    # SEO schemas
    "SEOOpenGraph",
    "SEOTwitterCard",
    "FunnelSEOUpdate",
    
    # A/B Testing
    "ABTestVariant",
    "FunnelABTestCreate",
    
    # Stats
    "FunnelStatsResponse",
    
    # Import/Export
    "FunnelExport",
    "FunnelImport",
]
