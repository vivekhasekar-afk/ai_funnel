"""
warehouse.py - Cloud Data Warehouse Abstraction
===============================================
Unified interface for writing analytics/ML data to:
- Google BigQuery
- Snowflake
- Amazon Redshift

Features:
- Pluggable adapter pattern (BigQuery/Snowflake/Redshift)
- Batched inserts with backpressure and periodic flush
- Upsert/merge support on business keys
- Optional staging-based bulk loads (object storage → warehouse)
- Schema registration (logical table → physical table metadata)
- Async-friendly with connection pooling and graceful shutdown
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Protocol, Deque
from collections import deque

from tenacity import retry, stop_after_attempt, wait_exponential

from app.utils.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)


# =========================
# Adapter protocol
# =========================

class WarehouseEngine(str, Enum):
    BIGQUERY = "bigquery"
    SNOWFLAKE = "snowflake"
    REDSHIFT = "redshift"


class WarehouseAdapter(Protocol):
    """
    Base protocol for all concrete adapters.

    Implementations must handle:
    - schema management
    - batched inserts
    - upserts via MERGE or equivalent
    - staging-based bulk load (optional)
    """

    async def ensure_table(
        self,
        table: str,
        schema: Dict[str, str],
        partition_field: Optional[str] = None,
        cluster_fields: Optional[List[str]] = None,
    ) -> None:
        ...

    async def insert_rows(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        schema: Optional[Dict[str, str]] = None,
    ) -> None:
        ...

    async def upsert_rows(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        key_columns: List[str],
        schema: Optional[Dict[str, str]] = None,
    ) -> None:
        ...

    async def bulk_load_from_stage(
        self,
        table: str,
        stage_uri: str,
        file_format: str = "json",
        schema: Optional[Dict[str, str]] = None,
        overwrite: bool = False,
    ) -> None:
        """
        Load data from object storage (GCS/S3) to the table using native bulk APIs:
        - BigQuery: load job from GCS
        - Snowflake: COPY INTO from stage
        - Redshift: COPY from S3
        """

    async def close(self) -> None:
        ...


# =========================
# Table metadata
# =========================

@dataclass(frozen=True)
class WarehouseTableConfig:
    name: str
    schema: Dict[str, str]                  # col_name -> warehouse type
    engine: WarehouseEngine
    key_columns: Optional[List[str]] = None # for upsert
    partition_field: Optional[str] = None
    cluster_fields: Optional[List[str]] = None
    upsert: bool = False
    description: Optional[str] = None


class TableRegistry:
    """
    Logical → physical table registry.

    Example keys: "events", "session_features", "daily_metrics"
    """

    def __init__(self):
        self._tables: Dict[str, WarehouseTableConfig] = {}

    def register(self, key: str, cfg: WarehouseTableConfig) -> None:
        if key in self._tables:
            raise ValueError(f"Table key already registered: {key}")
        self._tables[key] = cfg

    def get(self, key: str) -> WarehouseTableConfig:
        if key not in self._tables:
            raise KeyError(f"Unknown warehouse table key: {key}")
        return self._tables[key]

    def all(self) -> Dict[str, WarehouseTableConfig]:
        return dict(self._tables)


# =========================
# Batch writer
# =========================

@dataclass
class BatchStats:
    enqueued: int = 0
    flushed: int = 0
    failed: int = 0
    last_flush_at: Optional[datetime] = None
    last_error: Optional[str] = None


class WarehouseBatchWriter:
    """
    Generic batch writer with periodic flush and backpressure.
    """

    def __init__(
        self,
        adapter: WarehouseAdapter,
        table_cfg: WarehouseTableConfig,
        batch_size: int = 1000,
        flush_interval_sec: float = 10.0,
        max_queue_size: int = 50_000,
    ):
        self.adapter = adapter
        self.table_cfg = table_cfg
        self.batch_size = batch_size
        self.flush_interval = flush_interval_sec
        self.max_queue_size = max_queue_size

        self._queue: Deque[Dict[str, Any]] = deque(maxlen=max_queue_size)
        self._lock = asyncio.Lock()
        self._is_running = False
        self._flush_task: Optional[asyncio.Task] = None
        self.stats = BatchStats()

    async def start(self) -> None:
        """Ensure table and spawn periodic flush."""
        if self._is_running:
            return
        self._is_running = True

        await self.adapter.ensure_table(
            table=self.table_cfg.name,
            schema=self.table_cfg.schema,
            partition_field=self.table_cfg.partition_field,
            cluster_fields=self.table_cfg.cluster_fields,
        )

        self._flush_task = asyncio.create_task(self._periodic_flush())
        logger.info(
            "WarehouseBatchWriter started for %s (engine=%s)",
            self.table_cfg.name,
            self.table_cfg.engine.value,
        )

    async def stop(self, timeout: float = 30.0) -> None:
        """Stop periodic flush and drain queue."""
        if not self._is_running:
            return
        self._is_running = False
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass

        try:
            await asyncio.wait_for(self.flush_all(), timeout=timeout)
        except asyncio.TimeoutError:
            logger.error(
                "Timeout flushing warehouse writer for %s. Remaining=%s",
                self.table_cfg.name,
                len(self._queue),
            )

    async def enqueue(self, row: Dict[str, Any]) -> bool:
        async with self._lock:
            if len(self._queue) >= self.max_queue_size:
                logger.warning(
                    "Warehouse queue full for %s (size=%s). Dropping row.",
                    self.table_cfg.name,
                    self.max_queue_size,
                )
                self.stats.failed += 1
                return False

            self._queue.append(row)
            self.stats.enqueued += 1

            if len(self._queue) >= self.batch_size:
                asyncio.create_task(self.flush_batch())

        return True

    async def flush_all(self) -> None:
        while True:
            flushed = await self.flush_batch()
            if flushed == 0:
                break
            await asyncio.sleep(0.05)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
    )
    async def _write_batch(self, batch: List[Dict[str, Any]]) -> None:
        if self.table_cfg.upsert and self.table_cfg.key_columns:
            await self.adapter.upsert_rows(
                table=self.table_cfg.name,
                rows=batch,
                key_columns=self.table_cfg.key_columns,
                schema=self.table_cfg.schema,
            )
        else:
            await self.adapter.insert_rows(
                table=self.table_cfg.name,
                rows=batch,
                schema=self.table_cfg.schema,
            )

    async def flush_batch(self) -> int:
        async with self._lock:
            if not self._queue:
                return 0
            batch: List[Dict[str, Any]] = []
            while self._queue and len(batch) < self.batch_size:
                batch.append(self._queue.popleft())

        if not batch:
            return 0

        try:
            await self._write_batch(batch)
            self.stats.flushed += len(batch)
            self.stats.last_flush_at = datetime.now(timezone.utc)
            logger.debug(
                "Flushed %s rows to %s",
                len(batch),
                self.table_cfg.name,
            )
            return len(batch)
        except Exception as e:
            self.stats.failed += len(batch)
            self.stats.last_error = str(e)
            logger.error(
                "Failed to flush batch to %s: %s",
                self.table_cfg.name,
                e,
                exc_info=True,
            )
            # Best-effort requeue
            async with self._lock:
                for row in batch:
                    if len(self._queue) >= self.max_queue_size:
                        self._queue.popleft()
                    self._queue.appendleft(row)
            return 0

    async def _periodic_flush(self) -> None:
        while self._is_running:
            try:
                await asyncio.sleep(self.flush_interval)
                await self.flush_batch()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "Error in periodic flush for %s: %s",
                    self.table_cfg.name,
                    e,
                    exc_info=True,
                )

    def status(self) -> Dict[str, Any]:
        return {
            "table": self.table_cfg.name,
            "engine": self.table_cfg.engine.value,
            "queue_size": len(self._queue),
            "enqueued": self.stats.enqueued,
            "flushed": self.stats.flushed,
            "failed": self.stats.failed,
            "last_flush_at": self.stats.last_flush_at.isoformat()
            if self.stats.last_flush_at
            else None,
            "last_error": self.stats.last_error,
        }


# =========================
# Warehouse client
# =========================

class WarehouseClient:
    """
    High-level entrypoint used by the rest of the app.

    - Manages registry and writers
    - Delegates to appropriate adapter per table
    - Supports micro-batch (enqueue) + explicit bulk_load_from_stage
    """

    def __init__(
        self,
        adapter: WarehouseAdapter,
        registry: TableRegistry,
        batch_size: int,
        flush_interval_sec: float,
        max_queue_size: int,
    ):
        self.adapter = adapter
        self.registry = registry
        self.batch_size = batch_size
        self.flush_interval = flush_interval_sec
        self.max_queue_size = max_queue_size

        self._writers: Dict[str, WarehouseBatchWriter] = {}
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        async with self._lock:
            for key, cfg in self.registry.all().items():
                if key in self._writers:
                    continue
                writer = WarehouseBatchWriter(
                    adapter=self.adapter,
                    table_cfg=cfg,
                    batch_size=self.batch_size,
                    flush_interval_sec=self.flush_interval,
                    max_queue_size=self.max_queue_size,
                )
                await writer.start()
                self._writers[key] = writer

    async def stop(self) -> None:
        async with self._lock:
            writers = list(self._writers.values())
        for w in writers:
            await w.stop()
        await self.adapter.close()

    async def write_row(self, table_key: str, row: Dict[str, Any]) -> bool:
        writer = await self._get_writer(table_key)
        return await writer.enqueue(row)

    async def write_rows(self, table_key: str, rows: List[Dict[str, Any]]) -> int:
        writer = await self._get_writer(table_key)
        ok = 0
        for r in rows:
            if await writer.enqueue(r):
                ok += 1
        return ok

    async def bulk_load_from_stage(
        self,
        table_key: str,
        stage_uri: str,
        file_format: str = "json",
        overwrite: bool = False,
    ) -> None:
        """
        Trigger staging-based bulk load (large backfills).
        """
        cfg = self.registry.get(table_key)
        await self.adapter.bulk_load_from_stage(
            table=cfg.name,
            stage_uri=stage_uri,
            file_format=file_format,
            schema=cfg.schema,
            overwrite=overwrite,
        )

    async def flush_all(self) -> None:
        async with self._lock:
            writers = list(self._writers.values())
        for w in writers:
            await w.flush_all()

    async def _get_writer(self, table_key: str) -> WarehouseBatchWriter:
        async with self._lock:
            if table_key not in self._writers:
                cfg = self.registry.get(table_key)
                writer = WarehouseBatchWriter(
                    adapter=self.adapter,
                    table_cfg=cfg,
                    batch_size=self.batch_size,
                    flush_interval_sec=self.flush_interval,
                    max_queue_size=self.max_queue_size,
                )
                await writer.start()
                self._writers[table_key] = writer
            return self._writers[table_key]

    def stats(self) -> Dict[str, Dict[str, Any]]:
        return {k: w.status() for k, w in self._writers.items()}


# =========================
# Concrete adapter stubs
# =========================

class BigQueryAdapter:
    """
    BigQuery implementation.
    Uses google-cloud-bigquery client under the hood.
    """

    def __init__(self, client):
        self.client = client

    async def ensure_table(
        self,
        table: str,
        schema: Dict[str, str],
        partition_field: Optional[str] = None,
        cluster_fields: Optional[List[str]] = None,
    ) -> None:
        # Implement: get_or_create table with partitioning / clustering
        # using BigQuery's Table, SchemaField and client.create_table/update_table.
        pass

    async def insert_rows(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        schema: Optional[Dict[str, str]] = None,
    ) -> None:
        # Implement: use client.insert_rows_json(table, rows, retry=...)
        pass

    async def upsert_rows(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        key_columns: List[str],
        schema: Optional[Dict[str, str]] = None,
    ) -> None:
        # Implement: load rows into staging table then MERGE into target
        pass

    async def bulk_load_from_stage(
        self,
        table: str,
        stage_uri: str,
        file_format: str = "json",
        schema: Optional[Dict[str, str]] = None,
        overwrite: bool = False,
    ) -> None:
        # Implement: BigQuery load job from GCS URI with LoadJobConfig
        pass

    async def close(self) -> None:
        # BigQuery client is typically thread-safe and long-lived; nothing to close.
        pass


class SnowflakeAdapter:
    """
    Snowflake implementation.
    Uses snowflake-connector-python with async wrapper or thread executor.
    """

    def __init__(self, conn_params: Dict[str, Any]):
        self.conn_params = conn_params
        self._pool = None  # Initialize pool/connection manager as needed

    async def ensure_table(
        self,
        table: str,
        schema: Dict[str, str],
        partition_field: Optional[str] = None,
        cluster_fields: Optional[List[str]] = None,
    ) -> None:
        # Implement: CREATE TABLE IF NOT EXISTS + clustering keys if needed
        pass

    async def insert_rows(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        schema: Optional[Dict[str, str]] = None,
    ) -> None:
        # Implement: either multiple INSERTs or stage + COPY INTO
        pass

    async def upsert_rows(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        key_columns: List[str],
        schema: Optional[Dict[str, str]] = None,
    ) -> None:
        # Implement: stage to temporary table, then MERGE INTO target
        pass

    async def bulk_load_from_stage(
        self,
        table: str,
        stage_uri: str,
        file_format: str = "json",
        schema: Optional[Dict[str, str]] = None,
        overwrite: bool = False,
    ) -> None:
        # Implement: COPY INTO <table> FROM @stage PATTERN=... FILE_FORMAT=(TYPE=JSON/CSV)
        pass

    async def close(self) -> None:
        # Close pool/connections if created
        pass


class RedshiftAdapter:
    """
    Redshift implementation.
    Uses psycopg2/asyncpg/SQLAlchemy; for large loads, COPY from S3
    following Amazon's bulk-loading best practices [web:141].
    """

    def __init__(self, engine):
        self.engine = engine  # SQLAlchemy or asyncpg engine

    async def ensure_table(
        self,
        table: str,
        schema: Dict[str, str],
        partition_field: Optional[str] = None,
        cluster_fields: Optional[List[str]] = None,
    ) -> None:
        # Implement: CREATE TABLE IF NOT EXISTS with DISTKEY/SORTKEY as appropriate
        pass

    async def insert_rows(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        schema: Optional[Dict[str, str]] = None,
    ) -> None:
        # Implement: small batches via INSERT; for larger, prefer COPY + staging
        pass

    async def upsert_rows(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        key_columns: List[str],
        schema: Optional[Dict[str, str]] = None,
    ) -> None:
        # Implement: upsert pattern via staging table + DELETE/INSERT
        pass

    async def bulk_load_from_stage(
        self,
        table: str,
        stage_uri: str,
        file_format: str = "json",
        schema: Optional[Dict[str, str]] = None,
        overwrite: bool = False,
    ) -> None:
        # Implement: COPY table FROM 's3://...' CREDENTIALS ... FORMAT AS JSON/CSV
        pass

    async def close(self) -> None:
        # Close engine/pool if needed
        pass


# =========================
# Singleton factory
# =========================

_warehouse_client: Optional[WarehouseClient] = None
_table_registry: Optional[TableRegistry] = None


def get_table_registry() -> TableRegistry:
    global _table_registry
    if _table_registry is None:
        reg = TableRegistry()
        # Example logical tables; adapt names & schemas to your project
        reg.register(
            "events",
            WarehouseTableConfig(
                name=settings.WH_EVENTS_TABLE,
                engine=WarehouseEngine(settings.WH_ENGINE),
                schema={
                    "time": "TIMESTAMP",
                    "event_type": "STRING",
                    "funnel_id": "INT64",
                    "session_id": "STRING",
                    "user_id": "INT64",
                    "question_id": "INT64",
                    "payload": "JSON",
                },
                partition_field="time",
                cluster_fields=["funnel_id", "event_type"],
                upsert=False,
            ),
        )
        reg.register(
            "session_features",
            WarehouseTableConfig(
                name=settings.WH_SESSION_FEATURES_TABLE,
                engine=WarehouseEngine(settings.WH_ENGINE),
                schema={
                    "time": "TIMESTAMP",
                    "funnel_id": "INT64",
                    "session_id": "STRING",
                    "completed": "BOOL",
                    "features": "JSON",
                },
                key_columns=["session_id", "funnel_id"],
                partition_field="time",
                upsert=True,
            ),
        )
        _table_registry = reg
    return _table_registry


async def create_adapter_from_settings() -> WarehouseAdapter:
    engine = WarehouseEngine(settings.WH_ENGINE)
    if engine == WarehouseEngine.BIGQUERY:
        # from google.cloud import bigquery
        # client = bigquery.Client(project=settings.GCP_PROJECT_ID)
        client = None  # stub
        return BigQueryAdapter(client)
    if engine == WarehouseEngine.SNOWFLAKE:
        conn_params = {
            "account": settings.SF_ACCOUNT,
            "user": settings.SF_USER,
            "password": settings.SF_PASSWORD,
            "warehouse": settings.SF_WAREHOUSE,
            "database": settings.SF_DATABASE,
            "schema": settings.SF_SCHEMA,
        }
        return SnowflakeAdapter(conn_params)
    if engine == WarehouseEngine.REDSHIFT:
        # e.g. SQLAlchemy engine
        engine_obj = None  # stub
        return RedshiftAdapter(engine_obj)
    raise ValueError(f"Unsupported warehouse engine: {engine}")


async def get_warehouse_client() -> WarehouseClient:
    global _warehouse_client
    if _warehouse_client is None:
        adapter = await create_adapter_from_settings()
        registry = get_table_registry()
        _warehouse_client = WarehouseClient(
            adapter=adapter,
            registry=registry,
            batch_size=settings.WH_BATCH_SIZE,
            flush_interval_sec=settings.WH_FLUSH_INTERVAL_SEC,
            max_queue_size=settings.WH_MAX_QUEUE_SIZE,
        )
        await _warehouse_client.start()
    return _warehouse_client
