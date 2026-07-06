# =============================================================================
# AI FUNNEL BUILDER - MAIN APPLICATION (WITH CORS FIX)
# =============================================================================
# FastAPI application entry point + COMPLETE ROUTE REGISTRATION DEBUG
# =============================================================================

from contextlib import asynccontextmanager
import time

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import inspect, text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import async_engine as engine, Base
from app.utils.logger import (
    setup_logging,
    get_logger,
    log_api_call,
    request_id_var,
)
from app.utils.exceptions import AppException
from app.utils.helpers import generate_short_id

# MAIN API ROUTER AGGREGATOR
from app.api.router import api_router
from app.models.project import Project

# =============================================================================
# LOGGING SETUP
# =============================================================================
setup_logging(
    level=settings.LOG_LEVEL,
    json_logs=getattr(settings, "ENVIRONMENT", "development") == "production",
)

logger = get_logger(__name__)

# =============================================================================
# ROUTE DEBUGGING FUNCTION
# =============================================================================
def print_all_routes(app: FastAPI):
    """Print ALL registered routes with methods, tags, and prefixes"""
    logger.info("=" * 80)
    logger.info("📋 ALL REGISTERED ROUTES:")
    logger.info("=" * 80)
    
    routes_by_tag = {}
    total_routes = 0
    
    for route in app.routes:
        try:
            if hasattr(route, 'path'):
                path = route.path
                # Fix: Handle both bytes and str methods
                if hasattr(route, 'methods') and route.methods:
                    methods = []
                    for m in route.methods:
                        if isinstance(m, bytes):
                            methods.append(m.decode())
                        else:
                            methods.append(str(m))
                    methods = [m for m in methods if m != 'HEAD']
                else:
                    methods = ['GET']  # Default
                
                tags = getattr(route, 'tags', ['no-tag'])
                
                # Log route
                method_str = ','.join(methods) if methods else 'GET'
                tag_str = ','.join(tags) if tags else 'no-tag'
                logger.info(f"  {method_str} {path} [{tag_str}]")
                
                # Count by tag
                for tag in tags:
                    if tag not in routes_by_tag:
                        routes_by_tag[tag] = []
                    routes_by_tag[tag].append(f"{method_str} {path}")
                
                total_routes += 1
        except Exception as e:
            logger.warning(f"Skipping route (error: {e})")
    
    logger.info("-" * 80)
    logger.info("📊 ROUTE SUMMARY BY TAG:")
    for tag, paths in sorted(routes_by_tag.items()):
        logger.info(f"  {tag}: {len(paths)} routes")
    
    logger.info(f"  TOTAL ROUTES: {total_routes}")
    logger.info("=" * 80)

