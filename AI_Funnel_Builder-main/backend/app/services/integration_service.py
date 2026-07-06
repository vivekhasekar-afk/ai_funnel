# =============================================================================
# AI FUNNEL BUILDER - INTEGRATION SERVICE
# =============================================================================
# Third-party integration management (CRM, Email, Webhooks)
# =============================================================================

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import httpx
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, desc

from app.models.integration import Integration, IntegrationTypeEnum, IntegrationStatusEnum
from app.models.webhook_log import WebhookLog, WebhookStatusEnum
from app.models.lead import Lead
from app.utils.exceptions import (
    NotFoundException,
    ValidationException,
    IntegrationException,
    IntegrationNotFoundException,
)
from app.utils.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)


# =============================================================================
# INTEGRATION PROVIDERS
# =============================================================================

class IntegrationProvider(str, Enum):
    """Supported integration providers."""
    HUBSPOT = "hubspot"
    SALESFORCE = "salesforce"
    MAILCHIMP = "mailchimp"
    ACTIVE_CAMPAIGN = "active_campaign"
    ZAPIER = "zapier"
    MAKE = "make"
    WEBHOOK = "webhook"


# =============================================================================
# INTEGRATION SERVICE
# =============================================================================

class IntegrationService:
    """
    Integration management service.
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize integration service.
        
        Args:
            db: Database session
        """
        self.db = db
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.http_client.aclose()
    
    # =========================================================================
    # INTEGRATION CRUD
    # =========================================================================
    
    async def create_integration(
        self,
        user_id: str,
        integration_type: IntegrationTypeEnum,
        provider: str,
        name: str,
        config: Dict[str, Any],
        credentials: Optional[Dict[str, Any]] = None
    ) -> Integration:
        """
        Create new integration.
        
        Args:
            user_id: User ID
            integration_type: Integration type (CRM, EMAIL, WEBHOOK)
            provider: Provider name
            name: Integration name
            config: Configuration data
            credentials: OAuth credentials (if applicable)
        
        Returns:
            Created integration
        """
        # Validate configuration
        await self._validate_config(integration_type, provider, config)
        
        # Create integration
        integration = Integration(
            user_id=user_id,
            integration_type=integration_type,
            provider=provider,
            name=name,
            config=config,
            credentials=credentials or {},
            status=IntegrationStatusEnum.ACTIVE,
        )
        
        self.db.add(integration)
        await self.db.commit()
        await self.db.refresh(integration)
        
        logger.info(
            f"Integration created: {name} ({provider})",
            extra={
                "user_id": user_id,
                "integration_id": integration.integration_id,
                "provider": provider,
            }
        )
        
        return integration
    
    async def get_integration(
        self,
        integration_id: str,
        user_id: str
    ) -> Integration:
        """
        Get integration by ID.
        
        Args:
            integration_id: Integration ID
            user_id: User ID
        
        Returns:
            Integration
        
        Raises:
            IntegrationNotFoundException: If integration not found
        """
        result = await self.db.execute(
            select(Integration).where(
                and_(
                    Integration.integration_id == integration_id,
                    Integration.user_id == user_id
                )
            )
        )
        integration = result.scalar_one_or_none()
        
        if not integration:
            raise IntegrationNotFoundException(integration_id)
        
        return integration
    
    async def update_integration(
        self,
        integration_id: str,
        user_id: str,
        name: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
        status: Optional[IntegrationStatusEnum] = None
    ) -> Integration:
        """
        Update integration.
        
        Args:
            integration_id: Integration ID
            user_id: User ID
            name: New name
            config: New config
            status: New status
        
        Returns:
            Updated integration
        """
        integration = await self.get_integration(integration_id, user_id)
        
        if name is not None:
            integration.name = name
        
        if config is not None:
            # Validate new config
            await self._validate_config(
                integration.integration_type,
                integration.provider,
                config
            )
            integration.config = {**integration.config, **config}
        
        if status is not None:
            integration.status = status
        
        await self.db.commit()
        await self.db.refresh(integration)
        
        logger.info(
            f"Integration updated: {integration.name}",
            extra={"user_id": user_id, "integration_id": integration_id}
        )
        
        return integration
    
    async def delete_integration(
        self,
        integration_id: str,
        user_id: str
    ) -> bool:
        """
        Delete integration.
        
        Args:
            integration_id: Integration ID
            user_id: User ID
        
        Returns:
            True if deleted
        """
        integration = await self.get_integration(integration_id, user_id)
        
        await self.db.delete(integration)
        await self.db.commit()
        
        logger.info(
            f"Integration deleted: {integration.name}",
            extra={"user_id": user_id, "integration_id": integration_id}
        )
        
        return True
    
    async def list_integrations(
        self,
        user_id: str,
        integration_type: Optional[IntegrationTypeEnum] = None,
        provider: Optional[str] = None
    ) -> List[Integration]:
        """
        List user's integrations.
        
        Args:
            user_id: User ID
            integration_type: Filter by type
            provider: Filter by provider
        
        Returns:
            List of integrations
        """
        query = select(Integration).where(Integration.user_id == user_id)
        
        if integration_type:
            query = query.where(Integration.integration_type == integration_type)
        
        if provider:
            query = query.where(Integration.provider == provider)
        
        query = query.order_by(desc(Integration.created_at))
        
        result = await self.db.execute(query)
        integrations = result.scalars().all()
        
        return list(integrations)
    
    # =========================================================================
    # WEBHOOK DELIVERY
    # =========================================================================
    
    async def send_webhook(
        self,
        integration_id: str,
        event_type: str,
        payload: Dict[str, Any],
        retry_count: int = 0,
        max_retries: int = 3
    ) -> WebhookLog:
        """
        Send webhook to integration endpoint.
        
        Args:
            integration_id: Integration ID
            event_type: Event type (lead.created, response.completed, etc.)
            payload: Webhook payload
            retry_count: Current retry attempt
            max_retries: Maximum retry attempts
        
        Returns:
            Webhook log
        """
        # Get integration (don't need user_id check for internal calls)
        result = await self.db.execute(
            select(Integration).where(Integration.integration_id == integration_id)
        )
        integration = result.scalar_one_or_none()
        
        if not integration:
            raise IntegrationNotFoundException(integration_id)
        
        if integration.status != IntegrationStatusEnum.ACTIVE:
            raise IntegrationException(f"Integration is not active: {integration.status.value}")
        
        # Get webhook URL from config
        webhook_url = integration.config.get("webhook_url")
        if not webhook_url:
            raise IntegrationException("Webhook URL not configured")
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "User-Agent": f"{settings.PROJECT_NAME}/1.0",
            "X-Webhook-Event": event_type,
            "X-Integration-ID": integration_id,
        }
        
        # Add custom headers from config
        if "headers" in integration.config:
            headers.update(integration.config["headers"])
        
        # Create webhook log
        webhook_log = WebhookLog(
            integration_id=integration_id,
            event_type=event_type,
            payload=payload,
            url=webhook_url,
            status=WebhookStatusEnum.PENDING,
            retry_count=retry_count,
        )
        
        self.db.add(webhook_log)
        await self.db.flush()
        
        # Send webhook
        try:
            response = await self.http_client.post(
                webhook_url,
                json=payload,
                headers=headers,
            )
            
            webhook_log.status_code = response.status_code
            webhook_log.response_body = response.text[:10000]  # Limit size
            webhook_log.sent_at = datetime.utcnow()
            
            if response.status_code >= 200 and response.status_code < 300:
                webhook_log.status = WebhookStatusEnum.SUCCESS
                
                logger.info(
                    f"Webhook sent successfully: {event_type}",
                    extra={
                        "integration_id": integration_id,
                        "webhook_log_id": webhook_log.webhook_log_id,
                        "status_code": response.status_code,
                    }
                )
            else:
                webhook_log.status = WebhookStatusEnum.FAILED
                webhook_log.error_message = f"HTTP {response.status_code}: {response.text[:500]}"
                
                logger.warning(
                    f"Webhook failed: {event_type}",
                    extra={
                        "integration_id": integration_id,
                        "status_code": response.status_code,
                        "error": webhook_log.error_message,
                    }
                )
                
                # Retry if not max retries
                if retry_count < max_retries:
                    await self._schedule_webhook_retry(
                        integration_id,
                        event_type,
                        payload,
                        retry_count + 1,
                        max_retries
                    )
        
        except Exception as e:
            webhook_log.status = WebhookStatusEnum.FAILED
            webhook_log.error_message = str(e)
            webhook_log.sent_at = datetime.utcnow()
            
            logger.error(
                f"Webhook error: {event_type}",
                extra={
                    "integration_id": integration_id,
                    "error": str(e),
                },
                exc_info=True
            )
            
            # Retry if not max retries
            if retry_count < max_retries:
                await self._schedule_webhook_retry(
                    integration_id,
                    event_type,
                    payload,
                    retry_count + 1,
                    max_retries
                )
        
        await self.db.commit()
        await self.db.refresh(webhook_log)
        
        return webhook_log
    
    async def _schedule_webhook_retry(
        self,
        integration_id: str,
        event_type: str,
        payload: Dict[str, Any],
        retry_count: int,
        max_retries: int
    ):
        """
        Schedule webhook retry (in production, use background task/queue).
        
        Args:
            integration_id: Integration ID
            event_type: Event type
            payload: Webhook payload
            retry_count: Retry attempt number
            max_retries: Maximum retries
        """
        # TODO: In production, use Celery/Redis Queue for delayed retry
        # For now, just log that retry should be scheduled
        
        retry_delay = 2 ** retry_count  # Exponential backoff: 2, 4, 8 seconds
        
        logger.info(
            f"Webhook retry scheduled: attempt {retry_count}/{max_retries}",
            extra={
                "integration_id": integration_id,
                "event_type": event_type,
                "retry_delay": retry_delay,
            }
        )
    
    # =========================================================================
    # LEAD SYNC
    # =========================================================================
    
    async def sync_lead_to_crm(
        self,
        lead_id: str,
        integration_id: str
    ) -> Dict[str, Any]:
        """
        Sync lead to CRM integration.
        
        Args:
            lead_id: Lead ID
            integration_id: Integration ID
        
        Returns:
            Sync result
        """
        # Get lead
        lead_result = await self.db.execute(
            select(Lead).where(Lead.lead_id == lead_id)
        )
        lead = lead_result.scalar_one_or_none()
        
        if not lead:
            raise NotFoundException("Lead not found", resource_type="lead")
        
        # Get integration
        integration_result = await self.db.execute(
            select(Integration).where(Integration.integration_id == integration_id)
        )
        integration = integration_result.scalar_one_or_none()
        
        if not integration:
            raise IntegrationNotFoundException(integration_id)
        
        # Map lead data based on integration provider
        if integration.provider == IntegrationProvider.HUBSPOT:
            return await self._sync_to_hubspot(lead, integration)
        elif integration.provider == IntegrationProvider.SALESFORCE:
            return await self._sync_to_salesforce(lead, integration)
        elif integration.provider == IntegrationProvider.MAILCHIMP:
            return await self._sync_to_mailchimp(lead, integration)
        elif integration.provider == IntegrationProvider.ACTIVE_CAMPAIGN:
            return await self._sync_to_active_campaign(lead, integration)
        else:
            # Generic webhook
            payload = self._map_lead_to_payload(lead, integration)
            await self.send_webhook(integration_id, "lead.created", payload)
            return {"status": "webhook_sent"}
    
    async def _sync_to_hubspot(
        self,
        lead: Lead,
        integration: Integration
    ) -> Dict[str, Any]:
        """
        Sync lead to HubSpot CRM.
        
        Args:
            lead: Lead to sync
            integration: HubSpot integration
        
        Returns:
            Sync result
        """
        api_key = integration.credentials.get("api_key")
        if not api_key:
            raise IntegrationException("HubSpot API key not configured")
        
        # Map fields
        properties = self._map_lead_fields(lead, integration.config.get("field_mapping", {}))
        
        # Create contact in HubSpot
        url = "https://api.hubapi.com/crm/v3/objects/contacts"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "properties": properties
        }
        
        try:
            response = await self.http_client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            logger.info(
                f"Lead synced to HubSpot: {lead.email}",
                extra={
                    "lead_id": lead.lead_id,
                    "hubspot_contact_id": result.get("id"),
                }
            )
            
            return {
                "status": "success",
                "provider": "hubspot",
                "contact_id": result.get("id"),
            }
        
        except httpx.HTTPError as e:
            logger.error(f"HubSpot sync failed: {e}", exc_info=True)
            raise IntegrationException(f"HubSpot sync failed: {str(e)}")
    
    async def _sync_to_salesforce(
        self,
        lead: Lead,
        integration: Integration
    ) -> Dict[str, Any]:
        """Sync lead to Salesforce CRM."""
        # TODO: Implement Salesforce OAuth and API integration
        logger.warning("Salesforce integration not yet implemented")
        return {"status": "not_implemented", "provider": "salesforce"}
    
    async def _sync_to_mailchimp(
        self,
        lead: Lead,
        integration: Integration
    ) -> Dict[str, Any]:
        """Sync lead to Mailchimp."""
        api_key = integration.credentials.get("api_key")
        list_id = integration.config.get("list_id")
        
        if not api_key or not list_id:
            raise IntegrationException("Mailchimp API key or list ID not configured")
        
        # Extract datacenter from API key
        dc = api_key.split("-")[-1]
        
        url = f"https://{dc}.api.mailchimp.com/3.0/lists/{list_id}/members"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "email_address": lead.email,
            "status": "subscribed",
            "merge_fields": {
                "FNAME": lead.first_name or "",
                "LNAME": lead.last_name or "",
            }
        }
        
        try:
            response = await self.http_client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            logger.info(
                f"Lead synced to Mailchimp: {lead.email}",
                extra={"lead_id": lead.lead_id, "list_id": list_id}
            )
            
            return {
                "status": "success",
                "provider": "mailchimp",
                "subscriber_id": result.get("id"),
            }
        
        except httpx.HTTPError as e:
            logger.error(f"Mailchimp sync failed: {e}", exc_info=True)
            raise IntegrationException(f"Mailchimp sync failed: {str(e)}")
    
    async def _sync_to_active_campaign(
        self,
        lead: Lead,
        integration: Integration
    ) -> Dict[str, Any]:
        """Sync lead to ActiveCampaign."""
        # TODO: Implement ActiveCampaign API integration
        logger.warning("ActiveCampaign integration not yet implemented")
        return {"status": "not_implemented", "provider": "active_campaign"}
    
    def _map_lead_fields(
        self,
        lead: Lead,
        field_mapping: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Map lead fields to integration fields.
        
        Args:
            lead: Lead
            field_mapping: Field mapping config
        
        Returns:
            Mapped fields
        """
        # Default mapping
        mapped = {
            "email": lead.email,
            "firstname": lead.first_name,
            "lastname": lead.last_name,
            "phone": lead.phone,
            "company": lead.company,
            "website": lead.website,
        }
        
        # Apply custom mapping
        for source_field, target_field in field_mapping.items():
            value = getattr(lead, source_field, None)
            if value:
                mapped[target_field] = value
        
        # Remove None values
        return {k: v for k, v in mapped.items() if v is not None}
    
    def _map_lead_to_payload(
        self,
        lead: Lead,
        integration: Integration
    ) -> Dict[str, Any]:
        """
        Map lead to webhook payload.
        
        Args:
            lead: Lead
            integration: Integration
        
        Returns:
            Webhook payload
        """
        payload = {
            "event": "lead.created",
            "lead": {
                "id": lead.lead_id,
                "email": lead.email,
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "full_name": lead.full_name,
                "phone": lead.phone,
                "company": lead.company,
                "website": lead.website,
                "source": lead.source.value,
                "status": lead.status.value,
                "score": lead.score,
                "custom_fields": lead.custom_fields,
                "created_at": lead.created_at.isoformat(),
            },
            "funnel_id": lead.funnel_id,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        return payload
    
    # =========================================================================
    # INTEGRATION HEALTH
    # =========================================================================
    
    async def test_integration(
        self,
        integration_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Test integration connection.
        
        Args:
            integration_id: Integration ID
            user_id: User ID
        
        Returns:
            Test result
        """
        integration = await self.get_integration(integration_id, user_id)
        
        # Test based on provider
        if integration.integration_type == IntegrationTypeEnum.WEBHOOK:
            # Send test webhook
            test_payload = {
                "event": "test.connection",
                "message": "This is a test webhook",
                "timestamp": datetime.utcnow().isoformat(),
            }
            
            try:
                webhook_log = await self.send_webhook(
                    integration_id,
                    "test.connection",
                    test_payload,
                    max_retries=0  # Don't retry test webhooks
                )
                
                return {
                    "status": "success" if webhook_log.status == WebhookStatusEnum.SUCCESS else "failed",
                    "status_code": webhook_log.status_code,
                    "response": webhook_log.response_body,
                }
            
            except Exception as e:
                return {
                    "status": "error",
                    "error": str(e),
                }
        
        else:
            # TODO: Implement provider-specific health checks
            return {
                "status": "not_implemented",
                "message": "Health check not implemented for this provider",
            }
    
    async def get_webhook_logs(
        self,
        integration_id: str,
        user_id: str,
        limit: int = 50
    ) -> List[WebhookLog]:
        """
        Get webhook delivery logs.
        
        Args:
            integration_id: Integration ID
            user_id: User ID
            limit: Maximum results
        
        Returns:
            List of webhook logs
        """
        # Verify integration ownership
        await self.get_integration(integration_id, user_id)
        
        result = await self.db.execute(
            select(WebhookLog)
            .where(WebhookLog.integration_id == integration_id)
            .order_by(desc(WebhookLog.created_at))
            .limit(limit)
        )
        
        logs = result.scalars().all()
        return list(logs)
    
    # =========================================================================
    # VALIDATION
    # =========================================================================
    
    async def _validate_config(
        self,
        integration_type: IntegrationTypeEnum,
        provider: str,
        config: Dict[str, Any]
    ):
        """
        Validate integration configuration.
        
        Args:
            integration_type: Integration type
            provider: Provider name
            config: Configuration to validate
        
        Raises:
            ValidationException: If configuration is invalid
        """
        if integration_type == IntegrationTypeEnum.WEBHOOK:
            if "webhook_url" not in config:
                raise ValidationException("webhook_url is required for webhook integrations")
            
            # Validate URL format
            url = config["webhook_url"]
            if not url.startswith(("http://", "https://")):
                raise ValidationException("webhook_url must be a valid HTTP/HTTPS URL")


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["IntegrationService", "IntegrationProvider"]
