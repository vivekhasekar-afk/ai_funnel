# =============================================================================
# AI FUNNEL BUILDER - QUESTION ENDPOINTS
# =============================================================================
# Question management endpoints
# =============================================================================

from fastapi import APIRouter, Depends, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from app.core.database import get_db
from app.services.funnel_service import FunnelService
from app.models.question import Question, QuestionRequirementEnum
from app.models.user import User
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    QuestionReorderRequest,
    BulkQuestionCreate,
)
from app.utils.logger import get_logger
from app.utils.exceptions import NotFoundException, ValidationException
from app.core.dependencies import get_current_user 
from sqlalchemy import select, update

logger = get_logger(__name__)
router = APIRouter()

# =============================================================================
# QUESTION CRUD
# =============================================================================

@router.get(
    "/funnels/{funnel_id}/questions",
    response_model=List[QuestionResponse],
    status_code=status.HTTP_200_OK,
    summary="List Questions",
    description="Get all questions for a funnel"
)
async def list_questions(
    funnel_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all questions for a funnel."""
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id
    )
    
    # Get questions
    result = await db.execute(
        select(Question)
        .where(Question.funnel_id == funnel_id)
        .order_by(Question.display_order)
    )
    questions = result.scalars().all()
    
    return list(questions)


@router.post(
    "/funnels/{funnel_id}/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Question",
    description="Add a new question to funnel"
)
async def create_question(
    funnel_id: str,
    data: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new question in funnel."""
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id 
    )
    
    # Get current question count for display_order
    result = await db.execute(
        select(Question)
        .where(Question.funnel_id == funnel_id)
        .order_by(Question.display_order.desc())
    )
    last_question = result.scalars().first()
    next_order = (last_question.display_order + 1) if last_question else 1
    
    # Determine final position
    final_position = data.position if data.position is not None else next_order

    # ✅ FIX 1: Extract LOWERCASE value from Enum
    raw_type = data.type
    if hasattr(raw_type, "value"):
        q_type_val = raw_type.value  # 'multiple_choice' (lowercase)
    else:
        q_type_val = str(raw_type).lower()

    # ✅ FIX 2: Extract LOWERCASE value for requirement
    is_req_val = "required" if data.required else "optional"

    # Create question instance
    question = Question(
        funnel_id=funnel_id,
        question_type=q_type_val,  # ✅ Safe lowercase string
        question_text=data.text, 
        description=None, 
        placeholder=None,
        display_order=final_position,
        is_required=is_req_val,  # ✅ Safe lowercase string
        options=data.options or [],
        validation={}, 
        logic=[], 
        analysis_tags=[],  # ✅ Empty list (not '{}')
        question_metadata={},
        section_name=None,
        media_url=None,
        media_type=None,
        scoring_enabled=False,
        weight=1,  # ✅ Integer (not 1.0 float)
        response_count=0,
        skip_count=0
    )
    
    db.add(question)
    await db.commit()
    await db.refresh(question)
    
    logger.info(
        f"Question created in funnel {funnel_id}",
        extra={
            "user_id": current_user.user_id,
            "funnel_id": funnel_id,
            "question_id": question.question_id
        }
    )
    
    return question


