# =============================================================================
# AI FUNNEL BUILDER - PAYMENT SERVICE
# =============================================================================
# Stripe payment and subscription management
# =============================================================================

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_

from app.models.user import User
from app.models.subscription import (
    Subscription,
    SubscriptionTierEnum,
    SubscriptionStatusEnum,
    Payment,
    PaymentStatusEnum,
)
from app.schemas.payment import (
    CheckoutSessionCreate,
    SubscriptionUpdate,
    PaymentMethodUpdate,
)
from app.utils.exceptions import (
    PaymentException,
    SubscriptionNotFoundException,
    ValidationException,
)
from app.utils.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


# =============================================================================
# SUBSCRIPTION PLANS
# =============================================================================

SUBSCRIPTION_PLANS = {
    SubscriptionTierEnum.FREE: {
        "name": "Free",
        "price": 0,
        "funnels_limit": 3,
        "leads_limit": 100,
        "responses_limit": 500,
        "features": [
            "3 Active Funnels",
            "100 Leads/month",
            "Basic Analytics",
            "Email Support",
        ],
    },
    SubscriptionTierEnum.BRAND_STARTER: {
        "name": "Starter",
        "price": 29,
        "price_id": settings.STRIPE_PRICE_ID_STARTER,
        "funnels_limit": 10,
        "leads_limit": 1000,
        "responses_limit": 5000,
        "features": [
            "10 Active Funnels",
            "1,000 Leads/month",
            "Advanced Analytics",
            "Custom Branding",
            "Priority Email Support",
        ],
    },
    SubscriptionTierEnum.PRO: {
        "name": "Professional",
        "price": 79,
        "price_id": settings.STRIPE_PRICE_ID_PRO,
        "funnels_limit": 50,
        "leads_limit": 10000,
        "responses_limit": 50000,
        "features": [
            "50 Active Funnels",
            "10,000 Leads/month",
            "Advanced Analytics & Reports",
            "Custom Branding",
            "CRM Integrations",
            "Custom Domain",
            "Priority Support",
        ],
    },
    SubscriptionTierEnum.ENTERPRISE: {
        "name": "Enterprise",
        "price": 299,
        "price_id": settings.STRIPE_PRICE_ID_ENTERPRISE,
        "funnels_limit": -1,  # Unlimited
        "leads_limit": -1,  # Unlimited
        "responses_limit": -1,  # Unlimited
        "features": [
            "Unlimited Funnels",
            "Unlimited Leads",
            "Advanced Analytics & Custom Reports",
            "White Label",
            "All Integrations",
            "Custom Domains",
            "API Access",
            "Dedicated Support",
            "Custom Contract",
        ],
    },
}


# =============================================================================
# PAYMENT SERVICE
# =============================================================================

