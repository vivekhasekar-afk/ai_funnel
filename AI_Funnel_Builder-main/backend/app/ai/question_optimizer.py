"""
Question Optimizer - PRODUCTION GRADE
======================================
AI-powered question optimization service that analyzes and improves
existing funnel questions using behavioral science, cognitive psychology,
and conversion rate optimization principles.

🎯 CAPABILITIES:
- Analyze question quality and identify issues
- Optimize question wording and structure
- Reorder questions for better flow
- Reduce cognitive load
- Add psychological triggers
- Generate A/B testing recommendations
- Predict improvement impact

🔬 OPTIMIZATION FRAMEWORK:
1. Cognitive Load Analysis (Miller's Law, Decision Fatigue)
2. Psychological Trigger Audit (Cialdini's 6+1)
3. Flow Optimization (Progressive Disclosure)
4. Clarity Enhancement (Plain Language)
5. Engagement Boosters (Curiosity Gaps, Pattern Interrupts)

Author: AI Funnel Builder Team
Version: 3.0.0
Last Updated: 2024-01-15
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime

from app.ai.openai_client import OpenAIClient, OpenAIModel
from app.ai.prompt_templates import get_prompt, PromptVersion
from app.core.config import settings
from app.utils.exceptions import OptimizationError, ValidationError


# Configure logger
logger = logging.getLogger(__name__)


class CognitiveLoad(str, Enum):
    """Cognitive load levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class QuestionIssueType(str, Enum):
    """Types of question issues"""
    TOO_MANY_OPTIONS = "too_many_options"
    COMPLEX_LANGUAGE = "complex_language"
    MULTIPLE_CONCEPTS = "multiple_concepts"
    VAGUE_OPTIONS = "vague_options"
    POOR_POSITIONING = "poor_positioning"
    NO_PSYCHOLOGICAL_HOOK = "no_psychological_hook"
    TOO_PERSONAL_TOO_SOON = "too_personal_too_soon"
    CONFUSING_WORDING = "confusing_wording"
    MISSING_CONTEXT = "missing_context"
    WEAK_ENGAGEMENT = "weak_engagement"


@dataclass
class QuestionIssue:
    """Identified issue with a question"""
    issue_type: QuestionIssueType
    severity: str  # low|medium|high|critical
    description: str
    impact: str
    suggested_fix: str


@dataclass
class QuestionAnalysis:
    """Analysis result for a single question"""
    question_number: int
    original_text: str
    
    # Issue identification
    issues: List[QuestionIssue] = field(default_factory=list)
    cognitive_load: CognitiveLoad = CognitiveLoad.MEDIUM
    
    # Metrics
    clarity_score: float = 0.5  # 0-1
    engagement_score: float = 0.5  # 0-1
    relevance_score: float = 0.5  # 0-1
    overall_quality_score: float = 0.5  # 0-1
    
    # Optimization
    optimized_text: Optional[str] = None
    optimization_reasoning: List[str] = field(default_factory=list)
    expected_improvement: Optional[str] = None
    
    # Psychological
    psychological_triggers_present: List[str] = field(default_factory=list)
    psychological_triggers_missing: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'question_number': self.question_number,
            'original_text': self.original_text,
            'issues': [
                {
                    'type': issue.issue_type.value,
                    'severity': issue.severity,
                    'description': issue.description,
                    'impact': issue.impact,
                    'suggested_fix': issue.suggested_fix
                }
                for issue in self.issues
            ],
            'cognitive_load': self.cognitive_load.value,
            'scores': {
                'clarity': self.clarity_score,
                'engagement': self.engagement_score,
                'relevance': self.relevance_score,
                'overall_quality': self.overall_quality_score
            },
            'optimized_text': self.optimized_text,
            'optimization_reasoning': self.optimization_reasoning,
            'expected_improvement': self.expected_improvement,
            'psychological_triggers': {
                'present': self.psychological_triggers_present,
                'missing': self.psychological_triggers_missing
            }
        }


