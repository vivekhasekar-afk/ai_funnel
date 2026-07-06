"""
Conversion Optimizer - AI-POWERED PRODUCTION GRADE
===================================================
Advanced conversion rate optimization using AI, behavioral psychology,
and multivariate analysis to maximize funnel performance.

🎯 OPTIMIZATION FRAMEWORK:

📊 ANALYSIS DIMENSIONS:
1. Funnel Flow Analysis (drop-off points, friction)
2. Psychological Optimization (persuasion, motivation)
3. Copy & Messaging (clarity, urgency, value prop)
4. Design & UX (layout, visual hierarchy, mobile)
5. Technical Performance (speed, errors, compatibility)

🔬 OPTIMIZATION TECHNIQUES:
- Friction reduction
- Psychological triggers
- Urgency & scarcity
- Social proof placement
- Value proposition clarity
- Trust signal optimization
- CTA optimization
- Form field optimization

📈 IMPROVEMENT PREDICTIONS:
- Estimated completion rate lift
- Expected lead quality impact
- Revenue impact projection
- Implementation priority scoring

Author: AI Funnel Builder Team
Version: 3.0.0
Last Updated: 2024-01-15
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import json

from app.ai.openai_client import OpenAIClient, OpenAIModel
from app.ai.prompt_templates import get_prompt, PromptVersion
from app.core.config import settings
from app.utils.exceptions import OptimizationError


# Configure logger
logger = logging.getLogger(__name__)


class OptimizationPriority(str, Enum):
    """Priority levels for optimizations"""
    CRITICAL = "critical"      # High impact, low effort
    HIGH = "high"              # High impact, medium effort
    MEDIUM = "medium"          # Medium impact, low-medium effort
    LOW = "low"                # Low impact or high effort
    EXPERIMENTAL = "experimental"  # Unproven but worth testing


class OptimizationType(str, Enum):
    """Types of optimizations"""
    FRICTION_REDUCTION = "friction_reduction"
    PSYCHOLOGICAL = "psychological"
    COPY_MESSAGING = "copy_messaging"
    DESIGN_UX = "design_ux"
    TECHNICAL = "technical"
    PERSONALIZATION = "personalization"


class ImpactLevel(str, Enum):
    """Expected impact levels"""
    GAME_CHANGER = "game_changer"    # 20%+ lift
    HIGH = "high"                     # 10-20% lift
    MODERATE = "moderate"             # 5-10% lift
    INCREMENTAL = "incremental"       # 1-5% lift
    MINIMAL = "minimal"               # <1% lift


@dataclass
class FrictionPoint:
    """Identified friction point in funnel"""
    location: str  # Where in funnel
    friction_type: str
    severity: str  # low|medium|high|critical
    description: str
    user_impact: str
    estimated_drop_off: float  # Percentage dropping off here


@dataclass
class OptimizationRecommendation:
    """Individual optimization recommendation"""
    
    # Identification
    recommendation_id: str
    title: str
    optimization_type: OptimizationType
    priority: OptimizationPriority
    
    # Details
    current_state: str
    proposed_change: str
    reasoning: str
    
    # Impact
    expected_impact: ImpactLevel
    estimated_cr_lift: float  # Percentage points
    estimated_revenue_impact: Optional[float]  # Dollar amount
    confidence: float  # 0-1
    
    # Implementation
    implementation_effort: str  # low|medium|high
    implementation_notes: str
    requires_testing: bool
    
    # Psychology
    psychological_principle: Optional[str] = None
    target_emotion: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.recommendation_id,
            'title': self.title,
            'type': self.optimization_type.value,
            'priority': self.priority.value,
            'current_state': self.current_state,
            'proposed_change': self.proposed_change,
            'reasoning': self.reasoning,
            'impact': {
                'level': self.expected_impact.value,
                'cr_lift': f"+{self.estimated_cr_lift:.1f}%",
                'revenue_impact': f"${self.estimated_revenue_impact:,.0f}" if self.estimated_revenue_impact else "TBD",
                'confidence': f"{self.confidence:.0%}"
            },
            'implementation': {
                'effort': self.implementation_effort,
                'notes': self.implementation_notes,
                'requires_testing': self.requires_testing
            },
            'psychology': {
                'principle': self.psychological_principle,
                'target_emotion': self.target_emotion
            } if self.psychological_principle else None
        }


@dataclass
class OptimizationScore:
    """Overall optimization score and breakdown"""
    overall_score: float  # 0-100
    friction_score: float  # 0-100 (higher = less friction)
    psychological_score: float  # 0-100
    copy_score: float  # 0-100
    design_score: float  # 0-100
    technical_score: float  # 0-100
    
    grade: str  # A+, A, B+, B, C+, C, D, F
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary"""
        return {
            'overall': round(self.overall_score, 1),
            'friction': round(self.friction_score, 1),
            'psychological': round(self.psychological_score, 1),
            'copy': round(self.copy_score, 1),
            'design': round(self.design_score, 1),
            'technical': round(self.technical_score, 1),
            'grade': self.grade
        }


