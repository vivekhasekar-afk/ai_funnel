# =============================================================================
# AI TASK MODEL
# =============================================================================

from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from enum import Enum
from app.core.database import Base


class TaskStatus(str, Enum):
    """AI task status."""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AITask(Base):
    """AI generation task tracking."""
    
    __tablename__ = "ai_tasks"
    
    task_id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    task_type = Column(String(50), nullable=False)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.QUEUED, nullable=False)
    
    # ✅ FIXED: Changed from task_metadata to request_data
    request_data = Column(JSON, default={})  # Request parameters
    result = Column(JSON, nullable=True)  # Generated result
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<AITask(task_id={self.task_id}, status={self.status}, type={self.task_type})>"
