# =============================================================================
# AI FUNNEL BUILDER - CAMPAIGN MODEL
# =============================================================================
# Brand campaign management for creator partnerships
# Phase 2 Feature: Brand Portal
# =============================================================================

from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List, Dict, Any
import uuid
from decimal import Decimal

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Date,
    Integer,
    Numeric,
    Text,
    Enum,
    ForeignKey,
    Index,
    CheckConstraint,
    func,
    literal,
    Float,  # ✅ SINGLE Float import
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

# =============================================================================
# ENUMS
# =============================================================================

import enum

class CampaignStatusEnum(str, enum.Enum):
    """Campaign lifecycle status."""
    DRAFT = "draft"                  # Being created
    ACTIVE = "active"                # Live and running
    PAUSED = "paused"                # Temporarily paused
    COMPLETED = "completed"          # Finished successfully
    CANCELLED = "cancelled"          # Cancelled before completion
    PENDING_REVIEW = "pending_review" # Awaiting approval

class CampaignTypeEnum(str, enum.Enum):
    """Campaign types."""
    UGC_COLLECTION = "ugc_collection"      # Collect UGC content
    PRODUCT_SEEDING = "product_seeding"    # Send products to creators
    BRAND_AWARENESS = "brand_awareness"    # Increase brand visibility
    LEAD_GENERATION = "lead_generation"    # Capture leads
    AUDIENCE_RESEARCH = "audience_research" # Market research
    INFLUENCER_VETTING = "influencer_vetting" # Find creators to work with

class CampaignGoalEnum(str, enum.Enum):
    """Primary campaign goals."""
    REACH = "reach"                 # Maximize impressions
    ENGAGEMENT = "engagement"       # Maximize interactions
    CONVERSIONS = "conversions"     # Maximize lead captures
    CONTENT = "content"             # Maximize UGC submissions
    PARTNERSHIPS = "partnerships"   # Find long-term partners

class PaymentStatusEnum(str, enum.Enum):
    """Payment status for creator payouts."""
    PENDING = "pending"             # Not yet paid
    PROCESSING = "processing"       # Payment in progress
    PAID = "paid"                   # Successfully paid
    FAILED = "failed"               # Payment failed
    CANCELLED = "cancelled"         # Payment cancelled

# =============================================================================
# CAMPAIGN MODEL
# =============================================================================

