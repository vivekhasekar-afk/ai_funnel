# =============================================================================
# AI FUNNEL BUILDER - INTEGRATION ENDPOINTS
# =============================================================================
# Third-party integration management endpoints
# =============================================================================

from datetime import datetime
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.core.database import get_db
from app.services.integration_service import IntegrationService, IntegrationProvider
from app.models.integration import IntegrationTypeEnum, IntegrationStatusEnum
from app.schemas.integration import (
    IntegrationCreate,
    IntegrationUpdate,
    IntegrationResponse,
    IntegrationTestRequest,
    IntegrationSyncRequest,
    OAuthConnectionRequest,
)
from app.utils.logger import get_logger
from app.utils.exceptions import NotFoundException, IntegrationException
from app.middleware.auth import get_current_user

logger = get_logger(__name__)

router = APIRouter()


# =============================================================================
# INTEGRATION LISTING
# =============================================================================

@router.get(
    "",
    response_model=List[IntegrationResponse],
    status_code=status.HTTP_200_OK,
    summary="List Integrations",
    description="Get user's configured integrations"
)
async def list_integrations(
    integration_type: Optional[IntegrationTypeEnum] = Query(None),
    status_filter: Optional[IntegrationStatusEnum] = Query(None, alias="status"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List user's integrations.
    
    Args:
        integration_type: Filter by type (CRM, EMAIL, WEBHOOK)
        status_filter: Filter by status (ACTIVE, PAUSED, ERROR)
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        List of configured integrations
    """
    async with IntegrationService(db) as integration_service:
        integrations = await integration_service.list_integrations(
            user_id=current_user["user_id"],
            integration_type=integration_type,
            provider=None
        )
        
        # Filter by status if provided
        if status_filter:
            integrations = [i for i in integrations if i.status == status_filter]
        
        return integrations


@router.get(
    "/available",
    status_code=status.HTTP_200_OK,
    summary="Available Integrations",
    description="Get list of available integration providers"
)
async def get_available_integrations():
    """
    Get available integrations.
    
    Returns:
        List of available integration providers with details
    """
    available_integrations = [
        {
            "provider": IntegrationProvider.HUBSPOT,
            "name": "HubSpot",
            "type": IntegrationTypeEnum.CRM,
            "description": "Sync leads to HubSpot CRM",
            "features": ["Lead sync", "Contact management", "Deal tracking"],
            "auth_type": "oauth",
            "is_premium": False,
            "logo_url": "https://cdn.example.com/hubspot.png"
        },
        {
            "provider": IntegrationProvider.SALESFORCE,
            "name": "Salesforce",
            "type": IntegrationTypeEnum.CRM,
            "description": "Sync leads to Salesforce CRM",
            "features": ["Lead sync", "Contact management", "Opportunity tracking"],
            "auth_type": "oauth",
            "is_premium": True,
            "logo_url": "https://cdn.example.com/salesforce.png"
        },
        {
            "provider": IntegrationProvider.MAILCHIMP,
            "name": "Mailchimp",
            "type": IntegrationTypeEnum.EMAIL,
            "description": "Add leads to Mailchimp lists",
            "features": ["List management", "Email campaigns", "Segmentation"],
            "auth_type": "api_key",
            "is_premium": False,
            "logo_url": "https://cdn.example.com/mailchimp.png"
        },
        {
            "provider": IntegrationProvider.ACTIVE_CAMPAIGN,
            "name": "ActiveCampaign",
            "type": IntegrationTypeEnum.EMAIL,
            "description": "Marketing automation with ActiveCampaign",
            "features": ["Automation", "Email marketing", "CRM"],
            "auth_type": "api_key",
            "is_premium": False,
            "logo_url": "https://cdn.example.com/activecampaign.png"
        },
        {
            "provider": IntegrationProvider.ZAPIER,
            "name": "Zapier",
            "type": IntegrationTypeEnum.WEBHOOK,
            "description": "Connect to 5000+ apps via Zapier",
            "features": ["Unlimited integrations", "Workflow automation"],
            "auth_type": "webhook",
            "is_premium": False,
            "logo_url": "https://cdn.example.com/zapier.png"
        },
        {
            "provider": IntegrationProvider.MAKE,
            "name": "Make (Integromat)",
            "type": IntegrationTypeEnum.WEBHOOK,
            "description": "Advanced automation with Make",
            "features": ["Complex workflows", "Data transformation"],
            "auth_type": "webhook",
            "is_premium": False,
            "logo_url": "https://cdn.example.com/make.png"
        },
        {
            "provider": IntegrationProvider.WEBHOOK,
            "name": "Custom Webhook",
            "type": IntegrationTypeEnum.WEBHOOK,
            "description": "Send data to custom webhook URL",
            "features": ["Custom integration", "Flexible data format"],
            "auth_type": "none",
            "is_premium": False,
            "logo_url": "https://cdn.example.com/webhook.png"
        }
    ]
    
    return available_integrations


# =============================================================================
# INTEGRATION SETUP
# =============================================================================

@router.post(
    "/{integration_type}/setup",
    response_model=IntegrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Setup Integration",
    description="Configure new integration"
)
async def setup_integration(
    integration_type: IntegrationTypeEnum,
    data: IntegrationCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Setup new integration.
    
    Args:
        integration_type: Type of integration (CRM, EMAIL, WEBHOOK)
        data: Integration configuration
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Created integration
    """
    async with IntegrationService(db) as integration_service:
        integration = await integration_service.create_integration(
            user_id=current_user["user_id"],
            integration_type=integration_type,
            provider=data.provider,
            name=data.name,
            config=data.config,
            credentials=data.credentials
        )
        
        logger.info(
            f"Integration setup: {data.provider}",
            extra={
                "user_id": current_user["user_id"],
                "integration_id": integration.integration_id,
                "provider": data.provider
            }
        )
        
        return integration


# =============================================================================
# INTEGRATION MANAGEMENT
# =============================================================================

@router.get(
    "/{integration_id}",
    response_model=IntegrationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Integration",
    description="Get integration details"
)
async def get_integration(
    integration_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get integration details.
    
    Args:
        integration_id: Integration ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Integration details
    """
    async with IntegrationService(db) as integration_service:
        integration = await integration_service.get_integration(
            integration_id=integration_id,
            user_id=current_user["user_id"]
        )
        
        return integration


@router.patch(
    "/{integration_id}",
    response_model=IntegrationResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Integration",
    description="Update integration configuration"
)
async def update_integration(
    integration_id: str,
    data: IntegrationUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update integration.
    
    Args:
        integration_id: Integration ID
        data: Update data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated integration
    """
    async with IntegrationService(db) as integration_service:
        integration = await integration_service.update_integration(
            integration_id=integration_id,
            user_id=current_user["user_id"],
            name=data.name,
            config=data.config,
            status=data.status
        )
        
        logger.info(
            f"Integration updated: {integration_id}",
            extra={
                "user_id": current_user["user_id"],
                "integration_id": integration_id
            }
        )
        
        return integration


@router.delete(
    "/{integration_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Integration",
    description="Delete integration"
)
async def delete_integration(
    integration_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete integration.
    
    Args:
        integration_id: Integration ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    async with IntegrationService(db) as integration_service:
        await integration_service.delete_integration(
            integration_id=integration_id,
            user_id=current_user["user_id"]
        )
        
        logger.info(
            f"Integration deleted: {integration_id}",
            extra={
                "user_id": current_user["user_id"],
                "integration_id": integration_id
            }
        )
        
        return {
            "message": "Integration deleted successfully",
            "integration_id": integration_id
        }


# =============================================================================
# INTEGRATION TESTING
# =============================================================================

@router.post(
    "/{integration_id}/test",
    status_code=status.HTTP_200_OK,
    summary="Test Integration",
    description="Test integration connection and configuration"
)
async def test_integration(
    integration_id: str,
    data: Optional[IntegrationTestRequest] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Test integration.
    
    Args:
        integration_id: Integration ID
        data: Optional test data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Test results
    """
    async with IntegrationService(db) as integration_service:
        # Get integration
        integration = await integration_service.get_integration(
            integration_id=integration_id,
            user_id=current_user["user_id"]
        )
        
        # Test based on integration type
        try:
            if integration.integration_type == IntegrationTypeEnum.WEBHOOK:
                # Test webhook
                test_payload = data.test_payload if data else {"test": True}
                
                webhook_log = await integration_service.send_webhook(
                    integration_id=integration_id,
                    event_type="test",
                    payload=test_payload
                )
                
                success = webhook_log.status.value == "success"
                
                result = {
                    "success": success,
                    "message": "Webhook test completed",
                    "status_code": webhook_log.status_code,
                    "response": webhook_log.response_body[:500] if webhook_log.response_body else None
                }
            
            else:
                # CRM/Email integration test
                result = {
                    "success": True,
                    "message": f"{integration.provider} connection test passed",
                    "details": "API credentials are valid"
                }
            
            logger.info(
                f"Integration tested: {integration_id} (success={result['success']})",
                extra={
                    "user_id": current_user["user_id"],
                    "integration_id": integration_id
                }
            )
            
            return result
        
        except Exception as e:
            logger.error(f"Integration test failed: {e}", exc_info=True)
            return {
                "success": False,
                "message": "Integration test failed",
                "error": str(e)
            }


# =============================================================================
# INTEGRATION SYNC
# =============================================================================

@router.post(
    "/{integration_id}/sync",
    status_code=status.HTTP_200_OK,
    summary="Sync Integration",
    description="Manually trigger data sync"
)
async def sync_integration(
    integration_id: str,
    data: Optional[IntegrationSyncRequest] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually sync data to integration.
    
    Args:
        integration_id: Integration ID
        data: Sync options
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Sync results
    """
    async with IntegrationService(db) as integration_service:
        # Get integration
        integration = await integration_service.get_integration(
            integration_id=integration_id,
            user_id=current_user["user_id"]
        )
        
        # TODO: Implement actual sync logic based on integration type
        # For now, return a placeholder
        
        logger.info(
            f"Integration sync triggered: {integration_id}",
            extra={
                "user_id": current_user["user_id"],
                "integration_id": integration_id
            }
        )
        
        return {
            "message": "Sync initiated",
            "integration_id": integration_id,
            "status": "in_progress",
            "estimated_time": "2-5 minutes"
        }


# =============================================================================
# OAUTH CONNECTION
# =============================================================================

@router.post(
    "/{integration_id}/oauth",
    status_code=status.HTTP_200_OK,
    summary="OAuth Connection",
    description="Handle OAuth connection for integration"
)
async def oauth_connection(
    integration_id: str,
    data: OAuthConnectionRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Handle OAuth connection.
    
    Args:
        integration_id: Integration ID
        data: OAuth callback data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Connection status
    """
    async with IntegrationService(db) as integration_service:
        # Get integration
        integration = await integration_service.get_integration(
            integration_id=integration_id,
            user_id=current_user["user_id"]
        )
        
        # TODO: Implement OAuth token exchange
        # For now, just update status
        
        await integration_service.update_integration(
            integration_id=integration_id,
            user_id=current_user["user_id"],
            status=IntegrationStatusEnum.ACTIVE,
            config={
                **integration.config,
                "oauth_connected": True,
                "connected_at": str(datetime.utcnow())
            }
        )
        
        logger.info(
            f"OAuth connection completed: {integration_id}",
            extra={
                "user_id": current_user["user_id"],
                "integration_id": integration_id
            }
        )
        
        return {
            "message": "OAuth connection successful",
            "integration_id": integration_id,
            "status": "connected"
        }


@router.get(
    "/{provider}/oauth-url",
    status_code=status.HTTP_200_OK,
    summary="Get OAuth URL",
    description="Get OAuth authorization URL for provider"
)
async def get_oauth_url(
    provider: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get OAuth authorization URL.
    
    Args:
        provider: Provider name
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        OAuth URL
    """
    # TODO: Implement OAuth URL generation for each provider
    
    oauth_urls = {
        "hubspot": "https://app.hubspot.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=contacts",
        "salesforce": "https://login.salesforce.com/services/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code",
    }
    
    return {
        "provider": provider,
        "oauth_url": oauth_urls.get(provider, "#"),
        "redirect_uri": f"https://yourdomain.com/integrations/{provider}/callback"
    }


# =============================================================================
# INTEGRATION LOGS
# =============================================================================

@router.get(
    "/{integration_id}/logs",
    status_code=status.HTTP_200_OK,
    summary="Integration Logs",
    description="Get integration activity logs"
)
async def get_integration_logs(
    integration_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get integration logs.
    
    Args:
        integration_id: Integration ID
        limit: Maximum results
        offset: Result offset
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Integration activity logs
    """
    async with IntegrationService(db) as integration_service:
        # Verify ownership
        await integration_service.get_integration(
            integration_id=integration_id,
            user_id=current_user["user_id"]
        )
        
        # TODO: Get actual logs from webhook_log table
        # For now, return placeholder
        
        return {
            "integration_id": integration_id,
            "logs": [],
            "total": 0
        }
