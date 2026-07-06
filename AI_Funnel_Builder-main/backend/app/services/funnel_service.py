# =============================================================================
# AI FUNNEL BUILDER - FUNNEL SERVICE (FIXED - GROUP_ID ONLY)
# =============================================================================
# Funnel management business logic with Group → Funnel hierarchy
# Project relationship is inherited via FunnelGroup.project_id
# =============================================================================


import copy
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
import uuid
from pydantic import AnyUrl
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, or_, and_
from sqlalchemy.orm import selectinload, joinedload


from app.models.funnel import Funnel, FunnelStatusEnum, FunnelTypeEnum
from app.models.project import Project
from app.models.group import FunnelGroup
from app.models.question import Question
from app.models.template import Template
from app.models.subscription import Subscription
from app.schemas.funnel import (
    FunnelCreate,
    FunnelUpdate,
    FunnelLayoutUpdate,
    FunnelThemeUpdate,
    FunnelSEOUpdate,
    FunnelABTestCreate,
    FunnelPublishRequest,
    FunnelVisibilityEnum,
)


from app.utils.exceptions import (
    NotFoundException,
    ValidationException,
    ForbiddenException,
    FunnelNotFoundException,
    FunnelLimitExceededException,
)
from app.utils.logger import get_logger
from app.utils.validators import generate_slug_from_text
from app.models.event import Event
from app.models.response import Response


logger = get_logger(__name__)


# =============================================================================
# FUNNEL SERVICE
# =============================================================================


