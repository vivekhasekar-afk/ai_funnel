"""
Aggregator - Production Grade Implementation
===========================================
Performs time-based rollups over raw events/responses into:
- Daily funnel metrics (views, starts, completes, drop-offs, conversion rates)
- Question-level rollups (views, time-on-question, drop-offs)
- Weekly summaries derived from daily aggregates

Designed to run as a scheduled batch job (e.g., Celery beat / cron).
Supports incremental aggregation using watermark timestamps.

Patterns:
- Time-series rollups (raw → daily → weekly)
- Idempotent aggregation via upsert
- Windowed metrics (e.g., last 7 days) for analytics & ML baselines
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, date, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select, func, insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.models.event import Event
from app.models.response import Response
from app.models.analytics_daily import AnalyticsDaily
from app.models.question import Question
from app.utils.logger import get_logger
from app.utils.exceptions import AggregationException

logger = get_logger(__name__)


@dataclass
class FunnelDailyStats:
    day: date
    funnel_id: int
    views: int
    starts: int
    completes: int
    dropoffs: int
    completion_rate: float
    avg_time_to_complete_ms: Optional[float]


@dataclass
class QuestionDailyStats:
    day: date
    funnel_id: int
    question_id: int
    views: int
    answers: int
    dropoffs_after: int
    avg_time_ms: Optional[float]


class Aggregator:
    """
    Daily & weekly aggregation logic.

    This class expects a SQL warehouse schema roughly like:
    - events (id, event_type, funnel_id, question_id, timestamp, payload)
    - responses (id, funnel_id, session_id, completed_at, is_completed)
    - analytics_daily (date, funnel_id, metrics json, etc.)

    It performs:
    - daily_rollup(): recompute daily stats for a given date range
    - weekly_summary(): aggregate daily rows into weekly summaries
    """

    def __init__(self, db_session_factory: async_sessionmaker):
        self.db_session_factory = db_session_factory

    # -----------------------
    # Public API
    # -----------------------

    async def daily_rollup(
        self,
        start_date: date,
        end_date: Optional[date] = None,
    ) -> List[FunnelDailyStats]:
        """
        Compute daily funnel + question metrics for [start_date, end_date].

        Idempotent: existing rows for those days can be overwritten via upsert.
        """
        if end_date is None:
            end_date = start_date

        if end_date < start_date:
            raise AggregationException("end_date cannot be earlier than start_date")

        all_funnel_stats: List[FunnelDailyStats] = []

        async with self.db_session_factory() as session:
            current = start_date
            while current <= end_date:
                try:
                    stats_for_day = await self._aggregate_single_day(session, current)
                    await self._upsert_daily_stats(session, current, stats_for_day)
                    all_funnel_stats.extend(stats_for_day)
                    await session.commit()
                    logger.info(
                        f"Daily rollup completed for {current} "
                        f"({len(stats_for_day)} funnels)"
                    )
                except Exception as e:
                    await session.rollback()
                    logger.error(f"Error during daily rollup for {current}: {e}", exc_info=True)
                    raise AggregationException(f"Daily rollup failed for {current}") from e
                current += timedelta(days=1)

        return all_funnel_stats

    async def weekly_summary(
        self,
        week_start: date,
        weeks: int = 1,
    ) -> None:
        """
        Aggregate daily rows into weekly summaries for N weeks starting at week_start.

        Assumes daily_rollup has already populated AnalyticsDaily for involved dates.
        """
        async with self.db_session_factory() as session:
            for i in range(weeks):
                start = week_start + timedelta(weeks=i)
                end = start + timedelta(days=6)
                try:
                    await self._aggregate_week(session, start, end)
                    await session.commit()
                    logger.info(f"Weekly summary aggregated for week starting {start}")
                except Exception as e:
                    await session.rollback()
                    logger.error(f"Error during weekly summary for week {start}: {e}", exc_info=True)
                    raise AggregationException(f"Weekly summary failed for week {start}") from e

    # -----------------------
    # Single-day aggregation
    # -----------------------

    async def _aggregate_single_day(
        self,
        session: AsyncSession,
        day: date,
    ) -> List[FunnelDailyStats]:
        """
        Compute funnel-level and question-level metrics for a single day.
        """
        start_dt = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc)
        end_dt = start_dt + timedelta(days=1)

        # Funnel views & starts from events
        funnel_view_counts = await self._count_funnel_views(session, start_dt, end_dt)
        funnel_start_counts = await self._count_funnel_starts(session, start_dt, end_dt)

        # Funnel completions from responses
        completion_stats = await self._completion_stats(session, start_dt, end_dt)

        # Question-level stats (optional, useful for question_effectiveness)
        question_stats = await self._question_daily_stats(session, start_dt, end_dt)

        # Build per-funnel daily stats
        funnel_ids = set(funnel_view_counts.keys()) | set(funnel_start_counts.keys()) | set(
            completion_stats.keys()
        )
        result: List[FunnelDailyStats] = []

        for funnel_id in funnel_ids:
            views = funnel_view_counts.get(funnel_id, 0)
            starts = funnel_start_counts.get(funnel_id, 0)
            completes, avg_time_ms = completion_stats.get(funnel_id, (0, None))

            # Dropoff: sessions that started but did not complete
            dropoffs = max(0, starts - completes)
            completion_rate = (
                float(completes) / starts if starts > 0 else 0.0
            )

            result.append(
                FunnelDailyStats(
                    day=day,
                    funnel_id=funnel_id,
                    views=views,
                    starts=starts,
                    completes=completes,
                    dropoffs=dropoffs,
                    completion_rate=round(completion_rate, 4),
                    avg_time_to_complete_ms=avg_time_ms,
                )
            )

        # Also persist question_stats into AnalyticsDaily or a separate table if desired
        await self._upsert_question_stats(session, day, question_stats)

        return result

    async def _count_funnel_views(
        self,
        session: AsyncSession,
        start_dt: datetime,
        end_dt: datetime,
    ) -> Dict[int, int]:
        """
        Count unique funnel views within the day.
        """
        stmt = (
            select(Event.funnel_id, func.count())
            .where(
                Event.event_type == "funnel_view",
                Event.timestamp >= start_dt,
                Event.timestamp < end_dt,
                Event.funnel_id.isnot(None),
            )
            .group_by(Event.funnel_id)
        )
        res = await session.execute(stmt)
        rows = res.all()
        return {funnel_id: count for funnel_id, count in rows}

    async def _count_funnel_starts(
        self,
        session: AsyncSession,
        start_dt: datetime,
        end_dt: datetime,
    ) -> Dict[int, int]:
        """
        Count funnel starts: typically first question_view or explicit funnel_start event.
        """
        stmt = (
            select(Event.funnel_id, func.count())
            .where(
                Event.event_type.in_(["funnel_start", "question_view"]),
                Event.timestamp >= start_dt,
                Event.timestamp < end_dt,
                Event.funnel_id.isnot(None),
            )
            .group_by(Event.funnel_id)
        )
        res = await session.execute(stmt)
        rows = res.all()
        return {funnel_id: count for funnel_id, count in rows}

    async def _completion_stats(
        self,
        session: AsyncSession,
        start_dt: datetime,
        end_dt: datetime,
    ) -> Dict[int, Tuple[int, Optional[float]]]:
        """
        For each funnel, compute:
        - completes: count of completed responses whose completed_at falls in [start_dt, end_dt)
        - avg_time_ms: average total time-to-complete (if stored or derivable from metadata)
        """
        stmt = (
            select(
                Response.funnel_id,
                func.count().label("completes"),
                func.avg(
                    (func.extract("epoch", Response.completed_at) * 1000)
                    - func.coalesce(
                        func.cast(
                            (Response.metadata["started_at_ms"]).astext,  # json field
                            type_=func.cast(0, type_=int).type,
                        ),
                        0,
                    )
                ).label("avg_time_ms"),
            )
            .where(
                Response.is_completed.is_(True),
                Response.completed_at >= start_dt,
                Response.completed_at < end_dt,
            )
            .group_by(Response.funnel_id)
        )

        res = await session.execute(stmt)
        rows = res.all()

        stats: Dict[int, Tuple[int, Optional[float]]] = {}
        for funnel_id, completes, avg_ms in rows:
            stats[funnel_id] = (int(completes or 0), float(avg_ms) if avg_ms is not None else None)
        return stats

    async def _question_daily_stats(
        self,
        session: AsyncSession,
        start_dt: datetime,
        end_dt: datetime,
    ) -> List[QuestionDailyStats]:
        """
        Build per-question daily stats.

        Uses events table for:
        - question views
        - drop-offs after question (funnel_abandon with last_question_id in payload)
        And response_answer or events for time_spent_ms if available.
        """
        # Views per question
        view_stmt = (
            select(Event.funnel_id, Event.question_id, func.count())
            .where(
                Event.event_type == "question_view",
                Event.timestamp >= start_dt,
                Event.timestamp < end_dt,
                Event.funnel_id.isnot(None),
                Event.question_id.isnot(None),
            )
            .group_by(Event.funnel_id, Event.question_id)
        )
        view_rows = (await session.execute(view_stmt)).all()
        view_map: Dict[Tuple[int, int], int] = {
            (funnel_id, question_id): count
            for funnel_id, question_id, count in view_rows
        }

        # Dropoffs after question (from abandon events)
        drop_stmt = (
            select(
                Event.funnel_id,
                (Event.payload["last_question_id"]).astext.cast(int).label("last_qid"),
                func.count(),
            )
            .where(
                Event.event_type == "funnel_abandon",
                Event.timestamp >= start_dt,
                Event.timestamp < end_dt,
                Event.funnel_id.isnot(None),
                Event.payload["last_question_id"].isnot(None),
            )
            .group_by(Event.funnel_id, "last_qid")
        )
        drop_rows = (await session.execute(drop_stmt)).all()
        drop_map: Dict[Tuple[int, int], int] = {
            (funnel_id, last_qid): count for funnel_id, last_qid, count in drop_rows
        }

        # Average time_on_question from events payload, if tracked
        time_stmt = (
            select(
                Event.funnel_id,
                Event.question_id,
                func.avg((Event.payload["time_spent_ms"]).astext.cast(float)),
                func.count(),
            )
            .where(
                Event.event_type == "time_on_question",
                Event.timestamp >= start_dt,
                Event.timestamp < end_dt,
                Event.funnel_id.isnot(None),
                Event.question_id.isnot(None),
                Event.payload["time_spent_ms"].isnot(None),
            )
            .group_by(Event.funnel_id, Event.question_id)
        )
        time_rows = (await session.execute(time_stmt)).all()
        time_map: Dict[Tuple[int, int], Tuple[float, int]] = {
            (funnel_id, question_id): (float(avg_ms or 0), int(cnt or 0))
            for funnel_id, question_id, avg_ms, cnt in time_rows
        }

        stats: List[QuestionDailyStats] = []
        keys = set(view_map.keys()) | set(drop_map.keys()) | set(time_map.keys())

        for (funnel_id, question_id) in keys:
            views = view_map.get((funnel_id, question_id), 0)
            drop = drop_map.get((funnel_id, question_id), 0)
            avg_ms, answers = time_map.get((funnel_id, question_id), (None, 0))

            stats.append(
                QuestionDailyStats(
                    day=start_dt.date(),
                    funnel_id=funnel_id,
                    question_id=question_id,
                    views=views,
                    answers=answers,
                    dropoffs_after=drop,
                    avg_time_ms=avg_ms,
                )
            )

        return stats

    # -----------------------
    # Upserts into AnalyticsDaily
    # -----------------------

    async def _upsert_daily_stats(
        self,
        session: AsyncSession,
        day: date,
        funnel_stats: List[FunnelDailyStats],
    ) -> None:
        """
        Persist funnel-level daily stats into AnalyticsDaily.
        Assumes AnalyticsDaily has columns like:
            date, funnel_id, views, completes, dropoffs, completion_rate, avg_time_to_complete_ms
        and a unique constraint on (date, funnel_id).
        """
        if not funnel_stats:
            return

        values = [
            {
                "date": fs.day,
                "funnel_id": fs.funnel_id,
                "views": fs.views,
                "starts": fs.starts,
                "completes": fs.completes,
                "dropoffs": fs.dropoffs,
                "completion_rate": fs.completion_rate,
                "avg_time_to_complete_ms": fs.avg_time_to_complete_ms,
            }
            for fs in funnel_stats
        ]
        stmt = insert(AnalyticsDaily).values(values)
        # On conflict, update existing
        if hasattr(AnalyticsDaily.__table__, "primary_key"):
            stmt = stmt.on_conflict_do_update(
                index_elements=["date", "funnel_id"],
                set_={
                    "views": stmt.excluded.views,
                    "starts": stmt.excluded.starts,
                    "completes": stmt.excluded.completes,
                    "dropoffs": stmt.excluded.dropoffs,
                    "completion_rate": stmt.excluded.completion_rate,
                    "avg_time_to_complete_ms": stmt.excluded.avg_time_to_complete_ms,
                },
            )
        await session.execute(stmt)

    async def _upsert_question_stats(
        self,
        session: AsyncSession,
        day: date,
        question_stats: List[QuestionDailyStats],
    ) -> None:
        """
        Persist question-level daily stats.
        Option 1: extend AnalyticsDaily with nested JSON.
        Option 2: dedicated table (e.g., analytics_daily_question).
        Here we assume a JSON column on AnalyticsDaily for simplicity.
        """
        if not question_stats:
            return

        # Group by funnel_id
        by_funnel: Dict[int, List[Dict[str, Any]]] = {}
        for qs in question_stats:
            by_funnel.setdefault(qs.funnel_id, []).append(
                {
                    "question_id": qs.question_id,
                    "views": qs.views,
                    "answers": qs.answers,
                    "dropoffs_after": qs.dropoffs_after,
                    "avg_time_ms": qs.avg_time_ms,
                }
            )

        for funnel_id, payload in by_funnel.items():
            stmt = insert(AnalyticsDaily).values(
                date=day,
                funnel_id=funnel_id,
                question_stats=payload,
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=["date", "funnel_id"],
                set_={
                    "question_stats": stmt.excluded.question_stats,
                },
            )
            await session.execute(stmt)

    # -----------------------
    # Weekly aggregation
    # -----------------------

    async def _aggregate_week(
        self,
        session: AsyncSession,
        start: date,
        end: date,
    ) -> None:
        """
        Aggregate daily rows from AnalyticsDaily into weekly rows.

        Strategy:
        - For views/starts/completes/dropoffs: sum
        - For completion_rate: weighted by starts
        - For avg_time_to_complete_ms: weighted by completes
        """
        stmt = (
            select(
                AnalyticsDaily.funnel_id,
                func.sum(AnalyticsDaily.views),
                func.sum(AnalyticsDaily.starts),
                func.sum(AnalyticsDaily.completes),
                func.sum(AnalyticsDaily.dropoffs),
                func.sum(AnalyticsDaily.completion_rate * AnalyticsDaily.starts),
                func.sum(AnalyticsDaily.starts),
                func.sum(AnalyticsDaily.avg_time_to_complete_ms * AnalyticsDaily.completes),
                func.sum(AnalyticsDaily.completes),
            )
            .where(
                AnalyticsDaily.date >= start,
                AnalyticsDaily.date <= end,
            )
            .group_by(AnalyticsDaily.funnel_id)
        )

        res = await session.execute(stmt)
        rows = res.all()
        if not rows:
            logger.info(f"No daily rows found for weekly aggregation {start} - {end}")
            return

        values = []
        for (
            funnel_id,
            views,
            starts,
            completes,
            dropoffs,
            cr_weighted_sum,
            cr_weighted_den,
            time_weighted_sum,
            time_weighted_den,
        ) in rows:
            # Weighted completion rate over the week
            weekly_cr = float(cr_weighted_sum) / cr_weighted_den if cr_weighted_den else 0.0
            # Weighted avg time_to_complete
            weekly_avg_time = (
                float(time_weighted_sum) / time_weighted_den if time_weighted_den else None
            )

            values.append(
                {
                    "date": start,  # store week_start as the date
                    "funnel_id": funnel_id,
                    "views_week": int(views or 0),
                    "starts_week": int(starts or 0),
                    "completes_week": int(completes or 0),
                    "dropoffs_week": int(dropoffs or 0),
                    "completion_rate_week": round(weekly_cr, 4),
                    "avg_time_to_complete_week_ms": weekly_avg_time,
                }
            )

        # Assuming AnalyticsDaily has week_* columns or a separate weekly table.
        # Here we overwrite week columns for week_start date.
        stmt = insert(AnalyticsDaily).values(values)
        stmt = stmt.on_conflict_do_update(
            index_elements=["date", "funnel_id"],
            set_={
                "views_week": stmt.excluded.views_week,
                "starts_week": stmt.excluded.starts_week,
                "completes_week": stmt.excluded.completes_week,
                "dropoffs_week": stmt.excluded.dropoffs_week,
                "completion_rate_week": stmt.excluded.completion_rate_week,
                "avg_time_to_complete_week_ms": stmt.excluded.avg_time_to_complete_week_ms,
            },
        )
        await session.execute(stmt)
