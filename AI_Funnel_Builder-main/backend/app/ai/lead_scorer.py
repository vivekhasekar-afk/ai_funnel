"""
Lead Scorer - AI-POWERED PRODUCTION GRADE
==========================================
Intelligent lead scoring and qualification using AI, behavioral analysis,
and multi-dimensional scoring to identify high-quality leads.

🎯 SCORING FRAMEWORK:

🔥 HOT LEAD (90-100):
- Immediate need/urgency
- Budget authority confirmed
- Decision-making power
- Perfect product fit
- Ready to buy NOW

⭐ WARM LEAD (70-89):
- Clear pain point identified
- Actively evaluating solutions
- Budget awareness
- Good product fit
- 1-3 month timeline

💼 QUALIFIED LEAD (50-69):
- Problem awareness
- Researching options
- Potential budget
- Possible fit
- 3-6 month timeline

🌱 NURTURE LEAD (30-49):
- Early stage awareness
- Exploring options
- Budget uncertain
- Could be a fit
- 6+ month timeline

❄️ COLD LEAD (0-29):
- Low intent signals
- No clear need
- No budget
- Poor fit
- Just browsing

📊 SCORING DIMENSIONS:
1. Urgency Signals (30%)
2. Budget Indicators (25%)
3. Authority/Decision Power (20%)
4. Fit Score (15%)
5. Engagement Level (10%)

Author: AI Funnel Builder Team
Version: 3.0.0
Last Updated: 2024-01-15
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import json
import re

from app.ai.openai_client import OpenAIClient, OpenAIModel
from app.ai.prompt_templates import get_prompt, PromptVersion
from app.core.config import settings
from app.utils.exceptions import ScoringError


# Configure logger
logger = logging.getLogger(__name__)


class LeadTier(str, Enum):
    """Lead quality tiers"""
    HOT = "hot"              # 90-100
    WARM = "warm"            # 70-89
    QUALIFIED = "qualified"  # 50-69
    NURTURE = "nurture"      # 30-49
    COLD = "cold"            # 0-29


class UrgencyLevel(str, Enum):
    """Urgency levels"""
    IMMEDIATE = "immediate"      # Now/This week
    HIGH = "high"                # This month
    MEDIUM = "medium"            # This quarter
    LOW = "low"                  # 6+ months
    NONE = "none"                # No timeline


class BudgetIndicator(str, Enum):
    """Budget status indicators"""
    ALLOCATED = "allocated"      # Budget ready
    AVAILABLE = "available"      # Budget exists
    POSSIBLE = "possible"        # Could get budget
    UNCERTAIN = "uncertain"      # Don't know
    NO_BUDGET = "no_budget"      # No budget


@dataclass
class IntentSignal:
    """Individual intent signal"""
    signal_type: str
    value: str
    confidence: float  # 0-1
    weight: float  # How important this signal is
    reasoning: str


@dataclass
class ScoringDimensions:
    """Scores across all dimensions"""
    urgency_score: float          # 0-100
    budget_score: float           # 0-100
    authority_score: float        # 0-100
    fit_score: float              # 0-100
    engagement_score: float       # 0-100
    
    def overall_score(self) -> float:
        """Calculate weighted overall score"""
        return (
            self.urgency_score * 0.30 +
            self.budget_score * 0.25 +
            self.authority_score * 0.20 +
            self.fit_score * 0.15 +
            self.engagement_score * 0.10
        )
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary"""
        return {
            'urgency': round(self.urgency_score, 1),
            'budget': round(self.budget_score, 1),
            'authority': round(self.authority_score, 1),
            'fit': round(self.fit_score, 1),
            'engagement': round(self.engagement_score, 1),
            'overall': round(self.overall_score(), 1)
        }


@dataclass
class LeadScoringRequest:
    """Request for lead scoring"""
    
    # Lead responses
    lead_responses: Dict[str, Any]  # Question -> Answer mapping
    
    # Business context
    offering_description: str
    ideal_customer_profile: str
    price_range: str  # e.g., "$100-500/month" or "$10,000-50,000"
    
    # Optional context
    lead_email: Optional[str] = None
    lead_company: Optional[str] = None
    lead_role: Optional[str] = None
    response_time_seconds: Optional[float] = None
    
    # Metadata
    funnel_id: Optional[str] = None
    lead_id: Optional[str] = None
    
    def __post_init__(self):
        """Validate request"""
        if not self.lead_responses:
            raise ValueError("lead_responses cannot be empty")
        if not self.offering_description:
            raise ValueError("offering_description is required")
        if not self.ideal_customer_profile:
            raise ValueError("ideal_customer_profile is required")


