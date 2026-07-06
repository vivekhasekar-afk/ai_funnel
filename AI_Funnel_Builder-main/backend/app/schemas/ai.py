# =============================================================================
# AI FUNNEL BUILDER - AI SCHEMAS
# =============================================================================
# Pydantic schemas for AI generation and optimization features
# =============================================================================


from datetime import datetime
from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, Field, validator, ConfigDict
from enum import Enum


from app.schemas import BaseSchema


# =============================================================================
# ENUMS
# =============================================================================


class FunnelFormatEnum(str, Enum):
    """AI-suggested funnel formats."""
    QUIZ = "quiz"
    SURVEY = "survey"
    FORM = "form"
    POLL = "poll"



class BrandVoiceEnum(str, Enum):
    """Brand voice/tone options."""
    CASUAL = "casual"
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    AUTHORITATIVE = "authoritative"
    PLAYFUL = "playful"
    EDUCATIONAL = "educational"
    LUXURY = "luxury"



class AdPlatformEnum(str, Enum):
    """Ad platforms for copy generation."""
    META = "meta"
    GOOGLE = "google"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    INSTAGRAM = "instagram"
    TWITTER = "twitter"



class OptimizationGoalEnum(str, Enum):
    """Optimization objectives."""
    COMPLETION_RATE = "completion_rate"
    LEAD_CAPTURE = "lead_capture"
    ENGAGEMENT = "engagement"
    SPEED = "speed"
    MOBILE_FRIENDLY = "mobile_friendly"



# =============================================================================
# AI FUNNEL GENERATION
# =============================================================================


class FunnelGenerationRequest(BaseModel):
    """AI funnel generation request."""
    # Required context
    niche: str = Field(..., min_length=2, max_length=100, description="Industry/niche")
    goal: str = Field(..., min_length=3, max_length=200, description="Funnel goal/objective")
    
    # Target audience
    target_audience: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="Target audience description"
    )
    
    # Optional guidance
    brand_name: Optional[str] = Field(None, max_length=100, description="Brand name")
    brand_voice: BrandVoiceEnum = Field(BrandVoiceEnum.FRIENDLY, description="Brand voice/tone")
    
    # Funnel specifics
    preferred_format: Optional[FunnelFormatEnum] = Field(
        None,
        description="Preferred format (AI will suggest if not provided)"
    )
    num_questions: Optional[int] = Field(
        None,
        ge=3,
        le=30,
        description="Desired number of questions (AI will suggest if not provided)"
    )
    
    # Features
    include_email_gate: bool = Field(True, description="Include email capture")
    include_scoring: bool = Field(False, description="Include scoring/results")
    
    # Additional context
    key_products_services: Optional[List[str]] = Field(
        None,
        max_length=10,
        description="Key products/services to mention"
    )
    avoid_topics: Optional[List[str]] = Field(
        None,
        max_length=10,
        description="Topics to avoid"
    )
    
    # Language
    language: str = Field("en", max_length=10, description="Language code")
    
    # AI parameters
    creativity_level: float = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="AI creativity (0=conservative, 1=creative)"
    )


    @validator("num_questions")
    def validate_question_count(cls, v, values):
        """Validate question count is reasonable."""
        if v and (v < 3 or v > 30):
            raise ValueError("Number of questions must be between 3 and 30")
        return v


    model_config = ConfigDict(from_attributes=True)


class GeneratedQuestion(BaseModel):
    """AI-generated question."""
    question_text: str = Field(..., description="Question text")
    question_type: str = Field(..., description="Question type")
    description: Optional[str] = Field(None, description="Helper text")
    
    # Options (for choice questions)
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Question options")
    
    # Validation
    validation: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Validation rules")
    
    # Metadata
    display_order: int = Field(..., description="Question order")
    required: bool = Field(True, description="Is required")
    
    # AI metadata
    reasoning: Optional[str] = Field(None, description="Why AI chose this question")
    effectiveness_prediction: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Predicted effectiveness score"
    )


    model_config = ConfigDict(from_attributes=True)


