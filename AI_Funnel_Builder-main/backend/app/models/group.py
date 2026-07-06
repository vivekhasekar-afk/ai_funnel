# =============================================================================
# AI FUNNEL BUILDER - FUNNEL GROUP MODEL
# =============================================================================
# FunnelGroup: Product/Category/Campaign container within a Project
# =============================================================================

from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid
import enum

from sqlalchemy import (
    String, Boolean, DateTime, Text, Enum, Index, CheckConstraint,
    func, ForeignKey, Integer
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.core.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.funnel import Funnel


# =============================================================================
# ENUMS
# =============================================================================

class GroupTypeEnum(str, enum.Enum):
    """Type of funnel group - what's being promoted."""
    PRODUCT = "product"           # Single product (e.g., Acne Cream)
    CATEGORY = "category"         # Product category (e.g., Skincare)
    CAMPAIGN = "campaign"         # Marketing campaign (e.g., Summer Sale)
    SERVICE = "service"           # Service offering (e.g., Coaching)
    COLLECTION = "collection"     # Product collection/bundle


class GroupStatusEnum(str, enum.Enum):
    """Group lifecycle status."""
    DRAFT = "draft"               # Being set up
    ACTIVE = "active"             # Live and running
    PAUSED = "paused"             # Temporarily paused
    ARCHIVED = "archived"         # No longer active but kept for reference


# =============================================================================
# FUNNEL GROUP MODEL
# =============================================================================

class FunnelGroup(Base):
    """
    FunnelGroup model - Container for related funnels around a product/category/campaign.
    
    A group provides shared context and positioning for all funnels within it.
    It sits between Project (brand) and Funnel (individual flow).
    
    Hierarchy: Project → Group → Funnel
    """
    
    __tablename__ = "funnel_groups"
    
    # -------------------------------------------------------------------------
    # PRIMARY KEY & TIMESTAMPS
    # -------------------------------------------------------------------------
    
    group_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique group identifier (UUID v4)"
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="Group creation timestamp"
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Last update timestamp"
    )
    
    # -------------------------------------------------------------------------
    # SOFT DELETE
    # -------------------------------------------------------------------------
    
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Soft delete flag"
    )
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Deletion timestamp"
    )
    
    # -------------------------------------------------------------------------
    # OWNERSHIP & HIERARCHY
    # -------------------------------------------------------------------------
    
    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("projects.project_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Parent project ID"
    )
    
    # -------------------------------------------------------------------------
    # BASIC INFO
    # -------------------------------------------------------------------------
    
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Group name (e.g., 'Acne Treatment Line', 'Weight Loss Products')"
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Detailed group description"
    )
    
    group_type: Mapped[GroupTypeEnum] = mapped_column(
        Enum(GroupTypeEnum, name="group_type_enum"),
        nullable=False,
        default=GroupTypeEnum.PRODUCT,
        index=True,
        comment="Type of group: product, category, campaign, service, collection"
    )
    
    status: Mapped[GroupStatusEnum] = mapped_column(
        Enum(GroupStatusEnum, name="group_status_enum"),
        nullable=False,
        default=GroupStatusEnum.DRAFT,
        index=True,
        comment="Group lifecycle status"
    )
    
    # -------------------------------------------------------------------------
    # POSITIONING (PRD: Group-level "Problem it solves")
    # -------------------------------------------------------------------------
    
    positioning_problem: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Market-level positioning pain this product/category solves (e.g., 'Reduces acne & oil for humid weather')"
    )
    
    value_proposition: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Core value proposition / unique selling point"
    )
    
    # -------------------------------------------------------------------------
    # PRODUCT/OFFERING INFO
    # -------------------------------------------------------------------------
    
    product_url: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
        comment="Product page or landing page URL for AI scraping"
    )
    
    offer_summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Brief offer summary (pricing, packages, variants)"
    )
    
    price_range: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Price range (e.g., '$29-$99', 'Free-$299/mo')"
    )
    
    # -------------------------------------------------------------------------
    # AUDIENCE & TARGETING
    # -------------------------------------------------------------------------
    
    audience_override: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default={},
        comment="Optional audience override for this group (overrides project default)"
    )
    
    target_demographics: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default={},
        comment="Specific demographics for this group (age, gender, location, income)"
    )
    
    # -------------------------------------------------------------------------
    # MEDIA & ASSETS
    # -------------------------------------------------------------------------
    
    thumbnail_url: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
        comment="Group thumbnail/cover image"
    )
    
    media_assets: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default={},
        comment="Shared media assets for funnels (images, videos, logos)"
    )
    
    # -------------------------------------------------------------------------
    # AI CONTEXT & METADATA
    # -------------------------------------------------------------------------
    
    ai_context: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default={},
        comment="AI-extracted context from product_url (features, benefits, reviews, etc.)"
    )
    
    group_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default={},
        comment="Additional group metadata"
    )
    
    # -------------------------------------------------------------------------
    # SETTINGS
    # -------------------------------------------------------------------------
    
    settings: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default={},
        comment="Group-specific settings (default CTAs, tracking, integrations)"
    )
    
    # -------------------------------------------------------------------------
    # TAGS & CATEGORIZATION
    # -------------------------------------------------------------------------
    
    tags: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        default=list,
        comment="Tags for organizing/filtering groups"
    )
    
    # -------------------------------------------------------------------------
    # ACTIVITY & PERFORMANCE (Denormalized)
    # -------------------------------------------------------------------------
    
    funnels_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Total funnels in this group"
    )
    
    active_funnels_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Active/published funnels count"
    )
    
    total_leads: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Total leads captured across all funnels"
    )
    
    total_views: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Total funnel views across group"
    )
    
    last_activity_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last activity timestamp"
    )
    
    # -------------------------------------------------------------------------
    # CAMPAIGN DATES (for campaign-type groups)
    # -------------------------------------------------------------------------
    
    start_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Campaign/offer start date (for campaign groups)"
    )
    
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Campaign/offer end date (for campaign groups)"
    )
    
    # -------------------------------------------------------------------------
    # RELATIONSHIPS
    # -------------------------------------------------------------------------
    
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="groups",
        lazy="selectin"
    )
    
    funnels: Mapped[List["Funnel"]] = relationship(
        "Funnel",
        back_populates="group",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Funnel.created_at.desc()"
    )
    
    # -------------------------------------------------------------------------
    # INDEXES & CONSTRAINTS
    # -------------------------------------------------------------------------
    
    __table_args__ = (
        Index("idx_group_project_status", "project_id", "status", "is_deleted"),
        Index("idx_group_type", "group_type"),
        Index("idx_group_created", "created_at"),
        Index("idx_group_activity", "last_activity_at"),
        Index("idx_group_dates", "start_date", "end_date"),
        CheckConstraint(
            "product_url IS NULL OR product_url ~ '^https?://'",
            name="valid_product_url"
        ),
        CheckConstraint(
            "funnels_count >= 0",
            name="positive_funnels_count"
        ),
        CheckConstraint(
            "total_leads >= 0",
            name="positive_total_leads"
        ),
        CheckConstraint(
            "end_date IS NULL OR start_date IS NULL OR end_date >= start_date",
            name="valid_date_range"
        ),
    )
    
    # -------------------------------------------------------------------------
    # VALIDATORS
    # -------------------------------------------------------------------------
    
    @validates("name")
    def validate_name(self, key: str, name: str) -> str:
        """Validate and clean group name."""
        if name:
            name = name.strip()
            if len(name) < 2:
                raise ValueError("Group name must be at least 2 characters")
            if len(name) > 255:
                raise ValueError("Group name must be less than 255 characters")
        return name
    
    @validates("product_url")
    def validate_product_url(self, key: str, url: Optional[str]) -> Optional[str]:
        """Validate product URL format."""
        if url:
            url = url.strip()
            if not url.startswith(("http://", "https://")):
                url = f"https://{url}"
        return url
    
    @validates("positioning_problem")
    def validate_positioning_problem(self, key: str, problem: Optional[str]) -> Optional[str]:
        """Validate positioning problem is concise."""
        if problem:
            problem = problem.strip()
            if len(problem) > 500:
                raise ValueError("Positioning problem should be concise (max 500 chars)")
        return problem
    
    @validates("tags")
    def validate_tags(self, key: str, tags: Optional[List[str]]) -> Optional[List[str]]:
        """Validate and clean tags."""
        if tags:
            # Remove duplicates, clean whitespace, lowercase
            tags = list(set([tag.strip().lower() for tag in tags if tag and tag.strip()]))
            if len(tags) > 20:
                raise ValueError("Maximum 20 tags allowed")
        return tags
    
    # -------------------------------------------------------------------------
    # HELPER METHODS
    # -------------------------------------------------------------------------
    
    def update_stats(self) -> None:
        """Update denormalized statistics."""
        self.funnels_count = len(self.funnels)
        self.active_funnels_count = len([f for f in self.funnels if f.status == "published"])
        # total_leads, total_views computed via query in service layer
    
    def soft_delete(self) -> None:
        """Soft delete the group."""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        self.status = GroupStatusEnum.ARCHIVED
    
    def restore(self) -> None:
        """Restore soft-deleted group."""
        self.is_deleted = False
        self.deleted_at = None
    
    def activate(self) -> None:
        """Activate the group."""
        self.status = GroupStatusEnum.ACTIVE
        self.last_activity_at = datetime.utcnow()
    
    def pause(self) -> None:
        """Pause the group."""
        self.status = GroupStatusEnum.PAUSED
    
    def archive(self) -> None:
        """Archive the group."""
        self.status = GroupStatusEnum.ARCHIVED
    
    def is_campaign_active(self) -> bool:
        """Check if campaign dates are currently active."""
        if self.group_type != GroupTypeEnum.CAMPAIGN:
            return True
        
        now = datetime.utcnow()
        
        if self.start_date and now < self.start_date:
            return False
        
        if self.end_date and now > self.end_date:
            return False
        
        return True
    
    def __repr__(self) -> str:
        return f"<FunnelGroup {self.group_id} '{self.name}' type={self.group_type.value} project={self.project_id}>"


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "FunnelGroup",
    "GroupTypeEnum",
    "GroupStatusEnum",
]
