# =============================================================================
# AI FUNNEL BUILDER - PROJECT SERVICE
# =============================================================================
# Business logic for Project operations (CRUD, stats, validation)
# =============================================================================

from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, or_, and_
from sqlalchemy.orm import selectinload

from app.models.project import Project, IndustryEnum, BrandVoiceEnum
from app.models.group import FunnelGroup
from app.models.funnel import Funnel
from app.models.lead import Lead
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListItem,
    ProjectList,
    ProjectStats,
    ProjectQueryParams,
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
# PROJECT SERVICE
# =============================================================================

class ProjectService:
    """
    Project service handling all project-related business logic.
    
    Responsibilities:
    - CRUD operations for projects
    - Statistics calculation
    - Ownership validation
    - Soft delete management
    - Query filtering and pagination
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize project service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    # =========================================================================
    # CREATE
    # =========================================================================
    
    async def create_project(
        self,
        user_id: str,
        data: ProjectCreate,
    ) -> Project:
        # Check for duplicate project name for this user
        existing = await self._get_project_by_name(user_id, data.name)
        if existing:
            raise ConflictException(
                message=f"Project with name '{data.name}' already exists",
                conflicting_field="name",
            )

    # Normalize strings -> enums
        industry_enum = IndustryEnum(data.industry) if data.industry else None
        brand_voice_enum = (
            BrandVoiceEnum(data.brand_voice)
            if data.brand_voice
            else BrandVoiceEnum.PROFESSIONAL
        )

    # Create project instance
        project = Project(
            user_id=user_id,
            name=data.name,
            description=data.description,
            industry=industry_enum,
            website=data.website,
            mission_problem=data.mission_problem,
            brand_voice=brand_voice_enum,
            default_audience=data.default_audience or {},
            settings=data.settings or {},
            is_active=True,
            last_activity_at=datetime.utcnow(),
        )

        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)

        logger.info(
            f"Project created: {project.project_id}",
            extra={
                "project_id": project.project_id,
                "user_id": user_id,
                "project_name": project.name,
                "industry": project.industry.value if project.industry else None,
            },
        )

        return project

    
    # =========================================================================
    # READ
    # =========================================================================
    
    async def get_project_by_id(
        self,
        project_id: str,
        user_id: str,
        include_deleted: bool = False
    ) -> Project:
        """
        Get project by ID with ownership check.
        
        Args:
            project_id: Project ID
            user_id: Requesting user ID
            include_deleted: Whether to include soft-deleted projects
        
        Returns:
            Project instance
        
        Raises:
            NotFoundException: If project not found
            UnauthorizedException: If user doesn't own the project
        """
        query = select(Project).where(Project.project_id == project_id)
        
        if not include_deleted:
            query = query.where(Project.is_deleted == False)
        
        result = await self.db.execute(query)
        project = result.scalar_one_or_none()
        
        if not project:
            raise NotFoundException(f"Project {project_id} not found")
        
        # Ownership check
        if project.user_id != user_id:
            logger.warning(
                f"Unauthorized project access attempt",
                extra={
                    "project_id": project_id,
                    "owner_id": project.user_id,
                    "requester_id": user_id
                }
            )
            raise UnauthorizedException("You don't have access to this project")
        
        return project
    
    async def list_projects(
        self,
        user_id: str,
        params: ProjectQueryParams
    ) -> ProjectList:
        """
        List projects for a user with filtering, search, and pagination.
        
        Args:
            user_id: User ID
            params: Query parameters (filters, sort, pagination)
        
        Returns:
            Paginated project list
        """
        # Build base query
        query = select(Project).where(
            and_(
                Project.user_id == user_id,
                Project.is_deleted == False
            )
        )
        
        # Apply filters
        if params.industry:
            query = query.where(Project.industry == params.industry)
        
        if params.is_active is not None:
            query = query.where(Project.is_active == params.is_active)
        
        # Apply search
        if params.search:
            search_term = f"%{params.search}%"
            query = query.where(
                or_(
                    Project.name.ilike(search_term),
                    Project.description.ilike(search_term)
                )
            )
        
        # Count total before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()
        
        # Apply sorting
        sort_field = getattr(Project, params.sort_by, Project.created_at)
        if params.sort_order == "desc":
            query = query.order_by(sort_field.desc())
        else:
            query = query.order_by(sort_field.asc())
        
        # Apply pagination
        offset = (params.page - 1) * params.page_size
        query = query.offset(offset).limit(params.page_size)
        
        # Execute query
        result = await self.db.execute(query)
        projects = result.scalars().all()
        
        # Convert to list items
        items = [
            ProjectListItem(
                project_id=p.project_id,
                name=p.name,
                description=p.description,
                industry=p.industry,
                brand_voice=p.brand_voice,
                created_at=p.created_at,
                updated_at=p.updated_at,
                is_active=p.is_active,
                groups_count=p.groups_count,
                funnels_count=p.funnels_count,
                total_leads=p.total_leads,
                last_activity_at=p.last_activity_at
            )
            for p in projects
        ]
        
        has_more = (offset + len(items)) < total
        
        return ProjectList(
            items=items,
            total=total,
            page=params.page,
            page_size=params.page_size,
            has_more=has_more
        )
    
    # =========================================================================
    # UPDATE
    # =========================================================================
    
    async def update_project(
        self,
        project_id: str,
        user_id: str,
        data: ProjectUpdate
    ) -> Project:
        """
        Update project with ownership check.
        
        Args:
            project_id: Project ID
            user_id: Requesting user ID
            data: Update data
        
        Returns:
            Updated project
        
        Raises:
            NotFoundException: If project not found
            UnauthorizedException: If user doesn't own project
            ConflictException: If name conflicts
        """
        # Get project with ownership check
        project = await self.get_project_by_id(project_id, user_id)
        
        # Check for name conflict if name is being updated
        if data.name and data.name != project.name:
            existing = await self._get_project_by_name(user_id, data.name)
            if existing and existing.project_id != project_id:
                raise ConflictException(
                    message=f"Project with name '{data.name}' already exists",
                    conflicting_field="name"
                )
        
        # Apply updates (only non-None fields)
        update_data = data.model_dump(exclude_unset=True, exclude_none=True)
        
        for field, value in update_data.items():
            if hasattr(project, field):
                setattr(project, field, value)
        
        # Update timestamp
        project.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(project)
        
        logger.info(
            f"Project updated: {project_id}",
            extra={
                "project_id": project_id,
                "user_id": user_id,
                "updated_fields": list(update_data.keys())
            }
        )
        
        return project
    
    # =========================================================================
    # DELETE
    # =========================================================================
    
    async def delete_project(
        self,
        project_id: str,
        user_id: str,
        hard_delete: bool = False
    ) -> Dict[str, Any]:
        """
        Delete project (soft or hard).
        
        Args:
            project_id: Project ID
            user_id: Requesting user ID
            hard_delete: Whether to permanently delete
        
        Returns:
            Deletion confirmation dict
        
        Raises:
            NotFoundException: If project not found
            UnauthorizedException: If user doesn't own project
        """
        # Get project with ownership check
        project = await self.get_project_by_id(project_id, user_id, include_deleted=True)
        
        if hard_delete:
            # Permanent deletion
            await self.db.delete(project)
            await self.db.commit()
            
            logger.warning(
                f"Project hard deleted: {project_id}",
                extra={"project_id": project_id, "user_id": user_id}
            )
            
            return {
                "project_id": project_id,
                "message": "Project permanently deleted",
                "hard_delete": True,
                "deleted_at": datetime.utcnow()
            }
        else:
            # Soft delete
            project.soft_delete()
            await self.db.commit()
            
            logger.info(
                f"Project soft deleted: {project_id}",
                extra={"project_id": project_id, "user_id": user_id}
            )
            
            return {
                "project_id": project_id,
                "message": "Project deleted successfully",
                "hard_delete": False,
                "deleted_at": project.deleted_at
            }
    
    async def restore_project(
        self,
        project_id: str,
        user_id: str
    ) -> Project:
        """
        Restore soft-deleted project.
        
        Args:
            project_id: Project ID
            user_id: Requesting user ID
        
        Returns:
            Restored project
        """
        project = await self.get_project_by_id(project_id, user_id, include_deleted=True)
        
        if not project.is_deleted:
            raise ValidationException("Project is not deleted")
        
        project.restore()
        await self.db.commit()
        await self.db.refresh(project)
        
        logger.info(
            f"Project restored: {project_id}",
            extra={"project_id": project_id, "user_id": user_id}
        )
        
        return project
    
    # =========================================================================
    # STATISTICS
    # =========================================================================
    
    async def get_project_stats(
        self,
        project_id: str,
        user_id: str
    ) -> ProjectStats:
        """
        Get detailed project statistics.
        
        Args:
            project_id: Project ID
            user_id: Requesting user ID
        
        Returns:
            Project statistics
        """
        # Get project with ownership check
        project = await self.get_project_by_id(project_id, user_id)
        
        # Count groups
        groups_query = select(func.count()).where(
            and_(
                FunnelGroup.project_id == project_id,
                FunnelGroup.is_deleted == False
            )
        )
        groups_result = await self.db.execute(groups_query)
        groups_count = groups_result.scalar_one()
        
        # Count funnels by status
        funnels_query = select(
            func.count().label("total"),
            func.count().filter(Funnel.status == "published").label("active"),
            func.count().filter(Funnel.status == "draft").label("draft")
        ).where(
            and_(
                Funnel.project_id == project_id,
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
                Funnel.project_id == project_id,
                Funnel.is_deleted == False
            )
        )
        leads_result = await self.db.execute(leads_query)
        leads_stats = leads_result.one()
        
        # Get analytics aggregates (views, starts, completions)
        # This would query from analytics/responses tables
        # Simplified here - implement based on your analytics schema
        total_views = 0  # TODO: Query from analytics
        total_starts = 0  # TODO: Query from responses where started
        total_completions = 0  # TODO: Query from responses where completed
        
        # Calculate conversion rate
        conversion_rate = 0.0
        if total_starts > 0:
            conversion_rate = (total_completions / total_starts) * 100
        
        return ProjectStats(
            project_id=project_id,
            groups_count=groups_count,
            funnels_count=funnels_stats.total or 0,
            active_funnels_count=funnels_stats.active or 0,
            draft_funnels_count=funnels_stats.draft or 0,
            total_views=total_views,
            total_starts=total_starts,
            total_completions=total_completions,
            total_leads=leads_stats.total_leads or 0,
            conversion_rate=round(conversion_rate, 2),
            last_lead_at=leads_stats.last_lead_at,
            last_activity_at=project.last_activity_at
        )
    
    async def update_project_stats(
        self,
        project_id: str
    ) -> None:
        """
        Update denormalized statistics on project.
        
        Args:
            project_id: Project ID
        """
        # Count groups
        groups_count_query = select(func.count()).where(
            and_(
                FunnelGroup.project_id == project_id,
                FunnelGroup.is_deleted == False
            )
        )
        groups_result = await self.db.execute(groups_count_query)
        groups_count = groups_result.scalar_one()
        
        # Count funnels
        funnels_count_query = select(func.count()).where(
            and_(
                Funnel.project_id == project_id,
                Funnel.is_deleted == False
            )
        )
        funnels_result = await self.db.execute(funnels_count_query)
        funnels_count = funnels_result.scalar_one()
        
        # Count total leads
        leads_count_query = select(func.count(Lead.lead_id)).select_from(
            Funnel
        ).outerjoin(Lead).where(
            and_(
                Funnel.project_id == project_id,
                Funnel.is_deleted == False
            )
        )
        leads_result = await self.db.execute(leads_count_query)
        total_leads = leads_result.scalar_one() or 0
        
        # Update project
        update_query = (
            update(Project)
            .where(Project.project_id == project_id)
            .values(
                groups_count=groups_count,
                funnels_count=funnels_count,
                total_leads=total_leads,
                last_activity_at=datetime.utcnow()
            )
        )
        
        await self.db.execute(update_query)
        await self.db.commit()
        
        logger.debug(
            f"Project stats updated: {project_id}",
            extra={
                "project_id": project_id,
                "groups_count": groups_count,
                "funnels_count": funnels_count,
                "total_leads": total_leads
            }
        )
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    async def _get_project_by_name(
        self,
        user_id: str,
        name: str
    ) -> Optional[Project]:
        """
        Get project by name for a user (case-insensitive).
        
        Args:
            user_id: User ID
            name: Project name
        
        Returns:
            Project or None
        """
        query = select(Project).where(
            and_(
                Project.user_id == user_id,
                func.lower(Project.name) == name.lower(),
                Project.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def check_ownership(
        self,
        project_id: str,
        user_id: str
    ) -> bool:
        """
        Check if user owns a project.
        
        Args:
            project_id: Project ID
            user_id: User ID
        
        Returns:
            True if user owns project, False otherwise
        """
        query = select(func.count()).where(
            and_(
                Project.project_id == project_id,
                Project.user_id == user_id,
                Project.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        count = result.scalar_one()
        return count > 0
    
    async def get_user_project_count(self, user_id: str) -> int:
        """
        Get count of active projects for a user.
        
        Args:
            user_id: User ID
        
        Returns:
            Project count
        """
        query = select(func.count()).where(
            and_(
                Project.user_id == user_id,
                Project.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one()


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["ProjectService"]