# ✅ FIXED: FunnelGenerationResponse - supports both queued and completed states
class FunnelGenerationResponse(BaseModel):
    """AI funnel generation response - supports queued and completed states."""
    
    # ✅ Task tracking (always present)
    task_id: Optional[str] = None
    status: str = Field(default="queued", description="queued, processing, completed, failed")
    message: Optional[str] = None
    eta_seconds: Optional[int] = None
    credits_consumed: int = 0
    
    # ✅ Generated content (populated when completed)
    funnel_title: Optional[str] = Field(None, description="Suggested funnel title")
    funnel_description: Optional[str] = Field(None, description="Funnel description")
    
    # ✅ Format recommendation (populated when completed)
    recommended_format: Optional[FunnelFormatEnum] = Field(None, description="AI-recommended format")
    format_reasoning: Optional[str] = Field(None, description="Why this format was chosen")
    
    # ✅ Generated questions (optional - no min_length constraint)
    questions: Optional[List[GeneratedQuestion]] = Field(None, description="Generated questions")
    
    # ✅ Configuration (optional)
    suggested_config: Optional[Dict[str, Any]] = Field(None, description="Suggested funnel configuration")
    
    # ✅ Results/Outcomes (optional)
    suggested_results: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Suggested result categories/personas"
    )
    
    # ✅ Predictions (optional)
    predicted_completion_rate: Optional[float] = Field(
        None,
        ge=0,
        le=1,
        description="Predicted completion rate (0-1)"
    )
    predicted_lead_capture_rate: Optional[float] = Field(
        None,
        ge=0,
        le=1,
        description="Predicted lead capture rate (0-1)"
    )
    
    # ✅ Metadata (optional)
    generation_time_ms: Optional[int] = Field(None, description="Generation time in milliseconds")
    model_version: Optional[str] = Field(None, description="AI model version used")
    confidence_score: Optional[float] = Field(None, ge=0, le=1, description="Overall confidence (0-1)")


    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# QUESTION OPTIMIZATION
# =============================================================================


class QuestionOptimizationRequest(BaseModel):
    """Question optimization request."""
    question_id: str = Field(..., description="Question ID to optimize")
    
    # Optimization goals
    goals: List[OptimizationGoalEnum] = Field(
        ...,
        min_length=1,
        description="Optimization objectives"
    )
    
    # Current performance context
    current_answer_rate: Optional[float] = Field(None, ge=0, le=1, description="Current answer rate")
    current_skip_rate: Optional[float] = Field(None, ge=0, le=1, description="Current skip rate")
    current_drop_off_rate: Optional[float] = Field(None, ge=0, le=1, description="Current drop-off rate")
    
    # Additional context
    target_audience: Optional[str] = Field(None, description="Target audience context")
    funnel_context: Optional[str] = Field(None, description="Overall funnel context")


    model_config = ConfigDict(from_attributes=True)


class OptimizationSuggestion(BaseModel):
    """Single optimization suggestion."""
    suggestion_type: str = Field(..., description="Type (rephrase, simplify, split, add_visual)")
    title: str = Field(..., description="Suggestion title")
    description: str = Field(..., description="Detailed explanation")
    
    # Proposed changes
    proposed_question_text: Optional[str] = Field(None, description="New question text")
    proposed_options: Optional[Dict[str, Any]] = Field(None, description="New options structure")
    
    # Impact prediction
    predicted_impact: str = Field(..., description="Expected impact (high, medium, low)")
    predicted_improvement: Optional[float] = Field(
        None,
        description="Predicted metric improvement (percentage points)"
    )
    
    # Implementation
    difficulty: str = Field(..., description="Implementation difficulty (easy, medium, hard)")
    estimated_time_minutes: Optional[int] = Field(None, description="Estimated implementation time")


    model_config = ConfigDict(from_attributes=True)


class QuestionOptimizationResponse(BaseModel):
    """Question optimization response."""
    question_id: str
    
    # Current analysis
    current_performance_summary: str = Field(..., description="Performance summary")
    identified_issues: List[str] = Field(..., description="Issues identified")
    
    # Suggestions
    suggestions: List[OptimizationSuggestion] = Field(..., description="Optimization suggestions")
    
    # Prioritization
    top_priority_suggestion: OptimizationSuggestion = Field(..., description="Highest priority suggestion")
    
    # Metadata
    analysis_confidence: float = Field(..., ge=0, le=1, description="Analysis confidence")


    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# AD COPY GENERATION
# =============================================================================


