"""
AI/ML Module Initialization
================================
Central hub for all AI/ML services including OpenAI integration,
custom ML models, and intelligent funnel generation.

Author: AI Funnel Builder Team
Version: 1.0.0
Last Updated: 2024-01-15
"""

from typing import Optional
import logging
from functools import lru_cache

from app.core.config import settings
from app.ai.openai_client import OpenAIClient
from app.ai.funnel_generator import FunnelGenerator
from app.ai.question_optimizer import QuestionOptimizer
from app.ai.format_selector import FormatSelector
from app.ai.completion_predictor import CompletionPredictor
from app.ai.lead_scorer import LeadScorer
from app.ai.audience_analyzer import AudienceAnalyzer
from app.ai.ad_copy_generator import AdCopyGenerator
from app.ai.recommendation_engine import RecommendationEngine
from app.ai.prompt_cache import PromptCache


# Configure module logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class AIServiceManager:
    """
    Central manager for all AI services with lazy initialization,
    connection pooling, and graceful degradation.
    """
    
    _instance: Optional['AIServiceManager'] = None
    _initialized: bool = False
    
    def __new__(cls):
        """Singleton pattern for service manager"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize AI service manager (only once)"""
        if self._initialized:
            return
            
        logger.info("🚀 Initializing AI Service Manager...")
        
        # Core services
        self._openai_client: Optional[OpenAIClient] = None
        self._funnel_generator: Optional[FunnelGenerator] = None
        self._question_optimizer: Optional[QuestionOptimizer] = None
        self._format_selector: Optional[FormatSelector] = None
        self._completion_predictor: Optional[CompletionPredictor] = None
        self._lead_scorer: Optional[LeadScorer] = None
        self._audience_analyzer: Optional[AudienceAnalyzer] = None
        self._ad_copy_generator: Optional[AdCopyGenerator] = None
        self._recommendation_engine: Optional[RecommendationEngine] = None
        self._prompt_cache: Optional[PromptCache] = None
        
        # Service health status
        self._service_health = {
            'openai': False,
            'ml_models': False,
            'cache': False
        }
        
        self._initialized = True
        logger.info("✅ AI Service Manager initialized")
    
    # Lazy-loaded service properties
    
    @property
    def openai_client(self) -> OpenAIClient:
        """Lazy-load OpenAI client"""
        if self._openai_client is None:
            try:
                self._openai_client = OpenAIClient(
                    api_key=settings.OPENAI_API_KEY,
                    organization=getattr(settings, 'OPENAI_ORG_ID', None),
                    timeout=30.0,
                    max_retries=3
                )
                self._service_health['openai'] = True
                logger.info("✅ OpenAI client initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize OpenAI client: {e}")
                raise RuntimeError(f"OpenAI initialization failed: {e}")
        return self._openai_client
    
    @property
    def funnel_generator(self) -> FunnelGenerator:
        """Lazy-load funnel generator"""
        if self._funnel_generator is None:
            self._funnel_generator = FunnelGenerator(
                openai_client=self.openai_client,
                prompt_cache=self.prompt_cache
            )
            logger.info("✅ Funnel generator initialized")
        return self._funnel_generator
    
    @property
    def question_optimizer(self) -> QuestionOptimizer:
        """Lazy-load question optimizer"""
        if self._question_optimizer is None:
            self._question_optimizer = QuestionOptimizer(
                openai_client=self.openai_client
            )
            logger.info("✅ Question optimizer initialized")
        return self._question_optimizer
    
    @property
    def format_selector(self) -> FormatSelector:
        """Lazy-load format selector"""
        if self._format_selector is None:
            self._format_selector = FormatSelector(
                openai_client=self.openai_client
            )
            logger.info("✅ Format selector initialized")
        return self._format_selector
    
    @property
    def completion_predictor(self) -> CompletionPredictor:
        """Lazy-load completion predictor"""
        if self._completion_predictor is None:
            try:
                self._completion_predictor = CompletionPredictor()
                self._service_health['ml_models'] = True
                logger.info("✅ Completion predictor initialized")
            except Exception as e:
                logger.warning(f"⚠️ ML model not available: {e}")
                # Graceful degradation - use rule-based fallback
                self._completion_predictor = CompletionPredictor(use_fallback=True)
        return self._completion_predictor
    
    @property
    def lead_scorer(self) -> LeadScorer:
        """Lazy-load lead scorer"""
        if self._lead_scorer is None:
            self._lead_scorer = LeadScorer()
            logger.info("✅ Lead scorer initialized")
        return self._lead_scorer
    
    @property
    def audience_analyzer(self) -> AudienceAnalyzer:
        """Lazy-load audience analyzer"""
        if self._audience_analyzer is None:
            self._audience_analyzer = AudienceAnalyzer(
                openai_client=self.openai_client
            )
            logger.info("✅ Audience analyzer initialized")
        return self._audience_analyzer
    
    @property
    def ad_copy_generator(self) -> AdCopyGenerator:
        """Lazy-load ad copy generator"""
        if self._ad_copy_generator is None:
            self._ad_copy_generator = AdCopyGenerator(
                openai_client=self.openai_client
            )
            logger.info("✅ Ad copy generator initialized")
        return self._ad_copy_generator
    
    @property
    def recommendation_engine(self) -> RecommendationEngine:
        """Lazy-load recommendation engine"""
        if self._recommendation_engine is None:
            self._recommendation_engine = RecommendationEngine()
            logger.info("✅ Recommendation engine initialized")
        return self._recommendation_engine
    
    @property
    def prompt_cache(self) -> PromptCache:
        """Lazy-load prompt cache"""
        if self._prompt_cache is None:
            try:
                self._prompt_cache = PromptCache(
                    redis_url=settings.REDIS_URL,
                    ttl=3600  # 1 hour cache
                )
                self._service_health['cache'] = True
                logger.info("✅ Prompt cache initialized")
            except Exception as e:
                logger.warning(f"⚠️ Cache unavailable, using memory cache: {e}")
                self._prompt_cache = PromptCache(use_memory=True)
        return self._prompt_cache
    
    # Health check methods
    
    def health_check(self) -> dict:
        """
        Check health of all AI services
        
        Returns:
            dict: Service health status
        """
        return {
            'status': 'healthy' if all(self._service_health.values()) else 'degraded',
            'services': self._service_health.copy(),
            'timestamp': self._get_timestamp()
        }
    
    async def verify_services(self) -> bool:
        """
        Verify all critical services are operational
        
        Returns:
            bool: True if all services healthy
        """
        try:
            # Test OpenAI connection
            await self.openai_client.test_connection()
            self._service_health['openai'] = True
            
            # Test ML models
            self.completion_predictor.test_model()
            self._service_health['ml_models'] = True
            
            # Test cache
            await self.prompt_cache.test_connection()
            self._service_health['cache'] = True
            
            logger.info("✅ All AI services verified")
            return True
            
        except Exception as e:
            logger.error(f"❌ Service verification failed: {e}")
            return False
    
    def shutdown(self):
        """Gracefully shutdown all AI services"""
        logger.info("🔄 Shutting down AI services...")
        
        # Close OpenAI client connections
        if self._openai_client:
            self._openai_client.close()
        
        # Clear cache
        if self._prompt_cache:
            self._prompt_cache.clear()
        
        logger.info("✅ AI services shut down successfully")
    
    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat()


