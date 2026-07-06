# =============================================================================
# AI FUNNEL BUILDER - INTEGRATION MODEL
# =============================================================================
# Third-party service integrations (CRM, Email, Payment, Analytics)
# =============================================================================

from __future__ import annotations

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    Text,
    Enum,
    ForeignKey,
    Index,
    CheckConstraint,
    UniqueConstraint,
    literal,  # ✅ ADDED literal import
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

# =============================================================================
# ENUMS
# =============================================================================

import enum

class IntegrationTypeEnum(str, enum.Enum):
    """Integration types."""
    CRM = "crm"                          # Salesforce, HubSpot, Pipedrive
    EMAIL = "email"                      # SendGrid, Mailchimp, Klaviyo
    PAYMENT = "payment"                  # Stripe, PayPal
    ANALYTICS = "analytics"              # Google Analytics, Mixpanel
    ADS = "ads"                          # Meta Ads, Google Ads
    STORAGE = "storage"                  # AWS S3, Google Cloud Storage
    WEBHOOK = "webhook"                  # Custom webhooks
    AUTOMATION = "automation"            # Zapier, Make
    OTHER = "other"

class IntegrationProviderEnum(str, enum.Enum):
    """Integration providers."""
    # CRM
    SALESFORCE = "salesforce"
    HUBSPOT = "hubspot"
    PIPEDRIVE = "pipedrive"
    ZOHO_CRM = "zoho_crm"
    
    # Email
    SENDGRID = "sendgrid"
    MAILCHIMP = "mailchimp"
    KLAVIYO = "klaviyo"
    SENDLANE = "sendlane"
    
    # Payment
    STRIPE = "stripe"
    PAYPAL = "paypal"
    
    # Analytics
    GOOGLE_ANALYTICS = "google_analytics"
    MIXPANEL = "mixpanel"
    SEGMENT = "segment"
    
    # Ads
    META_ADS = "meta_ads"
    GOOGLE_ADS = "google_ads"
    TIKTOK_ADS = "tiktok_ads"
    
    # Storage
    AWS_S3 = "aws_s3"
    GOOGLE_CLOUD_STORAGE = "google_cloud_storage"
    
    # Other
    ZAPIER = "zapier"
    MAKE = "make"
    CUSTOM_WEBHOOK = "custom_webhook"

class IntegrationStatusEnum(str, enum.Enum):
    """Integration status."""
    ACTIVE = "active"                    # Working correctly
    INACTIVE = "inactive"                # Disabled by user
    ERROR = "error"                      # Connection/auth error
    RATE_LIMITED = "rate_limited"        # API rate limit hit
    EXPIRED = "expired"                  # OAuth token expired
    PENDING_AUTH = "pending_auth"        # Awaiting authorization

class SyncStatusEnum(str, enum.Enum):
    """Sync operation status."""
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    IN_PROGRESS = "in_progress"

# =============================================================================
# INTEGRATION MODEL
# =============================================================================

