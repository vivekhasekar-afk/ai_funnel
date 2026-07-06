"""
User Schemas - Production Grade
===============================
Pydantic schemas for user authentication, profile management,
and subscription handling.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, validator, ConfigDict
import re
from pydantic.types import StrictStr, StrictBool
from enum import Enum


# =============================================================================
# ENUMS
# =============================================================================


class UserTypeEnum(str, Enum):
    """User account types."""
    CREATOR = "creator"
    BRAND = "brand"
    ADMIN = "admin"


class SubscriptionTierEnum(str, Enum):
    """Subscription tiers."""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"
    BRAND_STARTER = "brand_starter"
    BRAND_PREMIUM = "brand_premium"


class OAuthProviderEnum(str, Enum):
    """OAuth providers."""
    GOOGLE = "google"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"


# =============================================================================
# BASE SCHEMAS
# =============================================================================


class BaseSchema(BaseModel):
    """Base schema with common config."""
    model_config = ConfigDict(from_attributes=True)


class TimestampSchema(BaseModel):
    """Timestamp schema for created/updated times."""
    created_at: Optional[datetime] = Field(None, description="Created timestamp")
    updated_at: Optional[datetime] = Field(None, description="Updated timestamp")


# =============================================================================
# REQUEST SCHEMAS (Input)
# =============================================================================


class UserCreate(BaseModel):
    """Internal user creation schema (used by auth service)."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class UserRegister(BaseModel):
    """User registration schema."""
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, max_length=100, description="Password (min 8 chars)")
    full_name: Optional[str] = Field(None, max_length=255, description="Full name")
    user_type: UserTypeEnum = Field(UserTypeEnum.CREATOR, description="Account type")
    company_name: Optional[str] = Field(None, max_length=255, description="Company name (for brands)")
    marketing_consent: bool = Field(False, description="Marketing emails consent")
    terms_accepted: bool = Field(..., description="Terms and conditions accepted")
    privacy_policy_accepted: bool = Field(..., description="Privacy policy accepted")

    # UTM tracking (optional)
    utm_source: Optional[str] = Field(None, max_length=100, description="UTM source")
    utm_campaign: Optional[str] = Field(None, max_length=100, description="UTM campaign")
    referral_code: Optional[str] = Field(None, max_length=20, description="Referral code")

    @validator("password")
    def validate_password_strength(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v

    @validator("terms_accepted", "privacy_policy_accepted")
    def validate_acceptance(cls, v):
        """Ensure terms and privacy policy are accepted."""
        if not v:
            raise ValueError("You must accept the terms and privacy policy")
        return v

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Password")
    remember_me: bool = Field(False, description="Remember login (longer session)")
    model_config = ConfigDict(from_attributes=True)


class OAuthLogin(BaseModel):
    """OAuth login schema."""
    provider: OAuthProviderEnum = Field(..., description="OAuth provider")
    access_token: str = Field(..., description="OAuth access token")
    provider_user_id: Optional[str] = Field(None, description="Provider user ID")
    email: Optional[EmailStr] = Field(None, description="Email from provider")
    full_name: Optional[str] = Field(None, description="Name from provider")
    avatar_url: Optional[str] = Field(None, description="Avatar URL from provider")
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """User profile update schema."""
    full_name: Optional[str] = Field(None, max_length=255, description="Full name")
    display_name: Optional[str] = Field(None, max_length=100, description="Display name")
    bio: Optional[str] = Field(None, max_length=500, description="Bio/description")
    website: Optional[str] = Field(None, max_length=255, description="Website URL")
    avatar_url: Optional[str] = Field(None, max_length=500, description="Avatar URL")

    # ✅ ADDED EMAIL FIELD
    email: Optional[EmailStr] = Field(None, description="New email address")

    # Contact & Localization
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    timezone: Optional[str] = Field(None, max_length=50, description="User timezone")
    language: Optional[str] = Field(None, max_length=10, description="Preferred language code")

    # Company info (for brands)
    company_name: Optional[str] = Field(None, max_length=255, description="Company name")
    company_size: Optional[str] = Field(None, max_length=50, description="Company size")
    industry: Optional[str] = Field(None, max_length=100, description="Industry")

    @validator("website")
    def validate_website_url(cls, v):
        """Validate website URL format."""
        if v and not v.startswith(("http://", "https://")):
            return f"https://{v}"
        return v

    model_config = ConfigDict(from_attributes=True)


class UserSettings(BaseModel):
    """User settings/preferences schema."""
    notifications: Optional[Dict[str, bool]] = Field(
        None, description="Notification preferences"
    )
    privacy: Optional[Dict[str, bool]] = Field(
        None, description="Privacy settings"
    )
    editor: Optional[Dict[str, Any]] = Field(
        None, description="Editor preferences"
    )
    model_config = ConfigDict(from_attributes=True)


class UserPreferencesUpdate(BaseModel):
    """Update user preferences (notification, UI, privacy, etc.)."""
    # Notification preferences
    email_notifications: Optional[StrictBool] = Field(
        None, description="Receive email notifications"
    )
    product_updates: Optional[StrictBool] = Field(
        None, description="Receive product update emails"
    )
    marketing_emails: Optional[StrictBool] = Field(
        None, description="Receive marketing emails"
    )
    in_app_notifications: Optional[StrictBool] = Field(
        None, description="Enable in-app notifications"
    )

    # UI / locale
    locale: Optional[StrictStr] = Field(
        None, max_length=10, description="UI locale code, e.g. en, en-US"
    )
    timezone: Optional[StrictStr] = Field(
        None, max_length=64, description="IANA timezone string"
    )
    theme: Optional[StrictStr] = Field(
        None, description="Theme preference: light, dark, system"
    )

    # Privacy / tracking
    tracking_consent: Optional[StrictBool] = Field(
        None, description="Allow analytics and tracking"
    )
    personalized_recommendations: Optional[StrictBool] = Field(
        None, description="Allow personalized recommendations"
    )

    # Misc / extensible
    extra_preferences: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Arbitrary extra preference key/values"
    )

    model_config = ConfigDict(extra="forbid")


