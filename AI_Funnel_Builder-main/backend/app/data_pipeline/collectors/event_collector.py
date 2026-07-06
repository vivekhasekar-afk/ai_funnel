"""
Event Collector - Production Grade Implementation
================================================
Handles high-throughput event tracking with batching, retry logic, 
and graceful degradation. This is a core component of the data moat.

Features:
- Async event tracking
- Automatic batching for database efficiency
- In-memory queue with overflow protection
- Retry logic with exponential backoff
- Graceful shutdown handling
- Metrics and monitoring
- Thread-safe operations
"""

import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from collections import deque
import json

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import insert, select, func
from sqlalchemy.exc import SQLAlchemyError
import redis.asyncio as redis
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)

from app.core.config import settings
from app.models.event import Event
from app.utils.logger import get_logger
from app.utils.exceptions import BatchInsertError


logger = get_logger(__name__)


class EventType(str, Enum):
    """Event type enumeration for type safety"""
    FUNNEL_VIEW = "funnel_view"
    QUESTION_VIEW = "question_view"
    QUESTION_ANSWER = "question_answer"
    QUESTION_SKIP = "question_skip"
    FUNNEL_COMPLETE = "funnel_complete"
    FUNNEL_ABANDON = "funnel_abandon"
    EMAIL_CAPTURE = "email_capture"
    SCROLL = "scroll"
    CLICK = "click"
    HESITATION = "hesitation"
    TIME_ON_QUESTION = "time_on_question"
    ERROR = "error"


class EventPriority(str, Enum):
    """Event priority for queue management"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class EventPayload:
    """Structured event payload with validation"""
    event_type: EventType
    funnel_id: Optional[int]
    session_id: str
    user_id: Optional[int]
    question_id: Optional[int]
    payload: Dict[str, Any]
    timestamp: datetime
    priority: EventPriority = EventPriority.MEDIUM
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        """Validate and normalize data"""
        if not self.session_id:
            raise ValueError("session_id is required")
        
        # Ensure timestamp is timezone-aware
        if self.timestamp.tzinfo is None:
            self.timestamp = self.timestamp.replace(tzinfo=timezone.utc)
        
        # Validate payload is JSON-serializable
        try:
            json.dumps(self.payload)
        except (TypeError, ValueError) as e:
            raise ValueError(f"Payload must be JSON-serializable: {e}")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database insertion"""
        return {
            "event_type": self.event_type.value,
            "funnel_id": self.funnel_id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "payload": self.payload,
            "timestamp": self.timestamp,
            "metadata": self.metadata or {}
        }