@dataclass
class OptimizationRequest:
    """Request for conversion optimization"""
    
    # Funnel data
    funnel_data: Dict[str, Any]  # Questions, design, persuasion elements
    
    # Context
    target_audience: str
    funnel_goal: str
    current_conversion_rate: Optional[float] = None
    
    # Performance data (if available)
    analytics_data: Optional[Dict[str, Any]] = None
    
    # Preferences
    optimization_focus: Optional[str] = None  # "conversion_rate"|"lead_quality"|"balanced"
    risk_tolerance: str = "moderate"  # "conservative"|"moderate"|"aggressive"
    
    def __post_init__(self):
        """Validate request"""
        if not self.funnel_data:
            raise ValueError("funnel_data is required")
        if not self.target_audience:
            raise ValueError("target_audience is required")


@dataclass
class OptimizationResponse:
    """Response with optimization recommendations"""
    
    # Overall assessment
    optimization_score: OptimizationScore
    
    # Identified issues
    friction_points: List[FrictionPoint]
    
    # Recommendations (sorted by priority)
    recommendations: List[OptimizationRecommendation]
    
    # Predictions
    current_estimated_cr: float
    optimized_estimated_cr: float
    total_estimated_lift: float
    
    # Quick wins (top 3 easy improvements)
    quick_wins: List[OptimizationRecommendation]
    
    # Summary
    summary: str
    key_insights: List[str]
    
    # Metadata
    optimization_method: str
    confidence_score: float
    optimized_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'optimization_score': self.optimization_score.to_dict(),
            'friction_points': [
                {
                    'location': fp.location,
                    'type': fp.friction_type,
                    'severity': fp.severity,
                    'description': fp.description,
                    'impact': fp.user_impact,
                    'estimated_drop_off': f"{fp.estimated_drop_off:.1f}%"
                }
                for fp in self.friction_points
            ],
            'recommendations': [rec.to_dict() for rec in self.recommendations],
            'predictions': {
                'current_cr': f"{self.current_estimated_cr:.1f}%",
                'optimized_cr': f"{self.optimized_estimated_cr:.1f}%",
                'total_lift': f"+{self.total_estimated_lift:.1f}%"
            },
            'quick_wins': [rec.to_dict() for rec in self.quick_wins],
            'summary': self.summary,
            'key_insights': self.key_insights,
            'metadata': {
                'method': self.optimization_method,
                'confidence': round(self.confidence_score, 2),
                'optimized_at': self.optimized_at.isoformat()
            }
        }


