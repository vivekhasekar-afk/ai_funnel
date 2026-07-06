from pydantic import BaseModel, Field, AnyUrl, ConfigDict
from typing import Optional, Dict


class IntegrationCreate(BaseModel):
    name: str
    api_key: Optional[str] = None
    endpoint_url: AnyUrl
    config: Optional[Dict[str, str]] = None
    model_config = ConfigDict(from_attributes=True)


class IntegrationUpdate(BaseModel):
    api_key: Optional[str] = None
    endpoint_url: Optional[AnyUrl] = None
    config: Optional[Dict[str, str]] = None
    model_config = ConfigDict(from_attributes=True)


class IntegrationResponse(BaseModel):
    id: str
    name: str
    endpoint_url: AnyUrl
    status: str
    created_at: str
    model_config = ConfigDict(from_attributes=True)


class IntegrationTestRequest(BaseModel):
    integration_id: str
    model_config = ConfigDict(from_attributes=True)


class IntegrationSyncRequest(BaseModel):
    integration_id: str
    sync_parameters: Optional[Dict[str, str]] = None
    model_config = ConfigDict(from_attributes=True)


class OAuthConnectionRequest(BaseModel):
    provider: str
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXPORTS
# =============================================================================


__all__ = [
    "IntegrationCreate",
    "IntegrationUpdate",
    "IntegrationResponse",
    "IntegrationTestRequest",
    "IntegrationSyncRequest",
    "OAuthConnectionRequest",
]
