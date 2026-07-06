from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


# Enums


class PaymentStatusEnum(str, Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"
    disputed = "disputed"


class PaymentTypeEnum(str, Enum):
    subscription = "subscription"
    one_time = "one_time"
    upgrade = "upgrade"
    downgrade = "downgrade"
    refund = "refund"


# Payment schemas


class PaymentBase(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    currency: str = Field(..., max_length=3, description="Currency code (ISO 4217)")
    status: PaymentStatusEnum = Field(..., description="Payment status")
    type: PaymentTypeEnum = Field(..., description="Payment type")
    description: Optional[str] = Field(None, description="Payment description")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")

    model_config = ConfigDict(from_attributes=True)


class PaymentCreate(PaymentBase):
    subscription_id: Optional[str] = Field(None, description="Linked subscription ID if any")
    user_id: str = Field(..., description="User who made payment")
    payment_method_id: Optional[str] = Field(None, description="Payment method identifier")

    model_config = ConfigDict(from_attributes=True)


class PaymentResponse(PaymentBase):
    payment_id: str = Field(..., description="Unique payment ID")
    subscription_id: Optional[str]
    user_id: str
    payment_method_id: Optional[str]
    stripe_payment_intent_id: Optional[str]
    stripe_charge_id: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Subscription schemas (minimal example)


class SubscriptionBase(BaseModel):
    tier: str
    status: str
    billing_interval: Optional[str]
    amount: Decimal
    currency: str

    model_config = ConfigDict(from_attributes=True)


class SubscriptionResponse(SubscriptionBase):
    subscription_id: str
    user_id: str
    trial_start: Optional[datetime]
    trial_end: Optional[datetime]
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    canceled_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class CheckoutSessionCreate(BaseModel):
    """
    Schema for creating a Stripe Checkout Session.
    """
    price_id: str = Field(..., description="Stripe Price ID")
    success_url: str = Field(..., description="URL to redirect to after successful payment")
    cancel_url: str = Field(..., description="URL to redirect to if payment is cancelled")
    quantity: Optional[int] = Field(1, gt=0, description="Quantity of the product")
    customer_email: Optional[str] = Field(None, description="Customer email for prefill")
    metadata: Optional[dict] = Field(default_factory=dict, description="Additional metadata")

    model_config = ConfigDict(from_attributes=True)


class SubscriptionUpdate(BaseModel):
    tier: Optional[str] = Field(None, description="Subscription plan tier")
    status: Optional[str] = Field(None, description="Subscription status")
    billing_interval: Optional[str] = Field(None, description="Billing interval")
    cancel_at_period_end: Optional[bool] = Field(None, description="Cancel at period end")
    payment_method_id: Optional[str] = Field(None, description="Payment method ID")
    amount: Optional[Decimal] = Field(None, gt=0, description="Subscription amount")
    currency: Optional[str] = Field(None, max_length=3, description="Currency code (ISO 4217)")

    model_config = ConfigDict(from_attributes=True)


class PaymentMethodUpdate(BaseModel):
    """
    Schema for updating payment method details.
    """
    payment_method_id: Optional[str] = Field(None, description="Stripe payment method ID")
    brand: Optional[str] = Field(None, max_length=50, description="Card brand (visa, mastercard)")
    last4: Optional[str] = Field(None, max_length=4, description="Last 4 digits")
    exp_month: Optional[int] = Field(None, ge=1, le=12, description="Expiration month")
    exp_year: Optional[int] = Field(None, ge=2025, description="Expiration year")
    billing_name: Optional[str] = Field(None, max_length=255, description="Billing name")
    billing_email: Optional[str] = Field(None, description="Billing email")

    model_config = ConfigDict(from_attributes=True)


# Export


__all__ = [
    "PaymentStatusEnum",
    "PaymentTypeEnum",
    "PaymentCreate",
    "PaymentResponse",
    "SubscriptionBase",
    "SubscriptionResponse",
    "CheckoutSessionCreate",
    "SubscriptionUpdate",
    "PaymentMethodUpdate",
]
