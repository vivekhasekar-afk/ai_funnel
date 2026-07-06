from typing import Optional, Dict, Any, List, Literal
from datetime import datetime, date
from pydantic import BaseModel, Field, validator, ConfigDict
from enum import Enum


class BaseSchema(BaseModel):
    """Base schema with common config."""
    model_config = ConfigDict(from_attributes=True)


class BehavioralAnalytics(BaseModel):
    """Behavioral analytics for questions."""
    total_views: int = Field(0, description="Total views")
    total_answers: int = Field(0, description="Total answers")
    total_skips: int = Field(0, description="Total skips")
    avg_time_seconds: Optional[float] = Field(None, description="Average time to answer")
    drop_off_rate: float = Field(0.0, description="Drop-off rate")
    answer_rate: float = Field(0.0, description="Answer rate")

    model_config = ConfigDict(from_attributes=True)


class EffectivenessScore(BaseModel):
    """Question effectiveness score."""
    overall_score: float = Field(0.0, description="Overall effectiveness (0-100)")
    engagement_score: float = Field(0.0, description="Engagement score")
    clarity_score: Optional[float] = Field(None, description="Clarity score")
    needs_optimization: bool = Field(False, description="Needs optimization flag")
    recommendations: List[str] = Field(default_factory=list, description="Optimization recommendations")

    model_config = ConfigDict(from_attributes=True)


class TimeRangeEnum(str, Enum):
    """Predefined time ranges."""
    TODAY = "today"
    YESTERDAY = "yesterday"
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    LAST_90_DAYS = "last_90_days"
    THIS_MONTH = "this_month"
    LAST_MONTH = "last_month"
    THIS_YEAR = "this_year"
    CUSTOM = "custom"


class MetricTypeEnum(str, Enum):
    """Metric types."""
    VIEWS = "views"
    STARTS = "starts"
    COMPLETES = "completes"
    LEADS = "leads"
    CONVERSIONS = "conversions"
    COMPLETION_RATE = "completion_rate"
    LEAD_RATE = "lead_rate"
    ABANDON_RATE = "abandon_rate"


class GroupByEnum(str, Enum):
    """Grouping dimensions."""
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    DEVICE = "device"
    COUNTRY = "country"
    SOURCE = "source"
    FUNNEL = "funnel"


class ExportFormatEnum(str, Enum):
    """Export formats."""
    CSV = "csv"
    JSON = "json"
    XLSX = "xlsx"
    PDF = "pdf"


class AnalyticsRequest(BaseModel):
    """Base analytics request schema."""
    time_range: TimeRangeEnum = Field(TimeRangeEnum.LAST_7_DAYS, description="Time range preset")

    start_date: Optional[date] = Field(None, description="Custom start date")
    end_date: Optional[date] = Field(None, description="Custom end date")

    funnel_ids: Optional[List[str]] = Field(None, description="Filter by funnels")

    @validator("start_date", "end_date")
    def validate_custom_dates(cls, v, values):
        if values.get("time_range") == TimeRangeEnum.CUSTOM and not v:
            raise ValueError("start_date and end_date are required for custom time range")
        return v

    model_config = ConfigDict(from_attributes=True)


class TimeSeriesRequest(AnalyticsRequest):
    """Time-series analytics request."""
    metrics: List[MetricTypeEnum] = Field(
        ..., min_length=1, max_length=10, description="Metrics to retrieve"
    )
    group_by: GroupByEnum = Field(GroupByEnum.DAY, description="Time grouping")

    compare_to_previous: bool = Field(False, description="Compare to previous period")

    model_config = ConfigDict(from_attributes=True)


class FunnelAnalyticsRequest(AnalyticsRequest):
    """Funnel-specific analytics request."""
    funnel_id: str = Field(..., description="Funnel ID")

    include_device_breakdown: bool = Field(True, description="Include device breakdown")
    include_country_breakdown: bool = Field(True, description="Include country breakdown")
    include_source_breakdown: bool = Field(True, description="Include source breakdown")
    include_question_performance: bool = Field(False, description="Include question-level metrics")