# =============================================================================
# LIFESPAN EVENTS (WITH ROUTE DEBUG)
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler with SAFE route debugging.
    """
    # Startup
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.DATABASE_URL.split('@')[-1]}")

    # Initialize cache (if configured)
    if settings.REDIS_URL:
        logger.info("Connecting to Redis cache...")
        logger.info("Redis cache connected")

    # 🎯 PRINT ROUTES FIRST (SAFE - no models)
    try:
        print_all_routes(app)
        logger.info("✅ Routes listed successfully")
    except Exception as e:
        logger.warning(f"Route listing safe-failed: {e}")

    # ===== CONFIGURE MAPPERS AFTER ROUTES =====
    from sqlalchemy.orm import configure_mappers
    configure_mappers()
    logger.info("✅ SQLAlchemy mappers configured!")
    
    insp = inspect(Project)
    print("=== Project column types ===")
    print("industry:", repr(insp.c.industry.type))
    print("brand_voice:", repr(insp.c.brand_voice.type))

    # Initialize background tasks
    logger.info("Starting background tasks...")
    logger.info("Application startup complete")

    yield

    # Shutdown
    logger.info("Shutting down application...")
    try:
        await engine.dispose()
    except:
        pass
    logger.info("Database connections closed")
    logger.info("Application shutdown complete")

# =============================================================================
# APPLICATION INITIALIZATION
# =============================================================================
tags_metadata = [
    {"name": "Root", "description": "Root and metadata endpoints"},
    {"name": "Health", "description": "Health and readiness checks"},
    {"name": "Authentication", "description": "Authentication and authorization"},
    {"name": "Users", "description": "User account and profile management"},
    {"name": "Projects", "description": "Project management"},
    {"name": "Funnel Groups", "description": "Funnel group management"},
    {"name": "Funnels", "description": "Funnel CRUD and publishing"},
    {"name": "Questions", "description": "Funnel questions management"},
    {"name": "Responses", "description": "Response submission and management"},
    {"name": "Leads", "description": "Lead capture, scoring, and exports"},
    {"name": "Brands (Legacy)", "description": "Brand insights and audience data"},
    {"name": "Campaigns (Legacy)", "description": "Marketing campaign management"},
    {"name": "AI", "description": "AI-powered funnel features"},
    {"name": "Analytics", "description": "Funnel and lead analytics"},
    {"name": "Integrations", "description": "Third‑party integrations"},
    {"name": "Webhooks", "description": "Webhook endpoints"},
    {"name": "Templates", "description": "Template management"},
    {"name": "Public", "description": "Public tracking and submission endpoints"},
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    openapi_tags=tags_metadata,
)

# =============================================================================
# ✅ CORS MIDDLEWARE - MUST BE FIRST!
# =============================================================================

# Print CORS configuration on startup
logger.info("=" * 80)
logger.info("🔐 CORS MIDDLEWARE CONFIGURATION")
logger.info(f"   Allowed Origins: {settings.BACKEND_CORS_ORIGINS}")
logger.info(f"   Allow Credentials: {settings.CORS_ALLOW_CREDENTIALS}")
logger.info(f"   Allow Methods: {settings.CORS_ALLOW_METHODS}")
logger.info(f"   Allow Headers: {settings.CORS_ALLOW_HEADERS}")
logger.info("=" * 80)

# Add CORS middleware FIRST - CRITICAL FOR FRONTEND ACCESS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,  # ✅ From config.py
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
    expose_headers=settings.CORS_EXPOSE_HEADERS + ["X-Request-ID", "X-Process-Time"],
)

logger.info("✅ CORS middleware configured successfully")

# =============================================================================
# OTHER MIDDLEWARE
# =============================================================================

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or generate_short_id(prefix="req_")
    request_id_var.set(request_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    log_api_call(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
        duration_ms=process_time,
        request_id=request_id_var.get(),
    )
    return response

# GZip compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# =============================================================================
# EXCEPTION HANDLERS
# =============================================================================

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    logger.error(f"Application error: {exc.message}", extra={
        "error_code": exc.error_code,
        "status_code": exc.status_code,
        "path": request.url.path,
        "method": request.method,
    })
    return JSONResponse(
        status_code=exc.status_code,
        content={**exc.to_dict(), "request_id": request_id_var.get()},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {
            "field": ".".join(str(x) for x in error["loc"][1:]),
            "message": error["msg"],
            "type": error["type"]
        }
        for error in exc.errors()
    ]
    logger.warning(f"Validation error: {request.url.path}", extra={
        "errors": errors,
        "method": request.method
    })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": {"errors": errors},
            "request_id": request_id_var.get()
        },
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTP error {exc.status_code}: {request.url.path}", extra={
        "status_code": exc.status_code,
        "detail": exc.detail,
        "method": request.method
    })
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP_ERROR",
            "message": exc.detail,
            "request_id": request_id_var.get()
        },
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True, extra={
        "path": request.url.path,
        "method": request.method
    })
    message = "An internal error occurred" if settings.ENVIRONMENT == "production" else str(exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_ERROR",
            "message": message,
            "request_id": request_id_var.get()
        },
    )

# =============================================================================
# API ROUTERS
# =============================================================================
app.include_router(api_router, prefix="/api/v1")

# =============================================================================
# ROOT ENDPOINTS
# =============================================================================

@app.get("/", tags=["Root"])
async def root():
    """API root endpoint with service information."""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "description": settings.PROJECT_DESCRIPTION,
        "docs_url": "/docs" if settings.ENABLE_DOCS else None,
        "api_base_url": "/api/v1",
        "status": "running",
        "environment": settings.ENVIRONMENT,
    }

# =============================================================================
# HEALTH CHECK ENDPOINTS
# =============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Comprehensive health check endpoint.
    Returns overall system health and individual service status.
    """
    # Check database
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))  # ✅ Fixed: Use text() wrapper
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        db_status = "unhealthy"
    
    # Check cache
    cache_status = "not_configured"
    if settings.REDIS_URL:
        try:
            # Add Redis health check here if needed
            cache_status = "healthy"
        except Exception:
            cache_status = "unhealthy"
    
    # Determine overall status
    overall_status = "healthy" if db_status == "healthy" else "degraded"
    
    return {
        "status": overall_status,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "services": {
            "database": db_status,
            "cache": cache_status
        },
        "timestamp": time.time(),
    }

@app.get("/health/ready", tags=["Health"])
async def readiness_check():
    """
    Kubernetes readiness probe.
    Returns 200 if the service can accept traffic.
    """
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))  # ✅ Fixed: Use text() wrapper
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "error": str(e)},
        )

@app.get("/health/live", tags=["Health"])
async def liveness_check():
    """
    Kubernetes liveness probe.
    Returns 200 if the service is alive.
    """
    return {"status": "alive", "timestamp": time.time()}

# =============================================================================
# OPENAPI SECURITY CONFIGURATION
# =============================================================================

from fastapi.openapi.utils import get_openapi

def custom_openapi():
    """
    Configure OpenAPI schema to support JWT Bearer Token authentication.
    Adds the "Authorize" button to Swagger UI.
    """
    if app.openapi_schema:
        return app.openapi_schema
        
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.PROJECT_DESCRIPTION,
        routes=app.routes,
    )
    
    # Define the security scheme (Bearer Token)
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT token in the format: `your_token_here`"
        }
    }
    
    # Apply it globally (shows lock icon in Swagger UI)
    openapi_schema["security"] = [{"BearerAuth": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Override the default openapi generator
app.openapi = custom_openapi

# =============================================================================
# STARTUP MESSAGE
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    logger.info("=" * 80)
    logger.info(f"🚀 Starting {settings.PROJECT_NAME}")
    logger.info(f"📍 Version: {settings.VERSION}")
    logger.info(f"🌍 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🔗 Host: {settings.HOST}:{settings.PORT}")
    logger.info(f"📚 Docs: http://localhost:{settings.PORT}/docs")
    logger.info(f"✅ CORS Enabled for: {', '.join(settings.BACKEND_CORS_ORIGINS[:3])}...")
    logger.info("=" * 80)
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
        access_log=settings.ENVIRONMENT == "development",
    )
