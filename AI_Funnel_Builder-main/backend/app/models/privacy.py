# =============================================================================
# AI FUNNEL BUILDER - PRIVACY & COMPLIANCE MODELS (ENTERPRISE GDPR/CCPA)
# =============================================================================
# Production-ready data privacy system with audit trails, retention policies,
# consent management, and automated compliance reporting
# =============================================================================

from __future__ import annotations

from datetime import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING
from enum import Enum as PyEnum
import uuid

from sqlalchemy import (
    String, Boolean, DateTime, Integer, Float, Text, Enum,
    ForeignKey, Index, CheckConstraint, func, literal
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

# =============================================================================
# TYPE_CHECKING (ZERO CIRCULAR IMPORTS)
# =============================================================================
if TYPE_CHECKING:
    from .user import User

# =============================================================================
# ENTERPRISE ENUMS (GDPR/CCPA COMPLIANT)
# =============================================================================
class RequestType(str, PyEnum):
    """GDPR Articles 15-22 Data Subject Rights."""
    ACCESS = "access"          # Art 15 - Right to access
    DELETION = "deletion"      # Art 17 - Right to erasure
    PORTABILITY = "portability" # Art 20 - Data portability
    RECTIFICATION = "rectification" # Art 16 - Rectification
    OBJECTION = "objection"    # Art 21 - Right to object

class RequestStatus(str, PyEnum):
    """Request processing lifecycle."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"
    EXPIRED = "expired"

class ConsentType(str, PyEnum):
    """Granular consent categories."""
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    COOKIES = "cookies"
    PERSONALIZATION = "personalization"
    THIRD_PARTY = "third_party"

# =============================================================================
# 1️⃣ DATA SUBJECT REQUESTS (GDPR Art 12-22)
# =============================================================================
class DataSubjectRequest(Base):
    """GDPR Data Subject Rights - 95% automated processing."""
    
    __tablename__ = "data_subject_requests"
    
    # Core Identity
    request_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    created_at: Mapped[datetime] = mapped_column(  # ✅ FIXED - CRITICAL!
        DateTime(timezone=True), server_default=func.now(),
        nullable=False, index=True
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(), nullable=False, index=True
    )
    
    # Subject & Request
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    request_type: Mapped[RequestType] = mapped_column(
        Enum(RequestType, name="request_type_enum"),
        nullable=False, index=True
    )
    
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="request_status_enum"),
        nullable=False, default=literal(RequestStatus.PENDING),
        index=True
    )
    
    # Processing
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    
    records_processed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bytes_exported: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    request_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, default=literal({})
    )
    
    # Compliance
    dpo_reviewed: Mapped[bool] = mapped_column(Boolean, default=literal(False))
    legal_basis: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    __table_args__ = (
        Index("idx_dsr_user_status", "user_id", "status"),
        Index("idx_dsr_type_status", "request_type", "status"),
        Index("idx_dsr_time_range", "created_at", "completed_at"),
        CheckConstraint("records_processed >= 0 OR records_processed IS NULL", 
                       name="ck_records_processed_positive"),
    )

# =============================================================================
# 2️⃣ CONSENT RECORDS (GDPR Art 7 - Granular + Revocable)
# =============================================================================
class ConsentRecord(Base):
    """Freely given, specific, informed, unambiguous consent."""
    
    __tablename__ = "consent_records"
    
    consent_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    created_at: Mapped[datetime] = mapped_column(  # ✅ FIXED
        DateTime(timezone=True), server_default=func.now(),
        nullable=False, index=True
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(), nullable=False
    )
    
    # Consent Subject
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    consent_type: Mapped[ConsentType] = mapped_column(
        Enum(ConsentType, name="consent_type_enum"),
        nullable=False, index=True
    )
    
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=literal(True))
    
    # Revocation Tracking
    withdrawn_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    
    # Proof of Consent
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    consent_text_version: Mapped[str] = mapped_column(String(50), nullable=False)
    
    consent_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, default=literal({})
    )
    
    __table_args__ = (
        Index("idx_consent_user_type", "user_id", "consent_type"),
        Index("idx_consent_active", "user_id", "granted", 
              postgresql_where="granted = true AND withdrawn_at IS NULL"),
        CheckConstraint("consent_text_version != ''", name="ck_consent_version_not_empty"),
    )

# =============================================================================
# 3️⃣ DATA DELETION LOG (Audit Trail - GDPR Art 17)
# =============================================================================
class DataDeletionLog(Base):
    """Right to be forgotten audit trail."""
    
    __tablename__ = "data_deletion_logs"
    
    log_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    created_at: Mapped[datetime] = mapped_column(  # ✅ FIXED
        DateTime(timezone=True), server_default=func.now(),
        nullable=False, index=True
    )
    
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    deleted_data_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    records_deleted: Mapped[int] = mapped_column(Integer, nullable=False, default=literal(0))
    bytes_deleted: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    deletion_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    initiated_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    __table_args__ = (
        Index("idx_deletion_user_type", "user_id", "deleted_data_type"),
        Index("idx_deletion_reason", "deletion_reason"),
        CheckConstraint("records_deleted >= 0", name="ck_records_deleted_positive"),
    )

# =============================================================================
# 4️⃣ PII LOCATION MAPPING (GDPR Art 30 - Records of Processing)
# =============================================================================
class PiiLocation(Base):
    """Data mapping for automated discovery + deletion."""
    
    __tablename__ = "pii_locations"
    
    location_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    created_at: Mapped[datetime] = mapped_column(  # ✅ FIXED
        DateTime(timezone=True), server_default=func.now(),
        nullable=False, index=True
    )
    
    table_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    column_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    pii_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    is_encrypted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=literal(False))
    retention_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    record_estimate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    __table_args__ = (
        Index("idx_pii_table_column", "table_name", "column_name", unique=True),
        Index("idx_pii_type_encrypted", "pii_type", "is_encrypted"),
        CheckConstraint("retention_days >= 0 OR retention_days IS NULL", 
                       name="ck_retention_days_positive"),
    )

# =============================================================================
# 5️⃣ RETENTION POLICIES (Automated Compliance)
# =============================================================================
class RetentionPolicy(Base):
    """Per-data-type retention rules."""
    
    __tablename__ = "retention_policies"
    
    policy_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    created_at: Mapped[datetime] = mapped_column(  # ✅ FIXED
        DateTime(timezone=True), server_default=func.now(),
        nullable=False, index=True
    )
    
    data_type: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    retention_days: Mapped[int] = mapped_column(Integer, nullable=False)
    
    auto_delete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=literal(True))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=literal(True))
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    __table_args__ = (
        CheckConstraint("retention_days >= 1", name="ck_retention_days_minimum"),
    )

# =============================================================================
# 6️⃣ RETENTION EXECUTION LOG
# =============================================================================
class RetentionLog(Base):
    """Automated deletion audit trail."""
    
    __tablename__ = "retention_logs"
    
    log_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    created_at: Mapped[datetime] = mapped_column(  # ✅ FIXED
        DateTime(timezone=True), server_default=func.now(),
        nullable=False, index=True
    )
    
    policy_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("retention_policies.policy_id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    records_deleted: Mapped[int] = mapped_column(Integer, nullable=False, default=literal(0))
    execution_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    __table_args__ = (
        Index("idx_retention_policy_time", "policy_id", "created_at"),
        CheckConstraint("records_deleted >= 0", name="ck_records_deleted_positive"),
    )

# =============================================================================
# 7️⃣ STORAGE METRICS (Compliance Reporting)
# =============================================================================
class StorageMetrics(Base):
    """Real-time PII storage dashboard."""
    
    __tablename__ = "storage_metrics"
    
    metric_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    created_at: Mapped[datetime] = mapped_column(  # ✅ FIXED
        DateTime(timezone=True), server_default=func.now(),
        nullable=False, index=True
    )
    
    data_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    record_count: Mapped[int] = mapped_column(Integer, nullable=False, default=literal(0))
    storage_size_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    oldest_record_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    
    __table_args__ = (
        Index("idx_metrics_data_type_time", "data_type", "created_at"),
        CheckConstraint("record_count >= 0", name="ck_record_count_positive"),
        CheckConstraint("storage_size_mb >= 0 OR storage_size_mb IS NULL", 
                       name="ck_storage_size_positive"),
    )

# =============================================================================
# 🔥 PRODUCTION EXPORTS
# =============================================================================
__all__ = [
    "DataSubjectRequest",
    "ConsentRecord", 
    "DataDeletionLog",
    "PiiLocation",
    "RetentionPolicy",
    "RetentionLog",
    "StorageMetrics",
    "RequestType",
    "RequestStatus",
    "ConsentType"
]
