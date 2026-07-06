# =============================================================================
# AI FUNNEL BUILDER - AI ROUTES (PRODUCTION)
# =============================================================================
# OpenAI-powered funnel generation with credit management & task tracking
# =============================================================================

import uuid
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.ai import (
    FunnelGenerationRequest,
    FunnelGenerationResponse,
    GeneratedQuestion,
    FunnelFormatEnum,
    QuestionOptimizationRequest,
    QuestionOptimizationResponse,
)
from app.services.ai_service import AIService
from app.services.ai_credit import ai_credit_manager
from app.models.funnel import Funnel
from app.models.ai_task import AITask, TaskStatus  # You'll need to create this model
from app.utils.exceptions import AIGenerationException, AIQuotaExceededException
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_user_id(current_user: dict) -> str:
    """Extract user ID from current_user (dict or object)."""
    if isinstance(current_user, dict):
        return current_user.get("user_id") or current_user.get("id")
    return getattr(current_user, "user_id", None) or getattr(current_user, "id", None)


async def save_task_to_db(
    db: AsyncSession,
    task_id: str,
    user_id: str,
    task_type: str,
    status: TaskStatus,
    metadata: Optional[Dict[str, Any]] = None
) -> AITask:
    """Save AI task to database."""
    task = AITask(
        task_id=task_id,
        user_id=user_id,
        task_type=task_type,
        status=status,
        metadata=metadata or {},
        created_at=datetime.utcnow()
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def update_task_status(
    db: AsyncSession,
    task_id: str,
    status: TaskStatus,
    result: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None
):
    """Update task status in database."""
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow()
    }
    
    if result:
        update_data["result"] = result
    if error:
        update_data["error_message"] = error
    
    await db.execute(
        update(AITask)
        .where(AITask.task_id == task_id)
        .values(**update_data)
    )
    await db.commit()


# =============================================================================
# BACKGROUND TASK PROCESSOR
# =============================================================================

async def process_funnel_generation(
    task_id: str,
    request_data: Dict[str, Any],
    user_id: str
):
    """
    Background task to generate funnel using OpenAI.
    
    This runs asynchronously after the API returns the task ID to the client.
    """
    # ✅ FIXED: Use AsyncSessionLocal (not async_session_maker)
    from app.core.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        try:
            logger.info(f"🚀 Starting funnel generation: {task_id}")
            
            # Update status to processing
            await update_task_status(db, task_id, TaskStatus.PROCESSING)
            
            # Initialize AI service
            ai_service = AIService(db)
            
            # Convert dict back to Pydantic model
            request = FunnelGenerationRequest(**request_data)
            
            # Track token usage estimate
            estimated_tokens = len(request.niche + request.goal + request.target_audience) * 2
            
            # Initialize credit manager
            await ai_credit_manager.initialize()
            
            # Check quota
            await ai_credit_manager.check_quota(user_id, estimated_tokens, db)
            
            # 🤖 GENERATE FUNNEL USING OPENAI
            start_time = datetime.utcnow()
            result = await ai_service.generate_funnel(request, user_id)
            generation_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            # Track actual usage
            input_tokens = estimated_tokens
            output_tokens = len(str(result.dict())) // 4
            
            await ai_credit_manager.track_usage(
                user_id=user_id,
                model="gpt-4",
                input_tokens=input_tokens,
                output_tokens=output_tokens
            )
            
            # ✅ FIXED: Prepare result using correct schema field names
            result_data = {
                "task_id": task_id,
                "status": "completed",
                "message": "Funnel generated successfully!",
                "credits_consumed": 250,
                "funnel_title": result.funnel_title or f"Discover Your Perfect {request.niche} Solution",
                "funnel_description": result.funnel_description or f"Personalized recommendations for {request.target_audience}",
                "recommended_format": result.recommended_format or "quiz",
                "format_reasoning": result.format_reasoning or "AI-optimized for maximum engagement",
                "questions": [
                    {
                        "question_text": q.get("question_text"),
                        "question_type": q.get("question_type"),
                        "description": q.get("description"),
                        "options": q.get("options", {}),
                        "display_order": i + 1,
                        "required": q.get("is_required", True),
                    }
                    for i, q in enumerate(result.questions[:10] if result.questions else [])
                ],
                "suggested_config": result.suggested_config or {
                    "theme": "modern",
                    "progress_bar": True,
                    "estimated_time": "2-3 minutes",
                },
                "predicted_completion_rate": result.predicted_completion_rate or 0.72,
                "predicted_lead_capture_rate": result.predicted_lead_capture_rate or 0.58,
                "generation_time_ms": generation_time_ms,
                "model_version": result.model_version or "gpt-4",
                "confidence_score": result.confidence_score or 0.89,
            }
            
            # Save result to database
            await update_task_status(db, task_id, TaskStatus.COMPLETED, result=result_data)
            
            logger.info(f"✅ Funnel generation completed: {task_id} ({generation_time_ms}ms)")
            
        except AIQuotaExceededException as e:
            logger.error(f"❌ Quota exceeded for task {task_id}: {str(e)}")
            await update_task_status(
                db, task_id, TaskStatus.FAILED,
                error=f"AI quota exceeded: {str(e)}"
            )
            
        except AIGenerationException as e:
            logger.error(f"❌ AI generation failed for task {task_id}: {str(e)}")
            await update_task_status(
                db, task_id, TaskStatus.FAILED,
                error=f"AI generation error: {str(e)}"
            )
            
        except Exception as e:
            logger.error(f"❌ Unexpected error in task {task_id}: {str(e)}", exc_info=True)
            await update_task_status(
                db, task_id, TaskStatus.FAILED,
                error=f"Unexpected error: {str(e)}"
            )

# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post("/generate-funnel", response_model=FunnelGenerationResponse)
async def generate_funnel(
    request: FunnelGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate AI-powered funnel with psychology-optimized questions.
    
    This endpoint:
    1. Validates user's AI quota
    2. Queues background generation task
    3. Returns task_id immediately (non-blocking)
    4. Client polls /ai/tasks/{task_id} for completion
    
    Args:
        request: Funnel generation parameters
        background_tasks: FastAPI background tasks
        current_user: Authenticated user
        db: Database session
    
    Returns:
        Task information with task_id for status polling
    """
    user_id = get_user_id(current_user)
    
    logger.info(
        f"📝 Funnel generation request: {request.niche} - {request.goal}",
        extra={"user_id": user_id}
    )
    
    try:
        # Initialize credit manager
        await ai_credit_manager.initialize()
        
        # Check quota (rough estimate: 5000 tokens for funnel generation)
        await ai_credit_manager.check_quota(user_id, 5000, db)
                
        # Generate unique task ID
        task_id = str(uuid.uuid4())
        
        # Save task to database
        await save_task_to_db(
            db=db,
            task_id=task_id,
            user_id=user_id,
            task_type="funnel_generation",
            status=TaskStatus.QUEUED,
            metadata={"request": request.dict()}
        )
        
        # Queue background task
        background_tasks.add_task(
            process_funnel_generation,
            task_id=task_id,
            request_data=request.dict(),
            user_id=user_id
        )
        
        logger.info(f"✅ Task queued: {task_id}")
        
        # Return immediately (non-blocking)
        return FunnelGenerationResponse(
            task_id=task_id,
            status="queued",
            message="🚀 Funnel generation started! Check status at /ai/tasks/{task_id}",
            eta_seconds=30,  # Estimated completion time
            credits_consumed=0,  # Will be updated when completed
        )
        
    except AIQuotaExceededException as e:
        logger.error(f"Quota exceeded for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "ai_quota_exceeded",
                "message": str(e),
                "limit": e.limit,
                "used": e.used,
                "upgrade_url": "/pricing"
            }
        )
    
    except Exception as e:
        logger.error(f"Failed to queue funnel generation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start generation: {str(e)}"
        )


@router.get("/tasks/{task_id}", response_model=FunnelGenerationResponse)
async def get_task_status(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI task status and results.
    
    Client should poll this endpoint every 2-3 seconds until status is 'completed' or 'failed'.
    
    Args:
        task_id: Task ID from /generate-funnel
        current_user: Authenticated user
        db: Database session
    
    Returns:
        Task status and results (if completed)
    """
    user_id = get_user_id(current_user)
    
    # Fetch task from database
    result = await db.execute(
        select(AITask).where(
            AITask.task_id == task_id,
            AITask.user_id == user_id  # Ensure user owns this task
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task not found: {task_id}"
        )
    
    # Return status-based response
    if task.status == TaskStatus.COMPLETED:
        # Return full result
        return FunnelGenerationResponse(**task.result)
    
    elif task.status == TaskStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "task_id": task_id,
                "status": "failed",
                "error": task.error_message or "Generation failed"
            }
        )
    
    else:
        # Still processing
        elapsed = (datetime.utcnow() - task.created_at).total_seconds()
        eta = max(5, 30 - int(elapsed))  # ETA based on elapsed time
        
        return FunnelGenerationResponse(
            task_id=task_id,
            status=task.status.value,
            message=f"⏳ {task.status.value.title()}... Please wait.",
            eta_seconds=eta,
            credits_consumed=0
        )


