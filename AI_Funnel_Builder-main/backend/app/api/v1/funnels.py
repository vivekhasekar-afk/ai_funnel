# =============================================================================
# AI FUNNEL BUILDER - FUNNEL API ENDPOINTS (ENHANCED HIERARCHY SUPPORT)
# =============================================================================
# Routes for creating, managing, and publishing funnels.
# Supports visual builder, theme customization, A/B testing, and SEO.
# **UPDATED: Matches Service changes (Project → Group → Funnel hierarchy)**
# =============================================================================


from fastapi import APIRouter, Depends, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any


from app.core.database import get_db
from app.services.funnel_service import FunnelService
from app.schemas.funnel import (
    FunnelCreate,
    FunnelUpdate,
    FunnelResponse,
    FunnelPublishRequest,
    FunnelListResponse,
    FunnelLayoutUpdate,
    FunnelThemeUpdate,
    FunnelSEOUpdate,
    FunnelABTestCreate,
    FunnelStatsResponse,
    FunnelBulkMove,
)
from app.models.funnel import FunnelStatusEnum
from app.models.user import User
from app.utils.logger import get_logger
from app.core.dependencies import get_current_user
from app.utils.exceptions import NotFoundException, ValidationException


logger = get_logger(__name__)


router = APIRouter(dependencies=[Depends(get_current_user)])


# =============================================================================
# FUNNEL CRUD (ENHANCED WITH HIERARCHY)
# =============================================================================


@router.get(
    "",
    response_model=FunnelListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Funnels",
    description="List funnels with advanced filtering (project/group/status)."
)
async def list_funnels(
    # Hierarchy filters
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    group_id: Optional[str] = Query(None, description="Filter by group ID"),
    
    # Status & Type filters
    status_filter: Optional[FunnelStatusEnum] = Query(None, alias="status"),
    funnel_type: Optional[str] = Query(None),
    
    # Search & Metadata
    search: Optional[str] = Query(None),
    niche: Optional[str] = Query(None),
    
    # Pagination
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List user's funnels.
    
    **Hierarchy Logic:**
    - Filter by `group_id`: Returns funnels directly in that group.
    - Filter by `project_id`: Returns funnels in ANY group belonging to that project.
    """
    funnel_service = FunnelService(db)
    
    # Get funnels
    funnels_orm = await funnel_service.list_funnels(
        user_id=current_user.user_id,
        project_id=project_id,
        group_id=group_id,
        status=status_filter,
        funnel_type=funnel_type,
        search=search,
        niche=niche,
        limit=limit,
        offset=offset
    )
    
    # Get total count for pagination
    total_count = await funnel_service.get_funnel_count(
        user_id=current_user.user_id,
        project_id=project_id,
        group_id=group_id,
        status=status_filter,
    )


    # Map to response format
    funnel_list = []
    for f in funnels_orm:
        # Resolve hierarchy safely
        group_id_str = str(f.group_id) if f.group_id else None
        project_id_str = str(f.group.project_id) if f.group and f.group.project_id else None
        
        funnel_list.append({
            "funnel_id": str(f.funnel_id),
            "title": f.title,
            "description": f.description,
            "slug": f.slug,
            "status": f.status,
            "funnel_type": f.funnel_type,
            "niche": f.niche,
            "visibility": f.visibility,
            "language": f.language,
            
            # Hierarchy info (Group owns project link)
            "group_id": group_id_str,
            "project_id": project_id_str,
            
            # Stats
            "views_count": f.views_count,
            "starts_count": f.starts_count,
            "completes_count": f.completes_count,
            "leads_count": f.leads_count,
            
            # Computed rates
            "completion_rate": f.completion_rate,
            "view_to_lead_rate": f.view_to_lead_rate,
            "start_rate": f.start_rate,
            
            # Timestamps
            "created_at": f.created_at,
            "updated_at": f.updated_at,
            "last_published_at": f.last_published_at,
            "published_version": f.published_version,
            
            # Metadata
            "tags": f.tags or [],
            "has_custom_theme": bool(f.theme),
            "has_custom_layout": bool(f.layout and f.layout.get("steps")),
        })
    
    return FunnelListResponse(
        funnels=funnel_list,
        total_count=total_count,
        filtered_by_project=project_id,
        filtered_by_group=group_id,
        page=offset // limit + 1 if limit > 0 else 1,
        page_size=limit
    )


@router.post(
    "",
    response_model=FunnelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Funnel",
    description="Create a new funnel in a specific group"
)
async def create_funnel(
    data: FunnelCreate,
    # Optional query param to set hierarchy (simpler for frontend)
    group_id: Optional[str] = Query(None, description="Create in specific group"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FunnelResponse:
    """
    Create a new funnel.
    
    **Hierarchy:**
    - Must provide `group_id` (in body or query param) to place funnel in a project context.
    - Funnels inherit project relationship via their group.
    """
    funnel_service = FunnelService(db)


    # Override group_id from query param if provided
    if group_id:
        data.group_id = group_id


    funnel = await funnel_service.create_funnel(
        user_id=current_user.user_id,
        data=data,
    )
    
    # Resolve project_id for response (from group relationship)
    project_id_resolved = funnel.group.project_id if funnel.group else None


    logger.info(
        f"Funnel created: {funnel.title}",
        extra={
            "user_id": current_user.user_id,
            "funnel_id": str(funnel.funnel_id),
            "group_id": str(funnel.group_id) if funnel.group_id else None,
            "project_id": str(project_id_resolved) if project_id_resolved else None
        },
    )


    return funnel


@router.get(
    "/{funnel_id}",
    response_model=FunnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Funnel",
    description="Get complete funnel details including layout, theme, and hierarchy"
)
async def get_funnel(
    funnel_id: str,
    include_questions: bool = Query(False, description="Include questions in response"),
    include_hierarchy: bool = Query(True, description="Include project/group relationships"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get full funnel data for editor.
    """
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        include_questions=include_questions,
        include_hierarchy=include_hierarchy
    )
    
    return funnel


