# =============================================================================
# AI FUNNEL BUILDER - AUTH SERVICE
# =============================================================================
# Authentication and authorization business logic
# =============================================================================

from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.user import User
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.utils.exceptions import (
    ValidationException,
    UnauthorizedException,
    NotFoundException,
    ConflictException,
    InvalidCredentialsException,
)
from app.utils.logger import get_logger
from app.utils.helpers import generate_token
from app.utils.validators import validate_email
from app.middleware.auth import token_blacklist
from app.core.config import settings

logger = get_logger(__name__)


# =============================================================================
# AUTH SERVICE
# =============================================================================

class AuthService:
    """
    Authentication service handling user auth operations.
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize auth service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    # =========================================================================
    # REGISTRATION
    # =========================================================================
    
    async def register(
        self,
        data: RegisterRequest,
        ip_address: Optional[str] = None
    ) -> Tuple[User, TokenResponse]:
        """
        Register new user.
        
        Args:
            data: Registration data
            ip_address: Client IP address
        
        Returns:
            Tuple of (user, tokens)
        
        Raises:
            ConflictException: If email already exists
            ValidationException: If validation fails
        """
        # Validate email
        email = validate_email(data.email)
        
        # Check if email already exists
        existing_user = await self._get_user_by_email(email)
        if existing_user:
            raise ConflictException(
                message="Email address already registered",
                conflicting_field="email"
            )
        
        # Hash password
        password_hash = get_password_hash(data.password)
        
        # Generate verification token
        verification_token = generate_token(32)
        verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        
        # Create user
        user = User(
            email=email,
            full_name=data.full_name,
            password_hash=password_hash,
            email_verification_token=verification_token,
            email_verification_token_expires=verification_token_expires,
            registration_ip=ip_address,
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        # Log registration
        logger.info(
            f"User registered: {email}",
            extra={
                "user_id": user.user_id,
                "email": email,
                "ip_address": ip_address,
            }
        )
        
        # Generate tokens
        tokens = await self._generate_tokens(user)
        
        # TODO: Send verification email
        # await email_service.send_verification_email(user, verification_token)
        
        return user, tokens
    
    # =========================================================================
    # LOGIN
    # =========================================================================
    
    async def login(
        self,
        data: LoginRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[User, dict]:  # ✅ Returns dict
        """
        Login user and generate tokens.
        
        Args:
            data: Login credentials
            ip_address: Client IP address
            user_agent: User agent string
        
        Returns:
            Tuple of (user, tokens_dict)
        
        Raises:
            InvalidCredentialsException: If credentials are invalid
            UnauthorizedException: If account is locked or deleted
        """
        # Get user by email
        user = await self._get_user_by_email(data.email)
        if not user:
            logger.warning(
                f"Login failed: user not found",
                extra={"email": data.email, "ip_address": ip_address}
            )
            raise InvalidCredentialsException()
        
        # Check if account is active
        if not user.is_active:
            logger.warning(
                f"Login failed: account inactive",
                extra={"user_id": user.user_id, "email": user.email}
            )
            raise UnauthorizedException("Account is inactive")
        
        # Check if account is locked
        if user.is_locked:
            logger.warning(
                f"Login failed: account locked",
                extra={"user_id": user.user_id, "email": user.email}
            )
            raise UnauthorizedException(
                f"Account is locked due to too many failed login attempts. "
                f"Try again after {user.locked_until.isoformat() if user.locked_until else 'some time'}"
            )
        
        # Check if deleted
        if user.is_deleted or user.deleted_at:  # ✅ Check is_deleted too
            logger.warning(
                f"Login failed: account deleted",
                extra={"user_id": user.user_id, "email": user.email}
            )
            raise UnauthorizedException("Account not found")
        
        # Verify password
        if not verify_password(data.password, user.password_hash):
            # Increment failed login attempts
            await self._handle_failed_login(user)
            
            logger.warning(
                f"Login failed: invalid password",
                extra={
                    "user_id": user.user_id,
                    "email": user.email,
                    "failed_attempts": user.failed_login_attempts,
                    "ip_address": ip_address,
                }
            )
            raise InvalidCredentialsException()
        
        # ✅ Reset failed login attempts and update last login
        user.failed_login_attempts = 0
        user.last_login = datetime.now(timezone.utc)  # ✅ Use timezone-aware
        user.login_count = (user.login_count or 0) + 1  # ✅ Increment login count
        
        # Store IP if field exists
        if hasattr(user, 'last_login_ip'):
            user.last_login_ip = ip_address
        
        await self.db.commit()
        await self.db.refresh(user)
        
        # Log successful login
        logger.info(
            f"User logged in: {user.email}",
            extra={
                "user_id": user.user_id,
                "email": user.email,
                "ip_address": ip_address,
                "user_agent": user_agent,
            }
        )
        
        # ✅ Generate tokens (returns dict)
        tokens = await self._generate_tokens(user)
        
        return user, tokens
    
    # =========================================================================
    # LOGOUT
    # =========================================================================
    
    async def logout(self, token: str, user_id: str):
        """
        Logout user by blacklisting token.
        
        Args:
            token: Access token to blacklist
            user_id: User ID
        """
        # Decode token to get expiration
        try:
            payload = decode_access_token(token)
            exp = payload.get("exp")
            if exp:
                expires_at = datetime.fromtimestamp(exp)
                await token_blacklist.add(token, expires_at)
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
        
        logger.info(f"User logged out", extra={"user_id": user_id})
    
    # =========================================================================
    # TOKEN REFRESH
    # =========================================================================
    
    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Refresh token
        
        Returns:
            New token pair
        
        Raises:
            UnauthorizedException: If refresh token is invalid
        """
        try:
            # Decode refresh token
            payload = decode_refresh_token(refresh_token)
            user_id = payload.get("sub")
            
            if not user_id:
                raise UnauthorizedException("Invalid refresh token")
            
            # Get user
            user = await self._get_user_by_id(user_id)
            if not user or not user.is_active:
                raise UnauthorizedException("User not found or inactive")
            
            # Generate new tokens
            tokens = await self._generate_tokens(user)
            
            logger.info(
                f"Token refreshed",
                extra={"user_id": user_id}
            )
            
            return tokens
        
        except Exception as e:
            logger.warning(f"Token refresh failed: {e}")
            raise UnauthorizedException("Invalid or expired refresh token")
    
    # =========================================================================
    # EMAIL VERIFICATION
    # =========================================================================
    
    async def verify_email(self, token: str) -> User:
        """
        Verify user email address.
        
        Args:
            token: Email verification token
        
        Returns:
            Verified user
        
        Raises:
            NotFoundException: If token is invalid
            ValidationException: If token is expired
        """
        # Find user by verification token
        result = await self.db.execute(
            select(User).where(User.email_verification_token == token)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise NotFoundException("Invalid verification token")
        
        # Check if token is expired
        if user.email_verification_token_expires and \
           user.email_verification_token_expires < datetime.utcnow():
            raise ValidationException("Verification token has expired")
        
        # Check if already verified
        if user.email_verified:
            logger.info(f"Email already verified: {user.email}")
            return user
        
        # Verify email
        user.email_verified = True
        user.email_verified_at = datetime.utcnow()
        user.email_verification_token = None
        user.email_verification_token_expires = None
        
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(
            f"Email verified: {user.email}",
            extra={"user_id": user.user_id, "email": user.email}
        )
        
        return user
    
    async def resend_verification_email(self, email: str) -> User:
        """
        Resend verification email.
        
        Args:
            email: User email
        
        Returns:
            User
        
        Raises:
            NotFoundException: If user not found
            ValidationException: If email already verified
        """
        user = await self._get_user_by_email(email)
        if not user:
            raise NotFoundException("User not found")
        
        if user.email_verified:
            raise ValidationException("Email already verified")
        
        # Generate new verification token
        verification_token = generate_token(32)
        verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        
        user.email_verification_token = verification_token
        user.email_verification_token_expires = verification_token_expires
        
        await self.db.commit()
        await self.db.refresh(user)
        
        # TODO: Send verification email
        # await email_service.send_verification_email(user, verification_token)
        
        logger.info(f"Verification email resent: {user.email}")
        
        return user
    
    # =========================================================================
    # PASSWORD RESET
    # =========================================================================
    
    async def request_password_reset(self, data: PasswordResetRequest) -> bool:
        """
        Request password reset.
        
        Args:
            data: Password reset request
        
        Returns:
            Always True (for security, don't reveal if email exists)
        """
        user = await self._get_user_by_email(data.email)
        
        # For security, always return success even if email doesn't exist
        if not user:
            logger.info(f"Password reset requested for non-existent email: {data.email}")
            return True
        
        # Generate reset token
        reset_token = generate_token(32)
        reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        
        user.password_reset_token = reset_token
        user.password_reset_token_expires = reset_token_expires
        
        await self.db.commit()
        
        # TODO: Send password reset email
        # await email_service.send_password_reset_email(user, reset_token)
        
        logger.info(
            f"Password reset requested: {user.email}",
            extra={"user_id": user.user_id, "email": user.email}
        )
        
        return True
    
    async def reset_password(self, data: PasswordResetConfirm) -> bool:
        """
        Reset password using reset token.
        
        Args:
            data: Password reset confirmation
        
        Returns:
            True if successful
        
        Raises:
            NotFoundException: If token is invalid
            ValidationException: If token is expired
        """
        # Find user by reset token
        result = await self.db.execute(
            select(User).where(User.password_reset_token == data.token)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise NotFoundException("Invalid reset token")
        
        # Check if token is expired
        if user.password_reset_token_expires and \
           user.password_reset_token_expires < datetime.utcnow():
            raise ValidationException("Reset token has expired")
        
        # Hash new password
        password_hash = get_password_hash(data.new_password)
        
        # Update password
        user.password_hash = password_hash
        user.password_reset_token = None
        user.password_reset_token_expires = None
        user.password_changed_at = datetime.utcnow()
        
        # Reset failed login attempts
        user.failed_login_attempts = 0
        user.is_locked = False
        user.locked_until = None
        
        await self.db.commit()
        
        logger.info(
            f"Password reset: {user.email}",
            extra={"user_id": user.user_id, "email": user.email}
        )
        
        return True
    
    async def change_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str
    ) -> bool:
        """
        Change user password.
        
        Args:
            user_id: User ID
            current_password: Current password
            new_password: New password
        
        Returns:
            True if successful
        
        Raises:
            NotFoundException: If user not found
            ValidationException: If current password is incorrect
        """
        user = await self._get_user_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        # Verify current password
        if not verify_password(current_password, user.password_hash):
            raise ValidationException("Current password is incorrect")
        
        # Hash new password
        password_hash = get_password_hash(new_password)
        
        # Update password
        user.password_hash = password_hash
        user.password_changed_at = datetime.utcnow()
        
        await self.db.commit()
        
        logger.info(
            f"Password changed: {user.email}",
            extra={"user_id": user_id, "email": user.email}
        )
        
        return True
    
    # =========================================================================
    # OAUTH
    # =========================================================================
    
    async def oauth_login(
        self,
        provider: str,
        provider_user_id: str,
        email: str,
        full_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[User, TokenResponse]:
        """
        Login or register user via OAuth.
        
        Args:
            provider: OAuth provider (google, github, etc.)
            provider_user_id: User ID from provider
            email: User email
            full_name: User full name
            avatar_url: User avatar URL
            ip_address: Client IP address
        
        Returns:
            Tuple of (user, tokens)
        """
        # Try to find existing user by OAuth ID
        result = await self.db.execute(
            select(User).where(User.oauth_provider == provider)
            .where(User.oauth_id == provider_user_id)
        )
        user = result.scalar_one_or_none()
        
        # If not found, try by email
        if not user:
            user = await self._get_user_by_email(email)
        
        # Create new user if doesn't exist
        if not user:
            user = User(
                email=validate_email(email),
                full_name=full_name,
                avatar_url=avatar_url,
                oauth_provider=provider,
                oauth_id=provider_user_id,
                email_verified=True,  # Assume OAuth email is verified
                email_verified_at=datetime.utcnow(),
                registration_ip=ip_address,
                settings={},
                user_metadata={}

            )
            self.db.add(user)
            
            logger.info(
                f"User registered via OAuth ({provider}): {email}",
                extra={"email": email, "provider": provider}
            )
        else:
            # Update OAuth info if needed
            if not user.oauth_provider:
                user.oauth_provider = provider
                user.oauth_id = provider_user_id
            
            # Update last login
            user.last_login = datetime.utcnow()
            user.last_login_ip = ip_address
            
            logger.info(
                f"User logged in via OAuth ({provider}): {email}",
                extra={"user_id": user.user_id, "email": email, "provider": provider}
            )
        
        await self.db.commit()
        await self.db.refresh(user)
        
        # Generate tokens
        tokens = await self._generate_tokens(user)
        
        return user, tokens
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    async def _get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()
    
    async def _get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def _generate_tokens(self, user: User) -> dict:
        """
        Generate access and refresh tokens.
        ✅ FIXED: Returns dict, not TokenResponse
        
        Args:
            user: User object
        
        Returns:
            Dictionary with access_token, refresh_token, token_type, expires_in
        """
        # Create token payload
        token_data = {
            "sub": str(user.user_id),
            "email": user.email,
            "role": user.user_type.value if hasattr(user.user_type, 'value') else user.user_type,
        }
        
        # Generate tokens
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data={"sub": str(user.user_id)})
        
        # ✅ CRITICAL: Return as plain dict
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 1800  # 30 minutes (adjust in settings)
        }
    
    async def _handle_failed_login(self, user: User):
        """
        Handle failed login attempt.
        
        Increments failed attempts counter and locks account if threshold reached.
        
        Args:
            user: User
        """
        user.failed_login_attempts += 1
        
        # Lock account after 5 failed attempts
        if user.failed_login_attempts >= 5:
            user.is_locked = True
            user.locked_until = datetime.utcnow() + timedelta(minutes=30)
            
            logger.warning(
                f"Account locked due to failed login attempts: {user.email}",
                extra={
                    "user_id": user.user_id,
                    "email": user.email,
                    "failed_attempts": user.failed_login_attempts,
                }
            )
        
        await self.db.commit()


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["AuthService"]
