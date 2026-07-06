# =============================================================================
# AI FUNNEL BUILDER - API V1 ROUTER
# =============================================================================
# Main router aggregating all v1 API endpoints
# =============================================================================

from fastapi import APIRouter

# Import all v1 routers
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.projects import router as projects_router
from app.api.v1.groups import router as groups_router
from app.api.v1.funnels import router as funnels_router
from app.api.v1.questions import router as questions_router
from app.api.v1.responses import router as responses_router
from app.api.v1.leads import router as leads_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.templates import router as templates_router
from app.api.v1.ai import router as ai_router
from app.api.v1.brands import router as brands_router
from app.api.v1.campaigns import router as campaigns_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.public import router as public_router
from app.api.v1.health import router as health_router
from app.api.v1.enums import router as enums_router

# =============================================================================
# MAIN API ROUTER
# =============================================================================

api_router = APIRouter()


# =============================================================================
# PUBLIC & HEALTH (No authentication required)
# =============================================================================

api_router.include_router(
    health_router,
    prefix="/health",
    tags=["Health"]
)

api_router.include_router(
    public_router,
    prefix="/public",
    tags=["Public"]
)


# =============================================================================
# AUTHENTICATION & USER MANAGEMENT
# =============================================================================

api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    users_router,
    prefix="/users",
    tags=["Users"]
)


# =============================================================================
# HIERARCHY: PROJECTS → GROUPS → FUNNELS
# =============================================================================

# Projects (Top-level brand/business containers)
api_router.include_router(
    projects_router,
    prefix="/projects",
    tags=["Projects"]
)

# Funnel Groups (Product/category/campaign containers within projects)
api_router.include_router(
    groups_router,
    prefix="",
    tags=["Funnel Groups"]
)

# Funnels (Individual quiz/survey/form within groups)
api_router.include_router(
    funnels_router,
    prefix="/funnels",
    tags=["Funnels"]
)


# =============================================================================
# FUNNEL CONTENT & DATA
# =============================================================================

# Questions (Funnel content/steps)
api_router.include_router(
    questions_router,
    prefix="/questions",
    tags=["Questions"]
)

# Responses (User submissions)
api_router.include_router(
    responses_router,
    prefix="/responses",
    tags=["Responses"]
)

# Leads (Captured contacts)
api_router.include_router(
    leads_router,
    prefix="/leads",
    tags=["Leads"]
)


# =============================================================================
# ANALYTICS & INSIGHTS
# =============================================================================

api_router.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["Analytics"]
)


# =============================================================================
# AI & AUTOMATION
# =============================================================================

# AI Generation (Questions, funnels, recommendations)
api_router.include_router(
    ai_router,
    prefix="",
    tags=["AI"]
)

# Templates (Pre-built funnel templates)
api_router.include_router(
    templates_router,
    prefix="/templates",
    tags=["Templates"]
)


# =============================================================================
# LEGACY ROUTERS (To be deprecated/merged into Projects/Groups)
# =============================================================================

# Brands (DEPRECATED - Use Projects instead)
api_router.include_router(
    brands_router,
    prefix="/brands",
    tags=["Brands (Legacy)"]
)

# Campaigns (DEPRECATED - Use Groups with type=campaign instead)
api_router.include_router(
    campaigns_router,
    prefix="/campaigns",
    tags=["Campaigns (Legacy)"]
)


# =============================================================================
# INTEGRATIONS & WEBHOOKS
# =============================================================================

# Integrations (Email, CRM, Analytics)
api_router.include_router(
    integrations_router,
    prefix="/integrations",
    tags=["Integrations"]
)

# Webhooks (External callbacks)
api_router.include_router(
    webhooks_router,
    prefix="/webhooks",
    tags=["Webhooks"]
)

api_router.include_router(
    enums_router,
    prefix="/enums",
    tags=["Enums"]
)
# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["api_router"]
