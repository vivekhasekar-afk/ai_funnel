"""
Audience Analyzer - AI-POWERED PRODUCTION GRADE
================================================
Advanced audience intelligence, segmentation, and psychographic profiling
using AI to deeply understand target customers and optimize messaging.

🎯 ANALYSIS FRAMEWORK:

📊 DEMOGRAPHIC ANALYSIS:
- Age range & generation (Gen Z, Millennial, Gen X, Boomer)
- Income level & economic status
- Education level
- Job titles & industries
- Geographic location

🧠 PSYCHOGRAPHIC PROFILING:
- Values & beliefs
- Lifestyle & interests
- Pain points & challenges
- Goals & aspirations
- Decision-making style

💡 BEHAVIORAL INSIGHTS:
- Buying behavior patterns
- Content consumption preferences
- Communication style preferences
- Technology adoption level
- Social media usage

🎨 MESSAGING OPTIMIZATION:
- Tone & voice recommendations
- Language complexity level
- Emotional triggers
- Value proposition angles
- Call-to-action styles

Author: AI Funnel Builder Team
Version: 3.0.0
Last Updated: 2024-01-15
"""

import asyncio
import logging
import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import json

from app.ai.openai_client import OpenAIClient, OpenAIModel
from app.ai.prompt_templates import get_prompt, PromptVersion
from app.core.config import settings
from app.utils.exceptions import AnalysisError


# Configure logger
logger = logging.getLogger(__name__)


class GenerationType(str, Enum):
    """Generation/Age cohorts"""
    GEN_Z = "gen_z"              # 1997-2012 (12-27)
    MILLENNIAL = "millennial"    # 1981-1996 (28-43)
    GEN_X = "gen_x"              # 1965-1980 (44-59)
    BOOMER = "boomer"            # 1946-1964 (60-78)
    SILENT = "silent"            # 1928-1945 (79+)


class IncomeLevel(str, Enum):
    """Income brackets"""
    LOW = "low"                  # <$30K
    LOWER_MIDDLE = "lower_middle" # $30K-$60K
    MIDDLE = "middle"            # $60K-$100K
    UPPER_MIDDLE = "upper_middle" # $100K-$200K
    HIGH = "high"                # $200K+


class EducationLevel(str, Enum):
    """Education levels"""
    HIGH_SCHOOL = "high_school"
    SOME_COLLEGE = "some_college"
    BACHELORS = "bachelors"
    MASTERS = "masters"
    DOCTORATE = "doctorate"


class DecisionStyle(str, Enum):
    """Decision-making styles"""
    ANALYTICAL = "analytical"      # Data-driven, logical
    INTUITIVE = "intuitive"        # Gut-feeling, emotional
    SOCIAL = "social"              # Influenced by others
    METHODICAL = "methodical"      # Careful, research-heavy


class TechAdoption(str, Enum):
    """Technology adoption levels"""
    INNOVATOR = "innovator"        # First to try new tech
    EARLY_ADOPTER = "early_adopter" # Quick to adopt
    EARLY_MAJORITY = "early_majority" # Adopt after proven
    LATE_MAJORITY = "late_majority"  # Adopt when mainstream
    LAGGARD = "laggard"            # Resistant to new tech


@dataclass
class DemographicProfile:
    """Demographic characteristics"""
    generation: GenerationType
    age_range: str
    income_level: IncomeLevel
    education_level: EducationLevel
    job_function: str
    industry: str
    company_size: str
    location_type: str  # urban|suburban|rural


@dataclass
class PsychographicProfile:
    """Psychographic characteristics"""
    core_values: List[str]
    lifestyle_interests: List[str]
    top_pain_points: List[str]
    primary_goals: List[str]
    decision_style: DecisionStyle
    risk_tolerance: str  # low|medium|high
    status_orientation: str  # prestige-seeking|practical|indifferent


@dataclass
class BehavioralProfile:
    """Behavioral characteristics"""
    buying_triggers: List[str]
    content_preferences: List[str]
    preferred_channels: List[str]
    tech_adoption_level: TechAdoption
    social_media_usage: List[str]
    research_depth: str  # light|moderate|extensive


@dataclass
class MessagingStrategy:
    """Recommended messaging approach"""
    tone_voice: str
    language_complexity: str  # simple|moderate|sophisticated
    emotional_triggers: List[str]
    value_prop_angles: List[str]
    cta_style: str
    proof_elements: List[str]
    urgency_approach: str


@dataclass
class AudienceSegment:
    """Individual audience segment"""
    segment_name: str
    segment_size_estimate: str  # percentage of total
    demographic: DemographicProfile
    psychographic: PsychographicProfile
    behavioral: BehavioralProfile
    messaging: MessagingStrategy
    example_persona: Dict[str, str]


@dataclass
class AudienceAnalysisRequest:
    """Request for audience analysis"""
    
    # Primary input
    target_audience_description: str
    
    # Context
    product_service_description: str
    business_type: str
    industry: str
    
    # Optional enrichment
    existing_customer_data: Optional[Dict[str, Any]] = None
    competitor_audiences: Optional[List[str]] = None
    geographic_focus: Optional[str] = None
    
    # Analysis depth
    include_segments: bool = True
    segment_count: int = 3
    
    def __post_init__(self):
        """Validate request"""
        if not self.target_audience_description or len(self.target_audience_description) < 10:
            raise ValueError("target_audience_description must be at least 10 characters")
        if self.segment_count < 1 or self.segment_count > 5:
            raise ValueError("segment_count must be between 1 and 5")