@router.get(
    "/questions/{question_id}",
    response_model=QuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Question",
    description="Get question details by ID"
)
async def get_question(
    question_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get question by ID."""
    # Get question
    result = await db.execute(
        select(Question).where(Question.question_id == question_id)
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise NotFoundException("Question not found", resource_type="question")
    
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    await funnel_service.get_funnel(
        funnel_id=question.funnel_id,
        user_id=current_user.user_id
    )
    
    return question


@router.patch(
    "/questions/{question_id}",
    response_model=QuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Question",
    description="Update question details"
)
async def update_question(
    question_id: str,
    data: QuestionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update question."""
    # Get question
    result = await db.execute(
        select(Question).where(Question.question_id == question_id)
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise NotFoundException("Question not found", resource_type="question")
    
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    await funnel_service.get_funnel(
        funnel_id=question.funnel_id,
        user_id=current_user.user_id
    )
    
    # Update fields with safe Enum handling
    if data.text is not None:
        question.question_text = data.text
        
    if data.type is not None:
        # ✅ Extract value safely
        if hasattr(data.type, "value"):
            question.question_type = data.type.value
        else:
            question.question_type = str(data.type).lower()
    
    if data.required is not None:
        # ✅ Convert boolean to enum value
        question.is_required = "required" if data.required else "optional"
    
    if data.options is not None:
        question.options = data.options
    
    if hasattr(data, 'validation') and data.validation is not None:
        current_val = dict(question.validation or {})
        current_val.update(data.validation)
        question.validation = current_val
    
    if hasattr(data, 'logic') and data.logic is not None:
        question.logic = data.logic
    
    if data.position is not None:
        question.display_order = data.position

    await db.commit()
    await db.refresh(question)
    
    logger.info(
        f"Question updated: {question_id}",
        extra={
            "user_id": current_user.user_id,
            "question_id": question_id
        }
    )
    
    return question


@router.delete(
    "/questions/{question_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Question",
    description="Delete question from funnel"
)
async def delete_question(
    question_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete question."""
    # Get question
    result = await db.execute(
        select(Question).where(Question.question_id == question_id)
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise NotFoundException("Question not found", resource_type="question")
    
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    await funnel_service.get_funnel(
        funnel_id=question.funnel_id,
        user_id=current_user.user_id
    )
    
    funnel_id = question.funnel_id
    display_order = question.display_order
    
    # Delete question
    await db.delete(question)
    
    # Reorder remaining questions
    await db.execute(
        update(Question)
        .where(
            Question.funnel_id == funnel_id,
            Question.display_order > display_order
        )
        .values(display_order=Question.display_order - 1)
    )
    
    await db.commit()
    
    logger.info(
        f"Question deleted: {question_id}",
        extra={
            "user_id": current_user.user_id,
            "question_id": question_id
        }
    )
    
    return {
        "message": "Question deleted successfully",
        "question_id": question_id
    }


# =============================================================================
# QUESTION REORDERING
# =============================================================================

@router.patch(
    "/questions/{question_id}/reorder",
    response_model=QuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Reorder Question",
    description="Change question display order"
)
async def reorder_question(
    question_id: str,
    data: QuestionReorderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reorder question position."""
    # Get question
    result = await db.execute(
        select(Question).where(Question.question_id == question_id)
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise NotFoundException("Question not found", resource_type="question")
    
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    await funnel_service.get_funnel(
        funnel_id=question.funnel_id,
        user_id=current_user.user_id
    )
    
    old_order = question.display_order
    new_order = data.new_order
    
    if old_order == new_order:
        return question
    
    # Reorder questions
    if new_order > old_order:
        await db.execute(
            update(Question)
            .where(
                Question.funnel_id == question.funnel_id,
                Question.display_order > old_order,
                Question.display_order <= new_order
            )
            .values(display_order=Question.display_order - 1)
        )
    else:
        await db.execute(
            update(Question)
            .where(
                Question.funnel_id == question.funnel_id,
                Question.display_order >= new_order,
                Question.display_order < old_order
            )
            .values(display_order=Question.display_order + 1)
        )
    
    # Update question position
    question.display_order = new_order
    
    await db.commit()
    await db.refresh(question)
    
    logger.info(
        f"Question reordered: {question_id} ({old_order} -> {new_order})",
        extra={
            "user_id": current_user.user_id,
            "question_id": question_id
        }
    )
    
    return question


@router.patch(
    "/funnels/{funnel_id}/questions/bulk-reorder",
    status_code=status.HTTP_200_OK,
    summary="Bulk Reorder Questions",
    description="Reorder multiple questions at once"
)
async def bulk_reorder_questions(
    funnel_id: str,
    question_order: List[str] = Body(..., description="List of question IDs in desired order"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk reorder questions."""
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id
    )
    
    # Update each question's display_order
    for index, question_id in enumerate(question_order):
        await db.execute(
            update(Question)
            .where(Question.question_id == question_id)
            .values(display_order=index + 1)  # Start from 1
        )
    
    await db.commit()
    
    logger.info(
        f"Questions reordered in bulk for funnel {funnel_id}",
        extra={
            "user_id": current_user.user_id,
            "funnel_id": funnel_id,
            "question_count": len(question_order)
        }
    )
    
    return {
        "message": "Questions reordered successfully",
        "count": len(question_order)
    }


# =============================================================================
# BULK OPERATIONS
# =============================================================================

@router.post(
    "/funnels/{funnel_id}/questions/bulk",
    response_model=List[QuestionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Bulk Create Questions",
    description="Create multiple questions at once"
)
async def bulk_create_questions(
    funnel_id: str,
    data: BulkQuestionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create multiple questions at once."""
    # Verify funnel ownership
    funnel_service = FunnelService(db)
    await funnel_service.get_funnel(
        funnel_id=funnel_id,
        user_id=current_user.user_id 
    )
    
    # Get current question count
    result = await db.execute(
        select(Question)
        .where(Question.funnel_id == funnel_id)
        .order_by(Question.display_order.desc())
    )
    last_question = result.scalars().first()
    start_order = (last_question.display_order + 1) if last_question else 1
    
    # Create questions
    created_questions = []
    
    for index, q_data in enumerate(data.questions):
        # ✅ FIX: Extract LOWERCASE value from Enum
        raw_type = q_data.type
        if hasattr(raw_type, "value"):
            q_type_val = raw_type.value
        else:
            q_type_val = str(raw_type).lower()
        
        # ✅ FIX: Handle requirement safely
        is_required_bool = getattr(q_data, 'required', True)
        is_req_val = "required" if is_required_bool else "optional"
        
        # Handle optional fields
        desc = getattr(q_data, 'description', None)

        question = Question(
            funnel_id=funnel_id,
            question_type=q_type_val,  # ✅ Safe lowercase
            question_text=q_data.text, 
            description=desc, 
            placeholder=None,
            display_order=start_order + index,
            is_required=is_req_val,  # ✅ Safe lowercase
            options=q_data.options or [],
            validation=getattr(q_data, 'validation', {}),
            logic=getattr(q_data, 'logic', []),
            analysis_tags=[],  # ✅ Empty list
            question_metadata={},
            section_name=None,
            media_url=None,
            media_type=None,
            scoring_enabled=False,
            weight=1,  # ✅ Integer
            response_count=0,
            skip_count=0
        )
        
        db.add(question)
        created_questions.append(question)
    
    # Commit all at once
    await db.commit()
    
    # Refresh to get IDs
    for q in created_questions:
        await db.refresh(q)
    
    logger.info(
        f"Bulk created {len(created_questions)} questions in funnel {funnel_id}",
        extra={
            "user_id": current_user.user_id,
            "funnel_id": funnel_id,
            "question_count": len(created_questions)
        }
    )
    
    return created_questions