class PasswordChange(BaseModel):
    """Password change schema (authenticated user)."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")
    confirm_password: str = Field(..., description="Confirm new password")

    @validator("new_password")
    def validate_password_strength(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        """Validate passwords match."""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v
    
    model_config = ConfigDict(from_attributes=True)


class PasswordChangeRequest(BaseModel):
    """Request to change user password (alias for PasswordChange logic)."""
    current_password: str = Field(..., min_length=8, description="Current password")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")
    new_password_confirm: str = Field(..., description="New password confirmation")

    @validator('new_password_confirm')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('New passwords do not match')
        return v

    model_config = ConfigDict(from_attributes=True)


class PasswordResetRequest(BaseModel):
    """Password reset request schema (request link)."""
    email: EmailStr = Field(..., description="Email address")
    model_config = ConfigDict(from_attributes=True)


class PasswordReset(BaseModel):
    """Password reset with token schema."""
    token: str = Field(..., description="Reset token from email")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")
    confirm_password: str = Field(..., description="Confirm new password")

    @validator("new_password")
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v
    
    model_config = ConfigDict(from_attributes=True)


class EmailVerification(BaseModel):
    """Email verification schema."""
    token: str = Field(..., description="Verification token from email")
    model_config = ConfigDict(from_attributes=True)


class SubscriptionUpdate(BaseModel):
    """Subscription tier update schema."""
    tier: SubscriptionTierEnum = Field(..., description="New subscription tier")
    payment_method_id: Optional[str] = Field(None, description="Stripe payment method ID")
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# RESPONSE SCHEMAS (Output)
# =============================================================================


class UserProfile(BaseSchema):
    """Public user profile (safe to show anyone)."""
    user_id: str = Field(..., description="User ID")
    display_name: Optional[str] = Field(None, description="Display name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    bio: Optional[str] = Field(None, description="Bio")
    website: Optional[str] = Field(None, description="Website")
    user_type: UserTypeEnum = Field(..., description="Account type")
    subscription_tier: SubscriptionTierEnum = Field(..., description="Subscription tier")
    is_verified: bool = Field(..., description="Email verified status")
    created_at: datetime = Field(..., description="Account creation date")
    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseSchema, TimestampSchema):
    """Full user response (authenticated user viewing own profile)."""
    user_id: str = Field(..., description="User ID")
    email: str = Field(..., description="Email address")
    full_name: Optional[str] = Field(None, description="Full name")
    display_name: Optional[str] = Field(None, description="Display name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    bio: Optional[str] = Field(None, description="Bio")
    website: Optional[str] = Field(None, description="Website")

    # Account info
    user_type: UserTypeEnum = Field(..., description="Account type")
    subscription_tier: SubscriptionTierEnum = Field(..., description="Subscription tier")
    subscription_expires_at: Optional[datetime] = Field(None, description="Subscription expiration")

    # Status
    is_active: bool = Field(..., description="Account active")
    is_email_verified: bool = Field(..., description="Email verified")
    is_banned: bool = Field(..., description="Account banned")

    # Activity
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    login_count: int = Field(..., description="Total logins")

    # Company (for brands)
    company_name: Optional[str] = Field(None, description="Company name")
    industry: Optional[str] = Field(None, description="Industry")

    # Settings
    settings: Optional[Dict[str, Any]] = Field(None, description="User settings")

    model_config = ConfigDict(from_attributes=True)


class UserResponseMinimal(BaseModel):
    """Minimal user response info for lightweight references."""
    user_id: int = Field(..., description="Unique user identifier")
    username: Optional[str] = Field(None, description="Username or handle")
    email: Optional[str] = Field(None, description="User email (masked or null for privacy)")
    is_active: bool = Field(..., description="User account active status")
    created_at: Optional[datetime] = Field(None, description="User creation date")
    model_config = ConfigDict(from_attributes=True)


class UserList(BaseSchema):
    """User list item (for admin/search results)."""
    user_id: str = Field(..., description="User ID")
    email: str = Field(..., description="Email address")
    full_name: Optional[str] = Field(None, description="Full name")
    display_name: Optional[str] = Field(None, description="Display name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    user_type: UserTypeEnum = Field(..., description="Account type")
    subscription_tier: SubscriptionTierEnum = Field(..., description="Subscription tier")
    is_verified: bool = Field(..., description="Email verified")
    created_at: datetime = Field(..., description="Creation date")
    model_config = ConfigDict(from_attributes=True)


class AuthTokenResponse(BaseModel):
    """Authentication token response."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration (seconds)")
    user: UserResponse = Field(..., description="User data")
    model_config = ConfigDict(from_attributes=True)


