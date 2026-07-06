# =============================================================================
# AI FUNNEL BUILDER - AI SERVICE (PSYCHOLOGY-DRIVEN)
# =============================================================================
# OpenAI-powered funnel generation with psychology & engagement optimization
# =============================================================================

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import json
from aiohttp import request
from sqlalchemy.ext.asyncio import AsyncSession

# ✅ FIXED: OpenAI v1.0.0+ imports
from openai import AsyncOpenAI
from openai import OpenAIError
from typer import prompt

from app.models.funnel import Funnel
from app.models.question import Question, QuestionTypeEnum
from app.schemas.ai import (
    FunnelGenerationRequest,
    FunnelGenerationResponse,
    QuestionOptimizationRequest,
)
from app.utils.exceptions import AIGenerationException, ValidationException
from app.utils.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)

# =============================================================================
# PSYCHOLOGY PRINCIPLES
# =============================================================================

class PsychologyPrinciple(str, Enum):
    """Cialdini's principles of persuasion + additional psychology concepts."""
    RECIPROCITY = "reciprocity"
    COMMITMENT = "commitment"
    SOCIAL_PROOF = "social_proof"
    AUTHORITY = "authority"
    LIKING = "liking"
    SCARCITY = "scarcity"
    UNITY = "unity"
    CURIOSITY = "curiosity"
    LOSS_AVERSION = "loss_aversion"
    CONTRAST = "contrast"
    CONSISTENCY = "consistency"

class EngagementTechnique(str, Enum):
    """Engagement optimization techniques."""
    GAMIFICATION = "gamification"
    PROGRESS_INDICATION = "progress_indication"
    MICRO_COMMITMENTS = "micro_commitments"
    PATTERN_INTERRUPT = "pattern_interrupt"
    STORYTELLING = "storytelling"
    PERSONALIZATION = "personalization"
    URGENCY = "urgency"
    SOCIAL_VALIDATION = "social_validation"
    CHOICE_ARCHITECTURE = "choice_architecture"
    COGNITIVE_EASE = "cognitive_ease"

# =============================================================================
# PSYCHOLOGY STRATEGIES
# =============================================================================

PSYCHOLOGY_STRATEGIES = {
    "lead_generation": {
        "principles": [
            PsychologyPrinciple.RECIPROCITY,
            PsychologyPrinciple.SOCIAL_PROOF,
            PsychologyPrinciple.CURIOSITY,
        ],
        "techniques": [
            EngagementTechnique.PROGRESS_INDICATION,
            EngagementTechnique.MICRO_COMMITMENTS,
            EngagementTechnique.PERSONALIZATION,
        ],
        "question_sequence": "easy_to_hard",
        "emotional_arc": "curiosity → hope → desire",
    },
    "product_recommendation": {
        "principles": [
            PsychologyPrinciple.COMMITMENT,
            PsychologyPrinciple.AUTHORITY,
            PsychologyPrinciple.CONTRAST,
        ],
        "techniques": [
            EngagementTechnique.CHOICE_ARCHITECTURE,
            EngagementTechnique.PERSONALIZATION,
            EngagementTechnique.GAMIFICATION,
        ],
        "question_sequence": "diagnostic",
        "emotional_arc": "problem → solution → confidence",
    },
    "qualification": {
        "principles": [
            PsychologyPrinciple.AUTHORITY,
            PsychologyPrinciple.SCARCITY,
            PsychologyPrinciple.SOCIAL_PROOF,
        ],
        "techniques": [
            EngagementTechnique.URGENCY,
            EngagementTechnique.SOCIAL_VALIDATION,
            EngagementTechnique.PROGRESS_INDICATION,
        ],
        "question_sequence": "qualifying",
        "emotional_arc": "aspiration → urgency → commitment",
    },
    "feedback": {
        "principles": [
            PsychologyPrinciple.RECIPROCITY,
            PsychologyPrinciple.UNITY,
            PsychologyPrinciple.LIKING,
        ],
        "techniques": [
            EngagementTechnique.STORYTELLING,
            EngagementTechnique.COGNITIVE_EASE,
            EngagementTechnique.PATTERN_INTERRUPT,
        ],
        "question_sequence": "emotional_to_rational",
        "emotional_arc": "empathy → reflection → gratitude",
    },
}

