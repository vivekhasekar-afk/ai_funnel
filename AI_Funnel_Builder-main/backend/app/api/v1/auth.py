# =============================================================================
# AI FUNNEL BUILDER - AUTH ENDPOINTS
# =============================================================================
# Authentication and authorization endpoints
# =============================================================================

from fastapi import APIRouter, Depends, status, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    PasswordChangeRequest,
    EmailVerificationRequest,
)
from app.schemas.auth import LoginRequest, LoginResponse
from app.utils.logger import get_logger
from app.utils.helpers import get_client_ip
from app.middleware.auth import get_current_user

logger = get_logger(__name__)

router = APIRouter()


# =============================================================================
# REGISTRATION
# =============================================================================

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User",
    description="Create new user account with email and password"
)
async def signup(
    data: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Register new user account.
    
    Args:
        data: Registration data (email, password, name)
        request: FastAPI request
        db: Database session
    
    Returns:
        Access and refresh tokens
    """
    auth_service = AuthService(db)
    
    user, tokens = await auth_service.register(
        data=data,
        ip_address=get_client_ip(request)
    )
    
    logger.info(f"User registered: {user.email}")
    
    return tokens


# =============================================================================
# LOGIN / LOGOUT
# =============================================================================

@router.post(
    "/login",
    response_model=LoginResponse,  # ✅ Use LoginResponse (includes user)
    status_code=status.HTTP_200_OK,
    summary="Login",
    description="Authenticate user and receive JWT tokens"
)
async def login(
    data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Login user with email and password.
    
    Returns:
        Access and refresh tokens WITH user data
    """
    auth_service = AuthService(db)
    
    user, tokens = await auth_service.login(
        data=data,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent")
    )
    
    logger.info(f"User logged in: {user.email}")
    
    # ✅ CRITICAL: Return user data in response
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": tokens.get("token_type", "bearer"),
        "expires_in": tokens["expires_in"],
        "user": {
            "id": str(user.user_id),  # ✅ Use user_id from your model
            "email": user.email,
            "full_name": user.full_name,
            "role": user.user_type.value if hasattr(user.user_type, 'value') else user.user_type,
            "is_active": user.is_active,
            "is_verified": user.is_email_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
    }


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout",
    description="Logout user and invalidate token"
)
async def logout(
    authorization: Optional[str] = Header(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout user by blacklisting token.
    
    Args:
        authorization: Authorization header with bearer token
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    auth_service = AuthService(db)
    
    # Extract token from header
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        await auth_service.logout(token, current_user["user_id"])
    
    return {"message": "Successfully logged out"}


# =============================================================================
# TOKEN REFRESH
# =============================================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh Token",
    description="Get new access token using refresh token"
)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token.
    
    Args:
        refresh_token: Refresh token
        db: Database session
    
    Returns:
        New access and refresh tokens
    """
    auth_service = AuthService(db)
    
    tokens = await auth_service.refresh_token(refresh_token)
    
    return tokens


# =============================================================================
# EMAIL VERIFICATION
# =============================================================================

@router.post(
    "/verify-email",
    status_code=status.HTTP_200_OK,
    summary="Verify Email",
    description="Verify user email address with token"
)
async def verify_email(
    data: EmailVerificationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify user email with token.
    
    Args:
        data: Verification token
        db: Database session
    
    Returns:
        Success message
    """
    auth_service = AuthService(db)
    
    user = await auth_service.verify_email(data.token)
    
    return {
        "message": "Email verified successfully",
        "email": user.email
    }


@router.post(
    "/resend-verification",
    status_code=status.HTTP_200_OK,
    summary="Resend Verification Email",
    description="Resend email verification link"
)
async def resend_verification(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Resend email verification.
    
    Args:
        email: User email
        db: Database session
    
    Returns:
        Success message
    """
    auth_service = AuthService(db)
    
    await auth_service.resend_verification_email(email)
    
    return {"message": "Verification email sent"}


# =============================================================================
# PASSWORD RESET
# =============================================================================

@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Request Password Reset",
    description="Request password reset email"
)
async def forgot_password(
    data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset.
    
    Args:
        data: Email address
        db: Database session
    
    Returns:
        Success message (always, for security)
    """
    auth_service = AuthService(db)
    
    await auth_service.request_password_reset(data)
    
    return {
        "message": "If the email exists, a reset link has been sent"
    }


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset Password",
    description="Reset password with token"
)
async def reset_password(
    data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password with token.
    
    Args:
        data: Reset token and new password
        db: Database session
    
    Returns:
        Success message
    """
    auth_service = AuthService(db)
    
    await auth_service.reset_password(data)
    
    return {"message": "Password reset successfully"}


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change Password",
    description="Change password for authenticated user"
)
async def change_password(
    data: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change user password.
    
    Args:
        data: Current and new password
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    auth_service = AuthService(db)
    
    await auth_service.change_password(
        user_id=current_user["user_id"],
        current_password=data.current_password,
        new_password=data.new_password
    )
    
    return {"message": "Password changed successfully"}


# =============================================================================
# OAUTH (Future Implementation)
# =============================================================================

@router.get(
    "/oauth/{provider}",
    summary="OAuth Login",
    description="Initiate OAuth login flow"
)
async def oauth_login(provider: str):
    """
    Initiate OAuth login.
    
    Args:
        provider: OAuth provider (google, github, etc.)
    
    Returns:
        OAuth redirect URL
    """
    # TODO: Implement OAuth flow
    return {
        "message": "OAuth not yet implemented",
        "provider": provider
    }


@router.get(
    "/oauth/{provider}/callback",
    summary="OAuth Callback",
    description="Handle OAuth callback"
)
async def oauth_callback(provider: str, code: str):
    """
    Handle OAuth callback.
    
    Args:
        provider: OAuth provider
        code: Authorization code
    
    Returns:
        Tokens or redirect
    """
    # TODO: Implement OAuth callback
    return {
        "message": "OAuth callback not yet implemented",
        "provider": provider
    }
