# =============================================================================
# AI FUNNEL BUILDER - WEBHOOK ENDPOINTS
# =============================================================================
# Webhook receivers for third-party services
# =============================================================================

from datetime import datetime
from fastapi import APIRouter, Depends, status, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import hmac
import hashlib
import json

from app.core.database import get_db
from app.services.payment_service import PaymentService
from app.services.integration_service import IntegrationService
from app.utils.logger import get_logger
from app.utils.exceptions import ValidationException
from app.core.config import settings

logger = get_logger(__name__)

router = APIRouter()


# =============================================================================
# STRIPE WEBHOOKS
# =============================================================================

@router.post(
    "/stripe",
    status_code=status.HTTP_200_OK,
    summary="Stripe Webhook",
    description="Handle Stripe webhook events"
)
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Stripe webhook events.
    
    Processes payment events, subscription updates, and invoices.
    
    Args:
        request: FastAPI request with webhook payload
        stripe_signature: Stripe signature header for verification
        db: Database session
    
    Returns:
        Success response
    """
    # Get raw body
    body = await request.body()
    
    # Verify webhook signature
    if settings.STRIPE_WEBHOOK_SECRET:
        try:
            import stripe
            event = stripe.Webhook.construct_event(
                body,
                stripe_signature,
                settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid Stripe payload: {e}")
            raise ValidationException("Invalid payload", field="payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid Stripe signature: {e}")
            raise ValidationException("Invalid signature", field="signature")
    else:
        # Parse JSON if no signature verification
        event = json.loads(body)
    
    event_type = event.get("type")
    event_data = event.get("data", {}).get("object", {})
    
    logger.info(
        f"Stripe webhook received: {event_type}",
        extra={"event_type": event_type, "event_id": event.get("id")}
    )
    
    # Process event
    payment_service = PaymentService(db)
    
    try:
        await payment_service.handle_webhook_event(
            event_type=event_type,
            event_data=event_data
        )
        
        logger.info(
            f"Stripe webhook processed: {event_type}",
            extra={"event_type": event_type}
        )
    
    except Exception as e:
        logger.error(f"Stripe webhook processing failed: {e}", exc_info=True)
        # Return 200 anyway to prevent retries for bad data
    
    return {"received": True}


# =============================================================================
# META (FACEBOOK) WEBHOOKS
# =============================================================================

@router.get(
    "/meta",
    status_code=status.HTTP_200_OK,
    summary="Meta Webhook Verification",
    description="Verify Meta webhook subscription"
)
async def meta_webhook_verify(
    request: Request,
):
    """
    Verify Meta webhook subscription.
    
    Meta sends a GET request to verify the webhook endpoint.
    
    Args:
        request: FastAPI request with verification parameters
    
    Returns:
        Challenge response
    """
    params = request.query_params
    
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    
    # Verify token matches expected value
    if mode == "subscribe" and token == settings.META_WEBHOOK_VERIFY_TOKEN:
        logger.info("Meta webhook verified successfully")
        return int(challenge)
    else:
        logger.warning("Meta webhook verification failed")
        raise ValidationException("Verification failed", field="token")


@router.post(
    "/meta",
    status_code=status.HTTP_200_OK,
    summary="Meta Webhook",
    description="Handle Meta webhook events"
)
async def meta_webhook(
    request: Request,
    x_hub_signature: Optional[str] = Header(None, alias="x-hub-signature-256"),
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Meta webhook events.
    
    Processes Facebook/Instagram lead form submissions and page events.
    
    Args:
        request: FastAPI request with webhook payload
        x_hub_signature: Meta signature header for verification
        db: Database session
    
    Returns:
        Success response
    """
    # Get raw body
    body = await request.body()
    
    # Verify webhook signature
    if settings.META_APP_SECRET and x_hub_signature:
        expected_signature = "sha256=" + hmac.new(
            settings.META_APP_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_signature, x_hub_signature):
            logger.warning("Invalid Meta webhook signature")
            raise ValidationException("Invalid signature", field="signature")
    
    # Parse payload
    data = json.loads(body)
    
    logger.info(
        f"Meta webhook received",
        extra={"object": data.get("object")}
    )
    
    # Process entries
    for entry in data.get("entry", []):
        for change in entry.get("changes", []):
            field = change.get("field")
            value = change.get("value")
            
            logger.info(
                f"Meta webhook change: {field}",
                extra={"field": field, "value": value}
            )
            
            # Handle different event types
            if field == "leadgen":
                # Lead form submission
                leadgen_id = value.get("leadgen_id")
                page_id = value.get("page_id")
                
                # TODO: Fetch lead data from Facebook API and create lead
                logger.info(
                    f"Lead form submission: {leadgen_id}",
                    extra={"leadgen_id": leadgen_id, "page_id": page_id}
                )
    
    return {"received": True}


# =============================================================================
# MAILCHIMP WEBHOOKS
# =============================================================================

