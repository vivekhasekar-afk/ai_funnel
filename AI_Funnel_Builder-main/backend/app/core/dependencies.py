# =============================================================================
# AI FUNNEL BUILDER - DEPENDENCY INJECTION
# =============================================================================
# FastAPI dependencies for authentication, authorization, and utilities
# =============================================================================

from typing import Optional, List, Callable
from datetime import datetime

from fastapi import Depends, HTTPException, status, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_token, is_token_blacklisted, TokenPayload
from app.core.config import settings
from app.models.user import User

# =============================================================================
# SECURITY SCHEMES
# =============================================================================

# Bearer token security scheme
security = HTTPBearer()


# =============================================================================
# AUTHENTICATION DEPENDENCIES
# =============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        credentials: Bearer token from Authorization header
        db: Database session
    
    Returns:
        User object
    
    Raises:
        HTTPException: 401 if token is invalid or user not found
    
    Usage:
        @router.get("/me")
        async def get_me(current_user: User = Depends(get_current_user)):
            return current_user
    """
    # Extract token from credentials
    token = credentials.credentials
    
    # Check if token is blacklisted (user logged out)
    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Decode and validate token
    payload: TokenPayload = decode_token(token)
    
    # Verify it's an access token
    if payload.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user_id = payload.sub
    result = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        print(f"DEBUG: User {payload.sub} NOT FOUND in DB")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        print(f"DEBUG: User {user.email} is INACTIVE")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )
    
    # Update last login timestamp
    user.last_login = datetime.utcnow()
    await db.commit()
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and verify they're active.
    
    This is an alias for get_current_user (already checks is_active).
    Kept for semantic clarity in route definitions.
    """
    return current_user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise.
    
    Useful for endpoints that work both authenticated and unauthenticated.
    
    Usage:
        @router.get("/public-data")
        async def get_data(user: Optional[User] = Depends(get_optional_current_user)):
            if user:
                # Return personalized data
            else:
                # Return public data
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


# =============================================================================
# ROLE-BASED ACCESS CONTROL
# =============================================================================

class PermissionChecker:
    """
    Dependency class to check user permissions.
    
    Usage:
        require_creator = PermissionChecker(allowed_roles=["creator"])
        
        @router.post("/funnels")
        async def create_funnel(user: User = Depends(require_creator)):
            ...
    """
    
    def __init__(
        self,
        allowed_roles: Optional[List[str]] = None,
        allowed_tiers: Optional[List[str]] = None,
    ):
        self.allowed_roles = allowed_roles or []
        self.allowed_tiers = allowed_tiers or []
    
    async def __call__(
        self,
        current_user: User = Depends(get_current_user)
    ) -> User:
        """Check if user has required role or subscription tier."""
        
        # Check role
        if self.allowed_roles and current_user.user_type not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(self.allowed_roles)}",
            )
        
        # Check subscription tier
        if self.allowed_tiers and current_user.subscription_tier not in self.allowed_tiers:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Upgrade required. Required tier: {', '.join(self.allowed_tiers)}",
            )
        
        return current_user


# Pre-configured permission checkers
require_creator = PermissionChecker(allowed_roles=["creator", "admin"])
require_brand = PermissionChecker(allowed_roles=["brand", "admin"])
require_admin = PermissionChecker(allowed_roles=["admin"])
require_pro_tier = PermissionChecker(allowed_tiers=["pro", "enterprise"])
require_any_paid_tier = PermissionChecker(allowed_tiers=["pro", "enterprise", "brand_starter"])


# =============================================================================
# QUOTA VALIDATION
# =============================================================================

class QuotaChecker:
    """
    Check if user has quota remaining for a resource.
    
    Usage:
        check_funnel_quota = QuotaChecker(resource="funnels")
        
        @router.post("/funnels")
        async def create_funnel(
            user: User = Depends(check_funnel_quota),
            db: AsyncSession = Depends(get_db)
        ):
            ...
    """
    
    def __init__(self, resource: str):
        """
        Args:
            resource: Resource type (funnels, responses, leads_export)
        """
        self.resource = resource
    
    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        """Check quota for resource."""
        
        # Get quota limit for user's tier
        quota_limit = settings.get_quota(
            current_user.subscription_tier,
            self.resource
        )
        
        # -1 means unlimited
        if quota_limit == -1:
            return current_user
        
        # Count user's current usage
        current_usage = await self._get_current_usage(current_user, db)
        
        if current_usage >= quota_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Quota exceeded for {self.resource}. "
                       f"Current: {current_usage}/{quota_limit}. "
                       f"Please upgrade your plan.",
            )
        
        return current_user
    
    async def _get_current_usage(self, user: User, db: AsyncSession) -> int:
        """Get current usage count for the resource."""
        from app.models.funnel import Funnel
        from app.models.response import Response
        
        if self.resource == "funnels":
            result = await db.execute(
                select(Funnel).where(Funnel.user_id == user.user_id)
            )
            return len(result.scalars().all())
        
        elif self.resource == "responses":
            # Count responses for current month
            from sqlalchemy import func, extract
            current_month = datetime.utcnow().month
            current_year = datetime.utcnow().year
            
            result = await db.execute(
                select(func.count(Response.response_id))
                .join(Funnel, Response.funnel_id == Funnel.funnel_id)
                .where(
                    Funnel.user_id == user.user_id,
                    extract('month', Response.created_at) == current_month,
                    extract('year', Response.created_at) == current_year
                )
            )
            return result.scalar() or 0
        
        return 0


# Pre-configured quota checkers
check_funnel_quota = QuotaChecker(resource="funnels")
check_response_quota = QuotaChecker(resource="responses")


# =============================================================================
# PAGINATION
# =============================================================================