class BreakdownRequest(AnalyticsRequest):
    """Breakdown analytics request."""
    dimension: GroupByEnum = Field(..., description="Breakdown dimension")
    metric: MetricTypeEnum = Field(..., description="Primary metric")

    limit: int = Field(10, ge=1, le=100, description="Number of results")
    offset: int = Field(0, ge=0, description="Result offset")


class InsightsRequest(BaseModel):
    """AI insights generation request."""
    funnel_id: Optional[str] = Field(None, description="Specific funnel (or all if null)")
    time_range: TimeRangeEnum = Field(TimeRangeEnum.LAST_30_DAYS, description="Analysis period")

    include_optimization_suggestions: bool = Field(True, description="Include optimization tips")
    include_anomaly_detection: bool = Field(True, description="Detect unusual patterns")
    include_benchmark_comparison: bool = Field(True, description="Compare to benchmarks")

    model_config = ConfigDict(from_attributes=True)


class AnalyticsExportRequest(BaseModel):
    """Analytics export request."""
    format: ExportFormatEnum = Field(..., description="Export format")

    time_range: TimeRangeEnum = Field(..., description="Time range")
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    funnel_ids: Optional[List[str]] = None

    include_summary: bool = Field(True, description="Include summary metrics")
    include_time_series: bool = Field(True, description="Include time-series data")
    include_breakdowns: bool = Field(True, description="Include dimensional breakdowns")
    include_leads: bool = Field(False, description="Include lead data")


class MetricValue(BaseModel):
    """Single metric value with metadata."""
    value: float = Field(..., description="Metric value")
    previous_value: Optional[float] = Field(None, description="Previous period value")
    change: Optional[float] = Field(None, description="Absolute change")
    change_percentage: Optional[float] = Field(None, description="Percentage change")
    trend: Optional[Literal["up", "down", "flat"]] = Field(None, description="Trend direction")

    model_config = ConfigDict(from_attributes=True)


class AnalyticsSummary(BaseModel):
    """Analytics summary/overview."""
    total_views: MetricValue
    total_starts: MetricValue
    total_completes: MetricValue
    total_leads: MetricValue
    total_conversions: MetricValue

    start_rate: MetricValue = Field(..., description="View to start rate")
    completion_rate: MetricValue = Field(..., description="Start to complete rate")
    lead_capture_rate: MetricValue = Field(..., description="View to lead rate")
    conversion_rate: MetricValue = Field(..., description="View to conversion rate")
    abandon_rate: MetricValue = Field(..., description="Abandonment rate")

    avg_time_spent_seconds: MetricValue = Field(..., description="Average time on funnel")
    avg_questions_answered: MetricValue = Field(..., description="Average questions answered")

    period_start: date
    period_end: date

    model_config = ConfigDict(from_attributes=True)


class TimeSeriesDataPoint(BaseModel):
    """Single time-series data point."""
    timestamp: datetime = Field(..., description="Data point timestamp")
    period_date: date = Field(..., description="Date (for daily/weekly/monthly grouping)")

    metrics: Dict[str, float] = Field(..., description="Metric values for this point")

    model_config = ConfigDict(from_attributes=True)


class TimeSeriesResponse(BaseModel):
    """Time-series analytics response."""
    data: List[TimeSeriesDataPoint] = Field(..., description="Time-series data points")

    total_points: int = Field(..., description="Number of data points")
    group_by: GroupByEnum = Field(..., description="Grouping interval")

    comparison_data: Optional[List[TimeSeriesDataPoint]] = Field(
        None,
        description="Previous period data for comparison",
    )

    period_start: date
    period_end: date

    model_config = ConfigDict(from_attributes=True)


class BreakdownItem(BaseModel):
    """Single breakdown item."""
    dimension_value: str = Field(..., description="Dimension value (e.g., 'mobile', 'US')")

    count: int = Field(..., description="Count for this dimension")
    percentage: float = Field(..., description="Percentage of total")

    metrics: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional metrics",
    )

    model_config = ConfigDict(from_attributes=True)