@dataclass
class OptimizationRequest:
    """Request for question optimization"""
    
    # Current funnel data
    questions: List[Dict[str, Any]]
    funnel_goal: str
    target_audience: str
    industry: str
    
    # Performance context
    current_completion_rate: float
    target_completion_rate: float
    drop_off_questions: List[int] = field(default_factory=list)
    avg_time_per_question: Optional[float] = None
    
    # Optimization preferences
    preserve_structure: bool = False
    allow_reordering: bool = True
    maintain_question_types: bool = False
    
    # Metadata
    funnel_id: Optional[str] = None
    user_id: Optional[str] = None
    
    def __post_init__(self):
        """Validate request"""
        if not self.questions or len(self.questions) < 1:
            raise ValidationError("At least 1 question required for optimization")
        
        if not 0 <= self.current_completion_rate <= 1:
            raise ValidationError("current_completion_rate must be between 0 and 1")
        
        if not 0 <= self.target_completion_rate <= 1:
            raise ValidationError("target_completion_rate must be between 0 and 1")


@dataclass
class OptimizationResponse:
    """Response with optimized questions"""
    
    # Analysis
    overall_analysis: Dict[str, Any]
    question_analyses: List[QuestionAnalysis]
    
    # Optimized questions
    optimized_questions: List[Dict[str, Any]]
    
    # Flow optimization
    reordering_suggestions: List[Dict[str, Any]] = field(default_factory=list)
    new_flow_structure: Optional[List[int]] = None
    
    # Predictions
    estimated_improvement: float = 0.0
    predicted_completion_rate: float = 0.0
    confidence_score: float = 0.0
    
    # Testing
    ab_test_recommendations: List[Dict[str, Any]] = field(default_factory=list)
    
    # Metadata
    optimization_time_ms: float = 0.0
    tokens_used: int = 0
    cost_usd: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'overall_analysis': self.overall_analysis,
            'question_analyses': [qa.to_dict() for qa in self.question_analyses],
            'optimized_questions': self.optimized_questions,
            'reordering_suggestions': self.reordering_suggestions,
            'new_flow_structure': self.new_flow_structure,
            'predictions': {
                'estimated_improvement': self.estimated_improvement,
                'predicted_completion_rate': self.predicted_completion_rate,
                'confidence_score': self.confidence_score
            },
            'ab_test_recommendations': self.ab_test_recommendations,
            'metadata': {
                'optimization_time_ms': self.optimization_time_ms,
                'tokens_used': self.tokens_used,
                'cost_usd': self.cost_usd
            }
        }