class EventCollectorMetrics:
    """Metrics tracking for monitoring and alerting"""
    
    def __init__(self):
        self.events_tracked = 0
        self.events_batched = 0
        self.events_inserted = 0
        self.events_failed = 0
        self.batch_insert_count = 0
        self.queue_overflows = 0
        self.last_flush_time = time.time()
        self.flush_durations: deque = deque(maxlen=100)
    
    def record_event_tracked(self):
        self.events_tracked += 1
    
    def record_batch_insert(self, count: int, duration: float):
        self.events_batched += count
        self.events_inserted += count
        self.batch_insert_count += 1
        self.flush_durations.append(duration)
        self.last_flush_time = time.time()
    
    def record_failure(self, count: int = 1):
        self.events_failed += count
    
    def record_overflow(self):
        self.queue_overflows += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current metrics statistics"""
        avg_flush_duration = (
            sum(self.flush_durations) / len(self.flush_durations)
            if self.flush_durations else 0
        )
        
        return {
            "events_tracked": self.events_tracked,
            "events_batched": self.events_batched,
            "events_inserted": self.events_inserted,
            "events_failed": self.events_failed,
            "batch_insert_count": self.batch_insert_count,
            "queue_overflows": self.queue_overflows,
            "avg_flush_duration_ms": round(avg_flush_duration * 1000, 2),
            "time_since_last_flush_sec": round(time.time() - self.last_flush_time, 2)
        }


class EventCollector:
    """
    High-performance event collector with automatic batching and retry logic.
    
    This collector is designed for high-throughput event tracking with:
    - Automatic batching to reduce database load
    - In-memory queue with configurable size
    - Periodic flushing based on time or size
    - Retry logic with exponential backoff
    - Graceful shutdown with queue draining
    - Redis backup for overflow protection
    
    Usage:
        collector = EventCollector(db_session_factory, redis_client)
        await collector.start()
        
        await collector.track_event(
            event_type=EventType.QUESTION_ANSWER,
            session_id="abc123",
            funnel_id=1,
            payload={"answer": "Option A"}
        )
        
        await collector.stop()
    """
    
    def __init__(
        self,
        db_session_factory: async_sessionmaker,
        redis_client: Optional[redis.Redis] = None,
        batch_size: int = 100,
        flush_interval_seconds: float = 5.0,
        max_queue_size: int = 10000,
        max_retry_attempts: int = 3,
        enable_redis_backup: bool = True
    ):
        """
        Initialize Event Collector
        
        Args:
            db_session_factory: Async SQLAlchemy session factory
            redis_client: Redis client for overflow backup
            batch_size: Number of events to batch before insert
            flush_interval_seconds: Maximum time between flushes
            max_queue_size: Maximum queue size before overflow
            max_retry_attempts: Maximum retry attempts for failed inserts
            enable_redis_backup: Enable Redis backup for overflow
        """
        self.db_session_factory = db_session_factory
        self.redis_client = redis_client
        self.batch_size = batch_size
        self.flush_interval = flush_interval_seconds
        self.max_queue_size = max_queue_size
        self.max_retry_attempts = max_retry_attempts
        self.enable_redis_backup = enable_redis_backup and redis_client is not None
        
        # Internal state
        self._queue: deque = deque(maxlen=max_queue_size)
        self._priority_queue: deque = deque(maxlen=max_queue_size)
        self._is_running = False
        self._flush_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
        
        # Metrics
        self.metrics = EventCollectorMetrics()
        
        logger.info(
            f"EventCollector initialized: batch_size={batch_size}, "
            f"flush_interval={flush_interval_seconds}s, "
            f"max_queue_size={max_queue_size}"
        )
    
    async def start(self):
        """Start the event collector and background flush task"""
        if self._is_running:
            logger.warning("EventCollector already running")
            return
        
        self._is_running = True
        self._flush_task = asyncio.create_task(self._periodic_flush())
        logger.info("EventCollector started")
    
    async def stop(self, timeout: float = 30.0):
        """
        Stop the event collector and flush remaining events
        
        Args:
            timeout: Maximum time to wait for queue to drain
        """
        if not self._is_running:
            return
        
        logger.info("Stopping EventCollector, flushing remaining events...")
        self._is_running = False
        
        # Cancel flush task
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass
        
        # Flush remaining events with timeout
        try:
            await asyncio.wait_for(self._flush_all(), timeout=timeout)
            logger.info(
                f"EventCollector stopped. Final stats: {self.metrics.get_stats()}"
            )
        except asyncio.TimeoutError:
            logger.error(
                f"Failed to flush all events within {timeout}s timeout. "
                f"Lost {len(self._queue) + len(self._priority_queue)} events"
            )
    
    async def track_event(
        self,
        event_type: EventType,
        session_id: str,
        funnel_id: Optional[int] = None,
        user_id: Optional[int] = None,
        question_id: Optional[int] = None,
        payload: Optional[Dict[str, Any]] = None,
        priority: EventPriority = EventPriority.MEDIUM,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Track an event (non-blocking, queues for batch insert)
        
        Args:
            event_type: Type of event
            session_id: User session identifier
            funnel_id: Associated funnel ID
            user_id: User ID (if authenticated)
            question_id: Question ID (if applicable)
            payload: Event-specific data
            priority: Event priority for queue management
            metadata: Additional metadata
        
        Returns:
            bool: True if queued successfully, False if queue is full
        """
        try:
            event = EventPayload(
                event_type=event_type,
                funnel_id=funnel_id,
                session_id=session_id,
                user_id=user_id,
                question_id=question_id,
                payload=payload or {},
                timestamp=datetime.now(timezone.utc),
                priority=priority,
                metadata=metadata
            )
            
            async with self._lock:
                # Use priority queue for high/critical priority events
                if priority in (EventPriority.HIGH, EventPriority.CRITICAL):
                    if len(self._priority_queue) >= self.max_queue_size:
                        await self._handle_overflow(event)
                        return False
                    self._priority_queue.append(event)
                else:
                    if len(self._queue) >= self.max_queue_size:
                        await self._handle_overflow(event)
                        return False
                    self._queue.append(event)
                
                self.metrics.record_event_tracked()
                
                # Trigger immediate flush if batch size reached
                if self._should_flush_immediately():
                    asyncio.create_task(self.flush_queue())
            
            return True
            
        except Exception as e:
            logger.error(f"Error tracking event: {e}", exc_info=True)
            self.metrics.record_failure()
            return False
    
    def _should_flush_immediately(self) -> bool:
        """Check if immediate flush is needed"""
        total_queued = len(self._queue) + len(self._priority_queue)
        return total_queued >= self.batch_size
    
    async def _handle_overflow(self, event: EventPayload):
        """Handle queue overflow by backing up to Redis"""
        self.metrics.record_overflow()
        
        if self.enable_redis_backup and self.redis_client:
            try:
                await self.redis_client.lpush(
                    "event_collector:overflow",
                    json.dumps(asdict(event), default=str)
                )
                logger.warning(f"Event backed up to Redis due to queue overflow")
            except Exception as e:
                logger.error(f"Failed to backup event to Redis: {e}")
        else:
            logger.error(
                f"Event queue overflow! Dropping event: {event.event_type} "
                f"for session {event.session_id}"
            )
    
    async def flush_queue(self) -> int:
        """
        Flush queued events to database (with retry logic)
        
        Returns:
            int: Number of events successfully inserted
        """
        if not self._is_running:
            return 0
        
        async with self._lock:
            # Get events from both queues (priority first)
            events_to_insert: List[EventPayload] = []
            
            # Priority queue first
            while self._priority_queue and len(events_to_insert) < self.batch_size:
                events_to_insert.append(self._priority_queue.popleft())
            
            # Fill remaining with normal queue
            while self._queue and len(events_to_insert) < self.batch_size:
                events_to_insert.append(self._queue.popleft())
            
            if not events_to_insert:
                return 0
        
        # Insert batch
        return await self._batch_insert(events_to_insert)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(SQLAlchemyError),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    async def _batch_insert(self, events: List[EventPayload]) -> int:
        """
        Insert batch of events into database with retry logic
        
        Args:
            events: List of events to insert
        
        Returns:
            int: Number of events inserted
        """
        if not events:
            return 0
        
        start_time = time.time()
        
        try:
            async with self.db_session_factory() as session:
                # Convert events to dict format
                event_dicts = [event.to_dict() for event in events]
                
                # Bulk insert
                stmt = insert(Event).values(event_dicts)
                await session.execute(stmt)
                await session.commit()
                
                duration = time.time() - start_time
                self.metrics.record_batch_insert(len(events), duration)
                
                logger.debug(
                    f"Batch inserted {len(events)} events in {duration*1000:.2f}ms"
                )
                
                return len(events)
                
        except SQLAlchemyError as e:
            logger.error(f"Database error during batch insert: {e}", exc_info=True)
            self.metrics.record_failure(len(events))
            
            # Re-queue events on failure
            async with self._lock:
                self._queue.extendleft(reversed(events))
            
            raise BatchInsertError(f"Failed to insert {len(events)} events") from e
        
        except Exception as e:
            logger.error(f"Unexpected error during batch insert: {e}", exc_info=True)
            self.metrics.record_failure(len(events))
            raise
    
    async def _periodic_flush(self):
        """Background task for periodic queue flushing"""
        while self._is_running:
            try:
                await asyncio.sleep(self.flush_interval)
                await self.flush_queue()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic flush: {e}", exc_info=True)
    
    async def _flush_all(self):
        """Flush all remaining events in queue"""
        while (len(self._queue) + len(self._priority_queue)) > 0:
            inserted = await self.flush_queue()
            if inserted == 0:
                break
            await asyncio.sleep(0.1)
    
    def get_queue_size(self) -> Dict[str, int]:
        """Get current queue sizes"""
        return {
            "normal_queue": len(self._queue),
            "priority_queue": len(self._priority_queue),
            "total": len(self._queue) + len(self._priority_queue)
        }
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get collector metrics"""
        return {
            **self.metrics.get_stats(),
            "queue_size": self.get_queue_size(),
            "is_running": self._is_running
        }


# Singleton instance
_collector_instance: Optional[EventCollector] = None


async def get_event_collector() -> EventCollector:
    """Get or create singleton event collector instance"""
    global _collector_instance
    
    if _collector_instance is None:
        from app.core.database import async_session_factory
        from app.core.cache import get_redis_client
        
        redis_client = await get_redis_client()
        _collector_instance = EventCollector(
            db_session_factory=async_session_factory,
            redis_client=redis_client,
            batch_size=settings.EVENT_BATCH_SIZE,
            flush_interval_seconds=settings.EVENT_FLUSH_INTERVAL,
            max_queue_size=settings.EVENT_MAX_QUEUE_SIZE
        )
        await _collector_instance.start()
    
    return _collector_instance


async def shutdown_event_collector():
    """Shutdown singleton event collector"""
    global _collector_instance
    
    if _collector_instance:
        await _collector_instance.stop()
        _collector_instance = None


# Convenience function for quick event tracking
async def track_event(
    event_type: EventType,
    session_id: str,
    **kwargs
) -> bool:
    """
    Quick event tracking function
    
    Usage:
        await track_event(
            EventType.QUESTION_ANSWER,
            session_id="abc123",
            funnel_id=1,
            payload={"answer": "Option A"}
        )
    """
    collector = await get_event_collector()
    return await collector.track_event(event_type, session_id, **kwargs)
