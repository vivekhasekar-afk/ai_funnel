"""
Personalization Engine - AI-POWERED PRODUCTION GRADE
====================================================
Real-time funnel personalization using behavioral signals, user context,
and AI to deliver hyper-relevant experiences that maximize conversion.

🎯 PERSONALIZATION FRAMEWORK:

📊 PERSONALIZATION DIMENSIONS:
1. Behavioral (pages viewed, time spent, interactions)
2. Contextual (device, location, time, referrer)
3. Demographic (age, role, industry, company size)
4. Psychographic (decision style, pain points, goals)
5. Historical (past visits, engagement, conversions)

🔬 PERSONALIZATION STRATEGIES:
- Content variation (headlines, copy, images)
- Question adaptation (ordering, wording, complexity)
- Offer customization (pricing, incentives, urgency)
- Social proof matching (similar companies/roles)
- Flow optimization (skip/show questions based on context)

🎨 PERSONALIZATION RULES:
- Rule-based (if/then logic)
- AI-powered (predictive recommendations)
- Segment-based (predefined personas)
- Real-time adaptive (learns from behavior)

📈 PERFORMANCE TRACKING:
- Lift by personalization rule
- Segment performance comparison
- A/B test integration
- Real-time analytics

Author: AI Funnel Builder Team
Version: 3.0.0
Last Updated: 2024-01-15
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import json
import hashlib

from app.ai.openai_client import OpenAIClient, OpenAIModel
from app.core.config import settings
from app.utils.exceptions import PersonalizationError


# Configure logger
logger = logging.getLogger(__name__)


class PersonalizationTrigger(str, Enum):
    """When personalization is applied"""
    ENTRY = "entry"              # First page view
    QUESTION_VIEW = "question_view"  # Each question
    INTERACTION = "interaction"  # User interaction
    TIME_BASED = "time_based"    # After X seconds
    SCROLL_BASED = "scroll_based"  # Scroll depth
    EXIT_INTENT = "exit_intent"  # About to leave


class PersonalizationType(str, Enum):
    """Types of personalization"""
    CONTENT = "content"          # Text/copy changes
    VISUAL = "visual"            # Images/design changes
    FLOW = "flow"                # Question order/skip logic
    OFFER = "offer"              # Pricing/incentive changes
    SOCIAL_PROOF = "social_proof"  # Testimonial selection
    URGENCY = "urgency"          # Scarcity/urgency level


class UserSegment(str, Enum):
    """User segments"""
    HIGH_INTENT = "high_intent"        # Ready to buy
    RESEARCHER = "researcher"          # Still learning
    PRICE_SENSITIVE = "price_sensitive"  # Budget-focused
    QUALITY_SEEKER = "quality_seeker"  # Premium-focused
    EARLY_ADOPTER = "early_adopter"    # Innovation-focused
    CONSERVATIVE = "conservative"      # Risk-averse
    REPEAT_VISITOR = "repeat_visitor"  # Returning user
    UNKNOWN = "unknown"                # Not enough data


@dataclass
class UserContext:
    """User context information"""
    
    # Session info
    session_id: str
    user_id: Optional[str] = None
    
    # Behavioral
    page_views: int = 0
    time_on_site: float = 0.0  # seconds
    interactions: int = 0
    questions_answered: int = 0
    funnel_progress: float = 0.0  # 0-1
    
    # Contextual
    device_type: str = "desktop"  # desktop|mobile|tablet
    browser: str = "chrome"
    location_country: Optional[str] = None
    location_city: Optional[str] = None
    referrer_source: Optional[str] = None
    referrer_url: Optional[str] = None
    
    # Timing
    hour_of_day: int = 12
    day_of_week: int = 3
    is_business_hours: bool = True
    
    # Demographic (if known)
    company_size: Optional[str] = None
    industry: Optional[str] = None
    job_role: Optional[str] = None
    
    # Historical
    is_returning_visitor: bool = False
    previous_visits: int = 0
    previous_conversions: int = 0
    last_visit_date: Optional[datetime] = None
    
    # Inferred
    estimated_segment: UserSegment = UserSegment.UNKNOWN
    intent_score: float = 0.5  # 0-1
    engagement_score: float = 0.5  # 0-1
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'session_id': self.session_id,
            'user_id': self.user_id,
            'behavioral': {
                'page_views': self.page_views,
                'time_on_site': round(self.time_on_site, 1),
                'interactions': self.interactions,
                'questions_answered': self.questions_answered,
                'progress': f"{self.funnel_progress:.0%}"
            },
            'contextual': {
                'device': self.device_type,
                'browser': self.browser,
                'location': f"{self.location_city}, {self.location_country}" if self.location_city else self.location_country,
                'referrer': self.referrer_source
            },
            'segment': self.estimated_segment.value,
            'scores': {
                'intent': round(self.intent_score, 2),
                'engagement': round(self.engagement_score, 2)
            }
        }


@dataclass
class PersonalizationRule:
    """Personalization rule definition"""
    
    rule_id: str
    name: str
    description: str
    
    # Trigger
    trigger: PersonalizationTrigger
    
    # Condition (when to apply)
    conditions: Dict[str, Any]
    
    # Action (what to change)
    personalization_type: PersonalizationType
    changes: Dict[str, Any]
    
    # Targeting
    target_segments: List[UserSegment]
    
    # Performance
    priority: int = 100  # Higher = applied first
    is_active: bool = True
    
    # Tracking
    impressions: int = 0
    conversions: int = 0
    lift: float = 0.0
    
    def matches_context(self, context: UserContext) -> bool:
        """Check if rule conditions match context"""
        
        # Check segment targeting
        if context.estimated_segment not in self.target_segments and UserSegment.UNKNOWN not in self.target_segments:
            return False
        
        # Check conditions
        for key, value in self.conditions.items():
            if key == 'device_type':
                if context.device_type != value:
                    return False
            
            elif key == 'min_page_views':
                if context.page_views < value:
                    return False
            
            elif key == 'min_time_on_site':
                if context.time_on_site < value:
                    return False
            
            elif key == 'referrer_contains':
                if not context.referrer_source or value.lower() not in context.referrer_source.lower():
                    return False
            
            elif key == 'is_returning':
                if context.is_returning_visitor != value:
                    return False
            
            elif key == 'min_intent_score':
                if context.intent_score < value:
                    return False
            
            elif key == 'business_hours_only':
                if value and not context.is_business_hours:
                    return False
        
        return True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'rule_id': self.rule_id,
            'name': self.name,
            'description': self.description,
            'trigger': self.trigger.value,
            'type': self.personalization_type.value,
            'target_segments': [seg.value for seg in self.target_segments],
            'priority': self.priority,
            'is_active': self.is_active,
            'performance': {
                'impressions': self.impressions,
                'conversions': self.conversions,
                'lift': f"+{self.lift:.1f}%"
            } if self.impressions > 0 else None
        }


@dataclass
class PersonalizationResult:
    """Result of personalization"""
    
    # Applied changes
    applied_rules: List[PersonalizationRule]
    
    # Modified content
    personalized_content: Dict[str, Any]
    
    # Metadata
    user_segment: UserSegment
    confidence: float
    processing_time_ms: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'applied_rules': [
                {
                    'rule_id': rule.rule_id,
                    'name': rule.name,
                    'type': rule.personalization_type.value
                }
                for rule in self.applied_rules
            ],
            'personalized_content': self.personalized_content,
            'user_segment': self.user_segment.value,
            'confidence': round(self.confidence, 2),
            'processing_time_ms': round(self.processing_time_ms, 2)
        }


class PersonalizationEngine:
    """
    Real-time personalization engine
    
    Analyzes user context and applies personalization rules to deliver
    hyper-relevant funnel experiences.
    """
    
    def __init__(
        self,
        openai_client: Optional[OpenAIClient] = None,
        use_ai: bool = True
    ):
        """
        Initialize personalization engine
        
        Args:
            openai_client: OpenAI API client
            use_ai: Whether to use AI-powered personalization
        """
        self.openai_client = openai_client or OpenAIClient()
        self.use_ai = use_ai
        
        # Rule storage
        self.rules: List[PersonalizationRule] = []
        
        # User context cache (session_id -> context)
        self.context_cache: Dict[str, UserContext] = {}
        
        # Segment classification models (simple rule-based for now)
        self.segment_rules = {
            UserSegment.HIGH_INTENT: {
                'min_intent_score': 0.7,
                'min_engagement': 0.6
            },
            UserSegment.RESEARCHER: {
                'min_page_views': 3,
                'max_intent_score': 0.6,
                'min_time_on_site': 120
            },
            UserSegment.PRICE_SENSITIVE: {
                'referrer_keywords': ['price', 'cost', 'cheap', 'affordable', 'discount']
            },
            UserSegment.QUALITY_SEEKER: {
                'referrer_keywords': ['best', 'premium', 'top', 'professional', 'enterprise']
            },
            UserSegment.REPEAT_VISITOR: {
                'is_returning': True,
                'min_previous_visits': 1
            }
        }
        
        # Performance metrics
        self.total_personalizations = 0
        self.segment_distribution = {seg: 0 for seg in UserSegment}
        self.avg_processing_time = 0.0
        
        # Initialize default rules
        self._initialize_default_rules()
        
        logger.info("✅ PersonalizationEngine initialized")
    
    def _initialize_default_rules(self):
        """Initialize default personalization rules"""
        
        # Rule 1: Mobile-specific headline
        self.rules.append(PersonalizationRule(
            rule_id="mobile_headline",
            name="Mobile-Optimized Headline",
            description="Shorter headline for mobile users",
            trigger=PersonalizationTrigger.ENTRY,
            conditions={'device_type': 'mobile'},
            personalization_type=PersonalizationType.CONTENT,
            changes={
                'headline_max_length': 40,
                'style': 'concise'
            },
            target_segments=[seg for seg in UserSegment],
            priority=200
        ))
        
        # Rule 2: High intent - aggressive CTA
        self.rules.append(PersonalizationRule(
            rule_id="high_intent_cta",
            name="Aggressive CTA for High Intent",
            description="Direct, action-oriented CTA for users showing high intent",
            trigger=PersonalizationTrigger.ENTRY,
            conditions={'min_intent_score': 0.7},
            personalization_type=PersonalizationType.CONTENT,
            changes={
                'cta_style': 'aggressive',
                'cta_examples': ['Get Started Now', 'Claim Your Spot', 'Start Winning Today']
            },
            target_segments=[UserSegment.HIGH_INTENT],
            priority=150
        ))
        
        # Rule 3: Returning visitor - skip intro
        self.rules.append(PersonalizationRule(
            rule_id="returning_skip_intro",
            name="Skip Introduction for Returning Visitors",
            description="Skip intro questions for users who've been here before",
            trigger=PersonalizationTrigger.ENTRY,
            conditions={'is_returning': True},
            personalization_type=PersonalizationType.FLOW,
            changes={
                'skip_questions': [0],  # Skip first question
                'welcome_message': 'Welcome back!'
            },
            target_segments=[UserSegment.REPEAT_VISITOR],
            priority=180
        ))
        
        # Rule 4: Price sensitive - emphasize value
        self.rules.append(PersonalizationRule(
            rule_id="price_value_emphasis",
            name="Emphasize Value for Price-Sensitive Users",
            description="Focus on ROI and cost savings",
            trigger=PersonalizationTrigger.ENTRY,
            conditions={},
            personalization_type=PersonalizationType.CONTENT,
            changes={
                'value_prop_angle': 'cost_savings',
                'social_proof_type': 'roi_focused',
                'testimonial_filter': 'mentions_price_value'
            },
            target_segments=[UserSegment.PRICE_SENSITIVE],
            priority=120
        ))
        
        # Rule 5: Quality seeker - premium positioning
        self.rules.append(PersonalizationRule(
            rule_id="premium_positioning",
            name="Premium Positioning for Quality Seekers",
            description="Emphasize quality, expertise, and premium features",
            trigger=PersonalizationTrigger.ENTRY,
            conditions={},
            personalization_type=PersonalizationType.CONTENT,
            changes={
                'value_prop_angle': 'quality_excellence',
                'social_proof_type': 'authority_based',
                'testimonial_filter': 'enterprise_customers'
            },
            target_segments=[UserSegment.QUALITY_SEEKER],
            priority=120
        ))
        
        # Rule 6: Low engagement - add urgency
        self.rules.append(PersonalizationRule(
            rule_id="low_engagement_urgency",
            name="Add Urgency for Low Engagement",
            description="Introduce urgency elements for users taking too long",
            trigger=PersonalizationTrigger.TIME_BASED,
            conditions={'min_time_on_site': 30},
            personalization_type=PersonalizationType.URGENCY,
            changes={
                'urgency_type': 'soft',
                'message': 'Limited spots available - claim yours now!'
            },
            target_segments=[UserSegment.RESEARCHER, UserSegment.UNKNOWN],
            priority=100
        ))
        
        # Rule 7: Exit intent - value reminder
        self.rules.append(PersonalizationRule(
            rule_id="exit_intent_reminder",
            name="Exit Intent Value Reminder",
            description="Remind user of value before they leave",
            trigger=PersonalizationTrigger.EXIT_INTENT,
            conditions={},
            personalization_type=PersonalizationType.OFFER,
            changes={
                'show_popup': True,
                'message': 'Wait! Get your free personalized report',
                'offer_enhancement': 'bonus_content'
            },
            target_segments=[seg for seg in UserSegment],
            priority=250
        ))
        
        # Rule 8: Business hours - emphasize support
        self.rules.append(PersonalizationRule(
            rule_id="business_hours_support",
            name="Emphasize Live Support During Business Hours",
            description="Highlight availability of live support",
            trigger=PersonalizationTrigger.ENTRY,
            conditions={'business_hours_only': True},
            personalization_type=PersonalizationType.SOCIAL_PROOF,
            changes={
                'show_live_chat': True,
                'support_message': 'Questions? Our team is online now!'
            },
            target_segments=[UserSegment.HIGH_INTENT, UserSegment.RESEARCHER],
            priority=110
        ))
    
    async def personalize(
        self,
        content: Dict[str, Any],
        context: UserContext,
        trigger: PersonalizationTrigger = PersonalizationTrigger.ENTRY
    ) -> Dict[str, Any]:
        """
        Apply personalization to content
        
        Args:
            content: Original content to personalize
            context: User context
            trigger: When personalization is triggered
            
        Returns:
            Dict: Personalization result
        """
        start_time = datetime.utcnow()
        self.total_personalizations += 1
        
        try:
            logger.info(
                f"🎨 Personalizing content | "
                f"Session: {context.session_id[:8]}... | "
                f"Segment: {context.estimated_segment.value} | "
                f"Trigger: {trigger.value}"
            )
            
            # Step 1: Update user context
            context = self._update_context(context)
            
            # Step 2: Classify user segment
            segment = self._classify_segment(context)
            context.estimated_segment = segment
            self.segment_distribution[segment] += 1
            
            # Step 3: Find matching rules
            matching_rules = self._find_matching_rules(context, trigger)
            
            # Step 4: Apply rules (in priority order)
            personalized_content = content.copy()
            applied_rules = []
            
            for rule in matching_rules:
                if rule.is_active:
                    personalized_content = self._apply_rule(
                        personalized_content,
                        rule,
                        context
                    )
                    applied_rules.append(rule)
                    rule.impressions += 1
            
            # Step 5: AI enhancement (if enabled)
            if self.use_ai and len(applied_rules) > 0:
                try:
                    personalized_content = await self._ai_enhance(
                        personalized_content,
                        context,
                        applied_rules
                    )
                except Exception as e:
                    logger.warning(f"⚠️ AI enhancement failed: {e}")
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            self.avg_processing_time = (
                (self.avg_processing_time * (self.total_personalizations - 1) + processing_time)
                / self.total_personalizations
            )
            
            # Build result
            result = PersonalizationResult(
                applied_rules=applied_rules,
                personalized_content=personalized_content,
                user_segment=segment,
                confidence=self._calculate_confidence(context, applied_rules),
                processing_time_ms=processing_time
            )
            
            logger.info(
                f"✅ Personalization applied | "
                f"Rules: {len(applied_rules)} | "
                f"Segment: {segment.value} | "
                f"Time: {processing_time:.1f}ms"
            )
            
            return result.to_dict()
            
        except Exception as e:
            logger.error(f"❌ Personalization failed: {e}", exc_info=True)
            # Return original content on error
            return {
                'applied_rules': [],
                'personalized_content': content,
                'user_segment': UserSegment.UNKNOWN.value,
                'confidence': 0.0,
                'processing_time_ms': 0.0,
                'error': str(e)
            }
    
    def _update_context(self, context: UserContext) -> UserContext:
        """Update user context with derived metrics"""
        
        # Calculate intent score
        intent_signals = 0
        max_signals = 5
        
        if context.time_on_site > 60:
            intent_signals += 1
        if context.interactions > 3:
            intent_signals += 1
        if context.questions_answered > 0:
            intent_signals += 1
        if context.funnel_progress > 0.5:
            intent_signals += 1
        if context.page_views > 2:
            intent_signals += 1
        
        context.intent_score = intent_signals / max_signals
        
        # Calculate engagement score
        engagement_signals = 0
        
        if context.time_on_site > 30:
            engagement_signals += 0.3
        if context.interactions > 1:
            engagement_signals += 0.3
        if context.funnel_progress > 0.3:
            engagement_signals += 0.4
        
        context.engagement_score = min(engagement_signals, 1.0)
        
        # Cache context
        self.context_cache[context.session_id] = context
        
        return context
    
    def _classify_segment(self, context: UserContext) -> UserSegment:
        """Classify user into segment"""
        
        # Check each segment's rules
        for segment, rules in self.segment_rules.items():
            matches = True
            
            # Intent score check
            if 'min_intent_score' in rules:
                if context.intent_score < rules['min_intent_score']:
                    matches = False
            
            if 'max_intent_score' in rules:
                if context.intent_score > rules['max_intent_score']:
                    matches = False
            
            # Engagement check
            if 'min_engagement' in rules:
                if context.engagement_score < rules['min_engagement']:
                    matches = False
            
            # Behavioral checks
            if 'min_page_views' in rules:
                if context.page_views < rules['min_page_views']:
                    matches = False
            
            if 'min_time_on_site' in rules:
                if context.time_on_site < rules['min_time_on_site']:
                    matches = False
            
            # Returning visitor check
            if 'is_returning' in rules:
                if context.is_returning_visitor != rules['is_returning']:
                    matches = False
            
            if 'min_previous_visits' in rules:
                if context.previous_visits < rules['min_previous_visits']:
                    matches = False
            
            # Referrer keyword check
            if 'referrer_keywords' in rules:
                if context.referrer_source:
                    ref_lower = context.referrer_source.lower()
                    has_keyword = any(kw in ref_lower for kw in rules['referrer_keywords'])
                    if not has_keyword:
                        matches = False
                else:
                    matches = False
            
            if matches:
                return segment
        
        # Default to unknown
        return UserSegment.UNKNOWN
    
    def _find_matching_rules(
        self,
        context: UserContext,
        trigger: PersonalizationTrigger
    ) -> List[PersonalizationRule]:
        """Find rules that match context and trigger"""
        
        matching = []
        
        for rule in self.rules:
            if rule.trigger == trigger:
                if rule.matches_context(context):
                    matching.append(rule)
        
        # Sort by priority (highest first)
        matching.sort(key=lambda r: r.priority, reverse=True)
        
        return matching
    
    def _apply_rule(
        self,
        content: Dict[str, Any],
        rule: PersonalizationRule,
        context: UserContext
    ) -> Dict[str, Any]:
        """Apply a personalization rule to content"""
        
        personalized = content.copy()
        changes = rule.changes
        
        if rule.personalization_type == PersonalizationType.CONTENT:
            # Apply content changes
            if 'headline_max_length' in changes:
                if 'headline' in personalized:
                    headline = personalized['headline']
                    max_len = changes['headline_max_length']
                    if len(headline) > max_len:
                        personalized['headline'] = headline[:max_len-3] + '...'
            
            if 'cta_style' in changes:
                personalized['cta_style'] = changes['cta_style']
                if 'cta_examples' in changes:
                    personalized['cta_suggestions'] = changes['cta_examples']
            
            if 'value_prop_angle' in changes:
                personalized['value_proposition_angle'] = changes['value_prop_angle']
            
            if 'social_proof_type' in changes:
                personalized['social_proof_strategy'] = changes['social_proof_type']
        
        elif rule.personalization_type == PersonalizationType.FLOW:
            # Apply flow changes
            if 'skip_questions' in changes:
                personalized['skip_question_indices'] = changes['skip_questions']
            
            if 'welcome_message' in changes:
                personalized['custom_welcome'] = changes['welcome_message']
        
        elif rule.personalization_type == PersonalizationType.URGENCY:
            # Apply urgency changes
            if 'urgency_type' in changes:
                personalized['urgency_level'] = changes['urgency_type']
            
            if 'message' in changes:
                personalized['urgency_message'] = changes['message']
        
        elif rule.personalization_type == PersonalizationType.OFFER:
            # Apply offer changes
            if 'show_popup' in changes:
                personalized['exit_intent_popup'] = changes.get('message')
            
            if 'offer_enhancement' in changes:
                personalized['bonus_offer'] = changes['offer_enhancement']
        
        elif rule.personalization_type == PersonalizationType.SOCIAL_PROOF:
            # Apply social proof changes
            if 'show_live_chat' in changes:
                personalized['live_chat_enabled'] = changes['show_live_chat']
            
            if 'support_message' in changes:
                personalized['support_callout'] = changes['support_message']
        
        # Add personalization metadata
        if 'personalization_applied' not in personalized:
            personalized['personalization_applied'] = []
        
        personalized['personalization_applied'].append({
            'rule_id': rule.rule_id,
            'rule_name': rule.name,
            'type': rule.personalization_type.value
        })
        
        return personalized
    
    async def _ai_enhance(
        self,
        content: Dict[str, Any],
        context: UserContext,
        applied_rules: List[PersonalizationRule]
    ) -> Dict[str, Any]:
        """Enhance personalization with AI"""
        
        # For now, return as-is
        # In production, could use AI to generate personalized copy
        return content
    
    def _calculate_confidence(
        self,
        context: UserContext,
        applied_rules: List[PersonalizationRule]
    ) -> float:
        """Calculate confidence in personalization"""
        
        confidence = 0.5  # Base
        
        # More data = higher confidence
        if context.page_views > 2:
            confidence += 0.1
        if context.time_on_site > 60:
            confidence += 0.1
        if context.interactions > 3:
            confidence += 0.1
        
        # Segment classification confidence
        if context.estimated_segment != UserSegment.UNKNOWN:
            confidence += 0.15
        
        # Rules applied
        if len(applied_rules) > 0:
            confidence += 0.05
        
        return min(confidence, 0.95)
    
    def add_rule(self, rule: PersonalizationRule):
        """Add a new personalization rule"""
        self.rules.append(rule)
        logger.info(f"➕ Added personalization rule: {rule.name}")
    
    def remove_rule(self, rule_id: str):
        """Remove a personalization rule"""
        self.rules = [r for r in self.rules if r.rule_id != rule_id]
        logger.info(f"➖ Removed personalization rule: {rule_id}")
    
    def get_rule(self, rule_id: str) -> Optional[PersonalizationRule]:
        """Get a personalization rule by ID"""
        for rule in self.rules:
            if rule.rule_id == rule_id:
                return rule
        return None
    
    def update_rule_performance(
        self,
        rule_id: str,
        conversion: bool
    ):
        """Update rule performance metrics"""
        rule = self.get_rule(rule_id)
        if rule:
            if conversion:
                rule.conversions += 1
            
            # Calculate lift
            if rule.impressions > 100:
                rule_cr = rule.conversions / rule.impressions
                # Compare to baseline (would need actual baseline data)
                baseline_cr = 0.50  # Placeholder
                rule.lift = ((rule_cr - baseline_cr) / baseline_cr) * 100
    
    def get_context(self, session_id: str) -> Optional[UserContext]:
        """Get cached user context"""
        return self.context_cache.get(session_id)
    
    def create_context(
        self,
        session_id: str,
        **kwargs
    ) -> UserContext:
        """Create new user context"""
        context = UserContext(session_id=session_id, **kwargs)
        self.context_cache[session_id] = context
        return context
    
    def get_segment_performance(self) -> Dict[str, Any]:
        """Get performance by segment"""
        total = sum(self.segment_distribution.values())
        
        if total == 0:
            return {}
        
        return {
            segment.value: {
                'count': count,
                'percentage': f"{(count/total)*100:.1f}%"
            }
            for segment, count in self.segment_distribution.items()
            if count > 0
        }
    
    def get_rule_performance(self) -> List[Dict[str, Any]]:
        """Get performance of all rules"""
        return [
            {
                'rule_id': rule.rule_id,
                'name': rule.name,
                'impressions': rule.impressions,
                'conversions': rule.conversions,
                'conversion_rate': f"{(rule.conversions/rule.impressions)*100:.1f}%" if rule.impressions > 0 else "0%",
                'lift': f"+{rule.lift:.1f}%" if rule.lift > 0 else f"{rule.lift:.1f}%"
            }
            for rule in self.rules
            if rule.impressions > 0
        ]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get engine metrics"""
        return {
            'total_personalizations': self.total_personalizations,
            'avg_processing_time_ms': round(self.avg_processing_time, 2),
            'active_rules': len([r for r in self.rules if r.is_active]),
            'total_rules': len(self.rules),
            'segment_distribution': self.get_segment_performance(),
            'top_performing_rules': sorted(
                self.get_rule_performance(),
                key=lambda x: float(x['conversion_rate'].rstrip('%')),
                reverse=True
            )[:5]
        }


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

async def personalize_quick(
    content: Dict[str, Any],
    device: str = "desktop",
    is_returning: bool = False
) -> Dict[str, Any]:
    """Quick personalization"""
    engine = PersonalizationEngine(use_ai=False)
    
    context = UserContext(
        session_id="quick_" + datetime.utcnow().strftime('%Y%m%d%H%M%S'),
        device_type=device,
        is_returning_visitor=is_returning
    )
    
    return await engine.personalize(content, context)


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'PersonalizationEngine',
    'UserContext',
    'PersonalizationRule',
    'PersonalizationResult',
    'PersonalizationTrigger',
    'PersonalizationType',
    'UserSegment',
    'personalize_quick'
]
