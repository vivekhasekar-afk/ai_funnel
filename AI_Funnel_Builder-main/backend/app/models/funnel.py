# =============================================================================
# AI FUNNEL BUILDER - ENHANCED FUNNEL MODEL (Production Grade)
# =============================================================================
# Supports visual page builder, theme customization, A/B testing, and SEO.
# Layout schema enables Figma-like drag-and-drop editor.
# NOW WITH: Project → Group → Funnel hierarchy support
# ✅ FIXED: Proper bidirectional relationships for eager loading
# =============================================================================

from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any, TYPE_CHECKING
import uuid
import enum
import re

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    Text,
    Enum,
    Index,
    CheckConstraint,
    ForeignKey,
    UniqueConstraint,
    func,
    literal,
    event,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship, Mapped, mapped_column, validates

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.project import Project
    from app.models.group import FunnelGroup
    from app.models.event import Event
    from app.models.question import Question
    from app.models.response import Response


# =============================================================================
# ENUMS
# =============================================================================

class FunnelTypeEnum(str, enum.Enum):
    """Funnel type categories"""
    QUIZ = "quiz"
    SURVEY = "survey"
    FORM = "form"
    POLL = "poll"
    LEAD_MAGNET = "lead_magnet"
    PRODUCT_LAUNCH = "product_launch"
    WEBINAR = "webinar"
    WAITLIST = "waitlist"


