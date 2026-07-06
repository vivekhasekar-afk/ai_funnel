# =============================================================================
# AI FUNNEL BUILDER - LEAD ENDPOINTS
# =============================================================================
# Lead management and export endpoints
# =============================================================================

from fastapi import APIRouter, Depends, status, Query, Response as FastAPIResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime, date
import csv
import io
import json

from app.core.database import get_db
from app.services.lead_service import LeadService
from app.models.lead import LeadStatusEnum, LeadSourceEnum
from app.schemas.lead import (
    LeadResponse,
    LeadUpdate,
    LeadSearchParams,
    LeadExportRequest,
    LeadStatsResponse,
)
from app.utils.logger import get_logger
from app.utils.exceptions import NotFoundException
from app.middleware.auth import get_current_user

logger = get_logger(__name__)

router = APIRouter()


# =============================================================================
# LEAD LISTING & SEARCH
# =============================================================================

@router.get(
    "",
    response_model=List[LeadResponse],
    status_code=status.HTTP_200_OK,
    summary="List Leads",
    description="Get list of captured leads with filters"
)
async def list_leads(
    funnel_id: Optional[str] = Query(None),
    status_filter: Optional[LeadStatusEnum] = Query(None, alias="status"),
    source: Optional[LeadSourceEnum] = Query(None),
    search: Optional[str] = Query(None),
    min_score: Optional[int] = Query(None, ge=0, le=100),
    created_after: Optional[date] = Query(None),
    created_before: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List leads with filters.
    
    Args:
        funnel_id: Filter by funnel
        status_filter: Filter by status
        source: Filter by source
        search: Search query (email, name, company)
        min_score: Minimum lead score
        created_after: Created after date
        created_before: Created before date
        limit: Maximum results (1-100)
        offset: Result offset for pagination
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        List of leads with total count
    """
    lead_service = LeadService(db)
    
    # Build search params
    search_params = LeadSearchParams(
        funnel_id=funnel_id,
        status=status_filter,
        source=source,
        search=search,
        min_score=min_score,
        created_after=datetime.combine(created_after, datetime.min.time()) if created_after else None,
        created_before=datetime.combine(created_before, datetime.max.time()) if created_before else None,
        limit=limit,
        offset=offset,
        sort_by="created_at",
        include_deleted=False
    )
    
    leads, total_count = await lead_service.search_leads(
        user_id=current_user["user_id"],
        params=search_params
    )
    
    return leads


@router.get(
    "/search",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Search Leads",
    description="Advanced lead search with pagination info"
)
async def search_leads(
    funnel_id: Optional[str] = Query(None),
    status_filter: Optional[LeadStatusEnum] = Query(None, alias="status"),
    source: Optional[LeadSourceEnum] = Query(None),
    search: Optional[str] = Query(None),
    min_score: Optional[int] = Query(None, ge=0, le=100),
    max_score: Optional[int] = Query(None, ge=0, le=100),
    tags: Optional[List[str]] = Query(None),
    created_after: Optional[date] = Query(None),
    created_before: Optional[date] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|score|email)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Advanced lead search with full pagination metadata.
    
    Returns:
        Paginated search results with metadata
    """
    lead_service = LeadService(db)
    
    # Build search params
    search_params = LeadSearchParams(
        funnel_id=funnel_id,
        status=status_filter,
        source=source,
        search=search,
        min_score=min_score,
        max_score=max_score,
        tags=tags,
        created_after=datetime.combine(created_after, datetime.min.time()) if created_after else None,
        created_before=datetime.combine(created_before, datetime.max.time()) if created_before else None,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
        include_deleted=False
    )
    
    leads, total_count = await lead_service.search_leads(
        user_id=current_user["user_id"],
        params=search_params
    )
    
    return {
        "data": leads,
        "pagination": {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total_count,
            "page": (offset // limit) + 1,
            "total_pages": (total_count + limit - 1) // limit
        }
    }


# =============================================================================
# LEAD CRUD
# =============================================================================

@router.get(
    "/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Lead",
    description="Get lead details by ID"
)
async def get_lead(
    lead_id: str,
    include_response: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get lead by ID.
    
    Args:
        lead_id: Lead ID
        include_response: Include funnel response data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Lead details
    """
    lead_service = LeadService(db)
    
    lead = await lead_service.get_lead(
        lead_id=lead_id,
        user_id=current_user["user_id"],
        include_response=include_response
    )
    
    return lead


@router.patch(
    "/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Lead",
    description="Update lead information"
)
async def update_lead(
    lead_id: str,
    data: LeadUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update lead.
    
    Args:
        lead_id: Lead ID
        data: Update data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated lead
    """
    lead_service = LeadService(db)
    
    lead = await lead_service.update_lead(
        lead_id=lead_id,
        user_id=current_user["user_id"],
        data=data
    )
    
    logger.info(
        f"Lead updated: {lead.email}",
        extra={"user_id": current_user["user_id"], "lead_id": lead_id}
    )
    
    return lead


@router.delete(
    "/{lead_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Lead",
    description="Delete lead (GDPR compliance)"
)
async def delete_lead(
    lead_id: str,
    hard_delete: bool = Query(False, description="Permanently delete (cannot be undone)"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete lead.
    
    Args:
        lead_id: Lead ID
        hard_delete: Permanent deletion for GDPR compliance
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    lead_service = LeadService(db)
    
    await lead_service.delete_lead(
        lead_id=lead_id,
        user_id=current_user["user_id"],
        hard_delete=hard_delete
    )
    
    logger.info(
        f"Lead deleted: {lead_id} (hard={hard_delete})",
        extra={"user_id": current_user["user_id"], "lead_id": lead_id}
    )
    
    return {
        "message": "Lead deleted successfully",
        "lead_id": lead_id,
        "permanent": hard_delete
    }


# =============================================================================
# LEAD EXPORT
# =============================================================================

@router.post(
    "/export",
    status_code=status.HTTP_200_OK,
    summary="Export Leads",
    description="Export leads to CSV or JSON format"
)
async def export_leads(
    format: str = Query("csv", regex="^(csv|json)$"),
    funnel_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export leads to CSV or JSON.
    
    Args:
        format: Export format (csv or json)
        funnel_id: Optional funnel filter
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        File download with leads data
    """
    lead_service = LeadService(db)
    
    # Get leads data
    export_data = await lead_service.export_leads(
        user_id=current_user["user_id"],
        funnel_id=funnel_id,
        format=format
    )
    
    logger.info(
        f"Leads exported: {len(export_data)} leads ({format})",
        extra={"user_id": current_user["user_id"], "format": format}
    )
    
    # Generate file
    if format == "csv":
        # Create CSV
        output = io.StringIO()
        if export_data:
            writer = csv.DictWriter(output, fieldnames=export_data[0].keys())
            writer.writeheader()
            writer.writerows(export_data)
        
        content = output.getvalue()
        media_type = "text/csv"
        filename = f"leads_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    else:  # json
        content = json.dumps(export_data, indent=2, default=str)
        media_type = "application/json"
        filename = f"leads_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    
    return FastAPIResponse(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


# =============================================================================
# LEAD STATISTICS
# =============================================================================

@router.get(
    "/stats",
    response_model=LeadStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Lead Statistics",
    description="Get lead capture and quality statistics"
)
async def get_lead_stats(
    funnel_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get lead statistics.
    
    Args:
        funnel_id: Optional funnel filter
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Lead statistics
    """
    lead_service = LeadService(db)
    
    analytics = await lead_service.get_lead_analytics(
        user_id=current_user["user_id"],
        funnel_id=funnel_id,
        days=days
    )
    
    return LeadStatsResponse(**analytics)


# =============================================================================
# LEAD TAGS
# =============================================================================

@router.post(
    "/{lead_id}/tags",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Add Tags",
    description="Add tags to lead"
)
async def add_tags(
    lead_id: str,
    tags: List[str],
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add tags to lead.
    
    Args:
        lead_id: Lead ID
        tags: List of tags to add
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated lead
    """
    lead_service = LeadService(db)
    
    # Get lead
    lead = await lead_service.get_lead(lead_id, current_user["user_id"])
    
    # Add tags (avoid duplicates)
    existing_tags = set(lead.tags or [])
    new_tags = list(existing_tags | set(tags))
    
    # Update lead
    lead = await lead_service.update_lead(
        lead_id=lead_id,
        user_id=current_user["user_id"],
        data=LeadUpdate(tags=new_tags)
    )
    
    logger.info(
        f"Tags added to lead: {lead_id}",
        extra={"lead_id": lead_id, "tags": tags}
    )
    
    return lead


@router.delete(
    "/{lead_id}/tags/{tag}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove Tag",
    description="Remove tag from lead"
)
async def remove_tag(
    lead_id: str,
    tag: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove tag from lead.
    
    Args:
        lead_id: Lead ID
        tag: Tag to remove
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated lead
    """
    lead_service = LeadService(db)
    
    # Get lead
    lead = await lead_service.get_lead(lead_id, current_user["user_id"])
    
    # Remove tag
    if lead.tags and tag in lead.tags:
        new_tags = [t for t in lead.tags if t != tag]
        
        # Update lead
        lead = await lead_service.update_lead(
            lead_id=lead_id,
            user_id=current_user["user_id"],
            data=LeadUpdate(tags=new_tags)
        )
    
    return lead


# =============================================================================
# BULK OPERATIONS
# =============================================================================

@router.post(
    "/bulk-action",
    status_code=status.HTTP_200_OK,
    summary="Bulk Action",
    description="Perform bulk actions on multiple leads"
)
async def bulk_action(
    lead_ids: List[str],
    action: str = Query(..., regex="^(delete|update_status|add_tags|export)$"),
    status_update: Optional[LeadStatusEnum] = None,
    tags: Optional[List[str]] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Perform bulk action on leads.
    
    Args:
        lead_ids: List of lead IDs
        action: Action to perform (delete, update_status, add_tags, export)
        status_update: New status (for update_status action)
        tags: Tags to add (for add_tags action)
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Action result
    """
    lead_service = LeadService(db)
    
    success_count = 0
    failed_count = 0
    
    for lead_id in lead_ids:
        try:
            if action == "delete":
                await lead_service.delete_lead(lead_id, current_user["user_id"])
            
            elif action == "update_status" and status_update:
                await lead_service.update_lead(
                    lead_id, 
                    current_user["user_id"],
                    LeadUpdate(status=status_update)
                )
            
            elif action == "add_tags" and tags:
                lead = await lead_service.get_lead(lead_id, current_user["user_id"])
                existing_tags = set(lead.tags or [])
                new_tags = list(existing_tags | set(tags))
                await lead_service.update_lead(
                    lead_id,
                    current_user["user_id"],
                    LeadUpdate(tags=new_tags)
                )
            
            success_count += 1
        
        except Exception as e:
            logger.error(f"Bulk action failed for lead {lead_id}: {e}")
            failed_count += 1
    
    logger.info(
        f"Bulk action completed: {action}",
        extra={
            "user_id": current_user["user_id"],
            "action": action,
            "success": success_count,
            "failed": failed_count
        }
    )
    
    return {
        "message": f"Bulk {action} completed",
        "success_count": success_count,
        "failed_count": failed_count,
        "total": len(lead_ids)
    }


# =============================================================================
# LEAD SEGMENTATION
# =============================================================================

@router.post(
    "/segment",
    response_model=List[LeadResponse],
    status_code=status.HTTP_200_OK,
    summary="Segment Leads",
    description="Get leads matching segmentation criteria"
)
async def segment_leads(
    segment_criteria: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Segment leads based on criteria.
    
    Args:
        segment_criteria: Segmentation criteria
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Segmented leads
    """
    lead_service = LeadService(db)
    
    leads = await lead_service.segment_leads(
        user_id=current_user["user_id"],
        segment_criteria=segment_criteria
    )
    
    logger.info(
        f"Leads segmented: {len(leads)} matches",
        extra={
            "user_id": current_user["user_id"],
            "criteria": segment_criteria
        }
    )
    
    return leads
