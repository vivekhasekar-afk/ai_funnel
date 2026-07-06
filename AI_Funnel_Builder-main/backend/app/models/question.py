# =============================================================================
# AI FUNNEL BUILDER - QUESTION MODEL
# =============================================================================
# Individual question/prompt within a funnel with flexible answer types
# =============================================================================

from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any, TYPE_CHECKING
import uuid
import enum

if TYPE_CHECKING:
    from app.models.funnel import Funnel
    from app.models.question_effectiveness import QuestionEffectiveness
    from app.models.response_answer import ResponseAnswer

from sqlalchemy import (
    Column,
    Float,
    String,
    Boolean,
    Integer,
    Text,
    Enum,
    ForeignKey,
    Index,
    CheckConstraint,
    func,
    literal,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.database import Base

# =============================================================================
# ENUMS
# =============================================================================

class QuestionTypeEnum(str, enum.Enum):
    """Question/answer format types."""
    MULTIPLE_CHOICE = "multiple_choice"
    MULTIPLE_SELECT = "multiple_select"
    TEXT_SHORT = "text_short"
    TEXT_LONG = "text_long"
    EMAIL = "email"
    PHONE = "phone"
    NUMBER = "number"
    RATING = "rating"
    SCALE = "scale"
    YES_NO = "yes_no"
    DROPDOWN = "dropdown"
    DATE = "date"
    FILE_UPLOAD = "file_upload"
    MATRIX = "matrix"
    RANKING = "ranking"
    SINGLE_CHOICE = "single_choice"


class QuestionRequirementEnum(str, enum.Enum):
    """Answer requirement level."""
    REQUIRED = "required"
    OPTIONAL = "optional"
    CONDITIONAL = "conditional"

# =============================================================================
# QUESTION MODEL
# =============================================================================

class Question(Base):
    """
    Question model representing a single prompt in a funnel.
    """

    __tablename__ = "questions"

    # -------------------------------------------------------------------------
    # PRIMARY KEY
    # -------------------------------------------------------------------------

    question_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique question identifier (UUID v4)",
    )

    # -------------------------------------------------------------------------
    # FOREIGN KEY TO FUNNEL
    # -------------------------------------------------------------------------

    funnel_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("funnels.funnel_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Parent funnel ID",
    )

    funnel: Mapped["Funnel"] = relationship(
        "Funnel",
        back_populates="questions",
        lazy="joined",
    )

    # -------------------------------------------------------------------------
    # QUESTION CONTENT
    # -------------------------------------------------------------------------

    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Question prompt/text shown to user",
    )

    # ✅ FIX: Store as STRING, not Enum object
    # This forces SQLAlchemy to always use the lowercase string value
    question_type: Mapped[str] = mapped_column(
        String(50),  # Use VARCHAR instead of native Enum
        nullable=False,
        index=True,
        comment="Answer format type (lowercase string)",
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Optional helper text or instructions",
    )

    placeholder: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Placeholder text for input fields",
    )

    # -------------------------------------------------------------------------
    # OPTIONS & CHOICES (JSONB)
    # -------------------------------------------------------------------------

    options: Mapped[Optional[List[str]] | Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=True,
        default=list,
        server_default="'[]'::jsonb",  # ✅ Default to empty JSON array
        comment="Question options/choices for MCQ, dropdown, etc.",
    )

    # -------------------------------------------------------------------------
    # VALIDATION RULES (JSONB)
    # -------------------------------------------------------------------------

    validation: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default=dict,
        server_default="'{}'::jsonb",
        comment="Validation rules for answer (regex, min/max length, etc.)",
    )

    # ✅ FIX: Store as STRING, not Enum object
    is_required: Mapped[str] = mapped_column(
        String(20),  # Use VARCHAR instead of native Enum
        nullable=False,
        default="required",
        server_default="'required'",
        comment="Whether answer is required (lowercase string)",
    )

    # -------------------------------------------------------------------------
    # CONDITIONAL LOGIC (JSONB)
    # -------------------------------------------------------------------------

    logic: Mapped[Optional[List[Any]] | Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=True,
        default=list,
        server_default="'[]'::jsonb",  # ✅ Default to empty JSON array
        comment="Conditional logic for skip patterns and branching",
    )

    # -------------------------------------------------------------------------
    # DISPLAY & ORDERING
    # -------------------------------------------------------------------------

    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
        default=0,
        comment="Display sequence within funnel (0-based)",
    )

    section_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Optional section/group name for organization",
    )

    # -------------------------------------------------------------------------
    # MEDIA ATTACHMENTS
    # -------------------------------------------------------------------------

    media_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="Media file URL (image/video/audio)",
    )

    media_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="MIME type of media (image/jpeg, video/mp4, etc.)",
    )

    # -------------------------------------------------------------------------
    # SCORING & ANALYSIS
    # -------------------------------------------------------------------------

    scoring_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        comment="Whether this question contributes to scoring",
    )

    # ✅ FIX: Database has INTEGER, not FLOAT
    weight: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
        comment="Weight multiplier for scoring (default 1)",
    )

    analysis_tags: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String),
        nullable=True,
        default=list,
        server_default="'{}'",  # PostgreSQL array notation
        comment="Tags for data segmentation",
    )

    # -------------------------------------------------------------------------
    # METADATA
    # -------------------------------------------------------------------------

    question_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default=dict,
        server_default="'{}'::jsonb",
        comment="Additional metadata",
    )

    # -------------------------------------------------------------------------
    # PERFORMANCE TRACKING
    # -------------------------------------------------------------------------

    response_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Total number of answers received",
    )

    skip_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Number of times question was skipped",
    )

    # -------------------------------------------------------------------------
    # TIMESTAMPS (Add these if missing)
    # -------------------------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    # -------------------------------------------------------------------------
    # RELATIONSHIPS
    # -------------------------------------------------------------------------

    answers: Mapped[List["ResponseAnswer"]] = relationship(
        "ResponseAnswer",
        back_populates="question",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

#    effectiveness: Mapped[Optional["QuestionEffectiveness"]] = relationship(
#        "QuestionEffectiveness",
#        back_populates="question",
#        uselist=False,
#        cascade="all, delete-orphan",
#    )

    # -------------------------------------------------------------------------
    # INDEXES & CONSTRAINTS
    # -------------------------------------------------------------------------

    __table_args__ = (
        Index("idx_questions_funnel_id", "funnel_id"),
        Index("idx_questions_display_order", "display_order"),
        Index("idx_question_funnel_order", "funnel_id", "display_order"),
        Index("idx_question_type", "question_type"),
        Index("idx_question_options_gin", "options", postgresql_using="gin"),
        Index("idx_question_logic_gin", "logic", postgresql_using="gin"),
        CheckConstraint("display_order >= 0", name="ck_question_display_order_positive"),
        CheckConstraint("weight > 0", name="ck_question_weight_positive"),
    )

    # -------------------------------------------------------------------------
    # HELPER PROPERTIES
    # -------------------------------------------------------------------------

    @property
    def skip_rate(self) -> float:
        """Calculate skip rate (skips / total responses)."""
        total = self.response_count + self.skip_count
        if total == 0:
            return 0.0
        return round(self.skip_count / total, 4)

    @property
    def has_media(self) -> bool:
        """Check if question has media attachment."""
        return bool(self.media_url)

    @property
    def has_conditional_logic(self) -> bool:
        """Check if question has conditional logic."""
        if not self.logic:
            return False
        if isinstance(self.logic, dict):
            return bool(self.logic.get("show_if") or self.logic.get("skip_to"))
        return False

    # -------------------------------------------------------------------------
    # OPTIONS HELPERS
    # -------------------------------------------------------------------------

    def get_choices(self) -> List[str]:
        """Get list of choices for MCQ/dropdown questions."""
        if not self.options:
            return []
        # Handle both list and dict formats
        if isinstance(self.options, list):
            return self.options
        if isinstance(self.options, dict):
            return self.options.get("choices", [])
        return []

    # -------------------------------------------------------------------------
    # SERIALIZATION
    # -------------------------------------------------------------------------

    def to_dict(self, include_stats: bool = False) -> dict:
        """Convert question to dictionary."""
        data = {
            "question_id": self.question_id,
            "funnel_id": self.funnel_id,
            "question_text": self.question_text,
            "question_type": self.question_type,  # Already a string
            "description": self.description,
            "placeholder": self.placeholder,
            "options": self.options or [],
            "validation": self.validation or {},
            "logic": self.logic or [],
            "is_required": self.is_required,  # Already a string
            "display_order": self.display_order,
            "section_name": self.section_name,
            "media_url": self.media_url,
            "media_type": self.media_type,
            "scoring_enabled": self.scoring_enabled,
            "weight": self.weight,
            "analysis_tags": self.analysis_tags or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_stats:
            data.update({
                "response_count": self.response_count,
                "skip_count": self.skip_count,
                "skip_rate": self.skip_rate,
            })

        return data

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "Question",
    "QuestionTypeEnum",
    "QuestionRequirementEnum",
]
