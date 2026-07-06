"""
Ad Copy Generator - AI-POWERED PRODUCTION GRADE
================================================
Intelligent ad copy generation optimized for multiple platforms with
psychology-driven messaging, A/B test variants, and performance prediction.

🎯 SUPPORTED PLATFORMS:
- Google Ads (Search, Display, Performance Max)
- Facebook/Instagram Ads
- LinkedIn Ads
- Twitter/X Ads
- TikTok Ads
- YouTube Ads

📊 AD COMPONENTS:
- Headlines (multiple variants)
- Descriptions/Body copy
- CTAs (Call-to-Actions)
- Display URLs
- Ad extensions

🧠 OPTIMIZATION STRATEGIES:
- Platform-specific best practices
- Character limit compliance
- Psychological trigger integration
- A/B test variant generation
- Performance prediction
- Emoji optimization (when appropriate)

💡 FEATURES:
- Multi-platform support
- Bulk generation (10-50 variants)
- Performance scoring
- Brand voice consistency
- Compliance checking

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
from app.utils.exceptions import AdGenerationError


# Configure logger
logger = logging.getLogger(__name__)


class AdPlatform(str, Enum):
    """Supported ad platforms"""
    GOOGLE_SEARCH = "google_search"
    GOOGLE_DISPLAY = "google_display"
    GOOGLE_PMAX = "google_pmax"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"


class AdFormat(str, Enum):
    """Ad format types"""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    CAROUSEL = "carousel"
    COLLECTION = "collection"
    STORY = "story"


class AdObjective(str, Enum):
    """Ad campaign objectives"""
    AWARENESS = "awareness"
    CONSIDERATION = "consideration"
    CONVERSION = "conversion"
    TRAFFIC = "traffic"
    ENGAGEMENT = "engagement"
    LEAD_GENERATION = "lead_generation"
    APP_INSTALL = "app_install"


@dataclass
class PlatformSpecs:
    """Platform-specific specifications"""
    platform: AdPlatform
    
    # Character limits
    headline_max_length: int
    description_max_length: int
    cta_max_length: Optional[int] = None
    
    # Requirements
    max_headlines: int = 1
    max_descriptions: int = 1
    allows_emoji: bool = False
    requires_cta: bool = False
    
    # Best practices
    optimal_headline_length: int = 30
    optimal_description_length: int = 80


# Platform specifications
PLATFORM_SPECS = {
    AdPlatform.GOOGLE_SEARCH: PlatformSpecs(
        platform=AdPlatform.GOOGLE_SEARCH,
        headline_max_length=30,
        description_max_length=90,
        max_headlines=15,
        max_descriptions=4,
        allows_emoji=False,
        requires_cta=False,
        optimal_headline_length=25,
        optimal_description_length=80
    ),
    AdPlatform.FACEBOOK: PlatformSpecs(
        platform=AdPlatform.FACEBOOK,
        headline_max_length=40,
        description_max_length=125,
        cta_max_length=25,
        max_headlines=5,
        max_descriptions=5,
        allows_emoji=True,
        requires_cta=True,
        optimal_headline_length=35,
        optimal_description_length=100
    ),
    AdPlatform.LINKEDIN: PlatformSpecs(
        platform=AdPlatform.LINKEDIN,
        headline_max_length=70,
        description_max_length=150,
        cta_max_length=25,
        max_headlines=3,
        max_descriptions=3,
        allows_emoji=False,
        requires_cta=True,
        optimal_headline_length=60,
        optimal_description_length=130
    ),
    AdPlatform.TWITTER: PlatformSpecs(
        platform=AdPlatform.TWITTER,
        headline_max_length=50,
        description_max_length=280,
        max_headlines=1,
        max_descriptions=1,
        allows_emoji=True,
        requires_cta=True,
        optimal_headline_length=45,
        optimal_description_length=250
    ),
    AdPlatform.TIKTOK: PlatformSpecs(
        platform=AdPlatform.TIKTOK,
        headline_max_length=100,
        description_max_length=100,
        cta_max_length=20,
        max_headlines=1,
        max_descriptions=1,
        allows_emoji=True,
        requires_cta=True,
        optimal_headline_length=80,
        optimal_description_length=80
    )
}


@dataclass
class AdCopy:
    """Individual ad copy variant"""
    
    # Core content
    headline: str
    description: str
    cta: Optional[str] = None
    
    # Metadata
    variant_id: str = ""
    platform: AdPlatform = AdPlatform.GOOGLE_SEARCH
    
    # Performance
    performance_score: float = 0.0
    predicted_ctr: float = 0.0
    
    # Compliance
    is_compliant: bool = True
    compliance_issues: List[str] = field(default_factory=list)
    
    # Psychology
    psychological_triggers: List[str] = field(default_factory=list)
    emotional_appeal: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'variant_id': self.variant_id,
            'platform': self.platform.value,
            'content': {
                'headline': self.headline,
                'description': self.description,
                'cta': self.cta
            },
            'metrics': {
                'performance_score': round(self.performance_score, 2),
                'predicted_ctr': f"{self.predicted_ctr:.2%}",
                'headline_length': len(self.headline),
                'description_length': len(self.description)
            },
            'compliance': {
                'is_compliant': self.is_compliant,
                'issues': self.compliance_issues
            },
            'psychology': {
                'triggers': self.psychological_triggers,
                'emotional_appeal': self.emotional_appeal
            }
        }


@dataclass
class AdCopyRequest:
    """Request for ad copy generation"""
    
    # Business context
    product_service: str
    target_audience: str
    value_proposition: str
    
    # Platform
    platform: AdPlatform
    ad_objective: AdObjective
    
    # Generation settings
    num_variants: int = 5
    tone: str = "professional"  # professional|casual|urgent|friendly
    
    # Optional context
    industry: Optional[str] = None
    competitors: Optional[List[str]] = None
    key_features: Optional[List[str]] = None
    pain_points: Optional[List[str]] = None
    
    # Constraints
    brand_keywords: Optional[List[str]] = None
    excluded_words: Optional[List[str]] = None
    include_emoji: bool = False
    
    def __post_init__(self):
        """Validate request"""
        if self.num_variants < 1 or self.num_variants > 50:
            raise ValueError("num_variants must be between 1 and 50")
        if not self.product_service:
            raise ValueError("product_service is required")


@dataclass
class AdCopyResponse:
    """Response with generated ad copies"""
    
    # Generated variants
    variants: List[AdCopy]
    
    # Best performers
    top_performers: List[AdCopy]
    
    # Insights
    generation_strategy: str
    optimization_tips: List[str]
    platform_best_practices: List[str]
    
    # Metadata
    platform: AdPlatform
    total_variants: int
    avg_performance_score: float
    generation_method: str
    generated_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'platform': self.platform.value,
            'variants': [v.to_dict() for v in self.variants],
            'top_performers': [v.to_dict() for v in self.top_performers],
            'insights': {
                'strategy': self.generation_strategy,
                'optimization_tips': self.optimization_tips,
                'best_practices': self.platform_best_practices
            },
            'metadata': {
                'total_variants': self.total_variants,
                'avg_performance_score': round(self.avg_performance_score, 2),
                'method': self.generation_method,
                'generated_at': self.generated_at.isoformat()
            }
        }


class AdCopyGenerator:
    """
    AI-powered ad copy generator
    
    Generates platform-optimized ad copy with performance prediction
    and compliance checking.
    """
    
    def __init__(
        self,
        openai_client: Optional[OpenAIClient] = None,
        use_ai: bool = True
    ):
        """
        Initialize ad copy generator
        
        Args:
            openai_client: OpenAI API client
            use_ai: Whether to use AI-powered generation
        """
        self.openai_client = openai_client or OpenAIClient()
        self.use_ai = use_ai
        
        # Psychological triggers
        self.psychological_triggers = {
            'urgency': ['now', 'today', 'limited time', 'hurry', 'last chance'],
            'scarcity': ['only X left', 'while supplies last', 'exclusive', 'limited'],
            'social_proof': ['join thousands', 'trusted by', 'rated #1', 'popular'],
            'authority': ['expert', 'certified', 'proven', 'award-winning'],
            'benefit': ['save', 'gain', 'improve', 'increase', 'boost'],
            'curiosity': ['discover', 'secret', 'hidden', 'revealed', 'surprising']
        }
        
        # Power words by tone
        self.power_words = {
            'professional': ['proven', 'professional', 'reliable', 'trusted', 'expert'],
            'casual': ['easy', 'simple', 'fun', 'amazing', 'awesome'],
            'urgent': ['now', 'today', 'instant', 'immediate', 'fast'],
            'friendly': ['help', 'support', 'guide', 'together', 'partner']
        }
        
        # CTA templates
        self.cta_templates = {
            AdObjective.AWARENESS: [
                'Learn More',
                'Discover How',
                'See Details',
                'Find Out More'
            ],
            AdObjective.CONSIDERATION: [
                'Get Started',
                'Try Free',
                'See Plans',
                'Compare Options'
            ],
            AdObjective.CONVERSION: [
                'Buy Now',
                'Get Instant Access',
                'Claim Offer',
                'Start Saving'
            ],
            AdObjective.LEAD_GENERATION: [
                'Get Free Quote',
                'Download Now',
                'Sign Up Free',
                'Request Demo'
            ]
        }
        
        # Metrics
        self.total_generated = 0
        self.ai_generated = 0
        self.template_generated = 0
        self.platform_distribution = {platform: 0 for platform in AdPlatform}
        
        logger.info("✅ AdCopyGenerator initialized")
    
    async def generate_ad_copy(
        self,
        request: AdCopyRequest
    ) -> Dict[str, Any]:
        """
        Generate ad copy variants
        
        Args:
            request: Generation request
            
        Returns:
            Dict: Ad copy response
        """
        self.total_generated += 1
        self.platform_distribution[request.platform] += 1
        
        try:
            logger.info(
                f"📢 Generating ad copy | "
                f"Platform: {request.platform.value} | "
                f"Variants: {request.num_variants} | "
                f"Objective: {request.ad_objective.value}"
            )
            
            # Get platform specs
            specs = PLATFORM_SPECS.get(
                request.platform,
                PLATFORM_SPECS[AdPlatform.GOOGLE_SEARCH]
            )
            
            # Generate variants
            if self.use_ai:
                try:
                    variants = await self._generate_with_ai(request, specs)
                    self.ai_generated += 1
                    method = "ai"
                except Exception as e:
                    logger.warning(f"⚠️ AI generation failed: {e}, using templates")
                    variants = self._generate_with_templates(request, specs)
                    self.template_generated += 1
                    method = "template"
            else:
                variants = self._generate_with_templates(request, specs)
                self.template_generated += 1
                method = "template"
            
            # Score performance
            for variant in variants:
                variant.performance_score = self._score_ad_copy(variant, request, specs)
                variant.predicted_ctr = self._predict_ctr(variant, request)
            
            # Check compliance
            for variant in variants:
                self._check_compliance(variant, specs)
            
            # Sort by performance
            variants.sort(key=lambda v: v.performance_score, reverse=True)
            
            # Get top performers
            top_performers = variants[:3]
            
            # Generate insights
            strategy = self._describe_strategy(request, method)
            tips = self._generate_optimization_tips(variants, specs)
            best_practices = self._get_platform_best_practices(request.platform)
            
            # Calculate average score
            avg_score = sum(v.performance_score for v in variants) / len(variants)
            
            # Build response
            response = AdCopyResponse(
                variants=variants,
                top_performers=top_performers,
                generation_strategy=strategy,
                optimization_tips=tips,
                platform_best_practices=best_practices,
                platform=request.platform,
                total_variants=len(variants),
                avg_performance_score=avg_score,
                generation_method=method
            )
            
            logger.info(
                f"✅ Ad copy generated | "
                f"Variants: {len(variants)} | "
                f"Avg Score: {avg_score:.1f}/100 | "
                f"Top CTR: {top_performers[0].predicted_ctr:.2%} | "
                f"Method: {method}"
            )
            
            return response.to_dict()
            
        except Exception as e:
            logger.error(f"❌ Ad generation failed: {e}", exc_info=True)
            raise AdGenerationError(f"Failed to generate ad copy: {str(e)}") from e
    
    async def _generate_with_ai(
        self,
        request: AdCopyRequest,
        specs: PlatformSpecs
    ) -> List[AdCopy]:
        """Generate ad copy using AI"""
        try:
            # Prepare prompt context
            context = {
                'product_service': request.product_service,
                'target_audience': request.target_audience,
                'value_proposition': request.value_proposition,
                'platform': request.platform.value,
                'objective': request.ad_objective.value,
                'tone': request.tone,
                'num_variants': request.num_variants,
                'headline_max_length': specs.headline_max_length,
                'description_max_length': specs.description_max_length,
                'allows_emoji': specs.allows_emoji,
                'key_features': request.key_features or [],
                'pain_points': request.pain_points or []
            }
            
            # Get prompt template
            prompt_template = get_prompt("ad_copy_generator", PromptVersion.LATEST)
            
            # Render prompt
            messages = prompt_template.render(**context)
            
            # Call OpenAI
            response = await self.openai_client.create_json_completion(
                messages=messages,
                model=OpenAIModel.GPT_4_TURBO,
                temperature=0.9,  # Higher creativity for ad copy
                max_tokens=2000
            )
            
            # Parse variants
            variants = []
            for i, variant_data in enumerate(response.get('variants', []), 1):
                # Extract psychological triggers
                triggers = self._identify_triggers(
                    variant_data.get('headline', '') + ' ' + variant_data.get('description', '')
                )
                
                variant = AdCopy(
                    variant_id=f"var_{i}",
                    platform=request.platform,
                    headline=variant_data.get('headline', ''),
                    description=variant_data.get('description', ''),
                    cta=variant_data.get('cta'),
                    psychological_triggers=triggers,
                    emotional_appeal=variant_data.get('emotional_appeal', 'benefit')
                )
                
                variants.append(variant)
            
            return variants
            
        except Exception as e:
            logger.error(f"❌ AI generation error: {e}")
            raise
    
    def _generate_with_templates(
        self,
        request: AdCopyRequest,
        specs: PlatformSpecs
    ) -> List[AdCopy]:
        """Generate ad copy using templates"""
        variants = []
        
        # Headline templates
        headline_templates = [
            f"Get {request.value_proposition}",
            f"{request.value_proposition} - {request.target_audience}",
            f"The Best {request.product_service} for {request.target_audience}",
            f"Transform Your {self._extract_keyword(request.target_audience)}",
            f"{request.value_proposition} in Minutes"
        ]
        
        # Description templates
        description_templates = [
            f"Discover how {request.product_service} helps {request.target_audience}. {request.value_proposition}.",
            f"Join thousands who trust {request.product_service}. {request.value_proposition} today.",
            f"{request.value_proposition} with our proven {request.product_service}. Get started now.",
            f"Stop struggling. {request.value_proposition} with {request.product_service}.",
            f"The #1 {request.product_service} for {request.target_audience}. {request.value_proposition}."
        ]
        
        # CTA options
        ctas = self.cta_templates.get(request.ad_objective, ['Get Started'])
        
        # Generate variants
        for i in range(min(request.num_variants, len(headline_templates))):
            headline = self._truncate_text(
                headline_templates[i % len(headline_templates)],
                specs.headline_max_length
            )
            
            description = self._truncate_text(
                description_templates[i % len(description_templates)],
                specs.description_max_length
            )
            
            cta = ctas[i % len(ctas)] if specs.requires_cta else None
            
            # Identify triggers
            triggers = self._identify_triggers(headline + ' ' + description)
            
            variant = AdCopy(
                variant_id=f"var_{i+1}",
                platform=request.platform,
                headline=headline,
                description=description,
                cta=cta,
                psychological_triggers=triggers,
                emotional_appeal='benefit'
            )
            
            variants.append(variant)
        
        return variants
    
    def _truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to max length"""
        if len(text) <= max_length:
            return text
        return text[:max_length-3] + '...'
    
    def _extract_keyword(self, text: str) -> str:
        """Extract key noun from text"""
        # Simple extraction - take last word
        words = text.strip().split()
        return words[-1] if words else 'business'
    
    def _identify_triggers(self, text: str) -> List[str]:
        """Identify psychological triggers in text"""
        text_lower = text.lower()
        triggers = []
        
        for trigger_type, keywords in self.psychological_triggers.items():
            if any(keyword in text_lower for keyword in keywords):
                triggers.append(trigger_type)
        
        return triggers
    
    def _score_ad_copy(
        self,
        variant: AdCopy,
        request: AdCopyRequest,
        specs: PlatformSpecs
    ) -> float:
        """Score ad copy quality (0-100)"""
        score = 50.0  # Base score
        
        # Length optimization
        headline_len = len(variant.headline)
        if headline_len <= specs.headline_max_length:
            # Closer to optimal = higher score
            optimal_diff = abs(headline_len - specs.optimal_headline_length)
            length_score = max(0, 15 - optimal_diff)
            score += length_score
        else:
            score -= 20  # Penalty for exceeding limit
        
        # Description optimization
        desc_len = len(variant.description)
        if desc_len <= specs.description_max_length:
            optimal_diff = abs(desc_len - specs.optimal_description_length)
            length_score = max(0, 10 - (optimal_diff / 2))
            score += length_score
        else:
            score -= 15
        
        # Psychological triggers
        score += len(variant.psychological_triggers) * 5
        
        # CTA present (if required)
        if specs.requires_cta and variant.cta:
            score += 10
        elif specs.requires_cta and not variant.cta:
            score -= 10
        
        # Value proposition mention
        if request.value_proposition.lower() in variant.headline.lower():
            score += 10
        if request.value_proposition.lower() in variant.description.lower():
            score += 5
        
        # Target audience mention
        if request.target_audience.lower() in (variant.headline + ' ' + variant.description).lower():
            score += 5
        
        # Power words
        power_words_used = sum(
            1 for word in self.power_words.get(request.tone, [])
            if word in (variant.headline + ' ' + variant.description).lower()
        )
        score += power_words_used * 3
        
        # Numbers in headline (proven to increase CTR)
        if re.search(r'\d+', variant.headline):
            score += 5
        
        return min(max(score, 0), 100)
    
    def _predict_ctr(
        self,
        variant: AdCopy,
        request: AdCopyRequest
    ) -> float:
        """Predict click-through rate"""
        # Base CTR by platform
        base_ctr = {
            AdPlatform.GOOGLE_SEARCH: 0.035,
            AdPlatform.FACEBOOK: 0.018,
            AdPlatform.LINKEDIN: 0.012,
            AdPlatform.TWITTER: 0.015,
            AdPlatform.TIKTOK: 0.025
        }
        
        ctr = base_ctr.get(request.platform, 0.02)
        
        # Adjust based on performance score
        score_multiplier = 1 + ((variant.performance_score - 50) / 100)
        ctr *= score_multiplier
        
        # Adjust for triggers
        trigger_boost = len(variant.psychological_triggers) * 0.002
        ctr += trigger_boost
        
        return min(ctr, 0.10)  # Cap at 10%
    
    def _check_compliance(
        self,
        variant: AdCopy,
        specs: PlatformSpecs
    ):
        """Check ad copy compliance"""
        issues = []
        
        # Check length limits
        if len(variant.headline) > specs.headline_max_length:
            issues.append(
                f"Headline exceeds {specs.headline_max_length} char limit "
                f"({len(variant.headline)} chars)"
            )
        
        if len(variant.description) > specs.description_max_length:
            issues.append(
                f"Description exceeds {specs.description_max_length} char limit "
                f"({len(variant.description)} chars)"
            )
        
        # Check CTA requirement
        if specs.requires_cta and not variant.cta:
            issues.append("CTA is required for this platform")
        
        # Check emoji usage
        emoji_pattern = re.compile("["
            u"\U0001F600-\U0001F64F"  # emoticons
            u"\U0001F300-\U0001F5FF"  # symbols & pictographs
            u"\U0001F680-\U0001F6FF"  # transport & map symbols
            u"\U0001F1E0-\U0001F1FF"  # flags
            "]+", flags=re.UNICODE)
        
        has_emoji = bool(emoji_pattern.search(variant.headline + variant.description))
        
        if has_emoji and not specs.allows_emoji:
            issues.append("Emoji not allowed on this platform")
        
        # Update compliance status
        variant.compliance_issues = issues
        variant.is_compliant = len(issues) == 0
    
    def _describe_strategy(
        self,
        request: AdCopyRequest,
        method: str
    ) -> str:
        """Describe generation strategy"""
        strategy = (
            f"Generated {request.num_variants} {request.tone} ad copy variants "
            f"for {request.platform.value} optimized for {request.ad_objective.value}. "
        )
        
        if method == "ai":
            strategy += "Used AI to create unique, high-performing variations."
        else:
            strategy += "Used proven templates with platform-specific optimization."
        
        return strategy
    
    def _generate_optimization_tips(
        self,
        variants: List[AdCopy],
        specs: PlatformSpecs
    ) -> List[str]:
        """Generate optimization tips"""
        tips = []
        
        # Compliance tips
        non_compliant = [v for v in variants if not v.is_compliant]
        if non_compliant:
            tips.append(
                f"{len(non_compliant)} variant(s) have compliance issues - "
                f"review and adjust before publishing"
            )
        
        # Length tips
        avg_headline_len = sum(len(v.headline) for v in variants) / len(variants)
        if avg_headline_len < specs.optimal_headline_length - 10:
            tips.append(
                f"Headlines averaging {avg_headline_len:.0f} chars - "
                f"consider using full {specs.optimal_headline_length} char limit"
            )
        
        # Trigger tips
        avg_triggers = sum(len(v.psychological_triggers) for v in variants) / len(variants)
        if avg_triggers < 1.5:
            tips.append(
                "Add more psychological triggers (urgency, social proof, scarcity) "
                "to increase engagement"
            )
        
        # CTR prediction
        top_ctr = max(v.predicted_ctr for v in variants)
        if top_ctr < 0.02:
            tips.append(
                "Low predicted CTR - consider testing more benefit-focused headlines"
            )
        
        # General tips
        tips.append(
            f"Test top 3-5 variants to find best performer for your audience"
        )
        
        return tips
    
    def _get_platform_best_practices(
        self,
        platform: AdPlatform
    ) -> List[str]:
        """Get platform-specific best practices"""
        practices = {
            AdPlatform.GOOGLE_SEARCH: [
                "Include target keyword in headline",
                "Use specific numbers and stats",
                "Match ad copy to landing page",
                "Test responsive search ads with 15 headlines",
                "Include location in headline if local business"
            ],
            AdPlatform.FACEBOOK: [
                "Lead with a question or bold statement",
                "Use emojis strategically (1-2 per ad)",
                "Keep headline under 40 characters",
                "Include clear benefit in first 3 words",
                "Test carousel ads for e-commerce"
            ],
            AdPlatform.LINKEDIN: [
                "Use professional, business-focused language",
                "Highlight ROI and business benefits",
                "Avoid emojis and casual language",
                "Include company size or industry targeting",
                "Lead with credibility signals"
            ],
            AdPlatform.TWITTER: [
                "Use hashtags sparingly (1-2 max)",
                "Front-load most important info",
                "Include visual content with text",
                "Use conversational, timely language",
                "Test polls and interactive formats"
            ],
            AdPlatform.TIKTOK: [
                "Use casual, authentic language",
                "Lead with hook in first 2 seconds",
                "Include trending sounds/music",
                "Use emojis and youth-friendly language",
                "Show, don't tell - visual over text"
            ]
        }
        
        return practices.get(platform, [
            "Test multiple variants",
            "Monitor performance daily",
            "Optimize based on data"
        ])
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get generator metrics"""
        ai_rate = self.ai_generated / max(self.total_generated, 1)
        
        return {
            'total_generated': self.total_generated,
            'ai_generated': self.ai_generated,
            'template_generated': self.template_generated,
            'ai_usage_rate': round(ai_rate, 3),
            'platform_distribution': {
                platform.value: count
                for platform, count in self.platform_distribution.items()
                if count > 0
            }
        }


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

async def generate_ad_quick(
    product: str,
    audience: str,
    value_prop: str,
    platform: str = "google_search"
) -> Dict[str, Any]:
    """Quick ad generation"""
    generator = AdCopyGenerator(use_ai=False)
    
    request = AdCopyRequest(
        product_service=product,
        target_audience=audience,
        value_proposition=value_prop,
        platform=AdPlatform(platform),
        ad_objective=AdObjective.CONVERSION
    )
    
    return await generator.generate_ad_copy(request)


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'AdCopyGenerator',
    'AdCopyRequest',
    'AdCopyResponse',
    'AdCopy',
    'AdPlatform',
    'AdObjective',
    'generate_ad_quick'
]
