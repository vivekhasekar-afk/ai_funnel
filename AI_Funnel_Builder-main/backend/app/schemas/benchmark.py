"""
Benchmark Schemas - Production Grade
====================================
Pydantic schemas for industry benchmarks, performance comparisons,
and competitive analytics.
"""


from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from enum import Enum
from datetime import date
from pydantic.types import StrictStr, StrictFloat, StrictInt


class BenchmarkCategory(str, Enum):
    """Benchmark categories by industry/vertical."""
    SKINCARE = "skincare"
    BEAUTY = "beauty"
    ECOMMERCE = "ecommerce"
    SAAS = "saas"
    HEALTH = "health"
    FITNESS = "fitness"
    EDUCATION = "education"
    REAL_ESTATE = "real_estate"
    GENERAL = "general"


class BenchmarkMetric(str, Enum):
    """Benchmark performance metrics."""
    COMPLETION_RATE = "completion_rate"
    LEAD_RATE = "lead_rate"
    CONVERSION_RATE = "conversion_rate"
    AVG_TIME_COMPLETED = "avg_time_completed"
    QUESTION_ANSWER_RATE = "question_answer_rate"
    DROPOFF_RATE = "dropoff_rate"


class BenchmarkCreate(BaseModel):
    """Create new benchmark dataset."""
    category: BenchmarkCategory = Field(..., description="Industry category")
    metric: BenchmarkMetric = Field(..., description="Performance metric")
    percentile_10: StrictFloat = Field(..., ge=0.0, description="10th percentile")
    percentile_25: StrictFloat = Field(..., ge=0.0, description="25th percentile")
    percentile_50: StrictFloat = Field(..., ge=0.0, description="Median")
    percentile_75: StrictFloat = Field(..., ge=0.0, description="75th percentile")
    percentile_90: StrictFloat = Field(..., ge=0.0, description="90th percentile")
    sample_size: StrictInt = Field(..., ge=100, description="Number of funnels in dataset")
    valid_until: date = Field(..., description="Benchmark validity date")
    source: StrictStr = Field(..., description="Data source")

    model_config = ConfigDict(from_attributes=True)


class BenchmarkResponse(BaseModel):
    """Benchmark comparison response."""
    category: BenchmarkCategory
    metric: BenchmarkMetric
    your_value: StrictFloat = Field(..., description="Your performance")

    # Percentiles
    percentile_10: StrictFloat
    percentile_25: StrictFloat
    percentile_50: StrictFloat
    percentile_75: StrictFloat
    percentile_90: StrictFloat

    # Performance assessment
    percentile_rank: StrictFloat = Field(..., ge=0.0, le=100.0, description="Your percentile rank")
    performance_tier: str = Field(..., description="poor/average/good/excellent")
    vs_median: StrictFloat = Field(..., description="Difference vs median")

    sample_size: StrictInt
    valid_until: date
    source: StrictStr

    model_config = ConfigDict(from_attributes=True)


class BenchmarkFilter(BaseModel):
    """Benchmark filtering criteria."""
    categories: Optional[List[BenchmarkCategory]] = None
    metrics: Optional[List[BenchmarkMetric]] = None
    valid_after: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class BenchmarkComparison(BaseModel):
    """Multi-metric benchmark comparison."""
    funnel_id: StrictStr
    comparisons: List[BenchmarkResponse] = Field(..., description="Metric comparisons")
    overall_score: StrictFloat = Field(..., ge=0.0, le=100.0, description="Composite score")

    model_config = ConfigDict(from_attributes=True)


class BenchmarkSummary(BaseModel):
    """Benchmark dataset summary."""
    category: BenchmarkCategory
    total_metrics: StrictInt
    last_updated: date
    funnels_count: StrictInt

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = [
    "BenchmarkCategory",
    "BenchmarkMetric",
    "BenchmarkCreate",
    "BenchmarkResponse",
    "BenchmarkFilter",
    "BenchmarkComparison",
    "BenchmarkSummary",
]
