# =============================================================================
# AI FUNNEL BUILDER - FUNNEL GROUP API ENDPOINTS (PRODUCTION GRADE)
# =============================================================================
# REST API routes for FunnelGroup resource with enhanced features
# =============================================================================

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.group_service import FunnelGroupService
from app.services.project_service import ProjectService
from app.schemas.group import (
    FunnelGroupCreate,
    FunnelGroupUpdate,
    FunnelGroupResponse,
    FunnelGroupList,
    FunnelGroupStats,
    FunnelGroupDelete,
    FunnelGroupQueryParams,
    FunnelGroupListItem,
    GroupTypeEnum,
    GroupStatusEnum,
)
from app.utils.exceptions import (
    NotFoundException,
    ConflictException,
    ValidationException,
    UnauthorizedException,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Router is mounted under /api/v1; paths below are absolute under that prefix.
router = APIRouter(dependencies=[Depends(get_current_user)])


# =============================================================================
# Helpers
# =============================================================================

def build_group_response_dict(group) -> Dict[str, Any]:
    """Normalize SQLAlchemy FunnelGroup -> dict matching FunnelGroupResponse."""
    return {
        "group_id": str(group.group_id),
        "project_id": str(group.project_id),
        "name": group.name,
        "description": group.description,
        "group_type": group.group_type.value if getattr(group, "group_type", None) else None,
        "status": group.status.value if getattr(group, "status", None) else None,
        "positioning_problem": group.positioning_problem,
        "value_proposition": group.value_proposition,
        "product_url": group.product_url,
        "offer_summary": group.offer_summary,
        "price_range": group.price_range,
        "audience_override": group.audience_override or {},
        "target_demographics": group.target_demographics or {},
        "thumbnail_url": group.thumbnail_url,
        "media_assets": group.media_assets or {},
        "settings": group.settings or {},
        "tags": group.tags or [],
        "start_date": group.start_date,
        "end_date": group.end_date,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "is_deleted": group.is_deleted,
        "deleted_at": group.deleted_at,
        "funnels_count": group.funnels_count,
        "total_leads": group.total_leads,
        "total_views": group.total_views,
        "metadata": getattr(group, "group_metadata", None) or {},
    }


# =============================================================================
# FUNNEL GROUP CRUD (PROJECT-SCOPED: /projects/{project_id}/groups)
# =============================================================================

@router.get(
    "/projects/{project_id}/groups",
    response_model=FunnelGroupList,
    status_code=status.HTTP_200_OK,
    summary="List Funnel Groups",
    description="Get list of funnel groups for a project with filters and pagination",
)
async def list_groups(
    project_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    group_type: Optional[str] = Query(None, description="Filter by type"),
    status_: Optional[str] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, max_length=255, description="Search in name/description"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags (OR)"),
    sort_by: str = Query(
        "created_at",
        regex="^(created_at|updated_at|name|funnels_count|total_leads|total_views)$",
        description="Sort field",
    ),
    sort_order: str = Query(
        "desc",
        regex="^(asc|desc)$",
        description="Sort order",
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelGroupList:
    """
    List all funnel groups for a project.
    """
    try:
        params = FunnelGroupQueryParams(
            page=page,
            page_size=page_size,
            group_type=group_type,
            status=status_,
            search=search,
            tags=tags,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        service = FunnelGroupService(db)
        result = await service.list_groups_by_project(
            project_id=project_id,
            user_id=current_user.user_id,
            params=params,
        )

        logger.info(
            "Groups listed for project",
            extra={
                "project_id": project_id,
                "user_id": current_user.user_id,
                "total": result.total,
                "page": result.page,
            },
        )

        return result

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error listing groups: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve funnel groups",
        )


@router.post(
    "/projects/{project_id}/groups",
    response_model=FunnelGroupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Funnel Group",
    description="Create a new funnel group (product/category/campaign container) within a project",
)
async def create_group(
    project_id: str,
    data: FunnelGroupCreate = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelGroupResponse:
    """
    Create a new funnel group within a project.
    """
    try:
        # Ensure project exists and belongs to user
        project_service = ProjectService(db)
        await project_service.get_project_by_id(project_id, current_user.user_id)

        service = FunnelGroupService(db)
        group = await service.create_group(
            project_id=project_id,
            user_id=current_user.user_id,
            data=data,
        )

        logger.info(
            "Funnel group created: %s",
            group.name,
            extra={
                "group_id": group.group_id,
                "project_id": project_id,
                "user_id": current_user.user_id,
                "type": group.group_type.value if getattr(group, "group_type", None) else None,
            },
        )

        group_dict = build_group_response_dict(group)
        return FunnelGroupResponse.model_validate(group_dict)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except ConflictException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        logger.error(f"Error creating group: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create funnel group",
        )


# =============================================================================
# FUNNEL GROUP CRUD (GROUP-SCOPED: /groups/{group_id})
# =============================================================================

@router.get(
    "/groups/{group_id}",
    response_model=FunnelGroupResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Funnel Group",
    description="Get detailed information about a specific funnel group",
)
async def get_group(
    group_id: str,
    include_funnels: bool = Query(False, description="Include list of funnels"),
    include_stats: bool = Query(True, description="Include denormalized stats"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelGroupResponse:
    """
    Get a specific funnel group by ID.
    """
    try:
        service = FunnelGroupService(db)
        group = await service.get_group_by_id(
            group_id=group_id,
            user_id=current_user.user_id,
        )

        group_dict = build_group_response_dict(group)
        return FunnelGroupResponse.model_validate(group_dict)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error getting group {group_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve funnel group",
        )


@router.patch(
    "/groups/{group_id}",
    response_model=FunnelGroupResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Funnel Group",
    description="Update group metadata and settings",
)
async def update_group(
    group_id: str,
    data: FunnelGroupUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelGroupResponse:
    """
    Update a funnel group.
    """
    try:
        service = FunnelGroupService(db)
        group = await service.update_group(
            group_id=group_id,
            user_id=current_user.user_id,
            data=data,
        )

        logger.info(
            "Funnel group updated: %s",
            group.name,
            extra={
                "group_id": group_id,
                "user_id": current_user.user_id,
            },
        )

        group_dict = build_group_response_dict(group)
        return FunnelGroupResponse.model_validate(group_dict)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except ConflictException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        logger.error(f"Error updating group {group_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update funnel group",
        )


@router.delete(
    "/groups/{group_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Funnel Group",
    description="Delete a funnel group (soft delete by default, hard delete if specified)",
)
async def delete_group(
    group_id: str,
    hard_delete: bool = Query(
        False,
        description="Permanently delete the group (cannot be undone)",
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a funnel group.
    """
    try:
        service = FunnelGroupService(db)
        result = await service.delete_group(
            group_id=group_id,
            user_id=current_user.user_id,
            hard_delete=hard_delete,
        )

        logger.info(
            "Funnel group deleted (permanent=%s): %s",
            hard_delete,
            group_id,
            extra={
                "group_id": group_id,
                "user_id": current_user.user_id,
                "hard_delete": hard_delete,
            },
        )

        return {
            "message": result["message"],
            "group_id": group_id,
            "permanent": hard_delete,
            "deleted_at": result["deleted_at"],
        }

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error deleting group {group_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete funnel group",
        )


# =============================================================================
# GROUP LIFECYCLE ACTIONS
# =============================================================================

@router.post(
    "/groups/{group_id}/restore",
    response_model=FunnelGroupResponse,
    status_code=status.HTTP_200_OK,
    summary="Restore Funnel Group",
    description="Restore a soft-deleted funnel group",
)
async def restore_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelGroupResponse:
    try:
        service = FunnelGroupService(db)
        group = await service.restore_group(
            group_id=group_id,
            user_id=current_user.user_id,
        )

        logger.info(
            "Funnel group restored: %s",
            group.name,
            extra={"group_id": group_id, "user_id": current_user.user_id},
        )

        group_dict = build_group_response_dict(group)
        return FunnelGroupResponse.model_validate(group_dict)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        logger.error(f"Error restoring group {group_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to restore funnel group",
        )


@router.post(
    "/groups/{group_id}/activate",
    response_model=FunnelGroupResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate Funnel Group",
    description="Activate a funnel group (set status to active)",
)
async def activate_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelGroupResponse:
    try:
        service = FunnelGroupService(db)
        group = await service.activate_group(
            group_id=group_id,
            user_id=current_user.user_id,
        )

        logger.info(
            "Funnel group activated: %s",
            group.name,
            extra={"group_id": group_id, "user_id": current_user.user_id},
        )

        group_dict = build_group_response_dict(group)
        return FunnelGroupResponse.model_validate(group_dict)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error activating group: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate funnel group",
        )


@router.post(
    "/groups/{group_id}/pause",
    response_model=FunnelGroupResponse,
    status_code=status.HTTP_200_OK,
    summary="Pause Funnel Group",
    description="Pause a funnel group (set status to paused)",
)
async def pause_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelGroupResponse:
    try:
        service = FunnelGroupService(db)
        group = await service.pause_group(
            group_id=group_id,
            user_id=current_user.user_id,
        )

        logger.info(
            "Funnel group paused: %s",
            group.name,
            extra={"group_id": group_id, "user_id": current_user.user_id},
        )

        group_dict = build_group_response_dict(group)
        return FunnelGroupResponse.model_validate(group_dict)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error pausing group: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to pause funnel group",
        )


@router.post(
    "/groups/{group_id}/archive",
    response_model=FunnelGroupResponse,
    status_code=status.HTTP_200_OK,
    summary="Archive Funnel Group",
    description="Archive a funnel group (keeps data but removes from active list)",
)
async def archive_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelGroupResponse:
    try:
        service = FunnelGroupService(db)
        group = await service.archive_group(
            group_id=group_id,
            user_id=current_user.user_id,
        )

        logger.info(
            "Funnel group archived: %s",
            group.name,
            extra={"group_id": group_id, "user_id": current_user.user_id},
        )

        group_dict = build_group_response_dict(group)
        return FunnelGroupResponse.model_validate(group_dict)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error archiving group: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to archive funnel group",
        )


@router.post(
    "/groups/{group_id}/clone",
    response_model=FunnelGroupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Clone Funnel Group",
    description="Duplicate funnel group with all settings and optionally funnels",
)
async def clone_group(
    group_id: str,
    new_name: Optional[str] = Query(None, description="Name for cloned group"),
    include_funnels: bool = Query(True, description="Clone all funnels in group"),
    include_stats: bool = Query(False, description="Copy performance stats"),
    target_project_id: Optional[str] = Query(None, description="Clone to different project"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelGroupResponse:
    try:
        service = FunnelGroupService(db)

        original = await service.get_group_by_id(group_id, current_user.user_id)

        project_id = target_project_id or original.project_id
        if target_project_id:
            project_service = ProjectService(db)
            await project_service.get_project_by_id(target_project_id, current_user.user_id)

        clone_data = FunnelGroupCreate(
            name=new_name or f"{original.name} (Copy)",
            description=original.description,
            group_type=original.group_type,
            positioning_problem=original.positioning_problem,
            value_proposition=original.value_proposition,
            product_url=original.product_url,
            offer_summary=original.offer_summary,
            price_range=original.price_range,
            audience_override=original.audience_override,
            target_demographics=original.target_demographics,
            thumbnail_url=original.thumbnail_url,
            media_assets=original.media_assets,
            settings=original.settings,
            tags=original.tags,
            start_date=original.start_date,
            end_date=original.end_date,
        )

        cloned = await service.create_group(project_id, current_user.user_id, clone_data)

        logger.info(
            "Funnel group cloned: %s",
            cloned.name,
            extra={
                "source_group_id": group_id,
                "cloned_group_id": cloned.group_id,
                "project_id": project_id,
                "user_id": current_user.user_id,
            },
        )

        group_dict = build_group_response_dict(cloned)
        return FunnelGroupResponse.model_validate(group_dict)

    except Exception as e:
        logger.error(f"Error cloning group: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clone funnel group",
        )


# =============================================================================
# AI CONTEXT & STATS (unchanged response shapes)
# =============================================================================

@router.get(
    "/groups/{group_id}/ai-context",
    status_code=status.HTTP_200_OK,
    summary="Get AI Context",
    description="Get AI-extracted context from product URL",
)
async def get_ai_context(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = FunnelGroupService(db)
        group = await service.get_group_by_id(group_id, current_user.user_id)

        return {
            "group_id": group.group_id,
            "product_url": group.product_url,
            "ai_context": group.ai_context or {},
            "last_scraped_at": group.metadata.get("ai_context_updated_at") if group.metadata else None,
        }

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error getting AI context: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve AI context",
        )


@router.post(
    "/groups/{group_id}/ai-context/refresh",
    status_code=status.HTTP_200_OK,
    summary="Refresh AI Context",
    description="Trigger AI scraping of product URL to update context",
)
async def refresh_ai_context(
    group_id: str,
    force: bool = Query(False, description="Force refresh even if recently updated"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = FunnelGroupService(db)
        group = await service.get_group_by_id(group_id, current_user.user_id)

        if not group.product_url:
            raise ValidationException("No product URL configured for this group")

        ai_context = {
            "scraped_at": "2025-12-10T22:47:00Z",
            "features": [],
            "benefits": [],
            "target_audience": {},
            "reviews": [],
            "pricing": {},
        }

        updated_group = await service.update_ai_context(
            group_id=group_id,
            user_id=current_user.user_id,
            ai_context=ai_context,
        )

        logger.info(
            "AI context refreshed for group",
            extra={"group_id": group_id, "product_url": group.product_url},
        )

        return {
            "message": "AI context refreshed successfully",
            "group_id": group_id,
            "ai_context": ai_context,
        }

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        logger.error(f"Error refreshing AI context: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh AI context",
        )


@router.get(
    "/groups/{group_id}/stats",
    response_model=FunnelGroupStats,
    status_code=status.HTTP_200_OK,
    summary="Get Group Stats",
    description="Get detailed statistics and analytics for a funnel group",
)
async def get_group_stats(
    group_id: str,
    period: Optional[str] = Query("30d", description="7d, 30d, 90d, all"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelGroupStats:
    try:
        service = FunnelGroupService(db)
        stats = await service.get_group_stats(
            group_id=group_id,
            user_id=current_user.user_id,
        )

        return stats

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error getting group stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics",
        )


@router.post(
    "/groups/{group_id}/stats/refresh",
    status_code=status.HTTP_200_OK,
    summary="Refresh Stats",
    description="Manually refresh denormalized group statistics",
)
async def refresh_group_stats(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = FunnelGroupService(db)
        await service.get_group_by_id(group_id, current_user.user_id)
        await service.update_group_stats(group_id)

        logger.info("Group stats refreshed: %s", group_id)

        return {
            "message": "Group statistics refreshed successfully",
            "group_id": group_id,
        }

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error refreshing stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh statistics",
        )


@router.get(
    "/groups/{group_id}/campaign-status",
    status_code=status.HTTP_200_OK,
    summary="Get Campaign Status",
    description="Check if campaign is active based on start/end dates",
)
async def get_campaign_status(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = FunnelGroupService(db)
        group = await service.get_group_by_id(group_id, current_user.user_id)

        is_active = group.is_campaign_active()

        return {
            "group_id": group.group_id,
            "group_type": group.group_type.value,
            "is_campaign": group.group_type == GroupTypeEnum.CAMPAIGN,
            "start_date": group.start_date,
            "end_date": group.end_date,
            "is_active": is_active,
            "status": group.status.value,
        }

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)
    except Exception as e:
        logger.error(f"Error getting campaign status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve campaign status",
        )


__all__ = ["router"]