@router.post("/optimize-question")
async def optimize_question(
    request: QuestionOptimizationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Optimize existing question for better engagement.
    
    Uses AI to analyze and suggest improvements based on:
    - Psychology principles
    - Engagement metrics
    - Conversion best practices
    """
    user_id = get_user_id(current_user)
    
    try:
        await ai_credit_manager.initialize()
        await ai_credit_manager.check_quota(user_id, 1000)
        
        ai_service = AIService(db)
        
        # Optimize question
        result = await ai_service.optimize_question(
            question_text=request.question_text,
            question_type=request.question_type,
            context=request.context or {}
        )
        
        # Track usage
        await ai_credit_manager.track_usage(
            user_id=user_id,
            model="gpt-4",
            input_tokens=500,
            output_tokens=300
        )
        
        return result
        
    except AIQuotaExceededException as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e)
        )


@router.get("/usage")
async def get_ai_usage(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's AI usage statistics.
    
    Returns:
        - Daily/monthly token usage
        - Quota limits
        - Credits remaining
        - Cost breakdown
    """
    user_id = get_user_id(current_user)
    
    await ai_credit_manager.initialize()
    
    quota = await ai_credit_manager.get_user_quota(user_id)
    daily_usage = await ai_credit_manager.get_user_usage(user_id, "daily")
    monthly_usage = await ai_credit_manager.get_user_usage(user_id, "monthly")
    
    return {
        "quota": {
            "daily_limit": quota["daily_tokens"],
            "monthly_limit": quota["monthly_tokens"],
        },
        "usage": {
            "daily": {
                "used": daily_usage,
                "remaining": max(0, quota["daily_tokens"] - daily_usage) if quota["daily_tokens"] > 0 else "unlimited",
                "percentage": int((daily_usage / quota["daily_tokens"]) * 100) if quota["daily_tokens"] > 0 else 0
            },
            "monthly": {
                "used": monthly_usage,
                "remaining": max(0, quota["monthly_tokens"] - monthly_usage) if quota["monthly_tokens"] > 0 else "unlimited",
                "percentage": int((monthly_usage / quota["monthly_tokens"]) * 100) if quota["monthly_tokens"] > 0 else 0
            }
        },
        "subscription_tier": "pro",  # Get from user's subscription
        "upgrade_available": quota["daily_tokens"] > 0,  # Can upgrade if not unlimited
    }


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["router"]