class AdCopyGenerationRequest(BaseModel):
    """Ad copy generation request."""
    funnel_id: str = Field(..., description="Target funnel ID")
    platform: AdPlatformEnum = Field(..., description="Ad platform")
    
    # Campaign context
    campaign_objective: str = Field(
        ...,
        min_length=10,
        max_length=200,
        description="Campaign objective"
    )
    target_audience: str = Field(..., min_length=10, max_length=500, description="Target audience")
    
    # Creative constraints
    num_variations: int = Field(3, ge=1, le=10, description="Number of variations to generate")
    
    # Platform-specific
    ad_format: Optional[str] = Field(None, description="Ad format (feed, story, carousel)")
    character_limit: Optional[int] = Field(None, description="Character limit")
    
    # Brand context
    brand_voice: BrandVoiceEnum = Field(BrandVoiceEnum.FRIENDLY, description="Brand voice")
    key_selling_points: Optional[List[str]] = Field(None, max_length=5, description="Key selling points")
    
    # Creative elements
    include_emoji: bool = Field(True, description="Include emojis")
    include_cta: bool = Field(True, description="Include call-to-action")
    model_config = ConfigDict(from_attributes=True)


class GeneratedAdCopy(BaseModel):
    """Single generated ad copy variation."""
    variation_id: str = Field(..., description="Variation identifier")
    
    # Copy elements
    headline: str = Field(..., description="Ad headline")
    description: str = Field(..., description="Ad description/body")
    cta_text: str = Field(..., description="Call-to-action text")
    
    # Optional elements
    hashtags: Optional[List[str]] = Field(None, description="Suggested hashtags")
    
    # Metadata
    tone: str = Field(..., description="Copy tone (urgent, curious, informative)")
    target_emotion: str = Field(..., description="Target emotion (excitement, curiosity, concern)")
    
    # Predictions
    predicted_ctr: Optional[float] = Field(None, ge=0, le=1, description="Predicted click-through rate")
    predicted_performance_score: float = Field(..., ge=0, le=100, description="Performance score")


    model_config = ConfigDict(from_attributes=True)


class AdCopyGenerationResponse(BaseModel):
    """Ad copy generation response."""
    funnel_id: str
    platform: AdPlatformEnum
    
    # Generated variations
    variations: List[GeneratedAdCopy] = Field(..., min_length=1, description="Ad copy variations")
    
    # Recommendations
    recommended_variation_id: str = Field(..., description="Recommended variation")
    
    # Testing strategy
    testing_recommendations: List[str] = Field(
        ...,
        description="A/B testing recommendations"
    )
    
    # Metadata
    generation_time_ms: int
    model_version: str


    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# AUDIENCE ANALYSIS
# =============================================================================


class AudienceAnalysisRequest(BaseModel):
    """Audience analysis request."""
    funnel_ids: List[str] = Field(..., min_length=1, description="Funnels to analyze")
    
    # Analysis depth
    include_demographics: bool = Field(True, description="Include demographic analysis")
    include_psychographics: bool = Field(True, description="Include psychographic analysis")
    include_persona_generation: bool = Field(True, description="Generate audience personas")
    
    # Time range
    min_response_count: int = Field(100, ge=10, description="Minimum responses required")


    model_config = ConfigDict(from_attributes=True)


class AudienceSegment(BaseModel):
    """Identified audience segment."""
    segment_id: str
    segment_name: str = Field(..., description="Segment name")
    description: str = Field(..., description="Segment description")
    
    # Size
    response_count: int = Field(..., description="Number of responses in segment")
    percentage: float = Field(..., description="Percentage of total audience")
    
    # Characteristics
    key_characteristics: List[str] = Field(..., description="Defining characteristics")
    common_responses: Dict[str, Any] = Field(..., description="Common response patterns")
    
    # Demographics (if available)
    demographics: Optional[Dict[str, Any]] = None
    
    # Behavioral patterns
    avg_completion_time_seconds: Optional[int] = None
    completion_rate: Optional[float] = None
    
    # Value
    lead_quality_score: Optional[float] = Field(None, ge=0, le=100, description="Average lead quality")


    model_config = ConfigDict(from_attributes=True)



