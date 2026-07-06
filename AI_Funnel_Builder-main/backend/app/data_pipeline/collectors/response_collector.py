"""
Response Collector - Production Grade Implementation
====================================================
Responsible for:
- Collecting structured response data from funnels
- Normalizing and validating responses
- Enriching with context (funnel, user, device, behavior)
- Extracting lightweight patterns and aggregates
- Emitting events into the data pipeline (via EventCollector)
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import insert, select
from sqlalchemy.exc import SQLAlchemyError

from app.models.response import Response
from app.models.response_answer import ResponseAnswer
from app.models.funnel import Funnel
from app.models.question import Question
from app.utils.logger import get_logger
from app.utils.exceptions import ValidationException, ResponseCollectionError
from app.data_pipeline.collectors.event_collector import (
    track_event,
    EventType,
    EventPriority,
)
from app.core.config import settings

logger = get_logger(__name__)


class DeviceType(str, Enum):
    DESKTOP = "desktop"
    MOBILE = "mobile"
    TABLET = "tablet"
    UNKNOWN = "unknown"


class ChannelType(str, Enum):
    ORGANIC = "organic"
    PAID = "paid"
    EMAIL = "email"
    SOCIAL = "social"
    DIRECT = "direct"
    UNKNOWN = "unknown"


@dataclass
class RawAnswer:
    question_id: int
    answer_value: Any
    time_spent_ms: Optional[int] = None
    order_index: Optional[int] = None


@dataclass
class ResponseContext:
    session_id: str
    funnel_id: int
    user_id: Optional[int]
    is_completed: bool
    started_at: datetime
    completed_at: Optional[datetime]
    device_type: DeviceType = DeviceType.UNKNOWN
    channel: ChannelType = ChannelType.UNKNOWN
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if not self.session_id:
            raise ValidationException("session_id is required for ResponseContext")
        if not self.funnel_id:
            raise ValidationException("funnel_id is required for ResponseContext")

        if self.started_at.tzinfo is None:
            self.started_at = self.started_at.replace(tzinfo=timezone.utc)
        if self.completed_at and self.completed_at.tzinfo is None:
            self.completed_at = self.completed_at.replace(tzinfo=timezone.utc)


@dataclass
class NormalizedResponse:
    """
    Normalized response ready for DB + pattern extraction.
    """

    context: ResponseContext
    answers: List[RawAnswer]

    def total_time_ms(self) -> Optional[int]:
        if not self.context.completed_at:
            return None
        delta = self.context.completed_at - self.context.started_at
        return int(delta.total_seconds() * 1000)

    def questions_answered_count(self) -> int:
        return len(self.answers)

    def to_response_model_dict(self) -> Dict[str, Any]:
        return {
            "funnel_id": self.context.funnel_id,
            "session_id": self.context.session_id,
            "user_id": self.context.user_id,
            "completed_at": self.context.completed_at,
            "is_completed": self.context.is_completed,
            "device_type": self.context.device_type.value,
            "channel": self.context.channel.value,
            "user_agent": self.context.user_agent,
            "ip_address": self.context.ip_address,
            "metadata": self.context.metadata or {},
        }


class ResponsePatternType(str, Enum):
    DROP_OFF = "drop_off"
    SPEED_RUN = "speed_run"
    HESITATION = "hesitation"
    CONTRADICTORY_ANSWERS = "contradictory_answers"
    HIGH_INTENT = "high_intent"
    LOW_INTENT = "low_intent"


@dataclass
class DetectedPattern:
    pattern_type: ResponsePatternType
    severity: float  # 0–1
    details: Dict[str, Any]


class ResponseCollector:
    """
    Handles collection, normalization, persistence, and light pattern extraction
    for funnel responses.

    This class should be used inside services/response_service.py, not directly
    from FastAPI routes.
    """

    def __init__(self, db_session_factory: async_sessionmaker):
        self.db_session_factory = db_session_factory

    async def collect_response_data(
        self,
        context: ResponseContext,
        raw_answers: List[RawAnswer],
    ) -> Tuple[Response, List[ResponseAnswer], List[DetectedPattern]]:
        """
        Main entrypoint: validate, normalize, persist, and extract patterns.

        Returns:
            (response_model, answer_models, detected_patterns)
        """
        if not raw_answers:
            raise ValidationException("At least one answer is required")

        normalized = NormalizedResponse(context=context, answers=raw_answers)

        # Fetch funnel + questions for validation
        async with self.db_session_factory() as session:
            funnel, questions_map = await self._load_funnel_and_questions(
                session, context.funnel_id
            )

            # Validate answers against questions
            self._validate_answers(raw_answers, questions_map)

            # Persist response and answers
            response_model, answer_models = await self._persist_response_and_answers(
                session, normalized
            )

        # Extract lightweight behavioral patterns (for analytics + ML features)
        patterns = self.extract_patterns(normalized, questions_map)

        # Emit event for downstream analytics/data_pipeline
        await self._emit_response_events(normalized, response_model, patterns)

        return response_model, answer_models, patterns

    async def _load_funnel_and_questions(
        self, session: AsyncSession, funnel_id: int
    ):
        """
        Load funnel and its questions for validation and context.
        """
        funnel_stmt = select(Funnel).where(Funnel.id == funnel_id)
        question_stmt = select(Question).where(Question.funnel_id == funnel_id)

        funnel_result = await session.execute(funnel_stmt)
        funnel = funnel_result.scalar_one_or_none()
        if not funnel:
            raise ResponseCollectionError(f"Funnel {funnel_id} not found")

        question_result = await session.execute(question_stmt)
        questions = question_result.scalars().all()
        questions_map = {q.id: q for q in questions}

        if not questions_map:
            logger.warning(f"No questions found for funnel {funnel_id}")

        return funnel, questions_map

    def _validate_answers(
        self,
        raw_answers: List[RawAnswer],
        questions_map: Dict[int, Question],
    ) -> None:
        """
        Basic validation to ensure answers map to existing questions
        and values look structurally correct.
        """
        seen_question_ids = set()

        for answer in raw_answers:
            if answer.question_id in seen_question_ids:
                logger.debug(
                    f"Duplicate answer for question_id={answer.question_id}"
                )
            seen_question_ids.add(answer.question_id)

            question = questions_map.get(answer.question_id)
            if not question:
                raise ValidationException(
                    f"Question {answer.question_id} does not belong to funnel"
                )

            # Example structural validation: for single-choice, answer must be in options
            if question.type == "single_choice":
                if answer.answer_value not in (question.options or []):
                    logger.debug(
                        f"Answer value {answer.answer_value} not in options "
                        f"for question {question.id}"
                    )

            # Basic time_spent sanity check
            if answer.time_spent_ms is not None and answer.time_spent_ms < 0:
                logger.debug(
                    f"time_spent_ms < 0 for question {answer.question_id}, "
                    "normalizing to None"
                )
                answer.time_spent_ms = None

    async def _persist_response_and_answers(
        self,
        session: AsyncSession,
        normalized: NormalizedResponse,
    ) -> Tuple[Response, List[ResponseAnswer]]:
        """
        Persist Response and ResponseAnswer rows in a single transaction.
        """
        try:
            # Create Response
            response_data = normalized.to_response_model_dict()
            response_stmt = insert(Response).values(response_data).returning(Response)
            response_result = await session.execute(response_stmt)
            response_model: Response = response_result.scalar_one()

            # Create ResponseAnswer rows
            answer_models: List[ResponseAnswer] = []
            answer_rows = []
            for idx, ans in enumerate(normalized.answers):
                row = {
                    "response_id": response_model.id,
                    "question_id": ans.question_id,
                    "answer_value": ans.answer_value,
                    "time_spent_ms": ans.time_spent_ms,
                    "order_index": ans.order_index if ans.order_index is not None else idx,
                }
                answer_rows.append(row)

            if answer_rows:
                answer_stmt = (
                    insert(ResponseAnswer)
                    .values(answer_rows)
                    .returning(ResponseAnswer)
                )
                answer_result = await session.execute(answer_stmt)
                answer_models = list(answer_result.scalars().all())

            await session.commit()

            logger.info(
                f"Persisted response_id={response_model.id} "
                f"with {len(answer_models)} answers "
                f"for funnel_id={response_model.funnel_id}"
            )

            return response_model, answer_models

        except SQLAlchemyError as e:
            await session.rollback()
            logger.error(
                f"Database error while persisting response: {e}", exc_info=True
            )
            raise ResponseCollectionError("Failed to persist response") from e

    def extract_patterns(
        self,
        normalized: NormalizedResponse,
        questions_map: Dict[int, Question],
    ) -> List[DetectedPattern]:
        """
        Lightweight pattern extraction for analytics & ML features.

        This is intentionally simple but structured so that it can evolve into
        a more advanced ML-driven pattern detector later.
        """
        patterns: List[DetectedPattern] = []

        # 1. Drop-off detection
        if not normalized.context.is_completed:
            last_answer = max(
                normalized.answers, key=lambda a: a.order_index or 0
            )
            patterns.append(
                DetectedPattern(
                    pattern_type=ResponsePatternType.DROP_OFF,
                    severity=0.7,
                    details={
                        "last_question_id": last_answer.question_id,
                        "questions_answered": normalized.questions_answered_count(),
                    },
                )
            )

        # 2. Speed-run detection (very low total time per question)
        total_time = normalized.total_time_ms()
        if (
            normalized.context.is_completed
            and total_time is not None
            and normalized.questions_answered_count() > 0
        ):
            avg_ms = total_time / normalized.questions_answered_count()
            if avg_ms < settings.RESPONSE_SPEEDRUN_THRESHOLD_MS:
                patterns.append(
                    DetectedPattern(
                        pattern_type=ResponsePatternType.SPEED_RUN,
                        severity=0.6,
                        details={
                            "avg_time_per_question_ms": avg_ms,
                            "total_time_ms": total_time,
                        },
                    )
                )

        # 3. Hesitation detection (very high time_spent on any question)
        for ans in normalized.answers:
            if (
                ans.time_spent_ms
                and ans.time_spent_ms
                > settings.RESPONSE_HESITATION_THRESHOLD_MS
            ):
                patterns.append(
                    DetectedPattern(
                        pattern_type=ResponsePatternType.HESITATION,
                        severity=0.5,
                        details={
                            "question_id": ans.question_id,
                            "time_spent_ms": ans.time_spent_ms,
                        },
                    )
                )

        # 4. Intent heuristics (basic, can be replaced with ML model later)
        intent_score = self._estimate_intent_score(normalized, questions_map)
        if intent_score >= 0.8:
            patterns.append(
                DetectedPattern(
                    pattern_type=ResponsePatternType.HIGH_INTENT,
                    severity=intent_score,
                    details={"intent_score": intent_score},
                )
            )
        elif intent_score <= 0.3:
            patterns.append(
                DetectedPattern(
                    pattern_type=ResponsePatternType.LOW_INTENT,
                    severity=1.0 - intent_score,
                    details={"intent_score": intent_score},
                )
            )

        return patterns

    def _estimate_intent_score(
        self,
        normalized: NormalizedResponse,
        questions_map: Dict[int, Question],
    ) -> float:
        """
        Simple heuristic-based intent scoring.

        Later, this can be replaced with a call into your ML layer
        (e.g., lead_scoring_model).
        """
        score = 0.0
        max_score = 1.0

        # Completed responses get a baseline
        if normalized.context.is_completed:
            score += 0.4

        # More questions answered implies more engagement
        answered = normalized.questions_answered_count()
        if answered >= 5:
            score += 0.2
        elif answered >= 3:
            score += 0.1

        # Time spent (too low can mean low intent)
        total_time = normalized.total_time_ms()
        if total_time:
            avg_time = total_time / max(answered, 1)
            if (
                settings.RESPONSE_MIN_INTENT_TIME_MS
                <= avg_time
                <= settings.RESPONSE_MAX_INTENT_TIME_MS
            ):
                score += 0.2

        # If email captured, add intent points
        if normalized.context.metadata and normalized.context.metadata.get(
            "email_captured"
        ):
            score += 0.2

        # Clamp to [0, 1]
        return max(0.0, min(score, max_score))

    async def _emit_response_events(
        self,
        normalized: NormalizedResponse,
        response_model: Response,
        patterns: List[DetectedPattern],
    ) -> None:
        """
        Emits a summary event per response, plus pattern-related events.
        These events feed the broader data_pipeline for analytics & ML.
        """
        base_payload = {
            "response_id": response_model.id,
            "funnel_id": normalized.context.funnel_id,
            "user_id": normalized.context.user_id,
            "session_id": normalized.context.session_id,
            "is_completed": normalized.context.is_completed,
            "questions_answered": normalized.questions_answered_count(),
            "total_time_ms": normalized.total_time_ms(),
            "device_type": normalized.context.device_type.value,
            "channel": normalized.context.channel.value,
        }

        # Main response summary event
        await track_event(
            event_type=EventType.RESPONSE_SUBMITTED
            if normalized.context.is_completed
            else EventType.RESPONSE_PARTIAL,
            session_id=normalized.context.session_id,
            funnel_id=normalized.context.funnel_id,
            user_id=normalized.context.user_id,
            payload=base_payload,
            priority=EventPriority.MEDIUM,
        )

        # Pattern events (lower volume, but high value)
        for pattern in patterns:
            await track_event(
                event_type=EventType.BEHAVIORAL_PATTERN,
                session_id=normalized.context.session_id,
                funnel_id=normalized.context.funnel_id,
                user_id=normalized.context.user_id,
                payload={
                    **base_payload,
                    "pattern_type": pattern.pattern_type.value,
                    "severity": pattern.severity,
                    "details": pattern.details,
                },
                priority=EventPriority.HIGH,
            )


# Singleton-style helper

_response_collector_instance: Optional[ResponseCollector] = None


def get_response_collector(
    db_session_factory: async_sessionmaker,
) -> ResponseCollector:
    global _response_collector_instance
    if _response_collector_instance is None:
        _response_collector_instance = ResponseCollector(db_session_factory)
    return _response_collector_instance
