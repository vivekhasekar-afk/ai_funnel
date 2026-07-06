"""
Feature Extractor - Production Grade Implementation
===================================================
Transforms cleaned funnel data (events, responses, behavior, performance)
into ML-ready feature vectors.

Key use cases:
- Completion rate prediction
- Lead scoring & intent estimation
- Question effectiveness modeling
- Customer & behavior segmentation

Core concepts implemented:
- Session-level behavioral features (time, scroll, hesitation, revisits)
- Funnel-level performance & completion features
- Question/answer pattern features
- Aggregate & windowed stats for ML models
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple
import math
import statistics
import hashlib
import json
from collections import Counter, defaultdict

from app.utils.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)


# -----------------------------
# Helper functions
# -----------------------------

def safe_div(n: float, d: float) -> float:
    if d == 0:
        return 0.0
    return n / d


def ts_to_epoch_ms(ts: Optional[datetime]) -> Optional[int]:
    if ts is None:
        return None
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return int(ts.timestamp() * 1000)


def hash_text(text: str, salt: str = "feat_v1") -> str:
    return hashlib.sha256((salt + "|" + text).encode("utf-8")).hexdigest()


# -----------------------------
# Input structures
# -----------------------------

@dataclass
class SessionEvent:
    """
    Normalized event record from event_collector / data_cleaner.
    """
    event_type: str
    funnel_id: Optional[int]
    session_id: str
    user_id: Optional[int]
    question_id: Optional[int]
    payload: Dict[str, Any]
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SessionResponse:
    """
    Summary of a response from response_collector.
    """
    funnel_id: int
    session_id: str
    user_id: Optional[int]
    is_completed: bool
    completed_at: Optional[datetime]
    device_type: Optional[str] = None
    channel: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class QuestionAnswer:
    """
    Single answer within a session.
    """
    question_id: int
    question_type: str
    answer_value: Any
    time_spent_ms: Optional[int]
    order_index: int


@dataclass
class BehavioralSummary:
    """
    From BehavioralCollector._emit_session_summary output.
    """
    session_id: str
    funnel_id: int
    session_duration_ms: int
    active_time_ms: int
    engagement_level: str
    abandonment_risk: str
    hesitation_score: float
    max_scroll_depth: float
    scroll_backs: int
    total_hover_time_ms: int
    questions_viewed: int
    question_revisits: int
    answer_changes: int
    rage_clicks: int
    idle_time_ms: int


@dataclass
class PerformanceSnapshot:
    """
    Compact performance stats for a route/funnel (from performance_collector).
    """
    route: str
    lcp_p50: Optional[float]
    lcp_p95: Optional[float]
    inp_p50: Optional[float]
    inp_p95: Optional[float]
    cls_p50: Optional[float]
    cls_p95: Optional[float]


# -----------------------------
# Output feature structures
# -----------------------------

@dataclass
class SessionFeatures:
    session_id: str
    funnel_id: int
    # Labels / targets (optional)
    completed: Optional[int] = None
    lead_quality_tier: Optional[str] = None

    # Time-related
    session_duration_ms: int = 0
    active_time_ms: int = 0
    idle_time_ms: int = 0
    time_to_complete_ms: Optional[int] = None
    avg_time_per_question_ms: Optional[float] = None

    # Behavioral
    engagement_level: str = "unknown"
    abandonment_risk: str = "unknown"
    hesitation_score: float = 0.0
    max_scroll_depth: float = 0.0
    scroll_backs: int = 0
    total_hover_time_ms: int = 0
    questions_viewed: int = 0
    question_revisits: int = 0
    answer_changes: int = 0
    rage_clicks: int = 0

    # Ratios
    idle_ratio: float = 0.0
    hover_per_question_ms: float = 0.0
    revisits_ratio: float = 0.0
    answer_change_ratio: float = 0.0

    # Device / channel
    device_type: Optional[str] = None
    channel: Optional[str] = None

    # Question/answer patterns
    questions_answered: int = 0
    mcq_answered: int = 0
    open_ended_answered: int = 0
    avg_mcq_time_ms: float = 0.0
    avg_open_ended_time_ms: float = 0.0

    # Completion funnel context
    completion_rate_baseline: Optional[float] = None  # daily/weekly funnel baseline

    # Performance overlay (client perf)
    lcp_p95_ms: Optional[float] = None
    inp_p95_ms: Optional[float] = None
    cls_p95: Optional[float] = None

    # Arbitrary extra features
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class QuestionFeatures:
    """
    Per-question effectiveness features for question_effectiveness_model.
    """
    funnel_id: int
    question_id: int
    text_hash: str
    question_type: str
    # Aggregates
    views: int
    answers_count: int
    dropoffs_after: int
    avg_time_ms: float
    median_time_ms: float
    answer_change_rate: float
    completion_rate_after: float
    # Optional extra metadata for modeling
    extra: Dict[str, Any] = field(default_factory=dict)


# -----------------------------
# Main extractor class
# -----------------------------

class FeatureExtractor:
    """
    Central feature extraction service.

    This class is stateless; all stateful aggregation should be done in
    upstream pipelines or DB queries before calling these methods.
    """

    def __init__(self):
        pass

    # -------------------------
    # Session-level features
    # -------------------------

    def extract_session_features(
        self,
        response: SessionResponse,
        answers: List[QuestionAnswer],
        behavior: Optional[BehavioralSummary] = None,
        perf: Optional[PerformanceSnapshot] = None,
        funnel_completion_baseline: Optional[float] = None,
        lead_quality_tier: Optional[str] = None,
    ) -> SessionFeatures:
        """
        Build a dense feature vector for a single session.
        Designed to feed completion prediction & lead scoring models.
        """
        feat = SessionFeatures(
            session_id=response.session_id,
            funnel_id=response.funnel_id,
            completed=int(response.is_completed) if response.is_completed is not None else None,
            device_type=response.device_type,
            channel=response.channel,
            completion_rate_baseline=funnel_completion_baseline,
            lead_quality_tier=lead_quality_tier,
        )

        # Time / behavioral from BehavioralSummary if available
        if behavior:
            feat.session_duration_ms = behavior.session_duration_ms
            feat.active_time_ms = behavior.active_time_ms
            feat.idle_time_ms = behavior.idle_time_ms
            feat.engagement_level = behavior.engagement_level
            feat.abandonment_risk = behavior.abandonment_risk
            feat.hesitation_score = behavior.hesitation_score
            feat.max_scroll_depth = behavior.max_scroll_depth
            feat.scroll_backs = behavior.scroll_backs
            feat.total_hover_time_ms = behavior.total_hover_time_ms
            feat.questions_viewed = behavior.questions_viewed
            feat.question_revisits = behavior.question_revisits
            feat.answer_changes = behavior.answer_changes
            feat.rage_clicks = behavior.rage_clicks

            feat.idle_ratio = safe_div(feat.idle_time_ms, max(1, feat.session_duration_ms))
            feat.hover_per_question_ms = safe_div(
                feat.total_hover_time_ms, max(1, feat.questions_viewed)
            )
            feat.revisits_ratio = safe_div(
                feat.question_revisits, max(1, feat.questions_viewed)
            )
            feat.answer_change_ratio = safe_div(
                feat.answer_changes, max(1, feat.questions_viewed)
            )

        # Response timing
        if response.completed_at and behavior:
            feat.time_to_complete_ms = feat.session_duration_ms

        # Answer-level stats
        feat.questions_answered = len(answers)
        if answers:
            times = [a.time_spent_ms for a in answers if a.time_spent_ms is not None]
            feat.avg_time_per_question_ms = (
                statistics.mean(times) if times else None
            )

            mcq_times: List[int] = []
            open_times: List[int] = []
            for a in answers:
                if a.question_type in ("single_choice", "multi_choice"):
                    feat.mcq_answered += 1
                    if a.time_spent_ms:
                        mcq_times.append(a.time_spent_ms)
                elif a.question_type in ("open_text", "long_text"):
                    feat.open_ended_answered += 1
                    if a.time_spent_ms:
                        open_times.append(a.time_spent_ms)

            feat.avg_mcq_time_ms = statistics.mean(mcq_times) if mcq_times else 0.0
            feat.avg_open_ended_time_ms = (
                statistics.mean(open_times) if open_times else 0.0
            )

        # Attach performance overlay
        if perf:
            feat.lcp_p95_ms = perf.lcp_p95
            feat.inp_p95_ms = perf.inp_p95
            feat.cls_p95 = perf.cls_p95

        return feat

    # -------------------------
    # Question-level features
    # -------------------------

    def extract_question_features(
        self,
        funnel_id: int,
        question_id: int,
        question_text: str,
        question_type: str,
        # aggregates from analytics_daily or warehouse
        views: int,
        answers_count: int,
        dropoffs_after: int,
        times_ms: List[int],
        completions_after: int,
        sessions_through_question: int,
        answer_changes: int,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> QuestionFeatures:
        """
        Build features for a question's effectiveness model.

        Assumes that the aggregates (views, dropoffs_after, etc.) are computed
        in the warehouse or data_pipeline. This method only shapes them into
        modeling-ready form.
        """
        avg_time = statistics.mean(times_ms) if times_ms else 0.0
        med_time = statistics.median(times_ms) if times_ms else 0.0

        answer_change_rate = safe_div(answer_changes, max(1, answers_count))
        completion_rate_after = safe_div(completions_after, max(1, sessions_through_question))

        text_hash = hash_text(question_text or "", salt="q_text")

        return QuestionFeatures(
            funnel_id=funnel_id,
            question_id=question_id,
            text_hash=text_hash,
            question_type=question_type,
            views=views,
            answers_count=answers_count,
            dropoffs_after=dropoffs_after,
            avg_time_ms=avg_time,
            median_time_ms=med_time,
            answer_change_rate=answer_change_rate,
            completion_rate_after=completion_rate_after,
            extra=extra_metadata or {},
        )

    # -------------------------
    # Batch utilities
    # -------------------------

    def batch_sessions_to_matrix(
        self,
        sessions: List[SessionFeatures],
        include_extra: bool = False,
    ) -> Tuple[List[List[float]], List[Optional[int]], List[str]]:
        """
        Convert a list of SessionFeatures into:
        - X: 2D numeric matrix
        - y: targets (completed) if available
        - feature_names: order of columns

        This can be used by scikit-learn / XGBoost model training scripts.
        """
        # Define stable column order
        base_cols: List[Tuple[str, Callable[[SessionFeatures], float]]] = [
            ("session_duration_ms", lambda f: float(f.session_duration_ms)),
            ("active_time_ms", lambda f: float(f.active_time_ms)),
            ("idle_time_ms", lambda f: float(f.idle_time_ms)),
            ("time_to_complete_ms", lambda f: float(f.time_to_complete_ms or 0)),
            ("avg_time_per_question_ms", lambda f: float(f.avg_time_per_question_ms or 0)),
            ("hesitation_score", lambda f: float(f.hesitation_score)),
            ("max_scroll_depth", lambda f: float(f.max_scroll_depth)),
            ("scroll_backs", lambda f: float(f.scroll_backs)),
            ("total_hover_time_ms", lambda f: float(f.total_hover_time_ms)),
            ("questions_viewed", lambda f: float(f.questions_viewed)),
            ("question_revisits", lambda f: float(f.question_revisits)),
            ("answer_changes", lambda f: float(f.answer_changes)),
            ("rage_clicks", lambda f: float(f.rage_clicks)),
            ("idle_ratio", lambda f: float(f.idle_ratio)),
            ("hover_per_question_ms", lambda f: float(f.hover_per_question_ms)),
            ("revisits_ratio", lambda f: float(f.revisits_ratio)),
            ("answer_change_ratio", lambda f: float(f.answer_change_ratio)),
            ("questions_answered", lambda f: float(f.questions_answered)),
            ("mcq_answered", lambda f: float(f.mcq_answered)),
            ("open_ended_answered", lambda f: float(f.open_ended_answered)),
            ("avg_mcq_time_ms", lambda f: float(f.avg_mcq_time_ms)),
            ("avg_open_ended_time_ms", lambda f: float(f.avg_open_ended_time_ms)),
            ("completion_rate_baseline", lambda f: float(f.completion_rate_baseline or 0)),
            ("lcp_p95_ms", lambda f: float(f.lcp_p95_ms or 0)),
            ("inp_p95_ms", lambda f: float(f.inp_p95_ms or 0)),
            ("cls_p95", lambda f: float(f.cls_p95 or 0)),
        ]

        # One-hot for device_type and channel (shallow, high-level)
        device_values = {"mobile", "desktop", "tablet"}
        channel_values = {"paid", "organic", "email", "social", "direct"}

        for dev in sorted(device_values):
            base_cols.append((f"device_{dev}", lambda f, dev=dev: 1.0 if f.device_type == dev else 0.0))
        for ch in sorted(channel_values):
            base_cols.append((f"channel_{ch}", lambda f, ch=ch: 1.0 if f.channel == ch else 0.0))

        # Engagement / abandonment categorical one-hot
        engagement_levels = ["very_high", "high", "medium", "low", "very_low"]
        for lvl in engagement_levels:
            base_cols.append(
                (f"engagement_{lvl}", lambda f, lvl=lvl: 1.0 if f.engagement_level == lvl else 0.0)
            )

        abandonment_levels = ["critical", "high", "medium", "low", "none"]
        for lvl in abandonment_levels:
            base_cols.append(
                (f"abandonment_{lvl}", lambda f, lvl=lvl: 1.0 if f.abandonment_risk == lvl else 0.0)
            )

        feature_names = [name for name, _ in base_cols]
        X: List[List[float]] = []
        y: List[Optional[int]] = []

        for f in sessions:
            row: List[float] = []
            for _, getter in base_cols:
                try:
                    row.append(float(getter(f)))
                except Exception:
                    row.append(0.0)
            # Optionally merge extra dict as hashed numeric features
            if include_extra and f.extra:
                for k, v in sorted(f.extra.items()):
                    if isinstance(v, (int, float)):
                        row.append(float(v))
                        feature_names.append(f"extra_{k}")
            X.append(row)
            y.append(f.completed)

        return X, y, feature_names

    # -------------------------
    # Convenience for export
    # -------------------------

    def session_features_to_dict(self, f: SessionFeatures) -> Dict[str, Any]:
        """Convert SessionFeatures to plain dict for warehouse export."""
        d = asdict(f)
        # Convert any datetimes or non-serializable fields if they appear later
        return d

    def question_features_to_dict(self, f: QuestionFeatures) -> Dict[str, Any]:
        """Convert QuestionFeatures to plain dict for warehouse export."""
        d = asdict(f)
        return d
