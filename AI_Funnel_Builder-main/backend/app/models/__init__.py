# app/models/__init__.py
"""
Central import point for all models. Uses TYPE_CHECKING to prevent circular imports.
"""

from typing import TYPE_CHECKING

# Core base classes (import FIRST - no dependencies)
from app.core.database import Base

# Enums (no relationships)
from .question import QuestionTypeEnum, QuestionRequirementEnum
from .response import ResponseStatusEnum, DeviceTypeEnum
from .subscription import (
    SubscriptionTierEnum, SubscriptionStatusEnum, BillingIntervalEnum,
    CancellationReasonEnum, PaymentStatusEnum, PaymentTypeEnum, CouponTypeEnum
)
from .template import (
    TemplateStatusEnum, TemplateCategoryEnum, PricingModelEnum
)
# NEW: Project and Group enums
from .project import IndustryEnum, BrandVoiceEnum
from .group import GroupTypeEnum, GroupStatusEnum


if TYPE_CHECKING:
    # Models with relationships
    from .user import User
    from .project import Project  # NEW
    from .group import FunnelGroup  # NEW
    from .funnel import Funnel
    from .question import Question
    from .response_answer import ResponseAnswer
    from .response import Response
    from .subscription import Subscription, Payment, Coupon, SubscriptionUsage
    from .template import Template, TemplateQuestion
    from .event import Event


__all__ = [
    # Base classes
    "Base", "BaseTimestampMixin", "BaseUUIDMixin", "BaseSoftDeleteMixin",
    
    # Enums - Core
    "QuestionTypeEnum", "QuestionRequirementEnum",
    "ResponseStatusEnum", "DeviceTypeEnum",
    
    # Enums - Subscription
    "SubscriptionTierEnum", "SubscriptionStatusEnum", "BillingIntervalEnum",
    "CancellationReasonEnum", "PaymentStatusEnum", "PaymentTypeEnum", "CouponTypeEnum",
    
    # Enums - Template
    "TemplateStatusEnum", "TemplateCategoryEnum", "PricingModelEnum",
    
    # Enums - Projects & Groups (NEW)
    "IndustryEnum", "BrandVoiceEnum",
    "GroupTypeEnum", "GroupStatusEnum",
    
    # Models - User & Auth
    "User",
    
    # Models - Hierarchy (NEW - in order of hierarchy)
    "Project",      # Top level: Brand/Business
    "FunnelGroup",  # Mid level: Product/Category/Campaign
    "Funnel",       # Bottom level: Quiz/Survey/Form
    
    # Models - Funnel Content
    "Question", "ResponseAnswer", "Response",
    
    # Models - Monetization
    "Subscription", "Payment", "Coupon", "SubscriptionUsage",
    
    # Models - Templates & Events
    "Template", "TemplateQuestion", "Event"
]
