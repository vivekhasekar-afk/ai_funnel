"""
Event Schemas - Production Grade
================================
Pydantic schemas for user events, tracking, and behavioral analytics.
Supports real-time analytics, GDPR compliance, and event streaming.
"""


from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum
from pydantic.types import StrictStr, StrictInt


class EventType(str, Enum):
    """User event types."""
    PAGE_VIEW = "page_view"
    FUNNEL_START = "funnel_start"
    QUESTION_VIEW = "question_view"
    QUESTION_ANSWER = "question_answer"
    QUESTION_SKIP = "question_skip"
    FUNNEL_COMPLETE = "funnel_complete"
    LEAD_CAPTURE = "lead_capture"
    FORM_SUBMIT = "form_submit"
    ABANDON = "abandon"
    CONVERSION = "conversion"


class EventCategory(str, Enum):
    """Event categories for grouping."""
    ENGAGEMENT = "engagement"
    CONVERSION = "conversion"
    DROPOFF = "dropoff"
    SYSTEM = "system"


class EventCreate(BaseModel):
    """Create new tracking event."""
    event_type: EventType = Field(..., description="Event type")
    funnel_id: Optional[StrictStr] = Field(None, description="Funnel ID")
    question_id: Optional[StrictInt] = Field(None, description="Question ID")
    session_id: StrictStr = Field(..., description="User session ID")
    user_id: Optional[StrictInt] = Field(None, description="User ID")

    # Context data
    metadata: Optional[Dict[str, Any]] = Field(None, description="Event metadata")
    page_url: Optional[StrictStr] = Field(None, description="Current page URL")
    referrer_url: Optional[StrictStr] = Field(None, description="Referrer URL")

    # Behavioral data
    time_spent_ms: Optional[StrictInt] = Field(None, ge=0, description="Time spent")
    position: Optional[StrictInt] = Field(None, description="Question position")

    model_config = ConfigDict(from_attributes=True, extra="allow")


class EventResponse(BaseModel):
    """Complete event with processing metadata."""
    event_id: StrictStr
    event_type: EventType
    funnel_id: Optional[StrictStr] = None
    question_id: Optional[StrictInt] = None
    session_id: StrictStr
    user_id: Optional[StrictInt] = None

    # Timestamps
    timestamp: datetime
    received_at: datetime

    # Behavioral data
    time_spent_ms: Optional[StrictInt] = None
    position: Optional[StrictInt] = None

    # Context
    ip_address_hash: Optional[StrictStr] = None  # GDPR compliant
    user_agent_hash: Optional[StrictStr] = None
    country_code: Optional[StrictStr] = None
    device_type: Optional[StrictStr] = None

    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class EventBatch(BaseModel):
    """Batch event submission."""
    events: List[EventCreate] = Field(..., min_items=1, max_items=1000)
    batch_id: StrictStr = Field(..., description="Batch identifier")
    model_config = ConfigDict(from_attributes=True)


class EventFilter(BaseModel):
    """Event filtering criteria."""
    event_types: Optional[List[EventType]] = None
    funnel_ids: Optional[List[StrictStr]] = None
    session_ids: Optional[List[StrictStr]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    time_range: Literal["1h", "24h", "7d", "30d"] = "24h"
    model_config = ConfigDict(from_attributes=True)


class EventStats(BaseModel):
    """Aggregated event statistics."""
    total_events: StrictInt
    events_by_type: Dict[EventType, StrictInt]
    active_sessions: StrictInt
    conversion_events: StrictInt
    dropoff_events: StrictInt
    time_range: Dict[str, datetime]
    model_config = ConfigDict(from_attributes=True)


class EventExportRequest(BaseModel):
    """Event data export parameters."""
    format: Literal["csv", "jsonl", "parquet"] = "jsonl"
    filters: Optional[EventFilter] = None
    limit: Optional[StrictInt] = Field(None, ge=1, le=1000000)
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = [
    "EventType",
    "EventCategory",
    "EventCreate",
    "EventResponse",
    "EventBatch",
    "EventFilter",
    "EventStats",
    "EventExportRequest",
]
