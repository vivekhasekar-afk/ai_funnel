# =============================================================================
# AI FUNNEL BUILDER - A/B TESTING SCHEMAS
# =============================================================================
# Pydantic schemas for A/B testing experiments
# =============================================================================

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict

class ABTestStatusEnum(str, Enum):
    """A/B test status."""
    DRAFT = "draft"
    RUNNING = "running"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"

class ABTestVariant(BaseModel):
    """Single A/B test variant."""
    variant_id: str = Field(..., description="Unique variant identifier")
    name: str = Field(..., description="Variant name (A, B, Control, etc.)")
    description: Optional[str] = Field(None, description="Variant description")
    is_control: bool = Field(False, description="True if this is the control variant")
    
    # Performance metrics
    views: int = Field(0, description="Total views")
    conversions: int = Field(0, description="Total conversions")
    conversion_rate: float = Field(0.0, description="Conversion rate")
    
    # Statistical significance
    is_winner: Optional[bool] = Field(None, description="True if statistically significant winner")
    p_value: Optional[float] = Field(None, description="Statistical p-value")
    confidence_interval: Optional[List[float]] = Field(None, description="Confidence interval")
    
    model_config = ConfigDict(
        from_attributes=True,
    )

class ABTestCreate(BaseModel):
    """Create new A/B test."""
    name: str = Field(..., max_length=100, description="Test name")
    description: Optional[str] = Field(None, max_length=500, description="Test description")
    funnel_id: str = Field(..., description="Funnel ID")
    question_id: Optional[str] = Field(None, description="Specific question (or null for whole funnel)")
    
    # Variants configuration
    variants: List[Dict[str, Any]] = Field(
        ...,
        min_length=2,
        max_length=5,
        description="Variant configurations"
    )
    
    # Test settings
    allocation_method: str = Field("equal", description="equal, weighted, or traffic_based")
    min_sample_size: int = Field(100, ge=50, description="Minimum sample size per variant")
    confidence_level: float = Field(0.95, ge=0.90, le=0.99, description="Confidence level")

class ABTestUpdate(BaseModel):
    """Update A/B test."""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[ABTestStatusEnum] = Field(None)
    allocation_method: Optional[str] = Field(None)
    variants: Optional[List[Dict[str, Any]]] = Field(None)

class ABTestResponse(BaseModel):
    """A/B test response."""
    test_id: str
    name: str
    description: Optional[str]
    funnel_id: str
    question_id: Optional[str]
    status: ABTestStatusEnum
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Results
    variants: List[ABTestVariant]
    total_sample_size: int
    statistical_significance_reached: bool
    recommended_winner: Optional[ABTestVariant]
    
    model_config = ConfigDict(from_attributes=True)

class ABTestResults(BaseModel):
    """Detailed A/B test results."""
    test_id: str
    name: str
    status: ABTestStatusEnum
    
    # Summary statistics
    total_views: int
    total_conversions: int
    overall_conversion_rate: float
    
    # Variants
    variants: List[ABTestVariant]
    
    # Statistical analysis
    winner_variant_id: Optional[str]
    p_values: Dict[str, Dict[str, float]]
    confidence_intervals: Dict[str, List[float]]
    
    # Test metadata
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_days: Optional[float]

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "ABTestStatusEnum",
    "ABTestVariant",
    "ABTestCreate",
    "ABTestUpdate",
    "ABTestResponse",
    "ABTestResults",
]