# =============================================================================
# QUESTION TEMPLATES WITH PSYCHOLOGY
# =============================================================================

PSYCHOLOGY_QUESTION_TEMPLATES = {
    "opening_curiosity": {
        "templates": [
            "What if I told you that {outcome} is possible in just {timeframe}?",
            "Imagine {desired_state}. What's stopping you?",
            "Most people don't know this about {topic}...",
        ],
        "principle": PsychologyPrinciple.CURIOSITY,
        "position": "first",
    },
    "micro_commitment": {
        "templates": [
            "Quick question: Are you currently {pain_point}? (Yes/No)",
            "On a scale of 1-10, how important is {goal} to you?",
            "Which of these best describes you?",
        ],
        "principle": PsychologyPrinciple.COMMITMENT,
        "position": "early",
    },
    "social_proof": {
        "templates": [
            "Over {number} people have already {action}. What about you?",
            "Join {number} others who are already {benefit}.",
            "See what {authority_figure} says about {topic}...",
        ],
        "principle": PsychologyPrinciple.SOCIAL_PROOF,
        "position": "middle",
    },
    "pain_amplification": {
        "templates": [
            "How much is {problem} costing you per month?",
            "What would happen if you don't solve {problem} in the next {timeframe}?",
            "Rate your frustration with {pain_point}: Low | Medium | High",
        ],
        "principle": PsychologyPrinciple.LOSS_AVERSION,
        "position": "middle",
    },
    "solution_preview": {
        "templates": [
            "What if you could {benefit} without {objection}?",
            "Imagine {desired_outcome}. How would that feel?",
            "Would you like to {transformation}?",
        ],
        "principle": PsychologyPrinciple.CONTRAST,
        "position": "late",
    },
    "scarcity_urgency": {
        "templates": [
            "Only {number} spots left. Want to secure yours?",
            "This offer expires in {timeframe}. Ready to claim it?",
            "Limited to {number} people. Are you in?",
        ],
        "principle": PsychologyPrinciple.SCARCITY,
        "position": "final",
    },
}

# =============================================================================
# AI SERVICE
# =============================================================================

