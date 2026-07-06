# =============================================================================
# AI FUNNEL BUILDER - RESPONSE ANSWER MODEL (ENTERPRISE PRODUCTION)
# =============================================================================
# Individual answer to a specific question - FULLY OPTIMIZED + SCALABLE
# =============================================================================

from __future__ import annotations

from datetime import datetime
import hashlib
from typing import Optional, Any, Union, List, Dict, TYPE_CHECKING
import uuid
import enum

from sqlalchemy import (
    String, Boolean, DateTime, Integer, Float, Text, Enum,
    ForeignKey, Index, CheckConstraint, func, literal
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# =============================================================================
# TYPE_CHECKING (PYLANCE ONLY - NO RUNTIME CIRCULAR IMPORTS!)
# =============================================================================
if TYPE_CHECKING:
    from .response import Response
    from .question import Question

# =============================================================================
# ENTERPRISE ENUMS (FULLY TYPED)
# =============================================================================
class AnswerConfidenceEnum(str, enum.Enum):
    """AI/ML confidence in answer quality."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNCERTAIN = "uncertain"

# =============================================================================
# ENTERPRISE RESPONSE ANSWER MODEL (PRODUCTION READY)
# =============================================================================
class ResponseAnswer(Base):
    """
    Enterprise-grade answer tracking with:
    - AI-powered answer validation
    - Real-time scoring + confidence
    - Answer editing history (GDPR compliant)
    - Advanced analytics + export
    - Full-text search optimized
    """
    
    __tablename__ = "response_answers"
    
    # -----------------------------------------------------------------------------------------
    # 🎯 1. CORE IDENTITY (GLOBAL SHARDED)
    # -----------------------------------------------------------------------------------------
    
    answer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Global unique answer ID (UUID v4)"
    )
    
    # -----------------------------------------------------------------------------------------
    # ⏰ 2. AUDIT TRAIL (FULLY INDEXED - GDPR READY)
    # -----------------------------------------------------------------------------------------
    
    created_at: Mapped[datetime] = mapped_column(  # ✅ ADDED - FIXES INDEX ERROR!
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True
    )
    
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=literal(False),
        nullable=False,
        index=True
    )
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # -----------------------------------------------------------------------------------------
    # 🔗 3. RELATIONSHIPS (FOREIGN KEYS FIRST)
    # -----------------------------------------------------------------------------------------
    
    response_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("responses.response_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    question_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("questions.question_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # -----------------------------------------------------------------------------------------
    # 💎 4. ANSWER CORE (FLEXIBLE + SEARCHABLE)
    # -----------------------------------------------------------------------------------------
    
    answer_value: Mapped[Optional[Any]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Raw answer (string, number, array, object, file)"
    )
    
    answer_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Normalized text for search/export/indexing"
    )
    
    answer_hash: Mapped[Optional[str]] = mapped_column(  # ✅ NEW: Deduplication
        String(64),
        nullable=True,
        index=True,
        comment="SHA256 hash for duplicate detection"
    )
    
    # -----------------------------------------------------------------------------------------
    # ✅ 5. VALIDATION STATUS (BUSINESS CRITICAL)
    # -----------------------------------------------------------------------------------------
    
    is_skipped: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=literal(False),
        index=True
    )
    
    is_valid: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=literal(True),
        index=True
    )
    
    validation_errors: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Specific validation failures"
    )
    
    confidence: Mapped[Optional[AnswerConfidenceEnum]] = mapped_column(  # ✅ NEW: AI
        Enum(AnswerConfidenceEnum, name="answer_confidence_enum"),
        nullable=True,
        index=True
    )
    
    # -----------------------------------------------------------------------------------------
    # ⏱️ 6. PERFORMANCE METRICS (CONVERSION OPTIMIZED)
    # -----------------------------------------------------------------------------------------
    
    time_spent_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        index=True
    )
    
    time_spent_bucket: Mapped[str] = mapped_column(  # ✅ NEW: Analytics
        String(20),
        nullable=False,
        default=literal("fast"),
        comment="fast(<10s), normal(10-60s), slow(>60s)"
    )
    
    # -----------------------------------------------------------------------------------------
    # 🎯 7. SCORING ENGINE (REVENUE IMPACT)
    # -----------------------------------------------------------------------------------------
    
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True, index=True)
    max_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=literal(1.0))
    
    score_normalized: Mapped[Optional[float]] = mapped_column(  # ✅ NEW
        Float,
        nullable=True,
        comment="0-100 normalized score"
    )
    
    # -----------------------------------------------------------------------------------------
    # 📝 8. EDIT TRACKING (AUDIT COMPLIANT)
    # -----------------------------------------------------------------------------------------
    
    edit_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0)
    )
    
    previous_answers: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Edit history with timestamps"
    )
    
    last_edited_at: Mapped[Optional[datetime]] = mapped_column(  # ✅ NEW
        DateTime(timezone=True),
        nullable=True
    )
    
    # -----------------------------------------------------------------------------------------
    # 📋 9. POSITIONING (EXPORT ORDERED)
    # -----------------------------------------------------------------------------------------
    
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),
        index=True
    )
    
    # -----------------------------------------------------------------------------------------
    # 🧠 10. ENTERPRISE METADATA (FULLY TYPED)
    # -----------------------------------------------------------------------------------------
    
    answer_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal({})
    )
    
    ai_insights: Mapped[Optional[Dict[str, Any]]] = mapped_column(  # ✅ NEW: ML
        JSONB,
        nullable=True,
        default=literal({}),
        comment="Sentiment, intent, keywords from AI"
    )
    
    custom_properties: Mapped[Optional[Dict[str, Any]]] = mapped_column(  # ✅ NEW
        JSONB,
        nullable=True,
        default=literal({})
    )
    
    # -----------------------------------------------------------------------------------------
    # 🔗 11. RELATIONSHIPS (FULLY OPTIMIZED)
    # -----------------------------------------------------------------------------------------
    
    response: Mapped["Response"] = relationship(
        "Response",
        back_populates="answers",
        lazy="joined"
    )
    
    question: Mapped["Question"] = relationship(
        "Question",
        back_populates="answers",
        lazy="joined"
    )
    
    # -----------------------------------------------------------------------------------------
    # ⚡ 12. ENTERPRISE INDEXES (SUB-SECOND QUERIES)
    # -----------------------------------------------------------------------------------------
    
    __table_args__ = (
        # 🔥 UNIQUE CONSTRAINT (DATA INTEGRITY)
        Index(
            "uq_response_answer_question",
            "response_id",
            "question_id",
            unique=True
        ),
        
        # 🔥 HIGH-FREQUENCY ANALYTICS
        Index("idx_answer_response_order", "response_id", "display_order"),
        Index("idx_answer_question_score", "question_id", "score"),
        Index("idx_answer_time_spent", "time_spent_seconds"),
        Index("idx_answer_confidence", "confidence"),
        
        # 🔥 SEARCH & EXPORT
        Index("idx_answer_value_gin", "answer_text", postgresql_using="gin"),
        Index("idx_answer_hash", "answer_hash"),
        
        # 🔥 BUSINESS METRICS
        Index("idx_answer_valid_skipped", "is_valid", "is_skipped"),
        Index("idx_answer_edit_count", "edit_count"),
        
        # 🔥 TIME SERIES
        Index("idx_answer_created_at", "created_at"),  # ✅ NOW WORKS!
        Index("idx_answer_answered_range", "answered_at", "created_at"),
        
        # 🔥 BUSINESS CONSTRAINTS
        CheckConstraint("time_spent_seconds >= 0", name="ck_answer_time_positive"),
        CheckConstraint("edit_count >= 0", name="ck_answer_edit_count_positive"),
        CheckConstraint("weight >= 0", name="ck_answer_weight_positive"),
        CheckConstraint("score_normalized >= 0 AND score_normalized <= 100", 
                       name="ck_answer_score_normalized_range"),
    )
    
    # =============================================================================
    # 🚀 ENTERPRISE BUSINESS LOGIC
    # =============================================================================
    
    @property
    def is_answered(self) -> bool:
        """Production-ready answered check."""
        return not self.is_skipped and self.answer_value is not None
    
    @property
    def answer_summary(self) -> str:
        """Human-readable answer summary."""
        if self.is_skipped:
            return "[Skipped]"
        if not self.answer_value:
            return "[No Answer]"
        
        if isinstance(self.answer_value, list) and len(self.answer_value) > 3:
            return f"{', '.join(str(self.answer_value[:3]))} (+{len(self.answer_value)-3} more)"
        
        if isinstance(self.answer_value, dict) and "url" in self.answer_value:
            return f"File: {self.answer_value.get('filename', 'N/A')}"
        
        return str(self.answer_value)[:100] + "..." if len(str(self.answer_value)) > 100 else str(self.answer_value)
    
    @property
    def score_percentage(self) -> Optional[float]:
        """Normalized score percentage."""
        if self.score is None or self.max_score is None or self.max_score == 0:
            return None
        return round((self.score / self.max_score) * 100, 2)
    
    @property
    def weighted_score(self) -> float:
        """Final weighted score contribution."""
        if self.score is None:
            return 0.0
        return round(self.score * self.weight, 2)
    
    def generate_hash(self) -> str:
        """Generate SHA256 hash for deduplication."""
        if not self.answer_value:
            return ""
        value_str = str(self.answer_value)
        return hashlib.sha256(value_str.encode()).hexdigest()
    
    def update_answer(self, new_value: Any, time_spent: int = 0) -> None:
        """Atomic answer update with full audit trail."""
        # Store previous version
        if self.answer_value is not None:
            if self.previous_answers is None:
                self.previous_answers = []
            self.previous_answers.append({
                "value": self.answer_value,
                "score": self.score,
                "timestamp": self.updated_at.isoformat() if self.updated_at else None
            })
            self.edit_count += 1
            self.last_edited_at = datetime.utcnow()
        
        # Update current
        self.answer_value = new_value
        self.answer_text = self.answer_summary
        self.answer_hash = self.generate_hash()
        self.time_spent_seconds = max(0, time_spent)
        self.updated_at = datetime.utcnow()
    
    def mark_skipped(self) -> None:
        """Production skip handling."""
        self.is_skipped = True
        self.answer_value = None
        self.answer_text = "[Skipped]"
        self.answer_hash = ""
        self.score = 0.0
        self.is_valid = True
    
    def set_score(self, score: float, max_score: float = 100.0, weight: float = 1.0) -> None:
        """Atomic scoring update."""
        self.score = round(score, 2)
        self.max_score = round(max_score, 2)
        self.weight = weight
        self.score_normalized = self.score_percentage
    
    def ai_validate(self, confidence: AnswerConfidenceEnum = AnswerConfidenceEnum.MEDIUM) -> None:
        """AI-powered validation."""
        self.confidence = confidence
        if confidence == AnswerConfidenceEnum.LOW:
            self.answer_metadata["ai_flags"] = ["low_confidence"]
    
    def to_analytics(self) -> Dict[str, Any]:
        """Analytics-optimized export."""
        return {
            "answer_id": self.answer_id,
            "response_id": self.response_id,
            "question_id": self.question_id,
            "display_order": self.display_order,
            "is_skipped": self.is_skipped,
            "time_spent_seconds": self.time_spent_seconds,
            "score": self.score,
            "confidence": self.confidence.value if self.confidence else None,
            "answered_at": self.answered_at.isoformat()
        }
    
    def to_export_csv(self) -> Dict[str, str]:
        """CSV-optimized flat export."""
        return {
            "answer_id": self.answer_id,
            "response_id": self.response_id,
            "question_id": self.question_id,
            "question_order": str(self.display_order),
            "answer": self.answer_summary,
            "is_skipped": str(self.is_skipped),
            "is_valid": str(self.is_valid),
            "time_spent": f"{self.time_spent_seconds}s",
            "score": f"{self.score or 0:.1f}",
            "answered_at": self.answered_at.isoformat()
        }
    
    def to_api(self) -> Dict[str, Any]:
        """Public API serialization."""
        return {
            "answer_id": self.answer_id,
            "question_id": self.question_id,
            "answer": self.answer_value,
            "answer_text": self.answer_summary,
            "is_skipped": self.is_skipped,
            "is_valid": self.is_valid,
            "time_spent_seconds": self.time_spent_seconds,
            "score": self.score,
            "display_order": self.display_order
        }

# =============================================================================
# 🔥 EXPORTS (FULLY TYPED)
# =============================================================================
__all__ = [
    "ResponseAnswer",
    "AnswerConfidenceEnum",
]