@router.patch(
    "/{funnel_id}",
    response_model=FunnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Funnel",
    description="Update funnel metadata or move between groups"
)
async def update_funnel(
    funnel_id: str,
    data: FunnelUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update funnel properties.
    
    **Moving Funnels:**
    - Change `group_id` to move the funnel to a different group (and potentially different project).
    """
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.update_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        data=data
    )
    
    logger.info(
        f"Funnel updated: {funnel.title}",
        extra={
            "user_id": current_user.user_id,
            "funnel_id": funnel_id,
            "group_id": str(funnel.group_id) if funnel.group_id else None
        }
    )
    
    return funnel


@router.delete(
    "/{funnel_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Funnel",
    description="Soft delete (trash) or permanently delete funnel"
)
async def delete_funnel(
    funnel_id: str,
    hard_delete: bool = Query(False, description="Permanently delete (cannot be undone)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete funnel (soft delete by default)."""
    funnel_service = FunnelService(db)
    
    await funnel_service.delete_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        hard_delete=hard_delete
    )
    
    return {
        "message": "Funnel deleted successfully",
        "funnel_id": funnel_id,
        "permanent": hard_delete
    }


# =============================================================================
# BULK OPERATIONS
# =============================================================================


@router.post(
    "/bulk/move",
    status_code=status.HTTP_200_OK,
    summary="Bulk Move Funnels",
    description="Move multiple funnels to a different group"
)
async def bulk_move_funnels(
    data: FunnelBulkMove,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk move funnels to a different group.
    
    **Hierarchy Note:**
    - Moving to a new group automatically reassigns funnels to that group's project.
    """
    funnel_service = FunnelService(db)
    
    updated_funnels = await funnel_service.bulk_move_funnels(
        funnel_ids=data.funnel_ids,
        user_id=current_user.user_id,
        target_group_id=data.target_group_id
    )
    
    logger.info(
        f"Bulk moved {len(updated_funnels)} funnels",
        extra={
            "user_id": current_user.user_id,
            "count": len(updated_funnels),
            "target_group_id": data.target_group_id
        }
    )
    
    return {
        "message": f"Successfully moved {len(updated_funnels)} funnels",
        "moved_count": len(updated_funnels),
        "target_group_id": data.target_group_id,
        "funnel_ids": [str(f.funnel_id) for f in updated_funnels]
    }


# =============================================================================
# 🎨 VISUAL BUILDER: LAYOUT & THEME
# =============================================================================


@router.get(
    "/{funnel_id}/layout",
    status_code=status.HTTP_200_OK,
    summary="Get Layout Schema",
    description="Get the complete layout structure for visual editor"
)
async def get_funnel_layout(
    funnel_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get layout schema (steps, sections, components)."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        include_hierarchy=False
    )
    
    return {
        "funnel_id": funnel.funnel_id,
        "layout": funnel.layout or {},
        "template": funnel.get_layout_template() if hasattr(funnel, "get_layout_template") else None
    }


@router.patch(
    "/{funnel_id}/layout",
    status_code=status.HTTP_200_OK,
    summary="Update Layout",
    description="Update the visual layout structure"
)
async def update_funnel_layout(
    funnel_id: str,
    data: FunnelLayoutUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update layout schema (drag/drop, reordering)."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.update_layout(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        layout_data=data
    )
    
    return {
        "message": "Layout updated successfully",
        "funnel_id": funnel.funnel_id,
        "layout": funnel.layout
    }


@router.post(
    "/{funnel_id}/layout/sections",
    status_code=status.HTTP_201_CREATED,
    summary="Add Section",
    description="Add a new section to a specific step"
)
async def add_section_to_step(
    funnel_id: str,
    step_id: str = Body(..., embed=True),
    section: Dict[str, Any] = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a section (hero, form, testimonial) to a step."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.add_section(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        step_id=step_id,
        section=section
    )
    
    return {
        "message": "Section added successfully",
        "funnel_id": funnel.funnel_id,
        "step_id": step_id
    }


@router.patch(
    "/{funnel_id}/theme",
    status_code=status.HTTP_200_OK,
    summary="Update Theme",
    description="Update colors, fonts, spacing"
)
async def update_funnel_theme(
    funnel_id: str,
    data: FunnelThemeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update theme configuration."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.update_theme(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        theme_data=data
    )
    
    return {
        "message": "Theme updated successfully",
        "funnel_id": funnel.funnel_id,
        "theme": funnel.theme
    }


@router.post(
    "/{funnel_id}/theme/preset",
    status_code=status.HTTP_200_OK,
    summary="Apply Theme Preset",
    description="Apply a predefined theme (modern, dark, warm)"
)
async def apply_theme_preset(
    funnel_id: str,
    preset: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Apply a built-in theme preset."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.apply_theme_preset(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        preset=preset
    )
    
    return {
        "message": f"Theme preset '{preset}' applied successfully",
        "funnel_id": funnel.funnel_id,
        "theme": funnel.theme
    }


# =============================================================================
# 📊 SEO MANAGEMENT
# =============================================================================


@router.get(
    "/{funnel_id}/seo",
    status_code=status.HTTP_200_OK,
    summary="Get SEO Metadata"
)
async def get_funnel_seo(
    funnel_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get SEO metadata (meta tags, OG images)."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id
    )
    
    return {
        "funnel_id": funnel.funnel_id,
        "seo_metadata": funnel.seo_metadata or {}
    }


@router.patch(
    "/{funnel_id}/seo",
    status_code=status.HTTP_200_OK,
    summary="Update SEO Metadata"
)
async def update_funnel_seo(
    funnel_id: str,
    data: FunnelSEOUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update SEO metadata."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.update_seo(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        seo_data=data
    )
    
    return {
        "message": "SEO metadata updated successfully",
        "funnel_id": funnel.funnel_id,
        "seo_metadata": funnel.seo_metadata
    }


# =============================================================================
# 🎯 A/B TESTING
# =============================================================================


@router.post(
    "/{funnel_id}/ab-test",
    status_code=status.HTTP_201_CREATED,
    summary="Create A/B Test"
)
async def create_ab_test(
    funnel_id: str,
    data: FunnelABTestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create A/B test with variants."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.create_ab_test(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        test_data=data
    )
    
    return {
        "message": "A/B test created successfully",
        "funnel_id": funnel.funnel_id,
        "test_id": funnel.ab_testing.get("testId"),
        "variants": funnel.ab_testing.get("variants", [])
    }


@router.get(
    "/{funnel_id}/ab-test/results",
    status_code=status.HTTP_200_OK,
    summary="Get A/B Test Results"
)
async def get_ab_test_results(
    funnel_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get A/B test metrics."""
    funnel_service = FunnelService(db)
    return await funnel_service.get_ab_test_results(
        funnel_id=funnel_id,
        user_id=current_user.user_id
    )


# =============================================================================
# LIFECYCLE ACTIONS
# =============================================================================


@router.post(
    "/{funnel_id}/publish",
    response_model=FunnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Publish Funnel"
)
async def publish_funnel(
    funnel_id: str,
    publish_data: Optional[FunnelPublishRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Publish funnel (make live)."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.publish_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        publish_data=publish_data,  # ✅ use publish_data, not data
    )
    
    return funnel


@router.post(
    "/{funnel_id}/unpublish",
    response_model=FunnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Unpublish Funnel"
)
async def unpublish_funnel(
    funnel_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unpublish funnel (revert to draft)."""
    funnel_service = FunnelService(db)
    return await funnel_service.unpublish_funnel(funnel_id, current_user.user_id)


@router.post(
    "/{funnel_id}/pause",
    response_model=FunnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Pause Funnel"
)
async def pause_funnel(
    funnel_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Pause funnel."""
    funnel_service = FunnelService(db)
    return await funnel_service.pause_funnel(funnel_id, current_user.user_id)


@router.post(
    "/{funnel_id}/archive",
    response_model=FunnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Archive Funnel"
)
async def archive_funnel(
    funnel_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Archive funnel."""
    funnel_service = FunnelService(db)
    return await funnel_service.archive_funnel(funnel_id, current_user.user_id)


@router.post(
    "/{funnel_id}/clone",
    response_model=FunnelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Clone Funnel",
    description="Duplicate funnel to any group"
)
async def clone_funnel(
    funnel_id: str,
    new_title: Optional[str] = Query(None, description="Title for cloned funnel"),
    target_group_id: Optional[str] = Query(None, description="Clone to different group"),
    include_stats: bool = Query(False, description="Copy performance stats"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Clone funnel."""
    funnel_service = FunnelService(db)
    
    cloned_funnel = await funnel_service.clone_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        new_title=new_title,
        target_group_id=target_group_id,
        include_stats=include_stats
    )
    
    return cloned_funnel


# =============================================================================
# STATISTICS
# =============================================================================


@router.get(
    "/{funnel_id}/stats",
    response_model=FunnelStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Funnel Stats"
)
async def get_funnel_stats(
    funnel_id: str,
    period: Optional[str] = Query("30d", description="7d, 30d, 90d, all"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get funnel statistics."""
    funnel_service = FunnelService(db)
    
    stats = await funnel_service.get_funnel_stats(
        funnel_id=funnel_id,
        user_id=current_user.user_id,
        period=period
    )
    
    return stats


# =============================================================================
# TEMPLATES
# =============================================================================


@router.post(
    "/from-template/{template_id}",
    response_model=FunnelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create from Template"
)
async def create_from_template(
    template_id: str,
    title: Optional[str] = Query(None),
    group_id: Optional[str] = Query(None, description="Create in specific group"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create funnel from template (into a group)."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.create_from_template(
        template_id=template_id,
        user_id=current_user.user_id,
        title=title,
        group_id=group_id
    )
    
    return funnel


# =============================================================================
# PREVIEW
# =============================================================================


@router.get(
    "/{funnel_id}/preview-url",
    status_code=status.HTTP_200_OK,
    summary="Get Preview URL"
)
async def get_preview_url(
    funnel_id: str,
    variant_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get preview URL."""
    funnel_service = FunnelService(db)
    
    funnel = await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id
    )
    
    base_url = "https://preview.yourapp.com"
    preview_url = f"{base_url}/p/{funnel.slug}"
    
    if variant_id:
        preview_url += f"?variant={variant_id}"
    
    return {
        "funnel_id": funnel.funnel_id,
        "preview_url": preview_url,
        "slug": funnel.slug,
        "variant_id": variant_id
    }


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = ["router"]