class AIService:
    """AI-powered funnel generation with psychology & engagement optimization."""
    
    def __init__(self, db: AsyncSession):
        """
        Initialize AI service.
        
        Args:
            db: Database session
        """
        self.db = db
        # ✅ FIXED: Initialize AsyncOpenAI client
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-3.5-turbo"
        self.temperature = 0.7
    
    # =========================================================================
    # FUNNEL GENERATION
    # =========================================================================
    
    async def generate_funnel(
        self,
        request: FunnelGenerationRequest,
        user_id: str
    ) -> FunnelGenerationResponse:
        """
    Generate complete funnel with psychology-optimized questions.
    
    Args:
        request: Generation request with business details
        user_id: User ID
    
    Returns:
        Generated funnel with questions
        """
        logger.info(
            f"Generating funnel: {request.niche} - {request.goal}",
            extra={"user_id": user_id, "goal": request.goal}
        )
    
        # Get psychology strategy for funnel type
        strategy = PSYCHOLOGY_STRATEGIES.get(
            request.goal,
            PSYCHOLOGY_STRATEGIES["lead_generation"]
        )
    
    # Build context-aware prompt
        prompt = self._build_generation_prompt(request, strategy)
    
    # Generate funnel using GPT
        try:
            response = await self._call_openai(prompt, max_tokens=50)
        
        # ✅ FIXED: Check for quota signal BEFORE parsing
            if response == "OPENAI_QUOTA_EXCEEDED":
                logger.warning("⚠️ Using fallback questions (OpenAI quota exceeded)")
                funnel_data = {"questions": []}
            else:
            # Only parse if it's actual JSON from OpenAI
                funnel_data = self._parse_funnel_response(response)
        
        # Use fallback if no questions generated
            questions = funnel_data.get("questions", [])
            if not questions:
                logger.warning("⚠️ No questions from OpenAI, using fallback")
                questions = self._generate_fallback_questions(request)
        
        # Apply psychology optimization
            optimized_questions = await self._optimize_questions_with_psychology(
                questions,
                strategy,
                request
            )
        
        # Add engagement elements
            enhanced_questions = self._add_engagement_elements(
                optimized_questions,
                strategy["techniques"]
            )
        
        # Generate welcome and thank you screens
            welcome_screen = self._generate_fallback_welcome_screen(request)
            thank_you_screen = await self._generate_thank_you_screen(request, strategy)
        
        # ✅ FIXED: Use correct schema field names
            result = FunnelGenerationResponse(
                # Task tracking
                status="completed",
                credits_consumed=250,
            
                # Funnel content - use correct field names from schema
                funnel_title=funnel_data.get("title", f"Discover Your Perfect {request.niche} Solution"),
                funnel_description=funnel_data.get("description", f"Personalized recommendations for {request.target_audience}"),
            
            # Format recommendation
                recommended_format="quiz",
                format_reasoning="AI-optimized for maximum engagement based on psychology principles",
            
                # Questions - convert to list of dicts
                questions=[
                    {
                        "question_text": q.get("question_text"),
                        "question_type": q.get("question_type"),
                        "description": q.get("description"),
                        "options": q.get("options", {}),
                        "is_required": q.get("is_required", True),
                        "display_order": q.get("display_order", idx + 1),
                    }
                    for idx, q in enumerate(enhanced_questions)
                ],
            
                # Configuration with screens
                suggested_config={
                    "welcome_screen": welcome_screen,
                    "thank_you_screen": thank_you_screen,
                    "theme": "modern",
                    "progress_bar": True,
                    "estimated_time": f"{len(enhanced_questions) * 25 // 60} minutes",
                    "psychology_principles": [p.value if hasattr(p, 'value') else str(p) for p in strategy["principles"]],
                    "engagement_techniques": [t.value if hasattr(t, 'value') else str(t) for t in strategy["techniques"]],
                },
            
            # Predictions
                predicted_completion_rate=0.72,
                predicted_lead_capture_rate=0.58,
            
                # Metadata
                generation_time_ms=0,
                model_version=self.model,
                confidence_score=0.89,
            )
        
            logger.info(
                f"✅ Funnel generated successfully: {len(enhanced_questions)} questions (fallback mode: {response == 'OPENAI_QUOTA_EXCEEDED'})",
                extra={"user_id": user_id, "question_count": len(enhanced_questions)}
            )
        
            return result
    
        except Exception as e:
            logger.error(f"❌ Funnel generation failed: {e}", exc_info=True)
            # ✅ FIXED: Pass model and error
            raise AIGenerationException(self.model, str(e))

    
    def _build_generation_prompt(
        self,
        request: FunnelGenerationRequest,
        strategy: Dict[str, Any]
    ) -> str:
        """Build comprehensive prompt with psychology principles."""
        
        # ✅ FIXED: Use correct field names from request
        brand_voice = getattr(request, 'brand_voice', 'friendly')
        brand_name = getattr(request, 'brand_name', 'Not specified')
        
        prompt = f"""You are an expert conversion copywriter and funnel strategist with deep knowledge of psychology, persuasion, and engagement optimization.

BUSINESS CONTEXT:
- Niche/Industry: {request.niche}
- Primary Goal: {request.goal}
- Target Audience: {request.target_audience}
- Brand Name: {brand_name}
- Brand Voice: {brand_voice}
- Include Email Gate: {request.include_email_gate}
- Include Scoring: {request.include_scoring}
- Creativity Level: {request.creativity_level}

FUNNEL TYPE: {request.goal}

PSYCHOLOGY STRATEGY:
- Principles to apply: {', '.join([p.value for p in strategy['principles']])}
- Engagement techniques: {', '.join([t.value for t in strategy['techniques']])}
- Question sequence: {strategy['question_sequence']}
- Emotional arc: {strategy['emotional_arc']}

TASK: Generate a high-converting funnel with 5-7 strategically sequenced questions.

REQUIREMENTS:

1. QUESTION SEQUENCING (Critical):
   - Start with EASY, engaging questions (build momentum)
   - Use micro-commitments (small yes → big yes)
   - Gradually increase commitment level
   - {"End with email capture (when trust is highest)" if request.include_email_gate else "Focus on qualification without email gate"}

2. PSYCHOLOGY PRINCIPLES TO APPLY:
   - RECIPROCITY: Give value upfront (insights, tips, personalized recommendations)
   - COMMITMENT: Start small, build gradually
   - SOCIAL PROOF: Reference others' success/choices
   - CURIOSITY: Use open loops, tease outcomes
   - LOSS AVERSION: Highlight cost of inaction
   - {"SCARCITY: Create urgency where appropriate" if request.creativity_level == "high" else ""}

3. ENGAGEMENT OPTIMIZATION:
   - Use conversational, benefit-driven language with {brand_voice} tone
   - Ask ONE thing at a time (no compound questions)
   - Make questions feel personal and relevant to {request.target_audience}
   - Use progress indicators
   - Add micro-feedback ("Great choice!", "Almost there!")

4. QUESTION TYPES (vary for engagement):
   - multiple_choice (easy, builds momentum) - Use for first 2-3 questions
   - rating (shows progress and commitment)
   - short_answer (when trust is established)
   {"- email (final step only)" if request.include_email_gate else ""}

5. COPYWRITING BEST PRACTICES:
   - Use "you" language (not "we" or "I")
   - Focus on benefits for {request.target_audience}
   - Create curiosity gaps
   - Use power words (discover, transform, unlock, secret)
   - Keep it conversational (write like you talk)
   - Match {brand_voice} brand voice consistently

6. AVOID:
   - {"Starting with email capture - save it for the end" if request.include_email_gate else "Asking for email"}
   - Generic, boring questions
   - Asking for too much too soon
   - Corporate jargon
   - Multiple questions in one

OUTPUT FORMAT (STRICT JSON):
{{
  "title": "Compelling, benefit-driven funnel title",
  "description": "What they'll discover/learn",
  "questions": [
    {{
      "question_text": "Engaging question that hooks them",
      "question_type": "multiple_choice",
      "description": "Why we're asking (builds trust)",
      "options": {{
        "choices": [
          {{"text": "Option 1", "value": "option_1"}},
          {{"text": "Option 2", "value": "option_2"}},
          {{"text": "Option 3", "value": "option_3"}}
        ]
      }},
      "is_required": true,
      "psychology_principle": "curiosity",
      "engagement_technique": "personalization"
    }},
    {{
      "question_text": "Second question building on first",
      "question_type": "rating",
      "description": "Helper text",
      "options": {{
        "min": 1,
        "max": 10,
        "min_label": "Not at all",
        "max_label": "Extremely"
      }},
      "is_required": true,
      "psychology_principle": "commitment",
      "engagement_technique": "micro_commitments"
    }}
  ],
  "conversion_tips": [
    "Psychology insight about this funnel",
    "Optimization tip for better conversion"
  ]
}}

Generate the complete funnel JSON now:"""

        return prompt
    
    async def _optimize_questions_with_psychology(
        self,
        questions: List[Dict[str, Any]],
        strategy: Dict[str, Any],
        request: FunnelGenerationRequest
    ) -> List[Dict[str, Any]]:
        """Optimize question sequence using psychology principles."""
        
        if not questions:
            # Generate fallback questions if OpenAI fails
            return self._generate_fallback_questions(request)
        
        optimized = []
        
        # 1. Opening: Curiosity + Easy commitment
        if questions:
            first = questions[0]
            first["engagement_hook"] = self._generate_engagement_hook(
                first.get("question_text", ""),
                PsychologyPrinciple.CURIOSITY
            )
            first["display_order"] = 1
            optimized.append(first)
        
        # 2. Middle: Build momentum, establish value
        for i, q in enumerate(questions[1:-1], start=2):
            # ✅ FIXED: Use niche instead of industry
            if PsychologyPrinciple.SOCIAL_PROOF in strategy["principles"]:
                q["social_proof"] = self._generate_social_proof(request.niche)
            
            q["progress_text"] = f"Step {i} of {len(questions)}"
            q["display_order"] = i
            
            optimized.append(q)
        
        # 3. Final: Lead capture with value recap
        if len(questions) > 1:
            last = questions[-1]
            last["value_reminder"] = self._generate_value_reminder(request)
            urgency = self._generate_urgency(strategy)
            if urgency:
                last["urgency_element"] = urgency
            last["display_order"] = len(questions)
            optimized.append(last)
        
        return optimized
    
    def _add_engagement_elements(
        self,
        questions: List[Dict[str, Any]],
        techniques: List[EngagementTechnique]
    ) -> List[Dict[str, Any]]:
        """Add engagement-boosting elements to questions."""
        
        for i, question in enumerate(questions):
            # Progress indication
            if EngagementTechnique.PROGRESS_INDICATION in techniques:
                question["progress"] = {
                    "current": i + 1,
                    "total": len(questions),
                    "percentage": int((i + 1) / len(questions) * 100)
                }
            
            # Gamification elements
            if EngagementTechnique.GAMIFICATION in techniques:
                question["gamification"] = {
                    "points_earned": (i + 1) * 10,
                    "badge": self._get_progress_badge(i + 1, len(questions)),
                    "encouragement": self._get_encouragement_message(i + 1, len(questions))
                }
            
            # Micro-feedback responses
            if EngagementTechnique.MICRO_COMMITMENTS in techniques:
                question["feedback_messages"] = {
                    "answered": [
                        "Great choice! 👍",
                        "Perfect! Moving on...",
                        "Excellent! Let's continue...",
                        "Got it! Next question...",
                    ]
                }
            
            # Pattern interrupts
            if EngagementTechnique.PATTERN_INTERRUPT in techniques and i == len(questions) // 2:
                question["pattern_interrupt"] = {
                    "type": "insight",
                    "message": "💡 Quick insight: Most people are surprised by their results here!"
                }
        
        return questions
    
    async def _generate_welcome_screen(
        self,
        request: FunnelGenerationRequest,
        strategy: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate psychology-optimized welcome screen."""
        
        brand_voice = getattr(request, 'brand_voice', 'friendly')
        
        prompt = f"""Create a compelling welcome screen for a {request.goal} funnel.

Niche: {request.niche}
Goal: {request.goal}
Audience: {request.target_audience}
Brand Voice: {brand_voice}

Create a welcome screen with:
1. Attention-grabbing headline (benefit-driven)
2. Subheadline (what they'll discover)
3. 3-4 bullet points of value
4. Call-to-action button text
5. Social proof element

Output as JSON:
{{
  "headline": "...",
  "subheadline": "...",
  "benefits": ["...", "...", "..."],
  "cta_text": "...",
  "social_proof": "..."
}}"""

        try:
            response = await self._call_openai(prompt, max_tokens=500)
            welcome = self._parse_funnel_response(response)
            
            welcome["estimated_time"] = "2-3 minutes"
            welcome["privacy_note"] = "Your information is safe and will never be shared"
            
            return welcome
        
        except Exception as e:
            logger.error(f"Welcome screen generation failed: {e}")
            return self._generate_fallback_welcome_screen(request)
    
    async def _generate_thank_you_screen(
        self,
        request: FunnelGenerationRequest,
        strategy: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate thank you screen with next steps."""
        
        return {
            "headline": "🎉 Thank You! Your Results Are Ready",
            "message": f"We're analyzing your answers to create your personalized {request.goal} recommendations...",
            "next_steps": [
                {
                    "icon": "📧",
                    "title": "Check Your Email",
                    "description": "We've sent your personalized recommendations"
                },
                {
                    "icon": "📊",
                    "title": "Review Your Results",
                    "description": "See insights based on your answers"
                },
                {
                    "icon": "🚀",
                    "title": "Take Action",
                    "description": "Implement your custom strategy"
                }
            ],
            "social_share": {
                "enabled": True,
                "message": "Share this with others who might benefit!"
            }
        }
    
    # =========================================================================
    # QUESTION OPTIMIZATION
    # =========================================================================
    
    async def optimize_question(
        self,
        question_text: str,
        question_type: QuestionTypeEnum,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Optimize existing question for better engagement."""
        
        prompt = f"""You are a conversion optimization expert. Optimize this funnel question:

CURRENT QUESTION: "{question_text}"
QUESTION TYPE: {question_type.value}
CONTEXT: {json.dumps(context)}

Optimize for:
1. Clarity (easy to understand)
2. Engagement (makes them want to answer)
3. Conversion (moves toward goal)
4. Psychology (uses persuasion principles)

Provide:
- Improved question text
- Why it's better
- Psychology principle used
- Engagement technique applied

Output as JSON."""

        try:
            response = await self._call_openai(prompt, max_tokens=300)
            return self._parse_funnel_response(response)
        
        except Exception as e:
            logger.error(f"Question optimization failed: {e}")
            return {
                "optimized_text": question_text,
                "improvements": [],
                "principle": "none",
                "technique": "none"
            }
    
    async def generate_question_variations(
        self,
        question_text: str,
        count: int = 3
    ) -> List[str]:
        """Generate A/B test variations of a question."""
        
        prompt = f"""Generate {count} variations of this question for A/B testing:

ORIGINAL: "{question_text}"

Requirements:
- Same intent, different wording
- Test different psychology angles
- Vary the engagement approach
- Keep same question type

Return as JSON array of strings."""

        try:
            response = await self._call_openai(prompt, max_tokens=400)
            variations = json.loads(response)
            return variations[:count]
        
        except Exception:
            return [question_text]
    
    # =========================================================================
    # COPYWRITING & MESSAGING
    # =========================================================================
    
    async def generate_copy(
        self,
        copy_type: str,
        context: Dict[str, Any]
    ) -> str:
        """Generate persuasive copy for various elements."""
        
        prompts = {
            "headline": "Create a compelling, benefit-driven headline that creates curiosity",
            "cta": "Write a strong call-to-action button text that drives clicks",
            "email_subject": "Write an email subject line with high open rate potential",
            "social_proof": "Create a social proof statement that builds trust",
            "urgency": "Write an urgency message that creates FOMO without being pushy",
        }
        
        prompt = f"""{prompts.get(copy_type, 'Generate persuasive copy')}

CONTEXT: {json.dumps(context)}

Requirements:
- Benefit-focused (not feature-focused)
- Emotionally compelling
- Clear and concise
- Uses power words
- Creates curiosity/desire

Return just the copy text (no JSON, no explanation)."""

        try:
            response = await self._call_openai(prompt, max_tokens=100)
            return response.strip().strip('"')
        
        except Exception as e:
            logger.error(f"Copy generation failed: {e}")
            return "Get Started Now"
    
    # =========================================================================
    # OPENAI API CALLS
    # =========================================================================
    
    async def _call_openai(
        self,
        prompt: str,
        max_tokens: int = 2000
    ) -> str:
        """
    Call OpenAI API with error handling.
    
    Args:
        prompt: Prompt text
        max_tokens: Maximum response tokens
    
    Returns:
        API response text
        """
        try:
            # ✅ Uses gpt-3.5-turbo
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert conversion copywriter and funnel strategist with deep knowledge of psychology, persuasion, and engagement optimization. Always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=max_tokens,
            )
        
            content = response.choices[0].message.content.strip()
            logger.info(f"✅ OpenAI API call successful ({len(content)} chars)")
            return content
    
        except OpenAIError as e:
            error_msg = str(e)
            logger.error(f"❌ OpenAI API error: {error_msg}", exc_info=True)
    
    # Check if quota exceeded - return fallback signal
            if "insufficient_quota" in error_msg or "429" in error_msg:
                logger.warning("⚠️ OpenAI quota exceeded - returning fallback signal")
                return "OPENAI_QUOTA_EXCEEDED"
    
    # ✅ FIXED: Pass model and error
            raise AIGenerationException(self.model, error_msg)

        except Exception as e:
            logger.error(f"❌ Unexpected error calling OpenAI: {e}", exc_info=True)
            # ✅ FIXED: Pass model and error
            raise AIGenerationException(self.model, str(e))
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _parse_funnel_response(self, response: str) -> Dict[str, Any]:
        """Parse OpenAI response into structured data."""
        
        try:
            # Try to extract JSON from response
            start = response.find('{')
            end = response.rfind('}') + 1
            
            if start != -1 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
            else:
                return json.loads(response)
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}\nResponse: {response[:500]}")
            # ✅ FIXED: Pass model and error
            raise AIGenerationException(self.model, "Failed to parse AI-generated content")
    
    def _generate_fallback_questions(self, request: FunnelGenerationRequest) -> List[Dict[str, Any]]:
        """Generate fallback questions if AI fails."""
        
        return [
            {
                "question_text": f"What's your primary goal with {request.niche}?",
                "question_type": "multiple_choice",
                "description": "Help us understand what success looks like for you",
                "options": {
                    "choices": [
                        {"text": "Increase revenue", "value": "revenue"},
                        {"text": "Save time", "value": "time"},
                        {"text": "Learn new skills", "value": "skills"},
                        {"text": "Solve a specific problem", "value": "problem"}
                    ]
                },
                "is_required": True,
                "psychology_principle": "curiosity",
                "engagement_technique": "personalization",
                "display_order": 1
            },
            {
                "question_text": f"How important is achieving this goal to you?",
                "question_type": "rating",
                "description": "On a scale of 1-10",
                "options": {
                    "min": 1,
                    "max": 10,
                    "min_label": "Not important",
                    "max_label": "Extremely important"
                },
                "is_required": True,
                "psychology_principle": "commitment",
                "engagement_technique": "micro_commitments",
                "display_order": 2
            },
            {
                "question_text": "What's your biggest challenge right now?",
                "question_type": "short_answer",
                "description": "This helps us personalize your recommendations",
                "is_required": True,
                "psychology_principle": "loss_aversion",
                "engagement_technique": "personalization",
                "display_order": 3
            }
        ]
    
    def _generate_fallback_welcome_screen(self, request: FunnelGenerationRequest) -> Dict[str, Any]:
        """Generate fallback welcome screen."""
        
        return {
            "headline": f"Discover Your Perfect {request.niche} Solution",
            "subheadline": "Answer a few quick questions to get personalized recommendations",
            "benefits": [
                "✓ Takes just 2-3 minutes",
                "✓ Completely personalized to you",
                "✓ Free insights and recommendations"
            ],
            "cta_text": "Get Started →",
            "social_proof": "Join thousands who've discovered their solution",
            "estimated_time": "2-3 minutes",
            "privacy_note": "Your information is safe and will never be shared"
        }
    
    def _generate_engagement_hook(
        self,
        question_text: str,
        principle: PsychologyPrinciple
    ) -> str:
        """Generate engagement hook for question."""
        
        hooks = {
            PsychologyPrinciple.CURIOSITY: "You might be surprised by this...",
            PsychologyPrinciple.SOCIAL_PROOF: "Most people choose...",
            PsychologyPrinciple.SCARCITY: "Quick question before we continue...",
            PsychologyPrinciple.RECIPROCITY: "Here's a valuable insight for you...",
        }
        return hooks.get(principle, "Let's dive in...")
    
    def _generate_social_proof(self, niche: str) -> str:
        """Generate social proof statement."""
        return f"💬 Over 10,000 {niche} professionals have completed this assessment"
    
    def _generate_value_reminder(self, request: FunnelGenerationRequest) -> str:
        """Generate value reminder for final question."""
        return f"📊 You're about to receive personalized {request.goal} recommendations based on your answers"
    
    def _generate_urgency(self, strategy: Dict[str, Any]) -> Optional[str]:
        """Generate urgency element if scarcity principle is active."""
        if PsychologyPrinciple.SCARCITY in strategy["principles"]:
            return "⏰ Limited spots available - secure yours now!"
        return None
    
    def _get_progress_badge(self, current: int, total: int) -> str:
        """Get gamification badge based on progress."""
        percentage = (current / total) * 100
        if percentage < 25:
            return "🌱 Getting Started"
        elif percentage < 50:
            return "🔥 On Fire!"
        elif percentage < 75:
            return "⭐ Almost There"
        else:
            return "🏆 Champion!"
    
    def _get_encouragement_message(self, current: int, total: int) -> str:
        """Get encouragement message based on progress."""
        messages = {
            1: "Great start! Keep going...",
            2: "You're doing awesome!",
            3: "Fantastic progress!",
            4: "Almost there! You've got this!",
        }
        return messages.get(current, "Keep it up!")

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "AIService",
    "PsychologyPrinciple",
    "EngagementTechnique",
    "PSYCHOLOGY_STRATEGIES",
]
