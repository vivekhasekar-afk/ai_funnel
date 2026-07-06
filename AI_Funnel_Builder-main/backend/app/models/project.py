# =============================================================================
# AI FUNNEL BUILDER - PROJECT MODEL
# =============================================================================
# Project: Top-level brand/business container for organizing funnel groups
# =============================================================================

from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid
import enum
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

from sqlalchemy import (
    String, Boolean, DateTime, Text, Index, CheckConstraint,
    func, ForeignKey, text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.core.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.group import FunnelGroup
    from app.models.funnel import Funnel


# =============================================================================
# ENUMS
# =============================================================================

class IndustryEnum(str, enum.Enum):
    """Industry categories for projects."""
    ECOMMERCE = "ecommerce"
    SAAS = "saas"
    COACHING = "coaching"
    CONSULTING = "consulting"
    EDUCATION = "education"
    HEALTH_FITNESS = "health_fitness"
    BEAUTY_SKINCARE = "beauty_skincare"
    REAL_ESTATE = "real_estate"
    FINANCE = "finance"
    MARKETING_AGENCY = "marketing_agency"
    CONTENT_CREATOR = "content_creator"
    LOCAL_BUSINESS = "local_business"
    NONPROFIT = "nonprofit"
    OTHER = "other"


class BrandVoiceEnum(str, enum.Enum):
    """Brand voice/tone presets for AI content generation."""
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    CASUAL = "casual"
    LUXURY = "luxury"
    EDUCATIONAL = "educational"
    PLAYFUL = "playful"
    AUTHORITATIVE = "authoritative"
    EMPATHETIC = "empathetic"


# =============================================================================
# PROJECT MODEL
# =============================================================================

class Project(Base):
    """
    Project model - Top-level container for brand/business.
    
    A project represents a single brand, business, or initiative.
    It contains funnel groups and provides shared context (industry, voice, audience).
    """
    
    __tablename__ = "projects"
    
    # -------------------------------------------------------------------------
    # PRIMARY KEY & TIMESTAMPS
    # -------------------------------------------------------------------------
    
    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique project identifier (UUID v4)"
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="Project creation timestamp"
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
    # OWNERSHIP
    # -------------------------------------------------------------------------
    
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Owner user ID"
    )
    
    # -------------------------------------------------------------------------
    # BASIC INFO
    # -------------------------------------------------------------------------
    
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Project/brand name"
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Project description"
    )
    
    industry: Mapped[Optional[IndustryEnum]] = mapped_column(
        PGEnum(IndustryEnum, name="industry_enum",create_type=False,native_enum=True,),
        nullable=True,
        index=True,
        comment="Business industry category"
    )
    
    website: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="Primary website URL"
    )
    
    # -------------------------------------------------------------------------
    # BRAND POSITIONING (PRD: Mission-level problem)
    # -------------------------------------------------------------------------
    
    mission_problem: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="High-level brand mission pain/problem this business solves"
    )
    
    brand_voice: Mapped[Optional[BrandVoiceEnum]] = mapped_column(
        PGEnum(BrandVoiceEnum, name="brand_voice_enum",create_type=False,native_enum=True,),
        nullable=True,
        default=BrandVoiceEnum.PROFESSIONAL,
        comment="Brand voice/tone for AI content generation"
    )
    
    # -------------------------------------------------------------------------
    # DEFAULT AUDIENCE & TARGETING
    # -------------------------------------------------------------------------
    
    default_audience: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default={},
        comment="Default target audience profile (demographics, psychographics)"
    )
    
    # -------------------------------------------------------------------------
    # SETTINGS & METADATA
    # -------------------------------------------------------------------------
    
    settings: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default={},
        comment="Project-specific settings (timezone, currency, language, etc.)"
    )
    
    project_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        server_default=text("'{}'::jsonb"),
        default=dict,
        comment="Additional project metadata"
    )
    
    # -------------------------------------------------------------------------
    # STATUS & ACTIVITY
    # -------------------------------------------------------------------------
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="Whether project is active"
    )
    
    last_activity_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last activity timestamp (funnel created, updated, etc.)"
    )
    
    # -------------------------------------------------------------------------
    # STATISTICS (Denormalized for performance)
    # -------------------------------------------------------------------------
    
    groups_count: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        comment="Total funnel groups in this project"
    )
    
    funnels_count: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        comment="Total funnels across all groups in this project"
    )
    
    total_leads: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        comment="Total leads captured across all funnels"
    )
    
    # -------------------------------------------------------------------------
    # RELATIONSHIPS
    # -------------------------------------------------------------------------
    
    user: Mapped["User"] = relationship(
        "User",
        back_populates="projects",
        lazy="selectin"
    )
    
    groups: Mapped[List["FunnelGroup"]] = relationship(
        "FunnelGroup",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="FunnelGroup.created_at.desc()"
    )
        
    # -------------------------------------------------------------------------
    # INDEXES & CONSTRAINTS
    # -------------------------------------------------------------------------
    
    __table_args__ = (
        Index("idx_project_user_active", "user_id", "is_active", "is_deleted"),
        Index("idx_project_industry", "industry"),
        Index("idx_project_created", "created_at"),
        CheckConstraint(
            "website IS NULL OR website ~ '^https?://'",
            name="valid_website_url"
        ),
        CheckConstraint(
            "groups_count >= 0",
            name="positive_groups_count"
        ),
        CheckConstraint(
            "funnels_count >= 0",
            name="positive_funnels_count"
        ),
    )
    
    # -------------------------------------------------------------------------
    # VALIDATORS
    # -------------------------------------------------------------------------
    
    @validates("name")
    def validate_name(self, key: str, name: str) -> str:
        """Validate and clean project name."""
        if name:
            name = name.strip()
            if len(name) < 2:
                raise ValueError("Project name must be at least 2 characters")
            if len(name) > 255:
                raise ValueError("Project name must be less than 255 characters")
        return name
    
    @validates("website")
    def validate_website(self, key: str, website: Optional[str]) -> Optional[str]:
        """Validate website URL format."""
        if website:
            website = website.strip()
            if not website.startswith(("http://", "https://")):
                website = f"https://{website}"
        return website
    
    # -------------------------------------------------------------------------
    # HELPER METHODS
    # -------------------------------------------------------------------------
    
    def update_stats(self) -> None:
        """Update denormalized statistics."""
        self.groups_count = len(self.groups)
        self.funnels_count = len(self.funnels)
        # total_leads would be computed via query in service layer
    
    def soft_delete(self) -> None:
        """Soft delete the project."""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        self.is_active = False
    
    def restore(self) -> None:
        """Restore soft-deleted project."""
        self.is_deleted = False
        self.deleted_at = None
    
    def __repr__(self) -> str:
        return f"<Project {self.project_id} '{self.name}' owner={self.user_id}>"


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "Project",
    "IndustryEnum",
    "BrandVoiceEnum",
]
