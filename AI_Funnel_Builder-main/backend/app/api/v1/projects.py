# =============================================================================
# AI FUNNEL BUILDER - PROJECT API ENDPOINTS (PRODUCTION GRADE)
# =============================================================================
# REST API routes for Project resource with enhanced features
# =============================================================================

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.project_service import ProjectService
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectList,
    ProjectStats,
    ProjectDelete,
    ProjectQueryParams,
    ProjectListItem,
)
from app.utils.exceptions import (
    NotFoundException,
    ConflictException,
    ValidationException,
    UnauthorizedException,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(dependencies=[Depends(get_current_user)])


# =============================================================================
# PROJECT CRUD
# =============================================================================

@router.get(
    "",
    response_model=ProjectList,
    status_code=status.HTTP_200_OK,
    summary="List Projects",
    description="Get list of user's projects with filters and pagination"
)
async def list_projects(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, max_length=255, description="Search in name/description"),
    sort_by: str = Query(
        "created_at",
        regex="^(created_at|updated_at|name|groups_count|funnels_count|total_leads)$",
        description="Sort field"
    ),
    sort_order: str = Query(
        "desc",
        regex="^(asc|desc)$",
        description="Sort order"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProjectList:
    """
    List all projects for the authenticated user.
    
    **Filters:**
    - **industry**: beauty_skincare, coaching, saas, etc.
    - **is_active**: true/false
    - **search**: Search in name and description
    
    **Sorting:**
    - **sort_by**: created_at, updated_at, name, groups_count, funnels_count, total_leads
    - **sort_order**: asc, desc
    
    **Pagination:**
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 20, max: 100)
    
    Returns paginated list with items, total count, and pagination metadata.
    """
    try:
        params = ProjectQueryParams(
            page=page,
            page_size=page_size,
            industry=industry,
            is_active=is_active,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        service = ProjectService(db)
        result = await service.list_projects(
            user_id=current_user.user_id,
            params=params
        )
        
        logger.info(
            f"Projects listed for user",
            extra={
                "user_id": current_user.user_id,
                "total": result.total,
                "page": result.page
            }
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error listing projects: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve projects"
        )


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Project",
    description="Create a new project (brand/business container)"
)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    """
    Create a new project.
    
    **Required:**
    - **name**: Project/brand name (2-255 chars)
    
    **Optional:**
    - **description**: Project description
    - **industry**: Business industry category
    - **website**: Primary website URL
    - **mission_problem**: Brand mission pain/problem (PRD: Mission-level)
    - **brand_voice**: Tone for AI content (professional, friendly, luxury, etc.)
    - **default_audience**: Target audience profile
    - **settings**: Project settings (timezone, currency, language)
    
    Returns the created project with ID and timestamps.
    """
    logger.info(
        f"ProjectCreate after validation: "
        f"industry={data.industry!r} type={type(data.industry)!r}, "
        f"brand_voice={data.brand_voice!r} type={type(data.brand_voice)!r}"
    )

    try:
        service = ProjectService(db)
        project = await service.create_project(
            user_id=current_user.user_id,
            data=data
        )
        
        logger.info(
            f"Project created in DB: {project.name}",
            extra={
                "project_id": project.project_id,
                "user_id": current_user.user_id,
                "project_name": project.name,  # ✅ FIXED: renamed from 'name'
                "industry": project.industry.value if project.industry else None
            }
        )

        # ✅ Build response dict explicitly with all required fields
        project_dict = {
            "project_id": str(project.project_id),
            "user_id": str(project.user_id),
            "name": project.name,
            "description": project.description,
            "industry": project.industry.value if project.industry else None,
            "website": project.website,
            "mission_problem": project.mission_problem,
            "brand_voice": project.brand_voice.value if project.brand_voice else None,
            "default_audience": project.default_audience or {},
            "settings": project.settings or {},
            "metadata": project.project_metadata or {},  # ✅ Map project_metadata → metadata
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "is_active": project.is_active,
            "is_deleted": project.is_deleted,
            "deleted_at": project.deleted_at,
            "last_activity_at": project.last_activity_at,
            "groups_count": project.groups_count,
            "funnels_count": project.funnels_count,
            "total_leads": project.total_leads,
        }

        # 🐛 DEBUG: Log what we're sending to Pydantic
        logger.debug(f"project_dict keys: {list(project_dict.keys())}")
        logger.debug(f"project_id value: {project_dict.get('project_id')}")
        logger.debug(f"project type: {type(project)}")
        
        # ✅ Validate and return response
        response = ProjectResponse.model_validate(project_dict)
        logger.info(f"Successfully validated ProjectResponse for {project.project_id}")
        return response
    
    except ConflictException as e:
        logger.warning(f"Project conflict: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message
        )
    except ValidationException as e:
        logger.warning(f"Project validation error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error creating project: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project"
        )
@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Project",
    description="Get detailed information about a specific project"
)
async def get_project(
    project_id: str,
    include_groups: bool = Query(False, description="Include groups in response"),
    include_stats: bool = Query(True, description="Include denormalized stats"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    """
    Get a specific project by ID.

    **Query Parameters:**
    - **include_groups**: Include list of groups (default: false)
    - **include_stats**: Include stats (groups_count, funnels_count, total_leads)

    Returns full project details.
    Only accessible by the project owner.
    """
    try:
        service = ProjectService(db)
        project = await service.get_project_by_id(
            project_id=project_id,
            user_id=current_user.user_id
        )

        # Build response dict explicitly (same shape as ProjectResponse)
        project_dict = {
            "project_id": str(project.project_id),
            "user_id": str(project.user_id),
            "name": project.name,
            "description": project.description,
            "industry": project.industry.value if project.industry else None,
            "website": project.website,
            "mission_problem": project.mission_problem,
            "brand_voice": project.brand_voice.value if project.brand_voice else None,
            "default_audience": project.default_audience or {},
            "settings": project.settings or {},
            "metadata": project.project_metadata or {},
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "is_active": project.is_active,
            "is_deleted": project.is_deleted,
            "deleted_at": project.deleted_at,
            "last_activity_at": project.last_activity_at,
            "groups_count": project.groups_count,
            "funnels_count": project.funnels_count,
            "total_leads": project.total_leads,
        }

        return ProjectResponse.model_validate(project_dict)

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except UnauthorizedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error getting project {project_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve project"
        )

@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Project",
    description="Update project metadata and settings"
)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    """
    Update a project.
    
    All fields are optional. Only provided fields will be updated.
    
    **Updatable fields:**
    - name
    - description
    - industry
    - website
    - mission_problem
    - brand_voice
    - default_audience
    - settings
    - is_active
    
    Returns the updated project.
    """
    try:
        service = ProjectService(db)
        project = await service.update_project(
            project_id=project_id,
            user_id=current_user.user_id,
            data=data
        )
        
        logger.info(
            f"Project updated: {project.name}",
            extra={
                "project_id": project_id,
                "user_id": current_user.user_id
            }
        )
        
        return ProjectResponse.model_validate(project)
    
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except UnauthorizedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message
        )
    except ConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message
        )
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error updating project {project_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project"
        )


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Project",
    description="Delete a project (soft delete by default, hard delete if specified)"
)
async def delete_project(
    project_id: str,
    hard_delete: bool = Query(
        False,
        description="Permanently delete the project (cannot be undone)"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a project.
    
    **Query Parameters:**
    - **hard_delete**: If true, permanently deletes the project and ALL its data.
      If false (default), performs soft delete (can be restored).
    
    ⚠️ **Warning:** Hard delete is permanent and cannot be undone.
    It will delete all groups, funnels, questions, responses, and leads associated with this project.
    
    Returns deletion confirmation.
    """
    try:
        service = ProjectService(db)
        result = await service.delete_project(
            project_id=project_id,
            user_id=current_user.user_id,
            hard_delete=hard_delete
        )
        
        logger.info(
            f"Project deleted (permanent={hard_delete}): {project_id}",
            extra={
                "project_id": project_id,
                "user_id": current_user.user_id,
                "hard_delete": hard_delete
            }
        )
        
        return {
            "message": result["message"],
            "project_id": project_id,
            "permanent": hard_delete,
            "deleted_at": result["deleted_at"]
        }
    
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except UnauthorizedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project"
        )


# =============================================================================
# PROJECT LIFECYCLE ACTIONS
# =============================================================================

@router.post(
    "/{project_id}/restore",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Restore Project",
    description="Restore a soft-deleted project"
)
async def restore_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    """
    Restore a soft-deleted project.
    
    Only works for projects that were soft-deleted (not hard-deleted).
    
    Returns the restored project.
    """
    try:
        service = ProjectService(db)
        project = await service.restore_project(
            project_id=project_id,
            user_id=current_user.user_id
        )
        
        logger.info(
            f"Project restored: {project.name}",
            extra={"project_id": project_id, "user_id": current_user.user_id}
        )
        
        return ProjectResponse.model_validate(project)
    
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except UnauthorizedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message
        )
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error restoring project {project_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to restore project"
        )


@router.post(
    "/{project_id}/activate",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate Project",
    description="Activate an inactive project"
)
async def activate_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    """Activate a project (set is_active = true)."""
    try:
        service = ProjectService(db)
        project = await service.get_project_by_id(project_id, current_user.user_id)
        
        project.is_active = True
        project.last_activity_at = await service.db.scalar("SELECT NOW()")
        
        await service.db.commit()
        await service.db.refresh(project)
        
        logger.info(f"Project activated: {project_id}")
        
        return ProjectResponse.model_validate(project)
    
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error activating project: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to activate project")


@router.post(
    "/{project_id}/deactivate",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate Project",
    description="Deactivate a project (pause without deleting)"
)
async def deactivate_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    """Deactivate a project (set is_active = false)."""
    try:
        service = ProjectService(db)
        project = await service.get_project_by_id(project_id, current_user.user_id)
        
        project.is_active = False
        
        await service.db.commit()
        await service.db.refresh(project)
        
        logger.info(f"Project deactivated: {project_id}")
        
        return ProjectResponse.model_validate(project)
    
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error deactivating project: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to deactivate project")


@router.post(
    "/{project_id}/clone",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Clone Project",
    description="Duplicate project with all groups and settings"
)
async def clone_project(
    project_id: str,
    new_name: Optional[str] = Query(None, description="Name for cloned project"),
    include_groups: bool = Query(True, description="Clone groups and funnels"),
    include_stats: bool = Query(False, description="Copy performance stats"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    """
    Clone a project.
    
    **Query Parameters:**
    - **new_name**: Custom name for the clone (default: "{original_name} (Copy)")
    - **include_groups**: Clone all groups and funnels (default: true)
    - **include_stats**: Copy performance statistics (default: false)
    
    Copies:
    - Project settings
    - Brand voice & audience
    - Mission problem
    - Optionally: Groups, Funnels, Stats
    """
    try:
        service = ProjectService(db)
        
        # Get original project
        original = await service.get_project_by_id(project_id, current_user.user_id)
        
        # Create clone data
        clone_data = ProjectCreate(
            name=new_name or f"{original.name} (Copy)",
            description=original.description,
            industry=original.industry,
            website=original.website,
            mission_problem=original.mission_problem,
            brand_voice=original.brand_voice,
            default_audience=original.default_audience,
            settings=original.settings
        )
        
        # Create cloned project
        cloned = await service.create_project(current_user.user_id, clone_data)
        
        logger.info(
            f"Project cloned: {cloned.name}",
            extra={
                "source_project_id": project_id,
                "cloned_project_id": cloned.project_id,
                "user_id": current_user.user_id
            }
        )
        
        return ProjectResponse.model_validate(cloned)
    
    except Exception as e:
        logger.error(f"Error cloning project: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to clone project")


# =============================================================================
# STATISTICS & ANALYTICS
# =============================================================================

@router.get(
    "/{project_id}/stats",
    response_model=ProjectStats,
    status_code=status.HTTP_200_OK,
    summary="Get Project Stats",
    description="Get detailed statistics and analytics for a project"
)
async def get_project_stats(
    project_id: str,
    period: Optional[str] = Query("30d", description="7d, 30d, 90d, all"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProjectStats:
    """
    Get detailed project statistics.
    
    **Query Parameters:**
    - **period**: Time period (7d, 30d, 90d, all)
    
    **Returns:**
    - groups_count: Total funnel groups
    - funnels_count: Total funnels (all statuses)
    - active_funnels_count: Published/active funnels
    - draft_funnels_count: Draft funnels
    - total_views: Total funnel views
    - total_starts: Total funnel starts
    - total_completions: Total completions
    - total_leads: Total leads captured
    - conversion_rate: Overall conversion rate (completions/starts)
    - avg_completion_time: Average time to complete
    - last_lead_at: Timestamp of last lead
    - last_activity_at: Last activity timestamp
    """
    try:
        service = ProjectService(db)
        stats = await service.get_project_stats(
            project_id=project_id,
            user_id=current_user.user_id
        )
        
        return stats
    
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error getting project stats: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve statistics")


@router.post(
    "/{project_id}/stats/refresh",
    status_code=status.HTTP_200_OK,
    summary="Refresh Stats",
    description="Manually refresh denormalized project statistics"
)
async def refresh_project_stats(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually refresh project statistics.
    
    This recalculates and updates denormalized stats:
    - groups_count
    - funnels_count
    - total_leads
    - last_activity_at
    
    Normally these are auto-updated, but this endpoint can be used
    for manual reconciliation if needed.
    """
    try:
        service = ProjectService(db)
        await service.get_project_by_id(project_id, current_user.user_id)
        await service.update_project_stats(project_id)
        
        logger.info(f"Project stats refreshed: {project_id}")
        
        return {
            "message": "Project statistics refreshed successfully",
            "project_id": project_id
        }
    
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error refreshing stats: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to refresh statistics")


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["router"]