class BreakdownResponse(BaseModel):
    """Breakdown analytics response."""
    dimension: GroupByEnum = Field(..., description="Breakdown dimension")
    metric: MetricTypeEnum = Field(..., description="Primary metric")

    items: List[BreakdownItem] = Field(..., description="Breakdown items")
    total: int = Field(..., description="Total count across all items")

    model_config = ConfigDict(from_attributes=True)


class FunnelPerformance(BaseModel):
    """Funnel performance metrics."""
    funnel_id: str
    funnel_title: str

    views: int
    starts: int
    completes: int
    leads: int
    conversions: int

    start_rate: float
    completion_rate: float
    lead_capture_rate: float
    abandon_rate: float

    avg_time_to_complete_seconds: Optional[int]
    avg_questions_answered: Optional[float]

    completion_rate_vs_benchmark: Optional[float] = Field(
        None,
        description="Completion rate vs industry benchmark (percentage points)",
    )

    model_config = ConfigDict(from_attributes=True)


class FunnelAnalyticsDetail(BaseModel):
    """Detailed funnel analytics."""
    funnel_id: str
    funnel_title: str

    summary: AnalyticsSummary

    device_breakdown: Optional[BreakdownResponse] = None
    country_breakdown: Optional[BreakdownResponse] = None
    source_breakdown: Optional[BreakdownResponse] = None

    question_performance: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Per-question metrics",
    )

    period_start: date
    period_end: date

    model_config = ConfigDict(from_attributes=True)


class QuestionPerformance(BaseModel):
    """Question-level performance metrics."""
    question_id: str
    question_text: str
    question_type: str
    display_order: int

    views: int
    answers: int
    skips: int

    answer_rate: float
    skip_rate: float
    drop_off_rate: float

    avg_time_to_answer_seconds: Optional[float]

    effectiveness_score: float = Field(..., ge=0, le=100, description="Question effectiveness (0-100)")

    needs_optimization: bool = Field(..., description="Whether optimization is recommended")
    issues: List[str] = Field(default_factory=list, description="Identified issues")

    model_config = ConfigDict(from_attributes=True)


class InsightItem(BaseModel):
    """Single AI-generated insight."""
    insight_type: str = Field(..., description="Insight type (opportunity, issue, trend, benchmark)")
    severity: str = Field(..., description="Severity (info, warning, critical)")
    title: str = Field(..., description="Insight title")
    description: str = Field(..., description="Detailed description")

    metric: Optional[str] = Field(None, description="Related metric")
    current_value: Optional[float] = Field(None, description="Current value")
    benchmark_value: Optional[float] = Field(None, description="Benchmark/expected value")
    impact: Optional[str] = Field(None, description="Estimated impact (high, medium, low)")

    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendations")

    confidence_score: Optional[float] = Field(None, ge=0, le=1, description="AI confidence (0-1)")

    model_config = ConfigDict(from_attributes=True)


class InsightsResponse(BaseModel):
    """AI insights response."""
    funnel_id: Optional[str] = Field(None, description="Specific funnel or null for account-wide")
    insights: List[InsightItem] = Field(..., description="Generated insights")

    total_insights: int
    critical_count: int
    warning_count: int
    info_count: int

    generated_at: datetime
    time_range: TimeRangeEnum

    model_config = ConfigDict(from_attributes=True)


class DashboardOverview(BaseModel):
    """High-level dashboard overview."""
    summary: AnalyticsSummary

    top_funnels: List[FunnelPerformance] = Field(..., description="Top performing funnels")

    recent_insights: List[InsightItem] = Field(..., description="Latest AI insights")

    views_trend: List[TimeSeriesDataPoint] = Field(..., description="Views trend (last 30 days)")
    leads_trend: List[TimeSeriesDataPoint] = Field(..., description="Leads trend (last 30 days)")

    active_funnels: int
    total_leads: int
    avg_completion_rate: float

    model_config = ConfigDict(from_attributes=True)