@dataclass
class AudienceAnalysisResponse:
    """Response with audience insights"""
    
    # Overall audience profile
    primary_audience: AudienceSegment
    
    # Segments (if requested)
    segments: List[AudienceSegment]
    
    # Key insights
    key_insights: List[str]
    competitive_advantages: List[str]
    market_opportunities: List[str]
    
    # Recommendations
    targeting_recommendations: List[str]
    messaging_recommendations: List[str]
    channel_recommendations: List[str]
    
    # Metadata
    confidence_score: float
    analysis_method: str
    analyzed_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'primary_audience': {
                'segment_name': self.primary_audience.segment_name,
                'size_estimate': self.primary_audience.segment_size_estimate,
                'demographic': {
                    'generation': self.primary_audience.demographic.generation.value,
                    'age_range': self.primary_audience.demographic.age_range,
                    'income_level': self.primary_audience.demographic.income_level.value,
                    'education': self.primary_audience.demographic.education_level.value,
                    'job_function': self.primary_audience.demographic.job_function,
                    'industry': self.primary_audience.demographic.industry,
                    'company_size': self.primary_audience.demographic.company_size,
                    'location_type': self.primary_audience.demographic.location_type
                },
                'psychographic': {
                    'core_values': self.primary_audience.psychographic.core_values,
                    'lifestyle_interests': self.primary_audience.psychographic.lifestyle_interests,
                    'top_pain_points': self.primary_audience.psychographic.top_pain_points,
                    'primary_goals': self.primary_audience.psychographic.primary_goals,
                    'decision_style': self.primary_audience.psychographic.decision_style.value,
                    'risk_tolerance': self.primary_audience.psychographic.risk_tolerance,
                    'status_orientation': self.primary_audience.psychographic.status_orientation
                },
                'behavioral': {
                    'buying_triggers': self.primary_audience.behavioral.buying_triggers,
                    'content_preferences': self.primary_audience.behavioral.content_preferences,
                    'preferred_channels': self.primary_audience.behavioral.preferred_channels,
                    'tech_adoption': self.primary_audience.behavioral.tech_adoption_level.value,
                    'social_media': self.primary_audience.behavioral.social_media_usage,
                    'research_depth': self.primary_audience.behavioral.research_depth
                },
                'messaging': {
                    'tone_voice': self.primary_audience.messaging.tone_voice,
                    'language_complexity': self.primary_audience.messaging.language_complexity,
                    'emotional_triggers': self.primary_audience.messaging.emotional_triggers,
                    'value_prop_angles': self.primary_audience.messaging.value_prop_angles,
                    'cta_style': self.primary_audience.messaging.cta_style,
                    'proof_elements': self.primary_audience.messaging.proof_elements,
                    'urgency_approach': self.primary_audience.messaging.urgency_approach
                },
                'example_persona': self.primary_audience.example_persona
            },
            'segments': [
                {
                    'name': seg.segment_name,
                    'size': seg.segment_size_estimate,
                    'key_characteristics': {
                        'generation': seg.demographic.generation.value,
                        'decision_style': seg.psychographic.decision_style.value,
                        'top_pain_point': seg.psychographic.top_pain_points[0] if seg.psychographic.top_pain_points else '',
                        'messaging_tone': seg.messaging.tone_voice
                    }
                }
                for seg in self.segments
            ],
            'insights': {
                'key_insights': self.key_insights,
                'competitive_advantages': self.competitive_advantages,
                'market_opportunities': self.market_opportunities
            },
            'recommendations': {
                'targeting': self.targeting_recommendations,
                'messaging': self.messaging_recommendations,
                'channels': self.channel_recommendations
            },
            'metadata': {
                'confidence': round(self.confidence_score, 2),
                'method': self.analysis_method,
                'analyzed_at': self.analyzed_at.isoformat()
            }
        }


