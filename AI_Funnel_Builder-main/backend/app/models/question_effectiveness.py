# =============================================================================
# AI FUNNEL BUILDER - QUESTION EFFECTIVENESS MODEL
# =============================================================================
# Question-level performance tracking for optimization insights
# =============================================================================

from __future__ import annotations

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid

from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    ForeignKey,
    Index,
    CheckConstraint,
    UniqueConstraint,
    func,
    Boolean,
    DateTime,  # ✅ ADDED
    literal,  # ✅ ADDED
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.database import Base

# =============================================================================
# QUESTION EFFECTIVENESS MODEL
# =============================================================================

class QuestionEffectiveness(Base):
    """
    Question effectiveness tracking for optimization insights.
    """

    __tablename__ = "question_effectiveness"

    # -------------------------------------------------------------------------
    # PRIMARY KEY
    # -------------------------------------------------------------------------

    effectiveness_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique effectiveness record identifier",
    )

    # -------------------------------------------------------------------------
    # FOREIGN KEYS
    # -------------------------------------------------------------------------

    question_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("questions.question_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        comment="Question being measured",
    )

    question = relationship(
        "Question",
        back_populates="effectiveness",
        lazy="joined",
    )

    funnel_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("funnels.funnel_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Parent funnel (denormalized for fast queries)",
    )

    # -------------------------------------------------------------------------
    # BASIC METRICS
    # -------------------------------------------------------------------------

    total_views: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Total times question was displayed",
    )

    total_answers: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Total times question was answered",
    )

    total_skips: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Total times question was skipped",
    )

    total_edits: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Total times answer was edited/changed",
    )

    # -------------------------------------------------------------------------
    # CALCULATED RATES
    # -------------------------------------------------------------------------

    answer_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=literal(0.0),  # ✅ FIXED
        comment="Answer rate: answers / views (0.0-1.0)",
    )

    skip_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=literal(0.0),  # ✅ FIXED
        comment="Skip rate: skips / views (0.0-1.0)",
    )

    edit_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=literal(0.0),  # ✅ FIXED
        comment="Edit rate: edits / answers (0.0-1.0)",
    )

    drop_off_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=literal(0.0),  # ✅ FIXED
        comment="Drop-off rate: users who abandoned after this question (0.0-1.0)",
    )

    # -------------------------------------------------------------------------
    # TIME METRICS
    # -------------------------------------------------------------------------

    avg_time_to_answer_seconds: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Average time spent answering (seconds)",
    )

    median_time_to_answer_seconds: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Median time spent answering (seconds)",
    )

    total_time_spent_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Total cumulative time spent on this question",
    )

    # -------------------------------------------------------------------------
    # ANSWER DISTRIBUTION (for MCQ/rating/scale)
    # -------------------------------------------------------------------------

    answer_distribution: Mapped[Optional[Dict[str, int]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal({}),  # ✅ FIXED
        comment="Distribution of answers: {option_A: 50, option_B: 30, ...}",
    )

    answer_distribution_percentages: Mapped[Optional[Dict[str, float]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal({}),  # ✅ FIXED
        comment="Percentage distribution: {option_A: 0.50, option_B: 0.30, ...}",
    )

    # -------------------------------------------------------------------------
    # TEXT ANSWER ANALYSIS (for text questions)
    # -------------------------------------------------------------------------

    avg_answer_length_chars: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Average character length of text answers",
    )

    avg_answer_word_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Average word count of text answers",
    )

    common_keywords: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal([]),  # ✅ FIXED
        comment="Most common keywords in text answers",
    )

    # -------------------------------------------------------------------------
    # QUALITY INDICATORS
    # -------------------------------------------------------------------------

    validation_failure_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=literal(0.0),  # ✅ FIXED
        comment="Rate of validation failures (0.0-1.0)",
    )

    clarity_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="AI-calculated clarity score (0.0-1.0)",
    )

    engagement_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=literal(0.0),  # ✅ FIXED
        comment="Engagement score based on answer rate, time, edits (0.0-1.0)",
    )

    effectiveness_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=literal(0.0),  # ✅ FIXED
        comment="Overall effectiveness score (0.0-100)",
    )

    # -------------------------------------------------------------------------
    # COMPLETION CORRELATION
    # -------------------------------------------------------------------------

    answers_that_completed: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Number of users who answered this and completed funnel",
    )

    skips_that_completed: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Number of users who skipped this and completed funnel",
    )

    completion_correlation: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Correlation between answering this question and completion (-1.0 to 1.0)",
    )

    # -------------------------------------------------------------------------
    # DEVICE/PLATFORM BREAKDOWN
    # -------------------------------------------------------------------------

    mobile_answer_rate: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Answer rate on mobile devices",
    )

    desktop_answer_rate: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Answer rate on desktop devices",
    )

    device_performance_gap: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Difference between mobile and desktop answer rates",
    )

    # -------------------------------------------------------------------------
    # A/B TEST VARIANT (if applicable)
    # -------------------------------------------------------------------------

    variant_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
        comment="A/B test variant identifier",
    )

    is_control: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=literal(False),  # ✅ FIXED
        comment="True if this is the control variant (A/B test)",
    )

    # -------------------------------------------------------------------------
    # OPTIMIZATION FLAGS
    # -------------------------------------------------------------------------

    needs_optimization: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=literal(False),  # ✅ FIXED
        index=True,
        comment="AI flag: question needs optimization",
    )

    optimization_priority: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Optimization priority (1=highest, 10=lowest)",
    )

    optimization_recommendations: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal([]),  # ✅ FIXED
        comment="AI-generated optimization suggestions",
    )

    # -------------------------------------------------------------------------
    # METADATA
    # -------------------------------------------------------------------------

    last_calculated_at: Mapped[Optional[datetime]] = mapped_column(  # ✅ FIXED: removed column=
        DateTime(timezone=True),
        nullable=True,
        index=True,
        comment="When metrics were last calculated",
    )

    sample_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Sample size for statistical validity",
    )

    effectiveness_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(  # ✅ FIXED: removed "metadata"
        JSONB,
        nullable=True,
        default=literal({}),  # ✅ FIXED
        comment="Additional metadata",
    )

    # -------------------------------------------------------------------------
    # INDEXES & CONSTRAINTS
    # -------------------------------------------------------------------------

    __table_args__ = (
        Index("idx_effectiveness_funnel", "funnel_id"),
        Index("idx_effectiveness_funnel_score", "funnel_id", "effectiveness_score"),
        Index("idx_effectiveness_needs_optimization", "needs_optimization", "optimization_priority"),
        Index("idx_effectiveness_drop_off", "drop_off_rate"),
        Index("idx_effectiveness_variant", "variant_id"),
        Index("idx_effectiveness_answer_dist_gin", "answer_distribution", postgresql_using="gin"),
        Index("idx_effectiveness_recommendations_gin", "optimization_recommendations", postgresql_using="gin"),
        CheckConstraint("total_views >= 0", name="ck_effectiveness_views_positive"),
        CheckConstraint("total_answers >= 0", name="ck_effectiveness_answers_positive"),
        CheckConstraint("answer_rate >= 0 AND answer_rate <= 1", name="ck_effectiveness_answer_rate_range"),
        CheckConstraint("skip_rate >= 0 AND skip_rate <= 1", name="ck_effectiveness_skip_rate_range"),
        CheckConstraint("effectiveness_score >= 0 AND effectiveness_score <= 100", name="ck_effectiveness_score_range"),
    )

    # -------------------------------------------------------------------------
    # REPRESENTATION
    # -------------------------------------------------------------------------

    def __repr__(self) -> str:
        return f"<QuestionEffectiveness {self.question_id} (Score: {self.effectiveness_score:.1f})>"

    # -------------------------------------------------------------------------
    # CALCULATION METHODS
    # -------------------------------------------------------------------------

    def recalculate_metrics(self) -> None:
        """Recalculate all derived metrics from base counts."""
        if self.total_views > 0:
            self.answer_rate = round(self.total_answers / self.total_views, 4)
            self.skip_rate = round(self.total_skips / self.total_views, 4)
        else:
            self.answer_rate = 0.0
            self.skip_rate = 0.0

        if self.total_answers > 0:
            self.edit_rate = round(self.total_edits / self.total_answers, 4)
        else:
            self.edit_rate = 0.0

        self.engagement_score = self._calculate_engagement_score()
        self.effectiveness_score = self._calculate_effectiveness_score()
        self._assess_optimization_needs()
        self.last_calculated_at = datetime.utcnow()

    def _calculate_engagement_score(self) -> float:
        """Calculate engagement score (0.0-1.0)."""
        score = 0.0

        score += self.answer_rate * 0.40
        score += (1.0 - self.skip_rate) * 0.30

        if self.avg_time_to_answer_seconds:
            if 5 <= self.avg_time_to_answer_seconds <= 30:
                score += 0.20
            elif self.avg_time_to_answer_seconds < 5:
                score += 0.10
            else:
                score += 0.10

        if self.edit_rate < 0.1:
            score += 0.10
        elif self.edit_rate < 0.2:
            score += 0.05

        return round(score, 4)

    def _calculate_effectiveness_score(self) -> float:
        """Calculate overall effectiveness score (0-100)."""
        score = 0.0

        score += self.engagement_score * 40
        score += (1.0 - self.drop_off_rate) * 30

        if self.completion_correlation is not None:
            normalized = (self.completion_correlation + 1) / 2
            score += normalized * 20

        score += (1.0 - self.validation_failure_rate) * 10

        return round(score, 2)

    def _assess_optimization_needs(self) -> None:
        """Assess if question needs optimization and generate recommendations."""
        self.optimization_recommendations = []
        issues_found = 0

        if self.skip_rate > 0.20:
            self.optimization_recommendations.append(
                f"High skip rate ({self.skip_rate*100:.1f}%) - Consider making question optional or simplifying"
            )
            issues_found += 1

        if self.drop_off_rate > 0.15:
            self.optimization_recommendations.append(
                f"High drop-off rate ({self.drop_off_rate*100:.1f}%) - This question may be causing abandonment"
            )
            issues_found += 1

        if self.avg_time_to_answer_seconds and self.avg_time_to_answer_seconds > 45:
            self.optimization_recommendations.append(
                f"Users spend too long answering ({self.avg_time_to_answer_seconds:.0f}s) - Simplify or clarify question"
            )
            issues_found += 1

        if self.avg_time_to_answer_seconds and self.avg_time_to_answer_seconds < 3:
            self.optimization_recommendations.append(
                "Users answer very quickly - May not be engaging enough"
            )
            issues_found += 1

        if self.validation_failure_rate > 0.10:
            self.optimization_recommendations.append(
                f"High validation failure rate ({self.validation_failure_rate*100:.1f}%) - Review validation rules"
            )
            issues_found += 1

        if self.device_performance_gap and abs(self.device_performance_gap) > 0.20:
            platform = "mobile" if self.device_performance_gap < 0 else "desktop"
            self.optimization_recommendations.append(
                f"Poor performance on {platform} - Optimize for this device type"
            )
            issues_found += 1

        self.needs_optimization = issues_found > 0
        if issues_found >= 3:
            self.optimization_priority = 1
        elif issues_found >= 2:
            self.optimization_priority = 2
        elif issues_found >= 1:
            self.optimization_priority = 3
        else:
            self.optimization_priority = None

    # -------------------------------------------------------------------------
    # ANSWER DISTRIBUTION METHODS
    # -------------------------------------------------------------------------

    def update_answer_distribution(self, answer_value: Any) -> None:
        """Update answer distribution with new answer."""
        if self.answer_distribution is None:
            self.answer_distribution = {}
        if self.answer_distribution_percentages is None:
            self.answer_distribution_percentages = {}

        key = str(answer_value)
        self.answer_distribution[key] = self.answer_distribution.get(key, 0) + 1

        total = sum(self.answer_distribution.values())
        if total > 0:
            for k, v in self.answer_distribution.items():
                self.answer_distribution_percentages[k] = round(v / total, 4)

    def get_most_popular_answer(self) -> Optional[tuple[str, int]]:
        """Get most popular answer."""
        if not self.answer_distribution:
            return None
        return max(self.answer_distribution.items(), key=lambda x: x[1])

    # -------------------------------------------------------------------------
    # COMPARISON METHODS
    # -------------------------------------------------------------------------

    def compare_to_benchmark(self, benchmark_answer_rate: float) -> Dict[str, Any]:
        """Compare to benchmark performance."""
        diff = self.answer_rate - benchmark_answer_rate
        diff_percent = (diff / benchmark_answer_rate * 100) if benchmark_answer_rate > 0 else 0

        return {
            "answer_rate": self.answer_rate,
            "benchmark": benchmark_answer_rate,
            "difference": round(diff, 4),
            "difference_percent": round(diff_percent, 2),
            "performing_better": diff > 0,
        }

    # -------------------------------------------------------------------------
    # SERIALIZATION
    # -------------------------------------------------------------------------

    def to_dict(self, include_recommendations: bool = True) -> dict:
        """Convert to dictionary."""
        data = {
            "effectiveness_id": self.effectiveness_id,
            "question_id": self.question_id,
            "funnel_id": self.funnel_id,
            "total_views": self.total_views,
            "total_answers": self.total_answers,
            "total_skips": self.total_skips,
            "answer_rate": self.answer_rate,
            "skip_rate": self.skip_rate,
            "drop_off_rate": self.drop_off_rate,
            "avg_time_to_answer_seconds": self.avg_time_to_answer_seconds,
            "engagement_score": self.engagement_score,
            "effectiveness_score": self.effectiveness_score,
            "needs_optimization": self.needs_optimization,
            "optimization_priority": self.optimization_priority,
            "answer_distribution_percentages": self.answer_distribution_percentages or {},
            "last_calculated_at": self.last_calculated_at.isoformat() if self.last_calculated_at else None,
        }

        if include_recommendations:
            data["optimization_recommendations"] = self.optimization_recommendations or []

        return data

__all__ = [
    "QuestionEffectiveness",
]