class BenchmarkComparison(BaseModel):
    """Benchmark comparison data."""
    metric: str = Field(..., description="Metric name")
    your_value: float = Field(..., description="Your actual value")
    benchmark_value: float = Field(..., description="Industry benchmark")

    difference: float = Field(..., description="Absolute difference")
    difference_percentage: float = Field(..., description="Percentage difference")

    performance: Literal["above", "at", "below"] = Field(..., description="Performance vs benchmark")
    category: str = Field(..., description="Benchmark category (e.g., 'skincare_quiz')")

    model_config = ConfigDict(from_attributes=True)


class AnalyticsExportResponse(BaseModel):
    """Analytics export job response."""
    export_id: str = Field(..., description="Export job ID")
    status: str = Field(..., description="Export status (processing, completed, failed)")
    format: ExportFormatEnum

    download_url: Optional[str] = Field(None, description="Download URL when ready")
    expires_at: Optional[datetime] = Field(None, description="Download expiration")

    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AnalyticsDetail(BaseModel):
    """Detailed analytics with full summary, breakdowns, and question-level data."""
    funnel_id: str = Field(..., description="Funnel ID")
    funnel_title: str = Field(..., description="Funnel title")

    summary: Dict[str, Any] = Field(..., description="Summary analytics data")

    device_breakdown: Optional[Dict[str, Any]] = Field(None, description="Device breakdown analytics")
    country_breakdown: Optional[Dict[str, Any]] = Field(None, description="Country breakdown analytics")
    source_breakdown: Optional[Dict[str, Any]] = Field(None, description="Source breakdown analytics")

    question_performance: Optional[List[Dict[str, Any]]] = Field(
        None, description="List of question-level analytics"
    )

    period_start: date = Field(..., description="Analytics period start date")
    period_end: date = Field(..., description="Analytics period end date")

    model_config = ConfigDict(from_attributes=True)


class AnalyticsTimeSeriesResponse(BaseModel):
    """Comprehensive time-series analytics response with metadata."""
    funnel_id: Optional[str] = Field(None, description="Funnel ID (null for account-wide)")
    metrics: List[MetricTypeEnum] = Field(..., description="Requested metrics")
    group_by: GroupByEnum = Field(..., description="Time grouping")

    data: List[TimeSeriesDataPoint] = Field(..., description="Time-series data points")

    total_points: int = Field(..., description="Number of data points")
    period_start: date = Field(..., description="Analysis period start")
    period_end: date = Field(..., description="Analysis period end")

    comparison_data: Optional[List[TimeSeriesDataPoint]] = Field(
        None,
        description="Previous period comparison data",
    )

    aggregated_metrics: Dict[str, MetricValue] = Field(
        default_factory=dict,
        description="Aggregated metrics across the period",
    )

    model_config = ConfigDict(from_attributes=True)


class AnalyticsBreakdown(BaseModel):
    """Comprehensive breakdown analytics across multiple dimensions."""
    funnel_id: Optional[str] = Field(None, description="Funnel ID (null for account-wide)")
    dimension: GroupByEnum = Field(..., description="Breakdown dimension")
    metric: MetricTypeEnum = Field(..., description="Primary metric")

    items: List[BreakdownItem] = Field(..., description="Breakdown data points")

    total_count: int = Field(..., description="Total count across all items")
    top_item: Optional[BreakdownItem] = Field(None, description="Top performing item")
    avg_value: Optional[float] = Field(None, description="Average value across items")

    period_start: date = Field(..., description="Analysis period start")
    period_end: date = Field(..., description="Analysis period end")

    model_config = ConfigDict(from_attributes=True)


class AnalyticsOverviewResponse(BaseModel):
    total_funnels: int = Field(..., description="Total funnels created")
    total_leads: int = Field(..., description="Total leads captured")
    total_responses: int = Field(..., description="Total responses received")
    conversion_rate: float = Field(..., ge=0, le=1, description="Overall conversion rate")
    avg_time_to_convert_seconds: Optional[float] = Field(None, description="Average time to convert in seconds")
    timestamp: datetime = Field(..., description="Analytics timestamp")


