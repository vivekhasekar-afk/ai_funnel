from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any


class PublicFunnelResponse(BaseModel):
    funnel_id: str
    title: str
    description: Optional[str] = None
    slug: str
    status: str
    funnel_type: str
    visibility: str
    language: str

    # Visual builder
    layout: Dict[str, Any] = Field(default_factory=dict)
    theme: Dict[str, Any] = Field(default_factory=dict)

    # SEO + generic config
    seo_metadata: Dict[str, Any] = Field(default_factory=dict)
    config: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class EventTrackRequest(BaseModel):
    event_name: str
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    model_config = ConfigDict(from_attributes=True)


class PublicResponseSubmit(BaseModel):
    funnel_id: str
    responses: Dict[str, Any] = Field(...)
    model_config = ConfigDict(from_attributes=True)


class QuickLeadCapture(BaseModel):
    email: EmailStr
    funnel_id: str
    model_config = ConfigDict(from_attributes=True)


class PublicFeedback(BaseModel):
    funnel_id: str
    feedback_text: str
    rating: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


__all__ = [
    "PublicFunnelResponse",
    "EventTrackRequest",
    "PublicResponseSubmit",
    "QuickLeadCapture",
    "PublicFeedback",
]