class Campaign(Base):
    """
    Campaign model for brand marketing campaigns.
    
    Features:
    - Multi-funnel campaigns
    - Budget and ROI tracking
    - Creator partnerships and payouts
    - Performance metrics
    - Goal tracking (KPIs)
    - Content collection
    
    Relationships:
    - brand (User) - brand/company account
    - funnels (Funnel) - associated funnels
    - partnerships (CreatorPartnership) - creator relationships
    """

    __tablename__ = "campaigns"

    # -------------------------------------------------------------------------
    # PRIMARY KEY
    # -------------------------------------------------------------------------

    campaign_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique campaign identifier",
    )

    # -------------------------------------------------------------------------
    # BRAND (OWNER)
    # -------------------------------------------------------------------------

    brand_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Brand/company user ID",
    )

    # -------------------------------------------------------------------------
    # BASIC INFO
    # -------------------------------------------------------------------------

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Campaign name",
    )

    slug: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        index=True,
        comment="URL-friendly slug",
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Campaign description and objectives",
    )

    campaign_type: Mapped[CampaignTypeEnum] = mapped_column(
        Enum(CampaignTypeEnum, name="campaign_type_enum"),
        nullable=False,
        index=True,
        comment="Campaign type",
    )

    campaign_goal: Mapped[CampaignGoalEnum] = mapped_column(
        Enum(CampaignGoalEnum, name="campaign_goal_enum"),
        nullable=False,
        index=True,
        comment="Primary campaign goal",
    )

    # -------------------------------------------------------------------------
    # TIMELINE
    # -------------------------------------------------------------------------
    created_at: Mapped[datetime] = mapped_column(  # ✅ ADDED - FIXES INDEX!
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
        comment="Campaign start date",
    )

    end_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        index=True,
        comment="Campaign end date (null for ongoing)",
    )

    launched_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When campaign went live",
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When campaign was completed",
    )

    # -------------------------------------------------------------------------
    # STATUS
    # -------------------------------------------------------------------------

    status: Mapped[CampaignStatusEnum] = mapped_column(
        Enum(CampaignStatusEnum, name="campaign_status_enum"),
        nullable=False,
        default=CampaignStatusEnum.DRAFT,
        index=True,
        comment="Campaign status",
    )

    # -------------------------------------------------------------------------
    # BUDGET & FINANCIALS
    # -------------------------------------------------------------------------

    budget: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=literal(Decimal('0.00')),
        comment="Total campaign budget (USD)",
    )

    spent: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=literal(Decimal('0.00')),
        comment="Amount spent so far (USD)",
    )

    creator_payouts_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=literal(Decimal('0.00')),
        comment="Total paid to creators (USD)",
    )

    platform_fees_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=literal(Decimal('0.00')),
        comment="Total platform fees (USD)",
    )

    # -------------------------------------------------------------------------
    # PERFORMANCE METRICS (Aggregated)
    # -------------------------------------------------------------------------

    total_views: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        comment="Total funnel views across all campaign funnels",
    )

    total_starts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        comment="Total funnel starts",
    )

    total_completes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        comment="Total funnel completions",
    )

    total_leads: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        comment="Total leads captured",
    )

    total_conversions: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        comment="Total conversions (purchases, sign-ups, etc.)",
    )

    # -------------------------------------------------------------------------
    # CALCULATED RATES
    # -------------------------------------------------------------------------

    conversion_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=literal(0.0),
        comment="Conversion rate: completes / views",
    )

    lead_capture_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=literal(0.0),
        comment="Lead capture rate: leads / views",
    )

    roi: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Return on investment (revenue / spend - 1)",
    )

    cost_per_lead: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        comment="Cost per lead (spend / leads)",
    )

    cost_per_conversion: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        comment="Cost per conversion (spend / conversions)",
    )

    # -------------------------------------------------------------------------
    # GOALS & TARGETS
    # -------------------------------------------------------------------------

    target_leads: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Target number of leads",
    )

    target_conversions: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Target number of conversions",
    )

    target_reach: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Target reach/impressions",
    )

    target_content_pieces: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Target UGC content pieces",
    )

    # -------------------------------------------------------------------------
    # CREATOR TARGETING
    # -------------------------------------------------------------------------

    target_creator_criteria: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal({}),
        comment="Creator targeting criteria",
    )

    participating_creators: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        comment="Number of creators participating",
    )

    # -------------------------------------------------------------------------
    # CONTENT REQUIREMENTS
    # -------------------------------------------------------------------------

    content_requirements: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal({}),
        comment="Content deliverables and requirements",
    )

    content_submitted: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        comment="Number of content pieces submitted",
    )

    content_approved: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        comment="Number of content pieces approved",
    )

    # -------------------------------------------------------------------------
    # PRODUCT SEEDING (if applicable)
    # -------------------------------------------------------------------------

    includes_product_seeding: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=literal(False),
        comment="Whether campaign includes product seeding",
    )

    product_info: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal({}),
        comment="Product information and shipping details",
    )

    products_shipped: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        comment="Number of products shipped to creators",
    )

    # -------------------------------------------------------------------------
    # PAYMENT TERMS
    # -------------------------------------------------------------------------

    payment_model: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="Payment model (flat_fee, performance, hybrid, product_only)",
    )

    base_payment: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        comment="Base payment per creator (USD)",
    )

    performance_bonus_structure: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal({}),
        comment="Performance bonus structure",
    )

    # -------------------------------------------------------------------------
    # FUNNEL ASSOCIATIONS
    # -------------------------------------------------------------------------

    primary_funnel_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("funnels.funnel_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Primary funnel for this campaign",
    )

    funnel_ids: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal([]),  # ✅ FIXED: List needs []
        comment="All funnels associated with campaign",
    )

    # -------------------------------------------------------------------------
    # TRACKING & ATTRIBUTION
    # -------------------------------------------------------------------------

    tracking_parameters: Mapped[Optional[Dict[str, str]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal({}),
        comment="UTM and tracking parameters",
    )

    # -------------------------------------------------------------------------
    # TAGS & CATEGORIZATION
    # -------------------------------------------------------------------------

    tags: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal([]),  # ✅ FIXED: List needs []
        comment="Tags for organization",
    )

    industry: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="Industry/vertical (skincare, fitness, tech, etc.)",
    )

    # -------------------------------------------------------------------------
    # METADATA
    # -------------------------------------------------------------------------

    campaign_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal({}),
        comment="Additional metadata",
    )

    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Internal notes and observations",
    )

    # -------------------------------------------------------------------------
    # INDEXES & CONSTRAINTS
    # -------------------------------------------------------------------------

    __table_args__ = (
        # Brand dashboard queries
        Index("idx_campaign_brand_status", "brand_id", "status"),
        Index("idx_campaign_brand_created", "brand_id", "created_at"),
        
        # Timeline queries
        Index("idx_campaign_dates", "start_date", "end_date"),
        Index("idx_campaign_active", "status", "start_date", "end_date"),
        
        # Performance queries
        Index("idx_campaign_roi", "roi"),
        Index("idx_campaign_type_status", "campaign_type", "status"),
        
        # Search
        Index("idx_campaign_slug", "slug"),
        Index("idx_campaign_tags_gin", "tags", postgresql_using="gin"),
        
        # Constraints
        CheckConstraint("budget >= 0", name="ck_campaign_budget_positive"),
        CheckConstraint("spent >= 0 AND spent <= budget", name="ck_campaign_spent_valid"),
        CheckConstraint("total_views >= 0", name="ck_campaign_views_positive"),
        CheckConstraint("conversion_rate >= 0 AND conversion_rate <= 1", name="ck_campaign_conversion_range"),
    )

    # -------------------------------------------------------------------------
    # REPRESENTATION
    # -------------------------------------------------------------------------

    def __repr__(self) -> str:
        return f"<Campaign {self.name} ({self.status.value})>"

    # -------------------------------------------------------------------------
    # STATUS MANAGEMENT
    # -------------------------------------------------------------------------

    def launch(self):
        """Launch campaign."""
        self.status = CampaignStatusEnum.ACTIVE
        self.launched_at = datetime.utcnow()

    def pause(self):
        """Pause campaign."""
        self.status = CampaignStatusEnum.PAUSED

    def resume(self):
        """Resume paused campaign."""
        if self.status == CampaignStatusEnum.PAUSED:
            self.status = CampaignStatusEnum.ACTIVE

    def complete(self):
        """Mark campaign as completed."""
        self.status = CampaignStatusEnum.COMPLETED
        self.completed_at = datetime.utcnow()

    def cancel(self):
        """Cancel campaign."""
        self.status = CampaignStatusEnum.CANCELLED

    # -------------------------------------------------------------------------
    # FINANCIAL METHODS
    # -------------------------------------------------------------------------

    def add_expense(self, amount: Decimal, category: str = "general"):
        """
        Add expense to campaign.
        
        Args:
            amount: Expense amount
            category: Expense category (creator_payout, platform_fee, etc.)
        """
        self.spent += amount
        
        if category == "creator_payout":
            self.creator_payouts_total += amount
        elif category == "platform_fee":
            self.platform_fees_total += amount

    @property
    def remaining_budget(self) -> Decimal:
        """Get remaining budget."""
        return self.budget - self.spent

    @property
    def budget_utilization(self) -> float:
        """Get budget utilization percentage (0.0-1.0)."""
        if self.budget == 0:
            return 0.0
        return float(self.spent / self.budget)

    def calculate_roi(self, total_revenue: Decimal):
        """
        Calculate ROI.
        
        Args:
            total_revenue: Total revenue generated from campaign
        """
        if self.spent > 0:
            self.roi = float((total_revenue - self.spent) / self.spent)
        else:
            self.roi = None

    def calculate_cost_metrics(self):
        """Recalculate cost per lead and cost per conversion."""
        if self.total_leads > 0:
            self.cost_per_lead = self.spent / Decimal(self.total_leads)
        else:
            self.cost_per_lead = None

        if self.total_conversions > 0:
            self.cost_per_conversion = self.spent / Decimal(self.total_conversions)
        else:
            self.cost_per_conversion = None

    # -------------------------------------------------------------------------
    # PERFORMANCE METHODS
    # -------------------------------------------------------------------------

    def update_metrics(
        self,
        views: int = 0,
        starts: int = 0,
        completes: int = 0,
        leads: int = 0,
        conversions: int = 0
    ):
        """
        Update performance metrics.
        
        Args:
            views: Views to add
            starts: Starts to add
            completes: Completes to add
            leads: Leads to add
            conversions: Conversions to add
        """
        self.total_views += views
        self.total_starts += starts
        self.total_completes += completes
        self.total_leads += leads
        self.total_conversions += conversions

        # Recalculate rates
        if self.total_views > 0:
            self.conversion_rate = round(self.total_completes / self.total_views, 4)
            self.lead_capture_rate = round(self.total_leads / self.total_views, 4)

        # Recalculate cost metrics
        self.calculate_cost_metrics()

    # -------------------------------------------------------------------------
    # GOAL PROGRESS
    # -------------------------------------------------------------------------

    def get_goal_progress(self) -> Dict[str, Any]:
        """
        Get progress towards goals.
        
        Returns:
            Dictionary with goal progress
        """
        progress = {}

        if self.target_leads:
            progress["leads"] = {
                "current": self.total_leads,
                "target": self.target_leads,
                "percentage": round((self.total_leads / self.target_leads) * 100, 2),
                "remaining": max(0, self.target_leads - self.total_leads),
            }

        if self.target_conversions:
            progress["conversions"] = {
                "current": self.total_conversions,
                "target": self.target_conversions,
                "percentage": round((self.total_conversions / self.target_conversions) * 100, 2),
                "remaining": max(0, self.target_conversions - self.total_conversions),
            }

        if self.target_reach:
            progress["reach"] = {
                "current": self.total_views,
                "target": self.target_reach,
                "percentage": round((self.total_views / self.target_reach) * 100, 2),
                "remaining": max(0, self.target_reach - self.total_views),
            }

        if self.target_content_pieces:
            progress["content"] = {
                "current": self.content_submitted,
                "target": self.target_content_pieces,
                "percentage": round((self.content_submitted / self.target_content_pieces) * 100, 2),
                "remaining": max(0, self.target_content_pieces - self.content_submitted),
            }

        return progress

    # -------------------------------------------------------------------------
    # SERIALIZATION
    # -------------------------------------------------------------------------

    def to_dict(self, include_metrics: bool = True) -> dict:
        """
        Convert campaign to dictionary.
        
        Args:
            include_metrics: Include performance metrics
            
        Returns:
            Campaign data dictionary
        """
        data = {
            "campaign_id": self.campaign_id,
            "brand_id": self.brand_id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "campaign_type": self.campaign_type.value,
            "campaign_goal": self.campaign_goal.value,
            "status": self.status.value,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "budget": float(self.budget),
            "spent": float(self.spent),
            "remaining_budget": float(self.remaining_budget),
            "budget_utilization": self.budget_utilization,
            "participating_creators": self.participating_creators,
        }

        if include_metrics:
            data.update({
                "total_views": self.total_views,
                "total_starts": self.total_starts,
                "total_completes": self.total_completes,
                "total_leads": self.total_leads,
                "total_conversions": self.total_conversions,
                "conversion_rate": self.conversion_rate,
                "lead_capture_rate": self.lead_capture_rate,
                "roi": self.roi,
                "cost_per_lead": float(self.cost_per_lead) if self.cost_per_lead else None,
                "cost_per_conversion": float(self.cost_per_conversion) if self.cost_per_conversion else None,
                "goal_progress": self.get_goal_progress(),
            })

        return data

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "Campaign",
    "CampaignStatusEnum",
    "CampaignTypeEnum",
    "CampaignGoalEnum",
    "PaymentStatusEnum",
]