class GeneratedPersona(BaseModel):
    """AI-generated audience persona."""
    persona_id: str
    name: str = Field(..., description="Persona name")
    tagline: str = Field(..., description="One-line description")
    
    # Profile
    description: str = Field(..., description="Detailed persona description")
    demographics: Dict[str, Any] = Field(..., description="Demographic profile")
    psychographics: Dict[str, Any] = Field(..., description="Psychographic profile")
    
    # Behavior
    goals: List[str] = Field(..., description="Goals and motivations")
    pain_points: List[str] = Field(..., description="Pain points and frustrations")
    preferences: Dict[str, Any] = Field(..., description="Preferences and behaviors")
    
    # Engagement
    funnel_behavior: Dict[str, Any] = Field(..., description="How they interact with funnels")
    
    # Size
    estimated_percentage: float = Field(..., description="% of total audience")


    model_config = ConfigDict(from_attributes=True)



class AudienceAnalysisResponse(BaseModel):
    """Audience analysis response."""
    # Segments
    segments: List[AudienceSegment] = Field(..., description="Identified audience segments")
    total_responses_analyzed: int
    
    # Personas
    personas: Optional[List[GeneratedPersona]] = Field(None, description="Generated personas")
    
    # Key insights
    key_insights: List[str] = Field(..., description="Top audience insights")
    
    # Recommendations
    targeting_recommendations: List[str] = Field(..., description="Targeting recommendations")
    content_recommendations: List[str] = Field(..., description="Content recommendations")
    
    # Metadata
    confidence_score: float = Field(..., ge=0, le=1)
    generated_at: str


    model_config = ConfigDict(from_attributes=True)



# =============================================================================
# FORMAT SELECTION
# =============================================================================


class FormatSelectionRequest(BaseModel):
    """AI format selection request."""
    goal: str = Field(..., min_length=10, max_length=200, description="Primary goal")
    target_audience: str = Field(..., min_length=10, max_length=500, description="Target audience")
    niche: str = Field(..., max_length=100, description="Industry/niche")
    
    # Context
    expected_completion_time_minutes: Optional[int] = Field(None, ge=1, le=30, description="Desired time")
    expected_question_count: Optional[int] = Field(None, ge=3, le=30, description="Desired questions")
    model_config = ConfigDict(from_attributes=True)


class FormatRecommendation(BaseModel):
    """Single format recommendation."""
    format: FunnelFormatEnum
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence (0-1)")
    
    # Reasoning
    reasoning: str = Field(..., description="Why this format is recommended")
    pros: List[str] = Field(..., description="Advantages")
    cons: List[str] = Field(..., description="Disadvantages")
    
    # Predictions
    predicted_completion_rate: float = Field(..., ge=0, le=1)
    predicted_engagement_score: float = Field(..., ge=0, le=100)
    
    # Best practices
    best_practices: List[str] = Field(..., description="Recommended best practices")


    model_config = ConfigDict(from_attributes=True)



class FormatSelectionResponse(BaseModel):
    """Format selection response."""
    recommendations: List[FormatRecommendation] = Field(..., description="Format recommendations (ranked)")
    
    # Top recommendation
    recommended_format: FunnelFormatEnum = Field(..., description="Top recommendation")
    
    # Summary
    summary: str = Field(..., description="Summary of recommendation")


    model_config = ConfigDict(from_attributes=True)



# =============================================================================
# COMPLETION PREDICTION
# =============================================================================


class CompletionPredictionRequest(BaseModel):
    """Completion rate prediction request."""
    # Funnel structure
    question_count: int = Field(..., ge=1, le=50, description="Total questions")
    question_types: List[str] = Field(..., description="Question type distribution")
    
    # Target audience
    target_audience_description: Optional[str] = None
    niche: str = Field(..., description="Industry/niche")
    
    # Configuration
    has_email_gate: bool = Field(True, description="Includes email gate")
    email_gate_position: Optional[int] = Field(None, description="Email gate position (question index)")
    estimated_time_minutes: Optional[int] = None


    model_config = ConfigDict(from_attributes=True)


