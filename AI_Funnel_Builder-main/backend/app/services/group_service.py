# =============================================================================
# AI FUNNEL BUILDER - FUNNEL GROUP SERVICE
# =============================================================================
# Business logic for FunnelGroup operations (CRUD, stats, AI context)
# =============================================================================

from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, or_, and_
from sqlalchemy.orm import selectinload

from app.models.project import Project
from app.models.group import FunnelGroup, GroupTypeEnum, GroupStatusEnum
from app.models.funnel import Funnel
from app.models.lead import Lead
from app.schemas.group import (
    FunnelGroupCreate,
    FunnelGroupUpdate,
    FunnelGroupResponse,
    FunnelGroupListItem,
    FunnelGroupList,
    FunnelGroupStats,
    FunnelGroupQueryParams,
)
from app.utils.exceptions import (
    NotFoundException,
    ConflictException,
    ValidationException,
    UnauthorizedException,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


# =============================================================================
# FUNNEL GROUP SERVICE
# =============================================================================

class FunnelGroupService:
    """
    FunnelGroup service handling all group-related business logic.
    
    Responsibilities:
    - CRUD operations for funnel groups
    - Project ownership validation
    - Statistics calculation
    - AI context management
    - Campaign date validation
    - Query filtering and pagination
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize funnel group service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    # =========================================================================
    # CREATE
    # =========================================================================
    
    async def create_group(
        self,
        project_id: str,
        user_id: str,
        data: FunnelGroupCreate
    ) -> FunnelGroup:
        """
        Create a new funnel group within a project.
        
        Args:
            project_id: Parent project ID
            user_id: Requesting user ID
            data: Group creation data
        
        Returns:
            Created funnel group
        
        Raises:
            NotFoundException: If project not found
            UnauthorizedException: If user doesn't own project
            ConflictException: If group name conflicts
            ValidationException: If validation fails
        """
        # Verify project exists and user owns it
        await self._verify_project_ownership(project_id, user_id)
        
        # Check for duplicate group name within project
        existing = await self._get_group_by_name(project_id, data.name)
        if existing:
            raise ConflictException(
                message=f"Group with name '{data.name}' already exists in this project",
                conflicting_field="name"
            )
        
        # Validate campaign dates if campaign type
        if data.group_type == GroupTypeEnum.CAMPAIGN:
            self._validate_campaign_dates(data.start_date, data.end_date)
        
        # Create group instance
        group = FunnelGroup(
            project_id=project_id,
            name=data.name,
            description=data.description,
            group_type=data.group_type,
            status=data.status or GroupStatusEnum.DRAFT,
            positioning_problem=data.positioning_problem,
            value_proposition=data.value_proposition,
            product_url=data.product_url,
            offer_summary=data.offer_summary,
            price_range=data.price_range,
            audience_override=data.audience_override or {},
            target_demographics=data.target_demographics or {},
            thumbnail_url=data.thumbnail_url,
            media_assets=data.media_assets or {},
            settings=data.settings or {},
            tags=data.tags or [],
            start_date=data.start_date,
            end_date=data.end_date,
            last_activity_at=datetime.utcnow(),
        )
        
        self.db.add(group)
        await self.db.commit()
        await self.db.refresh(group)
        
        # Update project stats
        await self._update_project_stats(project_id)
        
        logger.info(
            f"Funnel group created: {group.group_id}",
            extra={
                "group_id": group.group_id,
                "project_id": project_id,
                "user_id": user_id,
                "group_name": group.name,
                "type": group.group_type.value
            }
        )
        
        return group
    
    # =========================================================================
    # READ
    # =========================================================================
    
    async def get_group_by_id(
        self,
        group_id: str,
        user_id: str,
        include_deleted: bool = False
    ) -> FunnelGroup:
        """
        Get funnel group by ID with ownership check.
        
        Args:
            group_id: Group ID
            user_id: Requesting user ID
            include_deleted: Whether to include soft-deleted groups
        
        Returns:
            FunnelGroup instance
        
        Raises:
            NotFoundException: If group not found
            UnauthorizedException: If user doesn't own the group's project
        """
        query = (
            select(FunnelGroup)
            .options(selectinload(FunnelGroup.project))
            .where(FunnelGroup.group_id == group_id)
        )
        
        if not include_deleted:
            query = query.where(FunnelGroup.is_deleted == False)
        
        result = await self.db.execute(query)
        group = result.scalar_one_or_none()
        
        if not group:
            raise NotFoundException(f"Funnel group {group_id} not found")
        
        # Ownership check via project
        if group.project.user_id != user_id:
            logger.warning(
                f"Unauthorized group access attempt",
                extra={
                    "group_id": group_id,
                    "owner_id": group.project.user_id,
                    "requester_id": user_id
                }
            )
            raise UnauthorizedException("You don't have access to this funnel group")
        
        return group
    
    async def list_groups_by_project(
        self,
        project_id: str,
        user_id: str,
        params: FunnelGroupQueryParams
    ) -> FunnelGroupList:
        """
        List funnel groups for a project with filtering and pagination.
        
        Args:
            project_id: Project ID
            user_id: Requesting user ID
            params: Query parameters (filters, sort, pagination)
        
        Returns:
            Paginated group list
        """
        # Verify project ownership
        await self._verify_project_ownership(project_id, user_id)
        
        # Build base query
        query = select(FunnelGroup).where(
            and_(
                FunnelGroup.project_id == project_id,
                FunnelGroup.is_deleted == False
            )
        )
        
        # Apply filters
        if params.group_type:
            query = query.where(FunnelGroup.group_type == params.group_type)
        
        if params.status:
            query = query.where(FunnelGroup.status == params.status)
        
        if params.tags:
            # Filter groups that have ANY of the specified tags
            for tag in params.tags:
                query = query.where(FunnelGroup.tags.contains([tag]))
        
        # Apply search
        if params.search:
            search_term = f"%{params.search}%"
            query = query.where(
                or_(
                    FunnelGroup.name.ilike(search_term),
                    FunnelGroup.description.ilike(search_term),
                    FunnelGroup.positioning_problem.ilike(search_term)
                )
            )
        
        # Count total before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()
        
        # Apply sorting
        sort_field = getattr(FunnelGroup, params.sort_by, FunnelGroup.created_at)
        if params.sort_order == "desc":
            query = query.order_by(sort_field.desc())
        else:
            query = query.order_by(sort_field.asc())
        
        # Apply pagination
        offset = (params.page - 1) * params.page_size
        query = query.offset(offset).limit(params.page_size)
        
        # Execute query
        result = await self.db.execute(query)
        groups = result.scalars().all()
        
        # Convert to list items
        items = [
            FunnelGroupListItem(
                group_id=g.group_id,
                project_id=g.project_id,
                name=g.name,
                description=g.description,
                group_type=g.group_type,
                status=g.status,
                positioning_problem=g.positioning_problem,
                thumbnail_url=g.thumbnail_url,
                created_at=g.created_at,
                updated_at=g.updated_at,
                funnels_count=g.funnels_count,
                active_funnels_count=g.active_funnels_count,
                total_leads=g.total_leads,
                total_views=g.total_views,
                last_activity_at=g.last_activity_at,
                tags=g.tags
            )
            for g in groups
        ]
        
        has_more = (offset + len(items)) < total
        
        return FunnelGroupList(
            items=items,
            total=total,
            page=params.page,
            page_size=params.page_size,
            has_more=has_more
        )
    
    # =========================================================================
    # UPDATE
    # =========================================================================
    
    async def update_group(
        self,
        group_id: str,
        user_id: str,
        data: FunnelGroupUpdate
    ) -> FunnelGroup:
        """
        Update funnel group with ownership check.
        
        Args:
            group_id: Group ID
            user_id: Requesting user ID
            data: Update data
        
        Returns:
            Updated funnel group
        
        Raises:
            NotFoundException: If group not found
            UnauthorizedException: If user doesn't own group
            ConflictException: If name conflicts
            ValidationException: If validation fails
        """
        # Get group with ownership check
        group = await self.get_group_by_id(group_id, user_id)
        
        # Check for name conflict if name is being updated
        if data.name and data.name != group.name:
            existing = await self._get_group_by_name(group.project_id, data.name)
            if existing and existing.group_id != group_id:
                raise ConflictException(
                    message=f"Group with name '{data.name}' already exists in this project",
                    conflicting_field="name"
                )
        
        # Validate campaign dates if being updated
        start_date = data.start_date if data.start_date is not None else group.start_date
        end_date = data.end_date if data.end_date is not None else group.end_date
        
        if group.group_type == GroupTypeEnum.CAMPAIGN or data.group_type == GroupTypeEnum.CAMPAIGN:
            self._validate_campaign_dates(start_date, end_date)
        
        # Apply updates (only non-None fields)
        update_data = data.model_dump(exclude_unset=True, exclude_none=True)
        
        for field, value in update_data.items():
            if hasattr(group, field):
                setattr(group, field, value)
        
        # Update timestamp
        group.updated_at = datetime.utcnow()
        group.last_activity_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(group)
        
        logger.info(
            f"Funnel group updated: {group_id}",
            extra={
                "group_id": group_id,
                "user_id": user_id,
                "updated_fields": list(update_data.keys())
            }
        )
        
        return group
    
    # =========================================================================
    # DELETE
    # =========================================================================
    
    async def delete_group(
        self,
        group_id: str,
        user_id: str,
        hard_delete: bool = False
    ) -> Dict[str, Any]:
        """
        Delete funnel group (soft or hard).
        
        Args:
            group_id: Group ID
            user_id: Requesting user ID
            hard_delete: Whether to permanently delete
        
        Returns:
            Deletion confirmation dict
        
        Raises:
            NotFoundException: If group not found
            UnauthorizedException: If user doesn't own group
        """
        # Get group with ownership check
        group = await self.get_group_by_id(group_id, user_id, include_deleted=True)
        project_id = group.project_id
        
        if hard_delete:
            # Permanent deletion
            await self.db.delete(group)
            await self.db.commit()
            
            logger.warning(
                f"Funnel group hard deleted: {group_id}",
                extra={"group_id": group_id, "user_id": user_id}
            )
            
            result = {
                "group_id": group_id,
                "message": "Funnel group permanently deleted",
                "hard_delete": True,
                "deleted_at": datetime.utcnow()
            }
        else:
            # Soft delete
            group.soft_delete()
            await self.db.commit()
            
            logger.info(
                f"Funnel group soft deleted: {group_id}",
                extra={"group_id": group_id, "user_id": user_id}
            )
            
            result = {
                "group_id": group_id,
                "message": "Funnel group deleted successfully",
                "hard_delete": False,
                "deleted_at": group.deleted_at
            }
        
        # Update project stats
        await self._update_project_stats(project_id)
        
        return result
    
    async def restore_group(
        self,
        group_id: str,
        user_id: str
    ) -> FunnelGroup:
        """
        Restore soft-deleted funnel group.
        
        Args:
            group_id: Group ID
            user_id: Requesting user ID
        
        Returns:
            Restored funnel group
        """
        group = await self.get_group_by_id(group_id, user_id, include_deleted=True)
        
        if not group.is_deleted:
            raise ValidationException("Funnel group is not deleted")
        
        group.restore()
        await self.db.commit()
        await self.db.refresh(group)
        
        # Update project stats
        await self._update_project_stats(group.project_id)
        
        logger.info(
            f"Funnel group restored: {group_id}",
            extra={"group_id": group_id, "user_id": user_id}
        )
        
        return group
    
    # =========================================================================
    # STATUS MANAGEMENT
    # =========================================================================
    
    async def activate_group(
        self,
        group_id: str,
        user_id: str
    ) -> FunnelGroup:
        """
        Activate a funnel group.
        
        Args:
            group_id: Group ID
            user_id: Requesting user ID
        
        Returns:
            Activated group
        """
        group = await self.get_group_by_id(group_id, user_id)
        group.activate()
        
        await self.db.commit()
        await self.db.refresh(group)
        
        logger.info(f"Funnel group activated: {group_id}")
        
        return group
    
    async def pause_group(
        self,
        group_id: str,
        user_id: str
    ) -> FunnelGroup:
        """
        Pause a funnel group.
        
        Args:
            group_id: Group ID
            user_id: Requesting user ID
        
        Returns:
            Paused group
        """
        group = await self.get_group_by_id(group_id, user_id)
        group.pause()
        
        await self.db.commit()
        await self.db.refresh(group)
        
        logger.info(f"Funnel group paused: {group_id}")
        
        return group
    
    async def archive_group(
        self,
        group_id: str,
        user_id: str
    ) -> FunnelGroup:
        """
        Archive a funnel group.
        
        Args:
            group_id: Group ID
            user_id: Requesting user ID
        
        Returns:
            Archived group
        """
        group = await self.get_group_by_id(group_id, user_id)
        group.archive()
        
        await self.db.commit()
        await self.db.refresh(group)
        
        logger.info(f"Funnel group archived: {group_id}")
        
        return group
    
    # =========================================================================
    # STATISTICS
    # =========================================================================
    
    async def get_group_stats(
        self,
        group_id: str,
        user_id: str
    ) -> FunnelGroupStats:
        """
        Get detailed funnel group statistics.
        
        Args:
            group_id: Group ID
            user_id: Requesting user ID
        
        Returns:
            Group statistics
        """
        # Get group with ownership check
        group = await self.get_group_by_id(group_id, user_id)
        
        # Count funnels by status
        funnels_query = select(
            func.count().label("total"),
            func.count().filter(Funnel.status == "published").label("active"),
            func.count().filter(Funnel.status == "draft").label("draft"),
            func.count().filter(Funnel.status == "paused").label("paused")
        ).where(
            and_(
                Funnel.group_id == group_id,
                Funnel.is_deleted == False
            )
        )
        funnels_result = await self.db.execute(funnels_query)
        funnels_stats = funnels_result.one()
        
        # Count leads and get last lead timestamp
        leads_query = select(
            func.count(Lead.lead_id).label("total_leads"),
            func.max(Lead.created_at).label("last_lead_at")
        ).select_from(Funnel).outerjoin(Lead).where(
            and_(
                Funnel.group_id == group_id,
                Funnel.is_deleted == False
            )
        )
        leads_result = await self.db.execute(leads_query)
        leads_stats = leads_result.one()
        
        # Get analytics aggregates
        # TODO: Query from analytics/responses tables
        total_views = 0
        total_starts = 0
        total_completions = 0
        
        # Calculate conversion rate
        conversion_rate = 0.0
        if total_starts > 0:
            conversion_rate = (total_completions / total_starts) * 100
        
        return FunnelGroupStats(
            group_id=group_id,
            funnels_count=funnels_stats.total or 0,
            active_funnels_count=funnels_stats.active or 0,
            draft_funnels_count=funnels_stats.draft or 0,
            paused_funnels_count=funnels_stats.paused or 0,
            total_views=total_views,
            total_starts=total_starts,
            total_completions=total_completions,
            total_leads=leads_stats.total_leads or 0,
            conversion_rate=round(conversion_rate, 2),
            last_lead_at=leads_stats.last_lead_at,
            last_activity_at=group.last_activity_at
        )
    
    async def update_group_stats(
        self,
        group_id: str
    ) -> None:
        """
        Update denormalized statistics on group.
        
        Args:
            group_id: Group ID
        """
        # Count funnels
        funnels_count_query = select(func.count()).where(
            and_(
                Funnel.group_id == group_id,
                Funnel.is_deleted == False
            )
        )
        funnels_result = await self.db.execute(funnels_count_query)
        funnels_count = funnels_result.scalar_one()
        
        # Count active funnels
        active_count_query = select(func.count()).where(
            and_(
                Funnel.group_id == group_id,
                Funnel.status == "published",
                Funnel.is_deleted == False
            )
        )
        active_result = await self.db.execute(active_count_query)
        active_funnels_count = active_result.scalar_one()
        
        # Count total leads
        leads_count_query = select(func.count(Lead.lead_id)).select_from(
            Funnel
        ).outerjoin(Lead).where(
            and_(
                Funnel.group_id == group_id,
                Funnel.is_deleted == False
            )
        )
        leads_result = await self.db.execute(leads_count_query)
        total_leads = leads_result.scalar_one() or 0
        
        # Update group
        update_query = (
            update(FunnelGroup)
            .where(FunnelGroup.group_id == group_id)
            .values(
                funnels_count=funnels_count,
                active_funnels_count=active_funnels_count,
                total_leads=total_leads,
                last_activity_at=datetime.utcnow()
            )
        )
        
        await self.db.execute(update_query)
        await self.db.commit()
        
        logger.debug(
            f"Group stats updated: {group_id}",
            extra={
                "group_id": group_id,
                "funnels_count": funnels_count,
                "active_funnels_count": active_funnels_count,
                "total_leads": total_leads
            }
        )
    
    # =========================================================================
    # AI CONTEXT MANAGEMENT
    # =========================================================================
    
    async def update_ai_context(
        self,
        group_id: str,
        user_id: str,
        ai_context: Dict[str, Any]
    ) -> FunnelGroup:
        """
        Update AI-extracted context from product URL.
        
        Args:
            group_id: Group ID
            user_id: Requesting user ID
            ai_context: AI-extracted context data
        
        Returns:
            Updated group
        """
        group = await self.get_group_by_id(group_id, user_id)
        
        group.ai_context = ai_context
        group.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(group)
        
        logger.info(
            f"AI context updated for group: {group_id}",
            extra={"group_id": group_id, "context_keys": list(ai_context.keys())}
        )
        
        return group
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    async def _verify_project_ownership(
        self,
        project_id: str,
        user_id: str
    ) -> None:
        """
        Verify user owns the project.
        
        Args:
            project_id: Project ID
            user_id: User ID
        
        Raises:
            NotFoundException: If project not found
            UnauthorizedException: If user doesn't own project
        """
        query = select(Project).where(
            and_(
                Project.project_id == project_id,
                Project.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        project = result.scalar_one_or_none()
        
        if not project:
            raise NotFoundException(f"Project {project_id} not found")
        
        if project.user_id != user_id:
            raise UnauthorizedException("You don't have access to this project")
    
    async def _get_group_by_name(
        self,
        project_id: str,
        name: str
    ) -> Optional[FunnelGroup]:
        """
        Get group by name within a project (case-insensitive).
        
        Args:
            project_id: Project ID
            name: Group name
        
        Returns:
            FunnelGroup or None
        """
        query = select(FunnelGroup).where(
            and_(
                FunnelGroup.project_id == project_id,
                func.lower(FunnelGroup.name) == name.lower(),
                FunnelGroup.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    def _validate_campaign_dates(
        self,
        start_date: Optional[datetime],
        end_date: Optional[datetime]
    ) -> None:
        """
        Validate campaign start and end dates.
        
        Args:
            start_date: Campaign start date
            end_date: Campaign end date
        
        Raises:
            ValidationException: If dates are invalid
        """
        if end_date and start_date and end_date <= start_date:
            raise ValidationException("Campaign end_date must be after start_date")
        
        # Optional: warn if campaign is too short/long
        if start_date and end_date:
            duration = (end_date - start_date).days
            if duration < 1:
                raise ValidationException("Campaign must be at least 1 day long")
            if duration > 365:
                logger.warning(
                    f"Campaign duration is very long: {duration} days",
                    extra={"start_date": start_date, "end_date": end_date}
                )
    
    async def _update_project_stats(self, project_id: str) -> None:
        """
        Update project stats after group changes.
        
        Args:
            project_id: Project ID
        """
        # This would call ProjectService.update_project_stats
        # For now, just update groups_count
        groups_count_query = select(func.count()).where(
            and_(
                FunnelGroup.project_id == project_id,
                FunnelGroup.is_deleted == False
            )
        )
        groups_result = await self.db.execute(groups_count_query)
        groups_count = groups_result.scalar_one()
        
        update_query = (
            update(Project)
            .where(Project.project_id == project_id)
            .values(
                groups_count=groups_count,
                last_activity_at=datetime.utcnow()
            )
        )
        
        await self.db.execute(update_query)
        await self.db.commit()


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["FunnelGroupService"]
