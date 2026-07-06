"""
Behavioral Collector - Production Grade Implementation
======================================================
Tracks micro-behavioral signals that reveal user psychology and engagement:
- Scroll patterns and depth
- Hesitation indicators (hover time, cursor movement)
- Question revisits and changes
- Abandonment signals
- Engagement intensity

This data forms a critical part of the DATA MOAT by capturing what users DO,
not just what they SAY.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Set
from collections import defaultdict, deque
import asyncio
import time
import json

from sqlalchemy import Tuple

from app.utils.logger import get_logger
from app.data_pipeline.collectors.event_collector import (
    track_event,
    EventType,
    EventPriority,
)
from app.core.config import settings


logger = get_logger(__name__)


class BehaviorSignalType(str, Enum):
    """Types of behavioral signals we track"""
    SCROLL_DEPTH = "scroll_depth"
    SCROLL_SPEED = "scroll_speed"
    SCROLL_BACK = "scroll_back"
    MOUSE_HOVER = "mouse_hover"
    CURSOR_MOVEMENT = "cursor_movement"
    QUESTION_HOVER = "question_hover"
    ANSWER_HOVER = "answer_hover"
    ANSWER_CHANGE = "answer_change"
    QUESTION_REVISIT = "question_revisit"
    PAGE_VISIBILITY = "page_visibility"
    RAGE_CLICK = "rage_click"
    COPY_PASTE = "copy_paste"
    FORM_FOCUS = "form_focus"
    IDLE_TIME = "idle_time"
    RAPID_NAVIGATION = "rapid_navigation"


class EngagementLevel(str, Enum):
    """User engagement intensity classification"""
    VERY_HIGH = "very_high"      # Deep engagement, thoughtful interaction
    HIGH = "high"                # Good engagement
    MEDIUM = "medium"            # Normal engagement
    LOW = "low"                  # Distracted or rushing
    VERY_LOW = "very_low"        # Likely abandoning


class AbandonmentRisk(str, Enum):
    """Risk levels for funnel abandonment"""
    CRITICAL = "critical"        # Imminent abandonment
    HIGH = "high"                # Strong abandonment signals
    MEDIUM = "medium"            # Some concerning patterns
    LOW = "low"                  # Normal behavior
    NONE = "none"                # Strong completion signals


@dataclass
class ScrollEvent:
    """Individual scroll event data"""
    timestamp: datetime
    scroll_depth_percent: float  # 0-100
    scroll_direction: str        # 'down' or 'up'
    scroll_speed_px_per_sec: Optional[float] = None
    viewport_height: Optional[int] = None


@dataclass
class HoverEvent:
    """Mouse hover event on specific elements"""
    timestamp: datetime
    element_type: str            # 'question', 'answer', 'button', 'other'
    element_id: Optional[str]
    duration_ms: int
    question_id: Optional[int] = None
    answer_value: Optional[str] = None


@dataclass
class InteractionEvent:
    """Generic interaction event"""
    timestamp: datetime
    interaction_type: str
    target_element: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AnswerChangeEvent:
    """Track when user changes their answer"""
    timestamp: datetime
    question_id: int
    previous_answer: Any
    new_answer: Any
    change_count: int = 1


@dataclass
class SessionBehaviorState:
    """
    Aggregated behavioral state for a session.
    This is maintained in-memory during active sessions.
    """
    session_id: str
    funnel_id: int
    user_id: Optional[int]
    
    # Timing
    session_start: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Scroll tracking
    max_scroll_depth: float = 0.0
    scroll_events: deque = field(default_factory=lambda: deque(maxlen=50))
    scroll_backs_count: int = 0
    
    # Hover tracking
    hover_events: deque = field(default_factory=lambda: deque(maxlen=100))
    total_hover_time_ms: int = 0
    question_hover_times: Dict[int, int] = field(default_factory=dict)
    
    # Answer changes
    answer_changes: Dict[int, List[AnswerChangeEvent]] = field(default_factory=lambda: defaultdict(list))
    
    # Question revisits
    question_views: Dict[int, int] = field(default_factory=lambda: defaultdict(int))
    question_first_view: Dict[int, datetime] = field(default_factory=dict)
    
    # Rage and frustration signals
    rage_click_count: int = 0
    copy_paste_count: int = 0
    
    # Idle periods
    idle_periods: List[Tuple[datetime, datetime]] = field(default_factory=list)
    total_idle_time_ms: int = 0
    
    # Page visibility
    tab_switches: int = 0
    total_time_away_ms: int = 0
    
    # Computed metrics (updated periodically)
    engagement_level: EngagementLevel = EngagementLevel.MEDIUM
    abandonment_risk: AbandonmentRisk = AbandonmentRisk.LOW
    hesitation_score: float = 0.0
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.now(timezone.utc)
    
    def get_session_duration_ms(self) -> int:
        """Get total session duration in milliseconds"""
        delta = self.last_activity - self.session_start
        return int(delta.total_seconds() * 1000)
    
    def get_active_time_ms(self) -> int:
        """Get active time (excluding idle periods)"""
        return self.get_session_duration_ms() - self.total_idle_time_ms
    
    def get_average_question_hover_time_ms(self) -> float:
        """Calculate average hover time per question"""
        if not self.question_hover_times:
            return 0.0
        return sum(self.question_hover_times.values()) / len(self.question_hover_times)


class BehavioralCollector:
    """
    Collects and analyzes behavioral micro-signals in real-time.
    
    This collector maintains in-memory session states for active users and
    performs real-time analysis to detect patterns like:
    - Hesitation (excessive hovering, answer changes)
    - Engagement level (scroll patterns, interaction frequency)
    - Abandonment risk (idle time, tab switches, scroll patterns)
    - Frustration (rage clicks, rapid answer changes)
    
    Usage:
        collector = BehavioralCollector()
        
        # Track scroll
        await collector.track_scroll(
            session_id="abc123",
            funnel_id=1,
            scroll_depth_percent=45.5,
            scroll_direction="down"
        )
        
        # Track hover
        await collector.track_hesitation(
            session_id="abc123",
            funnel_id=1,
            question_id=5,
            hover_duration_ms=3500
        )
        
        # Get analysis
        analysis = await collector.get_session_analysis("abc123")
    """
    
    def __init__(
        self,
        session_timeout_minutes: int = 30,
        cleanup_interval_seconds: int = 300,
        abandonment_idle_threshold_ms: int = 120000,  # 2 minutes
        hesitation_hover_threshold_ms: int = 5000,     # 5 seconds
    ):
        """
        Initialize Behavioral Collector
        
        Args:
            session_timeout_minutes: Inactive session timeout
            cleanup_interval_seconds: How often to clean up stale sessions
            abandonment_idle_threshold_ms: Idle time indicating abandonment risk
            hesitation_hover_threshold_ms: Hover time indicating hesitation
        """
        self.session_timeout = timedelta(minutes=session_timeout_minutes)
        self.cleanup_interval = cleanup_interval_seconds
        self.abandonment_threshold = abandonment_idle_threshold_ms
        self.hesitation_threshold = hesitation_hover_threshold_ms
        
        # In-memory session state storage
        self._active_sessions: Dict[str, SessionBehaviorState] = {}
        self._lock = asyncio.Lock()
        
        # Background tasks
        self._is_running = False
        self._cleanup_task: Optional[asyncio.Task] = None
        
        logger.info(
            f"BehavioralCollector initialized: "
            f"session_timeout={session_timeout_minutes}min, "
            f"abandonment_threshold={abandonment_idle_threshold_ms}ms"
        )
    
    async def start(self):
        """Start background cleanup task"""
        if self._is_running:
            return
        
        self._is_running = True
        self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
        logger.info("BehavioralCollector started")
    
    async def stop(self):
        """Stop collector and flush remaining session data"""
        if not self._is_running:
            return
        
        logger.info("Stopping BehavioralCollector...")
        self._is_running = False
        
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        # Emit final events for all active sessions
        await self._flush_all_sessions()
        logger.info("BehavioralCollector stopped")
    
    def _get_or_create_session(
        self,
        session_id: str,
        funnel_id: int,
        user_id: Optional[int] = None,
    ) -> SessionBehaviorState:
        """Get existing session state or create new one"""
        if session_id not in self._active_sessions:
            self._active_sessions[session_id] = SessionBehaviorState(
                session_id=session_id,
                funnel_id=funnel_id,
                user_id=user_id,
            )
            logger.debug(f"Created new behavioral session: {session_id}")
        
        session = self._active_sessions[session_id]
        session.update_activity()
        return session
    
    async def track_scroll(
        self,
        session_id: str,
        funnel_id: int,
        scroll_depth_percent: float,
        scroll_direction: str = "down",
        scroll_speed_px_per_sec: Optional[float] = None,
        user_id: Optional[int] = None,
    ) -> None:
        """
        Track scroll behavior
        
        Args:
            session_id: Session identifier
            funnel_id: Funnel being viewed
            scroll_depth_percent: Current scroll depth (0-100)
            scroll_direction: 'down' or 'up'
            scroll_speed_px_per_sec: Scroll speed if available
            user_id: User ID if authenticated
        """
        async with self._lock:
            session = self._get_or_create_session(session_id, funnel_id, user_id)
            
            # Create scroll event
            scroll_event = ScrollEvent(
                timestamp=datetime.now(timezone.utc),
                scroll_depth_percent=scroll_depth_percent,
                scroll_direction=scroll_direction,
                scroll_speed_px_per_sec=scroll_speed_px_per_sec,
            )
            
            session.scroll_events.append(scroll_event)
            
            # Update max depth
            if scroll_depth_percent > session.max_scroll_depth:
                session.max_scroll_depth = scroll_depth_percent
            
            # Detect scroll-back (reading previous content - engagement signal)
            if scroll_direction == "up" and len(session.scroll_events) > 1:
                prev_event = session.scroll_events[-2]
                if prev_event.scroll_direction == "down":
                    session.scroll_backs_count += 1
            
            # Emit event for very deep scrolls (engagement signal)
            if scroll_depth_percent > 80 and session.max_scroll_depth < 80:
                await track_event(
                    event_type=EventType.SCROLL,
                    session_id=session_id,
                    funnel_id=funnel_id,
                    user_id=user_id,
                    payload={
                        "scroll_depth": scroll_depth_percent,
                        "signal": "deep_scroll",
                    },
                    priority=EventPriority.LOW,
                )
    
    async def track_hesitation(
        self,
        session_id: str,
        funnel_id: int,
        question_id: int,
        hover_duration_ms: int,
        element_type: str = "question",
        user_id: Optional[int] = None,
    ) -> None:
        """
        Track hover/hesitation behavior on questions or answers
        
        Args:
            session_id: Session identifier
            funnel_id: Funnel ID
            question_id: Question being hovered
            hover_duration_ms: How long user hovered
            element_type: 'question' or 'answer'
            user_id: User ID if authenticated
        """
        async with self._lock:
            session = self._get_or_create_session(session_id, funnel_id, user_id)
            
            hover_event = HoverEvent(
                timestamp=datetime.now(timezone.utc),
                element_type=element_type,
                element_id=f"q_{question_id}",
                duration_ms=hover_duration_ms,
                question_id=question_id,
            )
            
            session.hover_events.append(hover_event)
            session.total_hover_time_ms += hover_duration_ms
            
            # Track per-question hover time
            if question_id not in session.question_hover_times:
                session.question_hover_times[question_id] = 0
            session.question_hover_times[question_id] += hover_duration_ms
            
            # Emit hesitation event if threshold exceeded
            if hover_duration_ms > self.hesitation_threshold:
                session.hesitation_score += 0.1  # Increment hesitation score
                
                await track_event(
                    event_type=EventType.HESITATION,
                    session_id=session_id,
                    funnel_id=funnel_id,
                    user_id=user_id,
                    question_id=question_id,
                    payload={
                        "hover_duration_ms": hover_duration_ms,
                        "element_type": element_type,
                        "hesitation_score": session.hesitation_score,
                    },
                    priority=EventPriority.MEDIUM,
                )
    
    async def track_answer_change(
        self,
        session_id: str,
        funnel_id: int,
        question_id: int,
        previous_answer: Any,
        new_answer: Any,
        user_id: Optional[int] = None,
    ) -> None:
        """
        Track when user changes their answer (indecision signal)
        
        Args:
            session_id: Session identifier
            funnel_id: Funnel ID
            question_id: Question where answer changed
            previous_answer: Previous answer value
            new_answer: New answer value
            user_id: User ID if authenticated
        """
        async with self._lock:
            session = self._get_or_create_session(session_id, funnel_id, user_id)
            
            # Count changes per question
            change_count = len(session.answer_changes[question_id]) + 1
            
            change_event = AnswerChangeEvent(
                timestamp=datetime.now(timezone.utc),
                question_id=question_id,
                previous_answer=previous_answer,
                new_answer=new_answer,
                change_count=change_count,
            )
            
            session.answer_changes[question_id].append(change_event)
            
            # Excessive changes indicate uncertainty/confusion
            if change_count >= 3:
                session.hesitation_score += 0.2
                
                await track_event(
                    event_type=EventType.HESITATION,
                    session_id=session_id,
                    funnel_id=funnel_id,
                    user_id=user_id,
                    question_id=question_id,
                    payload={
                        "signal": "excessive_answer_changes",
                        "change_count": change_count,
                        "previous_answer": str(previous_answer),
                        "new_answer": str(new_answer),
                    },
                    priority=EventPriority.HIGH,
                )
    
    async def track_question_view(
        self,
        session_id: str,
        funnel_id: int,
        question_id: int,
        user_id: Optional[int] = None,
    ) -> None:
        """
        Track question view/revisit
        
        Args:
            session_id: Session identifier
            funnel_id: Funnel ID
            question_id: Question being viewed
            user_id: User ID if authenticated
        """
        async with self._lock:
            session = self._get_or_create_session(session_id, funnel_id, user_id)
            
            # Track first view
            if question_id not in session.question_first_view:
                session.question_first_view[question_id] = datetime.now(timezone.utc)
            
            # Increment view count
            session.question_views[question_id] += 1
            
            # Revisit detection (going back to previous questions)
            if session.question_views[question_id] > 1:
                await track_event(
                    event_type=EventType.QUESTION_VIEW,
                    session_id=session_id,
                    funnel_id=funnel_id,
                    user_id=user_id,
                    question_id=question_id,
                    payload={
                        "signal": "question_revisit",
                        "visit_count": session.question_views[question_id],
                    },
                    priority=EventPriority.LOW,
                )
    
    async def track_abandonment(
        self,
        session_id: str,
        funnel_id: int,
        abandonment_type: str,
        current_question_id: Optional[int] = None,
        user_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Track explicit abandonment signal
        
        Args:
            session_id: Session identifier
            funnel_id: Funnel ID
            abandonment_type: Type of abandonment (e.g., 'idle', 'close', 'navigate_away')
            current_question_id: Last question viewed
            user_id: User ID if authenticated
            metadata: Additional context
        """
        async with self._lock:
            session = self._get_or_create_session(session_id, funnel_id, user_id)
            session.abandonment_risk = AbandonmentRisk.CRITICAL
            
            # Emit abandonment event
            await track_event(
                event_type=EventType.FUNNEL_ABANDON,
                session_id=session_id,
                funnel_id=funnel_id,
                user_id=user_id,
                question_id=current_question_id,
                payload={
                    "abandonment_type": abandonment_type,
                    "session_duration_ms": session.get_session_duration_ms(),
                    "questions_viewed": len(session.question_views),
                    "max_scroll_depth": session.max_scroll_depth,
                    "hesitation_score": session.hesitation_score,
                    "metadata": metadata or {},
                },
                priority=EventPriority.HIGH,
            )
            
            # Emit behavioral summary
            await self._emit_session_summary(session)
            
            # Remove from active sessions
            del self._active_sessions[session_id]
    
    async def track_idle_period(
        self,
        session_id: str,
        funnel_id: int,
        idle_start: datetime,
        idle_end: datetime,
        user_id: Optional[int] = None,
    ) -> None:
        """
        Track idle/inactive period (tab hidden, no interaction)
        
        Args:
            session_id: Session identifier
            funnel_id: Funnel ID
            idle_start: When idle period started
            idle_end: When idle period ended
            user_id: User ID if authenticated
        """
        async with self._lock:
            session = self._get_or_create_session(session_id, funnel_id, user_id)
            
            idle_duration = idle_end - idle_start
            idle_ms = int(idle_duration.total_seconds() * 1000)
            
            session.idle_periods.append((idle_start, idle_end))
            session.total_idle_time_ms += idle_ms
            
            # Long idle = abandonment risk
            if idle_ms > self.abandonment_threshold:
                session.abandonment_risk = AbandonmentRisk.HIGH
                
                await track_event(
                    event_type=EventType.IDLE_TIME,
                    session_id=session_id,
                    funnel_id=funnel_id,
                    user_id=user_id,
                    payload={
                        "idle_duration_ms": idle_ms,
                        "signal": "long_idle",
                        "abandonment_risk": session.abandonment_risk.value,
                    },
                    priority=EventPriority.HIGH,
                )
    
    async def track_rage_click(
        self,
        session_id: str,
        funnel_id: int,
        click_count: int,
        element_id: str,
        user_id: Optional[int] = None,
    ) -> None:
        """
        Track rage clicking (frustration signal)
        
        Args:
            session_id: Session identifier
            funnel_id: Funnel ID
            click_count: Number of rapid clicks
            element_id: Element that was rage-clicked
            user_id: User ID if authenticated
        """
        async with self._lock:
            session = self._get_or_create_session(session_id, funnel_id, user_id)
            session.rage_click_count += 1
            
            await track_event(
                event_type=EventType.CLICK,
                session_id=session_id,
                funnel_id=funnel_id,
                user_id=user_id,
                payload={
                    "signal": "rage_click",
                    "click_count": click_count,
                    "element_id": element_id,
                    "total_rage_clicks": session.rage_click_count,
                },
                priority=EventPriority.HIGH,
            )
    
    async def get_session_analysis(
        self, session_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get real-time behavioral analysis for a session
        
        Returns:
            Dictionary with engagement metrics and risk scores
        """
        async with self._lock:
            session = self._active_sessions.get(session_id)
            if not session:
                return None
            
            # Compute engagement level
            engagement_level = self._compute_engagement_level(session)
            session.engagement_level = engagement_level
            
            # Compute abandonment risk
            abandonment_risk = self._compute_abandonment_risk(session)
            session.abandonment_risk = abandonment_risk
            
            return {
                "session_id": session.session_id,
                "funnel_id": session.funnel_id,
                "session_duration_ms": session.get_session_duration_ms(),
                "active_time_ms": session.get_active_time_ms(),
                "engagement_level": engagement_level.value,
                "abandonment_risk": abandonment_risk.value,
                "hesitation_score": round(session.hesitation_score, 2),
                "max_scroll_depth": round(session.max_scroll_depth, 1),
                "questions_viewed": len(session.question_views),
                "question_revisits": sum(
                    1 for count in session.question_views.values() if count > 1
                ),
                "answer_changes": sum(
                    len(changes) for changes in session.answer_changes.values()
                ),
                "scroll_backs": session.scroll_backs_count,
                "rage_clicks": session.rage_click_count,
                "avg_question_hover_ms": round(
                    session.get_average_question_hover_time_ms(), 1
                ),
                "idle_time_ms": session.total_idle_time_ms,
            }
    
    def _compute_engagement_level(
        self, session: SessionBehaviorState
    ) -> EngagementLevel:
        """
        Compute engagement level based on behavioral signals
        
        High engagement indicators:
        - Deep scrolling
        - Moderate hover times
        - Question revisits (shows care)
        - Low rage clicks
        
        Low engagement indicators:
        - Shallow scrolling
        - Very fast progression
        - High idle time
        - Rage clicks
        """
        score = 50  # Start neutral
        
        # Scroll depth
        if session.max_scroll_depth > 80:
            score += 15
        elif session.max_scroll_depth > 50:
            score += 10
        elif session.max_scroll_depth < 20:
            score -= 15
        
        # Scroll backs (engagement)
        score += min(session.scroll_backs_count * 3, 10)
        
        # Hover time (too little or too much is bad)
        avg_hover = session.get_average_question_hover_time_ms()
        if 1000 <= avg_hover <= 8000:
            score += 10
        elif avg_hover > 15000:
            score -= 10  # Excessive hesitation
        
        # Answer changes (moderate is ok, excessive is bad)
        total_changes = sum(len(changes) for changes in session.answer_changes.values())
        if total_changes == 0:
            pass  # Neutral
        elif total_changes <= 2:
            score += 5  # Thoughtful
        else:
            score -= total_changes * 3  # Confused
        
        # Rage clicks
        score -= session.rage_click_count * 10
        
        # Idle time ratio
        if session.get_session_duration_ms() > 0:
            idle_ratio = session.total_idle_time_ms / session.get_session_duration_ms()
            if idle_ratio > 0.5:
                score -= 20
        
        # Map to enum
        if score >= 80:
            return EngagementLevel.VERY_HIGH
        elif score >= 60:
            return EngagementLevel.HIGH
        elif score >= 40:
            return EngagementLevel.MEDIUM
        elif score >= 20:
            return EngagementLevel.LOW
        else:
            return EngagementLevel.VERY_LOW
    
    def _compute_abandonment_risk(
        self, session: SessionBehaviorState
    ) -> AbandonmentRisk:
        """
        Compute abandonment risk based on negative signals
        
        High risk indicators:
        - Long idle time
        - Rage clicks
        - Very shallow scroll
        - No recent activity
        """
        risk_score = 0
        
        # Idle time
        idle_ratio = 0
        if session.get_session_duration_ms() > 0:
            idle_ratio = session.total_idle_time_ms / session.get_session_duration_ms()
        
        if idle_ratio > 0.6:
            risk_score += 40
        elif idle_ratio > 0.4:
            risk_score += 20
        
        # Time since last activity
        time_since_activity = datetime.now(timezone.utc) - session.last_activity
        seconds_since = time_since_activity.total_seconds()
        
        if seconds_since > 120:  # 2 minutes
            risk_score += 30
        elif seconds_since > 60:  # 1 minute
            risk_score += 15
        
        # Shallow scroll
        if session.max_scroll_depth < 10:
            risk_score += 20
        
        # Rage clicks
        risk_score += session.rage_click_count * 15
        
        # Very low engagement
        if session.engagement_level == EngagementLevel.VERY_LOW:
            risk_score += 20
        
        # Map to enum
        if risk_score >= 70:
            return AbandonmentRisk.CRITICAL
        elif risk_score >= 50:
            return AbandonmentRisk.HIGH
        elif risk_score >= 30:
            return AbandonmentRisk.MEDIUM
        elif risk_score >= 10:
            return AbandonmentRisk.LOW
        else:
            return AbandonmentRisk.NONE
    
    async def _emit_session_summary(self, session: SessionBehaviorState) -> None:
        """Emit comprehensive session behavioral summary"""
        analysis = {
            "session_id": session.session_id,
            "funnel_id": session.funnel_id,
            "user_id": session.user_id,
            "session_duration_ms": session.get_session_duration_ms(),
            "active_time_ms": session.get_active_time_ms(),
            "engagement_level": session.engagement_level.value,
            "abandonment_risk": session.abandonment_risk.value,
            "hesitation_score": session.hesitation_score,
            "max_scroll_depth": session.max_scroll_depth,
            "scroll_backs": session.scroll_backs_count,
            "total_hover_time_ms": session.total_hover_time_ms,
            "questions_viewed": len(session.question_views),
            "question_revisits": sum(
                1 for count in session.question_views.values() if count > 1
            ),
            "answer_changes": sum(
                len(changes) for changes in session.answer_changes.values()
            ),
            "rage_clicks": session.rage_click_count,
            "idle_time_ms": session.total_idle_time_ms,
        }
        
        await track_event(
            event_type=EventType.BEHAVIORAL_SUMMARY,
            session_id=session.session_id,
            funnel_id=session.funnel_id,
            user_id=session.user_id,
            payload=analysis,
            priority=EventPriority.MEDIUM,
        )
    
    async def _periodic_cleanup(self):
        """Background task to clean up stale sessions"""
        while self._is_running:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self._cleanup_stale_sessions()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}", exc_info=True)
    
    async def _cleanup_stale_sessions(self):
        """Remove inactive sessions and emit final summaries"""
        now = datetime.now(timezone.utc)
        stale_sessions = []
        
        async with self._lock:
            for session_id, session in list(self._active_sessions.items()):
                time_since_activity = now - session.last_activity
                
                if time_since_activity > self.session_timeout:
                    stale_sessions.append(session)
        
        # Emit summaries for stale sessions
        for session in stale_sessions:
            await self._emit_session_summary(session)
            
            async with self._lock:
                if session.session_id in self._active_sessions:
                    del self._active_sessions[session.session_id]
            
            logger.debug(
                f"Cleaned up stale session: {session.session_id} "
                f"(inactive for {self.session_timeout})"
            )
    
    async def _flush_all_sessions(self):
        """Emit summaries for all active sessions"""
        async with self._lock:
            sessions = list(self._active_sessions.values())
        
        for session in sessions:
            await self._emit_session_summary(session)
        
        logger.info(f"Flushed {len(sessions)} active sessions")
    
    def get_active_session_count(self) -> int:
        """Get count of currently active sessions"""
        return len(self._active_sessions)


# Singleton instance
_behavioral_collector_instance: Optional[BehavioralCollector] = None


async def get_behavioral_collector() -> BehavioralCollector:
    """Get or create singleton behavioral collector"""
    global _behavioral_collector_instance
    
    if _behavioral_collector_instance is None:
        _behavioral_collector_instance = BehavioralCollector(
            session_timeout_minutes=settings.BEHAVIORAL_SESSION_TIMEOUT_MIN,
            cleanup_interval_seconds=settings.BEHAVIORAL_CLEANUP_INTERVAL_SEC,
            abandonment_idle_threshold_ms=settings.ABANDONMENT_IDLE_THRESHOLD_MS,
            hesitation_hover_threshold_ms=settings.HESITATION_HOVER_THRESHOLD_MS,
        )
        await _behavioral_collector_instance.start()
    
    return _behavioral_collector_instance


async def shutdown_behavioral_collector():
    """Shutdown singleton behavioral collector"""
    global _behavioral_collector_instance
    
    if _behavioral_collector_instance:
        await _behavioral_collector_instance.stop()
        _behavioral_collector_instance = None
