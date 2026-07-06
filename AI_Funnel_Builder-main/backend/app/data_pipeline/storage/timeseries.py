"""
timeseries.py
=============
High-performance time-series storage on TimescaleDB.

Features:
- Async connection pool (asyncpg) for high-throughput writes
- Metric registry → hypertable metadata (table, schema, chunk interval, retention)
- Automatic table + hypertable creation (timestamptz time column)
- Optional retention policies and continuous aggregates
- Batched inserts with backpressure and basic retry
- Simple interface: write_points(metric_name, points)

Design notes:
- Uses timestamptz for time partitions, which is the recommended type for hypertables [web:152].
- Chunk interval and retention are configurable to keep chunks fitting in memory and control storage growth [web:36][web:33].
- Retention and continuous aggregates are managed via TimescaleDB background policies [web:155][web:162][web:157].
- Async inserts via asyncpg align with high-throughput Timescale/Postgres usage patterns [web:154].
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
import json
from typing import Any, Dict, List, Optional, Deque
from collections import deque

import asyncpg
from tenacity import retry, wait_exponential, stop_after_attempt

from app.utils.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)


# =========================
# Metric configuration
# =========================

@dataclass(frozen=True)
class TimeseriesMetricConfig:
    name: str
    table: str
    time_column: str = "time"
    # tags: indexed, low-cardinality dimensions
    tag_columns: Dict[str, str] = None          # col_name -> sql_type
    # fields: numeric / JSON values
    value_columns: Dict[str, str] = None        # col_name -> sql_type
    # hypertable configuration
    chunk_interval: Optional[timedelta] = None  # e.g., timedelta(days=1)
    # retention / downsampling
    retention: Optional[timedelta] = None       # how long to keep raw data
    cagg_view: Optional[str] = None             # continuous aggregate view name
    cagg_bucket_interval: Optional[timedelta] = None
    cagg_refresh_lag: Optional[timedelta] = None
    cagg_refresh_interval: Optional[timedelta] = None


# Registry of known metrics
_METRIC_REGISTRY: Dict[str, TimeseriesMetricConfig] = {}


def register_default_metrics() -> None:
    """Register default metrics used elsewhere in the project."""

    # Web vitals metric (used by PerformanceCollector)
    _METRIC_REGISTRY["web_vitals"] = TimeseriesMetricConfig(
        name="web_vitals",
        table="ts_web_vitals",
        time_column="time",
        tag_columns={
            "funnel_id": "INT",
            "session_id": "TEXT",
            "page": "TEXT",
            "route": "TEXT",
            "device": "TEXT",
            "connection": "TEXT",
        },
        value_columns={
            "lcp_ms": "DOUBLE PRECISION",
            "inp_ms": "DOUBLE PRECISION",
            "cls": "DOUBLE PRECISION",
            "fcp_ms": "DOUBLE PRECISION",
            "ttfb_ms": "DOUBLE PRECISION",
            "metadata": "JSONB",
        },
        chunk_interval=timedelta(days=1),
        retention=timedelta(days=settings.TS_WEB_VITALS_RETENTION_DAYS),
        cagg_view="ts_web_vitals_hourly",
        cagg_bucket_interval=timedelta(hours=1),
        cagg_refresh_lag=timedelta(minutes=5),
        cagg_refresh_interval=timedelta(minutes=10),
    )

    # Backend latency metric
    _METRIC_REGISTRY["backend_latency"] = TimeseriesMetricConfig(
        name="backend_latency",
        table="ts_backend_latency",
        time_column="time",
        tag_columns={
            "service": "TEXT",
            "endpoint": "TEXT",
            "method": "TEXT",
            "status_class": "TEXT",
        },
        value_columns={
            "duration_ms": "DOUBLE PRECISION",
            "attributes": "JSONB",
        },
        chunk_interval=timedelta(days=1),
        retention=timedelta(days=settings.TS_BACKEND_LAT_RETENTION_DAYS),
        cagg_view="ts_backend_latency_5m",
        cagg_bucket_interval=timedelta(minutes=5),
        cagg_refresh_lag=timedelta(minutes=5),
        cagg_refresh_interval=timedelta(minutes=5),
    )

    # Funnel completion metric
    _METRIC_REGISTRY["funnel_completion"] = TimeseriesMetricConfig(
        name="funnel_completion",
        table="ts_funnel_completion",
        time_column="time",
        tag_columns={
            "funnel_id": "INT",
        },
        value_columns={
            "views": "INT",
            "completes": "INT",
            "completion_rate": "DOUBLE PRECISION",
        },
        chunk_interval=timedelta(days=1),
        retention=timedelta(days=settings.TS_FUNNEL_RETENTION_DAYS),
    )


# =========================
# Timeseries writer
# =========================

class TimeseriesWriter:
    """
    High-performance async writer for TimescaleDB.

    Interface:
        await writer.write_points("web_vitals", points)

    Each point is a dict matching metric config: time + tags + values.
    """

    def __init__(
        self,
        dsn: str,
        max_pool_size: int = 10,
        batch_size: int = 500,
        flush_interval_sec: float = 2.0,
        max_queue_size: int = 20_000,
    ):
        self._dsn = dsn
        self._max_pool_size = max_pool_size
        self._batch_size = batch_size
        self._flush_interval = flush_interval_sec
        self._max_queue_size = max_queue_size

        self._pool: Optional[asyncpg.Pool] = None
        self._queue: Deque[tuple[str, Dict[str, Any]]] = deque(maxlen=max_queue_size)
        self._lock = asyncio.Lock()
        self._is_running = False
        self._flush_task: Optional[asyncio.Task] = None
        self._initialized_metrics: set[str] = set()

    async def start(self) -> None:
        if self._is_running:
            return
        self._pool = await asyncpg.create_pool(
            dsn=self._dsn,
            max_size=self._max_pool_size,
        )
        self._is_running = True
        self._flush_task = asyncio.create_task(self._periodic_flush())
        logger.info("TimeseriesWriter started (dsn hidden)")

    async def stop(self, timeout: float = 10.0) -> None:
        if not self._is_running:
            return
        self._is_running = False
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass

        # Flush remaining points
        try:
            await asyncio.wait_for(self._flush_all(), timeout=timeout)
        except asyncio.TimeoutError:
            logger.error(
                "Timeout while flushing TimeseriesWriter queue; remaining=%s",
                len(self._queue),
            )

        if self._pool:
            await self._pool.close()
        logger.info("TimeseriesWriter stopped")

    async def write_points(
        self,
        metric_name: str,
        points: List[Dict[str, Any]],
    ) -> None:
        """
        Enqueue time-series points for a given metric.
        """
        if not points:
            return

        if metric_name not in _METRIC_REGISTRY:
            raise ValueError(f"Unknown metric: {metric_name}")

        async with self._lock:
            for p in points:
                if len(self._queue) >= self._max_queue_size:
                    logger.warning(
                        "Timeseries queue full (metric=%s,size=%s); dropping oldest",
                        metric_name,
                        self._max_queue_size,
                    )
                    self._queue.popleft()
                self._queue.append((metric_name, p))

            # Flush early if queue large
            if len(self._queue) >= self._batch_size:
                asyncio.create_task(self._flush_batch())

    async def _flush_all(self) -> None:
        while True:
            flushed = await self._flush_batch()
            if flushed == 0:
                break
            await asyncio.sleep(0.05)

    async def _periodic_flush(self) -> None:
        while self._is_running:
            try:
                await asyncio.sleep(self._flush_interval)
                await self._flush_batch()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in timeseries periodic flush: %s", e, exc_info=True)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=5),
    )
    async def _insert_batch(
        self,
        conn: asyncpg.Connection,
        metric_name: str,
        cfg: TimeseriesMetricConfig,
        rows: List[Dict[str, Any]],
    ) -> None:
        """
        Insert batch of rows for one metric using executemany.
        """
        cols: List[str] = [cfg.time_column]
        if cfg.tag_columns:
            cols.extend(cfg.tag_columns.keys())
        if cfg.value_columns:
            cols.extend(cfg.value_columns.keys())

        placeholders = ", ".join(f"${i}" for i in range(1, len(cols) + 1))
        col_list = ", ".join(f'"{c}"' for c in cols)

        sql = f'INSERT INTO "{cfg.table}" ({col_list}) VALUES ({placeholders})'

        values: List[tuple[Any, ...]] = []
        for r in rows:
            row_values: List[Any] = []
            # time
            t = r.get(cfg.time_column) or r.get("time")
            if isinstance(t, str):
                # allow ISO8601 strings
                t = datetime.fromisoformat(t.replace("Z", "+00:00"))
            if isinstance(t, datetime) and t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            row_values.append(t)
            # tags
            if cfg.tag_columns:
                for col in cfg.tag_columns.keys():
                    row_values.append(r.get(col))
            # values
            if cfg.value_columns:
                for col in cfg.value_columns.keys():
                    v = r.get(col)
                    if isinstance(v, (dict, list)):
                        v = json.dumps(v)
                    row_values.append(v)
            values.append(tuple(row_values))

        await conn.executemany(sql, values)

    async def _ensure_metric(self, metric_name: str) -> None:
        if metric_name in self._initialized_metrics:
            return

        cfg = _METRIC_REGISTRY[metric_name]
        async with self._pool.acquire() as conn:
            await self._create_hypertable(conn, cfg)
            if cfg.retention:
                await self._ensure_retention_policy(conn, cfg)
            if cfg.cagg_view and cfg.cagg_bucket_interval:
                await self._ensure_continuous_aggregate(conn, cfg)

        self._initialized_metrics.add(metric_name)

    async def _create_hypertable(
        self,
        conn: asyncpg.Connection,
        cfg: TimeseriesMetricConfig,
    ) -> None:
        """
        Create base table + hypertable if not exists.
        Uses timestamptz time column and configurable chunk interval.
        """
        tag_cols_sql = ""
        if cfg.tag_columns:
            for name, typ in cfg.tag_columns.items():
                tag_cols_sql += f', "{name}" {typ}'

        val_cols_sql = ""
        if cfg.value_columns:
            for name, typ in cfg.value_columns.items():
                val_cols_sql += f', "{name}" {typ}'

        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS "{cfg.table}" (
            "{cfg.time_column}" TIMESTAMPTZ NOT NULL
            {tag_cols_sql}
            {val_cols_sql}
        );
        """

        await conn.execute(create_table_sql)

        # Create hypertable (idempotent when IF NOT EXISTS honored)
        chunk_interval_expr = ""
        if cfg.chunk_interval:
            seconds = int(cfg.chunk_interval.total_seconds())
            chunk_interval_expr = f", chunk_time_interval => interval '{seconds} seconds'"

        make_hyper_sql = f"""
        SELECT create_hypertable(
            '{cfg.table}',
            '{cfg.time_column}',
            if_not_exists => TRUE
            {chunk_interval_expr}
        );
        """
        await conn.execute(make_hyper_sql)

    async def _ensure_retention_policy(
        self,
        conn: asyncpg.Connection,
        cfg: TimeseriesMetricConfig,
    ) -> None:
        """
        Ensure retention policy exists for hypertable.
        """
        drop_after = int(cfg.retention.total_seconds())
        # Timescale policy; idempotent across restarts if same config
        sql = f"""
        SELECT add_retention_policy(
            '{cfg.table}',
            INTERVAL '{drop_after} seconds',
            if_not_exists => TRUE
        );
        """
        await conn.execute(sql)

    async def _ensure_continuous_aggregate(
        self,
        conn: asyncpg.Connection,
        cfg: TimeseriesMetricConfig,
    ) -> None:
        """
        Ensure continuous aggregate view + policies exist.
        """
        bucket_seconds = int(cfg.cagg_bucket_interval.total_seconds())
        time_col = cfg.time_column

        # Basic continuous aggregate: count(*) per bucket; real schema can be customized per metric.
        create_cagg_sql = f"""
        CREATE MATERIALIZED VIEW IF NOT EXISTS "{cfg.cagg_view}" WITH (timescaledb.continuous) AS
        SELECT
            time_bucket(INTERVAL '{bucket_seconds} seconds', "{time_col}") AS bucket,
            COUNT(*) AS count
        FROM "{cfg.table}"
        GROUP BY bucket
        WITH NO DATA;
        """
        await conn.execute(create_cagg_sql)

        # Refresh policy
        if cfg.cagg_refresh_interval and cfg.cagg_refresh_lag:
            lag = int(cfg.cagg_refresh_lag.total_seconds())
            every = int(cfg.cagg_refresh_interval.total_seconds())
            policy_sql = f"""
            SELECT add_continuous_aggregate_policy(
                '{cfg.cagg_view}',
                start_offset => INTERVAL '{lag} seconds',
                end_offset   => INTERVAL '0 seconds',
                schedule_interval => INTERVAL '{every} seconds',
                if_not_exists => TRUE
            );
            """
            await conn.execute(policy_sql)

        # Retention on cagg can be managed separately via add_retention_policy on the view
        if cfg.retention:
            drop_after = int(cfg.retention.total_seconds())
            cagg_ret_sql = f"""
            SELECT add_retention_policy(
                '{cfg.cagg_view}',
                INTERVAL '{drop_after} seconds',
                if_not_exists => TRUE
            );
            """
            await conn.execute(cagg_ret_sql)

    async def _flush_batch(self) -> int:
        async with self._lock:
            if not self._queue:
                return 0

            # Group by metric for efficient inserts
            grouped: Dict[str, List[Dict[str, Any]]] = {}
            while self._queue and sum(len(v) for v in grouped.values()) < self._batch_size:
                metric_name, point = self._queue.popleft()
                grouped.setdefault(metric_name, []).append(point)

        if not grouped or not self._pool:
            return 0

        flushed = 0
        async with self._pool.acquire() as conn:
            for metric_name, rows in grouped.items():
                cfg = _METRIC_REGISTRY[metric_name]
                await self._ensure_metric(metric_name)
                try:
                    await self._insert_batch(conn, metric_name, cfg, rows)
                    flushed += len(rows)
                except Exception as e:
                    logger.error(
                        "Failed to insert timeseries batch (metric=%s): %s",
                        metric_name,
                        e,
                        exc_info=True,
                    )
        return flushed

    def queue_size(self) -> int:
        return len(self._queue)


# =========================
# Singleton accessor
# =========================

_ts_writer: Optional[TimeseriesWriter] = None


async def get_timeseries_writer() -> TimeseriesWriter:
    global _ts_writer
    if _ts_writer is None:
        register_default_metrics()
        dsn = settings.TIMESERIES_DB_DSN  # e.g., "postgresql://user:pass@host:5432/db"
        _ts_writer = TimeseriesWriter(
            dsn=dsn,
            max_pool_size=settings.TS_POOL_SIZE,
            batch_size=settings.TS_BATCH_SIZE,
            flush_interval_sec=settings.TS_FLUSH_INTERVAL_SEC,
            max_queue_size=settings.TS_MAX_QUEUE_SIZE,
        )
        await _ts_writer.start()
    return _ts_writer
