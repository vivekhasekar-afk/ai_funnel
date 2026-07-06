# =============================================================================
# AI FUNNEL BUILDER - API V1 ROUTER
# =============================================================================
# Version 1 API routes aggregator
# =============================================================================

from fastapi import APIRouter

from app.api.v1 import (
    health,
    auth,
    users,
    funnels,
    questions,
    responses,
    analytics,
    templates,
    leads,
    ai,
    brands,
    campaigns,
    integrations,
    webhooks,
    public,
)

# V1 API Router
api_router = APIRouter()

# Health checks (no prefix)
api_router.include_router(
    health.router,
    tags=["health"]
)

# Authentication
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"]
)

# Users
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

# Funnels
api_router.include_router(
    funnels.router,
    prefix="/funnels",
    tags=["funnels"]
)

# Questions
api_router.include_router(
    questions.router,
    tags=["questions"]
)

# Responses
api_router.include_router(
    responses.router,
    prefix="/responses",
    tags=["responses"]
)

# Analytics
api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["analytics"]
)

# Templates
api_router.include_router(
    templates.router,
    prefix="/templates",
    tags=["templates"]
)

# Leads
api_router.include_router(
    leads.router,
    prefix="/leads",
    tags=["leads"]
)

# AI
api_router.include_router(
    ai.router,
    prefix="/ai",
    tags=["ai"]
)

# Brands
api_router.include_router(
    brands.router,
    prefix="/brands",
    tags=["brands"]
)

# Campaigns
api_router.include_router(
    campaigns.router,
    prefix="/campaigns",
    tags=["campaigns"]
)

# Integrations
api_router.include_router(
    integrations.router,
    prefix="/integrations",
    tags=["integrations"]
)

# Webhooks
api_router.include_router(
    webhooks.router,
    prefix="/webhooks",
    tags=["webhooks"]
)

# Public routes (no auth required)
api_router.include_router(
    public.router,
    prefix="/public",
    tags=["public"]
)
