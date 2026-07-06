from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


class BrandInsightsResponse(BaseModel):
    brand_id: str
    audience_size: int
    engagement_rate: float
    sentiment_score: float

    model_config = ConfigDict(from_attributes=True)


class AudienceDataResponse(BaseModel):
    demographics: Dict[str, int]
    interests: List[str]
    geographies: Dict[str, int]

    model_config = ConfigDict(from_attributes=True)


class BrandAnalysisRequest(BaseModel):
    brand_name: str
    competitor_names: Optional[List[str]] = None
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class BrandAnalysisResponse(BaseModel):
    analysis_summary: str
    key_metrics: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class CompetitorAnalysisResponse(BaseModel):
    competitor_name: str
    strengths: List[str]
    weaknesses: List[str]

    model_config = ConfigDict(from_attributes=True)


class IndustryTrendsResponse(BaseModel):
    trends: List[str]
    emerging_opportunities: List[str]

    model_config = ConfigDict(from_attributes=True)


class BrandRecommendationsRequest(BaseModel):
    brand_id: str
    focus_areas: List[str]
    budget: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class BrandRecommendationsResponse(BaseModel):
    recommended_actions: List[str]
    estimated_impact: Dict[str, float]

    model_config = ConfigDict(from_attributes=True)


class SocialMetricsResponse(BaseModel):
    platform: str
    followers: int
    engagement: float
    growth_rate: float

    model_config = ConfigDict(from_attributes=True)


class SentimentAnalysisResponse(BaseModel):
    positive: float
    neutral: float
    negative: float
    overall_score: float

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = [
    "BrandInsightsResponse",
    "AudienceDataResponse",
    "BrandAnalysisRequest",
    "BrandAnalysisResponse",
    "CompetitorAnalysisResponse",
    "IndustryTrendsResponse",
    "BrandRecommendationsRequest",
    "BrandRecommendationsResponse",
    "SocialMetricsResponse",
    "SentimentAnalysisResponse",
]
