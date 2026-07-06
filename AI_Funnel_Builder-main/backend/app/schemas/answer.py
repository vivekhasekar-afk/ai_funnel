"""
Answer Schemas - Production Grade
=================================
Pydantic schemas for answer data with ML scoring, behavioral analysis,
and GDPR compliance.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic.types import StrictInt, StrictStr, StrictFloat
from enum import Enum

# Local imports
from app.schemas.question import QuestionResponseMinimal
from app.schemas.user import UserResponseMinimal
from app.schemas.response import ResponseResponse


class AnswerType(str, Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TEXT = "text"
    SLIDER = "slider"
    RATING = "rating"
    NPS = "nps"


class AnswerCreate(BaseModel):
    """Create new answer."""
    question_id: StrictInt = Field(..., description="Question ID")
    session_id: StrictStr = Field(..., description="Response session ID")
    user_id: Optional[StrictInt] = Field(None, description="User ID")
    answer_value: Any = Field(..., description="Answer value")
    answer_type: AnswerType = Field(..., description="Answer type")
    confidence: Optional[StrictFloat] = Field(None, ge=0.0, le=1.0)
    time_spent_ms: StrictInt = Field(..., ge=0)

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
    )


class AnswerResponse(BaseModel):
    """Complete answer with metadata."""
    answer_id: StrictInt
    question_id: StrictInt
    session_id: StrictStr
    user_id: Optional[StrictInt] = None
    answer_value: Any
    answer_type: AnswerType
    confidence: Optional[StrictFloat] = Field(None, ge=0.0, le=1.0)
    time_spent_ms: StrictInt
    quality_score: Optional[StrictFloat] = Field(None, ge=0.0, le=1.0)

    # Relations
    question: Optional[QuestionResponseMinimal] = None
    user: Optional[UserResponseMinimal] = None

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AnswerBulkCreate(BaseModel):
    """Bulk answer creation."""
    answers: List[AnswerCreate] = Field(..., min_items=1, max_items=1000)


class AnswerStats(BaseModel):
    """Answer statistics."""
    question_id: StrictInt
    total_answers: StrictInt
    answer_distribution: Dict[Any, StrictInt]
    avg_confidence: StrictFloat
    avg_time_spent_ms: StrictInt


class AnswerUpdate(BaseModel):
    """Update existing answer."""
    answer_id: StrictInt = Field(..., description="Answer ID to update")
    answer_value: Optional[Any] = Field(None, description="Updated answer value")
    confidence: Optional[StrictFloat] = Field(None, ge=0.0, le=1.0, description="Updated confidence score")
    time_spent_ms: Optional[StrictInt] = Field(None, ge=0, description="Updated time spent")
    quality_score: Optional[StrictFloat] = Field(None, ge=0.0, le=1.0, description="Updated quality score")

    model_config = ConfigDict(
        extra="allow",
    )


class AnswerValidation(BaseModel):
    """Schema for answer validation results."""
    answer_id: StrictInt = Field(..., description="Answer ID")
    is_valid: bool = Field(..., description="Is the answer valid")
    errors: Optional[List[str]] = Field(default_factory=list, description="List of validation errors")
    warnings: Optional[List[str]] = Field(default_factory=list, description="List of validation warnings")
    confidence_score: Optional[StrictFloat] = Field(None, ge=0.0, le=1.0, description="Confidence in validation result")
    pii_detected: bool = Field(False, description="Whether PII was detected in the answer")
    pii_fields: Optional[List[str]] = Field(default_factory=list, description="List of PII fields detected")
    validation_timestamp: Optional[StrictStr] = Field(None, description="ISO timestamp of validation run")

    model_config = ConfigDict(
        from_attributes=True,
    )


__all__ = [
    "AnswerType",
    "AnswerCreate",
    "AnswerResponse",
    "AnswerBulkCreate",
    "AnswerStats",
    "AnswerUpdate",
    "AnswerValidation",
]