class UserStats(BaseModel):
    """User statistics (for dashboard)."""
    total_funnels: int = Field(..., description="Total funnels created")
    active_funnels: int = Field(..., description="Active funnels")
    total_responses: int = Field(..., description="Total responses received")
    total_leads: int = Field(..., description="Total leads captured")
    total_views: int = Field(..., description="Total funnel views")
    avg_completion_rate: float = Field(..., description="Average completion rate")
    model_config = ConfigDict(from_attributes=True)


class SubscriptionResponse(BaseModel):
    """Subscription information response."""
    tier: SubscriptionTierEnum = Field(..., description="Current tier")
    status: str = Field(..., description="Subscription status (active/expired/cancelled)")
    started_at: Optional[datetime] = Field(None, description="Subscription start date")
    expires_at: Optional[datetime] = Field(None, description="Expiration date")
    days_remaining: Optional[int] = Field(None, description="Days until expiration")
    auto_renew: bool = Field(..., description="Auto-renewal enabled")
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = [
    # Enums
    "UserTypeEnum",
    "SubscriptionTierEnum",
    "OAuthProviderEnum",
    
    # Request schemas
    "UserCreate",
    "UserRegister",
    "UserLogin",
    "OAuthLogin",
    "UserUpdate",
    "UserSettings",
    "UserPreferencesUpdate",
    "PasswordChange",
    "PasswordChangeRequest",
    "PasswordResetRequest",
    "PasswordReset",
    "EmailVerification",
    "SubscriptionUpdate",
    
    # Response schemas
    "UserProfile",
    "UserResponse",
    "UserResponseMinimal",
    "UserList",
    "AuthTokenResponse",
    "UserStats",
    "SubscriptionResponse",
]