@dataclass
class LeadScoringResponse:
    """Response with lead score and insights"""
    
    # Overall score
    overall_score: int  # 0-100
    quality_tier: LeadTier
    
    # Dimensional scores
    dimension_scores: ScoringDimensions
    
    # Intent analysis
    intent_signals: List[IntentSignal]
    urgency_level: UrgencyLevel
    budget_indicator: BudgetIndicator
    
    # Insights
    key_insights: List[str]
    red_flags: List[str]
    positive_indicators: List[str]
    
    # Recommendations
    recommended_actions: List[str]
    talking_points: List[str]
    objections_to_address: List[str]
    
    # Predictions
    estimated_close_probability: float  # 0-1
    recommended_follow_up_timing: str
    optimal_channel: str  # email|phone|demo|meeting
    
    # Metadata
    scoring_method: str = "hybrid"  # ai|rule_based|hybrid
    confidence_score: float = 0.0
    scored_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'overall_score': self.overall_score,
            'quality_tier': self.quality_tier.value,
            'dimension_scores': self.dimension_scores.to_dict(),
            'intent_signals': [
                {
                    'type': signal.signal_type,
                    'value': signal.value,
                    'confidence': round(signal.confidence, 2),
                    'weight': round(signal.weight, 2),
                    'reasoning': signal.reasoning
                }
                for signal in self.intent_signals
            ],
            'urgency_level': self.urgency_level.value,
            'budget_indicator': self.budget_indicator.value,
            'insights': {
                'key_insights': self.key_insights,
                'red_flags': self.red_flags,
                'positive_indicators': self.positive_indicators
            },
            'recommendations': {
                'actions': self.recommended_actions,
                'talking_points': self.talking_points,
                'objections': self.objections_to_address
            },
            'predictions': {
                'close_probability': round(self.estimated_close_probability, 3),
                'follow_up_timing': self.recommended_follow_up_timing,
                'optimal_channel': self.optimal_channel
            },
            'metadata': {
                'method': self.scoring_method,
                'confidence': round(self.confidence_score, 2),
                'scored_at': self.scored_at.isoformat()
            }
        }