@router.post(
    "/mailchimp",
    status_code=status.HTTP_200_OK,
    summary="Mailchimp Webhook",
    description="Handle Mailchimp webhook events"
)
async def mailchimp_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Mailchimp webhook events.
    
    Processes subscribe, unsubscribe, profile updates, etc.
    
    Args:
        request: FastAPI request with webhook payload
        db: Database session
    
    Returns:
        Success response
    """
    # Mailchimp sends form data, not JSON
    form_data = await request.form()
    
    event_type = form_data.get("type")
    data = form_data.get("data[email]")
    
    logger.info(
        f"Mailchimp webhook received: {event_type}",
        extra={"event_type": event_type, "email": data}
    )
    
    # Process event based on type
    if event_type == "subscribe":
        logger.info(f"New Mailchimp subscription: {data}")
    elif event_type == "unsubscribe":
        logger.info(f"Mailchimp unsubscription: {data}")
    elif event_type == "profile":
        logger.info(f"Mailchimp profile update: {data}")
    elif event_type == "cleaned":
        logger.info(f"Mailchimp email cleaned: {data}")
    
    return {"received": True}


# =============================================================================
# ZAPIER WEBHOOKS
# =============================================================================

@router.post(
    "/zapier",
    status_code=status.HTTP_200_OK,
    summary="Zapier Webhook",
    description="Receive data from Zapier"
)
async def zapier_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Zapier webhook.
    
    Receives data from Zapier zaps.
    
    Args:
        request: FastAPI request with webhook payload
        db: Database session
    
    Returns:
        Success response
    """
    # Get payload
    body = await request.body()
    data = json.loads(body)
    
    logger.info(
        f"Zapier webhook received",
        extra={"data_keys": list(data.keys())}
    )
    
    # TODO: Process Zapier data based on your needs
    # Could be lead data, form submissions, etc.
    
    return {
        "received": True,
        "message": "Webhook processed successfully"
    }


# =============================================================================
# GENERIC WEBHOOK RECEIVER
# =============================================================================

@router.post(
    "/generic/{integration_id}",
    status_code=status.HTTP_200_OK,
    summary="Generic Webhook",
    description="Generic webhook receiver for custom integrations"
)
async def generic_webhook(
    integration_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Generic webhook receiver.
    
    Receives webhooks for custom integrations.
    
    Args:
        integration_id: Integration ID
        request: FastAPI request with webhook payload
        db: Database session
    
    Returns:
        Success response
    """
    # Get payload
    body = await request.body()
    
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        # If not JSON, store raw body
        data = {"raw_body": body.decode()}
    
    logger.info(
        f"Generic webhook received: {integration_id}",
        extra={
            "integration_id": integration_id,
            "content_type": request.headers.get("content-type")
        }
    )
    
    # TODO: Store webhook data and process based on integration config
    
    return {
        "received": True,
        "integration_id": integration_id
    }


# =============================================================================
# WEBHOOK TESTING
# =============================================================================

@router.post(
    "/test",
    status_code=status.HTTP_200_OK,
    summary="Test Webhook",
    description="Test webhook endpoint (logs payload)"
)
async def test_webhook(
    request: Request
):
    """
    Test webhook endpoint.
    
    Useful for testing webhook integrations.
    
    Args:
        request: FastAPI request with webhook payload
    
    Returns:
        Echo response with received data
    """
    # Get headers
    headers = dict(request.headers)
    
    # Get body
    body = await request.body()
    
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        data = {"raw_body": body.decode()}
    
    logger.info(
        "Test webhook received",
        extra={
            "headers": headers,
            "data": data,
            "method": request.method,
            "url": str(request.url)
        }
    )
    
    return {
        "received": True,
        "timestamp": str(datetime.utcnow()),
        "method": request.method,
        "headers": headers,
        "data": data,
        "message": "Test webhook processed successfully"
    }


# =============================================================================
# WEBHOOK SIGNATURE VERIFICATION HELPERS
# =============================================================================

def verify_webhook_signature(
    body: bytes,
    signature: str,
    secret: str,
    algorithm: str = "sha256"
) -> bool:
    """
    Verify webhook signature.
    
    Args:
        body: Raw request body
        signature: Signature from header
        secret: Webhook secret
        algorithm: Hash algorithm (default: sha256)
    
    Returns:
        True if signature is valid
    """
    if algorithm == "sha256":
        expected_signature = hmac.new(
            secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
    elif algorithm == "sha1":
        expected_signature = hmac.new(
            secret.encode(),
            body,
            hashlib.sha1
        ).hexdigest()
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")
    
    return hmac.compare_digest(expected_signature, signature)


# =============================================================================
# WEBHOOK HEALTH CHECK
# =============================================================================

@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Webhook Health",
    description="Webhook endpoint health check"
)
async def webhook_health():
    """
    Webhook health check.
    
    Returns:
        Health status
    """
    from datetime import datetime
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "stripe": "/webhooks/stripe",
            "meta": "/webhooks/meta",
            "mailchimp": "/webhooks/mailchimp",
            "zapier": "/webhooks/zapier",
            "generic": "/webhooks/generic/{integration_id}",
            "test": "/webhooks/test"
        }
    }
