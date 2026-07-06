# =============================================================================
# AI FUNNEL BUILDER - AUTH MIDDLEWARE
# =============================================================================
# Production-grade authentication middleware with multiple strategies
# =============================================================================

from typing import Optional, List, Set, Callable
from datetime import datetime, timedelta

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from jose import jwt, JWTError

from app.core.config import settings
from app.core.security import decode_access_token, verify_api_key
from app.utils.logger import get_logger, user_id_var
from app.utils.exceptions import (
    UnauthorizedException,
    ForbiddenException,
    TokenExpiredException,
    InvalidTokenException,
)

logger = get_logger(__name__)


# =============================================================================
# TOKEN BLACKLIST
# =============================================================================

class TokenBlacklist:
    """
    Token blacklist for invalidated tokens.
    
    In production, use Redis for distributed blacklist.
    """
    
    def __init__(self):
        """Initialize token blacklist."""
        self.blacklist: Set[str] = set()
        self.redis = None
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis connection if configured."""
        if settings.REDIS_URL:
            try:
                import redis.asyncio as redis
                self.redis = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                )
                logger.info("Redis token blacklist initialized")
            except ImportError:
                logger.warning("redis package not installed, using in-memory blacklist")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
    
    async def add(self, token: str, expires_at: datetime):
        """
        Add token to blacklist.
        
        Args:
            token: JWT token
            expires_at: Token expiration time
        """
        if self.redis:
            # Store in Redis with TTL
            ttl = int((expires_at - datetime.utcnow()).total_seconds())
            if ttl > 0:
                await self.redis.setex(f"blacklist:{token}", ttl, "1")
        else:
            # Store in memory
            self.blacklist.add(token)
    
    async def is_blacklisted(self, token: str) -> bool:
        """
        Check if token is blacklisted.
        
        Args:
            token: JWT token
        
        Returns:
            True if blacklisted
        """
        if self.redis:
            result = await self.redis.get(f"blacklist:{token}")
            return result is not None
        else:
            return token in self.blacklist
    
    async def clear_expired(self):
        """Clear expired tokens from in-memory blacklist."""
        if not self.redis:
            # In-memory cleanup (tokens don't have expiration info)
            # In production, use Redis which handles this automatically
            pass


# Global token blacklist instance
token_blacklist = TokenBlacklist()


# =============================================================================
# AUTH STRATEGIES
# =============================================================================

class AuthStrategy:
    """
    Base authentication strategy.
    """
    
    async def authenticate(self, request: Request) -> Optional[dict]:
        """
        Authenticate request.
        
        Args:
            request: FastAPI request
        
        Returns:
            User data if authenticated, None otherwise
        """
        raise NotImplementedError


class BearerTokenStrategy(AuthStrategy):
    """
    Bearer token (JWT) authentication.
    """
    
    async def authenticate(self, request: Request) -> Optional[dict]:
        """
        Authenticate using Bearer token.
        
        Args:
            request: FastAPI request
        
        Returns:
            User data if authenticated
        """
        # Get Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None
        
        # Check format
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        
        token = parts[1]
        
        # Check blacklist
        if await token_blacklist.is_blacklisted(token):
            raise TokenExpiredException()
        
        # Decode token
        try:
            payload = decode_access_token(token)
            
            # Check expiration
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
                raise TokenExpiredException()
            
            return payload
        
        except JWTError as e:
            logger.warning(f"Invalid JWT token: {e}")
            raise InvalidTokenException()


class APIKeyStrategy(AuthStrategy):
    """
    API key authentication.
    """
    
    async def authenticate(self, request: Request) -> Optional[dict]:
        """
        Authenticate using API key.
        
        Args:
            request: FastAPI request
        
        Returns:
            User data if authenticated
        """
        # Check header
        api_key = request.headers.get("X-API-Key")
        
        # Check query parameter (less secure, but convenient)
        if not api_key:
            api_key = request.query_params.get("api_key")
        
        if not api_key:
            return None
        
        # Verify API key
        user_data = await verify_api_key(api_key)
        if not user_data:
            raise UnauthorizedException("Invalid API key")
        
        return user_data


class CookieStrategy(AuthStrategy):
    """
    Cookie-based authentication.
    """
    
    async def authenticate(self, request: Request) -> Optional[dict]:
        """
        Authenticate using session cookie.
        
        Args:
            request: FastAPI request
        
        Returns:
            User data if authenticated
        """
        # Get session cookie
        token = request.cookies.get(settings.SESSION_COOKIE_NAME)
        if not token:
            return None
        
        # Check blacklist
        if await token_blacklist.is_blacklisted(token):
            raise TokenExpiredException()
        
        # Decode token
        try:
            payload = decode_access_token(token)
            
            # Check expiration
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
                raise TokenExpiredException()
            
            return payload
        
        except JWTError as e:
            logger.warning(f"Invalid session token: {e}")
            raise InvalidTokenException()


# =============================================================================
# AUTHENTICATOR
# =============================================================================

class Authenticator:
    """
    Multi-strategy authenticator.
    """
    
    def __init__(self):
        """Initialize authenticator with strategies."""
        self.strategies = [
            BearerTokenStrategy(),
            APIKeyStrategy(),
            CookieStrategy(),
        ]
    
    async def authenticate(self, request: Request) -> Optional[dict]:
        """
        Try all authentication strategies.
        
        Args:
            request: FastAPI request
        
        Returns:
            User data if authenticated, None otherwise
        """
        for strategy in self.strategies:
            try:
                user_data = await strategy.authenticate(request)
                if user_data:
                    return user_data
            except (UnauthorizedException, TokenExpiredException, InvalidTokenException):
                # Re-raise auth exceptions
                raise
            except Exception as e:
                # Log unexpected errors but continue to next strategy
                logger.error(f"Authentication strategy failed: {e}", exc_info=True)
                continue
        
        return None


# =============================================================================
# PERMISSION CHECKER
# =============================================================================

class PermissionChecker:
    """
    Check user permissions for endpoints.
    """
    
    @staticmethod
    def has_permission(
        user_data: dict,
        required_roles: Optional[List[str]] = None,
        required_permissions: Optional[List[str]] = None
    ) -> bool:
        """
        Check if user has required permissions.
        
        Args:
            user_data: User data from token
            required_roles: Required roles
            required_permissions: Required permissions
        
        Returns:
            True if user has permission
        """
        # Super admin bypass
        if user_data.get("is_superuser"):
            return True
        
        # Check roles
        if required_roles:
            user_roles = user_data.get("roles", [])
            if not any(role in user_roles for role in required_roles):
                return False
        
        # Check permissions
        if required_permissions:
            user_permissions = user_data.get("permissions", [])
            if not all(perm in user_permissions for perm in required_permissions):
                return False
        
        return True


# =============================================================================
# ROUTE CONFIG
# =============================================================================

class RouteConfig:
    """
    Route-specific authentication configuration.
    """
    
    def __init__(self):
        """Initialize route configuration."""
        # Public routes (no auth required)
        self.public_routes = {
            "/",
            "/health",
            "/health/ready",
            "/health/live",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
        }
        
        # Optional auth routes (auth if provided, but not required)
        self.optional_auth_routes = {
            "/api/funnels/public",
            "/api/templates/public",
        }
        
        # Role-based access control
        self.role_requirements = {
            "/api/admin": ["admin", "superuser"],
            "/api/users": ["admin", "superuser"],
        }
        
        # Permission-based access control
        self.permission_requirements = {
            "/api/billing": ["manage_billing"],
            "/api/integrations": ["manage_integrations"],
        }
    
    def is_public_route(self, path: str) -> bool:
        """
        Check if route is public.
        
        Args:
            path: Request path
        
        Returns:
            True if public
        """
        # Exact match
        if path in self.public_routes:
            return True
        
        # Prefix match for static files, etc.
        if path.startswith("/static"):
            return True
        
        return False
    
    def is_optional_auth_route(self, path: str) -> bool:
        """
        Check if route has optional authentication.
        
        Args:
            path: Request path
        
        Returns:
            True if optional auth
        """
        return any(path.startswith(route) for route in self.optional_auth_routes)
    
    def get_required_roles(self, path: str) -> Optional[List[str]]:
        """
        Get required roles for route.
        
        Args:
            path: Request path
        
        Returns:
            Required roles or None
        """
        for route_prefix, roles in self.role_requirements.items():
            if path.startswith(route_prefix):
                return roles
        return None
    
    def get_required_permissions(self, path: str) -> Optional[List[str]]:
        """
        Get required permissions for route.
        
        Args:
            path: Request path
        
        Returns:
            Required permissions or None
        """
        for route_prefix, permissions in self.permission_requirements.items():
            if path.startswith(route_prefix):
                return permissions
        return None


# =============================================================================
# MIDDLEWARE
# =============================================================================

class AuthMiddleware(BaseHTTPMiddleware):
    """
    Authentication middleware.
    """
    
    def __init__(self, app: ASGIApp):
        """
        Initialize middleware.
        
        Args:
            app: ASGI application
        """
        super().__init__(app)
        self.authenticator = Authenticator()
        self.permission_checker = PermissionChecker()
        self.route_config = RouteConfig()
    
    async def dispatch(self, request: Request, call_next: Callable):
        """
        Process request with authentication.
        
        Args:
            request: FastAPI request
            call_next: Next middleware/handler
        
        Returns:
            Response
        """
        path = request.url.path
        
        # Skip public routes
        if self.route_config.is_public_route(path):
            return await call_next(request)
        
        # Try to authenticate
        try:
            user_data = await self.authenticator.authenticate(request)
            
            # Optional auth routes
            if self.route_config.is_optional_auth_route(path):
                if user_data:
                    self._set_user_context(request, user_data)
                return await call_next(request)
            
            # Require authentication for non-public routes
            if not user_data:
                return self._unauthorized_response()
            
            # Set user context
            self._set_user_context(request, user_data)
            
            # Check role-based access
            required_roles = self.route_config.get_required_roles(path)
            if required_roles:
                if not self.permission_checker.has_permission(user_data, required_roles=required_roles):
                    return self._forbidden_response("Insufficient role privileges")
            
            # Check permission-based access
            required_permissions = self.route_config.get_required_permissions(path)
            if required_permissions:
                if not self.permission_checker.has_permission(user_data, required_permissions=required_permissions):
                    return self._forbidden_response("Insufficient permissions")
            
            # Log authenticated request
            logger.debug(
                f"Authenticated request: {request.method} {path}",
                extra={
                    "user_id": user_data.get("sub"),
                    "email": user_data.get("email"),
                    "roles": user_data.get("roles", []),
                }
            )
            
            return await call_next(request)
        
        except (UnauthorizedException, TokenExpiredException, InvalidTokenException) as e:
            logger.warning(f"Authentication failed: {e.message}")
            return self._unauthorized_response(e.message)
        
        except Exception as e:
            logger.error(f"Authentication error: {e}", exc_info=True)
            return self._error_response()
    
    def _set_user_context(self, request: Request, user_data: dict):
        """
        Set user context on request.
        
        Args:
            request: FastAPI request
            user_data: User data from token
        """
        request.state.user_id = user_data.get("sub")
        request.state.user_email = user_data.get("email")
        request.state.user_roles = user_data.get("roles", [])
        request.state.user_permissions = user_data.get("permissions", [])
        request.state.is_authenticated = True
        
        # Set user ID in context var for logging
        user_id_var.set(user_data.get("sub"))
    
    def _unauthorized_response(self, message: str = "Authentication required") -> JSONResponse:
        """
        Return unauthorized response.
        
        Args:
            message: Error message
        
        Returns:
            JSON response
        """
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": "UNAUTHORIZED",
                "message": message,
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    def _forbidden_response(self, message: str = "Access forbidden") -> JSONResponse:
        """
        Return forbidden response.
        
        Args:
            message: Error message
        
        Returns:
            JSON response
        """
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error": "FORBIDDEN",
                "message": message,
            },
        )
    
    def _error_response(self) -> JSONResponse:
        """
        Return internal error response.
        
        Returns:
            JSON response
        """
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "INTERNAL_ERROR",
                "message": "An authentication error occurred",
            },
        )


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def logout_user(token: str, expires_at: datetime):
    """
    Logout user by blacklisting token.
    
    Args:
        token: JWT token to blacklist
        expires_at: Token expiration time
    """
    await token_blacklist.add(token, expires_at)


def get_current_user(request: Request) -> Optional[dict]:
    """
    Get current authenticated user from request.
    
    Args:
        request: FastAPI request
    
    Returns:
        User data or None
    """
    if not getattr(request.state, "is_authenticated", False):
        return None
    
    return {
        "user_id": request.state.user_id,
        "email": request.state.user_email,
        "roles": request.state.user_roles,
        "permissions": request.state.user_permissions,
    }

def get_optional_user(request: Request) -> Optional[dict]:
    """
    Get current authenticated user from request state (optional).
    
    Args:
        request: FastAPI request
    
    Returns:
        User data dict or None if not authenticated
    """
    if not getattr(request.state, "is_authenticated", False):
        return None
    
    return {
        "user_id": request.state.user_id,
        "email": request.state.user_email,
        "roles": request.state.user_roles,
        "permissions": request.state.user_permissions,
    }

def require_roles(roles: List[str]):
    """
    Decorator to require specific roles.
    
    Args:
        roles: Required roles
    
    Returns:
        Decorator function
    """
    def decorator(func):
        func._required_roles = roles
        return func
    return decorator


def require_permissions(permissions: List[str]):
    """
    Decorator to require specific permissions.
    
    Args:
        permissions: Required permissions
    
    Returns:
        Decorator function
    """
    def decorator(func):
        func._required_permissions = permissions
        return func
    return decorator


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "AuthMiddleware",
    "Authenticator",
    "TokenBlacklist",
    "token_blacklist",
    "PermissionChecker",
    "RouteConfig",
    "logout_user",
    "get_current_user",
    "require_roles",
    "require_permissions",
]
