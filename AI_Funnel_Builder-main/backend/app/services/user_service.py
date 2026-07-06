# =============================================================================
# AI FUNNEL BUILDER - USER SERVICE (PRODUCTION GRADE)
# =============================================================================
# User management business logic with eager loading support
# =============================================================================

import enum
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified

from app.models.user import User
from app.models.funnel import Funnel
from app.models.response import Response
from app.schemas.user import (
    UserUpdate,
    UserResponse,
    UserPreferencesUpdate,
    PasswordChangeRequest,
)
from app.utils.exceptions import (
    NotFoundException,
    ValidationException,
    ConflictException,
    UserNotFoundException,
)
from app.utils.logger import get_logger
from app.utils.helpers import generate_api_key, hash_api_key
from app.utils.validators import validate_email
from app.core.security import get_password_hash, verify_password

logger = get_logger(__name__)


# =============================================================================
# USER SERVICE
# =============================================================================

class UserService:
    """
    User management service with production-grade features.
    Supports eager loading, GDPR compliance, and comprehensive data management.
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize user service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    # =========================================================================
    # USER CRUD
    # =========================================================================
    
    async def get_user_by_id(
        self,
        user_id: str,
        include_funnels: bool = False,
        include_projects: bool = False,
        include_events: bool = False,
    ) -> User:
        """
        Get user by ID with optional eager loading.
        ✅ FIXED: Now supports eager loading with selectinload
        
        Args:
            user_id: User ID
            include_funnels: Eager load funnels (recommended for performance)
            include_projects: Eager load projects
            include_events: Eager load events
        
        Returns:
            User object
        
        Raises:
            UserNotFoundException: If user not found or inactive/deleted
        """
        query = (
            select(User)
            .where(
                User.user_id == user_id,
                User.is_active == True,
                User.is_deleted == False,
            )
        )
        
        # ✅ FIXED: Eager loading now works with lazy='select'
        if include_funnels:
            query = query.options(selectinload(User.funnels))
        
        if include_projects:
            query = query.options(selectinload(User.projects))
        
        if include_events:
            query = query.options(selectinload(User.events))
        
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            raise UserNotFoundException(user_id)
        
        # ✅ FIXED: Ensure JSONB fields are initialized
        if user.settings is None:
            user.settings = {}
        if user.user_metadata is None:
            user.user_metadata = {}
        
        return user
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email.
        
        Args:
            email: User email
        
        Returns:
            User or None
        """
        result = await self.db.execute(
            select(User)
            .where(User.email == email.lower())
            .where(User.is_deleted == False)
        )
        return result.scalar_one_or_none()
    
    async def update_user(
        self,
        user_id: str,
        data: UserUpdate
    ) -> User:
        """
        Update user profile.
        
        Args:
            user_id: User ID
            data: Update data
        
        Returns:
            Updated user
        
        Raises:
            UserNotFoundException: If user not found
            ConflictException: If email already exists
        """
        user = await self.get_user_by_id(user_id)
        
        # Check if email is being changed
        if data.email and data.email.lower() != user.email:
            # Validate new email
            new_email = validate_email(data.email)
            
            # Check if email already exists
            existing_user = await self.get_user_by_email(new_email)
            if existing_user:
                raise ConflictException(
                    message="Email address already in use",
                    conflicting_field="email"
                )
            
            # Update email and mark as unverified
            user.email = new_email
            user.is_email_verified = False
            user.email_verified_at = None
            
            logger.info(
                f"User email changed: {user_id}",
                extra={"user_id": user_id, "new_email": new_email}
            )
        
        # Update other fields
        if data.full_name is not None:
            user.full_name = data.full_name
        
        if data.avatar_url is not None:
            user.avatar_url = data.avatar_url
        
        if data.bio is not None:
            user.bio = data.bio
        
        if data.phone is not None:
            user.phone = data.phone
        
        if data.timezone is not None:
            user.timezone = data.timezone
        
        if data.language is not None:
            user.language = data.language
        
        if data.company_name is not None:
            user.company_name = data.company_name
        
        if data.website is not None:
            user.website = data.website
        
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(
            f"User profile updated: {user.email}",
            extra={"user_id": user_id, "email": user.email}
        )
        
        return user
    
    async def delete_user(
        self,
        user_id: str,
        hard_delete: bool = False
    ) -> bool:
        """
        Delete user account.
        
        Args:
            user_id: User ID
            hard_delete: Permanently delete (GDPR compliance)
        
        Returns:
            True if deleted
        
        Raises:
            UserNotFoundException: If user not found
        """
        user = await self.get_user_by_id(user_id)
        
        if hard_delete:
            # Permanently delete user and all data
            await self.db.delete(user)
            
            logger.warning(
                f"User permanently deleted: {user.email}",
                extra={"user_id": user_id, "email": user.email}
            )
        else:
            # Soft delete (keep for audit)
            user.is_deleted = True
            user.deleted_at = datetime.now(timezone.utc)
            user.is_active = False
            
            logger.info(
                f"User soft deleted: {user.email}",
                extra={"user_id": user_id, "email": user.email}
            )
        
        await self.db.commit()
        
        return True
    
    # =========================================================================
    # USER PREFERENCES
    # =========================================================================
    
    async def update_preferences(
        self,
        user_id: str,
        data: UserPreferencesUpdate
    ) -> User:
        """
        Update user preferences.
        ✅ FIXED: Properly handles JSONB column updates
        
        Args:
            user_id: User ID
            data: Preference updates
        
        Returns:
            Updated user
        """
        user = await self.get_user_by_id(user_id)
        
        if user.settings is None:
            user.settings = {}
        
        # Notification preferences
        if data.email_notifications is not None:
            user.settings["email_notifications"] = data.email_notifications
        if data.product_updates is not None:
            user.settings["product_updates"] = data.product_updates
        if data.marketing_emails is not None:
            user.settings["marketing_emails"] = data.marketing_emails
        if data.in_app_notifications is not None:
            user.settings["in_app_notifications"] = data.in_app_notifications
        
        # UI / locale
        if data.locale is not None:
            user.settings["locale"] = data.locale
        if data.timezone is not None:
            user.settings["timezone"] = data.timezone
        if data.theme is not None:
            user.settings["theme"] = data.theme
        
        # Privacy / tracking
        if data.tracking_consent is not None:
            user.settings["tracking_consent"] = data.tracking_consent
        if data.personalized_recommendations is not None:
            user.settings["personalized_recommendations"] = data.personalized_recommendations
        
        # Extra preferences
        if data.extra_preferences:
            user.settings.update(data.extra_preferences)
        
        # ✅ CRITICAL: Tell SQLAlchemy that JSONB column was modified
        flag_modified(user, "settings")
        
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(
            f"User preferences updated: {user.email}",
            extra={"user_id": user_id}
        )
        
        return user
    
    # =========================================================================
    # AVATAR MANAGEMENT
    # =========================================================================
    
    async def update_avatar(
        self,
        user_id: str,
        avatar_url: str
    ) -> User:
        """
        Update user avatar.
        
        Args:
            user_id: User ID
            avatar_url: New avatar URL
        
        Returns:
            Updated user
        """
        user = await self.get_user_by_id(user_id)
        
        old_avatar_url = user.avatar_url
        user.avatar_url = avatar_url
        
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(
            f"User avatar updated: {user.email}",
            extra={
                "user_id": user_id,
                "old_avatar": old_avatar_url,
                "new_avatar": avatar_url
            }
        )
        
        return user
    
    async def delete_avatar(self, user_id: str) -> User:
        """
        Delete user avatar.
        
        Args:
            user_id: User ID
        
        Returns:
            Updated user
        """
        user = await self.get_user_by_id(user_id)
        
        old_avatar_url = user.avatar_url
        user.avatar_url = None
        
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(
            f"User avatar deleted: {user.email}",
            extra={"user_id": user_id, "old_avatar": old_avatar_url}
        )
        
        return user
    
    # =========================================================================
    # API KEY MANAGEMENT
    # =========================================================================
    
    async def generate_api_key(
        self,
        user_id: str,
        name: Optional[str] = None
    ) -> str:
        """
        Generate API key for user.
        
        Args:
            user_id: User ID
            name: Optional key name
        
        Returns:
            API key (plain text, only shown once)
        """
        user = await self.get_user_by_id(user_id)
        
        # Generate API key
        api_key = generate_api_key(prefix="sk", length=32)
        
        # Hash for storage
        api_key_hash = hash_api_key(api_key)
        
        # Store hashed key
        if not user.api_keys:
            user.api_keys = []
        
        user.api_keys.append({
            "name": name or f"API Key {len(user.api_keys) + 1}",
            "key_hash": api_key_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_used": None,
        })
        
        # Mark JSONB as modified
        flag_modified(user, "api_keys")
        
        await self.db.commit()
        
        logger.info(
            f"API key generated: {user.email}",
            extra={"user_id": user_id, "key_name": name}
        )
        
        return api_key
    
    async def revoke_api_key(
        self,
        user_id: str,
        key_hash: str
    ) -> bool:
        """
        Revoke API key.
        
        Args:
            user_id: User ID
            key_hash: API key hash
        
        Returns:
            True if revoked
        """
        user = await self.get_user_by_id(user_id)
        
        if not user.api_keys:
            return False
        
        # Remove key from list
        user.api_keys = [
            key for key in user.api_keys
            if key.get("key_hash") != key_hash
        ]
        
        flag_modified(user, "api_keys")
        
        await self.db.commit()
        
        logger.info(
            f"API key revoked: {user.email}",
            extra={"user_id": user_id}
        )
        
        return True
    
    # =========================================================================
    # USER SEARCH & LISTING
    # =========================================================================
    
    async def search_users(
        self,
        query: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
        include_inactive: bool = False
    ) -> List[User]:
        """
        Search and list users.
        
        Args:
            query: Search query (email or name)
            limit: Maximum results
            offset: Result offset
            include_inactive: Include inactive users
        
        Returns:
            List of users
        """
        stmt = select(User)
        
        # Filter by query
        if query:
            search_term = f"%{query}%"
            stmt = stmt.where(
                or_(
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term)
                )
            )
        
        # Filter by active status
        if not include_inactive:
            stmt = stmt.where(User.is_active == True)
        
        # Exclude deleted
        stmt = stmt.where(User.is_deleted == False)
        
        # Order and paginate
        stmt = stmt.order_by(User.created_at.desc())
        stmt = stmt.limit(limit).offset(offset)
        
        result = await self.db.execute(stmt)
        users = result.scalars().all()
        
        return list(users)
    
    async def get_user_count(
        self,
        include_inactive: bool = False
    ) -> int:
        """
        Get total user count.
        
        Args:
            include_inactive: Include inactive users
        
        Returns:
            User count
        """
        stmt = select(func.count(User.user_id))
        
        if not include_inactive:
            stmt = stmt.where(User.is_active == True)
        
        stmt = stmt.where(User.is_deleted == False)
        
        result = await self.db.execute(stmt)
        count = result.scalar_one()
        
        return count
    
    # =========================================================================
    # ACCOUNT SETTINGS
    # =========================================================================
    
    async def deactivate_account(self, user_id: str) -> User:
        """
        Deactivate user account (reversible).
        
        Args:
            user_id: User ID
        
        Returns:
            Updated user
        """
        user = await self.get_user_by_id(user_id)
        
        user.is_active = False
        
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(
            f"User account deactivated: {user.email}",
            extra={"user_id": user_id}
        )
        
        return user
    
    async def reactivate_account(self, user_id: str) -> User:
        """
        Reactivate user account.
        
        Args:
            user_id: User ID
        
        Returns:
            Updated user
        """
        user = await self.get_user_by_id(user_id)
        
        user.is_active = True
        
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(
            f"User account reactivated: {user.email}",
            extra={"user_id": user_id}
        )
        
        return user
    
    # =========================================================================
    # DATA EXPORT (GDPR COMPLIANCE)
    # =========================================================================
    
    async def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """
        Export all user data (GDPR compliance).
        ✅ FIXED: Uses eager loading for performance
        
        Args:
            user_id: User ID
        
        Returns:
            Complete user data dictionary
        """
        # ✅ FIXED: Eager load funnels for better performance
        user = await self.get_user_by_id(user_id, include_funnels=True)
        
        # Get funnels (already loaded via eager loading)
        funnels = list(user.funnels) if hasattr(user, 'funnels') else []
        
        # Get responses
        response_query = (
            select(Response)
            .join(Funnel, Response.funnel_id == Funnel.funnel_id)
            .where(Funnel.user_id == user_id)
            .order_by(Response.created_at.desc())
        )
        response_result = await self.db.execute(response_query)
        responses = response_result.scalars().all()
        
        # Get leads (if available)
        leads = []
        try:
            from app.models.lead import Lead
            lead_query = (
                select(Lead)
                .where(Lead.user_id == user_id)
                .order_by(Lead.created_at.desc())
            )
            lead_result = await self.db.execute(lead_query)
            leads = lead_result.scalars().all()
        except (ImportError, Exception) as e:
            logger.warning(f"Could not load leads: {e}")
        
        # Get events (limited)
        events = []
        try:
            from app.models.event import Event
            event_query = (
                select(Event)
                .where(Event.user_id == user_id)
                .order_by(Event.created_at.desc())
                .limit(1000)
            )
            event_result = await self.db.execute(event_query)
            events = event_result.scalars().all()
        except ImportError:
            pass
        
        # Get campaigns
        campaigns = []
        try:
            from app.models.campaign import Campaign
            campaign_query = (
                select(Campaign)
                .where(Campaign.user_id == user_id)
                .order_by(Campaign.created_at.desc())
            )
            campaign_result = await self.db.execute(campaign_query)
            campaigns = campaign_result.scalars().all()
        except ImportError:
            pass
        
        # Get integrations
        integrations = []
        try:
            from app.models.integration import Integration
            integration_query = (
                select(Integration)
                .where(Integration.user_id == user_id)
            )
            integration_result = await self.db.execute(integration_query)
            integrations = integration_result.scalars().all()
        except ImportError:
            pass
        
        # ✅ FIXED: Proper timezone-aware datetime handling
        export_time = datetime.now(timezone.utc)
        created_at = user.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        account_age_days = (export_time - created_at).days
        
        # Build comprehensive export
        data = {
            "export_metadata": {
                "exported_at": export_time.isoformat(),
                "export_version": "2.0",
                "user_id": user_id,
                "export_type": "full_gdpr_export",
            },
            
            # User profile
            "user": {
                "user_id": user.user_id,
                "email": user.email,
                "full_name": user.full_name,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
                "bio": user.bio,
                "website": user.website,
                "user_type": user.user_type.value if isinstance(user.user_type, enum.Enum) else user.user_type,
                "subscription_tier": user.subscription_tier.value if isinstance(user.subscription_tier, enum.Enum) else user.subscription_tier,
                "subscription_started_at": user.subscription_started_at.isoformat() if user.subscription_started_at else None,
                "subscription_expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
                "stripe_customer_id": user.stripe_customer_id,
                "company_name": user.company_name,
                "company_size": user.company_size,
                "industry": user.industry,
                "is_active": user.is_active,
                "is_email_verified": user.is_email_verified,
                "email_verified_at": user.email_verified_at.isoformat() if user.email_verified_at else None,
                "is_banned": user.is_banned,
                "banned_at": user.banned_at.isoformat() if user.banned_at else None,
                "ban_reason": user.ban_reason,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "login_count": user.login_count,
                "last_active_at": user.last_active_at.isoformat() if user.last_active_at else None,
                "referral_code": user.referral_code,
                "referred_by": user.referred_by,
                "utm_source": user.utm_source,
                "utm_campaign": user.utm_campaign,
                "registration_ip": user.registration_ip,
                "oauth_provider": user.oauth_provider.value if user.oauth_provider else None,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat(),
            },
            
            # Settings & preferences
            "settings": user.settings or {},
            "user_metadata": user.user_metadata or {},
            
            # Funnels
            "funnels": [
                {
                    "funnel_id": f.funnel_id,
                    "title": f.title,
                    "slug": f.slug,
                    "description": f.description,
                    "niche": getattr(f, 'niche', None),
                    "primary_goal": getattr(f, 'primary_goal', None),
                    "funnel_type": getattr(f, 'funnel_type', None),
                    "visibility": getattr(f, 'visibility', None),
                    "status": getattr(f, 'status', None),
                    "language": getattr(f, 'language', None),
                    "is_published": getattr(f, 'is_published', False),
                    "published_at": f.published_at.isoformat() if hasattr(f, 'published_at') and f.published_at else None,
                    "views": getattr(f, 'views', 0),
                    "starts": getattr(f, 'starts', 0),
                    "completes": getattr(f, 'completes', 0),
                    "conversion_rate": getattr(f, 'conversion_rate', 0.0),
                    "tags": getattr(f, 'tags', []),
                    "theme": getattr(f, 'theme', {}),
                    "layout": getattr(f, 'layout', {}),
                    "seo": getattr(f, 'seo', {}),
                    "config": getattr(f, 'config', {}),
                    "created_at": f.created_at.isoformat() if hasattr(f, 'created_at') else None,
                    "updated_at": f.updated_at.isoformat() if hasattr(f, 'updated_at') else None,
                }
                for f in funnels
            ],
            
            # Responses
            "responses": [
                {
                    "response_id": r.response_id,
                    "funnel_id": r.funnel_id,
                    "session_id": getattr(r, 'session_id', None),
                    "status": getattr(r, 'status', None),
                    "answers": getattr(r, 'answers', {}),
                    "score": getattr(r, 'score', None),
                    "completion_time": getattr(r, 'completion_time', None),
                    "started_at": r.created_at.isoformat() if hasattr(r, 'created_at') else None,
                    "completed_at": r.completed_at.isoformat() if hasattr(r, 'completed_at') and r.completed_at else None,
                }
                for r in responses
            ],
            
            # Leads
            "leads": [
                {
                    "lead_id": getattr(l, 'lead_id', None),
                    "funnel_id": getattr(l, 'funnel_id', None),
                    "email": getattr(l, 'email', None),
                    "name": getattr(l, 'name', None),
                    "phone": getattr(l, 'phone', None),
                    "status": getattr(l, 'status', None),
                    "source": getattr(l, 'source', None),
                    "tags": getattr(l, 'tags', []),
                    "custom_fields": getattr(l, 'custom_fields', {}),
                    "created_at": l.created_at.isoformat() if hasattr(l, 'created_at') else None,
                }
                for l in leads
            ],
            
            # Events (limited)
            "events": [
                {
                    "event_id": getattr(e, 'event_id', None),
                    "event_type": getattr(e, 'event_type', None),
                    "event_data": getattr(e, 'event_data', {}),
                    "ip_address": getattr(e, 'ip_address', None),
                    "user_agent": getattr(e, 'user_agent', None),
                    "created_at": e.created_at.isoformat() if hasattr(e, 'created_at') else None,
                }
                for e in events
            ],
            
            # Campaigns
            "campaigns": [
                {
                    "campaign_id": getattr(c, 'campaign_id', None),
                    "name": getattr(c, 'name', None),
                    "status": getattr(c, 'status', None),
                    "campaign_type": getattr(c, 'campaign_type', None),
                    "target_audience": getattr(c, 'target_audience', {}),
                    "created_at": c.created_at.isoformat() if hasattr(c, 'created_at') else None,
                }
                for c in campaigns
            ],
            
            # Integrations
            "integrations": [
                {
                    "integration_id": getattr(i, 'integration_id', None),
                    "provider": getattr(i, 'provider', None),
                    "status": getattr(i, 'status', None),
                    "config": getattr(i, 'config', {}),
                    "created_at": i.created_at.isoformat() if hasattr(i, 'created_at') else None,
                }
                for i in integrations
            ],
            
            # Statistics
            "statistics": {
                "total_funnels": len(funnels),
                "total_published_funnels": sum(1 for f in funnels if getattr(f, 'is_published', False)),
                "total_responses": len(responses),
                "total_leads": len(leads),
                "total_events": len(events),
                "total_campaigns": len(campaigns),
                "total_integrations": len(integrations),
                "total_views": sum(getattr(f, 'views', 0) for f in funnels),
                "total_starts": sum(getattr(f, 'starts', 0) for f in funnels),
                "total_completes": sum(getattr(f, 'completes', 0) for f in funnels),
                "account_age_days": account_age_days,
            },
        }
        
        logger.info(
            f"GDPR data export completed for user: {user.email}",
            extra={
                "user_id": user_id,
                "funnels_count": len(funnels),
                "responses_count": len(responses),
                "leads_count": len(leads),
            }
        )
        
        return data
    
    # =========================================================================
    # ACTIVITY TRACKING
    # =========================================================================
    
    async def update_last_active(self, user_id: str):
        """
        Update user's last active timestamp.
        
        Args:
            user_id: User ID
        """
        await self.db.execute(
            update(User)
            .where(User.user_id == user_id)
            .values(last_active_at=datetime.now(timezone.utc))
        )
        await self.db.commit()
    
    # =========================================================================
    # STATISTICS
    # =========================================================================
    
    async def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive user statistics.
        ✅ FIXED: Proper timezone handling and actual DB counts
        
        Args:
            user_id: User ID
        
        Returns:
            User statistics dictionary
        """
        user = await self.get_user_by_id(user_id)
        
        # ✅ FIXED: Handle timezone-aware datetime
        created_at = user.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        account_age_days = (datetime.now(timezone.utc) - created_at).days
        
        # ✅ FIXED: Get actual funnel count from DB
        funnel_count_query = select(func.count(Funnel.funnel_id)).where(
            Funnel.user_id == user_id
        )
        funnel_count_result = await self.db.execute(funnel_count_query)
        funnels_count = funnel_count_result.scalar() or 0
        
        # ✅ FIXED: Get total responses (leads)
        response_count_query = (
            select(func.count(Response.response_id))
            .join(Funnel, Response.funnel_id == Funnel.funnel_id)
            .where(Funnel.user_id == user_id)
        )
        response_count_result = await self.db.execute(response_count_query)
        total_responses = response_count_result.scalar() or 0
        
        # ✅ FIXED: Get total views
        total_views = 0
        if hasattr(Funnel, 'views'):
            views_query = select(func.sum(Funnel.views)).where(
                Funnel.user_id == user_id
            )
            views_result = await self.db.execute(views_query)
            total_views = views_result.scalar() or 0
        
        stats = {
            "funnels_count": funnels_count,
            "leads_count": total_responses,
            "responses_count": total_responses,
            "total_views": total_views,
            "account_age_days": account_age_days,
            "email_verified": user.is_email_verified,
            "subscription_tier": user.subscription_tier.value if hasattr(user.subscription_tier, 'value') else user.subscription_tier,
            "is_active": user.is_active,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "login_count": user.login_count,
        }
        
        return stats


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["UserService"]