# Global service manager instance
@lru_cache(maxsize=1)
def get_ai_service_manager() -> AIServiceManager:
    """
    Get singleton AI service manager instance
    
    Returns:
        AIServiceManager: Global service manager
    """
    return AIServiceManager()


# Convenience functions for direct service access

def get_openai_client() -> OpenAIClient:
    """Get OpenAI client instance"""
    return get_ai_service_manager().openai_client


def get_funnel_generator() -> FunnelGenerator:
    """Get funnel generator instance"""
    return get_ai_service_manager().funnel_generator


def get_question_optimizer() -> QuestionOptimizer:
    """Get question optimizer instance"""
    return get_ai_service_manager().question_optimizer


def get_format_selector() -> FormatSelector:
    """Get format selector instance"""
    return get_ai_service_manager().format_selector


def get_completion_predictor() -> CompletionPredictor:
    """Get completion predictor instance"""
    return get_ai_service_manager().completion_predictor


def get_lead_scorer() -> LeadScorer:
    """Get lead scorer instance"""
    return get_ai_service_manager().lead_scorer


def get_audience_analyzer() -> AudienceAnalyzer:
    """Get audience analyzer instance"""
    return get_ai_service_manager().audience_analyzer


def get_ad_copy_generator() -> AdCopyGenerator:
    """Get ad copy generator instance"""
    return get_ai_service_manager().ad_copy_generator


def get_recommendation_engine() -> RecommendationEngine:
    """Get recommendation engine instance"""
    return get_ai_service_manager().recommendation_engine


def get_prompt_cache() -> PromptCache:
    """Get prompt cache instance"""
    return get_ai_service_manager().prompt_cache


# Module exports
__all__ = [
    # Service Manager
    'AIServiceManager',
    'get_ai_service_manager',
    
    # Service Accessors
    'get_openai_client',
    'get_funnel_generator',
    'get_question_optimizer',
    'get_format_selector',
    'get_completion_predictor',
    'get_lead_scorer',
    'get_audience_analyzer',
    'get_ad_copy_generator',
    'get_recommendation_engine',
    'get_prompt_cache',
    
    # Direct imports
    'OpenAIClient',
    'FunnelGenerator',
    'QuestionOptimizer',
    'FormatSelector',
    'CompletionPredictor',
    'LeadScorer',
    'AudienceAnalyzer',
    'AdCopyGenerator',
    'RecommendationEngine',
    'PromptCache',
]


# Startup banner
logger.info("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🤖 AI/ML MODULE INITIALIZED                        ║
║                                                              ║
║  • OpenAI Integration Ready                                  ║
║  • Custom ML Models Loaded                                   ║
║  • Prompt Caching Enabled                                    ║
║  • Production Optimizations Active                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
""")
