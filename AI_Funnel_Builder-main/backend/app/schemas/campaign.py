"""
Campaign Schemas - Production Grade
===================================
Pydantic schemas for brand campaign management, creator partnerships,
and ad platform integrations.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field, validator, ConfigDict, HttpUrl
from enum import Enum

from app.schemas import BaseSchema, TimestampSchema


# =============================================================================
# ENUMS
# =============================================================================


class CampaignStatusEnum(str, Enum):
    """Campaign lifecycle status."""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    PENDING_REVIEW = "pending_review"


class CampaignTypeEnum(str, Enum):
    """Campaign types."""
    UGC_COLLECTION = "ugc_collection"
    PRODUCT_SEEDING = "product_seeding"
    BRAND_AWARENESS = "brand_awareness"
    LEAD_GENERATION = "lead_generation"
    AUDIENCE_RESEARCH = "audience_research"
    INFLUENCER_VETTING = "influencer_vetting"


class CampaignGoalEnum(str, Enum):
    """Primary campaign goals."""
    REACH = "reach"
    ENGAGEMENT = "engagement"
    CONVERSIONS = "conversions"
    CONTENT = "content"
    PARTNERSHIPS = "partnerships"


class PaymentModelEnum(str, Enum):
    """Creator payment models."""
    FLAT_FEE = "flat_fee"
    PERFORMANCE = "performance"
    HYBRID = "hybrid"
    PRODUCT_ONLY = "product_only"


class DeploymentPlatformEnum(str, Enum):
    """Ad platform deployment targets."""
    META = "meta"
    GOOGLE = "google"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================


class CampaignCreate(BaseModel):
    """Campaign creation schema."""
    name: str = Field(..., min_length=3, max_length=255, description="Campaign name")
    description: Optional[str] = Field(None, max_length=2000, description="Campaign description")

    # Type and goal
    campaign_type: CampaignTypeEnum = Field(..., description="Campaign type")
    campaign_goal: CampaignGoalEnum = Field(..., description="Primary goal")

    # Timeline
    start_date: date = Field(..., description="Campaign start date")
    end_date: Optional[date] = Field(None, description="Campaign end date")

    # Budget
    budget: Decimal = Field(..., gt=0, description="Total campaign budget (USD)")

    # Target creators
    target_creator_criteria: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Creator targeting criteria",
    )

    # Goals/Targets
    target_leads: Optional[int] = Field(None, ge=0, description="Target lead count")
    target_conversions: Optional[int] = Field(None, ge=0, description="Target conversion count")
    target_reach: Optional[int] = Field(None, ge=0, description="Target impressions")
    target_content_pieces: Optional[int] = Field(None, ge=0, description="Target UGC pieces")

    # Payment
    payment_model: PaymentModelEnum = Field(..., description="Creator payment model")
    base_payment: Optional[Decimal] = Field(None, ge=0, description="Base payment per creator")
    performance_bonus_structure: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Performance bonus structure",
    )

    # Product seeding
    includes_product_seeding: bool = Field(False, description="Include product seeding")
    product_info: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Product details and shipping info",
    )

    # Content requirements
    content_requirements: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Content deliverables and guidelines",
    )

    # Associated funnels
    primary_funnel_id: Optional[str] = Field(None, description="Primary funnel ID")
    funnel_ids: Optional[List[str]] = Field(default_factory=list, description="All funnel IDs")

    # Tracking
    tracking_parameters: Optional[Dict[str, str]] = Field(
        default_factory=dict,
        description="UTM parameters",
    )

    # Tags
    tags: Optional[List[str]] = Field(default_factory=list, description="Organization tags")
    industry: Optional[str] = Field(None, max_length=100, description="Industry/vertical")

    @validator("end_date")
    def validate_end_date(cls, v, values):
        """Validate end date is after start date."""
        if v and "start_date" in values and v <= values["start_date"]:
            raise ValueError("End date must be after start date")
        return v

    @validator("base_payment")
    def validate_base_payment(cls, v, values):
        """Validate base payment for non-product-only campaigns."""
        payment_model = values.get("payment_model")
        if payment_model != PaymentModelEnum.PRODUCT_ONLY and not v:
            raise ValueError("Base payment required for non-product-only campaigns")
        return v

    model_config = ConfigDict(from_attributes=True)


class CampaignUpdate(BaseModel):
    """Campaign update schema."""
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)

    start_date: Optional[date] = None
    end_date: Optional[date] = None

    budget: Optional[Decimal] = Field(None, gt=0)

    target_creator_criteria: Optional[Dict[str, Any]] = None

    target_leads: Optional[int] = Field(None, ge=0)
    target_conversions: Optional[int] = Field(None, ge=0)
    target_reach: Optional[int] = Field(None, ge=0)
    target_content_pieces: Optional[int] = Field(None, ge=0)

    payment_model: Optional[PaymentModelEnum] = None
    base_payment: Optional[Decimal] = Field(None, ge=0)
    performance_bonus_structure: Optional[Dict[str, Any]] = None

    content_requirements: Optional[Dict[str, Any]] = None
    product_info: Optional[Dict[str, Any]] = None

    tags: Optional[List[str]] = None
    industry: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class CampaignLaunch(BaseModel):
    """Launch campaign schema."""
    campaign_id: str = Field(..., description="Campaign ID")
    launch_notes: Optional[str] = Field(None, max_length=500, description="Launch notes")
    model_config = ConfigDict(from_attributes=True)


class CampaignPause(BaseModel):
    """Pause campaign schema."""
    campaign_id: str = Field(..., description="Campaign ID")
    reason: Optional[str] = Field(None, max_length=500, description="Pause reason")
    model_config = ConfigDict(from_attributes=True)


class CampaignComplete(BaseModel):
    """Complete campaign schema."""
    campaign_id: str = Field(..., description="Campaign ID")
    completion_notes: Optional[str] = Field(None, max_length=1000, description="Completion notes")
    model_config = ConfigDict(from_attributes=True)


class CampaignDeploy(BaseModel):
    """Deploy campaign to ad platform."""
    campaign_id: str = Field(..., description="Campaign ID")
    platform: DeploymentPlatformEnum = Field(..., description="Ad platform")

    # Platform-specific config
    ad_account_id: str = Field(..., description="Ad account ID")
    campaign_objective: Optional[str] = Field(None, description="Platform campaign objective")

    # Targeting
    target_audience: Dict[str, Any] = Field(..., description="Audience targeting config")

    # Budget (platform level)
    daily_budget: Optional[Decimal] = Field(None, gt=0, description="Daily budget")
    lifetime_budget: Optional[Decimal] = Field(None, gt=0, description="Lifetime budget")

    # Creative
    ad_creative: Dict[str, Any] = Field(..., description="Ad creative configuration")

    # Schedule
    schedule_start: Optional[datetime] = None
    schedule_end: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CreatorInvite(BaseModel):
    """Invite creator to campaign."""
    campaign_id: str = Field(..., description="Campaign ID")
    creator_email: str = Field(..., description="Creator email")
    custom_message: Optional[str] = Field(None, max_length=1000, description="Personal message")

    # Offer details
    compensation_amount: Optional[Decimal] = Field(None, ge=0, description="Offered compensation")
    product_value: Optional[Decimal] = Field(None, ge=0, description="Product value")
    deliverables: List[str] = Field(..., min_length=1, description="Required deliverables")
    deadline: Optional[date] = Field(None, description="Content submission deadline")
    model_config = ConfigDict(from_attributes=True)


class CreatorApplication(BaseModel):
    """Creator applies to join campaign."""
    campaign_id: str = Field(..., description="Campaign ID")
    pitch: str = Field(..., min_length=50, max_length=2000, description="Application pitch")

    # Creator info
    portfolio_url: Optional[HttpUrl] = Field(None, description="Portfolio URL")
    social_handles: Dict[str, str] = Field(..., description="Social media handles")
    audience_demographics: Optional[Dict[str, Any]] = Field(None, description="Audience data")

    # Media kit
    media_kit_url: Optional[HttpUrl] = None

    # Past work
    past_campaigns: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list,
        description="Past campaign experience",
    )

    model_config = ConfigDict(from_attributes=True)


class ContentSubmission(BaseModel):
    """Creator submits content for campaign."""
    campaign_id: str = Field(..., description="Campaign ID")
    partnership_id: str = Field(..., description="Partnership ID")

    # Content details
    content_type: str = Field(..., description="Content type (post, story, reel, video)")
    platform: str = Field(..., description="Platform (instagram, tiktok, etc.)")
    content_url: HttpUrl = Field(..., description="Published content URL")

    # Media files
    media_urls: List[HttpUrl] = Field(..., min_length=1, description="Content media URLs")
    caption: Optional[str] = Field(None, max_length=5000, description="Content caption")

    # Metadata
    published_at: datetime = Field(..., description="Publication timestamp")
    hashtags_used: Optional[List[str]] = Field(default_factory=list, description="Hashtags")
    mentions_used: Optional[List[str]] = Field(default_factory=list, description="Mentions")

    # Performance (if available)
    initial_views: Optional[int] = Field(None, ge=0, description="Initial view count")
    initial_likes: Optional[int] = Field(None, ge=0, description="Initial like count")
    initial_comments: Optional[int] = Field(None, ge=0, description="Initial comment count")
    model_config = ConfigDict(from_attributes=True)


class ContentApproval(BaseModel):
    """Approve/reject submitted content."""
    submission_id: str = Field(..., description="Submission ID")
    approved: bool = Field(..., description="Approval decision")
    feedback: Optional[str] = Field(None, max_length=1000, description="Feedback for creator")
    request_changes: Optional[List[str]] = Field(
        default_factory=list,
        description="Specific changes requested",
    )
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================


class CampaignList(BaseSchema):
    """Campaign list item (for dashboard cards)."""
    campaign_id: str
    name: str
    slug: str

    campaign_type: CampaignTypeEnum
    campaign_goal: CampaignGoalEnum
    status: CampaignStatusEnum

    # Timeline
    start_date: date
    end_date: Optional[date]

    # Budget
    budget: Decimal
    spent: Decimal
    remaining_budget: Decimal

    # Performance
    total_views: int
    total_leads: int
    total_conversions: int
    conversion_rate: float
    roi: Optional[float]

    # Creators
    participating_creators: int

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CampaignResponse(BaseSchema, TimestampSchema):
    """Full campaign response."""
    campaign_id: str
    brand_id: str

    # Basic info
    name: str
    slug: str
    description: Optional[str]

    campaign_type: CampaignTypeEnum
    campaign_goal: CampaignGoalEnum
    status: CampaignStatusEnum

    # Timeline
    start_date: date
    end_date: Optional[date]
    launched_at: Optional[datetime]
    completed_at: Optional[datetime]

    # Budget
    budget: Decimal
    spent: Decimal
    creator_payouts_total: Decimal
    platform_fees_total: Decimal

    # Performance
    total_views: int
    total_starts: int
    total_completes: int
    total_leads: int
    total_conversions: int

    conversion_rate: float
    lead_capture_rate: float
    roi: Optional[float]
    cost_per_lead: Optional[Decimal]
    cost_per_conversion: Optional[Decimal]

    # Goals
    target_leads: Optional[int]
    target_conversions: Optional[int]
    target_reach: Optional[int]
    target_content_pieces: Optional[int]

    # Creators
    target_creator_criteria: Dict[str, Any]
    participating_creators: int

    # Content
    content_requirements: Dict[str, Any]
    content_submitted: int
    content_approved: int

    # Product seeding
    includes_product_seeding: bool
    product_info: Dict[str, Any]
    products_shipped: int

    # Payment
    payment_model: PaymentModelEnum
    base_payment: Optional[Decimal]
    performance_bonus_structure: Dict[str, Any]

    # Funnels
    primary_funnel_id: Optional[str]
    funnel_ids: List[str]

    # Tracking
    tracking_parameters: Dict[str, str]

    # Organization
    tags: List[str]
    industry: Optional[str]

    # Metadata
    metadata: Dict[str, Any]
    notes: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class CampaignDetail(CampaignResponse):
    """Detailed campaign with goal progress."""
    goal_progress: Dict[str, Any] = Field(..., description="Progress towards goals")
    device_breakdown: Dict[str, int] = Field(..., description="Performance by device")
    country_breakdown: Dict[str, int] = Field(..., description="Performance by country")
    model_config = ConfigDict(from_attributes=True)


class CampaignStatsResponse(BaseModel):
    """Campaign performance statistics."""
    campaign_id: str

    # Core metrics
    impressions: int
    clicks: int
    click_through_rate: float

    funnel_views: int
    funnel_starts: int
    funnel_completes: int
    funnel_completion_rate: float

    leads_captured: int
    lead_capture_rate: float

    conversions: int
    conversion_rate: float

    # Financial
    total_spent: Decimal
    cost_per_click: Optional[Decimal]
    cost_per_lead: Optional[Decimal]
    cost_per_conversion: Optional[Decimal]

    # ROI
    revenue_generated: Decimal
    roi_percentage: Optional[float]

    # Time-based trends
    daily_metrics: List[Dict[str, Any]] = Field(..., description="Daily performance trend")

    model_config = ConfigDict(from_attributes=True)


class CampaignCreatorPartnership(BaseModel):
    """Creator partnership within campaign."""
    partnership_id: str
    campaign_id: str
    creator_id: str

    # Status
    status: str = Field(..., description="Partnership status (invited, accepted, completed)")

    # Terms
    compensation_amount: Decimal
    product_value: Optional[Decimal]
    deliverables: List[str]
    deadline: Optional[date]

    # Performance
    content_submitted: int
    content_approved: int
    views_generated: int
    leads_generated: int

    # Payment
    payment_status: str = Field(..., description="Payment status (pending, paid)")
    paid_amount: Optional[Decimal]
    paid_at: Optional[datetime]

    # Timestamps
    invited_at: datetime
    accepted_at: Optional[datetime]
    completed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class CampaignDeploymentStatus(BaseModel):
    """Ad platform deployment status."""
    deployment_id: str
    campaign_id: str
    platform: DeploymentPlatformEnum

    # Platform IDs
    platform_campaign_id: Optional[str]
    platform_ad_set_id: Optional[str]
    platform_ad_id: Optional[str]

    # Status
    status: str = Field(..., description="Deployment status (pending, active, paused, completed)")

    # Performance
    impressions: int
    clicks: int
    spend: Decimal

    # Timestamps
    deployed_at: datetime
    last_synced_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class CampaignContentItem(BaseModel):
    """Submitted content item."""
    submission_id: str
    campaign_id: str
    creator_id: str

    # Content
    content_type: str
    platform: str
    content_url: str
    media_urls: List[str]
    caption: Optional[str]

    # Approval
    approval_status: str = Field(..., description="Approval status (pending, approved, rejected)")
    approved_by: Optional[str]
    feedback: Optional[str]

    # Performance
    views: int
    likes: int
    comments: int
    shares: int
    engagement_rate: float

    # Timestamps
    submitted_at: datetime
    published_at: datetime
    approved_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# ADDITIONAL PRODUCTION SCHEMAS
# =============================================================================


class CampaignListParams(BaseModel):
    """Advanced campaign filtering + pagination."""
    page: int = Field(1, ge=1, le=1000)
    limit: int = Field(20, ge=1, le=100)

    sort_by: str = Field("created_at", pattern=r"^(name|budget|spent|leads|roi|created_at)$")
    sort_dir: str = Field("desc", pattern=r"^(asc|desc)$")

    # Filters
    status: Optional[List[CampaignStatusEnum]] = None
    type: Optional[List[CampaignTypeEnum]] = None
    goal: Optional[List[CampaignGoalEnum]] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    min_budget: Optional[Decimal] = Field(None, gt=0)
    min_roi: Optional[float] = None
    creator_count_min: Optional[int] = Field(None, ge=0)
    search: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(from_attributes=True)


class CampaignListResponse(BaseModel):
    """Paginated response."""
    campaigns: List[CampaignList]
    total: int
    pages: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool

    model_config = ConfigDict(from_attributes=True)


class CampaignBudget(BaseModel):
    """Campaign financial tracking."""
    total_budget: Decimal
    spent: Decimal
    remaining: Decimal
    remaining_pct: float
    pacing_status: str  # "on_track", "ahead", "behind"
    daily_spend_avg: float
    projected_spend: Decimal

    model_config = ConfigDict(from_attributes=True)


class CampaignPerformance(BaseModel):
    """Real-time performance metrics."""
    date: str  # YYYY-MM-DD
    impressions: int
    clicks: int
    ctr: float
    funnel_views: int
    funnel_starts: int
    funnel_completes: int
    completion_rate: float
    leads: int
    lead_rate: float
    conversions: int
    revenue: Decimal
    roas: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class CampaignPerformanceSummary(BaseModel):
    """Dashboard summary card."""
    campaign_id: str
    name: str
    status: CampaignStatusEnum
    roi_pct: float
    total_leads: int
    total_revenue: Decimal
    cpl: Optional[Decimal] = None
    performance_tier: str  # "elite", "excellent", "good", "needs_work"

    model_config = ConfigDict(from_attributes=True)


class CreatorBulkInvite(BaseModel):
    """Bulk invite creators."""
    campaign_id: str
    creator_emails: List[str]  # max 100
    template_message: Optional[str] = None
    compensation: Optional[Decimal] = None
    model_config = ConfigDict(from_attributes=True)


class CreatorListResponse(BaseModel):
    """Paginated creators."""
    creators: List[Dict[str, Any]]
    total: int
    page: int
    limit: int
    model_config = ConfigDict(from_attributes=True)


class ContentModerationRequest(BaseModel):
    """Submit content for review."""
    submission_id: str
    ai_score: float  # 0.0-1.0 compliance score
    flagged_reasons: List[str] = []
    requires_human_review: bool = False
    model_config = ConfigDict(from_attributes=True)


class ContentModerationDecision(BaseModel):
    """Moderation outcome."""
    submission_id: str
    approved: bool
    confidence: float
    reasons: List[str]
    human_override: bool = False
    model_config = ConfigDict(from_attributes=True)


class CampaignROI(BaseModel):
    """Campaign return on investment."""
    campaign_id: str
    total_invested: Decimal
    total_returned: Decimal
    roi_percentage: float
    ltv_projected: Decimal
    break_even_date: Optional[date] = None
    attribution_model: str  # "first_click", "last_click", "linear"
    model_config = ConfigDict(from_attributes=True)


class CampaignExportRow(BaseModel):
    """Flat row for CSV export."""
    campaign_name: str
    status: str
    budget: Decimal
    spent: Decimal
    leads: int
    conversions: int
    revenue: Decimal
    roi_pct: float
    cpl: Decimal
    creator_count: int
    start_date: str
    end_date: str
    model_config = ConfigDict(from_attributes=True)


class CampaignVariant(BaseModel):
    """A/B test variant."""
    variant_id: str
    name: str  # "Control", "Variant A"
    funnel_id: str
    weight: float  # Traffic split 0.0-1.0
    impressions: int
    conversions: int
    conversion_rate: float
    model_config = ConfigDict(from_attributes=True)


class CampaignABTestResults(BaseModel):
    """A/B test analysis."""
    campaign_id: str
    variants: List[CampaignVariant]
    winner: Optional[str] = None  # variant_id
    statistical_significance: bool
    p_value: float
    model_config = ConfigDict(from_attributes=True)


class CampaignComplianceReport(BaseModel):
    """GDPR/CCPA compliance summary."""
    campaign_id: str
    creator_consent_rate: float
    data_retention_compliant: bool
    pii_processed: int
    opt_out_requests: int
    last_audit: datetime
    model_config = ConfigDict(from_attributes=True)


class CampaignBulkAction(BaseModel):
    """Bulk campaign operations."""
    action: str  # "pause", "resume", "duplicate", "archive"
    campaign_ids: List[str]
    reason: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class BulkActionResult(BaseModel):
    """Bulk operation results."""
    success: List[str]
    failed: List[str]
    errors: Dict[str, str]
    summary: str
    model_config = ConfigDict(from_attributes=True)


class CampaignNotification(BaseModel):
    """Campaign alerts/notifications."""
    notification_id: str
    campaign_id: str
    type: str  # "budget_exhausted", "goal_achieved", "low_performance"
    message: str
    severity: str  # "info", "warning", "critical"
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CampaignWebhookPayload(BaseModel):
    """Webhook payload schema."""
    event_type: str  # "campaign.launched", "lead.created"
    campaign_id: str
    data: Dict[str, Any]
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


class CampaignDeployRequest(BaseModel):
    """Deploy campaign to ad platform."""
    campaign_id: str = Field(..., description="Campaign ID")
    platform: DeploymentPlatformEnum = Field(..., description="Ad platform")

    # Platform-specific config
    ad_account_id: str = Field(..., description="Ad account ID")
    campaign_objective: Optional[str] = Field(None, description="Platform campaign objective")

    # Targeting
    target_audience: Dict[str, Any] = Field(..., description="Audience targeting config")

    # Budget (platform level)
    daily_budget: Optional[Decimal] = Field(None, gt=0, description="Daily budget")
    lifetime_budget: Optional[Decimal] = Field(None, gt=0, description="Lifetime budget")

    # Creative
    ad_creative: Dict[str, Any] = Field(..., description="Ad creative configuration")

    # Schedule
    schedule_start: Optional[datetime] = None
    schedule_end: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = [
    # Enums
    "CampaignStatusEnum",
    "CampaignTypeEnum",
    "CampaignGoalEnum",
    "PaymentModelEnum",
    "DeploymentPlatformEnum",

    # Request schemas
    "CampaignCreate",
    "CampaignUpdate",
    "CampaignLaunch",
    "CampaignPause",
    "CampaignComplete",
    "CampaignDeploy",
    "CreatorInvite",
    "CreatorApplication",
    "ContentSubmission",
    "ContentApproval",
    "CampaignDeployRequest",

    # Response schemas
    "CampaignList",
    "CampaignResponse",
    "CampaignDetail",
    "CampaignStatsResponse",
    "CampaignCreatorPartnership",
    "CampaignDeploymentStatus",
    "CampaignContentItem",

    # Pagination
    "CampaignListParams",
    "CampaignListResponse",

    # Budget & Performance
    "CampaignBudget",
    "CampaignPerformance",
    "CampaignPerformanceSummary",

    # Creators
    "CreatorBulkInvite",
    "CreatorListResponse",

    # Moderation
    "ContentModerationRequest",
    "ContentModerationDecision",

    # Financial
    "CampaignROI",
    "CampaignExportRow",

    # A/B Testing
    "CampaignVariant",
    "CampaignABTestResults",

    # Compliance
    "CampaignComplianceReport",

    # Bulk Ops
    "CampaignBulkAction",
    "BulkActionResult",

    # Notifications
    "CampaignNotification",
    "CampaignWebhookPayload"
]
