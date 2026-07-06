# =============================================================================
# AI FUNNEL BUILDER - USER MODEL (ENHANCED WITH PROJECTS)
# =============================================================================

from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional, List, Any, Dict
import uuid
import enum

from sqlalchemy import (
    String, Boolean, DateTime, Integer, Text, Enum, Index, CheckConstraint, 
    func, literal, ForeignKey, text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, validates, relationship

from app.core.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .project import Project
    from .funnel import Funnel
    from .event import Event


# =============================================================================
# ENUMS (LOCAL - NO IMPORTS)
# =============================================================================

class UserTypeEnum(str, enum.Enum):
    """User account types."""
    CREATOR = "creator"
    BRAND = "brand" 
    ADMIN = "admin"


class SubscriptionTierEnum(str, enum.Enum):
    """Subscription tiers."""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"
    BRAND_STARTER = "brand_starter"
    BRAND_PREMIUM = "brand_premium"


class OAuthProviderEnum(str, enum.Enum):
    """OAuth authentication providers."""
    GOOGLE = "google"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"


# =============================================================================
# USER MODEL (ENHANCED WITH PROJECTS RELATIONSHIP)
# =============================================================================

class User(Base):
    """
    User model for authentication and profile management.
    
    **NEW: Supports Project → Group → Funnel hierarchy**
    **FIXED: Relationships now support eager loading**
    """
    
    __tablename__ = "users"
    
    # -------------------------------------------------------------------------
    # INLINE PRIMARY KEY + TIMESTAMPS + SOFT DELETE (NO MIXINS!)
    # -------------------------------------------------------------------------
    
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique user identifier (UUID v4)"
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="Account creation timestamp"
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Last update timestamp"
    )
    
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=literal(False),
        nullable=False,
        index=True,
        comment="Soft delete flag"
    )
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Soft deletion timestamp"
    )
    
    # -------------------------------------------------------------------------
    # SECURITY / LOCKING
    # -------------------------------------------------------------------------
    
    is_locked: Mapped[bool] = mapped_column(
        Boolean, 
        default=literal(False), 
        nullable=False,
        comment="Account lock status"
    )
    
    locked_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True,
        comment="Account lock expiration"
    )
    
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer, 
        default=literal(0), 
        nullable=False,
        comment="Failed login counter for rate limiting"
    )

    # -------------------------------------------------------------------------
    # AUTHENTICATION
    # -------------------------------------------------------------------------
    
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="User's email address (unique)"
    )
    
    password_hash: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Bcrypt password hash (null for OAuth users)"
    )
    
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=literal(False),
        comment="Email verification status"
    )
    
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Email verification timestamp"
    )
    
    email_verification_token: Mapped[Optional[str]] = mapped_column(
        String(255), 
        nullable=True,
        comment="Email verification token"
    )
    
    email_verification_token_expires: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True,
        comment="Token expiration time"
    )
    
    registration_ip: Mapped[Optional[str]] = mapped_column(
        String(45), 
        nullable=True,
        comment="IP address at registration (IPv4/IPv6)"
    )
    
    # OAuth fields
    oauth_provider: Mapped[Optional[OAuthProviderEnum]] = mapped_column(
        Enum(OAuthProviderEnum, name="oauth_provider_enum"),
        nullable=True,
        comment="OAuth provider (Google, Facebook, etc.)"
    )
    
    oauth_provider_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Provider-specific user ID"
    )
    
    # -------------------------------------------------------------------------
    # PROFILE
    # -------------------------------------------------------------------------
    
    full_name: Mapped[Optional[str]] = mapped_column(
        String(255), 
        nullable=True,
        comment="User's full name"
    )
    
    display_name: Mapped[Optional[str]] = mapped_column(
        String(100), 
        nullable=True,
        comment="Public display name"
    )
    
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500), 
        nullable=True,
        comment="Profile picture URL"
    )
    
    bio: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="User biography"
    )
    
    website: Mapped[Optional[str]] = mapped_column(
        String(255), 
        nullable=True,
        comment="Personal/company website"
    )
    
    # -------------------------------------------------------------------------
    # ACCOUNT TYPE & SUBSCRIPTION
    # -------------------------------------------------------------------------
    
    user_type: Mapped[UserTypeEnum] = mapped_column(
        Enum("creator", "brand", "admin", name="user_type_enum", native_enum=False, validate_strings=False),
        nullable=False,
        default="creator",
        index=True,
        comment="User account type"
    )
    
    subscription_tier: Mapped[SubscriptionTierEnum] = mapped_column(
        Enum("free", "pro", "enterprise", "brand_starter", "brand_premium", name="subscription_tier_enum", native_enum=False, validate_strings=False),
        nullable=False,
        default="free",
        index=True,
        comment="Current subscription tier"
    )
    
    subscription_started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True,
        comment="Subscription start date"
    )
    
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True,
        comment="Subscription expiration date"
    )
    
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(100), 
        nullable=True, 
        unique=True, 
        index=True,
        comment="Stripe customer ID for billing"
    )
    
    # -------------------------------------------------------------------------
    # BUSINESS INFO
    # -------------------------------------------------------------------------
    
    company_name: Mapped[Optional[str]] = mapped_column(
        String(255), 
        nullable=True,
        comment="Company/brand name"
    )
    
    company_size: Mapped[Optional[str]] = mapped_column(
        String(50), 
        nullable=True,
        comment="Company size category"
    )
    
    industry: Mapped[Optional[str]] = mapped_column(
        String(100), 
        nullable=True,
        comment="Business industry"
    )
    
    # -------------------------------------------------------------------------
    # ACCOUNT STATUS
    # -------------------------------------------------------------------------
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=literal(True),
        index=True,
        comment="Account active status"
    )
    
    is_banned: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=literal(False),
        comment="Ban status"
    )
    
    banned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True,
        comment="Ban timestamp"
    )
    
    ban_reason: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="Reason for ban"
    )
    
    # -------------------------------------------------------------------------
    # ACTIVITY TRACKING
    # -------------------------------------------------------------------------
    
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True,
        index=True,
        comment="Last successful login"
    )
    
    login_count: Mapped[int] = mapped_column(
        Integer, 
        nullable=False, 
        default=literal(0),
        comment="Total login count"
    )
    
    last_active_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True,
        index=True,
        comment="Last activity timestamp"
    )
    
    # -------------------------------------------------------------------------
    # SETTINGS & METADATA
    # -------------------------------------------------------------------------
    
    settings: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        server_default=text("'{}'::jsonb"),
        default=dict,
        comment="User preferences and settings"
    )
    
    user_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        server_default=text("'{}'::jsonb"),
        default=dict,
        comment="Additional metadata"
    )
    
    # -------------------------------------------------------------------------
    # REFERRAL & MARKETING
    # -------------------------------------------------------------------------
    
    referral_code: Mapped[Optional[str]] = mapped_column(
        String(20), 
        unique=True, 
        nullable=True, 
        index=True,
        comment="Unique referral code"
    )
    
    referred_by: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), 
        nullable=True,
        comment="User ID who referred this user"
    )
    
    utm_source: Mapped[Optional[str]] = mapped_column(
        String(100), 
        nullable=True,
        comment="UTM source for attribution"
    )
    
    utm_campaign: Mapped[Optional[str]] = mapped_column(
        String(100), 
        nullable=True,
        comment="UTM campaign for attribution"
    )
    
    # -------------------------------------------------------------------------
    # RELATIONSHIPS (✅ FIXED - NOW SUPPORTS EAGER LOADING)
    # -------------------------------------------------------------------------
    
    # ✅ FIXED: Projects relationship (supports eager loading)
    projects: Mapped[List["Project"]] = relationship(
        "Project",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",  # ✅ Changed from "dynamic" to "select"
        order_by="Project.created_at.desc()",
        foreign_keys="[Project.user_id]",
        primaryjoin="User.user_id == Project.user_id"
    )
    
    # ✅ DUAL APPROACH: Keep both standard and dynamic for flexibility
    # Standard relationship for eager loading (use this for most queries)
    funnels: Mapped[List["Funnel"]] = relationship(
        "Funnel",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="select",  # ✅ Changed from "dynamic" to "select"
        order_by="Funnel.created_at.desc()",
        foreign_keys="[Funnel.user_id]",
        viewonly=True  # Read-only to avoid conflicts with funnels_query
    )
    
    # Dynamic relationship for complex queries (use when you need filtering)
    funnels_query: Mapped[List["Funnel"]] = relationship(
        "Funnel",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="dynamic",  # Dynamic for query building
        order_by="Funnel.created_at.desc()",
        foreign_keys="[Funnel.user_id]",
        overlaps="funnels"  # Tell SQLAlchemy these overlap intentionally
    )
    
    # ✅ FIXED: Events relationship (supports eager loading)
    events: Mapped[List["Event"]] = relationship(
        "Event",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",  # ✅ Changed from "dynamic" to "select"
        order_by="Event.created_at.desc()"
    )
    
    # -------------------------------------------------------------------------
    # INDEXES & CONSTRAINTS
    # -------------------------------------------------------------------------
    
    __table_args__ = (
        Index("idx_oauth_provider_id", "oauth_provider", "oauth_provider_id"),
        Index("idx_subscription_tier_active", "subscription_tier", "is_active"),
        Index("idx_referred_by", "referred_by"),
        Index("idx_user_type_active", "user_type", "is_active"),
        Index("idx_last_login", "last_login"),
        CheckConstraint(
            "email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'",
            name="valid_email_format"
        ),
    )
    
    # -------------------------------------------------------------------------
    # VALIDATORS
    # -------------------------------------------------------------------------
    
    @validates("email")
    def validate_email(self, key: str, email: str) -> str:
        """Normalize email to lowercase."""
        if email:
            return email.lower().strip()
        return email
    
    @validates("website")
    def validate_website(self, key: str, website: str) -> Optional[str]:
        """Add https:// prefix if missing."""
        if website and not website.startswith(("http://", "https://")):
            return f"https://{website}"
        return website
    
    @validates("display_name", "full_name")
    def validate_names(self, key: str, value: str) -> Optional[str]:
        """Strip whitespace from names."""
        if value:
            return value.strip()
        return value
    
    # -------------------------------------------------------------------------
    # BUSINESS METHODS
    # -------------------------------------------------------------------------
    
    @property
    def is_creator(self) -> bool:
        """Check if user is a creator."""
        return self.user_type == UserTypeEnum.CREATOR
    
    @property
    def is_brand(self) -> bool:
        """Check if user is a brand account."""
        return self.user_type == UserTypeEnum.BRAND
    
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.user_type == UserTypeEnum.ADMIN
    
    @property
    def is_paid_user(self) -> bool:
        """Check if user has a paid subscription."""
        return self.subscription_tier != SubscriptionTierEnum.FREE
    
    @property
    def is_subscription_active(self) -> bool:
        """Check if subscription is currently active."""
        if not self.subscription_expires_at:
            return self.subscription_tier == SubscriptionTierEnum.FREE
        return datetime.utcnow() < self.subscription_expires_at
    
    @property
    def active_projects_count(self) -> int:
        """
        Get count of active projects.
        ✅ FIXED: Works with both lazy='select' and denormalized counts.
        """
        if hasattr(self, '_active_projects_count'):
            return self._active_projects_count
        # When projects are loaded, count them
        return len([p for p in self.projects if p.is_active and not p.is_deleted])
    
    @property
    def total_projects_count(self) -> int:
        """
        Get count of all non-deleted projects.
        ✅ FIXED: Works with loaded relationships.
        """
        if hasattr(self, '_total_projects_count'):
            return self._total_projects_count
        return len([p for p in self.projects if not p.is_deleted])
    
    def soft_delete(self) -> None:
        """Soft delete the user account."""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        self.is_active = False
    
    def restore(self) -> None:
        """Restore a soft-deleted user account."""
        self.is_deleted = False
        self.deleted_at = None
        self.is_active = True
    
    def ban(self, reason: Optional[str] = None) -> None:
        """Ban the user account."""
        self.is_banned = True
        self.banned_at = datetime.utcnow()
        self.ban_reason = reason
        self.is_active = False
    
    def unban(self) -> None:
        """Unban the user account."""
        self.is_banned = False
        self.banned_at = None
        self.ban_reason = None
        self.is_active = True
    
    def record_login(self) -> None:
        """Record a successful login."""
        self.last_login = datetime.utcnow()
        self.login_count += 1
        self.failed_login_attempts = 0  # Reset failed attempts
        self.last_active_at = datetime.utcnow()
    
    def record_failed_login(self) -> None:
        """Record a failed login attempt."""
        self.failed_login_attempts += 1
        
        # Auto-lock after 5 failed attempts
        if self.failed_login_attempts >= 5:
            self.is_locked = True
            self.locked_until = datetime.utcnow() + timedelta(minutes=30)
    
    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        """
        Convert user to dictionary.
        
        Args:
            include_sensitive: Include sensitive fields (email, subscription details)
        
        Returns:
            User data dictionary
        """
        data: Dict[str, Any] = {
            "user_id": self.user_id,
            "display_name": self.display_name or self.full_name,
            "avatar_url": self.avatar_url,
            "user_type": self.user_type.value,
            "subscription_tier": self.subscription_tier.value,
            "is_verified": self.is_email_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_active": self.is_active,
        }
        
        if include_sensitive:
            data.update({
                "email": self.email,
                "full_name": self.full_name,
                "company_name": self.company_name,
                "industry": self.industry,
                "subscription_started_at": self.subscription_started_at.isoformat() if self.subscription_started_at else None,
                "subscription_expires_at": self.subscription_expires_at.isoformat() if self.subscription_expires_at else None,
                "last_login": self.last_login.isoformat() if self.last_login else None,
                "login_count": self.login_count,
                "projects_count": self.total_projects_count,
                "active_projects_count": self.active_projects_count,
            })
        
        return data
    
    def __repr__(self) -> str:
        """String representation."""
        return f"<User(user_id={self.user_id}, email={self.email}, type={self.user_type.value})>"


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "User",
    "UserTypeEnum",
    "SubscriptionTierEnum", 
    "OAuthProviderEnum",
]
