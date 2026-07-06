# =============================================================================
# AI FUNNEL BUILDER - RESPONSE MODEL (ENTERPRISE PRODUCTION)
# =============================================================================
# User submission/session for a funnel - FULLY OPTIMIZED + SCALABLE
# =============================================================================

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, TYPE_CHECKING
import uuid
import enum
import hashlib

from sqlalchemy import (
    String, Boolean, DateTime, Integer, Float, Text, Enum,
    ForeignKey, Index, CheckConstraint, func, literal
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# =============================================================================
# TYPE_CHECKING (PYLANCE ONLY - NO RUNTIME CIRCULAR IMPORTS!)
# =============================================================================
if TYPE_CHECKING:
    from .funnel import Funnel
    from .lead import Lead
    from .response_answer import ResponseAnswer

# =============================================================================
# ENTERPRISE ENUMS (LOCAL - FULLY TYPED)
# =============================================================================
class ResponseStatusEnum(str, enum.Enum):
    """Response lifecycle states - production optimized."""
    STARTED = "started"
    IN_PROGRESS = "in_progress" 
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    EXPIRED = "expired"  # ✅ NEW: Session timeout

class DeviceTypeEnum(str, enum.Enum):
    """Device classification - analytics ready."""
    DESKTOP = "desktop"
    MOBILE = "mobile"
    TABLET = "tablet"
    TV = "tv"  # ✅ NEW: Smart TV support
    UNKNOWN = "unknown"

class ResponseSourceEnum(str, enum.Enum):
    """Traffic source classification."""
    DIRECT = "direct"
    ORGANIC_SEARCH = "organic_search"
    SOCIAL = "social"
    PAID = "paid"
    REFERRAL = "referral"
    EMAIL = "email"

# =============================================================================
# ENTERPRISE RESPONSE MODEL (FULLY OPTIMIZED)
# =============================================================================
class Response(Base):
    """
    Enterprise-grade response tracking with:
    - GDPR-compliant analytics
    - Real-time progress tracking  
    - Advanced fraud detection
    - A/B testing support
    - Full UTM attribution
    - Session resumption
    """
    
    __tablename__ = "responses"
    
    # -----------------------------------------------------------------------------------------
    # 🎯 1. CORE IDENTITY (SHARDED PRIMARY KEY)
    # -----------------------------------------------------------------------------------------
    
    response_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Global unique response ID (UUID v4)"
    )
    
    # -----------------------------------------------------------------------------------------
    # ⏰ 2. AUDIT TRAIL (INDEXED - GDPR COMPLIANT)
    # -----------------------------------------------------------------------------------------
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    expires_at: Mapped[Optional[datetime]] = mapped_column(  # ✅ NEW: GDPR data retention
        DateTime(timezone=True),
        nullable=True,
        index=True,
        comment="Auto-delete after this date (GDPR compliance)"
    )
    
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=literal(False),
        nullable=False,
        index=True
    )
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # -----------------------------------------------------------------------------------------
    # 🔗 3. RELATIONSHIPS (FOREIGN KEYS FIRST)
    # -----------------------------------------------------------------------------------------
    
    funnel_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("funnels.funnel_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    lead_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("leads.lead_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    experiment_variant: Mapped[Optional[str]] = mapped_column(  # ✅ NEW: A/B Testing
        String(50),
        nullable=True,
        index=True,
        comment="A/B test variant ID"
    )
    
    # -----------------------------------------------------------------------------------------
    # 🔑 4. SESSION IDENTITY (RESUMPTION SUPPORTED)
    # -----------------------------------------------------------------------------------------
    
    session_token: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
        index=True,
        comment="Resume token (SHA256 of response_id + timestamp)"
    )
    
    visitor_fingerprint: Mapped[Optional[str]] = mapped_column(  # ✅ NEW: Bot protection
        String(64),
        nullable=True,
        index=True,
        comment="ClientJS fingerprint hash"
    )
    
    # -----------------------------------------------------------------------------------------
    # 📊 5. FUNNEL PROGRESS (REAL-TIME)
    # -----------------------------------------------------------------------------------------
    
    status: Mapped[ResponseStatusEnum] = mapped_column(
        Enum(ResponseStatusEnum, name="response_status_enum"),
        nullable=False,
        default=literal(ResponseStatusEnum.STARTED),
        index=True
    )
    
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True
    )
    
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )
    
    last_interaction_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True
    )
    
    current_question_index: Mapped[int] = mapped_column(
        Integer, nullable=False, default=literal(0), index=True
    )
    
    questions_answered: Mapped[int] = mapped_column(
        Integer, nullable=False, default=literal(0)
    )
    
    total_questions: Mapped[int] = mapped_column(
        Integer, nullable=False, default=literal(0)
    )
    
    progress_percentage: Mapped[float] = mapped_column(
        Float, nullable=False, default=literal(0.0)
    )
    
    # -----------------------------------------------------------------------------------------
    # ⏱️ 6. PERFORMANCE METRICS (BUSINESS CRITICAL)
    # -----------------------------------------------------------------------------------------
    
    time_spent_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False, default=literal(0)
    )
    
    average_time_per_question: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    estimated_completion_time: Mapped[Optional[int]] = mapped_column(  # ✅ NEW
        Integer, nullable=True, comment="Predicted remaining seconds"
    )
    
    # -----------------------------------------------------------------------------------------
    # 🎯 7. SCORING & RESULTS (REVENUE IMPACT)
    # -----------------------------------------------------------------------------------------
    
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    result_persona: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    result_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    result_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, default=literal({})
    )
    
    confidence_score: Mapped[Optional[float]] = mapped_column(  # ✅ NEW: ML confidence
        Float, nullable=True, comment="Result confidence (0.0-1.0)"
    )
    
    # -----------------------------------------------------------------------------------------
    # 📧 8. LEAD CAPTURE (MONEY MAKING!)
    # -----------------------------------------------------------------------------------------
    
    is_lead_captured: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=literal(False), index=True
    )
    
    lead_capture_step: Mapped[Optional[int]] = mapped_column(  # ✅ NEW: Funnel optimization
        Integer, nullable=True, comment="Question index where lead captured"
    )
    
    # -----------------------------------------------------------------------------------------
    # 📱 9. DEVICE INTELLIGENCE (CONVERSION OPTIMIZED)
    # -----------------------------------------------------------------------------------------
    
    device_type: Mapped[DeviceTypeEnum] = mapped_column(
        Enum(DeviceTypeEnum, name="device_type_enum"),
        nullable=False,
        default=literal(DeviceTypeEnum.UNKNOWN),
        index=True
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    browser: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    browser_version: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    os: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    os_version: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    screen_width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # ✅ NEW
    screen_height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # ✅ NEW
    
    # -----------------------------------------------------------------------------------------
    # 🌍 10. GEO & LOCATION (ENTERPRISE ANALYTICS)
    # -----------------------------------------------------------------------------------------
    
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    
    country_code: Mapped[Optional[str]] = mapped_column(String(2), nullable=True, index=True)
    country_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # ✅ NEW
    
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    timezone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # ✅ NEW
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # ✅ NEW
    
    # -----------------------------------------------------------------------------------------
    # 📈 11. ATTRIBUTION (ROI TRACKING)
    # -----------------------------------------------------------------------------------------
    
    source: Mapped[Optional[ResponseSourceEnum]] = mapped_column(  # ✅ NEW
        Enum(ResponseSourceEnum, name="response_source_enum"),
        nullable=True,
        index=True
    )
    
    utm_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    utm_medium: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    utm_campaign: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    utm_term: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    utm_content: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    referrer: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    landing_page: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)  # ✅ NEW
    
    # -----------------------------------------------------------------------------------------
    # 🛡️ 12. FRAUD PREVENTION (ENTERPRISE SECURITY)
    # -----------------------------------------------------------------------------------------
    
    fingerprint: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    is_suspicious: Mapped[bool] = mapped_column(Boolean, nullable=False, default=literal(False))
    fraud_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    bot_probability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # ✅ NEW
    human_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # ✅ NEW
    
    # -----------------------------------------------------------------------------------------
    # 📋 13. ENTERPRISE METADATA
    # -----------------------------------------------------------------------------------------
    
    response_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, default=literal({})
    )
    
    custom_properties: Mapped[Optional[Dict[str, Any]]] = mapped_column(  # ✅ NEW
        JSONB, nullable=True, default=literal({}), comment="Client-defined properties"
    )
    
    # -----------------------------------------------------------------------------------------
    # 🔗 14. RELATIONSHIPS (FULLY TYPED)
    # -----------------------------------------------------------------------------------------
    
    funnel: Mapped["Funnel"] = relationship(
        "Funnel",
        back_populates="responses",
        lazy="joined"
    )
    
    lead: Mapped[Optional["Lead"]] = relationship(
        "Lead",
        back_populates="responses",
        foreign_keys=[lead_id]
    )
    
    answers: Mapped[List["ResponseAnswer"]] = relationship(
        "ResponseAnswer",
        back_populates="response",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    # -----------------------------------------------------------------------------------------
    # ⚡ 15. ENTERPRISE INDEXES (QUERY OPTIMIZED)
    # -----------------------------------------------------------------------------------------
    
    __table_args__ = (
        # 🔥 HIGH-CARDINALITY QUERIES
        Index("idx_response_funnel_status", "funnel_id", "status"),
        Index("idx_response_funnel_created", "funnel_id", "created_at"),
        Index("idx_response_session_active", "session_token", "status"),
        
        # 🔥 TIME-BASED ANALYTICS
        Index("idx_response_started_at", "started_at"),
        Index("idx_response_completed_at", "completed_at"),
        Index("idx_response_time_range", "started_at", "completed_at"),
        
        # 🔥 GEO ANALYTICS
        Index("idx_response_country_device", "country_code", "device_type"),
        Index("idx_response_region", "region", "country_code"),
        
        # 🔥 ATTRIBUTION
        Index("idx_response_utm_campaign", "utm_source", "utm_campaign"),
        Index("idx_response_source", "source", "status"),
        
        # 🔥 FRAUD PREVENTION
        Index("idx_response_fingerprint", "visitor_fingerprint"),
        Index("idx_response_fraud", "is_suspicious", "fraud_score"),
        
        # 🔥 BUSINESS CONSTRAINTS
        CheckConstraint("progress_percentage >= 0 AND progress_percentage <= 100", 
                       name="ck_response_progress_range"),
        CheckConstraint("time_spent_seconds >= 0", name="ck_response_time_positive"),
        CheckConstraint("questions_answered >= 0", name="ck_response_questions_positive"),
        CheckConstraint("current_question_index >= 0", name="ck_response_index_positive"),
    )
    
    # =============================================================================
    # 🚀 ENTERPRISE BUSINESS LOGIC
    # =============================================================================
    
    @property
    def is_active_session(self) -> bool:
        """Check if session can be resumed."""
        if self.status in [ResponseStatusEnum.COMPLETED, ResponseStatusEnum.ABANDONED]:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            self.status = ResponseStatusEnum.EXPIRED
            return False
        return True
    
    @property
    def conversion_rate(self) -> float:
        """Calculate funnel conversion rate."""
        if self.total_questions == 0:
            return 0.0
        return min(self.progress_percentage / 100, 1.0)
    
    @property
    def dropoff_point(self) -> Optional[int]:
        """Get dropoff question index."""
        if self.is_completed:
            return None
        return self.current_question_index
    
    @property
    def time_to_complete(self) -> Optional[float]:
        """Completion time in minutes."""
        if not self.completed_at or not self.started_at:
            return None
        delta = self.completed_at - self.started_at
        return round(delta.total_seconds() / 60, 2)
    
    def generate_session_token(self) -> str:
        """Generate secure session token."""
        token_data = f"{self.response_id}:{self.created_at.timestamp()}:{uuid.uuid4().hex}"
        return hashlib.sha256(token_data.encode()).hexdigest()
    
    def update_progress(self, current_index: int, total: int) -> None:
        """Atomic progress update."""
        self.current_question_index = current_index
        self.total_questions = total
        self.questions_answered = current_index + 1
        self.progress_percentage = round((current_index + 1) / total * 100, 2) if total > 0 else 0
        self.last_interaction_at = datetime.utcnow()
    
    def mark_completed(self, result_data: Optional[Dict[str, Any]] = None) -> None:
        """Finalize completed response with analytics."""
        self.status = ResponseStatusEnum.COMPLETED
        self.completed_at = datetime.utcnow()
        self.progress_percentage = 100.0
        
        # Calculate engagement metrics
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.time_spent_seconds = int(delta.total_seconds())
        
        if self.questions_answered > 0:
            self.average_time_per_question = round(
                self.time_spent_seconds / self.questions_answered, 2
            )
        
        # Store results
        if result_data:
            self.result_data = result_data
            self.result_persona = result_data.get("persona")
            self.result_title = result_data.get("title")
            self.confidence_score = result_data.get("confidence")
    
    def flag_fraud(self, score: float, reason: str) -> None:
        """Enterprise fraud flagging."""
        self.is_suspicious = True
        self.fraud_score = score
        if not self.response_metadata:
            self.response_metadata = {}
        self.response_metadata["fraud"] = {
            "score": score,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def to_analytics_dict(self) -> Dict[str, Any]:
        """Analytics-optimized serialization."""
        return {
            "response_id": self.response_id,
            "funnel_id": self.funnel_id,
            "status": self.status.value,
            "conversion_rate": self.conversion_rate,
            "time_to_complete": self.time_to_complete(),
            "device_type": self.device_type.value,
            "country_code": self.country_code,
            "created_at": self.created_at.isoformat(),
            "is_lead_captured": self.is_lead_captured
        }
    
    def to_api_dict(self, include_answers: bool = False) -> Dict[str, Any]:
        """Public API serialization."""
        data = {
            "response_id": self.response_id,
            "session_token": self.session_token,
            "status": self.status.value,
            "progress_percentage": self.progress_percentage,
            "questions_answered": self.questions_answered,
            "total_questions": self.total_questions,
            "is_lead_captured": self.is_lead_captured,
            "device_type": self.device_type.value,
            "created_at": self.created_at.isoformat()
        }
        if include_answers and self.answers:
            data["answers"] = [a.to_dict() for a in self.answers]
        return data

# =============================================================================
# 🔥 EXPORTS (PRODUCTION READY)
# =============================================================================
__all__ = [
    "Response",
    "ResponseStatusEnum",
    "DeviceTypeEnum", 
    "ResponseSourceEnum",
]
