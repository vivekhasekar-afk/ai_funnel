# =============================================================================
# AI FUNNEL BUILDER - ANALYTICS ENDPOINTS
# =============================================================================
# Analytics and reporting endpoints
# =============================================================================

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date

from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.services.funnel_service import FunnelService
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    FunnelAnalyticsResponse,
    LeadAnalyticsResponse,
    ConversionFunnelResponse,
    QuestionAnalyticsResponse,
    TimeSeriesResponse,
    TrafficSourceResponse,
    DeviceAnalyticsResponse,
)
from app.utils.logger import get_logger
from app.utils.exceptions import NotFoundException
from app.middleware.auth import get_current_user

logger = get_logger(__name__)

router = APIRouter()


# =============================================================================
# OVERVIEW ANALYTICS
# =============================================================================

@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Analytics Overview",
    description="Get high-level analytics dashboard data"
)
async def get_overview(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get overview analytics for dashboard.
    
    Args:
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Overview analytics with key metrics
    """
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    overview = await analytics_service.get_overview_analytics(
        user_id=current_user["user_id"],
        start_date=start_date,
        end_date=end_date
    )
    
    logger.info(
        f"Overview analytics retrieved: {days} days",
        extra={"user_id": current_user["user_id"], "days": days}
    )
    
    return AnalyticsOverviewResponse(**overview)


# =============================================================================
# FUNNEL ANALYTICS
# =============================================================================

@router.get(
    "/funnel/{funnel_id}",
    response_model=FunnelAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Funnel Analytics",
    description="Get detailed analytics for specific funnel"
)
async def get_funnel_analytics(
    funnel_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get funnel analytics.
    
    Args:
        funnel_id: Funnel ID
        start_date: Start date filter
        end_date: End date filter
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Funnel analytics with performance metrics
    """
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    funnel = await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user["user_id"]
    )
    
    analytics_service = AnalyticsService(db)
    
    # Default to last 30 days if not specified
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).date()
    if not end_date:
        end_date = datetime.utcnow().date()
    
    analytics = await analytics_service.get_funnel_analytics(
        funnel_id=funnel_id,
        start_date=datetime.combine(start_date, datetime.min.time()),
        end_date=datetime.combine(end_date, datetime.max.time())
    )
    
    return FunnelAnalyticsResponse(**analytics)


