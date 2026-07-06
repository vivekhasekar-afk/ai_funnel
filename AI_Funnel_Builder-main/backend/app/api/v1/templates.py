# =============================================================================
# AI FUNNEL BUILDER - TEMPLATE ENDPOINTS
# =============================================================================
# Template marketplace and management endpoints
# =============================================================================

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.core.database import get_db
from app.services.template_service import TemplateService
from app.services.funnel_service import FunnelService
from app.models.template import TemplateCategoryEnum
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse,
    TemplateUseRequest,
    TemplatePurchaseRequest,
    TemplateRatingRequest,
)
from app.schemas.funnel import FunnelResponse
from app.utils.logger import get_logger
from app.utils.exceptions import NotFoundException
from app.middleware.auth import get_current_user, get_optional_user

logger = get_logger(__name__)

router = APIRouter()


# =============================================================================
# TEMPLATE BROWSING (PUBLIC)
# =============================================================================

@router.get(
    "",
    response_model=List[TemplateListResponse],
    status_code=status.HTTP_200_OK,
    summary="Browse Templates",
    description="Browse template marketplace (public endpoint)"
)
async def list_templates(
    category: Optional[TemplateCategoryEnum] = Query(None),
    industry: Optional[str] = Query(None),
    is_free: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("popular", regex="^(popular|newest|rating|price)$"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: Optional[dict] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Browse template marketplace.
    
    Public endpoint - no authentication required.
    
    Args:
        category: Filter by category
        industry: Filter by industry
        is_free: Filter free/paid templates
        search: Search query
        sort_by: Sort order (popular, newest, rating, price)
        limit: Maximum results (1-50)
        offset: Result offset for pagination
        current_user: Optional authenticated user
        db: Database session
    
    Returns:
        List of templates
    """
    template_service = TemplateService(db)
    
    templates = await template_service.list_templates(
        category=category,
        industry=industry,
        is_free=is_free,
        search=search,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
        user_id=current_user["user_id"] if current_user else None
    )
    
    return templates


@router.get(
    "/featured",
    response_model=List[TemplateListResponse],
    status_code=status.HTTP_200_OK,
    summary="Featured Templates",
    description="Get featured templates"
)
async def get_featured_templates(
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
):
    """
    Get featured templates.
    
    Args:
        limit: Maximum results
        db: Database session
    
    Returns:
        Featured templates
    """
    template_service = TemplateService(db)
    
    templates = await template_service.get_featured_templates(limit=limit)
    
    return templates


@router.get(
    "/categories",
    status_code=status.HTTP_200_OK,
    summary="Template Categories",
    description="Get all template categories with counts"
)
async def get_categories(
    db: AsyncSession = Depends(get_db)
):
    """
    Get template categories.
    
    Args:
        db: Database session
    
    Returns:
        List of categories with template counts
    """
    template_service = TemplateService(db)
    
    categories = await template_service.get_categories_with_counts()
    
    return categories


@router.get(
    "/industries",
    status_code=status.HTTP_200_OK,
    summary="Template Industries",
    description="Get all industries with counts"
)
async def get_industries(
    db: AsyncSession = Depends(get_db)
):
    """
    Get template industries.
    
    Args:
        db: Database session
    
    Returns:
        List of industries with template counts
    """
    template_service = TemplateService(db)
    
    industries = await template_service.get_industries_with_counts()
    
    return industries


# =============================================================================
# TEMPLATE DETAILS
# =============================================================================

@router.get(
    "/{template_id}",
    response_model=TemplateResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Template",
    description="Get template details with preview"
)
async def get_template(
    template_id: str,
    current_user: Optional[dict] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get template details.
    
    Args:
        template_id: Template ID
        current_user: Optional authenticated user
        db: Database session
    
    Returns:
        Template details
    """
    template_service = TemplateService(db)
    
    template = await template_service.get_template(
        template_id=template_id,
        user_id=current_user["user_id"] if current_user else None
    )
    
    # Increment view count
    await template_service.increment_views(template_id)
    
    return template


# =============================================================================
# TEMPLATE USAGE
# =============================================================================

@router.post(
    "/{template_id}/use",
    response_model=FunnelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Use Template",
    description="Create funnel from template"
)
async def use_template(
    template_id: str,
    data: TemplateUseRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create funnel from template.
    
    Args:
        template_id: Template ID
        data: Customization data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Created funnel
    """
    template_service = TemplateService(db)
    funnel_service = FunnelService(db)
    
    # Get template
    template = await template_service.get_template(
        template_id=template_id,
        user_id=current_user["user_id"]
    )
    
    # Check if premium template and user has access
    if not template.is_free:
        has_access = await template_service.check_user_access(
            template_id=template_id,
            user_id=current_user["user_id"]
        )
        
        if not has_access:
            from app.utils.exceptions import ValidationException
            raise ValidationException(
                "This is a premium template. Please purchase it first.",
                field="template_id"
            )
    
    # Create funnel from template
    funnel = await funnel_service.create_from_template(
        template_id=template_id,
        user_id=current_user["user_id"],
        title=data.title,
        customizations=data.customizations
    )
    
    # Increment usage count
    await template_service.increment_usage(template_id)
    
    logger.info(
        f"Funnel created from template: {template.title}",
        extra={
            "user_id": current_user["user_id"],
            "template_id": template_id,
            "funnel_id": funnel.funnel_id
        }
    )
    
    return funnel


# =============================================================================
# TEMPLATE PURCHASE
# =============================================================================

@router.post(
    "/{template_id}/purchase",
    status_code=status.HTTP_200_OK,
    summary="Purchase Template",
    description="Purchase premium template"
)
async def purchase_template(
    template_id: str,
    data: TemplatePurchaseRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Purchase premium template.
    
    Args:
        template_id: Template ID
        data: Purchase data (payment method)
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Purchase confirmation
    """
    template_service = TemplateService(db)
    
    # Get template
    template = await template_service.get_template(
        template_id=template_id,
        user_id=current_user["user_id"]
    )
    
    # Check if already purchased
    has_access = await template_service.check_user_access(
        template_id=template_id,
        user_id=current_user["user_id"]
    )
    
    if has_access:
        return {
            "message": "You already have access to this template",
            "template_id": template_id
        }
    
    # Process purchase (integrate with payment service)
    purchase_record = await template_service.process_purchase(
        template_id=template_id,
        user_id=current_user["user_id"],
        payment_method_id=data.payment_method_id
    )
    
    logger.info(
        f"Template purchased: {template.title}",
        extra={
            "user_id": current_user["user_id"],
            "template_id": template_id,
            "price": template.price
        }
    )
    
    return {
        "message": "Template purchased successfully",
        "template_id": template_id,
        "purchase_id": purchase_record.purchase_id
    }


# =============================================================================
# TEMPLATE CREATION (AUTH REQUIRED)
# =============================================================================

@router.post(
    "",
    response_model=TemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Template",
    description="Submit new template to marketplace"
)
async def create_template(
    data: TemplateCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create/submit template.
    
    Args:
        data: Template data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Created template
    """
    template_service = TemplateService(db)
    
    template = await template_service.create_template(
        user_id=current_user["user_id"],
        data=data
    )
    
    logger.info(
        f"Template created: {template.title}",
        extra={
            "user_id": current_user["user_id"],
            "template_id": template.template_id
        }
    )
    
    return template


@router.get(
    "/my-templates",
    response_model=List[TemplateListResponse],
    status_code=status.HTTP_200_OK,
    summary="My Templates",
    description="Get user's created templates"
)
async def get_my_templates(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's created templates.
    
    Args:
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        User's templates
    """
    template_service = TemplateService(db)
    
    templates = await template_service.get_user_templates(
        user_id=current_user["user_id"]
    )
    
    return templates


@router.patch(
    "/{template_id}",
    response_model=TemplateResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Template",
    description="Update template details"
)
async def update_template(
    template_id: str,
    data: TemplateUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update template.
    
    Args:
        template_id: Template ID
        data: Update data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated template
    """
    template_service = TemplateService(db)
    
    template = await template_service.update_template(
        template_id=template_id,
        user_id=current_user["user_id"],
        data=data
    )
    
    logger.info(
        f"Template updated: {template.title}",
        extra={
            "user_id": current_user["user_id"],
            "template_id": template_id
        }
    )
    
    return template


@router.delete(
    "/{template_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Template",
    description="Delete template from marketplace"
)
async def delete_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete template.
    
    Args:
        template_id: Template ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    template_service = TemplateService(db)
    
    await template_service.delete_template(
        template_id=template_id,
        user_id=current_user["user_id"]
    )
    
    logger.info(
        f"Template deleted: {template_id}",
        extra={
            "user_id": current_user["user_id"],
            "template_id": template_id
        }
    )
    
    return {
        "message": "Template deleted successfully",
        "template_id": template_id
    }


# =============================================================================
# TEMPLATE RATINGS
# =============================================================================

@router.post(
    "/{template_id}/rate",
    status_code=status.HTTP_200_OK,
    summary="Rate Template",
    description="Rate and review template"
)
async def rate_template(
    template_id: str,
    data: TemplateRatingRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Rate template.
    
    Args:
        template_id: Template ID
        data: Rating data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated rating
    """
    template_service = TemplateService(db)
    
    rating = await template_service.rate_template(
        template_id=template_id,
        user_id=current_user["user_id"],
        rating=data.rating,
        review=data.review
    )
    
    logger.info(
        f"Template rated: {template_id} - {data.rating}/5",
        extra={
            "user_id": current_user["user_id"],
            "template_id": template_id,
            "rating": data.rating
        }
    )
    
    return {
        "message": "Rating submitted successfully",
        "template_id": template_id,
        "rating": data.rating
    }


@router.get(
    "/{template_id}/ratings",
    status_code=status.HTTP_200_OK,
    summary="Get Template Ratings",
    description="Get template ratings and reviews"
)
async def get_template_ratings(
    template_id: str,
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    Get template ratings.
    
    Args:
        template_id: Template ID
        limit: Maximum results
        offset: Result offset
        db: Database session
    
    Returns:
        Template ratings and reviews
    """
    template_service = TemplateService(db)
    
    ratings = await template_service.get_template_ratings(
        template_id=template_id,
        limit=limit,
        offset=offset
    )
    
    return ratings


# =============================================================================
# TEMPLATE PREVIEW
# =============================================================================

@router.get(
    "/{template_id}/preview",
    status_code=status.HTTP_200_OK,
    summary="Preview Template",
    description="Get template preview data"
)
async def preview_template(
    template_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get template preview.
    
    Args:
        template_id: Template ID
        db: Database session
    
    Returns:
        Template preview with questions
    """
    template_service = TemplateService(db)
    
    preview = await template_service.get_template_preview(template_id)
    
    return preview


# =============================================================================
# TEMPLATE STATISTICS
# =============================================================================

@router.get(
    "/{template_id}/stats",
    status_code=status.HTTP_200_OK,
    summary="Template Statistics",
    description="Get template usage statistics"
)
async def get_template_stats(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get template statistics (template creator only).
    
    Args:
        template_id: Template ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Template statistics
    """
    template_service = TemplateService(db)
    
    stats = await template_service.get_template_stats(
        template_id=template_id,
        user_id=current_user["user_id"]
    )
    
    return stats
