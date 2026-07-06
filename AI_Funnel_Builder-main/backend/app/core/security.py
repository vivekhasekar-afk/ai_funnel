# =============================================================================
# AI FUNNEL BUILDER - SECURITY & AUTHENTICATION
# =============================================================================
# JWT token management, password hashing, and security utilities
# =============================================================================

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
import secrets
import hashlib
import re
from jose import jwt, JWTError  # ✅ Import JWTError

from fastapi.params import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr, ValidationError

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

# =============================================================================
# PASSWORD HASHING
# =============================================================================

# Password context with bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Cost factor (higher = more secure but slower)
)

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt (FastAPI/Pydantic compatible).
    
    Args:
        password: Plain text password
    
    Returns:
        Hashed password string
    
    Example:
        hashed = get_password_hash("MySecurePassword123!")
    """
    return pwd_context.hash(password)

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
    
    Returns:
        Hashed password string
    
    Example:
        hashed = hash_password("MySecurePassword123!")
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored hash to compare against
    
    Returns:
        True if password matches, False otherwise
    
    Example:
        is_valid = verify_password("MyPassword123", stored_hash)
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength against security requirements.
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: Password to validate
    
    Returns:
        (is_valid, error_message)
    
    Example:
        valid, msg = validate_password_strength("Weak")
        if not valid:
            raise ValueError(msg)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    # Check for common weak passwords
    common_passwords = ["password", "12345678", "qwerty", "admin"]
    if password.lower() in common_passwords:
        return False, "Password is too common"
    
    return True, "Password is strong"

# =============================================================================
# JWT TOKEN MANAGEMENT
# =============================================================================

class TokenPayload(BaseModel):
    """JWT token payload structure."""
    sub: str  # Subject (user_id)
    exp: datetime  # Expiration time
    iat: datetime  # Issued at
    type: str  # Token type (access, refresh)
    email: Optional[EmailStr] = None
    user_type: Optional[str] = None

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing token claims (must include 'sub')
        expires_delta: Custom expiration time (optional)
    
    Returns:
        Encoded JWT token string
    
    Example:
        token = create_access_token({"sub": user_id, "email": user.email})
    """
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            seconds=settings.jwt_access_token_expire_seconds
        )
    
    # Add standard claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    # Encode JWT
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt

