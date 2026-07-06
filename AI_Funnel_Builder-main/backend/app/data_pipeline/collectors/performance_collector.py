"""
Performance Collector - Production Grade Implementation
======================================================
Captures real-user performance (RUM) metrics and backend latency signals,
batches them efficiently, detects anomalies, and flushes to a time-series store.

Key capabilities:
- Web Vitals ingestion (LCP, INP, CLS, plus FCP, TTFB)
- Backend latency samples (endpoint/method/status class)
- Batching with periodic flush and overflow handling
- Percentile computation (p50/p90/p95)
- Anomaly detection with configurable thresholds
- Emission of performance events for downstream analytics

Notes:
- Ensure EventType in event_collector includes:
  PERFORMANCE_METRIC, PERFORMANCE_ANOMALY, PERFORMANCE_SUMMARY
- Timeseries writer is expected from app.data_pipeline.storage.timeseries
"""

from __future__ import annotations

import asyncio
import statistics
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Deque
from collections import defaultdict, deque
import json
import logging

import redis.asyncio as redis

from app.utils.logger import get_logger
from app.utils.exceptions import ValidationException
from app.core.config import settings
from app.data_pipeline.collectors.event_collector import (
    track_event,
    EventType,
    EventPriority,
)

logger = get_logger(__name__)


# --------------------------
# Data models
# --------------------------

@dataclass
class WebVitalsSample:
    timestamp: datetime
    session_id: str
    funnel_id: int
    page: str
    route: str
    lcp_ms: Optional[float] = None
    inp_ms: Optional[float] = None
    cls: Optional[float] = None
    fcp_ms: Optional[float] = None
    ttfb_ms: Optional[float] = None
    device: Optional[str] = None
    connection: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if self.timestamp.tzinfo is None:
            self.timestamp = self.timestamp.replace(tzinfo=timezone.utc)
        if not self.session_id or not self.funnel_id or not self.route:
            raise ValidationException("WebVitalsSample requires session_id, funnel_id, and route.")


@dataclass
class BackendLatencySample:
    timestamp: datetime
    endpoint: str
    method: str
    status_class: str  # e.g., "2xx", "4xx", "5xx"
    duration_ms: float
    service: Optional[str] = "api"
    attributes: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if self.timestamp.tzinfo is None:
            self.timestamp = self.timestamp.replace(tzinfo=timezone.utc)
        if self.duration_ms < 0:
            self.duration_ms = 0.0


@dataclass
class FunnelPerfCounters:
    funnel_id: int
    ts: datetime
    views: int
    completes: int

    def completion_rate(self) -> float:
        if self.views <= 0:
            return 0.0
        return min(1.0, max(0.0, self.completes / self.views))


# --------------------------
# Utility functions
# --------------------------

def _pct(values: List[float], p: float) -> float:
    if not values:
        return 0.0
    if p <= 0:
        return min(values)
    if p >= 100:
        return max(values)
    s = sorted(values)
    k = (len(s) - 1) * (p / 100.0)
    f = int(k)
    c = min(f + 1, len(s) - 1)
    if f == c:
        return s[f]
    d = k - f
    return s[f] + (s[c] - s[f]) * d


# --------------------------
# Collector
# --------------------------