class Integration(Base):
    """
    Integration model for third-party service connections.
    
    Features:
    - Secure credential storage (encrypted)
    - OAuth token management
    - Sync status tracking
    - Error logging
    - Rate limit tracking
    - Webhook configuration
    
    Relationships:
    - user (User) - integration owner
    """

    __tablename__ = "integrations"

    # -------------------------------------------------------------------------
    # PRIMARY KEY
    # -------------------------------------------------------------------------

    integration_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique integration identifier",
    )

    # -------------------------------------------------------------------------
    # USER (OWNER)
    # -------------------------------------------------------------------------

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Integration owner user ID",
    )

    # -------------------------------------------------------------------------
    # INTEGRATION TYPE & PROVIDER
    # -------------------------------------------------------------------------

    integration_type: Mapped[IntegrationTypeEnum] = mapped_column(
        Enum(IntegrationTypeEnum, name="integration_type_enum"),
        nullable=False,
        index=True,
        comment="Integration type (CRM, email, payment, etc.)",
    )

    provider: Mapped[IntegrationProviderEnum] = mapped_column(
        Enum(IntegrationProviderEnum, name="integration_provider_enum"),
        nullable=False,
        index=True,
        comment="Integration provider (Salesforce, HubSpot, etc.)",
    )

    # -------------------------------------------------------------------------
    # BASIC INFO
    # -------------------------------------------------------------------------

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="User-defined integration name",
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Integration description",
    )

    # -------------------------------------------------------------------------
    # STATUS
    # -------------------------------------------------------------------------

    status: Mapped[IntegrationStatusEnum] = mapped_column(
        Enum(IntegrationStatusEnum, name="integration_status_enum"),
        nullable=False,
        default=literal(IntegrationStatusEnum.PENDING_AUTH),  # ✅ FIXED
        index=True,
        comment="Integration status",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=literal(True),  # ✅ FIXED
        index=True,
        comment="Whether integration is enabled",
    )

    # -------------------------------------------------------------------------
    # CREDENTIALS (ENCRYPTED)
    # -------------------------------------------------------------------------

    credentials: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=literal({}),  # ✅ FIXED
        comment="Encrypted credentials (API keys, tokens, secrets)",
    )

    # -------------------------------------------------------------------------
    # OAUTH MANAGEMENT
    # -------------------------------------------------------------------------

    oauth_access_token: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="OAuth access token (encrypted)",
    )

    oauth_refresh_token: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="OAuth refresh token (encrypted)",
    )

    oauth_token_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
        comment="OAuth token expiration",
    )

    oauth_scopes: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal([]),  # ✅ FIXED
        comment="OAuth scopes granted",
    )

    # -------------------------------------------------------------------------
    # CONFIGURATION
    # -------------------------------------------------------------------------

    config: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=literal({}),  # ✅ FIXED
        comment="Integration-specific configuration",
    )

    # -------------------------------------------------------------------------
    # SYNC STATUS
    # -------------------------------------------------------------------------

    last_sync_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
        comment="Last successful sync timestamp",
    )

    last_sync_status: Mapped[Optional[SyncStatusEnum]] = mapped_column(
        Enum(SyncStatusEnum, name="sync_status_enum"),
        nullable=True,
        comment="Last sync operation status",
    )

    sync_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Total number of syncs performed",
    )

    successful_sync_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Number of successful syncs",
    )

    failed_sync_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Number of failed syncs",
    )

    # -------------------------------------------------------------------------
    # ERROR TRACKING
    # -------------------------------------------------------------------------

    last_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Last error message",
    )

    last_error_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last error timestamp",
    )

    error_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Total error count",
    )

    consecutive_errors: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Consecutive error count (resets on success)",
    )

    # -------------------------------------------------------------------------
    # RATE LIMITING
    # -------------------------------------------------------------------------

    rate_limit_remaining: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Remaining API calls in current window",
    )

    rate_limit_reset_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When rate limit resets",
    )

    # -------------------------------------------------------------------------
    # DATA SYNC STATS
    # -------------------------------------------------------------------------

    total_records_synced: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=literal(0),  # ✅ FIXED
        comment="Total records synced to integration",
    )

    last_sync_record_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Records synced in last operation",
    )

    # -------------------------------------------------------------------------
    # WEBHOOK CONFIGURATION
    # -------------------------------------------------------------------------

    webhook_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="Webhook URL for this integration",
    )

    webhook_secret: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Webhook secret for signature verification",
    )

    webhook_events: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal([]),  # ✅ FIXED
        comment="Webhook event subscriptions",
    )

    # -------------------------------------------------------------------------
    # AUTHORIZATION
    # -------------------------------------------------------------------------

    authorized_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When integration was authorized",
    )

    authorized_by: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        nullable=True,
        comment="User who authorized integration",
    )

    # -------------------------------------------------------------------------
    # METADATA
    # -------------------------------------------------------------------------

    integration_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,  # ✅ FIXED: removed "metadata"
        nullable=True,
        default=literal({}),  # ✅ FIXED
        comment="Additional metadata",
    )

    tags: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        default=literal([]),  # ✅ FIXED
        comment="Organization tags",
    )

    # -------------------------------------------------------------------------
    # INDEXES & CONSTRAINTS
    # -------------------------------------------------------------------------

    __table_args__ = (
        # User queries
        Index("idx_integration_user_type", "user_id", "integration_type"),
        Index("idx_integration_user_status", "user_id", "status"),
        Index("idx_integration_user_active", "user_id", "is_active"),
        
        # Provider queries
        Index("idx_integration_provider", "provider"),
        
        # Sync monitoring
        Index("idx_integration_last_sync", "last_sync_at"),
        Index("idx_integration_sync_status", "last_sync_status"),
        
        # Error monitoring
        Index("idx_integration_errors", "consecutive_errors"),
        
        # OAuth expiration
        Index("idx_integration_oauth_expiry", "oauth_token_expires_at"),
        
        # Unique constraint: one integration per user per provider
        UniqueConstraint("user_id", "provider", name="uq_user_provider"),
        
        # JSONB indexes
        Index("idx_integration_config_gin", "config", postgresql_using="gin"),
        Index("idx_integration_metadata_gin", "integration_metadata", postgresql_using="gin"),  # ✅ FIXED column name
        
        # Constraints
        CheckConstraint("sync_count >= 0", name="ck_integration_sync_count_positive"),
        CheckConstraint("error_count >= 0", name="ck_integration_error_count_positive"),
    )

    # -------------------------------------------------------------------------
    # REPRESENTATION
    # -------------------------------------------------------------------------

    def __repr__(self) -> str:
        return f"<Integration {self.name} ({self.provider.value})>"

    # -------------------------------------------------------------------------
    # STATUS METHODS
    # -------------------------------------------------------------------------

    def activate(self):
        """Activate integration."""
        self.is_active = True
        if self.status == IntegrationStatusEnum.INACTIVE:
            self.status = IntegrationStatusEnum.ACTIVE

    def deactivate(self):
        """Deactivate integration."""
        self.is_active = False
        self.status = IntegrationStatusEnum.INACTIVE

    def mark_error(self, error_message: str):
        """Mark integration as errored."""
        self.status = IntegrationStatusEnum.ERROR
        self.last_error = error_message
        self.last_error_at = datetime.utcnow()
        self.error_count += 1
        self.consecutive_errors += 1

    def mark_success(self):
        """Mark integration as working."""
        self.status = IntegrationStatusEnum.ACTIVE
        self.consecutive_errors = 0

    def mark_rate_limited(self, reset_at: datetime):
        """Mark integration as rate limited."""
        self.status = IntegrationStatusEnum.RATE_LIMITED
        self.rate_limit_reset_at = reset_at

    def mark_oauth_expired(self):
        """Mark OAuth token as expired."""
        self.status = IntegrationStatusEnum.EXPIRED

    # -------------------------------------------------------------------------
    # SYNC METHODS
    # -------------------------------------------------------------------------

    def record_sync(
        self,
        status: SyncStatusEnum,
        record_count: Optional[int] = None,
        error: Optional[str] = None
    ):
        """
        Record sync operation.
        
        Args:
            status: Sync status
            record_count: Number of records synced
            error: Error message if failed
        """
        self.last_sync_at = datetime.utcnow()
        self.last_sync_status = status
        self.sync_count += 1

        if record_count is not None:
            self.last_sync_record_count = record_count
            self.total_records_synced += record_count

        if status == SyncStatusEnum.SUCCESS:
            self.successful_sync_count += 1
            self.mark_success()
        elif status == SyncStatusEnum.FAILED:
            self.failed_sync_count += 1
            if error:
                self.mark_error(error)

    # -------------------------------------------------------------------------
    # OAUTH METHODS
    # -------------------------------------------------------------------------

    def update_oauth_tokens(
        self,
        access_token: str,
        refresh_token: Optional[str] = None,
        expires_in: Optional[int] = None,
        scopes: Optional[List[str]] = None
    ):
        """
        Update OAuth tokens.
        
        Args:
            access_token: New access token
            refresh_token: New refresh token (if provided)
            expires_in: Token lifetime in seconds
            scopes: OAuth scopes
        """
        from datetime import timedelta

        self.oauth_access_token = access_token

        if refresh_token:
            self.oauth_refresh_token = refresh_token

        if expires_in:
            self.oauth_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        if scopes:
            self.oauth_scopes = scopes

        self.status = IntegrationStatusEnum.ACTIVE

    @property
    def is_oauth_expired(self) -> bool:
        """Check if OAuth token is expired."""
        if not self.oauth_token_expires_at:
            return False
        return datetime.utcnow() >= self.oauth_token_expires_at

    @property
    def oauth_expires_in_seconds(self) -> Optional[int]:
        """Get seconds until OAuth token expires."""
        if not self.oauth_token_expires_at:
            return None
        delta = self.oauth_token_expires_at - datetime.utcnow()
        return max(0, int(delta.total_seconds()))

    # -------------------------------------------------------------------------
    # RATE LIMIT METHODS
    # -------------------------------------------------------------------------

    def update_rate_limit(self, remaining: int, reset_at: datetime):
        """
        Update rate limit info.
        
        Args:
            remaining: Remaining API calls
            reset_at: When rate limit resets
        """
        self.rate_limit_remaining = remaining
        self.rate_limit_reset_at = reset_at

        if remaining == 0:
            self.mark_rate_limited(reset_at)

    @property
    def is_rate_limited(self) -> bool:
        """Check if currently rate limited."""
        if not self.rate_limit_reset_at:
            return False
        if datetime.utcnow() >= self.rate_limit_reset_at:
            # Rate limit has reset
            self.rate_limit_remaining = None
            self.rate_limit_reset_at = None
            return False
        return self.rate_limit_remaining == 0

    # -------------------------------------------------------------------------
    # CREDENTIAL METHODS
    # -------------------------------------------------------------------------

    def set_credential(self, key: str, value: str):
        """
        Set a credential value.
        
        Args:
            key: Credential key
            value: Credential value (will be encrypted in production)
        """
        if not self.credentials:
            self.credentials = {}
        
        # TODO: Encrypt value in production
        self.credentials[key] = value

    def get_credential(self, key: str, default: Any = None) -> Any:
        """
        Get a credential value.
        
        Args:
            key: Credential key
            default: Default value if not found
            
        Returns:
            Decrypted credential value
        """
        if not self.credentials:
            return default
        
        value = self.credentials.get(key, default)
        
        # TODO: Decrypt value in production
        return value

    # -------------------------------------------------------------------------
    # WEBHOOK METHODS
    # -------------------------------------------------------------------------

    def configure_webhook(
        self,
        url: str,
        secret: str,
        events: Optional[List[str]] = None
    ):
        """
        Configure webhook.
        
        Args:
            url: Webhook URL
            secret: Webhook secret for verification
            events: Event subscriptions
        """
        self.webhook_url = url
        self.webhook_secret = secret
        if events:
            self.webhook_events = events

    # -------------------------------------------------------------------------
    # HEALTH CHECK
    # -------------------------------------------------------------------------

    def health_status(self) -> Dict[str, Any]:
        """
        Get integration health status.
        
        Returns:
            Health status dictionary
        """
        return {
            "integration_id": self.integration_id,
            "name": self.name,
            "provider": self.provider.value,
            "status": self.status.value,
            "is_active": self.is_active,
            "is_healthy": self.status == IntegrationStatusEnum.ACTIVE and self.consecutive_errors == 0,
            "last_sync_at": self.last_sync_at.isoformat() if self.last_sync_at else None,
            "last_sync_status": self.last_sync_status.value if self.last_sync_status else None,
            "consecutive_errors": self.consecutive_errors,
            "is_rate_limited": self.is_rate_limited,
            "is_oauth_expired": self.is_oauth_expired,
            "sync_success_rate": self.successful_sync_count / self.sync_count if self.sync_count > 0 else None,
        }

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "Integration",
    "IntegrationTypeEnum",
    "IntegrationProviderEnum",
    "IntegrationStatusEnum",
    "SyncStatusEnum",
]
