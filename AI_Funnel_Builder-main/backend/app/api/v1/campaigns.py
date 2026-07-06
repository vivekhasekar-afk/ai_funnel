# =============================================================================
# AI FUNNEL BUILDER - CAMPAIGN ENDPOINTS
# =============================================================================
# Campaign management and deployment endpoints
# =============================================================================

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.models.campaign import Campaign, CampaignStatusEnum, CampaignTypeEnum
from app.models.funnel import Funnel
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignListResponse,
    CampaignDeployRequest,
    CampaignStatsResponse,
)
from app.utils.logger import get_logger
from app.utils.exceptions import NotFoundException, ValidationException
from app.middleware.auth import get_current_user
from sqlalchemy import select, func

logger = get_logger(__name__)

router = APIRouter()


# =============================================================================
# CAMPAIGN CRUD
# =============================================================================

@router.get(
    "",
    response_model=List[CampaignListResponse],
    status_code=status.HTTP_200_OK,
    summary="List Campaigns",
    description="Get list of marketing campaigns"
)
async def list_campaigns(
    status_filter: Optional[CampaignStatusEnum] = Query(None, alias="status"),
    campaign_type: Optional[CampaignTypeEnum] = Query(None),
    funnel_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List campaigns with filters.
    
    Args:
        status_filter: Filter by status (draft, active, paused, completed)
        campaign_type: Filter by type (email, social, ads, etc.)
        funnel_id: Filter by associated funnel
        limit: Maximum results
        offset: Result offset for pagination
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        List of campaigns
    """
    # Build query
    query = select(Campaign).where(Campaign.user_id == current_user["user_id"])
    
    if status_filter:
        query = query.where(Campaign.status == status_filter)
    
    if campaign_type:
        query = query.where(Campaign.campaign_type == campaign_type)
    
    if funnel_id:
        query = query.where(Campaign.funnel_id == funnel_id)
    
    query = query.order_by(Campaign.created_at.desc())
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    campaigns = result.scalars().all()
    
    return [
        CampaignListResponse(
            campaign_id=c.campaign_id,
            name=c.name,
            campaign_type=c.campaign_type,
            status=c.status,
            funnel_id=c.funnel_id,
            budget=c.budget,
            spent=c.spent,
            impressions=c.impressions,
            clicks=c.clicks,
            conversions=c.conversions,
            start_date=c.start_date,
            end_date=c.end_date,
            created_at=c.created_at,
        )
        for c in campaigns
    ]


@router.post(
    "",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Campaign",
    description="Create new marketing campaign"
)
async def create_campaign(
    data: CampaignCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create campaign.
    
    Args:
        data: Campaign data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Created campaign
    """
    # Verify funnel ownership if funnel_id provided
    if data.funnel_id:
        funnel_result = await db.execute(
            select(Funnel).where(
                Funnel.funnel_id == data.funnel_id,
                Funnel.user_id == current_user["user_id"]
            )
        )
        funnel = funnel_result.scalar_one_or_none()
        
        if not funnel:
            raise NotFoundException("Funnel not found", resource_type="funnel")
    
    # Create campaign
    campaign = Campaign(
        user_id=current_user["user_id"],
        name=data.name,
        description=data.description,
        campaign_type=data.campaign_type,
        status=CampaignStatusEnum.DRAFT,
        funnel_id=data.funnel_id,
        budget=data.budget,
        start_date=data.start_date,
        end_date=data.end_date,
        targeting=data.targeting or {},
        creative_assets=data.creative_assets or {},
        tracking_params=data.tracking_params or {},
    )
    
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    
    logger.info(
        f"Campaign created: {campaign.name}",
        extra={
            "user_id": current_user["user_id"],
            "campaign_id": campaign.campaign_id,
            "type": campaign.campaign_type.value
        }
    )
    
    return campaign


@router.get(
    "/{campaign_id}",
    response_model=CampaignResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Campaign",
    description="Get campaign details"
)
async def get_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get campaign by ID.
    
    Args:
        campaign_id: Campaign ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Campaign details
    """
    result = await db.execute(
        select(Campaign).where(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == current_user["user_id"]
        )
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise NotFoundException("Campaign not found", resource_type="campaign")
    
    return campaign


@router.patch(
    "/{campaign_id}",
    response_model=CampaignResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Campaign",
    description="Update campaign details"
)
async def update_campaign(
    campaign_id: str,
    data: CampaignUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update campaign.
    
    Args:
        campaign_id: Campaign ID
        data: Update data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated campaign
    """
    # Get campaign
    result = await db.execute(
        select(Campaign).where(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == current_user["user_id"]
        )
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise NotFoundException("Campaign not found", resource_type="campaign")
    
    # Update fields
    if data.name is not None:
        campaign.name = data.name
    
    if data.description is not None:
        campaign.description = data.description
    
    if data.budget is not None:
        campaign.budget = data.budget
    
    if data.start_date is not None:
        campaign.start_date = data.start_date
    
    if data.end_date is not None:
        campaign.end_date = data.end_date
    
    if data.targeting is not None:
        campaign.targeting = {**campaign.targeting, **data.targeting}
    
    if data.creative_assets is not None:
        campaign.creative_assets = {**campaign.creative_assets, **data.creative_assets}
    
    if data.tracking_params is not None:
        campaign.tracking_params = {**campaign.tracking_params, **data.tracking_params}
    
    await db.commit()
    await db.refresh(campaign)
    
    logger.info(
        f"Campaign updated: {campaign.name}",
        extra={
            "user_id": current_user["user_id"],
            "campaign_id": campaign_id
        }
    )
    
    return campaign


@router.delete(
    "/{campaign_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Campaign",
    description="Delete campaign"
)
async def delete_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete campaign.
    
    Args:
        campaign_id: Campaign ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    # Get campaign
    result = await db.execute(
        select(Campaign).where(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == current_user["user_id"]
        )
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise NotFoundException("Campaign not found", resource_type="campaign")
    
    # Cannot delete active campaigns
    if campaign.status == CampaignStatusEnum.ACTIVE:
        raise ValidationException(
            "Cannot delete active campaign. Please pause it first.",
            field="status"
        )
    
    await db.delete(campaign)
    await db.commit()
    
    logger.info(
        f"Campaign deleted: {campaign_id}",
        extra={
            "user_id": current_user["user_id"],
            "campaign_id": campaign_id
        }
    )
    
    return {
        "message": "Campaign deleted successfully",
        "campaign_id": campaign_id
    }


# =============================================================================
# CAMPAIGN ACTIONS
# =============================================================================

@router.post(
    "/{campaign_id}/deploy",
    response_model=CampaignResponse,
    status_code=status.HTTP_200_OK,
    summary="Deploy Campaign",
    description="Deploy campaign to go live"
)
async def deploy_campaign(
    campaign_id: str,
    data: Optional[CampaignDeployRequest] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deploy campaign.
    
    Activates the campaign and begins tracking.
    
    Args:
        campaign_id: Campaign ID
        data: Optional deployment parameters
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Deployed campaign
    """
    # Get campaign
    result = await db.execute(
        select(Campaign).where(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == current_user["user_id"]
        )
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise NotFoundException("Campaign not found", resource_type="campaign")
    
    # Validate campaign can be deployed
    if campaign.status == CampaignStatusEnum.ACTIVE:
        raise ValidationException("Campaign is already active", field="status")
    
    if not campaign.funnel_id:
        raise ValidationException("Campaign must have an associated funnel", field="funnel_id")
    
    # Update campaign status
    campaign.status = CampaignStatusEnum.ACTIVE
    campaign.deployed_at = datetime.utcnow()
    
    if data and data.start_date:
        campaign.start_date = data.start_date
    elif not campaign.start_date:
        campaign.start_date = datetime.utcnow()
    
    await db.commit()
    await db.refresh(campaign)
    
    logger.info(
        f"Campaign deployed: {campaign.name}",
        extra={
            "user_id": current_user["user_id"],
            "campaign_id": campaign_id
        }
    )
    
    return campaign


@router.post(
    "/{campaign_id}/pause",
    response_model=CampaignResponse,
    status_code=status.HTTP_200_OK,
    summary="Pause Campaign",
    description="Pause active campaign"
)
async def pause_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Pause campaign.
    
    Args:
        campaign_id: Campaign ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Paused campaign
    """
    # Get campaign
    result = await db.execute(
        select(Campaign).where(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == current_user["user_id"]
        )
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise NotFoundException("Campaign not found", resource_type="campaign")
    
    if campaign.status != CampaignStatusEnum.ACTIVE:
        raise ValidationException("Campaign is not active", field="status")
    
    campaign.status = CampaignStatusEnum.PAUSED
    campaign.paused_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(campaign)
    
    logger.info(
        f"Campaign paused: {campaign.name}",
        extra={
            "user_id": current_user["user_id"],
            "campaign_id": campaign_id
        }
    )
    
    return campaign


@router.post(
    "/{campaign_id}/resume",
    response_model=CampaignResponse,
    status_code=status.HTTP_200_OK,
    summary="Resume Campaign",
    description="Resume paused campaign"
)
async def resume_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Resume campaign.
    
    Args:
        campaign_id: Campaign ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Resumed campaign
    """
    # Get campaign
    result = await db.execute(
        select(Campaign).where(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == current_user["user_id"]
        )
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise NotFoundException("Campaign not found", resource_type="campaign")
    
    if campaign.status != CampaignStatusEnum.PAUSED:
        raise ValidationException("Campaign is not paused", field="status")
    
    campaign.status = CampaignStatusEnum.ACTIVE
    campaign.paused_at = None
    
    await db.commit()
    await db.refresh(campaign)
    
    logger.info(
        f"Campaign resumed: {campaign.name}",
        extra={
            "user_id": current_user["user_id"],
            "campaign_id": campaign_id
        }
    )
    
    return campaign


@router.post(
    "/{campaign_id}/duplicate",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate Campaign",
    description="Create a copy of existing campaign"
)
async def duplicate_campaign(
    campaign_id: str,
    new_name: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Duplicate campaign.
    
    Args:
        campaign_id: Campaign ID to duplicate
        new_name: Optional name for duplicated campaign
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Duplicated campaign
    """
    # Get original campaign
    result = await db.execute(
        select(Campaign).where(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == current_user["user_id"]
        )
    )
    original = result.scalar_one_or_none()
    
    if not original:
        raise NotFoundException("Campaign not found", resource_type="campaign")
    
    # Create duplicate
    duplicate = Campaign(
        user_id=current_user["user_id"],
        name=new_name or f"{original.name} (Copy)",
        description=original.description,
        campaign_type=original.campaign_type,
        status=CampaignStatusEnum.DRAFT,
        funnel_id=original.funnel_id,
        budget=original.budget,
        targeting=original.targeting,
        creative_assets=original.creative_assets,
        tracking_params=original.tracking_params,
    )
    
    db.add(duplicate)
    await db.commit()
    await db.refresh(duplicate)
    
    logger.info(
        f"Campaign duplicated: {original.name} → {duplicate.name}",
        extra={
            "user_id": current_user["user_id"],
            "original_id": campaign_id,
            "duplicate_id": duplicate.campaign_id
        }
    )
    
    return duplicate


# =============================================================================
# CAMPAIGN STATISTICS
# =============================================================================

@router.get(
    "/{campaign_id}/stats",
    response_model=CampaignStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Campaign Statistics",
    description="Get campaign performance statistics"
)
async def get_campaign_stats(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get campaign statistics.
    
    Args:
        campaign_id: Campaign ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Campaign statistics
    """
    # Get campaign
    result = await db.execute(
        select(Campaign).where(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == current_user["user_id"]
        )
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise NotFoundException("Campaign not found", resource_type="campaign")
    
    # Calculate metrics
    ctr = (campaign.clicks / campaign.impressions * 100) if campaign.impressions > 0 else 0
    conversion_rate = (campaign.conversions / campaign.clicks * 100) if campaign.clicks > 0 else 0
    cpc = (campaign.spent / campaign.clicks) if campaign.clicks > 0 else 0
    cpa = (campaign.spent / campaign.conversions) if campaign.conversions > 0 else 0
    roi = ((campaign.conversions * 100 - campaign.spent) / campaign.spent * 100) if campaign.spent > 0 else 0
    
    stats = CampaignStatsResponse(
        campaign_id=campaign.campaign_id,
        campaign_name=campaign.name,
        status=campaign.status,
        impressions=campaign.impressions,
        clicks=campaign.clicks,
        conversions=campaign.conversions,
        ctr=round(ctr, 2),
        conversion_rate=round(conversion_rate, 2),
        budget=campaign.budget,
        spent=campaign.spent,
        remaining_budget=campaign.budget - campaign.spent if campaign.budget else None,
        cpc=round(cpc, 2),
        cpa=round(cpa, 2),
        roi=round(roi, 2),
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        days_running=(datetime.utcnow() - campaign.deployed_at).days if campaign.deployed_at else 0,
    )
    
    return stats


# =============================================================================
# CAMPAIGN PERFORMANCE TRACKING
# =============================================================================

@router.post(
    "/{campaign_id}/track",
    status_code=status.HTTP_200_OK,
    summary="Track Campaign Event",
    description="Track campaign performance events"
)
async def track_campaign_event(
    campaign_id: str,
    event_type: str = Query(..., regex="^(impression|click|conversion)$"),
    amount: float = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Track campaign event.
    
    Args:
        campaign_id: Campaign ID
        event_type: Event type (impression, click, conversion)
        amount: Cost amount for this event
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    # Get campaign
    result = await db.execute(
        select(Campaign).where(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == current_user["user_id"]
        )
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise NotFoundException("Campaign not found", resource_type="campaign")
    
    # Update metrics
    if event_type == "impression":
        campaign.impressions += 1
    elif event_type == "click":
        campaign.clicks += 1
    elif event_type == "conversion":
        campaign.conversions += 1
    
    campaign.spent += amount
    
    await db.commit()
    
    logger.info(
        f"Campaign event tracked: {event_type}",
        extra={
            "user_id": current_user["user_id"],
            "campaign_id": campaign_id,
            "event_type": event_type
        }
    )
    
    return {
        "tracked": True,
        "event_type": event_type,
        "campaign_id": campaign_id
    }