class LeadScorer:
    """
    AI-powered lead scoring and qualification
    
    Analyzes funnel responses to score lead quality and provide
    actionable insights for sales follow-up.
    """
    
    def __init__(
        self,
        openai_client: Optional[OpenAIClient] = None,
        use_ai: bool = True
    ):
        """
        Initialize lead scorer
        
        Args:
            openai_client: OpenAI API client
            use_ai: Whether to use AI-powered scoring
        """
        self.openai_client = openai_client or OpenAIClient()
        self.use_ai = use_ai
        
        # Urgency keywords
        self.urgency_keywords = {
            'immediate': ['now', 'asap', 'immediately', 'urgent', 'today', 'this week'],
            'high': ['soon', 'this month', 'next month', 'quickly', 'fast'],
            'medium': ['this quarter', 'next quarter', '3 months', '2-3 months'],
            'low': ['eventually', 'someday', 'future', '6 months', 'next year']
        }
        
        # Budget keywords
        self.budget_keywords = {
            'allocated': ['budget approved', 'budget allocated', 'funds ready', 'budget set aside'],
            'available': ['have budget', 'budget available', 'can invest', 'ready to invest'],
            'possible': ['working on budget', 'need to get budget', 'might have budget'],
            'uncertain': ['not sure', 'don\'t know', 'unsure', 'depends'],
            'no_budget': ['no budget', 'can\'t afford', 'too expensive', 'no money']
        }
        
        # Authority keywords
        self.authority_keywords = {
            'decision_maker': ['ceo', 'founder', 'owner', 'president', 'decision maker', 'final say'],
            'influencer': ['manager', 'director', 'vp', 'head of', 'lead', 'recommend'],
            'user': ['employee', 'team member', 'user', 'individual contributor']
        }
        
        # Metrics
        self.total_scores = 0
        self.ai_scores = 0
        self.rule_based_scores = 0
        self.tier_distribution = {tier: 0 for tier in LeadTier}
        
        logger.info("✅ LeadScorer initialized")
    
    async def score_lead(
        self,
        request: LeadScoringRequest
    ) -> Dict[str, Any]:
        """
        Score a lead based on their responses
        
        Args:
            request: Scoring request
            
        Returns:
            Dict: Scoring response
        """
        self.total_scores += 1
        
        try:
            logger.info(f"🎯 Scoring lead...")
            
            # Step 1: Extract intent signals
            intent_signals = self._extract_intent_signals(request)
            
            # Step 2: Score dimensions
            if self.use_ai:
                try:
                    dimensions = await self._score_with_ai(request, intent_signals)
                    self.ai_scores += 1
                    method = "hybrid"
                except Exception as e:
                    logger.warning(f"⚠️ AI scoring failed: {e}, using rule-based")
                    dimensions = self._score_with_rules(request, intent_signals)
                    self.rule_based_scores += 1
                    method = "rule_based"
            else:
                dimensions = self._score_with_rules(request, intent_signals)
                self.rule_based_scores += 1
                method = "rule_based"
            
            # Step 3: Calculate overall score and tier
            overall_score = int(dimensions.overall_score())
            quality_tier = self._get_quality_tier(overall_score)
            
            # Step 4: Determine urgency and budget
            urgency = self._determine_urgency(intent_signals)
            budget = self._determine_budget(intent_signals)
            
            # Step 5: Generate insights
            insights = self._generate_insights(request, dimensions, intent_signals)
            red_flags = self._identify_red_flags(request, dimensions, intent_signals)
            positives = self._identify_positive_indicators(request, dimensions, intent_signals)
            
            # Step 6: Generate recommendations
            actions = self._recommend_actions(quality_tier, urgency, budget, dimensions)
            talking_points = self._generate_talking_points(request, dimensions, intent_signals)
            objections = self._predict_objections(request, intent_signals)
            
            # Step 7: Predictions
            close_prob = self._estimate_close_probability(dimensions, urgency, budget)
            follow_up_timing = self._recommend_follow_up_timing(quality_tier, urgency)
            optimal_channel = self._recommend_channel(quality_tier, dimensions)
            
            # Build response
            response = LeadScoringResponse(
                overall_score=overall_score,
                quality_tier=quality_tier,
                dimension_scores=dimensions,
                intent_signals=intent_signals,
                urgency_level=urgency,
                budget_indicator=budget,
                key_insights=insights,
                red_flags=red_flags,
                positive_indicators=positives,
                recommended_actions=actions,
                talking_points=talking_points,
                objections_to_address=objections,
                estimated_close_probability=close_prob,
                recommended_follow_up_timing=follow_up_timing,
                optimal_channel=optimal_channel,
                scoring_method=method,
                confidence_score=0.75 if method == "hybrid" else 0.65
            )
            
            # Update metrics
            self.tier_distribution[quality_tier] += 1
            
            logger.info(
                f"✅ Lead scored | "
                f"Score: {overall_score}/100 | "
                f"Tier: {quality_tier.value} | "
                f"Close Prob: {close_prob:.1%} | "
                f"Method: {method}"
            )
            
            return response.to_dict()
            
        except Exception as e:
            logger.error(f"❌ Lead scoring failed: {e}", exc_info=True)
            raise ScoringError(f"Failed to score lead: {str(e)}") from e
    
    def _extract_intent_signals(
        self,
        request: LeadScoringRequest
    ) -> List[IntentSignal]:
        """Extract intent signals from responses"""
        signals = []
        
        # Combine all text responses
        all_text = " ".join(str(v).lower() for v in request.lead_responses.values())
        
        # Check urgency signals
        for level, keywords in self.urgency_keywords.items():
            for keyword in keywords:
                if keyword in all_text:
                    signals.append(IntentSignal(
                        signal_type="urgency",
                        value=level,
                        confidence=0.8,
                        weight=0.3,
                        reasoning=f"Mentioned '{keyword}'"
                    ))
                    break
        
        # Check budget signals
        for indicator, keywords in self.budget_keywords.items():
            for keyword in keywords:
                if keyword in all_text:
                    signals.append(IntentSignal(
                        signal_type="budget",
                        value=indicator,
                        confidence=0.75,
                        weight=0.25,
                        reasoning=f"Mentioned '{keyword}'"
                    ))
                    break
        
        # Check authority signals
        if request.lead_role:
            role_lower = request.lead_role.lower()
            for level, keywords in self.authority_keywords.items():
                if any(keyword in role_lower for keyword in keywords):
                    signals.append(IntentSignal(
                        signal_type="authority",
                        value=level,
                        confidence=0.9,
                        weight=0.2,
                        reasoning=f"Role: {request.lead_role}"
                    ))
                    break
        
        # Check engagement signals
        if request.response_time_seconds:
            if request.response_time_seconds < 180:  # < 3 minutes
                signals.append(IntentSignal(
                    signal_type="engagement",
                    value="high",
                    confidence=0.7,
                    weight=0.1,
                    reasoning="Completed quickly (high engagement)"
                ))
            elif request.response_time_seconds > 600:  # > 10 minutes
                signals.append(IntentSignal(
                    signal_type="engagement",
                    value="low",
                    confidence=0.6,
                    weight=0.1,
                    reasoning="Took long time (distracted/unsure)"
                ))
        
        # Check for specific pain point mentions
        pain_keywords = ['struggle', 'problem', 'challenge', 'issue', 'difficult', 'frustrated']
        if any(keyword in all_text for keyword in pain_keywords):
            signals.append(IntentSignal(
                signal_type="pain_awareness",
                value="high",
                confidence=0.8,
                weight=0.15,
                reasoning="Clear pain point articulation"
            ))
        
        return signals
    
    async def _score_with_ai(
        self,
        request: LeadScoringRequest,
        intent_signals: List[IntentSignal]
    ) -> ScoringDimensions:
        """Score using AI (GPT-4)"""
        try:
            # Get prompt template
            prompt_template = get_prompt("lead_scorer", PromptVersion.LATEST)
            
            # Prepare variables
            template_vars = {
                'lead_responses': json.dumps(request.lead_responses, indent=2),
                'offering_description': request.offering_description,
                'ideal_customer': request.ideal_customer_profile,
                'price_range': request.price_range
            }
            
            # Render prompt
            messages = prompt_template.render(**template_vars)
            
            # Call OpenAI
            response = await self.openai_client.create_json_completion(
                messages=messages,
                model=OpenAIModel.GPT_4_TURBO,
                temperature=0.5,
                max_tokens=1500
            )
            
            # Extract scores from AI response
            intent_scores = response.get('intent_signals', {})
            
            return ScoringDimensions(
                urgency_score=float(intent_scores.get('urgency', 50)),
                budget_score=float(intent_scores.get('budget', 50)),
                authority_score=float(intent_scores.get('authority', 50)),
                fit_score=float(intent_scores.get('fit', 50)),
                engagement_score=float(intent_scores.get('engagement', 50))
            )
            
        except Exception as e:
            logger.error(f"❌ AI scoring error: {e}")
            raise
    
    def _score_with_rules(
        self,
        request: LeadScoringRequest,
        intent_signals: List[IntentSignal]
    ) -> ScoringDimensions:
        """Score using rule-based system"""
        
        # Urgency score
        urgency_signals = [s for s in intent_signals if s.signal_type == "urgency"]
        if urgency_signals:
            urgency_map = {'immediate': 100, 'high': 80, 'medium': 60, 'low': 30}
            urgency_score = urgency_map.get(urgency_signals[0].value, 50)
        else:
            urgency_score = 50
        
        # Budget score
        budget_signals = [s for s in intent_signals if s.signal_type == "budget"]
        if budget_signals:
            budget_map = {'allocated': 100, 'available': 80, 'possible': 60, 'uncertain': 40, 'no_budget': 10}
            budget_score = budget_map.get(budget_signals[0].value, 50)
        else:
            budget_score = 50
        
        # Authority score
        authority_signals = [s for s in intent_signals if s.signal_type == "authority"]
        if authority_signals:
            authority_map = {'decision_maker': 100, 'influencer': 70, 'user': 30}
            authority_score = authority_map.get(authority_signals[0].value, 50)
        else:
            authority_score = 50
        
        # Fit score (based on ideal customer profile match)
        fit_score = self._calculate_fit_score(request)
        
        # Engagement score
        engagement_signals = [s for s in intent_signals if s.signal_type == "engagement"]
        if engagement_signals:
            engagement_map = {'high': 90, 'medium': 60, 'low': 30}
            engagement_score = engagement_map.get(engagement_signals[0].value, 60)
        else:
            engagement_score = 60
        
        return ScoringDimensions(
            urgency_score=urgency_score,
            budget_score=budget_score,
            authority_score=authority_score,
            fit_score=fit_score,
            engagement_score=engagement_score
        )
    
    def _calculate_fit_score(self, request: LeadScoringRequest) -> float:
        """Calculate product/service fit score"""
        fit_score = 50.0  # Base score
        
        # Check if lead matches ideal customer profile
        icp_lower = request.ideal_customer_profile.lower()
        all_responses = " ".join(str(v).lower() for v in request.lead_responses.values())
        
        # Extract key ICP characteristics
        icp_keywords = re.findall(r'\b\w+\b', icp_lower)
        
        # Count matches
        matches = sum(1 for keyword in icp_keywords if keyword in all_responses and len(keyword) > 3)
        
        # Boost score based on matches
        fit_score += min(matches * 5, 40)  # Max +40 from matches
        
        # Check company size indicators
        if request.lead_company:
            if any(indicator in request.lead_company.lower() for indicator in ['inc', 'corp', 'ltd', 'llc']):
                fit_score += 10  # Established company
        
        return min(fit_score, 100)
    
    def _get_quality_tier(self, score: int) -> LeadTier:
        """Get quality tier from score"""
        if score >= 90:
            return LeadTier.HOT
        elif score >= 70:
            return LeadTier.WARM
        elif score >= 50:
            return LeadTier.QUALIFIED
        elif score >= 30:
            return LeadTier.NURTURE
        else:
            return LeadTier.COLD
    
    def _determine_urgency(self, intent_signals: List[IntentSignal]) -> UrgencyLevel:
        """Determine urgency level"""
        urgency_signals = [s for s in intent_signals if s.signal_type == "urgency"]
        
        if not urgency_signals:
            return UrgencyLevel.MEDIUM
        
        urgency_value = urgency_signals[0].value
        urgency_map = {
            'immediate': UrgencyLevel.IMMEDIATE,
            'high': UrgencyLevel.HIGH,
            'medium': UrgencyLevel.MEDIUM,
            'low': UrgencyLevel.LOW
        }
        
        return urgency_map.get(urgency_value, UrgencyLevel.MEDIUM)
    
    def _determine_budget(self, intent_signals: List[IntentSignal]) -> BudgetIndicator:
        """Determine budget status"""
        budget_signals = [s for s in intent_signals if s.signal_type == "budget"]
        
        if not budget_signals:
            return BudgetIndicator.UNCERTAIN
        
        budget_value = budget_signals[0].value
        budget_map = {
            'allocated': BudgetIndicator.ALLOCATED,
            'available': BudgetIndicator.AVAILABLE,
            'possible': BudgetIndicator.POSSIBLE,
            'uncertain': BudgetIndicator.UNCERTAIN,
            'no_budget': BudgetIndicator.NO_BUDGET
        }
        
        return budget_map.get(budget_value, BudgetIndicator.UNCERTAIN)
    
    def _generate_insights(
        self,
        request: LeadScoringRequest,
        dimensions: ScoringDimensions,
        intent_signals: List[IntentSignal]
    ) -> List[str]:
        """Generate key insights about the lead"""
        insights = []
        
        # Urgency insight
        if dimensions.urgency_score >= 80:
            insights.append("High urgency - lead needs solution quickly")
        elif dimensions.urgency_score < 40:
            insights.append("Low urgency - long sales cycle expected")
        
        # Budget insight
        if dimensions.budget_score >= 80:
            insights.append("Budget confirmed - financial barrier low")
        elif dimensions.budget_score < 40:
            insights.append("Budget unclear - may need ROI justification")
        
        # Authority insight
        if dimensions.authority_score >= 80:
            insights.append("Decision maker identified - can close deal")
        elif dimensions.authority_score < 50:
            insights.append("Not decision maker - may need to involve others")
        
        # Fit insight
        if dimensions.fit_score >= 75:
            insights.append("Strong product-market fit evident")
        elif dimensions.fit_score < 50:
            insights.append("Fit uncertain - need qualification call")
        
        # Engagement insight
        pain_signals = [s for s in intent_signals if s.signal_type == "pain_awareness"]
        if pain_signals:
            insights.append("Clear pain point articulated - motivated buyer")
        
        return insights
    
    def _identify_red_flags(
        self,
        request: LeadScoringRequest,
        dimensions: ScoringDimensions,
        intent_signals: List[IntentSignal]
    ) -> List[str]:
        """Identify potential red flags"""
        flags = []
        
        if dimensions.budget_score < 30:
            flags.append("No budget allocated - high risk")
        
        if dimensions.urgency_score < 30:
            flags.append("No urgency - may not close")
        
        if dimensions.authority_score < 40:
            flags.append("Low authority - long approval process")
        
        if dimensions.fit_score < 40:
            flags.append("Poor fit - may not be right customer")
        
        # Check for tire-kicker signals
        all_text = " ".join(str(v).lower() for v in request.lead_responses.values())
        if any(word in all_text for word in ['just looking', 'just browsing', 'just curious']):
            flags.append("Tire kicker signals detected")
        
        return flags
    
    def _identify_positive_indicators(
        self,
        request: LeadScoringRequest,
        dimensions: ScoringDimensions,
        intent_signals: List[IntentSignal]
    ) -> List[str]:
        """Identify positive buying signals"""
        positives = []
        
        if dimensions.urgency_score >= 80:
            positives.append("Immediate timeline indicated")
        
        if dimensions.budget_score >= 80:
            positives.append("Budget ready and allocated")
        
        if dimensions.authority_score >= 80:
            positives.append("Speaking with decision maker")
        
        if dimensions.fit_score >= 75:
            positives.append("Perfect match for ideal customer profile")
        
        # Check for positive language
        all_text = " ".join(str(v).lower() for v in request.lead_responses.values())
        if any(word in all_text for word in ['need', 'must have', 'looking for', 'want to']):
            positives.append("Strong intent language used")
        
        return positives
    
    def _recommend_actions(
        self,
        tier: LeadTier,
        urgency: UrgencyLevel,
        budget: BudgetIndicator,
        dimensions: ScoringDimensions
    ) -> List[str]:
        """Recommend next actions"""
        actions = []
        
        if tier == LeadTier.HOT:
            actions.extend([
                "Schedule demo call within 24 hours",
                "Prepare pricing proposal immediately",
                "Assign to senior sales rep"
            ])
        elif tier == LeadTier.WARM:
            actions.extend([
                "Schedule qualification call within 48 hours",
                "Send relevant case studies",
                "Prepare custom demo"
            ])
        elif tier == LeadTier.QUALIFIED:
            actions.extend([
                "Schedule discovery call within 1 week",
                "Send educational content",
                "Nurture with value-add emails"
            ])
        elif tier == LeadTier.NURTURE:
            actions.extend([
                "Add to email nurture sequence",
                "Send monthly check-ins",
                "Provide educational resources"
            ])
        else:  # COLD
            actions.extend([
                "Disqualify or long-term nurture only",
                "Low priority follow-up"
            ])
        
        # Budget-specific actions
        if budget in [BudgetIndicator.UNCERTAIN, BudgetIndicator.POSSIBLE]:
            actions.append("Discuss ROI and build business case")
        
        # Authority-specific actions
        if dimensions.authority_score < 70:
            actions.append("Identify and involve decision makers")
        
        return actions
    
    def _generate_talking_points(
        self,
        request: LeadScoringRequest,
        dimensions: ScoringDimensions,
        intent_signals: List[IntentSignal]
    ) -> List[str]:
        """Generate talking points for sales call"""
        points = []
        
        # Extract mentioned pain points
        all_text = " ".join(str(v) for v in request.lead_responses.values())
        
        if 'time' in all_text.lower() or 'efficiency' in all_text.lower():
            points.append("Emphasize time savings and efficiency gains")
        
        if 'cost' in all_text.lower() or 'budget' in all_text.lower():
            points.append("Focus on ROI and cost savings")
        
        if 'team' in all_text.lower() or 'collaboration' in all_text.lower():
            points.append("Highlight collaboration features")
        
        # Generic strong points
        if dimensions.fit_score >= 70:
            points.append("Reference similar customer success stories")
        
        points.append(f"Lead matches ideal profile in: {request.ideal_customer_profile[:50]}...")
        
        return points
    
    def _predict_objections(
        self,
        request: LeadScoringRequest,
        intent_signals: List[IntentSignal]
    ) -> List[str]:
        """Predict likely objections"""
        objections = []
        
        # Budget objections
        budget_signals = [s for s in intent_signals if s.signal_type == "budget"]
        if budget_signals and budget_signals[0].value in ['uncertain', 'possible', 'no_budget']:
            objections.append("Price/budget concerns likely")
        
        # Urgency objections
        urgency_signals = [s for s in intent_signals if s.signal_type == "urgency"]
        if urgency_signals and urgency_signals[0].value in ['low', 'medium']:
            objections.append("'Not a priority right now' likely")
        
        # Authority objections
        authority_signals = [s for s in intent_signals if s.signal_type == "authority"]
        if authority_signals and authority_signals[0].value == 'user':
            objections.append("'Need to check with manager' likely")
        
        return objections
    
    def _estimate_close_probability(
        self,
        dimensions: ScoringDimensions,
        urgency: UrgencyLevel,
        budget: BudgetIndicator
    ) -> float:
        """Estimate probability of closing deal"""
        overall_score = dimensions.overall_score()
        
        # Base probability from score
        base_prob = overall_score / 100
        
        # Adjust for urgency
        if urgency == UrgencyLevel.IMMEDIATE:
            base_prob *= 1.2
        elif urgency == UrgencyLevel.LOW:
            base_prob *= 0.8
        
        # Adjust for budget
        if budget == BudgetIndicator.ALLOCATED:
            base_prob *= 1.15
        elif budget == BudgetIndicator.NO_BUDGET:
            base_prob *= 0.6
        
        return min(base_prob, 0.95)
    
    def _recommend_follow_up_timing(
        self,
        tier: LeadTier,
        urgency: UrgencyLevel
    ) -> str:
        """Recommend when to follow up"""
        if tier == LeadTier.HOT and urgency == UrgencyLevel.IMMEDIATE:
            return "within_1_hour"
        elif tier == LeadTier.HOT:
            return "within_24_hours"
        elif tier == LeadTier.WARM:
            return "within_48_hours"
        elif tier == LeadTier.QUALIFIED:
            return "within_1_week"
        else:
            return "low_priority"
    
    def _recommend_channel(
        self,
        tier: LeadTier,
        dimensions: ScoringDimensions
    ) -> str:
        """Recommend optimal communication channel"""
        if tier == LeadTier.HOT:
            return "phone"  # Personal touch for hot leads
        elif tier == LeadTier.WARM and dimensions.authority_score >= 70:
            return "demo"  # Demo for warm decision makers
        elif tier == LeadTier.QUALIFIED:
            return "email"  # Email for qualified leads
        else:
            return "automation"  # Automated nurture
    
    def calculate_intent_score(
        self,
        responses: Dict[str, Any]
    ) -> float:
        """
        Calculate simple intent score (0-1)
        
        Args:
            responses: Lead responses
            
        Returns:
            float: Intent score
        """
        # Quick calculation without full scoring
        all_text = " ".join(str(v).lower() for v in responses.values())
        
        score = 0.5  # Base
        
        # High intent keywords
        if any(word in all_text for word in ['need', 'urgent', 'asap', 'now']):
            score += 0.2
        
        # Budget keywords
        if any(word in all_text for word in ['budget', 'invest', 'purchase']):
            score += 0.15
        
        # Decision keywords
        if any(word in all_text for word in ['decision', 'evaluate', 'compare']):
            score += 0.15
        
        return min(score, 1.0)
    
    def assign_quality_tier(self, score: int) -> str:
        """Assign quality tier from score"""
        return self._get_quality_tier(score).value
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get scorer metrics"""
        ai_rate = self.ai_scores / max(self.total_scores, 1)
        
        return {
            'total_scores': self.total_scores,
            'ai_scores': self.ai_scores,
            'rule_based_scores': self.rule_based_scores,
            'ai_usage_rate': round(ai_rate, 3),
            'tier_distribution': {
                tier.value: count
                for tier, count in self.tier_distribution.items()
            }
        }


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

async def score_lead_quick(
    responses: Dict[str, Any],
    offering: str,
    ideal_customer: str = "Small businesses"
) -> Dict[str, Any]:
    """Quick lead scoring"""
    scorer = LeadScorer(use_ai=False)
    
    request = LeadScoringRequest(
        lead_responses=responses,
        offering_description=offering,
        ideal_customer_profile=ideal_customer,
        price_range="$100-1000/month"
    )
    
    return await scorer.score_lead(request)


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'LeadScorer',
    'LeadScoringRequest',
    'LeadScoringResponse',
    'LeadTier',
    'UrgencyLevel',
    'BudgetIndicator',
    'IntentSignal',
    'ScoringDimensions',
    'score_lead_quick'
]