class PaymentService:
    """
    Payment and subscription management service.
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize payment service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    # =========================================================================
    # CHECKOUT & SUBSCRIPTION CREATION
    # =========================================================================
    
    async def create_checkout_session(
        self,
        user_id: str,
        tier: SubscriptionTierEnum,
        success_url: str,
        cancel_url: str,
        trial_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create Stripe checkout session for subscription.
        
        Args:
            user_id: User ID
            tier: Subscription tier
            success_url: Redirect URL on success
            cancel_url: Redirect URL on cancel
            trial_days: Number of trial days (optional)
        
        Returns:
            Checkout session data
        """
        # Get user
        user = await self._get_user(user_id)
        
        # Get or create Stripe customer
        customer_id = await self._get_or_create_stripe_customer(user)
        
        # Get plan details
        plan = SUBSCRIPTION_PLANS.get(tier)
        if not plan:
            raise ValidationException(f"Invalid subscription tier: {tier}")
        
        if tier == SubscriptionTierEnum.FREE:
            raise ValidationException("Cannot create checkout for free tier")
        
        # Create checkout session
        try:
            checkout_params = {
                "customer": customer_id,
                "mode": "subscription",
                "line_items": [
                    {
                        "price": plan["price_id"],
                        "quantity": 1,
                    }
                ],
                "success_url": success_url,
                "cancel_url": cancel_url,
                "metadata": {
                    "user_id": user_id,
                    "tier": tier.value,
                },
                "allow_promotion_codes": True,
            }
            
            # Add trial if specified
            if trial_days:
                checkout_params["subscription_data"] = {
                    "trial_period_days": trial_days,
                }
            
            session = stripe.checkout.Session.create(**checkout_params)
            
            logger.info(
                f"Checkout session created: {tier.value}",
                extra={
                    "user_id": user_id,
                    "session_id": session.id,
                    "tier": tier.value,
                }
            )
            
            return {
                "session_id": session.id,
                "url": session.url,
                "customer_id": customer_id,
            }
        
        except stripe.error.StripeError as e:
            logger.error(f"Stripe checkout error: {e}", exc_info=True)
            raise PaymentException(f"Failed to create checkout session: {str(e)}")
    
    async def create_subscription(
        self,
        user_id: str,
        stripe_subscription_id: str,
        tier: SubscriptionTierEnum,
        stripe_customer_id: str,
        current_period_start: datetime,
        current_period_end: datetime,
        status: SubscriptionStatusEnum = SubscriptionStatusEnum.ACTIVE
    ) -> Subscription:
        """
        Create subscription record after successful payment.
        
        Args:
            user_id: User ID
            stripe_subscription_id: Stripe subscription ID
            tier: Subscription tier
            stripe_customer_id: Stripe customer ID
            current_period_start: Period start
            current_period_end: Period end
            status: Subscription status
        
        Returns:
            Created subscription
        """
        # Get plan limits
        plan = SUBSCRIPTION_PLANS[tier]
        
        # Create or update subscription
        existing_sub = await self._get_subscription(user_id)
        
        if existing_sub:
            # Update existing
            subscription = existing_sub
            subscription.tier = tier
            subscription.status = status
            subscription.stripe_subscription_id = stripe_subscription_id
            subscription.stripe_customer_id = stripe_customer_id
            subscription.current_period_start = current_period_start
            subscription.current_period_end = current_period_end
            subscription.funnels_limit = plan["funnels_limit"]
            subscription.leads_limit = plan["leads_limit"]
            subscription.responses_limit = plan["responses_limit"]
        else:
            # Create new
            subscription = Subscription(
                user_id=user_id,
                tier=tier,
                status=status,
                stripe_subscription_id=stripe_subscription_id,
                stripe_customer_id=stripe_customer_id,
                current_period_start=current_period_start,
                current_period_end=current_period_end,
                funnels_limit=plan["funnels_limit"],
                leads_limit=plan["leads_limit"],
                responses_limit=plan["responses_limit"],
            )
            self.db.add(subscription)
        
        await self.db.commit()
        await self.db.refresh(subscription)
        
        logger.info(
            f"Subscription created/updated: {tier.value}",
            extra={
                "user_id": user_id,
                "subscription_id": subscription.subscription_id,
                "tier": tier.value,
            }
        )
        
        return subscription
    
    # =========================================================================
    # SUBSCRIPTION MANAGEMENT
    # =========================================================================
    
    async def get_subscription(self, user_id: str) -> Optional[Subscription]:
        """
        Get user's subscription.
        
        Args:
            user_id: User ID
        
        Returns:
            Subscription or None
        """
        return await self._get_subscription(user_id)
    
    async def update_subscription(
        self,
        user_id: str,
        new_tier: SubscriptionTierEnum
    ) -> Subscription:
        """
        Update subscription tier (upgrade/downgrade).
        
        Args:
            user_id: User ID
            new_tier: New subscription tier
        
        Returns:
            Updated subscription
        """
        subscription = await self._get_subscription(user_id)
        if not subscription:
            raise SubscriptionNotFoundException(user_id)
        
        # Get new plan
        new_plan = SUBSCRIPTION_PLANS[new_tier]
        
        # Update Stripe subscription
        try:
            stripe_subscription = stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                items=[{
                    "id": stripe.Subscription.retrieve(
                        subscription.stripe_subscription_id
                    ).items.data[0].id,
                    "price": new_plan["price_id"],
                }],
                proration_behavior="create_prorations",
            )
            
            # Update local subscription
            subscription.tier = new_tier
            subscription.funnels_limit = new_plan["funnels_limit"]
            subscription.leads_limit = new_plan["leads_limit"]
            subscription.responses_limit = new_plan["responses_limit"]
            
            await self.db.commit()
            await self.db.refresh(subscription)
            
            logger.info(
                f"Subscription updated: {subscription.tier.value} -> {new_tier.value}",
                extra={"user_id": user_id, "subscription_id": subscription.subscription_id}
            )
            
            return subscription
        
        except stripe.error.StripeError as e:
            logger.error(f"Stripe update error: {e}", exc_info=True)
            raise PaymentException(f"Failed to update subscription: {str(e)}")
    
    async def cancel_subscription(
        self,
        user_id: str,
        immediate: bool = False
    ) -> Subscription:
        """
        Cancel subscription.
        
        Args:
            user_id: User ID
            immediate: Cancel immediately (vs. at period end)
        
        Returns:
            Updated subscription
        """
        subscription = await self._get_subscription(user_id)
        if not subscription:
            raise SubscriptionNotFoundException(user_id)
        
        try:
            if immediate:
                # Cancel immediately
                stripe.Subscription.delete(subscription.stripe_subscription_id)
                subscription.status = SubscriptionStatusEnum.CANCELLED
                subscription.cancelled_at = datetime.utcnow()
            else:
                # Cancel at period end
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end=True
                )
                subscription.status = SubscriptionStatusEnum.CANCELLING
                subscription.cancel_at_period_end = True
            
            await self.db.commit()
            await self.db.refresh(subscription)
            
            logger.info(
                f"Subscription cancelled: immediate={immediate}",
                extra={"user_id": user_id, "subscription_id": subscription.subscription_id}
            )
            
            return subscription
        
        except stripe.error.StripeError as e:
            logger.error(f"Stripe cancel error: {e}", exc_info=True)
            raise PaymentException(f"Failed to cancel subscription: {str(e)}")
    
    async def reactivate_subscription(self, user_id: str) -> Subscription:
        """
        Reactivate cancelled subscription.
        
        Args:
            user_id: User ID
        
        Returns:
            Reactivated subscription
        """
        subscription = await self._get_subscription(user_id)
        if not subscription:
            raise SubscriptionNotFoundException(user_id)
        
        try:
            # Remove cancel_at_period_end
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=False
            )
            
            subscription.status = SubscriptionStatusEnum.ACTIVE
            subscription.cancel_at_period_end = False
            
            await self.db.commit()
            await self.db.refresh(subscription)
            
            logger.info(
                f"Subscription reactivated",
                extra={"user_id": user_id, "subscription_id": subscription.subscription_id}
            )
            
            return subscription
        
        except stripe.error.StripeError as e:
            logger.error(f"Stripe reactivate error: {e}", exc_info=True)
            raise PaymentException(f"Failed to reactivate subscription: {str(e)}")
    
    # =========================================================================
    # PAYMENT METHODS
    # =========================================================================
    
    async def get_payment_methods(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get user's payment methods.
        
        Args:
            user_id: User ID
        
        Returns:
            List of payment methods
        """
        subscription = await self._get_subscription(user_id)
        if not subscription or not subscription.stripe_customer_id:
            return []
        
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=subscription.stripe_customer_id,
                type="card",
            )
            
            return [
                {
                    "id": pm.id,
                    "brand": pm.card.brand,
                    "last4": pm.card.last4,
                    "exp_month": pm.card.exp_month,
                    "exp_year": pm.card.exp_year,
                }
                for pm in payment_methods.data
            ]
        
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve payment methods: {e}")
            return []
    
    async def update_payment_method(
        self,
        user_id: str,
        payment_method_id: str
    ) -> bool:
        """
        Update default payment method.
        
        Args:
            user_id: User ID
            payment_method_id: Stripe payment method ID
        
        Returns:
            True if updated
        """
        subscription = await self._get_subscription(user_id)
        if not subscription:
            raise SubscriptionNotFoundException(user_id)
        
        try:
            # Update subscription default payment method
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                default_payment_method=payment_method_id
            )
            
            logger.info(
                f"Payment method updated",
                extra={"user_id": user_id}
            )
            
            return True
        
        except stripe.error.StripeError as e:
            logger.error(f"Failed to update payment method: {e}", exc_info=True)
            raise PaymentException(f"Failed to update payment method: {str(e)}")
    
    # =========================================================================
    # BILLING PORTAL
    # =========================================================================
    
    async def create_billing_portal_session(
        self,
        user_id: str,
        return_url: str
    ) -> str:
        """
        Create Stripe billing portal session.
        
        Args:
            user_id: User ID
            return_url: URL to return to after portal
        
        Returns:
            Portal URL
        """
        subscription = await self._get_subscription(user_id)
        if not subscription or not subscription.stripe_customer_id:
            raise PaymentException("No active subscription found")
        
        try:
            session = stripe.billing_portal.Session.create(
                customer=subscription.stripe_customer_id,
                return_url=return_url,
            )
            
            return session.url
        
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create billing portal: {e}", exc_info=True)
            raise PaymentException(f"Failed to create billing portal: {str(e)}")
    
    # =========================================================================
    # INVOICES & PAYMENTS
    # =========================================================================
    
    async def get_invoices(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get user's invoices.
        
        Args:
            user_id: User ID
            limit: Maximum invoices
        
        Returns:
            List of invoices
        """
        subscription = await self._get_subscription(user_id)
        if not subscription or not subscription.stripe_customer_id:
            return []
        
        try:
            invoices = stripe.Invoice.list(
                customer=subscription.stripe_customer_id,
                limit=limit
            )
            
            return [
                {
                    "id": inv.id,
                    "amount": inv.amount_paid / 100,  # Convert cents to dollars
                    "currency": inv.currency.upper(),
                    "status": inv.status,
                    "created": datetime.fromtimestamp(inv.created),
                    "pdf_url": inv.invoice_pdf,
                    "hosted_url": inv.hosted_invoice_url,
                }
                for inv in invoices.data
            ]
        
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve invoices: {e}")
            return []
    
    async def record_payment(
        self,
        subscription_id: str,
        stripe_payment_id: str,
        amount: Decimal,
        currency: str,
        status: PaymentStatusEnum
    ) -> Payment:
        """
        Record payment in database.
        
        Args:
            subscription_id: Subscription ID
            stripe_payment_id: Stripe payment intent ID
            amount: Payment amount
            currency: Currency code
            status: Payment status
        
        Returns:
            Created payment record
        """
        payment = Payment(
            subscription_id=subscription_id,
            stripe_payment_id=stripe_payment_id,
            amount=amount,
            currency=currency,
            status=status,
            paid_at=datetime.utcnow() if status == PaymentStatusEnum.SUCCEEDED else None,
        )
        
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        
        return payment
    
    # =========================================================================
    # WEBHOOK HANDLING
    # =========================================================================
    
    async def handle_webhook_event(
        self,
        event_type: str,
        event_data: Dict[str, Any]
    ):
        """
        Handle Stripe webhook events.
        
        Args:
            event_type: Stripe event type
            event_data: Event data
        """
        logger.info(f"Processing Stripe webhook: {event_type}")
        
        if event_type == "checkout.session.completed":
            await self._handle_checkout_completed(event_data)
        
        elif event_type == "customer.subscription.updated":
            await self._handle_subscription_updated(event_data)
        
        elif event_type == "customer.subscription.deleted":
            await self._handle_subscription_deleted(event_data)
        
        elif event_type == "invoice.payment_succeeded":
            await self._handle_invoice_paid(event_data)
        
        elif event_type == "invoice.payment_failed":
            await self._handle_invoice_failed(event_data)
        
        else:
            logger.debug(f"Unhandled webhook event: {event_type}")
    
    async def _handle_checkout_completed(self, data: Dict[str, Any]):
        """Handle successful checkout."""
        user_id = data["metadata"]["user_id"]
        tier = SubscriptionTierEnum(data["metadata"]["tier"])
        subscription_id = data["subscription"]
        customer_id = data["customer"]
        
        # Get subscription details from Stripe
        stripe_sub = stripe.Subscription.retrieve(subscription_id)
        
        await self.create_subscription(
            user_id=user_id,
            stripe_subscription_id=subscription_id,
            tier=tier,
            stripe_customer_id=customer_id,
            current_period_start=datetime.fromtimestamp(stripe_sub.current_period_start),
            current_period_end=datetime.fromtimestamp(stripe_sub.current_period_end),
            status=SubscriptionStatusEnum.ACTIVE,
        )
    
    async def _handle_subscription_updated(self, data: Dict[str, Any]):
        """Handle subscription update."""
        # Update local subscription from Stripe data
        pass
    
    async def _handle_subscription_deleted(self, data: Dict[str, Any]):
        """Handle subscription cancellation."""
        subscription_id = data["id"]
        
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == subscription_id
            )
        )
        subscription = result.scalar_one_or_none()
        
        if subscription:
            subscription.status = SubscriptionStatusEnum.CANCELLED
            subscription.cancelled_at = datetime.utcnow()
            await self.db.commit()
    
    async def _handle_invoice_paid(self, data: Dict[str, Any]):
        """Handle successful invoice payment."""
        pass
    
    async def _handle_invoice_failed(self, data: Dict[str, Any]):
        """Handle failed invoice payment."""
        pass
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    async def _get_user(self, user_id: str) -> User:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValidationException("User not found")
        
        return user
    
    async def _get_subscription(self, user_id: str) -> Optional[Subscription]:
        """Get user's subscription."""
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def _get_or_create_stripe_customer(self, user: User) -> str:
        """
        Get or create Stripe customer.
        
        Args:
            user: User
        
        Returns:
            Stripe customer ID
        """
        # Check if user already has customer ID
        subscription = await self._get_subscription(user.user_id)
        if subscription and subscription.stripe_customer_id:
            return subscription.stripe_customer_id
        
        # Create new customer
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.full_name,
                metadata={"user_id": user.user_id},
            )
            
            return customer.id
        
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe customer: {e}", exc_info=True)
            raise PaymentException(f"Failed to create customer: {str(e)}")


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["PaymentService", "SUBSCRIPTION_PLANS"]