class FunnelStatusEnum(str, enum.Enum):
    """Publication status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    PAUSED = "paused"


class FunnelVisibilityEnum(str, enum.Enum):
    """Access control"""
    PRIVATE = "private"      # Owner only
    UNLISTED = "unlisted"    # Anyone with link
    PUBLIC = "public"        # Listed in marketplace


class FunnelTemplateEnum(str, enum.Enum):
    """Built-in layout templates"""
    MINIMAL = "minimal"
    HERO = "hero"
    SPLIT = "split"
    CARD = "card"
    FULLSCREEN = "fullscreen"
    MULTI_STEP = "multi_step"
    CONVERSATIONAL = "conversational"


# =============================================================================
# FUNNEL MODEL
# =============================================================================

class Funnel(Base):
    """
    Enhanced funnel model with visual builder support.
    
    **Hierarchy Support**
    - Belongs to a Project (optional)
    - Belongs to a FunnelGroup (optional)
    - Legacy support: Can exist independently (user-owned)
    
    Features:
    - Layout schema (sections, components, positioning)
    - Theme system (colors, fonts, spacing)
    - A/B testing variants
    - SEO metadata
    - Performance tracking
    - Version control
    """

    __tablename__ = "funnels"

    # -------------------------------------------------------------------------
    # PRIMARY KEY & OWNERSHIP
    # -------------------------------------------------------------------------

    funnel_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique funnel identifier (UUID v4)",
    )

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Owner user ID (required for all funnels)",
    )

    # -------------------------------------------------------------------------
    # HIERARCHY FOREIGN KEYS
    # -------------------------------------------------------------------------

    group_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("funnel_groups.group_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="Parent funnel group ID (optional - product/category/campaign)",
    )

    # -------------------------------------------------------------------------
    # TIMESTAMPS
    # -------------------------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="Creation timestamp",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Last update timestamp",
    )

    last_published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
        comment="Last publication timestamp",
    )

    # -------------------------------------------------------------------------
    # BASIC METADATA
    # -------------------------------------------------------------------------

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Funnel title (displayed in dashboard)",
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Internal description for owner",
    )

    slug: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        unique=True,
        index=True,
        comment="URL-safe slug for public access",
    )

    niche: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="Industry/niche (e.g., 'fitness', 'ecommerce')",
    )

    primary_goal: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="Main objective (e.g., 'lead_capture', 'sales')",
    )

    # -------------------------------------------------------------------------
    # STATUS & VISIBILITY
    # -------------------------------------------------------------------------

    funnel_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="quiz",
        index=True,
        comment="quiz/survey/form/poll/lead_magnet/etc.",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="draft",
        index=True,
        comment="draft/published/archived/paused",
    )

    visibility: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="unlisted",
        comment="private/unlisted/public",
    )

    language: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="en",
        comment="ISO language code (en, es, fr, etc.)",
    )

    # -------------------------------------------------------------------------
    # 🎨 VISUAL BUILDER: LAYOUT SCHEMA
    # -------------------------------------------------------------------------

    layout: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="'{}'::jsonb",
        comment="Page layout structure (sections, components, grid)",
    )
    """
    Layout schema structure:
    {
        "template": "hero",
        "steps": [
            {
                "id": "step-1",
                "name": "Welcome",
                "sections": [
                    {
                        "id": "hero-section",
                        "type": "hero",
                        "background": {"type": "gradient", "from": "#FF6B6B", "to": "#4ECDC4"},
                        "padding": {"top": 80, "bottom": 80},
                        "components": [
                            {
                                "id": "headline-1",
                                "type": "headline",
                                "text": "Transform Your Business",
                                "fontSize": 48,
                                "fontWeight": "bold",
                                "textAlign": "center"
                            },
                            {
                                "id": "form-1",
                                "type": "form",
                                "questionIds": ["q1", "q2"],
                                "layout": "vertical",
                                "width": "md"
                            }
                        ]
                    }
                ]
            }
        ],
        "responsive": {
            "mobile": {...},
            "tablet": {...}
        }
    }
    """

    # -------------------------------------------------------------------------
    # 🎨 VISUAL BUILDER: THEME SYSTEM
    # -------------------------------------------------------------------------

    theme: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="'{}'::jsonb",
        comment="Design system (colors, typography, spacing)",
    )
    """
    Theme schema structure:
    {
        "colors": {
            "primary": "#FF6B6B",
            "secondary": "#4ECDC4",
            "accent": "#FFE66D",
            "background": "#FFFFFF",
            "text": "#2C3E50",
            "textLight": "#7F8C8D",
            "success": "#2ECC71",
            "error": "#E74C3C"
        },
        "typography": {
            "fontFamily": {
                "heading": "Inter",
                "body": "Roboto"
            },
            "fontSize": {
                "xs": 12, "sm": 14, "base": 16, "lg": 18,
                "xl": 20, "2xl": 24, "3xl": 32, "4xl": 48
            },
            "fontWeight": {
                "normal": 400, "medium": 500, "semibold": 600, "bold": 700
            }
        },
        "spacing": {
            "unit": 8, "xs": 4, "sm": 8, "md": 16,
            "lg": 24, "xl": 32, "2xl": 48, "3xl": 64
        },
        "borderRadius": {
            "sm": 4, "md": 8, "lg": 12, "xl": 16, "full": 9999
        },
        "shadows": {
            "sm": "0 1px 2px rgba(0,0,0,0.05)",
            "md": "0 4px 6px rgba(0,0,0,0.1)",
            "lg": "0 10px 15px rgba(0,0,0,0.1)"
        }
    }
    """

    # -------------------------------------------------------------------------
    # 🎯 A/B TESTING
    # -------------------------------------------------------------------------

    ab_testing: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=True,
        default=dict,
        server_default="'{}'::jsonb",
        comment="A/B test configuration and results",
    )
    """
    A/B testing schema:
    {
        "enabled": true,
        "testId": "test-123",
        "variants": [
            {
                "id": "control",
                "name": "Original",
                "weight": 50,
                "layoutOverrides": {...},
                "themeOverrides": {...}
            },
            {
                "id": "variant-a",
                "name": "Bold CTA",
                "weight": 50,
                "layoutOverrides": {...}
            }
        ],
        "metrics": {
            "control": {"views": 1000, "starts": 500, "completes": 250},
            "variant-a": {"views": 1000, "starts": 550, "completes": 300}
        },
        "winner": null,
        "confidence": 0.95
    }
    """

    # -------------------------------------------------------------------------
    # 📊 SEO & METADATA
    # -------------------------------------------------------------------------

    seo_metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="'{}'::jsonb",
        comment="SEO tags, OG images, meta descriptions",
    )
    """
    SEO metadata schema:
    {
        "title": "Discover Your Perfect Product | Brand",
        "description": "Take our 2-minute quiz...",
        "keywords": ["product finder", "quiz"],
        "og": {
            "title": "...",
            "description": "...",
            "image": "https://...",
            "type": "website"
        },
        "twitter": {
            "card": "summary_large_image",
            "title": "...",
            "description": "...",
            "image": "..."
        },
        "canonical": "https://example.com/quiz",
        "robots": "index, follow"
    }
    """

    # -------------------------------------------------------------------------
    # 🤖 AI & CONFIGURATION
    # -------------------------------------------------------------------------

    config: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="'{}'::jsonb",
        comment="General configuration (redirects, integrations, etc.)",
    )

    ai_metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=True,
        default=dict,
        server_default="'{}'::jsonb",
        comment="AI generation context, prompts, model versions",
    )
    """
    AI metadata schema:
    {
        "generated": true,
        "prompt": "Create a fitness quiz...",
        "model": "gpt-4",
        "timestamp": "2025-01-01T...",
        "suggestions": ["Add progress bar", "Use warm colors"],
        "optimizationScore": 0.85
    }
    """

    # -------------------------------------------------------------------------
    # 📈 PERFORMANCE METRICS
    # -------------------------------------------------------------------------

    views_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Total page views",
    )

    starts_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Users who started (answered at least 1 question)",
    )

    completes_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Users who completed the funnel",
    )

    leads_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Total leads captured (email, phone, etc.)",
    )

    published_version: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        default=1,
        comment="Version counter (increments on each publish)",
    )
    
    publish_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Notes about this published version"
    )

    # -------------------------------------------------------------------------
    # 🏷️ TARGETING & TAGGING
    # -------------------------------------------------------------------------

    tags: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String),
        nullable=True,
        default=list,
        server_default="'{}'",
        comment="User-defined tags for filtering",
    )

    target_platforms: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String),
        nullable=True,
        default=list,
        server_default="'{}'",
        comment="Target platforms (web, mobile, facebook, instagram)",
    )

    # -------------------------------------------------------------------------
    # 🗑️ SOFT DELETE
    # -------------------------------------------------------------------------

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        server_default="false",
        comment="Soft delete flag",
    )

    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Soft deletion timestamp",
    )

    # -------------------------------------------------------------------------
    # 🔗 RELATIONSHIPS (✅ FIXED FOR EAGER LOADING)
    # -------------------------------------------------------------------------

    # ✅ FIXED: User relationship with proper back_populates
    owner: Mapped["User"] = relationship(
        "User",
        back_populates="funnels",  # ✅ Must match User.funnels
        lazy="select",  # ✅ Changed from "joined" to "select" for better control
    )

    # ✅ FIXED: FunnelGroup relationship with proper back_populates
    group: Mapped[Optional["FunnelGroup"]] = relationship(
        "FunnelGroup",
        back_populates="funnels",  # ✅ Must match FunnelGroup.funnels
        lazy="select",
        foreign_keys=[group_id],
    )

    # ✅ Questions relationship - supports eager loading
    questions: Mapped[List["Question"]] = relationship(
        "Question",
        back_populates="funnel",
        cascade="all, delete-orphan",
        order_by="Question.display_order",
        lazy="selectin",  # ✅ Efficient eager loading for lists
    )

    # ✅ Responses relationship - use dynamic for large collections
    responses: Mapped[List["Response"]] = relationship(
        "Response",
        back_populates="funnel",
        cascade="all, delete-orphan",
        lazy="dynamic",  # ✅ Returns query object for filtering
    )

    # ✅ Events relationship - use dynamic for analytics
    events: Mapped[List["Event"]] = relationship(
        "Event",
        back_populates="funnel",
        cascade="all, delete-orphan",
        lazy="dynamic",  # ✅ Returns query object for filtering
    )

    # -------------------------------------------------------------------------
    # 🔍 INDEXES & CONSTRAINTS
    # -------------------------------------------------------------------------

    __table_args__ = (
        UniqueConstraint("user_id", "title", name="uq_funnel_user_title"),
        Index("idx_funnel_user_status", "user_id", "status"),
        Index("idx_funnel_niche_status", "niche", "status"),
        Index("idx_funnel_created_at", "created_at"),
        Index("idx_funnel_tags_gin", "tags", postgresql_using="gin"),
        Index("idx_funnel_config_gin", "config", postgresql_using="gin"),
        Index("idx_funnel_layout_gin", "layout", postgresql_using="gin"),
        Index("idx_funnel_theme_gin", "theme", postgresql_using="gin"),
        Index("idx_funnel_group_id", "group_id"),
        Index("idx_funnel_group_status", "group_id", "status"),
        CheckConstraint("char_length(slug) >= 3", name="ck_funnel_slug_length"),
        CheckConstraint("views_count >= 0", name="ck_funnel_views_positive"),
        CheckConstraint("starts_count >= 0", name="ck_funnel_starts_positive"),
        CheckConstraint("completes_count >= 0", name="ck_funnel_completes_positive"),
    )

    # -------------------------------------------------------------------------
    # ✅ VALIDATORS
    # -------------------------------------------------------------------------

    @validates('slug')
    def validate_slug(self, key, value):
        """Ensure slug is URL-safe"""
        if not re.match(r'^[a-z0-9-]+$', value):
            raise ValueError("Slug must contain only lowercase letters, numbers, and hyphens")
        return value

    @validates('language')
    def validate_language(self, key, value):
        """Validate ISO language code"""
        if not re.match(r'^[a-z]{2}(-[A-Z]{2})?$', value):
            raise ValueError("Invalid language code format (expected: 'en' or 'en-US')")
        return value

    # -------------------------------------------------------------------------
    # 📊 COMPUTED PROPERTIES
    # -------------------------------------------------------------------------

    @property
    def is_published(self) -> bool:
        """Check if funnel is live"""
        return self.status == "published"

    @property
    def completion_rate(self) -> float:
        """Calculate completion rate (completes / starts)"""
        if self.starts_count == 0:
            return 0.0
        return round(self.completes_count / self.starts_count, 4)

    @property
    def view_to_lead_rate(self) -> float:
        """Calculate view-to-lead conversion rate"""
        if self.views_count == 0:
            return 0.0
        return round(self.leads_count / self.views_count, 4)

    @property
    def start_rate(self) -> float:
        """Calculate start rate (starts / views)"""
        if self.views_count == 0:
            return 0.0
        return round(self.starts_count / self.views_count, 4)

    @property
    def abandonment_rate(self) -> float:
        """Calculate abandonment rate"""
        if self.starts_count == 0:
            return 0.0
        abandoned = self.starts_count - self.completes_count
        return round(abandoned / self.starts_count, 4)

    @property
    def is_in_group(self) -> bool:
        """Check if funnel belongs to a group"""
        return self.group_id is not None

    @property
    def hierarchy_path(self) -> str:
        """Get hierarchy path string"""
        parts = []
        if self.group and hasattr(self.group, 'name'):
            parts.append(self.group.name)
        parts.append(self.title)
        return " → ".join(parts)

    # -------------------------------------------------------------------------
    # 🎨 LAYOUT HELPERS
    # -------------------------------------------------------------------------

    def get_layout_template(self) -> str:
        """Get the base layout template name"""
        return self.layout.get("template", "minimal") if self.layout else "minimal"

    def set_layout_template(self, template: str):
        """Set the base layout template"""
        if not self.layout:
            self.layout = {}
        self.layout["template"] = template

    def get_step_by_id(self, step_id: str) -> Optional[Dict]:
        """Get a specific step from layout"""
        if not self.layout or "steps" not in self.layout:
            return None
        for step in self.layout.get("steps", []):
            if step.get("id") == step_id:
                return step
        return None

    def add_section_to_step(self, step_id: str, section: Dict[str, Any]):
        """Add a section to a specific step"""
        if not self.layout:
            self.layout = {"steps": []}
        
        step = self.get_step_by_id(step_id)
        if step:
            if "sections" not in step:
                step["sections"] = []
            step["sections"].append(section)
        else:
            # Create step if doesn't exist
            new_step = {
                "id": step_id,
                "sections": [section]
            }
            self.layout.setdefault("steps", []).append(new_step)

    # -------------------------------------------------------------------------
    # 🎨 THEME HELPERS
    # -------------------------------------------------------------------------

    def get_theme_color(self, color_key: str, default: str = "#000000") -> str:
        """Get a theme color by key"""
        if not self.theme:
            return default
        return self.theme.get("colors", {}).get(color_key, default)

    def set_theme_color(self, color_key: str, color_value: str):
        """Set a theme color"""
        if not self.theme:
            self.theme = {}
        if "colors" not in self.theme:
            self.theme["colors"] = {}
        self.theme["colors"][color_key] = color_value

    def apply_theme_preset(self, preset: str):
        """Apply a predefined theme preset"""
        presets = {
            "modern": {
                "colors": {
                    "primary": "#6366F1",
                    "secondary": "#EC4899",
                    "background": "#FFFFFF",
                    "text": "#1F2937"
                }
            },
            "dark": {
                "colors": {
                    "primary": "#10B981",
                    "secondary": "#3B82F6",
                    "background": "#111827",
                    "text": "#F9FAFB"
                }
            },
            "warm": {
                "colors": {
                    "primary": "#F59E0B",
                    "secondary": "#EF4444",
                    "background": "#FFFBEB",
                    "text": "#78350F"
                }
            }
        }
        
        if preset in presets:
            self.theme = presets[preset]

    # -------------------------------------------------------------------------
    # 📊 LIFECYCLE METHODS
    # -------------------------------------------------------------------------

    def mark_published(self, increment_version: bool = True):
        """Publish the funnel"""
        self.status = "published"
        self.last_published_at = datetime.utcnow()
        if increment_version:
            current = int(self.published_version or 0)
            self.published_version = current + 1

    def unpublish(self):
        """Unpublish and revert to draft"""
        self.status = "draft"

    def pause(self):
        """Pause a published funnel"""
        if self.status == "published":
            self.status = "paused"

    def archive(self):
        """Archive the funnel"""
        self.status = "archived"

    def restore_from_archive(self):
        """Restore from archive to draft"""
        if self.status == "archived":
            self.status = "draft"

    def soft_delete(self):
        """Soft delete the funnel"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()

    def restore_from_trash(self):
        """Restore a soft-deleted funnel"""
        self.is_deleted = False
        self.deleted_at = None

    # -------------------------------------------------------------------------
    # 🔧 UTILITY METHODS
    # -------------------------------------------------------------------------

    @staticmethod
    def generate_slug(title: str, suffix: Optional[str] = None) -> str:
        """Generate URL-safe slug from title"""
        slug = title.strip().lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')[:80]
        if suffix:
            slug = f"{slug}-{suffix}".strip('-')
        return slug

    def get_config(self, path: str, default: Any = None) -> Any:
        """Get nested config value using dot notation"""
        if not self.config:
            return default
        keys = path.split(".")
        value = self.config
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value

    def set_config(self, path: str, value: Any):
        """Set nested config value using dot notation"""
        if not self.config:
            self.config = {}
        keys = path.split(".")
        current = self.config
        for k in keys[:-1]:
            if k not in current or not isinstance(current[k], dict):
                current[k] = {}
            current = current[k]
        current[keys[-1]] = value

    def clone(
        self,
        new_owner_id: Optional[str] = None,
        new_group_id: Optional[str] = None,
        include_stats: bool = False,
        suffix: Optional[str] = None,
        deep_copy_layout: bool = True
    ) -> "Funnel":
        """Clone the funnel with all settings"""
        import copy
        
        new_funnel = Funnel(
            user_id=new_owner_id or self.user_id,
            group_id=new_group_id if new_group_id is not None else self.group_id,
            title=f"{self.title} (Copy)" if not suffix else f"{self.title} {suffix}",
            description=self.description,
            slug=self.generate_slug(self.title, suffix or str(uuid.uuid4())[:6]),
            niche=self.niche,
            primary_goal=self.primary_goal,
            funnel_type=self.funnel_type,
            status="draft",
            visibility="private",
            language=self.language,
            config=copy.deepcopy(self.config) if self.config else {},
            ai_metadata=copy.deepcopy(self.ai_metadata) if self.ai_metadata else {},
            layout=copy.deepcopy(self.layout) if deep_copy_layout and self.layout else {},
            theme=copy.deepcopy(self.theme) if self.theme else {},
            seo_metadata=copy.deepcopy(self.seo_metadata) if self.seo_metadata else {},
            tags=list(self.tags) if self.tags else [],
            target_platforms=list(self.target_platforms) if self.target_platforms else [],
        )

        if include_stats:
            new_funnel.views_count = self.views_count
            new_funnel.starts_count = self.starts_count
            new_funnel.completes_count = self.completes_count
            new_funnel.leads_count = self.leads_count

        return new_funnel

    def to_dict(
        self,
        include_stats: bool = False,
        include_layout: bool = True,
        include_hierarchy: bool = True
    ) -> Dict[str, Any]:
        """Convert funnel to dictionary"""
        data = {
            "funnel_id": self.funnel_id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "slug": self.slug,
            "niche": self.niche,
            "primary_goal": self.primary_goal,
            "funnel_type": self.funnel_type,
            "status": self.status,
            "visibility": self.visibility,
            "language": self.language,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_published_at": self.last_published_at.isoformat() if self.last_published_at else None,
            "published_version": self.published_version,
            "tags": self.tags or [],
            "target_platforms": self.target_platforms or [],
        }

        if include_hierarchy:
            data["group_id"] = self.group_id
            data["hierarchy_path"] = self.hierarchy_path

        if include_layout:
            data["layout"] = self.layout or {}
            data["theme"] = self.theme or {}
            data["seo_metadata"] = self.seo_metadata or {}

        if include_stats:
            data["views_count"] = self.views_count
            data["starts_count"] = self.starts_count
            data["completes_count"] = self.completes_count
            data["leads_count"] = self.leads_count
            data["completion_rate"] = self.completion_rate
            data["view_to_lead_rate"] = self.view_to_lead_rate

        return data

    def __repr__(self) -> str:
        """String representation"""
        return f"<Funnel(funnel_id={self.funnel_id}, title={self.title}, status={self.status})>"


# =============================================================================
# SQLALCHEMY EVENTS
# =============================================================================

@event.listens_for(Funnel, 'before_insert')
def generate_slug_if_missing(mapper, connection, target):
    """Auto-generate slug if not provided"""
    if not target.slug:
        target.slug = Funnel.generate_slug(target.title, str(uuid.uuid4())[:6])


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "Funnel",
    "FunnelStatusEnum",
    "FunnelTypeEnum",
    "FunnelVisibilityEnum",
    "FunnelTemplateEnum",
]