class ConversionOptimizer:
    """
    AI-powered conversion rate optimization
    
    Analyzes funnels to identify friction points and provide
    actionable optimization recommendations with impact predictions.
    """
    
    def __init__(
        self,
        openai_client: Optional[OpenAIClient] = None,
        use_ai: bool = True
    ):
        """
        Initialize conversion optimizer
        
        Args:
            openai_client: OpenAI API client
            use_ai: Whether to use AI-powered optimization
        """
        self.openai_client = openai_client or OpenAIClient()
        self.use_ai = use_ai
        
        # Friction patterns
        self.friction_patterns = {
            'too_many_fields': {
                'threshold': 8,
                'severity': 'high',
                'impact': 0.15  # 15% drop-off
            },
            'text_input_first': {
                'severity': 'high',
                'impact': 0.20  # 20% drop-off
            },
            'no_progress_indicator': {
                'severity': 'medium',
                'impact': 0.08  # 8% drop-off
            },
            'poor_mobile_optimization': {
                'severity': 'critical',
                'impact': 0.30  # 30% drop-off on mobile
            },
            'unclear_value_prop': {
                'severity': 'high',
                'impact': 0.25  # 25% drop-off
            },
            'weak_cta': {
                'severity': 'medium',
                'impact': 0.10  # 10% drop-off
            }
        }
        
        # Psychological principles
        self.psychological_principles = {
            'reciprocity': 'People feel obligated to return favors',
            'social_proof': 'People follow the actions of others',
            'authority': 'People trust credible experts',
            'scarcity': 'Limited availability increases perceived value',
            'commitment': 'People honor their commitments',
            'liking': 'People prefer to say yes to those they like'
        }
        
        # Metrics
        self.total_optimizations = 0
        self.ai_optimizations = 0
        self.rule_based_optimizations = 0
        
        logger.info("✅ ConversionOptimizer initialized")
    
    async def optimize_funnel(
        self,
        request: OptimizationRequest
    ) -> Dict[str, Any]:
        """
        Optimize funnel for conversion
        
        Args:
            request: Optimization request
            
        Returns:
            Dict: Optimization response
        """
        self.total_optimizations += 1
        
        try:
            logger.info(f"🔧 Optimizing funnel for: {request.funnel_goal[:50]}...")
            
            # Step 1: Analyze current state
            friction_points = self._identify_friction_points(request)
            optimization_score = self._calculate_optimization_score(request, friction_points)
            
            # Step 2: Generate recommendations
            if self.use_ai:
                try:
                    recommendations = await self._generate_recommendations_ai(
                        request,
                        friction_points,
                        optimization_score
                    )
                    self.ai_optimizations += 1
                    method = "ai"
                except Exception as e:
                    logger.warning(f"⚠️ AI optimization failed: {e}, using rule-based")
                    recommendations = self._generate_recommendations_rules(
                        request,
                        friction_points,
                        optimization_score
                    )
                    self.rule_based_optimizations += 1
                    method = "rule_based"
            else:
                recommendations = self._generate_recommendations_rules(
                    request,
                    friction_points,
                    optimization_score
                )
                self.rule_based_optimizations += 1
                method = "rule_based"
            
            # Step 3: Sort by priority
            recommendations.sort(
                key=lambda x: (
                    ['critical', 'high', 'medium', 'low', 'experimental'].index(x.priority.value),
                    -x.estimated_cr_lift
                )
            )
            
            # Step 4: Identify quick wins
            quick_wins = [
                rec for rec in recommendations
                if rec.implementation_effort == "low" and rec.estimated_cr_lift >= 2.0
            ][:3]
            
            # Step 5: Calculate predictions
            current_cr = request.current_conversion_rate or self._estimate_current_cr(request)
            total_potential_lift = sum(rec.estimated_cr_lift for rec in recommendations[:5])
            optimized_cr = min(current_cr + total_potential_lift, 90.0)  # Cap at 90%
            
            # Step 6: Generate insights
            key_insights = self._generate_insights(
                friction_points,
                recommendations,
                optimization_score
            )
            
            # Step 7: Generate summary
            summary = self._generate_summary(
                optimization_score,
                len(friction_points),
                total_potential_lift,
                request
            )
            
            # Build response
            response = OptimizationResponse(
                optimization_score=optimization_score,
                friction_points=friction_points,
                recommendations=recommendations,
                current_estimated_cr=current_cr,
                optimized_estimated_cr=optimized_cr,
                total_estimated_lift=total_potential_lift,
                quick_wins=quick_wins,
                summary=summary,
                key_insights=key_insights,
                optimization_method=method,
                confidence_score=0.80 if method == "ai" else 0.70
            )
            
            logger.info(
                f"✅ Optimization complete | "
                f"Score: {optimization_score.grade} ({optimization_score.overall_score:.0f}/100) | "
                f"Friction Points: {len(friction_points)} | "
                f"Recommendations: {len(recommendations)} | "
                f"Potential Lift: +{total_potential_lift:.1f}% | "
                f"Method: {method}"
            )
            
            return response.to_dict()
            
        except Exception as e:
            logger.error(f"❌ Optimization failed: {e}", exc_info=True)
            raise OptimizationError(f"Failed to optimize funnel: {str(e)}") from e
    
    def _identify_friction_points(
        self,
        request: OptimizationRequest
    ) -> List[FrictionPoint]:
        """Identify friction points in funnel"""
        friction_points = []
        funnel = request.funnel_data
        
        # Get questions
        questions = funnel.get('questions', [])
        num_questions = len(questions)
        
        # Check: Too many questions
        if num_questions > 8:
            friction_points.append(FrictionPoint(
                location="Overall funnel length",
                friction_type="Length fatigue",
                severity="high",
                description=f"Funnel has {num_questions} questions (optimal: 4-6)",
                user_impact="Users get fatigued and abandon",
                estimated_drop_off=min((num_questions - 8) * 2, 20)
            ))
        
        # Check: Text input as first question
        if questions and questions[0].get('question_type') == 'text':
            friction_points.append(FrictionPoint(
                location="Question 1",
                friction_type="High-friction start",
                severity="critical",
                description="First question is text input (high friction)",
                user_impact="Users abandon before engagement",
                estimated_drop_off=20
            ))
        
        # Check: Too many text inputs
        text_inputs = sum(1 for q in questions if q.get('question_type') == 'text')
        if text_inputs > 3:
            friction_points.append(FrictionPoint(
                location="Throughout funnel",
                friction_type="Cognitive overload",
                severity="high",
                description=f"{text_inputs} text input fields (optimal: 1-2)",
                user_impact="Users tired of typing",
                estimated_drop_off=text_inputs * 3
            ))
        
        # Check: No progress indicator
        design = funnel.get('design_suggestions', {})
        if not design.get('progress_bar', True):
            friction_points.append(FrictionPoint(
                location="Overall UX",
                friction_type="Lack of progress visibility",
                severity="medium",
                description="No progress indicator shown",
                user_impact="Users don't know how much is left",
                estimated_drop_off=8
            ))
        
        # Check: Mobile optimization
        mobile_opt = design.get('mobile_optimization', {})
        if not mobile_opt.get('thumb_friendly_spacing'):
            friction_points.append(FrictionPoint(
                location="Mobile experience",
                friction_type="Poor mobile UX",
                severity="critical",
                description="Not optimized for mobile interactions",
                user_impact="50%+ of users on mobile struggle",
                estimated_drop_off=30
            ))
        
        # Check: Weak value proposition
        persuasion = funnel.get('persuasion_elements', {})
        if not persuasion.get('reciprocity_offers'):
            friction_points.append(FrictionPoint(
                location="Value proposition",
                friction_type="Unclear benefit",
                severity="high",
                description="No clear incentive/benefit offered",
                user_impact="Users question 'What's in it for me?'",
                estimated_drop_off=15
            ))
        
        # Check: Lack of social proof
        if not persuasion.get('social_proof_placements'):
            friction_points.append(FrictionPoint(
                location="Trust signals",
                friction_type="Lack of credibility",
                severity="medium",
                description="No social proof or testimonials",
                user_impact="Users hesitant to trust",
                estimated_drop_off=10
            ))
        
        # Check: Question complexity
        for i, q in enumerate(questions, 1):
            options = q.get('options', [])
            if len(options) > 6:
                friction_points.append(FrictionPoint(
                    location=f"Question {i}",
                    friction_type="Choice overload",
                    severity="medium",
                    description=f"Question has {len(options)} options (optimal: 3-5)",
                    user_impact="Decision paralysis",
                    estimated_drop_off=5
                ))
        
        return friction_points
    
    def _calculate_optimization_score(
        self,
        request: OptimizationRequest,
        friction_points: List[FrictionPoint]
    ) -> OptimizationScore:
        """Calculate overall optimization score"""
        
        # Friction score (inverse of friction - fewer points = higher score)
        friction_severity_map = {'low': 5, 'medium': 10, 'high': 20, 'critical': 30}
        total_friction = sum(
            friction_severity_map.get(fp.severity, 10) 
            for fp in friction_points
        )
        friction_score = max(100 - total_friction, 0)
        
        # Psychological score
        funnel = request.funnel_data
        persuasion = funnel.get('persuasion_elements', {})
        
        psych_score = 50  # Base
        if persuasion.get('social_proof_placements'):
            psych_score += 15
        if persuasion.get('reciprocity_offers'):
            psych_score += 15
        if persuasion.get('authority_signals'):
            psych_score += 10
        if persuasion.get('scarcity_triggers'):
            psych_score += 10
        
        psychological_score = min(psych_score, 100)
        
        # Copy score
        questions = funnel.get('questions', [])
        copy_score = 70  # Base
        
        # Check for clear questions
        for q in questions:
            text = q.get('question_text', '')
            if len(text) < 10:
                copy_score -= 5
            elif len(text) > 100:
                copy_score -= 3
        
        copy_score = max(min(copy_score, 100), 0)
        
        # Design score
        design = funnel.get('design_suggestions', {})
        design_score = 50  # Base
        
        if design.get('progress_bar'):
            design_score += 15
        if design.get('visual_elements'):
            design_score += 10
        if design.get('mobile_optimization', {}).get('thumb_friendly_spacing'):
            design_score += 15
        if design.get('layout', {}).get('card_style'):
            design_score += 10
        
        design_score = min(design_score, 100)
        
        # Technical score (assume good if not specified)
        technical_score = 85.0
        
        # Overall score (weighted average)
        overall = (
            friction_score * 0.30 +
            psychological_score * 0.25 +
            copy_score * 0.20 +
            design_score * 0.15 +
            technical_score * 0.10
        )
        
        # Determine grade
        if overall >= 95:
            grade = "A+"
        elif overall >= 90:
            grade = "A"
        elif overall >= 85:
            grade = "B+"
        elif overall >= 80:
            grade = "B"
        elif overall >= 75:
            grade = "C+"
        elif overall >= 70:
            grade = "C"
        elif overall >= 60:
            grade = "D"
        else:
            grade = "F"
        
        return OptimizationScore(
            overall_score=overall,
            friction_score=friction_score,
            psychological_score=psychological_score,
            copy_score=copy_score,
            design_score=design_score,
            technical_score=technical_score,
            grade=grade
        )
    
    async def _generate_recommendations_ai(
        self,
        request: OptimizationRequest,
        friction_points: List[FrictionPoint],
        score: OptimizationScore
    ) -> List[OptimizationRecommendation]:
        """Generate recommendations using AI"""
        try:
            # Get prompt template
            prompt_template = get_prompt("conversion_optimizer", PromptVersion.LATEST)
            
            # Prepare variables
            template_vars = {
                'funnel_data': json.dumps(request.funnel_data, indent=2),
                'target_audience': request.target_audience,
                'funnel_goal': request.funnel_goal,
                'friction_points': json.dumps([
                    {
                        'location': fp.location,
                        'type': fp.friction_type,
                        'severity': fp.severity,
                        'description': fp.description
                    }
                    for fp in friction_points
                ], indent=2),
                'optimization_score': score.overall_score
            }
            
            # Render prompt
            messages = prompt_template.render(**template_vars)
            
            # Call OpenAI
            response = await self.openai_client.create_json_completion(
                messages=messages,
                model=OpenAIModel.GPT_4_TURBO,
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse recommendations
            recommendations = []
            for i, rec_data in enumerate(response.get('recommendations', []), 1):
                recommendations.append(OptimizationRecommendation(
                    recommendation_id=f"opt_{i}",
                    title=rec_data.get('title', ''),
                    optimization_type=OptimizationType(rec_data.get('type', 'copy_messaging')),
                    priority=OptimizationPriority(rec_data.get('priority', 'medium')),
                    current_state=rec_data.get('current_state', ''),
                    proposed_change=rec_data.get('proposed_change', ''),
                    reasoning=rec_data.get('reasoning', ''),
                    expected_impact=ImpactLevel(rec_data.get('impact', 'moderate')),
                    estimated_cr_lift=float(rec_data.get('cr_lift', 5.0)),
                    estimated_revenue_impact=rec_data.get('revenue_impact'),
                    confidence=float(rec_data.get('confidence', 0.7)),
                    implementation_effort=rec_data.get('effort', 'medium'),
                    implementation_notes=rec_data.get('implementation_notes', ''),
                    requires_testing=rec_data.get('requires_testing', True),
                    psychological_principle=rec_data.get('psychological_principle'),
                    target_emotion=rec_data.get('target_emotion')
                ))
            
            return recommendations
            
        except Exception as e:
            logger.error(f"❌ AI recommendation generation error: {e}")
            raise
    
    def _generate_recommendations_rules(
        self,
        request: OptimizationRequest,
        friction_points: List[FrictionPoint],
        score: OptimizationScore
    ) -> List[OptimizationRecommendation]:
        """Generate recommendations using rules"""
        recommendations = []
        rec_id = 1
        
        # Address each friction point
        for fp in friction_points:
            if fp.friction_type == "Length fatigue":
                recommendations.append(OptimizationRecommendation(
                    recommendation_id=f"opt_{rec_id}",
                    title="Reduce number of questions",
                    optimization_type=OptimizationType.FRICTION_REDUCTION,
                    priority=OptimizationPriority.CRITICAL,
                    current_state=f"Funnel has {len(request.funnel_data.get('questions', []))} questions",
                    proposed_change="Reduce to 4-6 essential questions only",
                    reasoning="Each question adds friction. Fewer questions = higher completion",
                    expected_impact=ImpactLevel.HIGH,
                    estimated_cr_lift=8.0,
                    estimated_revenue_impact=None,
                    confidence=0.85,
                    implementation_effort="medium",
                    implementation_notes="Identify and remove non-essential questions",
                    requires_testing=True,
                    psychological_principle="commitment",
                    target_emotion="Relief"
                ))
                rec_id += 1
            
            elif fp.friction_type == "High-friction start":
                recommendations.append(OptimizationRecommendation(
                    recommendation_id=f"opt_{rec_id}",
                    title="Start with easy, engaging question",
                    optimization_type=OptimizationType.FRICTION_REDUCTION,
                    priority=OptimizationPriority.CRITICAL,
                    current_state="First question is text input",
                    proposed_change="Start with multiple choice or yes/no question",
                    reasoning="Easy first question builds momentum and commitment",
                    expected_impact=ImpactLevel.GAME_CHANGER,
                    estimated_cr_lift=15.0,
                    estimated_revenue_impact=None,
                    confidence=0.90,
                    implementation_effort="low",
                    implementation_notes="Reorder questions - move text inputs to end",
                    requires_testing=False,
                    psychological_principle="commitment",
                    target_emotion="Confidence"
                ))
                rec_id += 1
            
            elif fp.friction_type == "Cognitive overload":
                recommendations.append(OptimizationRecommendation(
                    recommendation_id=f"opt_{rec_id}",
                    title="Reduce text input fields",
                    optimization_type=OptimizationType.FRICTION_REDUCTION,
                    priority=OptimizationPriority.HIGH,
                    current_state="Multiple text input fields required",
                    proposed_change="Convert to multiple choice where possible, limit to 1-2 text inputs",
                    reasoning="Text input requires more cognitive effort than clicking",
                    expected_impact=ImpactLevel.HIGH,
                    estimated_cr_lift=10.0,
                    estimated_revenue_impact=None,
                    confidence=0.80,
                    implementation_effort="medium",
                    implementation_notes="Use dropdown or multiple choice instead of open text",
                    requires_testing=True
                ))
                rec_id += 1
            
            elif fp.friction_type == "Lack of progress visibility":
                recommendations.append(OptimizationRecommendation(
                    recommendation_id=f"opt_{rec_id}",
                    title="Add progress indicator",
                    optimization_type=OptimizationType.DESIGN_UX,
                    priority=OptimizationPriority.HIGH,
                    current_state="No progress bar or step indicator",
                    proposed_change="Add visual progress bar showing % complete or 'Step X of Y'",
                    reasoning="Progress visibility reduces uncertainty and abandonment",
                    expected_impact=ImpactLevel.MODERATE,
                    estimated_cr_lift=7.0,
                    estimated_revenue_impact=None,
                    confidence=0.85,
                    implementation_effort="low",
                    implementation_notes="Simple progress bar at top of funnel",
                    requires_testing=False,
                    psychological_principle="commitment",
                    target_emotion="Progress"
                ))
                rec_id += 1
            
            elif fp.friction_type == "Unclear benefit":
                recommendations.append(OptimizationRecommendation(
                    recommendation_id=f"opt_{rec_id}",
                    title="Add clear value proposition",
                    optimization_type=OptimizationType.PSYCHOLOGICAL,
                    priority=OptimizationPriority.CRITICAL,
                    current_state="No clear incentive or benefit stated",
                    proposed_change="Add prominent 'Get your free [valuable thing]' offer",
                    reasoning="Reciprocity principle - people give info when receiving value",
                    expected_impact=ImpactLevel.HIGH,
                    estimated_cr_lift=12.0,
                    estimated_revenue_impact=None,
                    confidence=0.90,
                    implementation_effort="low",
                    implementation_notes="Add value prop at top and before email capture",
                    requires_testing=True,
                    psychological_principle="reciprocity",
                    target_emotion="Desire"
                ))
                rec_id += 1
            
            elif fp.friction_type == "Lack of credibility":
                recommendations.append(OptimizationRecommendation(
                    recommendation_id=f"opt_{rec_id}",
                    title="Add social proof",
                    optimization_type=OptimizationType.PSYCHOLOGICAL,
                    priority=OptimizationPriority.HIGH,
                    current_state="No testimonials or social proof",
                    proposed_change="Add 'Join 10,000+ [target audience]' or customer testimonial",
                    reasoning="Social proof builds trust and reduces hesitation",
                    expected_impact=ImpactLevel.MODERATE,
                    estimated_cr_lift=8.0,
                    estimated_revenue_impact=None,
                    confidence=0.80,
                    implementation_effort="low",
                    implementation_notes="Add social proof callout below headline",
                    requires_testing=True,
                    psychological_principle="social_proof",
                    target_emotion="Trust"
                ))
                rec_id += 1
        
        # Add general best practices if score is low
        if score.copy_score < 70:
            recommendations.append(OptimizationRecommendation(
                recommendation_id=f"opt_{rec_id}",
                title="Improve question clarity",
                optimization_type=OptimizationType.COPY_MESSAGING,
                priority=OptimizationPriority.MEDIUM,
                current_state="Some questions unclear or too long",
                proposed_change="Rewrite questions to be clear, concise, and conversational",
                reasoning="Clear questions reduce confusion and speed up completion",
                expected_impact=ImpactLevel.MODERATE,
                estimated_cr_lift=5.0,
                estimated_revenue_impact=None,
                confidence=0.75,
                implementation_effort="low",
                implementation_notes="Max 15 words per question, use 'you' language",
                requires_testing=True
            ))
            rec_id += 1
        
        if score.design_score < 70:
            recommendations.append(OptimizationRecommendation(
                recommendation_id=f"opt_{rec_id}",
                title="Improve visual design",
                optimization_type=OptimizationType.DESIGN_UX,
                priority=OptimizationPriority.MEDIUM,
                current_state="Basic design without visual hierarchy",
                proposed_change="Add icons, better spacing, card-style layout",
                reasoning="Visual appeal increases engagement and trust",
                expected_impact=ImpactLevel.INCREMENTAL,
                estimated_cr_lift=4.0,
                estimated_revenue_impact=None,
                confidence=0.70,
                implementation_effort="medium",
                implementation_notes="Use icons for options, add white space, use color strategically",
                requires_testing=True
            ))
            rec_id += 1
        
        return recommendations
    
    def _estimate_current_cr(self, request: OptimizationRequest) -> float:
        """Estimate current conversion rate if not provided"""
        # Simple estimation based on question count and friction
        questions = request.funnel_data.get('questions', [])
        num_questions = len(questions)
        
        # Base rate by question count
        base_rates = {
            3: 75, 4: 72, 5: 68, 6: 65, 7: 62, 8: 58, 9: 54, 10: 50
        }
        base_rate = base_rates.get(min(num_questions, 10), 50)
        
        # Adjust for text inputs
        text_inputs = sum(1 for q in questions if q.get('question_type') == 'text')
        base_rate *= (0.93 ** text_inputs)
        
        # Adjust for progress bar
        if request.funnel_data.get('design_suggestions', {}).get('progress_bar'):
            base_rate *= 1.08
        
        return round(base_rate, 1)
    
    def _generate_insights(
        self,
        friction_points: List[FrictionPoint],
        recommendations: List[OptimizationRecommendation],
        score: OptimizationScore
    ) -> List[str]:
        """Generate key insights"""
        insights = []
        
        insights.append(
            f"Current optimization grade: {score.grade} ({score.overall_score:.0f}/100)"
        )
        
        if friction_points:
            critical = [fp for fp in friction_points if fp.severity == "critical"]
            if critical:
                insights.append(
                    f"Found {len(critical)} critical friction point(s) requiring immediate attention"
                )
        
        high_priority = [r for r in recommendations if r.priority == OptimizationPriority.CRITICAL]
        if high_priority:
            insights.append(
                f"{len(high_priority)} critical optimization(s) identified with potential {sum(r.estimated_cr_lift for r in high_priority):.1f}% lift"
            )
        
        if score.friction_score < 70:
            insights.append(
                "High friction detected - focus on reducing abandonment points"
            )
        
        if score.psychological_score < 70:
            insights.append(
                "Low psychological optimization - add persuasion triggers"
            )
        
        return insights
    
    def _generate_summary(
        self,
        score: OptimizationScore,
        friction_count: int,
        potential_lift: float,
        request: OptimizationRequest
    ) -> str:
        """Generate optimization summary"""
        
        if score.overall_score >= 85:
            assessment = "performs well"
            focus = "fine-tuning and testing variations"
        elif score.overall_score >= 70:
            assessment = "has good foundations but room for improvement"
            focus = "addressing key friction points and adding psychological triggers"
        else:
            assessment = "needs significant optimization"
            focus = "reducing friction and improving user experience"
        
        summary = (
            f"This funnel currently {assessment} with an optimization score of "
            f"{score.grade} ({score.overall_score:.0f}/100). "
            f"Analysis identified {friction_count} friction point(s). "
            f"By implementing the recommended optimizations, you could potentially achieve "
            f"a +{potential_lift:.1f}% improvement in conversion rate. "
            f"Priority focus areas: {focus}."
        )
        
        return summary
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get optimizer metrics"""
        ai_rate = self.ai_optimizations / max(self.total_optimizations, 1)
        
        return {
            'total_optimizations': self.total_optimizations,
            'ai_optimizations': self.ai_optimizations,
            'rule_based_optimizations': self.rule_based_optimizations,
            'ai_usage_rate': round(ai_rate, 3)
        }


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

async def optimize_funnel_quick(
    funnel_data: Dict[str, Any],
    target_audience: str = "Business professionals",
    goal: str = "Generate leads"
) -> Dict[str, Any]:
    """Quick funnel optimization"""
    optimizer = ConversionOptimizer(use_ai=False)
    
    request = OptimizationRequest(
        funnel_data=funnel_data,
        target_audience=target_audience,
        funnel_goal=goal
    )
    
    return await optimizer.optimize_funnel(request)


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'ConversionOptimizer',
    'OptimizationRequest',
    'OptimizationResponse',
    'OptimizationRecommendation',
    'FrictionPoint',
    'OptimizationScore',
    'OptimizationPriority',
    'optimize_funnel_quick'
]