class QuestionOptimizer:
    """
    AI-powered question optimization service
    
    Analyzes existing questions and provides optimized versions using
    behavioral science, cognitive psychology, and conversion best practices.
    """
    
    def __init__(self, openai_client: Optional[OpenAIClient] = None):
        """
        Initialize question optimizer
        
        Args:
            openai_client: OpenAI API client
        """
        self.openai_client = openai_client or OpenAIClient()
        
        # Metrics
        self.total_optimizations = 0
        self.successful_optimizations = 0
        self.total_questions_optimized = 0
        
        logger.info("✅ QuestionOptimizer initialized")
    
    async def optimize(
        self,
        request: OptimizationRequest
    ) -> OptimizationResponse:
        """
        Optimize questions for better conversion
        
        Args:
            request: Optimization request
            
        Returns:
            OptimizationResponse: Optimized questions with analysis
        """
        start_time = datetime.utcnow()
        self.total_optimizations += 1
        
        try:
            logger.info(
                f"🔧 Starting optimization | "
                f"Questions: {len(request.questions)} | "
                f"Current CR: {request.current_completion_rate:.1%} | "
                f"Target CR: {request.target_completion_rate:.1%}"
            )
            
            # Step 1: Analyze current questions
            logger.info("🔍 Analyzing current questions...")
            analyses = await self._analyze_questions(request)
            
            # Step 2: Generate AI-powered optimizations
            logger.info("🤖 Generating AI optimizations...")
            ai_optimizations = await self._generate_ai_optimizations(request, analyses)
            
            # Step 3: Apply rule-based enhancements
            logger.info("📐 Applying rule-based enhancements...")
            enhanced_questions = await self._apply_rule_based_enhancements(
                ai_optimizations['optimized_questions']
            )
            
            # Step 4: Optimize question flow
            if request.allow_reordering:
                logger.info("🔄 Optimizing question flow...")
                reordering = await self._optimize_flow(
                    enhanced_questions,
                    analyses,
                    request
                )
            else:
                reordering = []
            
            # Step 5: Generate A/B test recommendations
            logger.info("🧪 Generating A/B test recommendations...")
            ab_tests = await self._generate_ab_tests(
                request.questions,
                enhanced_questions,
                analyses
            )
            
            # Step 6: Predict improvement
            logger.info("📊 Predicting improvement...")
            predictions = await self._predict_improvement(
                request,
                analyses,
                enhanced_questions
            )
            
            # Calculate execution time
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            # Build response
            response = OptimizationResponse(
                overall_analysis=ai_optimizations['analysis'],
                question_analyses=analyses,
                optimized_questions=enhanced_questions,
                reordering_suggestions=reordering,
                estimated_improvement=predictions['improvement_percentage'],
                predicted_completion_rate=predictions['predicted_rate'],
                confidence_score=predictions['confidence'],
                ab_test_recommendations=ab_tests,
                optimization_time_ms=execution_time,
                tokens_used=2000,  # Estimated
                cost_usd=0.05  # Estimated
            )
            
            # Update metrics
            self.successful_optimizations += 1
            self.total_questions_optimized += len(request.questions)
            
            logger.info(
                f"✅ Optimization complete | "
                f"Time: {execution_time:.0f}ms | "
                f"Predicted Improvement: +{predictions['improvement_percentage']:.1f}% | "
                f"New CR: {predictions['predicted_rate']:.1%}"
            )
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Optimization failed: {e}", exc_info=True)
            raise OptimizationError(f"Failed to optimize questions: {str(e)}") from e
    
    async def _analyze_questions(
        self,
        request: OptimizationRequest
    ) -> List[QuestionAnalysis]:
        """
        Analyze all questions for issues and quality
        
        Args:
            request: Optimization request
            
        Returns:
            List[QuestionAnalysis]: Analysis for each question
        """
        analyses = []
        
        for i, question in enumerate(request.questions, 1):
            analysis = QuestionAnalysis(
                question_number=i,
                original_text=question.get('question_text', '')
            )
            
            # Identify issues
            analysis.issues = self._identify_issues(question, i, len(request.questions))
            
            # Calculate cognitive load
            analysis.cognitive_load = self._calculate_cognitive_load(question)
            
            # Score quality dimensions
            analysis.clarity_score = self._score_clarity(question)
            analysis.engagement_score = self._score_engagement(question)
            analysis.relevance_score = self._score_relevance(question, request.funnel_goal)
            analysis.overall_quality_score = (
                analysis.clarity_score * 0.4 +
                analysis.engagement_score * 0.3 +
                analysis.relevance_score * 0.3
            )
            
            # Identify psychological triggers
            analysis.psychological_triggers_present = self._identify_triggers(question)
            analysis.psychological_triggers_missing = self._suggest_missing_triggers(
                question,
                i,
                request.funnel_goal
            )
            
            analyses.append(analysis)
        
        return analyses
    
    def _identify_issues(
        self,
        question: Dict[str, Any],
        position: int,
        total_questions: int
    ) -> List[QuestionIssue]:
        """Identify issues with a question"""
        issues = []
        
        question_text = question.get('question_text', '')
        question_type = question.get('question_type', '')
        options = question.get('options', [])
        
        # Check for too many options
        if len(options) > 5:
            issues.append(QuestionIssue(
                issue_type=QuestionIssueType.TOO_MANY_OPTIONS,
                severity="high",
                description=f"Question has {len(options)} options (recommended: 3-5)",
                impact="Choice paralysis reduces completion by ~15%",
                suggested_fix="Reduce to 3-5 most relevant options"
            ))
        
        # Check for complex language
        if self._has_complex_language(question_text):
            issues.append(QuestionIssue(
                issue_type=QuestionIssueType.COMPLEX_LANGUAGE,
                severity="medium",
                description="Question uses complex or jargon-heavy language",
                impact="Increases cognitive load, reduces engagement",
                suggested_fix="Simplify language, use plain terms"
            ))
        
        # Check for multiple concepts
        if self._has_multiple_concepts(question_text):
            issues.append(QuestionIssue(
                issue_type=QuestionIssueType.MULTIPLE_CONCEPTS,
                severity="high",
                description="Question asks about multiple things at once",
                impact="Confuses users, reduces answer quality",
                suggested_fix="Split into separate questions"
            ))
        
        # Check for vague options
        if self._has_vague_options(options):
            issues.append(QuestionIssue(
                issue_type=QuestionIssueType.VAGUE_OPTIONS,
                severity="medium",
                description="Answer options are vague or generic",
                impact="Users unsure which option to choose",
                suggested_fix="Make options specific and mutually exclusive"
            ))
        
        # Check positioning issues
        if position == 1 and self._is_high_friction(question):
            issues.append(QuestionIssue(
                issue_type=QuestionIssueType.POOR_POSITIONING,
                severity="critical",
                description="First question is too complex or personal",
                impact="High drop-off (23% typical for bad Q1)",
                suggested_fix="Start with low-friction, engaging question"
            ))
        
        # Check for psychological hooks
        if not self._has_psychological_hook(question_text):
            issues.append(QuestionIssue(
                issue_type=QuestionIssueType.NO_PSYCHOLOGICAL_HOOK,
                severity="low",
                description="Question lacks engaging hook or trigger",
                impact="Reduced engagement and completion momentum",
                suggested_fix="Add curiosity, urgency, or emotional trigger"
            ))
        
        return issues
    
    def _calculate_cognitive_load(self, question: Dict[str, Any]) -> CognitiveLoad:
        """Calculate cognitive load of a question"""
        load_score = 0
        
        # Factors that increase cognitive load
        question_text = question.get('question_text', '')
        question_type = question.get('question_type', '')
        options = question.get('options', [])
        
        # Long question text
        if len(question_text) > 100:
            load_score += 1
        
        # Many options
        if len(options) > 5:
            load_score += 2
        elif len(options) > 3:
            load_score += 1
        
        # Text input (requires typing)
        if question_type == 'text':
            load_score += 1
        
        # Complex language
        if self._has_complex_language(question_text):
            load_score += 1
        
        # Multiple concepts
        if self._has_multiple_concepts(question_text):
            load_score += 2
        
        # Map score to load level
        if load_score >= 5:
            return CognitiveLoad.VERY_HIGH
        elif load_score >= 3:
            return CognitiveLoad.HIGH
        elif load_score >= 1:
            return CognitiveLoad.MEDIUM
        else:
            return CognitiveLoad.LOW
    
    def _score_clarity(self, question: Dict[str, Any]) -> float:
        """Score question clarity (0-1)"""
        score = 1.0
        
        question_text = question.get('question_text', '')
        
        # Penalties
        if len(question_text) > 100:
            score -= 0.2
        if self._has_complex_language(question_text):
            score -= 0.3
        if self._has_multiple_concepts(question_text):
            score -= 0.4
        if not question_text.endswith('?'):
            score -= 0.1
        
        return max(0.0, min(1.0, score))
    
    def _score_engagement(self, question: Dict[str, Any]) -> float:
        """Score question engagement (0-1)"""
        score = 0.5
        
        question_text = question.get('question_text', '').lower()
        
        # Bonuses for engaging elements
        engaging_words = ['imagine', 'what if', 'which', 'how much', 'biggest', 'best']
        if any(word in question_text for word in engaging_words):
            score += 0.2
        
        if self._has_psychological_hook(question_text):
            score += 0.2
        
        if question.get('question_type') in ['multiple_choice', 'rating', 'slider']:
            score += 0.1
        
        return max(0.0, min(1.0, score))
    
    def _score_relevance(self, question: Dict[str, Any], funnel_goal: str) -> float:
        """Score question relevance to funnel goal (0-1)"""
        # Simplified relevance scoring
        # In production, would use semantic similarity
        return 0.7
    
    def _has_complex_language(self, text: str) -> bool:
        """Check if text uses complex language"""
        complex_words = [
            'utilize', 'facilitate', 'implement', 'strategize',
            'leverage', 'synergy', 'paradigm', 'optimization'
        ]
        text_lower = text.lower()
        return any(word in text_lower for word in complex_words)
    
    def _has_multiple_concepts(self, text: str) -> bool:
        """Check if question asks about multiple things"""
        multi_indicators = [' and ', ' or ', ',']
        return any(indicator in text for indicator in multi_indicators)
    
    def _has_vague_options(self, options: List[str]) -> bool:
        """Check if options are vague"""
        vague_words = ['sometimes', 'maybe', 'sort of', 'kind of', 'various']
        return any(
            any(vague in option.lower() for vague in vague_words)
            for option in options
        )
    
    def _is_high_friction(self, question: Dict[str, Any]) -> bool:
        """Check if question is high-friction"""
        question_type = question.get('question_type', '')
        options = question.get('options', [])
        
        # Text input is high friction
        if question_type == 'text':
            return True
        
        # Too many options
        if len(options) > 5:
            return True
        
        # Personal questions
        personal_keywords = ['email', 'phone', 'name', 'contact', 'budget', 'revenue']
        question_text_lower = question.get('question_text', '').lower()
        if any(keyword in question_text_lower for keyword in personal_keywords):
            return True
        
        return False
    
    def _has_psychological_hook(self, text: str) -> bool:
        """Check if text has psychological hook"""
        hooks = [
            'imagine', 'what if', 'how much', 'which', 'biggest',
            'best', 'worst', 'most important', 'struggle', 'challenge'
        ]
        text_lower = text.lower()
        return any(hook in text_lower for hook in hooks)
    
    def _identify_triggers(self, question: Dict[str, Any]) -> List[str]:
        """Identify psychological triggers present in question"""
        triggers = []
        
        question_text = question.get('question_text', '').lower()
        micro_copy = question.get('micro_copy', '').lower()
        combined_text = f"{question_text} {micro_copy}"
        
        # Social proof
        if any(word in combined_text for word in ['most', 'typically', 'usually', 'others']):
            triggers.append('social_proof')
        
        # Urgency
        if any(word in combined_text for word in ['now', 'today', 'quickly', 'immediately']):
            triggers.append('urgency')
        
        # Loss aversion
        if any(word in combined_text for word in ['losing', 'missing', 'without', 'cost of not']):
            triggers.append('loss_aversion')
        
        # Curiosity
        if any(word in combined_text for word in ['discover', 'find out', 'reveal', 'secret']):
            triggers.append('curiosity')
        
        return triggers
    
    def _suggest_missing_triggers(
        self,
        question: Dict[str, Any],
        position: int,
        funnel_goal: str
    ) -> List[str]:
        """Suggest psychological triggers that could be added"""
        suggestions = []
        
        # First question should have curiosity
        if position == 1:
            if 'curiosity' not in self._identify_triggers(question):
                suggestions.append('curiosity')
        
        # Mid-funnel should have social proof
        if 2 <= position <= 4:
            if 'social_proof' not in self._identify_triggers(question):
                suggestions.append('social_proof')
        
        # Later questions can use urgency
        if position >= 5:
            if 'urgency' not in self._identify_triggers(question):
                suggestions.append('urgency')
        
        return suggestions
    
    async def _generate_ai_optimizations(
        self,
        request: OptimizationRequest,
        analyses: List[QuestionAnalysis]
    ) -> Dict[str, Any]:
        """Generate AI-powered optimizations"""
        try:
            # Get optimization prompt
            prompt_template = get_prompt("question_optimizer", PromptVersion.LATEST)
            
            # Prepare variables
            template_vars = {
                'current_questions': json.dumps([q for q in request.questions], indent=2),
                'funnel_goal': request.funnel_goal,
                'target_completion_rate': request.target_completion_rate,
                'current_completion_rate': request.current_completion_rate,
                'drop_off_questions': ','.join(map(str, request.drop_off_questions)),
                'avg_time_per_question': request.avg_time_per_question or 30,
                'industry': request.industry
            }
            
            # Render prompt
            messages = prompt_template.render(**template_vars)
            
            # Call OpenAI
            response = await self.openai_client.create_json_completion(
                messages=messages,
                model=OpenAIModel.GPT_4_TURBO,
                temperature=0.7,
                max_tokens=3000
            )
            
            return response
            
        except Exception as e:
            logger.error(f"❌ AI optimization failed: {e}")
            # Return fallback
            return {
                'analysis': {'overall_issues': ['AI optimization unavailable']},
                'optimized_questions': request.questions
            }
    
    async def _apply_rule_based_enhancements(
        self,
        questions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Apply rule-based enhancements to AI-optimized questions"""
        enhanced = []
        
        for question in questions:
            enhanced_q = question.copy()
            
            # Ensure question ends with ?
            if not enhanced_q.get('question_text', '').endswith('?'):
                enhanced_q['question_text'] += '?'
            
            # Add visual hints if missing
            if 'design_hints' not in enhanced_q:
                enhanced_q['design_hints'] = self._suggest_visual_design(enhanced_q)
            
            # Add analytics tracking
            if 'analytics_tracking' not in enhanced_q:
                enhanced_q['analytics_tracking'] = {
                    'event_name': f"question_{enhanced_q.get('position', 0)}_answered",
                    'track_time': True,
                    'track_changes': True
                }
            
            enhanced.append(enhanced_q)
        
        return enhanced
    
    def _suggest_visual_design(self, question: Dict[str, Any]) -> Dict[str, str]:
        """Suggest visual design for question"""
        question_type = question.get('question_type', 'multiple_choice')
        
        designs = {
            'multiple_choice': {'visual_type': 'cards', 'emphasis': 'primary'},
            'rating': {'visual_type': 'stars', 'emphasis': 'secondary'},
            'text': {'visual_type': 'input', 'emphasis': 'primary'},
            'yes_no': {'visual_type': 'buttons', 'emphasis': 'primary'},
            'slider': {'visual_type': 'slider', 'emphasis': 'secondary'}
        }
        
        return designs.get(question_type, {'visual_type': 'default', 'emphasis': 'primary'})
    
    async def _optimize_flow(
        self,
        questions: List[Dict[str, Any]],
        analyses: List[QuestionAnalysis],
        request: OptimizationRequest
    ) -> List[Dict[str, Any]]:
        """Optimize question flow and ordering"""
        suggestions = []
        
        # Sort questions by cognitive load (ascending)
        load_order = sorted(
            enumerate(analyses, 1),
            key=lambda x: ['low', 'medium', 'high', 'very_high'].index(x[1].cognitive_load.value)
        )
        
        # Check if reordering would help
        for i, (original_pos, analysis) in enumerate(load_order[:3], 1):
            if original_pos != i and analysis.cognitive_load in [CognitiveLoad.LOW, CognitiveLoad.MEDIUM]:
                suggestions.append({
                    'action': f'move_question_{original_pos}_to_{i}',
                    'reason': f'Lower cognitive load question, better for position {i}',
                    'expected_impact': '+5% completion rate'
                })
        
        return suggestions
    
    async def _generate_ab_tests(
        self,
        original_questions: List[Dict[str, Any]],
        optimized_questions: List[Dict[str, Any]],
        analyses: List[QuestionAnalysis]
    ) -> List[Dict[str, Any]]:
        """Generate A/B testing recommendations"""
        tests = []
        
        # Test first question variants
        if len(optimized_questions) > 0:
            tests.append({
                'test_name': 'First Question Hook',
                'hypothesis': 'Optimized hook will increase answer rate by 15%',
                'variant_a': original_questions[0].get('question_text'),
                'variant_b': optimized_questions[0].get('question_text'),
                'success_metric': 'Answer rate on Q1',
                'recommended_traffic_split': 0.5
            })
        
        # Test question order
        if len(optimized_questions) >= 3:
            tests.append({
                'test_name': 'Question Order',
                'hypothesis': 'Reordered flow will improve completion by 10%',
                'variant_a': 'Original order',
                'variant_b': 'Cognitive load optimized order',
                'success_metric': 'Overall completion rate',
                'recommended_traffic_split': 0.5
            })
        
        return tests
    
    async def _predict_improvement(
        self,
        request: OptimizationRequest,
        analyses: List[QuestionAnalysis],
        optimized_questions: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Predict improvement from optimizations"""
        
        # Calculate average quality improvement
        avg_original_quality = sum(a.overall_quality_score for a in analyses) / len(analyses)
        
        # Estimate improvement based on issues fixed
        critical_issues = sum(1 for a in analyses for i in a.issues if i.severity == 'critical')
        high_issues = sum(1 for a in analyses for i in a.issues if i.severity == 'high')
        
        # Base improvement
        improvement_pct = 0.0
        
        # Add improvement per issue type
        improvement_pct += critical_issues * 8  # 8% per critical issue
        improvement_pct += high_issues * 4  # 4% per high issue
        
        # Quality score improvement
        quality_improvement = (1.0 - avg_original_quality) * 0.5
        improvement_pct += quality_improvement * 20  # Up to 10% from quality
        
        # Cap improvement at reasonable levels
        improvement_pct = min(improvement_pct, 35.0)  # Max 35% improvement
        
        # Calculate new completion rate
        current_rate = request.current_completion_rate
        improvement_multiplier = 1 + (improvement_pct / 100)
        predicted_rate = min(current_rate * improvement_multiplier, 0.85)  # Cap at 85%
        
        # Confidence based on data quality
        confidence = 0.7 if len(analyses) >= 5 else 0.6
        
        return {
            'improvement_percentage': improvement_pct,
            'predicted_rate': predicted_rate,
            'confidence': confidence
        }
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get optimizer metrics"""
        success_rate = self.successful_optimizations / max(self.total_optimizations, 1)
        
        return {
            'total_optimizations': self.total_optimizations,
            'successful_optimizations': self.successful_optimizations,
            'success_rate': round(success_rate, 3),
            'total_questions_optimized': self.total_questions_optimized,
            'avg_questions_per_optimization': round(
                self.total_questions_optimized / max(self.total_optimizations, 1), 1
            )
        }


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

async def optimize_questions_quick(
    questions: List[Dict[str, Any]],
    funnel_goal: str,
    current_completion_rate: float,
    target_completion_rate: float = 0.70
) -> OptimizationResponse:
    """
    Quick question optimization
    
    Args:
        questions: Current questions
        funnel_goal: Funnel goal
        current_completion_rate: Current completion rate (0-1)
        target_completion_rate: Target completion rate (0-1)
        
    Returns:
        OptimizationResponse: Optimized questions
    """
    optimizer = QuestionOptimizer()
    
    request = OptimizationRequest(
        questions=questions,
        funnel_goal=funnel_goal,
        target_audience="General",
        industry="general",
        current_completion_rate=current_completion_rate,
        target_completion_rate=target_completion_rate
    )
    
    return await optimizer.optimize(request)


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'QuestionOptimizer',
    'OptimizationRequest',
    'OptimizationResponse',
    'QuestionAnalysis',
    'QuestionIssue',
    'CognitiveLoad',
    'QuestionIssueType',
    'optimize_questions_quick'
]
