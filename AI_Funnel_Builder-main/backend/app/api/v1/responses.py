# =============================================================================
# AI FUNNEL BUILDER - RESPONSE ENDPOINTS
# =============================================================================
# Response submission and tracking endpoints
# =============================================================================

from fastapi import APIRouter, Depends, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.models.response import Response, ResponseStatusEnum
from app.models.response_answer import ResponseAnswer
from app.models.funnel import Funnel
from app.models.question import Question
from app.schemas.response import (
    ResponseSubmitRequest,
    ResponseSubmitResponse,
    ResponseDetailResponse,
    ResponseListResponse,
    EventTrackRequest,
)
from app.utils.logger import get_logger
from app.utils.exceptions import NotFoundException, ValidationException
from app.utils.helpers import get_client_ip, parse_user_agent
from app.middleware.auth import get_current_user
from sqlalchemy import select, func

logger = get_logger(__name__)

router = APIRouter()


# =============================================================================
# PUBLIC RESPONSE SUBMISSION
# =============================================================================

@router.post(
    "/submit",
    response_model=ResponseSubmitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Response",
    description="Submit funnel response (public endpoint, no auth required)"
)
async def submit_response(
    data: ResponseSubmitRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit funnel response with answers.
    
    This is a public endpoint for submitting responses to published funnels.
    
    Args:
        data: Response submission data
        request: FastAPI request
        db: Database session
    
    Returns:
        Created response with ID
    """
    # Get funnel
    funnel_result = await db.execute(
        select(Funnel).where(Funnel.funnel_id == data.funnel_id)
    )
    funnel = funnel_result.scalar_one_or_none()
    
    if not funnel:
        raise NotFoundException("Funnel not found", resource_type="funnel")
    
    # Check if funnel is published
    if funnel.status != "published":
        raise ValidationException("Funnel is not published", field="funnel_id")
    
    # Extract request metadata
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    device_info = parse_user_agent(user_agent)
    
    # Create response record
    response = Response(
        funnel_id=data.funnel_id,
        status=ResponseStatusEnum.IN_PROGRESS,
        started_at=datetime.utcnow(),
        ip_address=ip_address,
        user_agent=user_agent,
        device_type=device_info.get("device_type"),
        browser=device_info.get("browser"),
        os=device_info.get("os"),
        country=data.country,
        region=data.region,
        city=data.city,
        utm_source=data.utm_source,
        utm_medium=data.utm_medium,
        utm_campaign=data.utm_campaign,
        utm_content=data.utm_content,
        utm_term=data.utm_term,
        referrer=data.referrer,
    )
    
    db.add(response)
    await db.flush()  # Get response ID
    
    # Save answers
    if data.answers:
        for answer_data in data.answers:
            answer = ResponseAnswer(
                response_id=response.response_id,
                question_id=answer_data.question_id,
                answer_value=answer_data.answer_value,
                answer_text=answer_data.answer_text,
            )
            db.add(answer)
        
        # Update progress
        response.progress = len(data.answers)
    
    # If submission includes all required answers, mark as completed
    if data.is_complete:
        response.status = ResponseStatusEnum.COMPLETED
        response.completed_at = datetime.utcnow()
        response.completion_time_seconds = (
            datetime.utcnow() - response.started_at
        ).total_seconds()
    
    await db.commit()
    await db.refresh(response)
    
    # Update funnel stats
    if data.is_complete:
        funnel.completions_count += 1
    funnel.starts_count += 1
    await db.commit()
    
    logger.info(
        f"Response submitted: {response.response_id} (complete={data.is_complete})",
        extra={
            "funnel_id": data.funnel_id,
            "response_id": response.response_id,
            "is_complete": data.is_complete
        }
    )
    
    return ResponseSubmitResponse(
        response_id=response.response_id,
        funnel_id=funnel.funnel_id,
        status=response.status,
        message="Response submitted successfully"
    )


# =============================================================================
# RESPONSE MANAGEMENT (AUTH REQUIRED)
# =============================================================================

@router.get(
    "/{response_id}",
    response_model=ResponseDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Response",
    description="Get response details by ID"
)
async def get_response(
    response_id: str,
    include_answers: bool = Query(True),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get response details.
    
    Args:
        response_id: Response ID
        include_answers: Include answers in response
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Response details
    """
    # Get response with funnel
    result = await db.execute(
        select(Response)
        .join(Funnel)
        .where(
            Response.response_id == response_id,
            Funnel.user_id == current_user["user_id"]
        )
    )
    response = result.scalar_one_or_none()
    
    if not response:
        raise NotFoundException("Response not found", resource_type="response")
    
    # Get answers if requested
    answers = []
    if include_answers:
        answers_result = await db.execute(
            select(ResponseAnswer)
            .where(ResponseAnswer.response_id == response_id)
            .order_by(ResponseAnswer.created_at)
        )
        answers = answers_result.scalars().all()
    
    return ResponseDetailResponse(
        response_id=response.response_id,
        funnel_id=response.funnel_id,
        status=response.status,
        started_at=response.started_at,
        completed_at=response.completed_at,
        completion_time_seconds=response.completion_time_seconds,
        progress=response.progress,
        answers=[
            {
                "question_id": a.question_id,
                "answer_value": a.answer_value,
                "answer_text": a.answer_text,
                "created_at": a.created_at
            }
            for a in answers
        ] if include_answers else None,
        metadata={
            "ip_address": response.ip_address,
            "device_type": response.device_type,
            "browser": response.browser,
            "os": response.os,
            "country": response.country,
            "utm_source": response.utm_source,
            "utm_medium": response.utm_medium,
        }
    )


@router.get(
    "/funnels/{funnel_id}/responses",
    response_model=List[ResponseListResponse],
    status_code=status.HTTP_200_OK,
    summary="List Funnel Responses",
    description="Get all responses for a funnel"
)
async def list_funnel_responses(
    funnel_id: str,
    status_filter: Optional[ResponseStatusEnum] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List funnel responses.
    
    Args:
        funnel_id: Funnel ID
        status_filter: Filter by status
        limit: Maximum results
        offset: Result offset
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        List of responses
    """
    # Verify funnel ownership
    funnel_result = await db.execute(
        select(Funnel).where(
            Funnel.funnel_id == funnel_id,
            Funnel.user_id == current_user["user_id"]
        )
    )
    funnel = funnel_result.scalar_one_or_none()
    
    if not funnel:
        raise NotFoundException("Funnel not found", resource_type="funnel")
    
    # Build query
    query = select(Response).where(Response.funnel_id == funnel_id)
    
    if status_filter:
        query = query.where(Response.status == status_filter)
    
    query = query.order_by(Response.created_at.desc())
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    responses = result.scalars().all()
    
    return [
        ResponseListResponse(
            response_id=r.response_id,
            funnel_id=r.funnel_id,
            status=r.status,
            started_at=r.started_at,
            completed_at=r.completed_at,
            completion_time_seconds=r.completion_time_seconds,
            progress=r.progress,
            device_type=r.device_type,
            country=r.country,
        )
        for r in responses
    ]


@router.patch(
    "/{response_id}",
    response_model=ResponseDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Response",
    description="Update response metadata or status"
)
async def update_response(
    response_id: str,
    status_update: Optional[ResponseStatusEnum] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update response.
    
    Args:
        response_id: Response ID
        status_update: New status
        notes: Internal notes
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated response
    """
    # Get response with ownership check
    result = await db.execute(
        select(Response)
        .join(Funnel)
        .where(
            Response.response_id == response_id,
            Funnel.user_id == current_user["user_id"]
        )
    )
    response = result.scalar_one_or_none()
    
    if not response:
        raise NotFoundException("Response not found", resource_type="response")
    
    # Update fields
    if status_update:
        response.status = status_update
    
    if notes is not None:
        # Store notes in a custom field (add to model if needed)
        pass
    
    await db.commit()
    await db.refresh(response)
    
    logger.info(
        f"Response updated: {response_id}",
        extra={"response_id": response_id, "user_id": current_user["user_id"]}
    )
    
    return response


@router.delete(
    "/{response_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Response",
    description="Delete response (GDPR compliance)"
)
async def delete_response(
    response_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete response.
    
    Args:
        response_id: Response ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    # Get response with ownership check
    result = await db.execute(
        select(Response)
        .join(Funnel)
        .where(
            Response.response_id == response_id,
            Funnel.user_id == current_user["user_id"]
        )
    )
    response = result.scalar_one_or_none()
    
    if not response:
        raise NotFoundException("Response not found", resource_type="response")
    
    # Delete response (cascades to answers)
    await db.delete(response)
    await db.commit()
    
    logger.info(
        f"Response deleted: {response_id}",
        extra={"response_id": response_id, "user_id": current_user["user_id"]}
    )
    
    return {
        "message": "Response deleted successfully",
        "response_id": response_id
    }


# =============================================================================
# RESPONSE COMPLETION
# =============================================================================

@router.post(
    "/{response_id}/complete",
    response_model=ResponseDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete Response",
    description="Mark response as completed"
)
async def complete_response(
    response_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Mark response as completed (public endpoint).
    
    Args:
        response_id: Response ID
        request: FastAPI request
        db: Database session
    
    Returns:
        Completed response
    """
    # Get response
    result = await db.execute(
        select(Response).where(Response.response_id == response_id)
    )
    response = result.scalar_one_or_none()
    
    if not response:
        raise NotFoundException("Response not found", resource_type="response")
    
    # Mark as completed
    if response.status != ResponseStatusEnum.COMPLETED:
        response.status = ResponseStatusEnum.COMPLETED
        response.completed_at = datetime.utcnow()
        response.completion_time_seconds = (
            datetime.utcnow() - response.started_at
        ).total_seconds()
        
        # Update funnel completion count
        await db.execute(
            select(Funnel)
            .where(Funnel.funnel_id == response.funnel_id)
        )
        await db.execute(
            f"UPDATE funnels SET completions_count = completions_count + 1 WHERE funnel_id = '{response.funnel_id}'"
        )
        
        await db.commit()
        await db.refresh(response)
        
        logger.info(
            f"Response completed: {response_id}",
            extra={
                "response_id": response_id,
                "completion_time": response.completion_time_seconds
            }
        )
    
    return response


# =============================================================================
# EVENT TRACKING
# =============================================================================

@router.post(
    "/track-event",
    status_code=status.HTTP_200_OK,
    summary="Track Event",
    description="Track interaction events (views, clicks, etc.)"
)
async def track_event(
    data: EventTrackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Track funnel interaction events.
    
    Args:
        data: Event data
        request: FastAPI request
        db: Database session
    
    Returns:
        Success message
    """
    # TODO: Store events in analytics table for real-time tracking
    
    logger.info(
        f"Event tracked: {data.event_type}",
        extra={
            "funnel_id": data.funnel_id,
            "event_type": data.event_type,
            "response_id": data.response_id
        }
    )
    
    return {
        "message": "Event tracked successfully",
        "event_type": data.event_type
    }


# =============================================================================
# RESPONSE STATISTICS
# =============================================================================

@router.get(
    "/funnels/{funnel_id}/response-stats",
    status_code=status.HTTP_200_OK,
    summary="Response Statistics",
    description="Get response statistics for funnel"
)
async def get_response_stats(
    funnel_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get response statistics.
    
    Args:
        funnel_id: Funnel ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Response statistics
    """
    # Verify funnel ownership
    funnel_result = await db.execute(
        select(Funnel).where(
            Funnel.funnel_id == funnel_id,
            Funnel.user_id == current_user["user_id"]
        )
    )
    funnel = funnel_result.scalar_one_or_none()
    
    if not funnel:
        raise NotFoundException("Funnel not found", resource_type="funnel")
    
    # Get statistics
    total_result = await db.execute(
        select(func.count(Response.response_id))
        .where(Response.funnel_id == funnel_id)
    )
    total_responses = total_result.scalar_one() or 0
    
    completed_result = await db.execute(
        select(func.count(Response.response_id))
        .where(
            Response.funnel_id == funnel_id,
            Response.status == ResponseStatusEnum.COMPLETED
        )
    )
    completed_responses = completed_result.scalar_one() or 0
    
    avg_time_result = await db.execute(
        select(func.avg(Response.completion_time_seconds))
        .where(
            Response.funnel_id == funnel_id,
            Response.status == ResponseStatusEnum.COMPLETED
        )
    )
    avg_completion_time = avg_time_result.scalar_one() or 0
    
    return {
        "total_responses": total_responses,
        "completed_responses": completed_responses,
        "in_progress_responses": total_responses - completed_responses,
        "completion_rate": (completed_responses / total_responses * 100) if total_responses > 0 else 0,
        "avg_completion_time_seconds": round(float(avg_completion_time), 2)
    }