class CompletionPredictionResponse(BaseModel):
    """Completion rate prediction response."""
    predicted_completion_rate: float = Field(..., ge=0, le=1, description="Predicted rate (0-1)")
    confidence_interval: Dict[str, float] = Field(
        ...,
        description="Confidence interval (low, high)"
    )
    
    # Contributing factors
    positive_factors: List[str] = Field(..., description="Factors increasing completion")
    negative_factors: List[str] = Field(..., description="Factors decreasing completion")
    
    # Benchmark comparison
    industry_benchmark: float = Field(..., description="Industry benchmark")
    vs_benchmark: str = Field(..., description="Above/at/below benchmark")
    
    # Recommendations
    improvement_suggestions: List[str] = Field(..., description="How to improve")


    model_config = ConfigDict(from_attributes=True)


class ImprovementSuggestionsRequest(BaseModel):
    """Request schema for AI-generated improvement suggestions."""
    funnel_id: str = Field(..., description="ID of the funnel to analyze")
    questions_to_improve: Optional[List[str]] = Field(None, description="List of question IDs for targeted improvement")
    max_suggestions: Optional[int] = Field(5, ge=1, le=20, description="Maximum number of suggestions")


class ImprovementSuggestionsResponse(BaseModel):
    """Response schema with AI-generated improvement suggestions."""
    funnel_id: str = Field(..., description="ID of the funnel analyzed")
    suggestions: List[Dict[str, Any]] = Field(..., description="List of suggestions with explanations")


class QuestionGenerationRequest(BaseModel):
    """Request schema for AI-generated question creation."""
    funnel_id: str = Field(..., description="ID of the funnel")
    target_audience: Optional[str] = Field(None, description="Description of the target audience")
    question_count: int = Field(..., ge=1, le=20, description="Number of questions to generate")
    topic: Optional[str] = Field(None, description="Topic or theme for questions")


class QuestionGenerationResponse(BaseModel):
    """Response schema with newly generated questions."""
    funnel_id: str = Field(..., description="ID of the funnel")
    questions: List[Dict[str, Any]] = Field(..., description="List of generated questions")


class ResponseAnalysisRequest(BaseModel):
    """Request schema for AI analysis of user responses."""
    funnel_id: str = Field(..., description="ID of the funnel")
    response_data: Dict[str, Any] = Field(..., description="Collected user response data")
    analysis_type: Optional[str] = Field("engagement", description="Type of analysis")


class ResponseAnalysisResponse(BaseModel):
    """Response schema with analysis results."""
    funnel_id: str = Field(..., description="ID of the funnel")
    insights: Dict[str, Any] = Field(..., description="Analysis insights and metrics")


class ABTestVariantRequest(BaseModel):
    """Request to create or manage an A/B test variant."""
    funnel_id: str = Field(..., description="Original funnel ID")
    variant_name: str = Field(..., max_length=100, description="Name for variant")
    changes: Optional[Dict[str, Any]] = Field({}, description="Funnel config changes for variant")


class ABTestVariantResponse(BaseModel):
    """Response for A/B test variant creation/update."""
    variant_id: str = Field(..., description="Unique variant ID")
    funnel_id: str = Field(..., description="Original funnel ID")
    variant_name: str = Field(..., description="Variant name")
    created_at: datetime = Field(..., description="Creation timestamp")
    status: str = Field(..., description="Status of the variant")


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = [
    # Enums
    "FunnelFormatEnum",
    "BrandVoiceEnum",
    "AdPlatformEnum",
    "OptimizationGoalEnum",
    
    # Funnel generation
    "FunnelGenerationRequest",
    "GeneratedQuestion",
    "FunnelGenerationResponse",
    
    # Question optimization
    "QuestionOptimizationRequest",
    "OptimizationSuggestion",
    "QuestionOptimizationResponse",
    
    # Ad copy
    "AdCopyGenerationRequest",
    "GeneratedAdCopy",
    "AdCopyGenerationResponse",
    
    # Audience analysis
    "AudienceAnalysisRequest",
    "AudienceSegment",
    "GeneratedPersona",
    "AudienceAnalysisResponse",
    
    # Format selection
    "FormatSelectionRequest",
    "FormatRecommendation",
    "FormatSelectionResponse",
    
    # Completion prediction
    "CompletionPredictionRequest",
    "CompletionPredictionResponse",
    "ImprovementSuggestionsRequest",
    "ImprovementSuggestionsResponse",
    "QuestionGenerationRequest", 
    "QuestionGenerationResponse",
    "ResponseAnalysisRequest", 
    "ResponseAnalysisResponse"
]