class PaginationParams:
    """
    Standard pagination parameters.
    
    Usage:
        @router.get("/items")
        async def get_items(
            pagination: PaginationParams = Depends()
        ):
            skip = pagination.skip
            limit = pagination.limit
    """
    
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number (1-indexed)"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.page_size = page_size
        self.skip = (page - 1) * page_size
        self.limit = page_size
    
    def to_dict(self) -> dict:
        """Convert to dictionary for response metadata."""
        return {
            "page": self.page,
            "page_size": self.page_size,
            "skip": self.skip,
        }


# =============================================================================
# SORTING & FILTERING
# =============================================================================

class SortParams:
    """
    Standard sorting parameters.
    
    Usage:
        @router.get("/items")
        async def get_items(
            sort: SortParams = Depends()
        ):
            order_by = sort.get_order_by_clause(Item)
    """
    
    def __init__(
        self,
        sort_by: Optional[str] = Query(None, description="Field to sort by"),
        sort_order: str = Query(
            "desc",
            regex="^(asc|desc)$",
            description="Sort order (asc/desc)"
        ),
    ):
        self.sort_by = sort_by
        self.sort_order = sort_order
    
    def get_order_by_clause(self, model):
        """
        Get SQLAlchemy order by clause.
        
        Args:
            model: SQLAlchemy model class
        
        Returns:
            Order by clause or None
        """
        if not self.sort_by:
            return None
        
        # Get column from model
        if not hasattr(model, self.sort_by):
            return None
        
        column = getattr(model, self.sort_by)
        
        if self.sort_order == "asc":
            return column.asc()
        else:
            return column.desc()


# =============================================================================
# REQUEST METADATA
# =============================================================================

async def get_request_metadata(request: Request) -> dict:
    """
    Extract metadata from request for tracking/analytics.
    
    Returns:
        Dictionary with IP, user agent, referrer, etc.
    
    Usage:
        @router.post("/track")
        async def track_event(
            metadata: dict = Depends(get_request_metadata)
        ):
            # metadata contains IP, user_agent, etc.
    """
    return {
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "referer": request.headers.get("referer"),
        "origin": request.headers.get("origin"),
        "forwarded_for": request.headers.get("x-forwarded-for"),
        "timestamp": datetime.utcnow(),
    }


# =============================================================================
# FEATURE FLAG CHECKER
# =============================================================================

class FeatureFlag:
    """
    Check if a feature flag is enabled.
    
    Usage:
        require_marketplace = FeatureFlag("FEATURE_TEMPLATE_MARKETPLACE")
        
        @router.get("/templates")
        async def get_templates(
            _: bool = Depends(require_marketplace)
        ):
            ...
    """
    
    def __init__(self, flag_name: str):
        self.flag_name = flag_name
    
    async def __call__(self) -> bool:
        """Check if feature is enabled."""
        is_enabled = getattr(settings, self.flag_name, False)
        
        if not is_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature not available: {self.flag_name}",
            )
        
        return True


# Pre-configured feature flags
require_template_marketplace = FeatureFlag("FEATURE_TEMPLATE_MARKETPLACE")
require_brand_portal = FeatureFlag("FEATURE_BRAND_PORTAL")
require_ab_testing = FeatureFlag("FEATURE_AB_TESTING")
require_webhooks = FeatureFlag("FEATURE_WEBHOOKS")


# =============================================================================
# COMMON QUERY PARAMETERS
# =============================================================================

class CommonQueryParams:
    """
    Common query parameters for list endpoints.
    
    Combines pagination, sorting, and search.
    """
    
    def __init__(
        self,
        pagination: PaginationParams = Depends(),
        sort: SortParams = Depends(),
        search: Optional[str] = Query(None, min_length=1, max_length=100),
    ):
        self.pagination = pagination
        self.sort = sort
        self.search = search


# =============================================================================
# VALIDATOR DEPENDENCIES
# =============================================================================

async def validate_funnel_access(
    funnel_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Validate that user has access to a specific funnel.
    
    Usage:
        @router.get("/funnels/{funnel_id}")
        async def get_funnel(
            funnel: Funnel = Depends(validate_funnel_access)
        ):
            return funnel
    """
    from app.models.funnel import Funnel
    
    result = await db.execute(
        select(Funnel).where(
            Funnel.funnel_id == funnel_id,
            Funnel.user_id == current_user.user_id
        )
    )
    funnel = result.scalar_one_or_none()
    
    if not funnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Funnel not found or access denied"
        )
    
    return funnel


# =============================================================================
# RATE LIMITING (Integration with SlowAPI)
# =============================================================================

def get_user_identifier(request: Request) -> str:
    """
    Get identifier for rate limiting (user ID or IP).
    
    Used by SlowAPI for rate limiting keys.
    """
    # Try to get user from token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = decode_token(token)
            return f"user:{payload.sub}"
        except:
            pass
    
    # Fall back to IP address
    if request.client:
        return f"ip:{request.client.host}"
    
    return "anonymous"


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Authentication
    "get_current_user",
    "get_current_active_user",
    "get_optional_current_user",
    
    # Authorization
    "PermissionChecker",
    "require_creator",
    "require_brand",
    "require_admin",
    "require_pro_tier",
    "require_any_paid_tier",
    
    # Quotas
    "QuotaChecker",
    "check_funnel_quota",
    "check_response_quota",
    
    # Pagination
    "PaginationParams",
    "SortParams",
    "CommonQueryParams",
    
    # Utilities
    "get_request_metadata",
    "validate_funnel_access",
    "get_user_identifier",
    
    # Feature flags
    "FeatureFlag",
    "require_template_marketplace",
    "require_brand_portal",
    "require_ab_testing",
    "require_webhooks",
]
