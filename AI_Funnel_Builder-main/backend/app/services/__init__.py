# =============================================================================
# AI FUNNEL BUILDER - SERVICES MODULE
# =============================================================================
# Business logic services
# =============================================================================

"""
Services module providing business logic:
- Authentication & authorization
- User management
- Funnel operations
- Lead management
- Analytics & reporting
- Template management
- Third-party integrations
- Payment processing
- AI content generation
"""

from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.funnel_service import FunnelService
from app.services.lead_service import LeadService
from app.services.analytics_service import AnalyticsService
from app.services.template_service import TemplateService
from app.services.integration_service import IntegrationService
from app.services.payment_service import PaymentService
from app.services.ai_service import AIService
from app.services.email_service import EmailService

__all__ = [
    "AuthService",
    "UserService",
    "FunnelService",
    "LeadService",
    "AnalyticsService",
    "TemplateService",
    "IntegrationService",
    "PaymentService",
    "AIService",
    "EmailService",
]