class AudienceAnalyzer:
    """
    AI-powered audience intelligence and segmentation
    
    Analyzes target audiences to provide deep insights into demographics,
    psychographics, behaviors, and optimal messaging strategies.
    """
    
    def __init__(
        self,
        openai_client: Optional[OpenAIClient] = None,
        use_ai: bool = True
    ):
        """
        Initialize audience analyzer
        
        Args:
            openai_client: OpenAI API client
            use_ai: Whether to use AI-powered analysis
        """
        self.openai_client = openai_client or OpenAIClient()
        self.use_ai = use_ai
        
        # Generation year ranges
        self.generation_ranges = {
            GenerationType.GEN_Z: (1997, 2012),
            GenerationType.MILLENNIAL: (1981, 1996),
            GenerationType.GEN_X: (1965, 1980),
            GenerationType.BOOMER: (1946, 1964),
            GenerationType.SILENT: (1928, 1945)
        }
        
        # Job title to income mapping (rough estimates)
        self.income_by_title = {
            'ceo': IncomeLevel.HIGH,
            'founder': IncomeLevel.HIGH,
            'vp': IncomeLevel.HIGH,
            'director': IncomeLevel.UPPER_MIDDLE,
            'manager': IncomeLevel.MIDDLE,
            'coordinator': IncomeLevel.LOWER_MIDDLE,
            'specialist': IncomeLevel.MIDDLE,
            'associate': IncomeLevel.LOWER_MIDDLE,
            'intern': IncomeLevel.LOW
        }
        
        # Metrics
        self.total_analyses = 0
        self.ai_analyses = 0
        self.rule_based_analyses = 0
        
        logger.info("✅ AudienceAnalyzer initialized")
    
    async def analyze_audience(
        self,
        request: AudienceAnalysisRequest
    ) -> Dict[str, Any]:
        """
        Analyze target audience
        
        Args:
            request: Analysis request
            
        Returns:
            Dict: Analysis response
        """
        self.total_analyses += 1
        
        try:
            logger.info(f"🔍 Analyzing audience: {request.target_audience_description[:50]}...")
            
            # Step 1: Extract basic demographics from description
            demographics = self._extract_demographics(request.target_audience_description)
            
            # Step 2: AI-powered or rule-based psychographic analysis
            if self.use_ai:
                try:
                    psychographics = await self._analyze_psychographics_ai(request)
                    behavioral = await self._analyze_behavioral_ai(request)
                    self.ai_analyses += 1
                    method = "ai"
                except Exception as e:
                    logger.warning(f"⚠️ AI analysis failed: {e}, using rule-based")
                    psychographics = self._analyze_psychographics_rules(request)
                    behavioral = self._analyze_behavioral_rules(request)
                    self.rule_based_analyses += 1
                    method = "rule_based"
            else:
                psychographics = self._analyze_psychographics_rules(request)
                behavioral = self._analyze_behavioral_rules(request)
                self.rule_based_analyses += 1
                method = "rule_based"
            
            # Step 3: Generate messaging strategy
            messaging = self._generate_messaging_strategy(
                demographics,
                psychographics,
                behavioral,
                request
            )
            
            # Step 4: Create primary audience segment
            primary_segment = AudienceSegment(
                segment_name="Primary Target Audience",
                segment_size_estimate="100%",
                demographic=demographics,
                psychographic=psychographics,
                behavioral=behavioral,
                messaging=messaging,
                example_persona=self._create_example_persona(
                    demographics,
                    psychographics,
                    behavioral
                )
            )
            
            # Step 5: Create sub-segments if requested
            segments = []
            if request.include_segments:
                segments = await self._create_segments(
                    request,
                    primary_segment,
                    request.segment_count
                )
            
            # Step 6: Generate insights
            insights = self._generate_insights(primary_segment, request)
            advantages = self._identify_competitive_advantages(primary_segment, request)
            opportunities = self._identify_opportunities(primary_segment, request)
            
            # Step 7: Generate recommendations
            targeting_recs = self._recommend_targeting(primary_segment)
            messaging_recs = self._recommend_messaging(primary_segment)
            channel_recs = self._recommend_channels(primary_segment)
            
            # Build response
            response = AudienceAnalysisResponse(
                primary_audience=primary_segment,
                segments=segments,
                key_insights=insights,
                competitive_advantages=advantages,
                market_opportunities=opportunities,
                targeting_recommendations=targeting_recs,
                messaging_recommendations=messaging_recs,
                channel_recommendations=channel_recs,
                confidence_score=0.85 if method == "ai" else 0.70,
                analysis_method=method
            )
            
            logger.info(
                f"✅ Audience analyzed | "
                f"Generation: {demographics.generation.value} | "
                f"Decision Style: {psychographics.decision_style.value} | "
                f"Segments: {len(segments)} | "
                f"Method: {method}"
            )
            
            return response.to_dict()
            
        except Exception as e:
            logger.error(f"❌ Audience analysis failed: {e}", exc_info=True)
            raise AnalysisError(f"Failed to analyze audience: {str(e)}") from e
    
    def _extract_demographics(self, description: str) -> DemographicProfile:
        """Extract demographic info from description"""
        desc_lower = description.lower()
        
        # Detect generation
        generation = self._detect_generation(desc_lower)
        age_range = self._get_age_range_for_generation(generation)
        
        # Detect income level
        income = self._detect_income_level(desc_lower)
        
        # Detect education
        education = self._detect_education_level(desc_lower)
        
        # Detect job function
        job_function = self._extract_job_function(desc_lower)
        
        # Detect industry
        industry = self._extract_industry(desc_lower)
        
        # Detect company size
        company_size = self._extract_company_size(desc_lower)
        
        # Detect location type
        location_type = self._detect_location_type(desc_lower)
        
        return DemographicProfile(
            generation=generation,
            age_range=age_range,
            income_level=income,
            education_level=education,
            job_function=job_function,
            industry=industry,
            company_size=company_size,
            location_type=location_type
        )
    
    def _detect_generation(self, text: str) -> GenerationType:
        """Detect generation from text"""
        if any(word in text for word in ['gen z', 'gen-z', 'zoomer', 'tiktok generation']):
            return GenerationType.GEN_Z
        elif any(word in text for word in ['millennial', 'gen y', 'gen-y']):
            return GenerationType.MILLENNIAL
        elif any(word in text for word in ['gen x', 'gen-x']):
            return GenerationType.GEN_X
        elif any(word in text for word in ['boomer', 'baby boomer']):
            return GenerationType.BOOMER
        elif any(word in text for word in ['20s', 'twenties', 'young adult']):
            return GenerationType.GEN_Z
        elif any(word in text for word in ['30s', 'thirties', '40s', 'forties']):
            return GenerationType.MILLENNIAL
        elif any(word in text for word in ['50s', 'fifties']):
            return GenerationType.GEN_X
        elif any(word in text for word in ['60s', 'sixties', 'retired', 'retirement']):
            return GenerationType.BOOMER
        else:
            # Default to millennial (largest online demographic)
            return GenerationType.MILLENNIAL
    
    def _get_age_range_for_generation(self, gen: GenerationType) -> str:
        """Get age range string for generation"""
        current_year = 2024
        start_year, end_year = self.generation_ranges[gen]
        min_age = current_year - end_year
        max_age = current_year - start_year
        return f"{min_age}-{max_age} years old"
    
    def _detect_income_level(self, text: str) -> IncomeLevel:
        """Detect income level from text"""
        # Check for explicit income mentions
        if any(word in text for word in ['high income', 'wealthy', 'affluent', 'executive']):
            return IncomeLevel.HIGH
        elif any(word in text for word in ['middle class', 'moderate income']):
            return IncomeLevel.MIDDLE
        elif any(word in text for word in ['budget conscious', 'affordable', 'low income']):
            return IncomeLevel.LOW
        
        # Check by job title
        for title, income in self.income_by_title.items():
            if title in text:
                return income
        
        # Default to middle
        return IncomeLevel.MIDDLE
    
    def _detect_education_level(self, text: str) -> EducationLevel:
        """Detect education level from text"""
        if any(word in text for word in ['phd', 'doctorate', 'postdoc']):
            return EducationLevel.DOCTORATE
        elif any(word in text for word in ['mba', 'masters', 'graduate degree']):
            return EducationLevel.MASTERS
        elif any(word in text for word in ['college', 'university', 'degree', 'bachelor']):
            return EducationLevel.BACHELORS
        elif any(word in text for word in ['some college', 'student']):
            return EducationLevel.SOME_COLLEGE
        elif any(word in text for word in ['high school', 'hs grad']):
            return EducationLevel.HIGH_SCHOOL
        else:
            # Default to bachelor's (most common for business audiences)
            return EducationLevel.BACHELORS
    
    def _extract_job_function(self, text: str) -> str:
        """Extract job function/role"""
        # Common job functions
        functions = {
            'marketing': ['marketing', 'marketer', 'cmo', 'brand'],
            'sales': ['sales', 'business development', 'account executive'],
            'engineering': ['engineer', 'developer', 'programmer', 'cto', 'technical'],
            'operations': ['operations', 'ops', 'coo', 'operations manager'],
            'hr': ['hr', 'human resources', 'recruiting', 'talent'],
            'finance': ['finance', 'cfo', 'accounting', 'financial'],
            'executive': ['ceo', 'founder', 'president', 'executive'],
            'product': ['product manager', 'product owner', 'pm']
        }
        
        for function, keywords in functions.items():
            if any(keyword in text for keyword in keywords):
                return function.title()
        
        return "General Business"
    
    def _extract_industry(self, text: str) -> str:
        """Extract industry"""
        industries = {
            'saas': ['saas', 'software', 'tech company', 'technology'],
            'ecommerce': ['ecommerce', 'e-commerce', 'online store', 'retail'],
            'consulting': ['consulting', 'consultant', 'advisory'],
            'agency': ['agency', 'marketing agency', 'creative agency'],
            'healthcare': ['healthcare', 'health', 'medical', 'hospital'],
            'finance': ['finance', 'banking', 'fintech', 'financial services'],
            'education': ['education', 'edtech', 'learning', 'training'],
            'real_estate': ['real estate', 'property', 'realty']
        }
        
        for industry, keywords in industries.items():
            if any(keyword in text for keyword in keywords):
                return industry.replace('_', ' ').title()
        
        return "General Business"
    
    def _extract_company_size(self, text: str) -> str:
        """Extract company size"""
        if any(word in text for word in ['enterprise', 'fortune 500', 'large company']):
            return "Enterprise (1000+ employees)"
        elif any(word in text for word in ['mid-size', 'medium', 'mid-market']):
            return "Mid-Market (100-1000 employees)"
        elif any(word in text for word in ['small business', 'smb', 'startup']):
            return "Small Business (10-100 employees)"
        elif any(word in text for word in ['solopreneur', 'freelance', 'solo']):
            return "Solo/Micro (1-10 employees)"
        else:
            return "Small to Mid-Size (10-500 employees)"
    
    def _detect_location_type(self, text: str) -> str:
        """Detect location type"""
        if any(word in text for word in ['urban', 'city', 'metro']):
            return "urban"
        elif any(word in text for word in ['suburban', 'suburb']):
            return "suburban"
        elif any(word in text for word in ['rural', 'countryside']):
            return "rural"
        else:
            return "mixed"
    
    async def _analyze_psychographics_ai(
        self,
        request: AudienceAnalysisRequest
    ) -> PsychographicProfile:
        """AI-powered psychographic analysis"""
        try:
            # Get prompt template
            prompt_template = get_prompt("audience_analyzer", PromptVersion.LATEST)
            
            # Prepare variables
            template_vars = {
                'target_audience': request.target_audience_description,
                'product_service': request.product_service_description,
                'business_type': request.business_type,
                'industry': request.industry
            }
            
            # Render prompt
            messages = prompt_template.render(**template_vars)
            
            # Call OpenAI
            response = await self.openai_client.create_json_completion(
                messages=messages,
                model=OpenAIModel.GPT_4_TURBO,
                temperature=0.6,
                max_tokens=1500
            )
            
            # Parse response
            psycho_data = response.get('psychographics', {})
            
            return PsychographicProfile(
                core_values=psycho_data.get('core_values', []),
                lifestyle_interests=psycho_data.get('lifestyle_interests', []),
                top_pain_points=psycho_data.get('pain_points', []),
                primary_goals=psycho_data.get('goals', []),
                decision_style=DecisionStyle(psycho_data.get('decision_style', 'analytical')),
                risk_tolerance=psycho_data.get('risk_tolerance', 'medium'),
                status_orientation=psycho_data.get('status_orientation', 'practical')
            )
            
        except Exception as e:
            logger.error(f"❌ AI psychographic analysis error: {e}")
            raise
    
    def _analyze_psychographics_rules(
        self,
        request: AudienceAnalysisRequest
    ) -> PsychographicProfile:
        """Rule-based psychographic analysis"""
        desc_lower = request.target_audience_description.lower()
        
        # Determine decision style
        if any(word in desc_lower for word in ['analytical', 'data', 'metrics', 'technical']):
            decision_style = DecisionStyle.ANALYTICAL
        elif any(word in desc_lower for word in ['creative', 'intuitive', 'artistic']):
            decision_style = DecisionStyle.INTUITIVE
        elif any(word in desc_lower for word in ['social', 'collaborative', 'team']):
            decision_style = DecisionStyle.SOCIAL
        else:
            decision_style = DecisionStyle.METHODICAL
        
        # Determine risk tolerance
        if any(word in desc_lower for word in ['conservative', 'risk-averse', 'cautious']):
            risk_tolerance = "low"
        elif any(word in desc_lower for word in ['innovative', 'early adopter', 'cutting edge']):
            risk_tolerance = "high"
        else:
            risk_tolerance = "medium"
        
        # Determine status orientation
        if any(word in desc_lower for word in ['prestige', 'luxury', 'premium', 'exclusive']):
            status_orientation = "prestige-seeking"
        elif any(word in desc_lower for word in ['practical', 'value', 'efficient', 'budget']):
            status_orientation = "practical"
        else:
            status_orientation = "balanced"
        
        # Generic values based on business type
        if 'b2b' in request.business_type.lower():
            core_values = ["ROI", "Efficiency", "Growth", "Innovation"]
            pain_points = ["Inefficiency", "Lost revenue", "Competition", "Scaling challenges"]
            goals = ["Increase revenue", "Improve efficiency", "Scale operations", "Competitive advantage"]
        else:
            core_values = ["Quality", "Value", "Convenience", "Trust"]
            pain_points = ["Wasting time", "Wasting money", "Frustration", "Lack of results"]
            goals = ["Save time", "Save money", "Achieve goals", "Feel confident"]
        
        lifestyle_interests = self._infer_lifestyle_interests(desc_lower)
        
        return PsychographicProfile(
            core_values=core_values,
            lifestyle_interests=lifestyle_interests,
            top_pain_points=pain_points,
            primary_goals=goals,
            decision_style=decision_style,
            risk_tolerance=risk_tolerance,
            status_orientation=status_orientation
        )
    
    def _infer_lifestyle_interests(self, text: str) -> List[str]:
        """Infer lifestyle interests from description"""
        interests = []
        
        interest_keywords = {
            "Technology": ['tech', 'technology', 'digital', 'software'],
            "Business": ['business', 'entrepreneurship', 'startup'],
            "Health & Wellness": ['health', 'fitness', 'wellness', 'nutrition'],
            "Finance": ['finance', 'investing', 'money', 'wealth'],
            "Personal Development": ['growth', 'learning', 'development', 'improvement'],
            "Travel": ['travel', 'adventure', 'vacation'],
            "Family": ['family', 'parenting', 'children', 'kids']
        }
        
        for interest, keywords in interest_keywords.items():
            if any(keyword in text for keyword in keywords):
                interests.append(interest)
        
        if not interests:
            interests = ["Professional Development", "Business Growth"]
        
        return interests[:5]  # Max 5
    
    async def _analyze_behavioral_ai(
        self,
        request: AudienceAnalysisRequest
    ) -> BehavioralProfile:
        """AI-powered behavioral analysis"""
        # For now, fall back to rules (could be enhanced with separate AI call)
        return self._analyze_behavioral_rules(request)
    
    def _analyze_behavioral_rules(
        self,
        request: AudienceAnalysisRequest
    ) -> BehavioralProfile:
        """Rule-based behavioral analysis"""
        desc_lower = request.target_audience_description.lower()
        
        # Determine buying triggers
        buying_triggers = []
        if 'urgent' in desc_lower or 'immediate' in desc_lower:
            buying_triggers.append("Urgency/Time pressure")
        if 'roi' in desc_lower or 'return' in desc_lower:
            buying_triggers.append("ROI/Financial benefit")
        if 'competition' in desc_lower or 'competitive' in desc_lower:
            buying_triggers.append("Competitive advantage")
        if 'proven' in desc_lower or 'results' in desc_lower:
            buying_triggers.append("Proven results/Social proof")
        if not buying_triggers:
            buying_triggers = ["Value", "Quality", "Results"]
        
        # Content preferences
        if 'technical' in desc_lower or 'data' in desc_lower:
            content_prefs = ["Case studies", "Whitepapers", "Technical documentation", "Webinars"]
        elif 'quick' in desc_lower or 'busy' in desc_lower:
            content_prefs = ["Short videos", "Infographics", "Quick tips", "Summaries"]
        else:
            content_prefs = ["Blog posts", "Videos", "Guides", "Email newsletters"]
        
        # Preferred channels
        if 'b2b' in request.business_type.lower():
            channels = ["LinkedIn", "Email", "Industry publications", "Webinars"]
        elif 'young' in desc_lower or 'gen z' in desc_lower:
            channels = ["Instagram", "TikTok", "YouTube", "Discord"]
        else:
            channels = ["Facebook", "Email", "Google Search", "YouTube"]
        
        # Tech adoption
        if any(word in desc_lower for word in ['early adopter', 'innovative', 'tech-savvy']):
            tech_adoption = TechAdoption.EARLY_ADOPTER
        elif any(word in desc_lower for word in ['traditional', 'conservative']):
            tech_adoption = TechAdoption.LATE_MAJORITY
        else:
            tech_adoption = TechAdoption.EARLY_MAJORITY
        
        # Social media usage
        social_media = []
        platforms = {
            'LinkedIn': ['linkedin', 'b2b', 'professional'],
            'Facebook': ['facebook', 'fb'],
            'Instagram': ['instagram', 'visual', 'lifestyle'],
            'Twitter/X': ['twitter', 'x', 'news'],
            'TikTok': ['tiktok', 'gen z', 'video'],
            'YouTube': ['youtube', 'video']
        }
        
        for platform, keywords in platforms.items():
            if any(keyword in desc_lower for keyword in keywords):
                social_media.append(platform)
        
        if not social_media:
            social_media = ["Email", "Google Search"]
        
        # Research depth
        if any(word in desc_lower for word in ['analytical', 'thorough', 'careful']):
            research_depth = "extensive"
        elif any(word in desc_lower for word in ['quick', 'busy', 'impulsive']):
            research_depth = "light"
        else:
            research_depth = "moderate"
        
        return BehavioralProfile(
            buying_triggers=buying_triggers,
            content_preferences=content_prefs,
            preferred_channels=channels,
            tech_adoption_level=tech_adoption,
            social_media_usage=social_media[:5],
            research_depth=research_depth
        )
    
    def _generate_messaging_strategy(
        self,
        demographics: DemographicProfile,
        psychographics: PsychographicProfile,
        behavioral: BehavioralProfile,
        request: AudienceAnalysisRequest
    ) -> MessagingStrategy:
        """Generate messaging strategy based on profiles"""
        
        # Determine tone based on generation and decision style
        if demographics.generation in [GenerationType.GEN_Z, GenerationType.MILLENNIAL]:
            if psychographics.decision_style == DecisionStyle.ANALYTICAL:
                tone = "Conversational yet data-driven"
            else:
                tone = "Casual, authentic, relatable"
        else:
            if psychographics.decision_style == DecisionStyle.ANALYTICAL:
                tone = "Professional, authoritative, data-backed"
            else:
                tone = "Professional, trustworthy, respectful"
        
        # Language complexity based on education and industry
        if demographics.education_level in [EducationLevel.MASTERS, EducationLevel.DOCTORATE]:
            language_complexity = "sophisticated"
        elif demographics.education_level == EducationLevel.BACHELORS:
            language_complexity = "moderate"
        else:
            language_complexity = "simple"
        
        # Emotional triggers based on psychographics
        emotional_triggers = []
        if "efficiency" in str(psychographics.core_values).lower():
            emotional_triggers.append("Time savings")
        if "growth" in str(psychographics.core_values).lower():
            emotional_triggers.append("Achievement")
        if psychographics.risk_tolerance == "high":
            emotional_triggers.append("Innovation/Being first")
        else:
            emotional_triggers.append("Safety/Security")
        emotional_triggers.append("Belonging")
        
        # Value prop angles based on pain points
        value_props = [f"Solves {pain}" for pain in psychographics.top_pain_points[:2]]
        value_props.extend([f"Helps achieve {goal}" for goal in psychographics.primary_goals[:2]])
        
        # CTA style based on decision style
        if psychographics.decision_style == DecisionStyle.ANALYTICAL:
            cta_style = "Data-driven (e.g., 'See the ROI Calculator')"
        elif psychographics.decision_style == DecisionStyle.INTUITIVE:
            cta_style = "Benefit-focused (e.g., 'Start Winning')"
        else:
            cta_style = "Action-oriented (e.g., 'Get Started Today')"
        
        # Proof elements
        proof_elements = []
        if behavioral.research_depth == "extensive":
            proof_elements = ["Case studies", "ROI data", "Third-party reviews", "Certifications"]
        elif behavioral.research_depth == "moderate":
            proof_elements = ["Customer testimonials", "Success metrics", "Trust badges"]
        else:
            proof_elements = ["Social proof numbers", "Quick wins"]
        
        # Urgency approach based on risk tolerance
        if psychographics.risk_tolerance == "high":
            urgency = "Scarcity (limited spots, exclusive access)"
        elif psychographics.risk_tolerance == "low":
            urgency = "Soft urgency (risk-free trial, money-back guarantee)"
        else:
            urgency = "Moderate urgency (limited-time offer, bonus)"
        
        return MessagingStrategy(
            tone_voice=tone,
            language_complexity=language_complexity,
            emotional_triggers=emotional_triggers,
            value_prop_angles=value_props[:4],
            cta_style=cta_style,
            proof_elements=proof_elements,
            urgency_approach=urgency
        )
    
    def _create_example_persona(
        self,
        demographics: DemographicProfile,
        psychographics: PsychographicProfile,
        behavioral: BehavioralProfile
    ) -> Dict[str, str]:
        """Create an example persona"""
        
        # Generate name based on generation
        if demographics.generation == GenerationType.GEN_Z:
            names = ["Jordan", "Taylor", "Alex", "Morgan"]
        elif demographics.generation == GenerationType.MILLENNIAL:
            names = ["Sarah", "Mike", "Emily", "David"]
        elif demographics.generation == GenerationType.GEN_X:
            names = ["Jennifer", "Robert", "Lisa", "Michael"]
        else:
            names = ["Linda", "James", "Patricia", "John"]
        
        import random
        name = random.choice(names)
        
        return {
            'name': f"{name} (Example Persona)",
            'age': demographics.age_range.split('-')[0],
            'role': demographics.job_function,
            'company': f"{demographics.company_size} {demographics.industry} company",
            'top_goal': psychographics.primary_goals[0] if psychographics.primary_goals else "Success",
            'biggest_challenge': psychographics.top_pain_points[0] if psychographics.top_pain_points else "Efficiency",
            'decision_approach': psychographics.decision_style.value,
            'preferred_channel': behavioral.preferred_channels[0] if behavioral.preferred_channels else "Email"
        }
    
    async def _create_segments(
        self,
        request: AudienceAnalysisRequest,
        primary_segment: AudienceSegment,
        count: int
    ) -> List[AudienceSegment]:
        """Create audience sub-segments"""
        segments = []
        
        # For simplicity, create variations of primary segment
        # In production, this would use clustering/segmentation algorithms
        
        segment_variations = [
            ("Early Adopters", "20%", DecisionStyle.INTUITIVE, TechAdoption.EARLY_ADOPTER),
            ("Pragmatists", "50%", DecisionStyle.METHODICAL, TechAdoption.EARLY_MAJORITY),
            ("Conservatives", "30%", DecisionStyle.ANALYTICAL, TechAdoption.LATE_MAJORITY),
        ]
        
        for i in range(min(count, len(segment_variations))):
            name, size, decision_style, tech_adoption = segment_variations[i]
            
            # Clone and modify primary segment
            segment = AudienceSegment(
                segment_name=name,
                segment_size_estimate=size,
                demographic=primary_segment.demographic,
                psychographic=PsychographicProfile(
                    core_values=primary_segment.psychographic.core_values,
                    lifestyle_interests=primary_segment.psychographic.lifestyle_interests,
                    top_pain_points=primary_segment.psychographic.top_pain_points,
                    primary_goals=primary_segment.psychographic.primary_goals,
                    decision_style=decision_style,
                    risk_tolerance=primary_segment.psychographic.risk_tolerance,
                    status_orientation=primary_segment.psychographic.status_orientation
                ),
                behavioral=BehavioralProfile(
                    buying_triggers=primary_segment.behavioral.buying_triggers,
                    content_preferences=primary_segment.behavioral.content_preferences,
                    preferred_channels=primary_segment.behavioral.preferred_channels,
                    tech_adoption_level=tech_adoption,
                    social_media_usage=primary_segment.behavioral.social_media_usage,
                    research_depth=primary_segment.behavioral.research_depth
                ),
                messaging=primary_segment.messaging,
                example_persona=primary_segment.example_persona
            )
            
            segments.append(segment)
        
        return segments
    
    def _generate_insights(
        self,
        segment: AudienceSegment,
        request: AudienceAnalysisRequest
    ) -> List[str]:
        """Generate key insights"""
        insights = []
        
        insights.append(
            f"Primary audience is {segment.demographic.generation.value.replace('_', ' ')} "
            f"({segment.demographic.age_range})"
        )
        
        insights.append(
            f"Decision-making style is {segment.psychographic.decision_style.value} - "
            f"messaging should be {segment.messaging.tone_voice.lower()}"
        )
        
        insights.append(
            f"Top pain point is '{segment.psychographic.top_pain_points[0]}' - "
            f"lead with this in messaging"
        )
        
        insights.append(
            f"Prefers {segment.behavioral.preferred_channels[0]} as primary channel"
        )
        
        insights.append(
            f"Tech adoption level: {segment.behavioral.tech_adoption_level.value.replace('_', ' ')} - "
            f"adjust onboarding complexity accordingly"
        )
        
        return insights
    
    def _identify_competitive_advantages(
        self,
        segment: AudienceSegment,
        request: AudienceAnalysisRequest
    ) -> List[str]:
        """Identify competitive advantages to emphasize"""
        advantages = []
        
        if segment.psychographic.decision_style == DecisionStyle.ANALYTICAL:
            advantages.append("Emphasize data, metrics, and ROI in positioning")
        
        if segment.demographic.income_level in [IncomeLevel.HIGH, IncomeLevel.UPPER_MIDDLE]:
            advantages.append("Focus on premium quality and exclusive benefits")
        else:
            advantages.append("Highlight value and cost-effectiveness")
        
        if segment.behavioral.tech_adoption_level in [TechAdoption.INNOVATOR, TechAdoption.EARLY_ADOPTER]:
            advantages.append("Position as cutting-edge/innovative solution")
        else:
            advantages.append("Emphasize proven track record and ease of use")
        
        return advantages
    
    def _identify_opportunities(
        self,
        segment: AudienceSegment,
        request: AudienceAnalysisRequest
    ) -> List[str]:
        """Identify market opportunities"""
        opportunities = []
        
        opportunities.append(
            f"Create content addressing '{segment.psychographic.top_pain_points[0]}'"
        )
        
        opportunities.append(
            f"Develop {segment.behavioral.preferred_channels[0]} presence for reach"
        )
        
        if segment.behavioral.research_depth == "extensive":
            opportunities.append("Invest in detailed case studies and documentation")
        elif segment.behavioral.research_depth == "light":
            opportunities.append("Create quick, digestible content (videos, infographics)")
        
        return opportunities
    
    def _recommend_targeting(self, segment: AudienceSegment) -> List[str]:
        """Recommend targeting strategies"""
        recommendations = []
        
        recommendations.append(
            f"Target {segment.demographic.generation.value.replace('_', ' ')} "
            f"demographic ({segment.demographic.age_range})"
        )
        
        recommendations.append(
            f"Focus on {segment.demographic.job_function} roles in "
            f"{segment.demographic.industry}"
        )
        
        recommendations.append(
            f"Use interest targeting: {', '.join(segment.psychographic.lifestyle_interests[:3])}"
        )
        
        return recommendations
    
    def _recommend_messaging(self, segment: AudienceSegment) -> List[str]:
        """Recommend messaging strategies"""
        recommendations = []
        
        recommendations.append(
            f"Use {segment.messaging.tone_voice.lower()} tone in all communications"
        )
        
        recommendations.append(
            f"Lead with emotional trigger: {segment.messaging.emotional_triggers[0]}"
        )
        
        recommendations.append(
            f"Highlight value proposition: {segment.messaging.value_prop_angles[0]}"
        )
        
        recommendations.append(
            f"Include proof elements: {', '.join(segment.messaging.proof_elements[:2])}"
        )
        
        return recommendations
    
    def _recommend_channels(self, segment: AudienceSegment) -> List[str]:
        """Recommend channel strategies"""
        recommendations = []
        
        for i, channel in enumerate(segment.behavioral.preferred_channels[:3], 1):
            recommendations.append(
                f"Priority {i}: {channel} - "
                f"{segment.behavioral.content_preferences[min(i-1, len(segment.behavioral.content_preferences)-1)]}"
            )
        
        return recommendations
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get analyzer metrics"""
        ai_rate = self.ai_analyses / max(self.total_analyses, 1)
        
        return {
            'total_analyses': self.total_analyses,
            'ai_analyses': self.ai_analyses,
            'rule_based_analyses': self.rule_based_analyses,
            'ai_usage_rate': round(ai_rate, 3)
        }


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

async def analyze_audience_quick(
    audience_description: str,
    product: str = "Business software",
    business_type: str = "SaaS"
) -> Dict[str, Any]:
    """Quick audience analysis"""
    analyzer = AudienceAnalyzer(use_ai=False)
    
    request = AudienceAnalysisRequest(
        target_audience_description=audience_description,
        product_service_description=product,
        business_type=business_type,
        industry="Technology",
        include_segments=False
    )
    
    return await analyzer.analyze_audience(request)


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'AudienceAnalyzer',
    'AudienceAnalysisRequest',
    'AudienceAnalysisResponse',
    'AudienceSegment',
    'GenerationType',
    'DecisionStyle',
    'TechAdoption',
    'analyze_audience_quick'
]