def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token (longer expiration).
    
    Args:
        data: Dictionary containing token claims
        expires_delta: Custom expiration time (optional)
    
    Returns:
        Encoded JWT refresh token
    
    Example:
        refresh_token = create_refresh_token({"sub": user_id})
    """
    to_encode = data.copy()
    
    # Set longer expiration for refresh tokens
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            seconds=settings.jwt_refresh_token_expire_seconds
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt

def decode_token(token: str) -> TokenPayload:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        TokenPayload with decoded claims
    
    Raises:
        HTTPException: If token is invalid or expired
    
    Example:
        try:
            payload = decode_token(token)
            user_id = payload.sub
        except HTTPException:
            # Handle invalid token
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Validate required fields
        if payload.get("sub") is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return TokenPayload(**payload)
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def decode_access_token(token: str) -> TokenPayload:
    """
    Decode and validate an ACCESS token specifically.
    
    Args:
        token: JWT access token string
    
    Returns:
        TokenPayload with decoded claims
    
    Raises:
        HTTPException: If token is invalid, expired, or wrong type
    """
    payload = decode_token(token)
    verify_token_type(payload, "access")
    return payload

def decode_refresh_token(token: str) -> TokenPayload:
    """
    Decode and validate a REFRESH token specifically.
    
    Args:
        token: JWT refresh token string
    
    Returns:
        TokenPayload with decoded claims
    
    Raises:
        HTTPException: If token is invalid, expired, or wrong type
    """
    payload = decode_token(token)
    verify_token_type(payload, "refresh")
    return payload

def verify_token_type(payload: TokenPayload, expected_type: str) -> bool:
    """
    Verify the token is of the expected type.
    
    Args:
        payload: Decoded token payload
        expected_type: Expected token type ('access' or 'refresh')
    
    Returns:
        True if token type matches
    
    Raises:
        HTTPException: If token type doesn't match
    """
    if payload.type != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token type. Expected {expected_type}, got {payload.type}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True

# =============================================================================
# TOKEN BLACKLIST (for logout)
# =============================================================================

class TokenBlacklist:
    """
    In-memory token blacklist (use Redis in production).
    
    When a user logs out, add their token to the blacklist
    to prevent reuse before expiration.
    """
    
    def __init__(self):
        self._blacklist: set = set()
    
    def add(self, token: str):
        """Add token to blacklist."""
        # Hash token for storage efficiency
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        self._blacklist.add(token_hash)
    
    def is_blacklisted(self, token: str) -> bool:
        """Check if token is blacklisted."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        return token_hash in self._blacklist
    
    def remove(self, token: str):
        """Remove token from blacklist (cleanup expired tokens)."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        self._blacklist.discard(token_hash)
    
    def clear_expired(self):
        """
        Clear expired tokens from blacklist.
        Should be called periodically via background task.
        """
        # In production, use Redis with TTL
        # This is a simplified version
        pass

# Global blacklist instance
token_blacklist = TokenBlacklist()

def blacklist_token(token: str):
    """Add token to blacklist (on logout)."""
    token_blacklist.add(token)

def is_token_blacklisted(token: str) -> bool:
    """Check if token is blacklisted."""
    return token_blacklist.is_blacklisted(token)

# =============================================================================
# API KEY GENERATION
# =============================================================================

def generate_api_key(prefix: str = "fai") -> str:
    """
    Generate a secure API key for integrations.
    
    Args:
        prefix: Key prefix for identification
    
    Returns:
        API key string (e.g., "fai_1234567890abcdef...")
    
    Example:
        api_key = generate_api_key("fai")  # fai_a3f2...
    """
    random_part = secrets.token_urlsafe(32)
    return f"{prefix}_{random_part}"

def hash_api_key(api_key: str) -> str:
    """
    Hash an API key for secure storage.
    
    Args:
        api_key: Plain API key
    
    Returns:
        Hashed API key (store this in database)
    """
    return hashlib.sha256(api_key.encode()).hexdigest()

def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    """
    Verify an API key against its hash.
    
    Args:
        plain_key: API key provided by user
        hashed_key: Stored hash from database
    
    Returns:
        True if key matches
    """
    return hash_api_key(plain_key) == hashed_key

# =============================================================================
# SECURITY UTILITIES
# =============================================================================

def generate_secure_random_string(length: int = 32) -> str:
    """
    Generate a cryptographically secure random string.
    
    Args:
        length: Length of the random string
    
    Returns:
        URL-safe random string
    
    Use for:
    - Password reset tokens
    - Email verification tokens
    - Session IDs
    """
    return secrets.token_urlsafe(length)

def generate_verification_code(length: int = 6) -> str:
    """
    Generate a numeric verification code.
    
    Args:
        length: Number of digits (default 6)
    
    Returns:
        Numeric code as string
    
    Use for:
    - Email verification
    - 2FA codes
    - Phone verification
    """
    return ''.join([str(secrets.randbelow(10)) for _ in range(length)])

def constant_time_compare(val1: str, val2: str) -> bool:
    """
    Constant-time string comparison to prevent timing attacks.
    
    Args:
        val1: First value
        val2: Second value
    
    Returns:
        True if values match
    """
    return secrets.compare_digest(val1, val2)

# =============================================================================
# PASSWORD RESET TOKEN
# =============================================================================

def create_password_reset_token(email: str) -> str:
    """
    Create a password reset token.
    
    Args:
        email: User's email address
    
    Returns:
        JWT token valid for password reset
    
    Token expires in 1 hour.
    """
    delta = timedelta(hours=1)
    expire = datetime.utcnow() + delta
    
    to_encode = {
        "sub": email,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "password_reset"
    }
    
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verify password reset token and return email.
    
    Args:
        token: Password reset token
    
    Returns:
        Email address if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        if payload.get("type") != "password_reset":
            return None
        
        return payload.get("sub")
        
    except JWTError:
        return None

# =============================================================================
# EMAIL VERIFICATION TOKEN
# =============================================================================

def create_email_verification_token(email: str) -> str:
    """
    Create email verification token.
    
    Args:
        email: User's email address
    
    Returns:
        JWT token for email verification
    
    Token expires in 24 hours.
    """
    delta = timedelta(hours=24)
    expire = datetime.utcnow() + delta
    
    to_encode = {
        "sub": email,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "email_verification"
    }
    
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

def verify_email_verification_token(token: str) -> Optional[str]:
    """
    Verify email verification token.
    
    Args:
        token: Email verification token
    
    Returns:
        Email address if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        if payload.get("type") != "email_verification":
            return None
        
        return payload.get("sub")
        
    except JWTError:
        return None

# =============================================================================
# RATE LIMITING HELPERS
# =============================================================================

def generate_rate_limit_key(
    identifier: str,
    endpoint: str,
    window: str = "minute"
) -> str:
    """
    Generate a Redis key for rate limiting.
    
    Args:
        identifier: User ID, IP address, or API key
        endpoint: API endpoint path
        window: Time window (minute, hour, day)
    
    Returns:
        Redis key for rate limiting
    
    Example:
        key = generate_rate_limit_key("user_123", "/api/v1/generate-funnel", "minute")
        # Returns: "ratelimit:user_123:/api/v1/generate-funnel:minute"
    """
    return f"ratelimit:{identifier}:{endpoint}:{window}"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/token")
from sqlalchemy.ext.asyncio import AsyncSession

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get the current user from JWT token.
    Validate token signature, expiration, and user existence.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except (jwt.JWTError, ValidationError):
        raise credentials_exception
    
    user = await db.get(User, user_id)
    if user is None:
        raise credentials_exception
    
    return user

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Password hashing
    "get_password_hash",
    "hash_password",
    "verify_password",
    "validate_password_strength",
    
    # JWT tokens
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "decode_refresh_token",  
    "decode_access_token",
    "verify_token_type",
    "TokenPayload",
    
    # Token blacklist
    "blacklist_token",
    "is_token_blacklisted",
    "token_blacklist",
    
    # API keys
    "generate_api_key",
    "hash_api_key",
    "verify_api_key",
    
    # Security utilities
    "generate_secure_random_string",
    "generate_verification_code",
    "constant_time_compare",
    
    # Special tokens
    "create_password_reset_token",
    "verify_password_reset_token",
    "create_email_verification_token",
    "verify_email_verification_token",
    
    # Rate limiting
    "generate_rate_limit_key",
]
