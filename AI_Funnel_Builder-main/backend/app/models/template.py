"""
AI FUNNEL BUILDER - TEMPLATE MODELS (PRODUCTION - CIRCULAR IMPORT FREE)
=================================================================
Template marketplace with full monetization, moderation, ratings, and analytics.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import uuid
import enum
from decimal import Decimal

from sqlalchemy import (
    String, Boolean, DateTime, Integer, Numeric, Text, Enum,
    ForeignKey, Index, CheckConstraint, func, Float, literal
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# =============================================================================
# ENUMS (LOCAL - NO IMPORTS!)
# =============================================================================

class TemplateStatusEnum(str, enum.Enum):
    """Template listing status."""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"

class TemplateCategoryEnum(str, enum.Enum):
    """Template categories."""
    LEAD_GENERATION = "lead_generation"
    PRODUCT_RECOMMENDATION = "product_recommendation"
    AUDIENCE_RESEARCH = "audience_research"
    BRAND_PARTNERSHIP = "brand_partnership"
    ENGAGEMENT = "engagement"
    FEEDBACK = "feedback"
    CONTEST = "contest"
    OTHER = "other"

class PricingModelEnum(str, enum.Enum):
    """Pricing models."""
    FREE = "free"
    ONE_TIME = "one_time"
    SUBSCRIPTION = "subscription"
    PAY_WHAT_YOU_WANT = "pay_what_you_want"

class QuestionTypeEnum(str, enum.Enum):
    """Question types for template questions."""
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    EMAIL = "email"
    PHONE = "phone"
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    RATING = "rating"
    SLIDER = "slider"
    NPS = "nps"
    YES_NO = "yes_no"
    DATE = "date"
    FILE_UPLOAD = "file_upload"

# =============================================================================
# TEMPLATE QUESTION MODEL
# =============================================================================

class TemplateQuestion(Base):
    """Individual question within a template - PRODUCTION READY!"""
    
    __tablename__ = "template_questions"
    
    # 1️⃣ PRIMARY KEY + TIMESTAMPS (MUST BE FIRST!)
    question_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique question identifier"
    )
    
    created_at: Mapped[datetime] = mapped_column(  # ✅ ADDED!
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    
    updated_at: Mapped[datetime] = mapped_column(  # ✅ ADDED!
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    # 2️⃣ FOREIGN KEYS
    template_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("templates.template_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # 3️⃣ DATA FIELDS
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    question_type: Mapped[QuestionTypeEnum] = mapped_column(
        Enum(QuestionTypeEnum, name="question_type_enum"),
        nullable=False,
        default=literal(QuestionTypeEnum.SHORT_TEXT),
        index=True
    )
    
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=literal(True))
    
    options: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True, default=literal([]))
    validation: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True, default=literal({}))
    
    avg_response_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dropoff_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    placeholder: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    help_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    skip_logic: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True, default=literal({}))
    
    # 4️⃣ RELATIONSHIPS
    template: Mapped["Template"] = relationship("Template", back_populates="questions", lazy="selectin")
    
    # 5️⃣ INDEXES (LAST - ALL COLUMNS EXIST!)
    __table_args__ = (
        Index("idx_template_question_order", "template_id", "display_order"),
        CheckConstraint("display_order >= 0", name="ck_question_order_positive"),
        CheckConstraint("dropoff_rate >= 0 AND dropoff_rate <= 1", name="ck_dropoff_rate_range"),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "question_id": self.question_id,
            "template_id": self.template_id,
            "question_text": self.question_text,
            "question_type": self.question_type.value,
            "display_order": self.display_order,
            "is_required": self.is_required,
            "options": self.options,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# =============================================================================
# TEMPLATE MODEL
# =============================================================================

class Template(Base):
    """Template marketplace model - PRODUCTION READY!"""
    
    __tablename__ = "templates"
    
    # 1️⃣ PRIMARY KEY + TIMESTAMPS + SOFT DELETE
    template_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique template identifier"
    )
    
    created_at: Mapped[datetime] = mapped_column(  # ✅ ADDED - FIXES INDEX ERROR!
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    
    updated_at: Mapped[datetime] = mapped_column(  # ✅ ADDED!
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    is_deleted: Mapped[bool] = mapped_column(  # ✅ ADDED - SOFT DELETE
        Boolean,
        default=literal(False),
        nullable=False,
        index=True
    )
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(  # ✅ ADDED
        DateTime(timezone=True),
        nullable=True
    )
    
    # 2️⃣ FOREIGN KEYS
    creator_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    funnel_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("funnels.funnel_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # 3️⃣ BASIC INFO
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # 4️⃣ CATEGORIZATION
    category: Mapped[TemplateCategoryEnum] = mapped_column(
        Enum(TemplateCategoryEnum, name="template_category_enum"),
        nullable=False,
        index=True
    )
    subcategory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tags: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True, default=literal([]))
    niche: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    
    # 5️⃣ PRICING
    pricing_model: Mapped[PricingModelEnum] = mapped_column(
        Enum(PricingModelEnum, name="pricing_model_enum"),
        nullable=False,
        default=literal(PricingModelEnum.FREE),
        index=True
    )
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=literal(Decimal('0.00')))
    suggested_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    min_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    
    # 6️⃣ TEMPLATE DATA
    template_data: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=literal(1))
    
    # 7️⃣ MEDIA
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    preview_images: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True, default=literal([]))
    demo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # 8️⃣ STATUS & MODERATION
    status: Mapped[TemplateStatusEnum] = mapped_column(
        Enum(TemplateStatusEnum, name="template_status_enum"),
        nullable=False,
        default=literal(TemplateStatusEnum.DRAFT),
        index=True
    )
    submitted_for_review_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # 9️⃣ VISIBILITY
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=literal(False), index=True)
    is_staff_pick: Mapped[bool] = mapped_column(Boolean, nullable=False, default=literal(False))
    featured_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # 🔟 ANALYTICS
    usage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=literal(0), index=True)
    purchase_count: Mapped[int] = mapped_column(Integer, nullable=False, default=literal(0))
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=literal(0))
    favorite_count: Mapped[int] = mapped_column(Integer, nullable=False, default=literal(0))
    
    # 1️⃣1️⃣ RATINGS
    rating_average: Mapped[float] = mapped_column(Float, nullable=False, default=literal(0.0), index=True)
    rating_count: Mapped[int] = mapped_column(Integer, nullable=False, default=literal(0))
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=literal(0))
    
    # 1️⃣2️⃣ REVENUE
    total_revenue: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=literal(Decimal('0.00')))
    creator_earnings: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=literal(Decimal('0.00')))
    platform_fee_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=literal(0.20))
    
    # 1️⃣3️⃣ METADATA
    template_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True, default=literal({}))
    seo_keywords: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True, default=literal([]))
    
    # 1️⃣4️⃣ RELATIONSHIPS (STRING REFERENCES)
    questions: Mapped[List["TemplateQuestion"]] = relationship(
        "TemplateQuestion",
        back_populates="template",
        order_by="TemplateQuestion.display_order",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    # 1️⃣5️⃣ INDEXES (LAST - ALL COLUMNS EXIST!)
    __table_args__ = (
        Index("idx_template_status_featured", "status", "is_featured"),
        Index("idx_template_category_status", "category", "status"),
        Index("idx_template_niche_status", "niche", "status"),
        Index("idx_template_usage_count", "usage_count"),
        Index("idx_template_rating", "rating_average", "rating_count"),
        Index("idx_template_created_at", "created_at"),  # ✅ NOW WORKS!
        Index("idx_template_tags_gin", "tags", postgresql_using="gin"),
        Index("idx_template_seo_gin", "seo_keywords", postgresql_using="gin"),
        Index("idx_template_creator_status", "creator_id", "status"),
        CheckConstraint("price >= 0", name="ck_template_price_positive"),
        CheckConstraint("rating_average >= 0 AND rating_average <= 5", name="ck_template_rating_range"),
        CheckConstraint("usage_count >= 0", name="ck_template_usage_positive"),
        CheckConstraint("platform_fee_percentage >= 0 AND platform_fee_percentage <= 1", name="ck_template_fee_range"),
    )
    
    # PROPERTIES & METHODS (ALL YOUR EXISTING BUSINESS LOGIC - UNCHANGED!)
    @property
    def is_free(self) -> bool:
        return self.pricing_model == PricingModelEnum.FREE or self.price == Decimal('0.00')
    
    @property
    def is_published(self) -> bool:
        return self.status == TemplateStatusEnum.APPROVED
    
    @property
    def question_count(self) -> int:
        return len(self.questions) if self.questions else 0
    
    def submit_for_review(self) -> None:
        if self.status != TemplateStatusEnum.DRAFT:
            raise ValueError("Only draft templates can be submitted for review")
        self.status = TemplateStatusEnum.PENDING_REVIEW
        self.submitted_for_review_at = datetime.now()
    
    def approve(self, admin_user_id: str) -> None:
        if self.status != TemplateStatusEnum.PENDING_REVIEW:
            raise ValueError("Only pending templates can be approved")
        self.status = TemplateStatusEnum.APPROVED
        self.approved_at = datetime.now()
        self.approved_by = admin_user_id
    
    def add_purchase(self, amount: Decimal) -> None:
        self.purchase_count += 1
        self.usage_count += 1
        self.total_revenue += amount
        platform_fee = amount * Decimal(str(self.platform_fee_percentage))
        self.creator_earnings += (amount - platform_fee)
    
    def to_dict(self, include_questions: bool = False) -> Dict[str, Any]:
        result = {
            "template_id": self.template_id,
            "title": self.title,
            "slug": self.slug,
            "category": self.category.value,
            "price": float(self.price),
            "is_free": self.is_free,
            "status": self.status.value,
            "rating_average": self.rating_average,
            "usage_count": self.usage_count,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        if include_questions:
            result["questions"] = [q.to_dict() for q in self.questions]
        return result

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "Template",
    "TemplateQuestion",
    "TemplateStatusEnum",
    "TemplateCategoryEnum",
    "PricingModelEnum",
    "QuestionTypeEnum"
]
