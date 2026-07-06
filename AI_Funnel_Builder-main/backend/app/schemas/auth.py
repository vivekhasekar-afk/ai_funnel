"""
Auth Schemas - Production Grade
===============================
Pydantic schemas for authentication, authorization, JWT tokens,
and user session management.
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict, validator, constr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic.types import StrictStr, StrictInt


class UserRole(str, Enum):
    """User role levels."""
    ADMIN = "admin"
    CREATOR = "creator"
    USER = "user"
    GUEST = "guest"


class TokenType(str, Enum):
    """JWT token types."""
    ACCESS = "access"
    REFRESH = "refresh"
    RESET_PASSWORD = "reset_password"
    VERIFY_EMAIL = "verify_email"


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class LoginRequest(BaseModel):
    """User login credentials."""
    email: EmailStr = Field(..., description="User email address")
    password: StrictStr = Field(..., min_length=8, max_length=100, description="User password")
    remember_me: bool = Field(False, description="Extended session")

    model_config = ConfigDict(from_attributes=True)


class RegisterRequest(BaseModel):
    """User registration."""
    email: EmailStr = Field(..., description="Email address")
    password: StrictStr = Field(..., min_length=8, max_length=100, description="Password")
    password_confirm: StrictStr = Field(..., description="Password confirmation")
    first_name: Optional[StrictStr] = Field(None, max_length=100)
    last_name: Optional[StrictStr] = Field(None, max_length=100)
    company: Optional[StrictStr] = Field(None, max_length=255)
    full_name: Optional[str] = Field(None, description="User's full name")
    
    @validator("password_confirm")
    def passwords_match(cls, v, values):
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v

    model_config = ConfigDict(from_attributes=True)


class PasswordResetRequest(BaseModel):
    """Password reset request."""
    email: EmailStr = Field(..., description="Registered email address")


class PasswordResetConfirm(BaseModel):
    """Confirm password reset with token."""
    token: StrictStr = Field(..., description="Reset token from email")
    new_password: StrictStr = Field(..., min_length=8, max_length=100)
    new_password_confirm: StrictStr = Field(...)

    @validator("new_password_confirm")
    def passwords_match(cls, v, values):
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class PasswordChange(BaseModel):
    """Change password (authenticated user)."""
    current_password: StrictStr = Field(..., description="Current password")
    new_password: StrictStr = Field(..., min_length=8, max_length=100)
    new_password_confirm: StrictStr = Field(...)

    @validator("new_password_confirm")
    def passwords_match(cls, v, values):
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class TokenRefreshRequest(BaseModel):
    """Refresh access token."""
    refresh_token: StrictStr = Field(..., description="Valid refresh token")


class EmailVerifyRequest(BaseModel):
    """Email verification."""
    token: StrictStr = Field(..., description="Verification token from email")


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class UserResponse(BaseModel):
    """User profile response."""
    id: str = Field(..., description="User ID")
    email: EmailStr = Field(..., description="User email")
    full_name: str = Field(..., description="User full name")
    role: str = Field(..., description="User role")
    is_active: bool = Field(..., description="Account active status")
    is_verified: bool = Field(..., description="Email verification status")
    created_at: Optional[datetime] = Field(None, description="Account creation date")
    updated_at: Optional[datetime] = Field(None, description="Last update date")
    
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: StrictStr = Field(..., description="JWT access token")
    refresh_token: Optional[StrictStr] = Field(None, description="JWT refresh token")
    token_type: StrictStr = Field("bearer", description="Token type")
    expires_in: StrictInt = Field(..., description="Access token expiry (seconds)")

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    """Login response with tokens and user data."""
    access_token: StrictStr = Field(..., description="JWT access token")
    refresh_token: StrictStr = Field(..., description="JWT refresh token")
    token_type: StrictStr = Field("bearer", description="Token type")
    expires_in: StrictInt = Field(..., description="Access token expiry (seconds)")
    user: UserResponse = Field(..., description="User profile data")

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    """Authentication response with user info."""
    user: Dict[str, Any] = Field(..., description="User profile")
    tokens: TokenResponse = Field(..., description="JWT tokens")

    model_config = ConfigDict(from_attributes=True)


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: StrictStr = Field(..., description="Subject (user_id)")
    exp: int = Field(..., description="Expiration timestamp")
    iat: int = Field(..., description="Issued at timestamp")
    type: TokenType = Field(..., description="Token type")
    role: Optional[UserRole] = Field(None, description="User role")
    email: Optional[EmailStr] = Field(None, description="User email")


class LogoutResponse(BaseModel):
    """Logout confirmation."""
    message: StrictStr = Field(..., description="Logout message")
    logged_out_at: datetime = Field(..., description="Logout timestamp")


class PasswordResetResponse(BaseModel):
    """Password reset email sent confirmation."""
    message: StrictStr = Field(..., description="Confirmation message")
    email: EmailStr = Field(..., description="Email address")


class EmailVerifyResponse(BaseModel):
    """Email verification confirmation."""
    message: StrictStr = Field(..., description="Verification status")
    verified: bool = Field(..., description="Verification success")
    email: EmailStr = Field(..., description="Verified email")


# =============================================================================
# SESSION MANAGEMENT
# =============================================================================

class SessionInfo(BaseModel):
    """User session information."""
    session_id: StrictStr
    user_id: StrictStr
    device_type: Optional[StrictStr] = None
    ip_address: Optional[StrictStr] = None
    user_agent: Optional[StrictStr] = None
    created_at: datetime
    last_active: datetime
    expires_at: datetime


class ActiveSessionsResponse(BaseModel):
    """List of active user sessions."""
    sessions: List[SessionInfo] = Field(..., description="Active sessions")
    total: StrictInt = Field(..., description="Total active sessions")


class RevokeSessionRequest(BaseModel):
    """Revoke specific session."""
    session_id: StrictStr = Field(..., description="Session ID to revoke")


class PasswordChangeRequest(BaseModel):
    current_password: StrictStr = Field(..., min_length=8, description="Current user password")
    new_password: StrictStr = Field(
        ..., min_length=8, description="New password with minimum length of 8 characters"
    )


class EmailVerificationRequest(BaseModel):
    email: EmailStr = Field(..., description="User email to verify")
    verification_code: StrictStr = Field(
        ..., min_length=6, max_length=6, description="Verification code sent to email"
    )


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "UserRole",
    "TokenType",
    "LoginRequest",
    "RegisterRequest",
    "PasswordResetRequest",
    "PasswordResetConfirm",
    "PasswordChange",
    "TokenRefreshRequest",
    "EmailVerifyRequest",
    "UserResponse",
    "TokenResponse",
    "LoginResponse",
    "AuthResponse",
    "TokenPayload",
    "LogoutResponse",
    "PasswordResetResponse",
    "EmailVerifyResponse",
    "SessionInfo",
    "ActiveSessionsResponse",
    "RevokeSessionRequest",
    "PasswordChangeRequest",
    "EmailVerificationRequest",
]