class PerformanceCollector:
    """
    High-throughput performance collector.

    Accepts RUM metrics and backend latencies, buffers them in-memory, and
    flushes in batches to the time-series storage. Emits anomaly events when
    thresholds are exceeded.

    Timeseries interface requirements (passed as dependency):
        await timeseries.write_points(metric_name: str, points: List[Dict])
    """

    def __init__(
        self,
        timeseries_writer,
        redis_client: Optional[redis.Redis] = None,
        flush_interval_sec: float = 10.0,
        batch_size: int = 500,
        max_queue_size: int = 20000,
        lcp_slow_ms: int = 2500,
        inp_slow_ms: int = 200,
        cls_poor: float = 0.25,
        backend_p95_alert_ms: int = 800,
    ):
        self.ts_writer = timeseries_writer
        self.redis = redis_client
        self.flush_interval = flush_interval_sec
        self.batch_size = batch_size
        self.max_queue_size = max_queue_size

        # Thresholds (tunable per Google CWV + ops)
        self.lcp_slow_ms = lcp_slow_ms
        self.inp_slow_ms = inp_slow_ms
        self.cls_poor = cls_poor
        self.backend_p95_alert_ms = backend_p95_alert_ms

        # Buffers
        self._web_vitals: Deque[WebVitalsSample] = deque(maxlen=max_queue_size)
        self._backend_lat: Deque[BackendLatencySample] = deque(maxlen=max_queue_size)

        # Aggregates for quick anomaly checks
        self._latency_by_route: Dict[str, List[float]] = defaultdict(list)
        self._lcp_by_route: Dict[str, List[float]] = defaultdict(list)
        self._inp_by_route: Dict[str, List[float]] = defaultdict(list)
        self._cls_by_route: Dict[str, List[float]] = defaultdict(list)

        # Concurrency
        self._lock = asyncio.Lock()
        self._is_running = False
        self._flush_task: Optional[asyncio.Task] = None

        logger.info(
            "PerformanceCollector initialized: flush=%ss batch=%s max_queue=%s",
            self.flush_interval, self.batch_size, self.max_queue_size
        )

    async def start(self):
        if self._is_running:
            return
        self._is_running = True
        self._flush_task = asyncio.create_task(self._periodic_flush())
        logger.info("PerformanceCollector started")

    async def stop(self, timeout: float = 20.0):
        if not self._is_running:
            return
        logger.info("Stopping PerformanceCollector...")
        self._is_running = False
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass
        try:
            await asyncio.wait_for(self._flush_all(), timeout=timeout)
        except asyncio.TimeoutError:
            logger.error("Timeout while flushing PerformanceCollector buffers.")

    # -------------
    # Public API
    # -------------

    async def collect_funnel_metrics(
        self,
        session_id: str,
        funnel_id: int,
        page: str,
        route: str,
        web_vitals: Dict[str, Any],
        device: Optional[str] = None,
        connection: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Record client-side performance signals (RUM/Core Web Vitals).
        web_vitals keys expected: lcp_ms, inp_ms, cls, fcp_ms, ttfb_ms
        """
        sample = WebVitalsSample(
            timestamp=datetime.now(timezone.utc),
            session_id=session_id,
            funnel_id=funnel_id,
            page=page,
            route=route,
            lcp_ms=web_vitals.get("lcp_ms"),
            inp_ms=web_vitals.get("inp_ms"),
            cls=web_vitals.get("cls"),
            fcp_ms=web_vitals.get("fcp_ms"),
            ttfb_ms=web_vitals.get("ttfb_ms"),
            device=device,
            connection=connection,
            metadata=metadata or {},
        )

        async with self._lock:
            if len(self._web_vitals) >= self.max_queue_size:
                # Drop oldest via deque maxlen behavior; also emit a warning event
                await self._emit_overflow_event(kind="web_vitals")
            self._web_vitals.append(sample)

            # Update route aggregates (for fast anomaly checks)
            if sample.lcp_ms is not None:
                self._lcp_by_route[route].append(float(sample.lcp_ms))
            if sample.inp_ms is not None:
                self._inp_by_route[route].append(float(sample.inp_ms))
            if sample.cls is not None:
                self._cls_by_route[route].append(float(sample.cls))

        # Quick anomaly checks
        await self._check_web_vitals_anomaly(route)

    async def track_completion_rates(
        self,
        funnel_id: int,
        views: int,
        completes: int,
        ts: Optional[datetime] = None,
    ) -> None:
        """
        Record aggregated per-funnel completion counters for a time bucket.
        """
        ts = ts or datetime.now(timezone.utc)
        counters = FunnelPerfCounters(
            funnel_id=funnel_id,
            ts=ts,
            views=views,
            completes=completes,
        )
        # Write directly (low volume)
        points = [{
            "time": counters.ts.isoformat(),
            "funnel_id": counters.funnel_id,
            "views": counters.views,
            "completes": counters.completes,
            "completion_rate": counters.completion_rate(),
        }]
        await self.ts_writer.write_points("funnel_completion", points)

        # Emit summary event for analytics
        await track_event(
            event_type=EventType.PERFORMANCE_METRIC,
            session_id=str(f"funnel:{funnel_id}"),
            funnel_id=funnel_id,
            payload=points[0],
            priority=EventPriority.LOW,
        )

    async def record_backend_latency(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        duration_ms: float,
        service: Optional[str] = "api",
        attributes: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Record backend latency sample (recommended to be called from middleware).
        """
        status_class = f"{int(status_code) // 100}xx"
        sample = BackendLatencySample(
            timestamp=datetime.now(timezone.utc),
            endpoint=endpoint,
            method=method,
            status_class=status_class,
            duration_ms=float(duration_ms),
            service=service,
            attributes=attributes or {},
        )

        async with self._lock:
            if len(self._backend_lat) >= self.max_queue_size:
                await self._emit_overflow_event(kind="backend_latency")
            self._backend_lat.append(sample)
            key = f"{method} {endpoint} {status_class}"
            self._latency_by_route[key].append(sample.duration_ms)

        # Quick anomaly check for backend p95
        await self._check_backend_anomaly()

    # -------------
    # Internals
    # -------------

    async def _periodic_flush(self):
        while self._is_running:
            try:
                await asyncio.sleep(self.flush_interval)
                await self._flush_batch()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in PerformanceCollector periodic flush: %s", e, exc_info=True)

    async def _flush_all(self):
        # Repeatedly flush until buffers are empty
        while True:
            emptied = await self._flush_batch()
            if emptied == 0:
                break
            await asyncio.sleep(0.1)

    async def _flush_batch(self) -> int:
        """
        Flush a batch of vitals and backend latencies to the time-series store.
        Returns number of records flushed.
        """
        web_batch: List[WebVitalsSample] = []
        back_batch: List[BackendLatencySample] = []

        async with self._lock:
            for _ in range(min(self.batch_size, len(self._web_vitals))):
                web_batch.append(self._web_vitals.popleft())
            for _ in range(min(self.batch_size, len(self._backend_lat))):
                back_batch.append(self._backend_lat.popleft())

        count = 0
        if web_batch:
            await self._write_web_vitals(web_batch)
            count += len(web_batch)
        if back_batch:
            await self._write_backend_latency(back_batch)
            count += len(back_batch)
        return count

    async def _write_web_vitals(self, batch: List[WebVitalsSample]) -> None:
        points = []
        for s in batch:
            points.append({
                "time": s.timestamp.isoformat(),
                "funnel_id": s.funnel_id,
                "session_id": s.session_id,
                "page": s.page,
                "route": s.route,
                "lcp_ms": s.lcp_ms,
                "inp_ms": s.inp_ms,
                "cls": s.cls,
                "fcp_ms": s.fcp_ms,
                "ttfb_ms": s.ttfb_ms,
                "device": s.device,
                "connection": s.connection,
                "metadata": s.metadata,
            })
        await self.ts_writer.write_points("web_vitals", points)

    async def _write_backend_latency(self, batch: List[BackendLatencySample]) -> None:
        points = []
        for s in batch:
            points.append({
                "time": s.timestamp.isoformat(),
                "service": s.service,
                "endpoint": s.endpoint,
                "method": s.method,
                "status_class": s.status_class,
                "duration_ms": s.duration_ms,
                "attributes": s.attributes,
            })
        await self.ts_writer.write_points("backend_latency", points)

    async def _emit_overflow_event(self, kind: str) -> None:
        await track_event(
            event_type=EventType.PERFORMANCE_ANOMALY,
            session_id="perf:overflow",
            payload={"kind": kind, "message": "Performance buffer overflow"},
            priority=EventPriority.HIGH,
        )

    async def _check_web_vitals_anomaly(self, route: str) -> None:
        # Check recent values for route against thresholds
        lcp_vals = self._lcp_by_route.get(route) or []
        inp_vals = self._inp_by_route.get(route) or []
        cls_vals = self._cls_by_route.get(route) or []

        # Only evaluate if we have a minimal sample size
        min_n = 10
        if len(lcp_vals) >= min_n:
            p95_lcp = _pct(lcp_vals[-min_n * 10:], 95.0)  # last window
            if p95_lcp > self.lcp_slow_ms:
                await self._emit_perf_anomaly(
                    dimension="route",
                    name=route,
                    metric="lcp_p95_ms",
                    value=p95_lcp,
                    threshold=self.lcp_slow_ms,
                    severity="high",
                )

        if len(inp_vals) >= min_n:
            p95_inp = _pct(inp_vals[-min_n * 10:], 95.0)
            if p95_inp > self.inp_slow_ms:
                await self._emit_perf_anomaly(
                    dimension="route",
                    name=route,
                    metric="inp_p95_ms",
                    value=p95_inp,
                    threshold=self.inp_slow_ms,
                    severity="high",
                )

        if len(cls_vals) >= min_n:
            p95_cls = _pct(cls_vals[-min_n * 10:], 95.0)
            if p95_cls > self.cls_poor:
                await self._emit_perf_anomaly(
                    dimension="route",
                    name=route,
                    metric="cls_p95",
                    value=p95_cls,
                    threshold=self.cls_poor,
                    severity="medium",
                )

    async def _check_backend_anomaly(self) -> None:
        # Evaluate p95 over recent latency samples per route key
        for key, vals in list(self._latency_by_route.items()):
            if len(vals) < 20:
                continue
            window = vals[-200:]  # sliding window
            p95 = _pct(window, 95.0)
            if p95 > self.backend_p95_alert_ms:
                await self._emit_perf_anomaly(
                    dimension="endpoint",
                    name=key,
                    metric="backend_p95_ms",
                    value=p95,
                    threshold=self.backend_p95_alert_ms,
                    severity="high",
                )

    async def _emit_perf_anomaly(
        self,
        dimension: str,
        name: str,
        metric: str,
        value: float,
        threshold: float,
        severity: str,
    ) -> None:
        payload = {
            "dimension": dimension,
            "name": name,
            "metric": metric,
            "value": value,
            "threshold": threshold,
            "severity": severity,
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        await track_event(
            event_type=EventType.PERFORMANCE_ANOMALY,
            session_id=f"perf:{dimension}:{name}",
            payload=payload,
            priority=EventPriority.HIGH,
        )

    async def emit_summary(self) -> None:
        """
        Emit a compact summary snapshot of recent performance health.
        Useful for dashboards without heavy queries.
        """
        summary = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "routes": {},
        }

        # Build per-route summary from available aggregates
        routes = set(self._lcp_by_route.keys()) | set(self._inp_by_route.keys()) | set(self._cls_by_route.keys())
        for route in routes:
            lcp = self._lcp_by_route.get(route, [])
            inp = self._inp_by_route.get(route, [])
            cls = self._cls_by_route.get(route, [])
            summary["routes"][route] = {
                "lcp_p50": _pct(lcp[-200:], 50) if lcp else None,
                "lcp_p95": _pct(lcp[-200:], 95) if lcp else None,
                "inp_p50": _pct(inp[-200:], 50) if inp else None,
                "inp_p95": _pct(inp[-200:], 95) if inp else None,
                "cls_p50": _pct(cls[-200:], 50) if cls else None,
                "cls_p95": _pct(cls[-200:], 95) if cls else None,
            }

        await track_event(
            event_type=EventType.PERFORMANCE_SUMMARY,
            session_id="perf:summary",
            payload=summary,
            priority=EventPriority.MEDIUM,
        )

    # -------------
    # Singleton helpers
    # -------------

_collector_instance: Optional[PerformanceCollector] = None


async def get_performance_collector():
    """
    Create or return the singleton PerformanceCollector.
    Expects timeseries writer to be available from storage.timeseries.
    """
    global _collector_instance
    if _collector_instance is None:
        from app.data_pipeline.storage.timeseries import get_timeseries_writer
        from app.core.cache import get_redis_client

        ts_writer = await get_timeseries_writer()
        redis_client = await get_redis_client()

        _collector_instance = PerformanceCollector(
            timeseries_writer=ts_writer,
            redis_client=redis_client,
            flush_interval_sec=settings.PERF_FLUSH_INTERVAL_SEC,
            batch_size=settings.PERF_BATCH_SIZE,
            max_queue_size=settings.PERF_MAX_QUEUE_SIZE,
            lcp_slow_ms=settings.CWV_LCP_SLOW_MS,
            inp_slow_ms=settings.CWV_INP_SLOW_MS,
            cls_poor=settings.CWV_CLS_POOR,
            backend_p95_alert_ms=settings.BACKEND_P95_ALERT_MS,
        )
        await _collector_instance.start()
    return _collector_instance


async def shutdown_performance_collector():
    """Shutdown the singleton collector and flush buffers."""
    global _collector_instance
    if _collector_instance:
        await _collector_instance.stop()
        _collector_instance = None