@router.get(
    "/funnel/{funnel_id}/conversion",
    response_model=ConversionFunnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Conversion Funnel",
    description="Get conversion funnel visualization data"
)
async def get_conversion_funnel(
    funnel_id: str,
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get conversion funnel data (step-by-step drop-offs).
    
    Args:
        funnel_id: Funnel ID
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Conversion funnel with drop-off rates
    """
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    funnel = await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user["user_id"]
    )
    
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    conversion_data = await analytics_service.get_conversion_funnel(
        funnel_id=funnel_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return ConversionFunnelResponse(**conversion_data)


# =============================================================================
# LEAD ANALYTICS
# =============================================================================

@router.get(
    "/leads",
    response_model=LeadAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Lead Analytics",
    description="Get lead capture and quality analytics"
)
async def get_lead_analytics(
    funnel_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get lead analytics.
    
    Args:
        funnel_id: Optional funnel filter
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Lead analytics with quality metrics
    """
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    analytics = await analytics_service.get_lead_analytics(
        user_id=current_user["user_id"],
        funnel_id=funnel_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return LeadAnalyticsResponse(**analytics)


# =============================================================================
# QUESTION ANALYTICS
# =============================================================================

@router.get(
    "/questions/{question_id}",
    response_model=QuestionAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Question Analytics",
    description="Get analytics for specific question"
)
async def get_question_analytics(
    question_id: str,
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get question-level analytics.
    
    Args:
        question_id: Question ID
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Question analytics with answer distribution
    """
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    analytics = await analytics_service.get_question_analytics(
        question_id=question_id,
        user_id=current_user["user_id"],
        start_date=start_date,
        end_date=end_date
    )
    
    return QuestionAnalyticsResponse(**analytics)


@router.get(
    "/funnel/{funnel_id}/questions",
    response_model=List[QuestionAnalyticsResponse],
    status_code=status.HTTP_200_OK,
    summary="All Questions Analytics",
    description="Get analytics for all questions in funnel"
)
async def get_all_questions_analytics(
    funnel_id: str,
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get analytics for all questions in funnel.
    
    Args:
        funnel_id: Funnel ID
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        List of question analytics
    """
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    funnel = await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user["user_id"],
        include_questions=True
    )
    
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    all_analytics = []
    for question in funnel.questions:
        analytics = await analytics_service.get_question_analytics(
            question_id=question.question_id,
            user_id=current_user["user_id"],
            start_date=start_date,
            end_date=end_date
        )
        all_analytics.append(QuestionAnalyticsResponse(**analytics))
    
    return all_analytics


# =============================================================================
# TIME-SERIES ANALYTICS
# =============================================================================

@router.get(
    "/time-series",
    response_model=TimeSeriesResponse,
    status_code=status.HTTP_200_OK,
    summary="Time Series Data",
    description="Get time-based metrics (daily/hourly breakdowns)"
)
async def get_time_series(
    metric: str = Query(..., regex="^(views|starts|completions|leads)$"),
    funnel_id: Optional[str] = Query(None),
    granularity: str = Query("daily", regex="^(hourly|daily|weekly|monthly)$"),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get time-series analytics data.
    
    Args:
        metric: Metric to analyze (views, starts, completions, leads)
        funnel_id: Optional funnel filter
        granularity: Time granularity (hourly, daily, weekly, monthly)
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Time-series data points
    """
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    time_series = await analytics_service.get_time_series(
        user_id=current_user["user_id"],
        metric=metric,
        funnel_id=funnel_id,
        start_date=start_date,
        end_date=end_date,
        granularity=granularity
    )
    
    return TimeSeriesResponse(
        metric=metric,
        granularity=granularity,
        data_points=time_series
    )


# =============================================================================
# TRAFFIC ANALYTICS
# =============================================================================

@router.get(
    "/traffic",
    response_model=TrafficSourceResponse,
    status_code=status.HTTP_200_OK,
    summary="Traffic Sources",
    description="Get traffic source breakdown"
)
async def get_traffic_sources(
    funnel_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get traffic source analytics.
    
    Args:
        funnel_id: Optional funnel filter
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Traffic source breakdown
    """
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    traffic_data = await analytics_service.get_traffic_sources(
        user_id=current_user["user_id"],
        funnel_id=funnel_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return TrafficSourceResponse(**traffic_data)


@router.get(
    "/utm",
    status_code=status.HTTP_200_OK,
    summary="UTM Analytics",
    description="Get UTM parameter breakdown"
)
async def get_utm_analytics(
    funnel_id: Optional[str] = Query(None),
    utm_parameter: str = Query("source", regex="^(source|medium|campaign|content|term)$"),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get UTM parameter analytics.
    
    Args:
        funnel_id: Optional funnel filter
        utm_parameter: UTM parameter to analyze
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        UTM parameter breakdown
    """
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    utm_data = await analytics_service.get_utm_analytics(
        user_id=current_user["user_id"],
        funnel_id=funnel_id,
        utm_parameter=utm_parameter,
        start_date=start_date,
        end_date=end_date
    )
    
    return {
        "parameter": utm_parameter,
        "breakdown": utm_data
    }


# =============================================================================
# DEVICE ANALYTICS
# =============================================================================

@router.get(
    "/devices",
    response_model=DeviceAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Device Analytics",
    description="Get device and browser breakdown"
)
async def get_device_analytics(
    funnel_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get device analytics.
    
    Args:
        funnel_id: Optional funnel filter
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Device, browser, and OS breakdown
    """
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    device_data = await analytics_service.get_device_analytics(
        user_id=current_user["user_id"],
        funnel_id=funnel_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return DeviceAnalyticsResponse(**device_data)


# =============================================================================
# GEOGRAPHIC ANALYTICS
# =============================================================================

@router.get(
    "/geographic",
    status_code=status.HTTP_200_OK,
    summary="Geographic Analytics",
    description="Get geographic distribution of responses"
)
async def get_geographic_analytics(
    funnel_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get geographic analytics.
    
    Args:
        funnel_id: Optional funnel filter
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Geographic breakdown by country/region
    """
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    geo_data = await analytics_service.get_geographic_analytics(
        user_id=current_user["user_id"],
        funnel_id=funnel_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return geo_data


# =============================================================================
# PERFORMANCE METRICS
# =============================================================================

@router.get(
    "/performance",
    status_code=status.HTTP_200_OK,
    summary="Performance Metrics",
    description="Get funnel performance benchmarks"
)
async def get_performance_metrics(
    funnel_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get performance metrics and benchmarks.
    
    Args:
        funnel_id: Optional funnel filter
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Performance metrics with benchmarks
    """
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    performance = await analytics_service.get_performance_metrics(
        user_id=current_user["user_id"],
        funnel_id=funnel_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return performance


# =============================================================================
# EXPORT ANALYTICS
# =============================================================================

@router.post(
    "/export",
    status_code=status.HTTP_200_OK,
    summary="Export Analytics",
    description="Export analytics data as CSV/PDF report"
)
async def export_analytics(
    format: str = Query("csv", regex="^(csv|pdf|json)$"),
    funnel_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export analytics report.
    
    Args:
        format: Export format (csv, pdf, json)
        funnel_id: Optional funnel filter
        days: Number of days to include
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Analytics report file
    """
    analytics_service = AnalyticsService(db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    # TODO: Implement export functionality
    # For now, return a placeholder
    
    logger.info(
        f"Analytics export requested: {format}",
        extra={
            "user_id": current_user["user_id"],
            "format": format,
            "funnel_id": funnel_id
        }
    )
    
    return {
        "message": "Export functionality coming soon",
        "format": format
    }