class FunnelService:
    """
    Funnel management service with group hierarchy support.
    
    **Hierarchy: Project → Group → Funnel**
    - Funnels belong to Groups via group_id (optional)
    - Project relationship inherited via FunnelGroup.project_id
    - Legacy support: Funnels can exist independently (group_id=NULL)
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize funnel service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    # =========================================================================
    # FUNNEL CRUD
    # =========================================================================
    
    async def create_funnel(
        self,
        user_id: str,
        data: FunnelCreate
    ) -> Funnel:
        """
        Create new funnel with auto-generated slug.
        
        **Hierarchy: Only group_id is stored on Funnel**
        """
        # 1. Check funnel quota
        await self._check_funnel_quota(user_id)
        
        # 2. Verify group ownership if provided
        if data.group_id:
            await self._verify_group_ownership(data.group_id, user_id)
        
        # 3. Generate unique slug from title
        slug = await self._generate_unique_slug(data.title, user_id)
        
        # 4. Create funnel instance (ONLY group_id, no project_id)
        funnel = Funnel(
            user_id=user_id,
            group_id=data.group_id,  # Only FK that exists on Funnel model
            title=data.title,
            slug=slug,
            description=data.description,
            niche=data.niche,
            primary_goal=data.primary_goal,
            funnel_type=data.funnel_type,
            language=data.language or "en",
            status=FunnelStatusEnum.DRAFT,
            
            # Layout & Theme (visual builder support)
            layout=data.layout if hasattr(data, "layout") and data.layout else {},
            theme=data.theme if hasattr(data, "theme") and data.theme else {},
            
            # Config
            config=data.config if hasattr(data, "config") and data.config else {},
            
            # Arrays
            tags=data.tags if hasattr(data, "tags") and data.tags else [],
            target_platforms=data.target_platforms if hasattr(data, "target_platforms") and data.target_platforms else [],
            
            # Initialize metadata
            ai_metadata={"prompt": data.ai_prompt} if hasattr(data, "ai_prompt") and data.ai_prompt else {},
            seo_metadata={"title": data.title, "description": data.description or ""} if data.title else {},
            
            # Init counters
            views_count=0,
            leads_count=0,
            starts_count=0,
            completes_count=0
        )
        
        # Apply theme preset if provided
        if hasattr(data, 'theme_preset') and data.theme_preset:
            funnel.apply_theme_preset(data.theme_preset)
        elif not funnel.theme:
            funnel.apply_theme_preset("modern")
        
        self.db.add(funnel)
        await self.db.commit()
        await self.db.refresh(funnel)
        
        # 5. Increment user's funnel count
        await self._increment_funnel_count(user_id)
        
        logger.info(
            f"Funnel created: {funnel.title}",
            extra={
                "user_id": user_id,
                "funnel_id": str(funnel.funnel_id),
                "group_id": str(data.group_id) if data.group_id else None,
                "slug": slug,
            }
        )
        
        return funnel


    async def update_funnel(
        self,
        funnel_id: str,
        user_id: str,
        data: FunnelUpdate
    ) -> Funnel:
        """
        Update funnel details.
        
        **Can move funnel between groups**
        """
        funnel = await self.get_funnel(funnel_id, user_id)
        
        # Handle group reassignment
        if hasattr(data, 'group_id') and data.group_id is not None:
            if data.group_id:  # Moving to a group
                await self._verify_group_ownership(data.group_id, user_id)
            funnel.group_id = data.group_id
        
        # Update basic fields
        if data.title is not None:
            funnel.title = data.title
            
        if data.description is not None:
            funnel.description = data.description

        if data.niche is not None:
            funnel.niche = data.niche
            
        if data.primary_goal is not None:
            funnel.primary_goal = data.primary_goal

        if data.visibility is not None:
            funnel.visibility = data.visibility
            
        # Update JSON config (Merge logic)
        if data.config is not None:
            current_config = dict(funnel.config) if funnel.config else {}
            current_config.update(data.config)
            funnel.config = current_config
        
        # Update layout
        if hasattr(data, 'layout') and data.layout is not None:
            current_layout = dict(funnel.layout) if funnel.layout else {}
            current_layout.update(data.layout)
            funnel.layout = current_layout
        
        # Update theme
        if hasattr(data, 'theme') and data.theme is not None:
            current_theme = dict(funnel.theme) if funnel.theme else {}
            current_theme.update(data.theme)
            funnel.theme = current_theme
            
        # Update Lists (Replace logic)
        if data.tags is not None:
            funnel.tags = data.tags
            
        if data.target_platforms is not None:
            funnel.target_platforms = data.target_platforms

        await self.db.commit()
        await self.db.refresh(funnel)
        
        logger.info(
            f"Funnel updated: {funnel.title}",
            extra={
                "user_id": user_id,
                "funnel_id": str(funnel_id),
                "group_id": str(funnel.group_id) if funnel.group_id else None
            }
        )
        
        return funnel


    async def delete_funnel(
        self,
        funnel_id: str,
        user_id: str,
        hard_delete: bool = False
    ) -> bool:
        """
        Delete funnel (Soft or Hard).
        """
        funnel = await self.get_funnel(funnel_id, user_id)
    
        if hard_delete:
            await self.db.delete(funnel)
            logger.warning(
                f"Funnel permanently deleted: {funnel.title}",
                extra={"user_id": user_id, "funnel_id": str(funnel_id)}
            )
        else:
            funnel.soft_delete()
            logger.info(
                f"Funnel soft deleted: {funnel.title}",
                extra={"user_id": user_id, "funnel_id": str(funnel_id)}
            )
    
        await self.db.commit()
        await self._decrement_funnel_count(user_id)
    
        return True
    
    async def get_funnel(
        self,
        funnel_id: str,
        user_id: Optional[str] = None,
        include_questions: bool = False,
        include_hierarchy: bool = True
    ) -> Funnel:
        """
        Get funnel by ID.
        
        **Load group relationship (project via group)**
        """
        query = select(Funnel).where(Funnel.funnel_id == funnel_id)
    
        if include_questions:
            query = query.options(selectinload(Funnel.questions))
        
        # Load group (which has project_id)
        if include_hierarchy:
            query = query.options(joinedload(Funnel.group))
    
        result = await self.db.execute(query)
        funnel = result.scalar_one_or_none()
    
        if not funnel:
            raise FunnelNotFoundException(funnel_id)
    
        # Check ownership
        if user_id and funnel.user_id != user_id:
            raise ForbiddenException(
                message="You don't have permission to access this funnel",
                resource="funnel"
            )
    
        return funnel


    # =========================================================================
    # FUNNEL LISTING
    # =========================================================================
    
    async def list_funnels(
        self,
        user_id: str,
        project_id: Optional[str] = None,  # Filter via group.project_id
        group_id: Optional[str] = None,
        status: Optional[FunnelStatusEnum] = None,
        funnel_type: Optional[str] = None,
        search: Optional[str] = None,
        niche: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
        include_deleted: bool = False
    ) -> List[Funnel]:
        """
        List user's funnels with hierarchy filters.
        
        **Filter by group_id directly, or by project_id via join**
        """
        query = select(Funnel).where(Funnel.user_id == user_id)
        
        # Filter by group_id
        if group_id is not None:
            query = query.where(Funnel.group_id == group_id)
        
        # Filter by project_id (via group join)
        if project_id is not None:
            query = query.join(FunnelGroup).where(FunnelGroup.project_id == project_id)
        
        # Filter by status
        if status:
            query = query.where(Funnel.status == status)
        
        # Filter by type
        if funnel_type:
            query = query.where(Funnel.funnel_type == funnel_type)
        
        # Filter by niche
        if niche:
            query = query.where(Funnel.niche == niche)
        
        # Search
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Funnel.title.ilike(search_term),
                    Funnel.description.ilike(search_term)
                )
            )
        
        # Exclude deleted
        if not include_deleted:
            query = query.where(Funnel.is_deleted == False)
        
        # Load group relationship
        query = query.options(joinedload(Funnel.group))
        
        # Order and paginate
        query = query.order_by(Funnel.created_at.desc())
        query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        funnels = result.unique().scalars().all()
        
        return list(funnels)
    
    async def get_funnel_count(
        self,
        user_id: str,
        project_id: Optional[str] = None,
        group_id: Optional[str] = None,
        status: Optional[str] = None,
        include_deleted: bool = False
    ) -> int:
        """
        Get user's funnel count with filters.
        """
        query = select(func.count(Funnel.funnel_id)).where(Funnel.user_id == user_id)
        
        # Filter by group_id
        if group_id is not None:
            query = query.where(Funnel.group_id == group_id)
        
        # Filter by project_id (via join)
        if project_id is not None:
            query = query.join(FunnelGroup).where(FunnelGroup.project_id == project_id)
        
        if status:
            query = query.where(Funnel.status == status)
        
        if not include_deleted:
            query = query.where(Funnel.is_deleted == False)
        
        result = await self.db.execute(query)
        count = result.scalar_one()
        
        return count
    
    # =========================================================================
    # BULK OPERATIONS
    # =========================================================================
    
    async def bulk_move_funnels(
        self,
        funnel_ids: List[str],
        user_id: str,
        target_project_id: Optional[str] = None,  # Not used (no FK on Funnel)
        target_group_id: Optional[str] = None
    ) -> List[Funnel]:
        """
        Bulk move funnels to different group.
        
        **Only group_id can be updated**
        """
        # Verify ownership of target group
        if target_group_id:
            await self._verify_group_ownership(target_group_id, user_id)
        
        # Get all funnels
        query = select(Funnel).where(
            and_(
                Funnel.funnel_id.in_(funnel_ids),
                Funnel.user_id == user_id
            )
        )
        result = await self.db.execute(query)
        funnels = result.scalars().all()
        
        if len(funnels) != len(funnel_ids):
            raise NotFoundException("Some funnels not found or not owned by user")
        
        # Update all funnels
        for funnel in funnels:
            if target_group_id is not None:
                funnel.group_id = target_group_id
        
        await self.db.commit()
        
        logger.info(
            f"Bulk moved {len(funnels)} funnels",
            extra={
                "user_id": user_id,
                "target_group_id": str(target_group_id) if target_group_id else None
            }
        )
        
        return list(funnels)
    
    # =========================================================================
    # FUNNEL PUBLISHING
    # =========================================================================
    async def publish_funnel(
        self,   
        funnel_id: str,
        user_id: str,
        publish_data: Optional[FunnelPublishRequest] = None
    ) -> Funnel:
        """Publish funnel (make it live)"""
    
        # Get funnel with ownership check
        funnel = await self.get_funnel(funnel_id=funnel_id, user_id=user_id)
    
        # Validate: Must have at least one question
        if not funnel.questions or len(funnel.questions) == 0:
            raise ValidationException(
                message="Cannot publish funnel without questions",
                field="questions"
            )
    
    # ✅ Handle versioning
        if publish_data and publish_data.publish_version:
            # Use custom version string (store in metadata or separate field)
            funnel.ai_metadata = funnel.ai_metadata or {}
            funnel.ai_metadata['custom_version'] = publish_data.publish_version
    
        try:
            current_version = int(funnel.published_version or 0)
        except (TypeError, ValueError):
            current_version = 0

        funnel.published_version = current_version + 1
    
        # ✅ Save publish notes
        if publish_data and publish_data.publish_notes:
            funnel.publish_notes = publish_data.publish_notes

        if publish_data and publish_data.make_public:
            funnel.visibility = FunnelVisibilityEnum.PUBLIC
    
    # Update status and timestamp
        funnel.status = FunnelStatusEnum.PUBLISHED
        funnel.last_published_at = datetime.now(timezone.utc)


        await self.db.commit()
        await self.db.refresh(funnel)
    
        logger.info(
            f"Funnel published: {funnel_id}",
            extra={
                "funnel_id": funnel_id,
                "version": funnel.published_version,
                "user_id": user_id
            }
        )
    
        return funnel
    
    async def unpublish_funnel(
        self,
        funnel_id: str,
        user_id: str
    ) -> Funnel:
        """
        Unpublish funnel (take offline).
        """
        funnel = await self.get_funnel(funnel_id, user_id)
        funnel.unpublish()
        
        await self.db.commit()
        await self.db.refresh(funnel)
        
        logger.info(
            f"Funnel unpublished: {funnel.title}",
            extra={"user_id": user_id, "funnel_id": str(funnel_id)}
        )
        
        return funnel
    
    async def pause_funnel(
        self,
        funnel_id: str,
        user_id: str
    ) -> Funnel:
        """Pause funnel (stops accepting responses)."""
        funnel = await self.get_funnel(funnel_id, user_id)
        funnel.status = FunnelStatusEnum.PAUSED
        
        await self.db.commit()
        await self.db.refresh(funnel)
        
        logger.info(
            f"Funnel paused: {funnel.title}",
            extra={"user_id": user_id, "funnel_id": str(funnel_id)}
        )
        
        return funnel
    
    async def archive_funnel(
        self,
        funnel_id: str,
        user_id: str
    ) -> Funnel:
        """Archive funnel."""
        funnel = await self.get_funnel(funnel_id, user_id)
        funnel.status = FunnelStatusEnum.ARCHIVED
        
        await self.db.commit()
        await self.db.refresh(funnel)
        
        logger.info(
            f"Funnel archived: {funnel.title}",
            extra={"user_id": user_id, "funnel_id": str(funnel_id)}
        )
        
        return funnel
    
    # =========================================================================
    # FUNNEL CLONING
    # =========================================================================
    
    async def clone_funnel(
        self,
        funnel_id: str,
        user_id: str,
        new_title: Optional[str] = None,
        target_project_id: Optional[str] = None,  # Not used
        target_group_id: Optional[str] = None,
        include_stats: bool = False
    ) -> Funnel:
        """
        Clone/duplicate funnel.
        
        **Can clone to different group**
        """
        # Check quota
        await self._check_funnel_quota(user_id)
        
        # Verify target group ownership
        if target_group_id:
            await self._verify_group_ownership(target_group_id, user_id)
        
        # Get source funnel with questions
        source_funnel = await self.get_funnel(funnel_id, user_id, include_questions=True)
        
        # Generate new title and slug
        title = new_title or f"{source_funnel.title} (Copy)"
        slug = await self._generate_unique_slug(title, user_id)
        
        # Clone funnel
        cloned_funnel = Funnel(
            user_id=user_id,
            group_id=target_group_id if target_group_id is not None else source_funnel.group_id,
            title=title,
            slug=slug,
            description=source_funnel.description,
            niche=source_funnel.niche,
            primary_goal=source_funnel.primary_goal,
            funnel_type=source_funnel.funnel_type,
            language=source_funnel.language,
            status=FunnelStatusEnum.DRAFT,
            layout=copy.deepcopy(source_funnel.layout) if source_funnel.layout else {},
            theme=copy.deepcopy(source_funnel.theme) if source_funnel.theme else {},
            config=copy.deepcopy(source_funnel.config) if source_funnel.config else {},
            tags=source_funnel.tags.copy() if source_funnel.tags else [],
            target_platforms=source_funnel.target_platforms.copy() if source_funnel.target_platforms else [],
            seo_metadata=copy.deepcopy(source_funnel.seo_metadata) if source_funnel.seo_metadata else {},
            ai_metadata=copy.deepcopy(source_funnel.ai_metadata) if source_funnel.ai_metadata else {},
            views_count=source_funnel.views_count if include_stats else 0,
            starts_count=source_funnel.starts_count if include_stats else 0,
            completes_count=source_funnel.completes_count if include_stats else 0,
            leads_count=source_funnel.leads_count if include_stats else 0
        )
        
        self.db.add(cloned_funnel)
        await self.db.flush()
        
        # Clone questions
        if source_funnel.questions:
            for source_question in source_funnel.questions:
                cloned_question = Question(
                    funnel_id=cloned_funnel.funnel_id,
                    question_type=source_question.question_type,
                    question_text=source_question.question_text,
                    description=source_question.description,
                    placeholder=source_question.placeholder,
                    display_order=source_question.display_order,
                    is_required=source_question.is_required,
                    options=source_question.options.copy() if source_question.options else {},
                    validation=source_question.validation.copy() if source_question.validation else {},
                    logic=source_question.logic.copy() if source_question.logic else {},
                )
                self.db.add(cloned_question)
        
        await self.db.commit()
        await self.db.refresh(cloned_funnel)
        
        await self._increment_funnel_count(user_id)
        
        logger.info(
            f"Funnel cloned: {source_funnel.title} -> {cloned_funnel.title}",
            extra={
                "user_id": user_id,
                "source_funnel_id": str(funnel_id),
                "cloned_funnel_id": str(cloned_funnel.funnel_id),
                "target_group_id": str(target_group_id) if target_group_id else None
            }
        )
        
        return cloned_funnel
    
    # =========================================================================
    # LAYOUT & THEME MANAGEMENT
    # =========================================================================
    
    async def update_layout(
        self,
        funnel_id: str,
        user_id: str,
        layout_data: FunnelLayoutUpdate
    ) -> Funnel:
        """Update layout schema"""
        funnel = await self.get_funnel(funnel_id, user_id)
        funnel.layout = layout_data.model_dump(exclude_none=True)
        funnel.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(funnel)
        
        logger.info(f"Layout updated for funnel: {funnel_id}")
        return funnel
    
    async def add_section(
        self,
        funnel_id: str,
        user_id: str,
        step_id: str,
        section: Dict[str, Any]
    ) -> Funnel:
        """Add a section to a specific step"""
        funnel = await self.get_funnel(funnel_id, user_id)
        
        if not funnel.layout or "steps" not in funnel.layout:
            raise ValidationException("Funnel layout not initialized", field="layout")
        
        # Find step and add section
        for step in funnel.layout["steps"]:
            if step.get("id") == step_id:
                if "sections" not in step:
                    step["sections"] = []
                step["sections"].append(section)
                break
        else:
            raise NotFoundException(f"Step {step_id} not found", resource_type="step")
        
        funnel.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(funnel)
        
        return funnel
    
    async def update_theme(
        self,
        funnel_id: str,
        user_id: str,
        theme_data: FunnelThemeUpdate
    ) -> Funnel:
        """Update theme configuration"""
        await self.get_funnel(funnel_id, user_id)
        
        theme_dict = theme_data.model_dump(exclude_none=True)
        
        # Direct DB update
        stmt = (
            update(Funnel)
            .where(Funnel.funnel_id == funnel_id, Funnel.user_id == user_id)
            .values(theme=theme_dict, updated_at=datetime.utcnow())
        )
        await self.db.execute(stmt)
        await self.db.commit()
        
        funnel = await self.get_funnel(funnel_id, user_id)
        logger.info(f"Theme updated for funnel: {funnel_id}")
        
        return funnel
    
    async def apply_theme_preset(
        self,
        funnel_id: str,
        user_id: str,
        preset: str
    ) -> Funnel:
        """Apply a built-in theme preset"""
        funnel = await self.get_funnel(funnel_id, user_id)
        funnel.apply_theme_preset(preset)
        funnel.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(funnel)
        
        return funnel
    
    @staticmethod
    def _seo_to_plain_dict(seo_data: FunnelSEOUpdate) -> dict:
        """Convert SEO Pydantic model to plain dict"""
        raw = seo_data.model_dump(exclude_none=True)
        
        def _convert(value):
            if isinstance(value, AnyUrl):
                return str(value)
            if isinstance(value, dict):
                return {k: _convert(v) for k, v in value.items()}
            if isinstance(value, list):
                return [_convert(v) for v in value]
            return value
        
        return _convert(raw)
    
    async def update_seo(
        self,
        funnel_id: str,
        user_id: str,
        seo_data: FunnelSEOUpdate
    ) -> Funnel:
        """Update SEO metadata"""
        funnel = await self.get_funnel(funnel_id, user_id)
        
        if not funnel.seo_metadata:
            funnel.seo_metadata = {}
        
        seo_dict = self._seo_to_plain_dict(seo_data)
        funnel.seo_metadata.update(seo_dict)
        funnel.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(funnel)
        
        logger.info(f"SEO metadata updated for funnel: {funnel_id}")
        return funnel
    
    # =========================================================================
    # A/B TESTING
    # =========================================================================
    
    async def create_ab_test(
        self,
        funnel_id: str,
        user_id: str,
        test_data: FunnelABTestCreate
    ) -> Funnel:
        """Create A/B test with variants"""
        funnel = await self.get_funnel(funnel_id, user_id)
        
        ab_testing = {
            "enabled": True,
            "testId": str(uuid.uuid4()),
            "testName": test_data.test_name,
            "variants": [v.model_dump() for v in test_data.variants],
            "metrics": {v.id: {"views": 0, "starts": 0, "completes": 0} for v in test_data.variants},
            "confidence": test_data.confidence_threshold,
            "winner": None,
            "createdAt": datetime.utcnow().isoformat()
        }
        
        funnel.ab_testing = ab_testing
        funnel.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(funnel)
        
        logger.info(f"A/B test created for funnel: {funnel_id}")
        return funnel
    
    async def get_ab_test_results(
        self,
        funnel_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Get A/B test metrics and winner"""
        funnel = await self.get_funnel(funnel_id, user_id)
        
        if not funnel.ab_testing or not funnel.ab_testing.get("enabled"):
            raise ValidationException("No active A/B test found", field="ab_testing")
        
        return funnel.ab_testing
    
    # =========================================================================
    # STATISTICS
    # =========================================================================
    
    async def get_funnel_stats(
        self,
        funnel_id: str,
        user_id: str,
        period: str = "30d"
    ) -> Dict[str, Any]:
        """Get comprehensive funnel statistics"""
        funnel = await self.get_funnel(funnel_id, user_id)
        
        # Calculate time range
        now = datetime.utcnow()
        if period == "7d":
            start_date = now - timedelta(days=7)
        elif period == "30d":
            start_date = now - timedelta(days=30)
        elif period == "90d":
            start_date = now - timedelta(days=90)
        else:
            start_date = None
        
        # Get responses count for period
        response_query = select(func.count(Response.response_id)).where(
            Response.funnel_id == funnel_id
        )
        if start_date:
            response_query = response_query.where(Response.created_at >= start_date)
        
        response_result = await self.db.execute(response_query)
        period_responses = response_result.scalar_one()
        
        stats = {
            "funnel_id": str(funnel.funnel_id),
            "views_count": funnel.views_count,
            "starts_count": funnel.starts_count,
            "completes_count": funnel.completes_count,
            "leads_count": funnel.leads_count,
            "completion_rate": funnel.completion_rate,
            "view_to_lead_rate": funnel.view_to_lead_rate,
            "start_rate": funnel.start_rate,
            "abandonment_rate": funnel.abandonment_rate,
            "period": period,
            "period_responses": period_responses,
            "avg_completion_time": None,
            "traffic_sources": {},
            "device_breakdown": {}
        }
        
        return stats
    
    # =========================================================================
    # TEMPLATE INSTANTIATION
    # =========================================================================
    
    async def create_from_template(
        self,
        template_id: str,
        user_id: str,
        title: Optional[str] = None,
        project_id: Optional[str] = None,  # Not used (no FK)
        group_id: Optional[str] = None
    ) -> Funnel:
        """
        Create funnel from template.
        
        **Can create into specific group**
        """
        await self._check_funnel_quota(user_id)
        
        # Verify group ownership
        if group_id:
            await self._verify_group_ownership(group_id, user_id)
        
        # Get template
        result = await self.db.execute(
            select(Template)
            .where(Template.template_id == template_id)
            .where(Template.is_active == True)
            .options(selectinload(Template.questions))
        )
        template = result.scalar_one_or_none()
        
        if not template:
            raise NotFoundException("Template not found", resource_type="template")
        
        funnel_title = title or template.name
        slug = await self._generate_unique_slug(funnel_title, user_id)
        
        funnel = Funnel(
            user_id=user_id,
            group_id=group_id,
            title=funnel_title,
            slug=slug,
            description=template.description,
            funnel_type=template.category or "quiz",
            status=FunnelStatusEnum.DRAFT,
            config=template.default_settings.copy() if template.default_settings else {},
            views_count=0,
            starts_count=0,
            completes_count=0,
            leads_count=0
        )
        
        self.db.add(funnel)
        await self.db.flush()
        
        # Copy template questions
        if template.questions:
            for template_question in template.questions:
                question = Question(
                    funnel_id=funnel.funnel_id,
                    question_type=template_question.question_type,
                    question_text=template_question.question_text,
                    description=template_question.description,
                    display_order=template_question.display_order,
                    is_required=template_question.is_required,
                    options=template_question.options.copy() if template_question.options else {},
                    validation=template_question.validation.copy() if template_question.validation else {},
                )
                self.db.add(question)
        
        await self.db.commit()
        await self.db.refresh(funnel)
        
        template.usage_count += 1
        await self.db.commit()
        await self._increment_funnel_count(user_id)
        
        logger.info(
            f"Funnel created from template: {template.name}",
            extra={
                "user_id": user_id,
                "template_id": str(template_id),
                "funnel_id": str(funnel.funnel_id),
                "group_id": str(group_id) if group_id else None
            }
        )
        
        return funnel
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    async def _verify_group_ownership(self, group_id: str, user_id: str):
        """Verify user owns the group's project"""
        result = await self.db.execute(
            select(FunnelGroup)
            .join(Project)
            .where(
                and_(
                    FunnelGroup.group_id == group_id,
                    Project.user_id == user_id,
                    FunnelGroup.is_deleted == False
                )
            )
        )
        group = result.scalar_one_or_none()
        
        if not group:
            raise NotFoundException(
                f"Funnel group {group_id} not found or access denied",
                resource_type="group"
            )
    
    async def _check_funnel_quota(self, user_id: str):
        """Check if user can create more funnels"""
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            limit = 3  # Free tier
        else:
            limit = subscription.funnels_limit
        
        if limit == -1:
            return
        
        current_count = await self.get_funnel_count(user_id, include_deleted=False)
        
        if current_count >= limit:
            raise FunnelLimitExceededException(current_count, limit)
    
    async def _generate_unique_slug(self, title: str, user_id: str) -> str:
        """Generate unique slug for funnel"""
        base_slug = generate_slug_from_text(title)
        slug = base_slug
        counter = 1
        
        while await self._slug_exists(slug, user_id):
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug
    
    async def _slug_exists(
        self,
        slug: str,
        user_id: str,
        exclude_funnel_id: Optional[str] = None
    ) -> bool:
        """Check if slug exists for user"""
        query = select(func.count(Funnel.funnel_id)).where(
            and_(
                Funnel.user_id == user_id,
                Funnel.slug == slug,
                Funnel.is_deleted == False
            )
        )
        
        if exclude_funnel_id:
            query = query.where(Funnel.funnel_id != exclude_funnel_id)
        
        result = await self.db.execute(query)
        count = result.scalar_one()
        
        return count > 0
    
    async def _increment_funnel_count(self, user_id: str):
        """Increment subscription funnel count"""
        await self.db.execute(
            update(Subscription)
            .where(Subscription.user_id == user_id)
            .values(funnels_used=Subscription.funnels_used + 1)
        )
        await self.db.commit()
    
    async def _decrement_funnel_count(self, user_id: str):
        """Decrement subscription funnel count"""
        await self.db.execute(
            update(Subscription)
            .where(Subscription.user_id == user_id)
            .where(Subscription.funnels_used > 0)
            .values(funnels_used=Subscription.funnels_used - 1)
        )
        await self.db.commit()



# =============================================================================
# EXPORTS
# =============================================================================


__all__ = ["FunnelService"]