class FunnelAnalyticsResponse(BaseModel):
    funnel_id: str = Field(..., description="Funnel identifier")
    funnel_name: Optional[str] = Field(None, description="Funnel name")
    leads: int = Field(..., description="Leads generated")
    responses: int = Field(..., description="Responses received")
    conversion_rate: float = Field(..., ge=0, le=1, description="Conversion rate")
    avg_response_time_seconds: Optional[float] = Field(None, description="Average response time in seconds")
    created_at: datetime = Field(..., description="Funnel creation datetime")


class LeadAnalyticsResponse(BaseModel):
    lead_id: str = Field(..., description="Lead identifier")
    funnel_id: str = Field(..., description="Associated funnel identifier")
    source: Optional[str] = Field(None, description="Lead acquisition source")
    status: Optional[str] = Field(None, description="Lead status")
    created_at: datetime = Field(..., description="Lead creation datetime")
    first_response_time_seconds: Optional[float] = Field(None, description="Time to first response in seconds")


class ConversionFunnelResponse(BaseModel):
    funnel_id: str = Field(..., description="Funnel ID")
    steps: List[Dict[str, Any]] = Field(..., description="List of funnel steps with conversion stats")
    total_visitors: int = Field(..., description="Total visitors entering funnel")
    total_conversions: int = Field(..., description="Total conversions")
    conversion_rate: float = Field(..., ge=0, le=1, description="Overall funnel conversion rate")


class QuestionAnalyticsResponse(BaseModel):
    question_id: str = Field(..., description="Question ID")
    funnel_id: str = Field(..., description="Associated funnel ID")
    responses_count: int = Field(..., description="Number of responses to this question")
    avg_response_time_seconds: Optional[float] = Field(None, description="Average time to answer")
    popular_answers: Optional[Dict[str, int]] = Field(None, description="Map of popular answers and counts")


class TrafficSourceResponse(BaseModel):
    source_name: str = Field(..., description="Traffic source name")
    visits: int = Field(..., description="Number of visits from this source")
    leads: int = Field(..., description="Number of leads from this source")
    conversions: int = Field(..., description="Number of conversions from this source")
    conversion_rate: float = Field(..., ge=0, le=1, description="Conversion rate for this source")


class DeviceAnalyticsResponse(BaseModel):
    device_type: str = Field(..., description="Type of device (e.g., mobile, desktop)")
    visits: int = Field(..., description="Number of visits from this device type")
    leads: int = Field(..., description="Number of leads from this device type")
    conversions: int = Field(..., description="Number of conversions from this device type")
    conversion_rate: float = Field(..., ge=0, le=1, description="Conversion rate for device type")


__all__ = [
    "BehavioralAnalytics",
    "EffectivenessScore",
    "TimeRangeEnum",
    "MetricTypeEnum",
    "GroupByEnum",
    "ExportFormatEnum",
    "AnalyticsRequest",
    "TimeSeriesRequest",
    "FunnelAnalyticsRequest",
    "BreakdownRequest",
    "InsightsRequest",
    "AnalyticsExportRequest",
    "MetricValue",
    "AnalyticsSummary",
    "TimeSeriesDataPoint",
    "TimeSeriesResponse",
    "BreakdownItem",
    "BreakdownResponse",
    "FunnelPerformance",
    "FunnelAnalyticsDetail",
    "QuestionPerformance",
    "InsightItem",
    "InsightsResponse",
    "DashboardOverview",
    "BenchmarkComparison",
    "AnalyticsExportResponse",
    "AnalyticsDetail",
    "AnalyticsTimeSeriesResponse",
    "AnalyticsBreakdown",
    "AnalyticsOverviewResponse",
    "FunnelAnalyticsResponse",
    "LeadAnalyticsResponse",
    "ConversionFunnelResponse",
    "QuestionAnalyticsResponse",
    "TrafficSourceResponse",
    "DeviceAnalyticsResponse",
]
