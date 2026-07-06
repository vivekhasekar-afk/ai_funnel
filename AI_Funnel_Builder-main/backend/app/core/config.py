# =============================================================================
# AI FUNNEL BUILDER - APPLICATION CONFIGURATION
# =============================================================================
# Type-safe settings management using Pydantic BaseSettings
# Automatically loads from environment variables and .env file
# =============================================================================

from typing import List, Optional, Union
from functools import lru_cache
from pydantic import (
    AnyHttpUrl,
    EmailStr,
    PostgresDsn,
    RedisDsn,
    validator,
    Field
)
from pydantic_settings import SettingsConfigDict, BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    
    # -------------------------------------------------------------------------
    # ENVIRONMENT CONFIGURATION
    # -------------------------------------------------------------------------
    ENVIRONMENT: str = Field(default="development", description="Application environment")
    APP_ENV: str = Field(default="development", pattern="^(development|staging|production)$")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    DEBUG: bool = True
    
    # -------------------------------------------------------------------------
    # APPLICATION
    # -------------------------------------------------------------------------
    APP_NAME: str = "AI Funnel Builder"
    API_VERSION: str = "v1"
    SECRET_KEY: str = Field(
        default="ai-funnel-super-secret-64-char-key-1234567890abcdef-change-in-prod",
        min_length=32,
        description="Secret key for signing tokens (min 32 chars)"
    )
    
    # -------------------------------------------------------------------------
    # CORS CONFIGURATION - CONSOLIDATED & FIXED
    # -------------------------------------------------------------------------
    BACKEND_CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:5173",
        ],
        description="Allowed CORS origins"
    )
    
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    CORS_EXPOSE_HEADERS: List[str] = ["*"]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [origin.strip() for origin in v.split(",")]
        elif isinstance(v, list):
            return v
        return [str(v)]
    
    # -------------------------------------------------------------------------
    # BACKWARD COMPATIBILITY PROPERTIES
    # -------------------------------------------------------------------------
    @property
    def PROJECT_NAME(self) -> str:
        """Alias for APP_NAME."""
        return self.APP_NAME
    
    @property
    def VERSION(self) -> str:
        """API version alias."""
        return self.API_VERSION
    
    @property
    def PROJECT_DESCRIPTION(self) -> str:
        """Description for FastAPI docs."""
        return "AI-Powered Funnel Optimization Platform"
    
    @property
    def ENABLE_DOCS(self) -> bool:
        """Enable Swagger docs in development."""
        return self.DEBUG
    
    @property
    def ENABLE_REDOC(self) -> bool:
        """Enable ReDoc docs in development."""
        return self.DEBUG
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Alias for BACKEND_CORS_ORIGINS (for main.py compatibility)."""
        return self.BACKEND_CORS_ORIGINS
    
    @property
    def FRONTEND_URL(self) -> str:
        """Primary frontend URL."""
        return self.BACKEND_CORS_ORIGINS[0] if self.BACKEND_CORS_ORIGINS else "http://localhost:3000"
    
    # -------------------------------------------------------------------------
    # SERVER
    # -------------------------------------------------------------------------
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    RELOAD: bool = True
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.APP_ENV == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.APP_ENV == "development"
    
    # -------------------------------------------------------------------------
    # DATABASE (PostgreSQL)
    # -------------------------------------------------------------------------
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@127.0.0.1:5432/funnelml",
        description="PostgreSQL database URL"
    )
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_ECHO: bool = False
    TEST_DATABASE_URL: Optional[str] = None
    
    @property
    def async_database_url(self) -> str:
        """Convert PostgreSQL URL to async driver."""
        return str(self.DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://")
    
    # -------------------------------------------------------------------------
    # REDIS (Caching & Celery)
    # -------------------------------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_DB: int = 0
    REDIS_CELERY_DB: int = 1
    REDIS_MAX_CONNECTIONS: int = 50
    
    @property
    def redis_cache_url(self) -> str:
        """Redis URL for caching."""
        base_url = str(self.REDIS_URL).rsplit("/", 1)[0]
        return f"{base_url}/{self.REDIS_CACHE_DB}"
    
    @property
    def redis_celery_url(self) -> str:
        """Redis URL for Celery broker."""
        base_url = str(self.REDIS_URL).rsplit("/", 1)[0]
        return f"{base_url}/{self.REDIS_CELERY_DB}"
    
    # -------------------------------------------------------------------------
    # MONGODB (Flexible Data Storage)
    # -------------------------------------------------------------------------
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "funnel_platform"
    MONGODB_MAX_POOL_SIZE: int = 100
    
    # -------------------------------------------------------------------------
    # OPENAI (AI Generation)
    # -------------------------------------------------------------------------
    OPENAI_API_KEY: str = Field(
        default="sk-dev-placeholder-key-replace-with-real-openai-key",
        description="OpenAI API key"
    )
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = Field(default=0.7, ge=0.0, le=1.0)
    OPENAI_TIMEOUT: int = 30
    OPENAI_MAX_RETRIES: int = 3
    OPENAI_COST_PER_1K_TOKENS_INPUT: float = 0.01
    OPENAI_COST_PER_1K_TOKENS_OUTPUT: float = 0.03
    
    # -------------------------------------------------------------------------
    # JWT AUTHENTICATION
    # -------------------------------------------------------------------------
    JWT_SECRET_KEY: str = Field(
        default="jwt-dev-secret-key-change-in-production-min-32-chars-long",
        min_length=32,
        description="JWT secret key (min 32 chars)"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    @property
    def jwt_access_token_expire_seconds(self) -> int:
        return self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    
    @property
    def jwt_refresh_token_expire_seconds(self) -> int:
        return self.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    
    # -------------------------------------------------------------------------
    # EMAIL (SendGrid)
    # -------------------------------------------------------------------------
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: Optional[str] = None
    SENDGRID_FROM_NAME: str = "AI Funnel Builder"
    SENDGRID_WELCOME_TEMPLATE_ID: Optional[str] = None
    SENDGRID_LEAD_NOTIFICATION_TEMPLATE_ID: Optional[str] = None
    
    @property
    def email_enabled(self) -> bool:
        return bool(self.SENDGRID_API_KEY and self.SENDGRID_FROM_EMAIL)
    
    # -------------------------------------------------------------------------
    # STRIPE (Payments)
    # -------------------------------------------------------------------------
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Stripe Price IDs
    STRIPE_PRICE_ID_STARTER: str = Field(
        default="price_starter_dev",
        description="Stripe Price ID for Starter plan"
    )
    STRIPE_PRICE_ID_PREMIUM: str = Field(
        default="price_premium_dev",
        description="Stripe Price ID for Premium plan"
    )
    STRIPE_PRICE_ID_PRO: str = Field(
        default="price_pro_dev",
        description="Stripe Price ID for Pro plan"
    )
    STRIPE_PRICE_ID_ENTERPRISE: str = Field(
        default="price_enterprise_dev",
        description="Stripe Price ID for Enterprise plan"
    )
    
    # Legacy compatibility
    STRIPE_PRICE_CREATOR_PRO: Optional[str] = None
    STRIPE_PRICE_BRAND_STARTER: Optional[str] = None
    
    @property
    def payments_enabled(self) -> bool:
        return bool(self.STRIPE_SECRET_KEY and self.STRIPE_PUBLISHABLE_KEY)
    
    # -------------------------------------------------------------------------
    # AWS S3 (File Storage)
    # -------------------------------------------------------------------------
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET_NAME: Optional[str] = None
    AWS_S3_REGION: str = "us-east-1"
    AWS_S3_PUBLIC_URL: Optional[str] = None
    
    @property
    def s3_enabled(self) -> bool:
        return bool(
            self.AWS_ACCESS_KEY_ID and 
            self.AWS_SECRET_ACCESS_KEY and 
            self.AWS_S3_BUCKET_NAME
        )
    
    # -------------------------------------------------------------------------
    # META/FACEBOOK (Ads & Pixel)
    # -------------------------------------------------------------------------
    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_ACCESS_TOKEN: Optional[str] = None
    META_PIXEL_ID: Optional[str] = None
    
    # -------------------------------------------------------------------------
    # GOOGLE (Analytics & Ads)
    # -------------------------------------------------------------------------
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_ANALYTICS_ID: Optional[str] = None
    GOOGLE_ADS_DEVELOPER_TOKEN: Optional[str] = None
    
    # -------------------------------------------------------------------------
    # SENTRY (Error Tracking)
    # -------------------------------------------------------------------------
    SENTRY_DSN: Optional[str] = None
    SENTRY_ENVIRONMENT: Optional[str] = None
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1
    
    @property
    def sentry_enabled(self) -> bool:
        return bool(self.SENTRY_DSN)
    
    # -------------------------------------------------------------------------
    # RATE LIMITING
    # -------------------------------------------------------------------------
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AI_GENERATION: str = "5/minute"
    RATE_LIMIT_RESPONSE_SUBMIT: str = "100/minute"
    
    # -------------------------------------------------------------------------
    # CELERY (Background Tasks)
    # -------------------------------------------------------------------------
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_ACCEPT_CONTENT: List[str] = ["json"]
    CELERY_TIMEZONE: str = "UTC"
    CELERY_ENABLE_UTC: bool = True
    
    # -------------------------------------------------------------------------
    # ML/AI MODELS
    # -------------------------------------------------------------------------
    ML_MODELS_PATH: str = "./ml_models"
    ML_COMPLETION_MODEL_VERSION: str = "v1"
    ML_LEAD_SCORING_MODEL_VERSION: str = "v1"
    ML_RETRAIN_SCHEDULE: str = "weekly"
    
    # -------------------------------------------------------------------------
    # DATA PIPELINE
    # -------------------------------------------------------------------------
    DATA_WAREHOUSE_ENABLED: bool = False
    DATA_WAREHOUSE_TYPE: str = "bigquery"
    BIGQUERY_PROJECT_ID: Optional[str] = None
    BIGQUERY_DATASET_ID: Optional[str] = None
    BIGQUERY_CREDENTIALS_PATH: Optional[str] = None
    
    # -------------------------------------------------------------------------
    # MONITORING & LOGGING
    # -------------------------------------------------------------------------
    LOG_FORMAT: str = "json"
    LOG_FILE_PATH: str = "./logs/app.log"
    LOG_ROTATION: str = "10 MB"
    LOG_RETENTION: str = "30 days"
    
    # -------------------------------------------------------------------------
    # FEATURE FLAGS
    # -------------------------------------------------------------------------
    FEATURE_TEMPLATE_MARKETPLACE: bool = False
    FEATURE_BRAND_PORTAL: bool = False
    FEATURE_AB_TESTING: bool = False
    FEATURE_WEBHOOKS: bool = False
    
    # -------------------------------------------------------------------------
    # SECURITY
    # -------------------------------------------------------------------------
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0"]
    SECURE_SSL_REDIRECT: bool = False
    SESSION_COOKIE_SECURE: bool = False
    CSRF_COOKIE_SECURE: bool = False
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_allowed_hosts(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse allowed hosts from comma-separated string or list."""
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    # -------------------------------------------------------------------------
    # ANALYTICS & TRACKING
    # -------------------------------------------------------------------------
    ENABLE_ANALYTICS_TRACKING: bool = True
    ANALYTICS_BATCH_SIZE: int = 100
    ANALYTICS_FLUSH_INTERVAL: int = 5
    
    # -------------------------------------------------------------------------
    # QUOTAS & LIMITS
    # -------------------------------------------------------------------------
    QUOTA_FREE_FUNNELS: int = 3
    QUOTA_FREE_RESPONSES_PER_MONTH: int = 100
    QUOTA_FREE_LEADS_EXPORT: int = 50
    QUOTA_PRO_FUNNELS: int = 50
    QUOTA_PRO_RESPONSES_PER_MONTH: int = 10000
    QUOTA_PRO_LEADS_EXPORT: int = -1  # Unlimited
    
    # -------------------------------------------------------------------------
    # CACHE TTL (seconds)
    # -------------------------------------------------------------------------
    CACHE_TTL_BENCHMARKS: int = 86400  # 24 hours
    CACHE_TTL_ANALYTICS: int = 3600    # 1 hour
    CACHE_TTL_TEMPLATES: int = 7200    # 2 hours
    CACHE_TTL_USER_SESSION: int = 1800 # 30 minutes
    
    # -------------------------------------------------------------------------
    # PYDANTIC CONFIGURATION
    # -------------------------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # -------------------------------------------------------------------------
    # HELPER METHODS
    # -------------------------------------------------------------------------
    def get_database_url(self, async_driver: bool = False) -> str:
        """Get database URL with optional async driver."""
        if async_driver:
            return self.async_database_url
        return str(self.DATABASE_URL)
    
    def get_quota(self, tier: str, resource: str) -> int:
        """Get quota value for a specific tier and resource."""
        quota_map = {
            "free": {
                "funnels": self.QUOTA_FREE_FUNNELS,
                "responses": self.QUOTA_FREE_RESPONSES_PER_MONTH,
                "leads_export": self.QUOTA_FREE_LEADS_EXPORT,
            },
            "pro": {
                "funnels": self.QUOTA_PRO_FUNNELS,
                "responses": self.QUOTA_PRO_RESPONSES_PER_MONTH,
                "leads_export": self.QUOTA_PRO_LEADS_EXPORT,
            }
        }
        return quota_map.get(tier, {}).get(resource, 0)
    
    def get_cache_ttl(self, cache_type: str) -> int:
        """Get cache TTL for a specific cache type."""
        cache_ttls = {
            "benchmarks": self.CACHE_TTL_BENCHMARKS,
            "analytics": self.CACHE_TTL_ANALYTICS,
            "templates": self.CACHE_TTL_TEMPLATES,
            "user_session": self.CACHE_TTL_USER_SESSION,
        }
        return cache_ttls.get(cache_type, 3600)


# =============================================================================
# SETTINGS INSTANCE (Singleton)
# =============================================================================

@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to ensure only one instance is created.
    """
    return Settings()


# Global settings instance
settings = get_settings()


# =============================================================================
# CONFIGURATION VALIDATION
# =============================================================================

def validate_configuration() -> None:
    """
    Validate critical configuration at startup.
    Raises warnings for development, errors for production.
    """
    warnings = []
    errors = []
    
    # Check secret keys
    if "change-in-prod" in settings.SECRET_KEY.lower() or len(settings.SECRET_KEY) < 32:
        msg = "SECRET_KEY should be changed from default value and be at least 32 characters"
        if settings.is_production:
            errors.append(msg)
        else:
            warnings.append(msg)
    
    if "change-in-production" in settings.JWT_SECRET_KEY.lower() or len(settings.JWT_SECRET_KEY) < 32:
        msg = "JWT_SECRET_KEY should be changed from default value and be at least 32 characters"
        if settings.is_production:
            errors.append(msg)
        else:
            warnings.append(msg)
    
    # Check OpenAI key
    if settings.OPENAI_API_KEY.startswith("sk-dev") or "placeholder" in settings.OPENAI_API_KEY.lower():
        msg = "OPENAI_API_KEY should be set to a valid key for AI features to work"
        if settings.is_production:
            errors.append(msg)
        else:
            warnings.append(msg)
    
    # Check CORS origins in production
    if settings.is_production:
        localhost_origins = [
            origin for origin in settings.BACKEND_CORS_ORIGINS 
            if "localhost" in origin or "127.0.0.1" in origin
        ]
        if localhost_origins:
            warnings.append(
                f"BACKEND_CORS_ORIGINS contains localhost URLs in production: {localhost_origins}"
            )
    
    # Print results
    if errors:
        error_msg = "🔴 Configuration Errors (must be fixed):\n" + "\n".join(f"  ❌ {e}" for e in errors)
        print(error_msg)
        if settings.is_production:
            raise ValueError(error_msg)
    
    if warnings:
        warning_msg = "⚠️  Configuration Warnings:\n" + "\n".join(f"  ⚠️  {w}" for w in warnings)
        print(warning_msg + "\n")
    
    if not errors and not warnings:
        print("✅ Configuration validation passed\n")


# Run validation on import
validate_configuration()


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "settings",
    "get_settings",
    "Settings",
    "validate_configuration"
]
# =============================================================================
# AI FUNNEL BUILDER - APPLICATION CONFIGURATION
# =============================================================================
# Type-safe settings management using Pydantic BaseSettings
# Automatically loads from environment variables and .env file
# =============================================================================

from typing import List, Optional, Union
from functools import lru_cache
from pydantic import (
    AnyHttpUrl,
    EmailStr,
    PostgresDsn,
    RedisDsn,
    validator,
    Field
)
from pydantic_settings import SettingsConfigDict, BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    
    # -------------------------------------------------------------------------
    # ENVIRONMENT CONFIGURATION
    # -------------------------------------------------------------------------
    ENVIRONMENT: str = Field(default="development", description="Application environment")
    APP_ENV: str = Field(default="development", pattern="^(development|staging|production)$")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    DEBUG: bool = True
    
    # -------------------------------------------------------------------------
    # APPLICATION
    # -------------------------------------------------------------------------
    APP_NAME: str = "AI Funnel Builder"
    API_VERSION: str = "v1"
    SECRET_KEY: str = Field(
        default="ai-funnel-super-secret-64-char-key-1234567890abcdef-change-in-prod",
        min_length=32,
        description="Secret key for signing tokens (min 32 chars)"
    )
    
    # -------------------------------------------------------------------------
    # CORS CONFIGURATION - CONSOLIDATED & FIXED
    # -------------------------------------------------------------------------
    BACKEND_CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:5173",
        ],
        description="Allowed CORS origins"
    )
    
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    CORS_EXPOSE_HEADERS: List[str] = ["*"]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [origin.strip() for origin in v.split(",")]
        elif isinstance(v, list):
            return v
        return [str(v)]
    
    # -------------------------------------------------------------------------
    # BACKWARD COMPATIBILITY PROPERTIES
    # -------------------------------------------------------------------------
    @property
    def PROJECT_NAME(self) -> str:
        """Alias for APP_NAME."""
        return self.APP_NAME
    
    @property
    def VERSION(self) -> str:
        """API version alias."""
        return self.API_VERSION
    
    @property
    def PROJECT_DESCRIPTION(self) -> str:
        """Description for FastAPI docs."""
        return "AI-Powered Funnel Optimization Platform"
    
    @property
    def ENABLE_DOCS(self) -> bool:
        """Enable Swagger docs in development."""
        return self.DEBUG
    
    @property
    def ENABLE_REDOC(self) -> bool:
        """Enable ReDoc docs in development."""
        return self.DEBUG
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Alias for BACKEND_CORS_ORIGINS (for main.py compatibility)."""
        return self.BACKEND_CORS_ORIGINS
    
    @property
    def FRONTEND_URL(self) -> str:
        """Primary frontend URL."""
        return self.BACKEND_CORS_ORIGINS[0] if self.BACKEND_CORS_ORIGINS else "http://localhost:3000"
    
    # -------------------------------------------------------------------------
    # SERVER
    # -------------------------------------------------------------------------
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    RELOAD: bool = True
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.APP_ENV == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.APP_ENV == "development"
    
    # -------------------------------------------------------------------------
    # DATABASE (PostgreSQL)
    # -------------------------------------------------------------------------
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@127.0.0.1:5432/funnelml",
        description="PostgreSQL database URL"
    )
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_ECHO: bool = False
    TEST_DATABASE_URL: Optional[str] = None
    
    @property
    def async_database_url(self) -> str:
        """Convert PostgreSQL URL to async driver."""
        return str(self.DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://")
    
    # -------------------------------------------------------------------------
    # REDIS (Caching & Celery)
    # -------------------------------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_DB: int = 0
    REDIS_CELERY_DB: int = 1
    REDIS_MAX_CONNECTIONS: int = 50
    
    @property
    def redis_cache_url(self) -> str:
        """Redis URL for caching."""
        base_url = str(self.REDIS_URL).rsplit("/", 1)[0]
        return f"{base_url}/{self.REDIS_CACHE_DB}"
    
    @property
    def redis_celery_url(self) -> str:
        """Redis URL for Celery broker."""
        base_url = str(self.REDIS_URL).rsplit("/", 1)[0]
        return f"{base_url}/{self.REDIS_CELERY_DB}"
    
    # -------------------------------------------------------------------------
    # MONGODB (Flexible Data Storage)
    # -------------------------------------------------------------------------
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "funnel_platform"
    MONGODB_MAX_POOL_SIZE: int = 100
    
    # -------------------------------------------------------------------------
    # OPENAI (AI Generation)
    # -------------------------------------------------------------------------
    OPENAI_API_KEY: str = Field(
        default="sk-dev-placeholder-key-replace-with-real-openai-key",
        description="OpenAI API key"
    )
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = Field(default=0.7, ge=0.0, le=1.0)
    OPENAI_TIMEOUT: int = 30
    OPENAI_MAX_RETRIES: int = 3
    OPENAI_COST_PER_1K_TOKENS_INPUT: float = 0.01
    OPENAI_COST_PER_1K_TOKENS_OUTPUT: float = 0.03
    
    # -------------------------------------------------------------------------
    # JWT AUTHENTICATION
    # -------------------------------------------------------------------------
    JWT_SECRET_KEY: str = Field(
        default="jwt-dev-secret-key-change-in-production-min-32-chars-long",
        min_length=32,
        description="JWT secret key (min 32 chars)"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    @property
    def jwt_access_token_expire_seconds(self) -> int:
        return self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    
    @property
    def jwt_refresh_token_expire_seconds(self) -> int:
        return self.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    
    # -------------------------------------------------------------------------
    # EMAIL (SendGrid)
    # -------------------------------------------------------------------------
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: Optional[str] = None
    SENDGRID_FROM_NAME: str = "AI Funnel Builder"
    SENDGRID_WELCOME_TEMPLATE_ID: Optional[str] = None
    SENDGRID_LEAD_NOTIFICATION_TEMPLATE_ID: Optional[str] = None
    
    @property
    def email_enabled(self) -> bool:
        return bool(self.SENDGRID_API_KEY and self.SENDGRID_FROM_EMAIL)
    
    # -------------------------------------------------------------------------
    # STRIPE (Payments)
    # -------------------------------------------------------------------------
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Stripe Price IDs
    STRIPE_PRICE_ID_STARTER: str = Field(
        default="price_starter_dev",
        description="Stripe Price ID for Starter plan"
    )
    STRIPE_PRICE_ID_PREMIUM: str = Field(
        default="price_premium_dev",
        description="Stripe Price ID for Premium plan"
    )
    STRIPE_PRICE_ID_PRO: str = Field(
        default="price_pro_dev",
        description="Stripe Price ID for Pro plan"
    )
    STRIPE_PRICE_ID_ENTERPRISE: str = Field(
        default="price_enterprise_dev",
        description="Stripe Price ID for Enterprise plan"
    )
    
    # Legacy compatibility
    STRIPE_PRICE_CREATOR_PRO: Optional[str] = None
    STRIPE_PRICE_BRAND_STARTER: Optional[str] = None
    
    @property
    def payments_enabled(self) -> bool:
        return bool(self.STRIPE_SECRET_KEY and self.STRIPE_PUBLISHABLE_KEY)
    
    # -------------------------------------------------------------------------
    # AWS S3 (File Storage)
    # -------------------------------------------------------------------------
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET_NAME: Optional[str] = None
    AWS_S3_REGION: str = "us-east-1"
    AWS_S3_PUBLIC_URL: Optional[str] = None
    
    @property
    def s3_enabled(self) -> bool:
        return bool(
            self.AWS_ACCESS_KEY_ID and 
            self.AWS_SECRET_ACCESS_KEY and 
            self.AWS_S3_BUCKET_NAME
        )
    
    # -------------------------------------------------------------------------
    # META/FACEBOOK (Ads & Pixel)
    # -------------------------------------------------------------------------
    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_ACCESS_TOKEN: Optional[str] = None
    META_PIXEL_ID: Optional[str] = None
    
    # -------------------------------------------------------------------------
    # GOOGLE (Analytics & Ads)
    # -------------------------------------------------------------------------
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_ANALYTICS_ID: Optional[str] = None
    GOOGLE_ADS_DEVELOPER_TOKEN: Optional[str] = None
    
    # -------------------------------------------------------------------------
    # SENTRY (Error Tracking)
    # -------------------------------------------------------------------------
    SENTRY_DSN: Optional[str] = None
    SENTRY_ENVIRONMENT: Optional[str] = None
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1
    
    @property
    def sentry_enabled(self) -> bool:
        return bool(self.SENTRY_DSN)
    
    # -------------------------------------------------------------------------
    # RATE LIMITING
    # -------------------------------------------------------------------------
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AI_GENERATION: str = "5/minute"
    RATE_LIMIT_RESPONSE_SUBMIT: str = "100/minute"
    
    # -------------------------------------------------------------------------
    # CELERY (Background Tasks)
    # -------------------------------------------------------------------------
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_ACCEPT_CONTENT: List[str] = ["json"]
    CELERY_TIMEZONE: str = "UTC"
    CELERY_ENABLE_UTC: bool = True
    
    # -------------------------------------------------------------------------
    # ML/AI MODELS
    # -------------------------------------------------------------------------
    ML_MODELS_PATH: str = "./ml_models"
    ML_COMPLETION_MODEL_VERSION: str = "v1"
    ML_LEAD_SCORING_MODEL_VERSION: str = "v1"
    ML_RETRAIN_SCHEDULE: str = "weekly"
    
    # -------------------------------------------------------------------------
    # DATA PIPELINE
    # -------------------------------------------------------------------------
    DATA_WAREHOUSE_ENABLED: bool = False
    DATA_WAREHOUSE_TYPE: str = "bigquery"
    BIGQUERY_PROJECT_ID: Optional[str] = None
    BIGQUERY_DATASET_ID: Optional[str] = None
    BIGQUERY_CREDENTIALS_PATH: Optional[str] = None
    
    # -------------------------------------------------------------------------
    # MONITORING & LOGGING
    # -------------------------------------------------------------------------
    LOG_FORMAT: str = "json"
    LOG_FILE_PATH: str = "./logs/app.log"
    LOG_ROTATION: str = "10 MB"
    LOG_RETENTION: str = "30 days"
    
    # -------------------------------------------------------------------------
    # FEATURE FLAGS
    # -------------------------------------------------------------------------
    FEATURE_TEMPLATE_MARKETPLACE: bool = False
    FEATURE_BRAND_PORTAL: bool = False
    FEATURE_AB_TESTING: bool = False
    FEATURE_WEBHOOKS: bool = False
    
    # -------------------------------------------------------------------------
    # SECURITY
    # -------------------------------------------------------------------------
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0"]
    SECURE_SSL_REDIRECT: bool = False
    SESSION_COOKIE_SECURE: bool = False
    CSRF_COOKIE_SECURE: bool = False
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_allowed_hosts(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse allowed hosts from comma-separated string or list."""
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    # -------------------------------------------------------------------------
    # ANALYTICS & TRACKING
    # -------------------------------------------------------------------------
    ENABLE_ANALYTICS_TRACKING: bool = True
    ANALYTICS_BATCH_SIZE: int = 100
    ANALYTICS_FLUSH_INTERVAL: int = 5
    
    # -------------------------------------------------------------------------
    # QUOTAS & LIMITS
    # -------------------------------------------------------------------------
    QUOTA_FREE_FUNNELS: int = 3
    QUOTA_FREE_RESPONSES_PER_MONTH: int = 100
    QUOTA_FREE_LEADS_EXPORT: int = 50
    QUOTA_PRO_FUNNELS: int = 50
    QUOTA_PRO_RESPONSES_PER_MONTH: int = 10000
    QUOTA_PRO_LEADS_EXPORT: int = -1  # Unlimited
    
    # -------------------------------------------------------------------------
    # CACHE TTL (seconds)
    # -------------------------------------------------------------------------
    CACHE_TTL_BENCHMARKS: int = 86400  # 24 hours
    CACHE_TTL_ANALYTICS: int = 3600    # 1 hour
    CACHE_TTL_TEMPLATES: int = 7200    # 2 hours
    CACHE_TTL_USER_SESSION: int = 1800 # 30 minutes
    
    # -------------------------------------------------------------------------
    # PYDANTIC CONFIGURATION
    # -------------------------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # -------------------------------------------------------------------------
    # HELPER METHODS
    # -------------------------------------------------------------------------
    def get_database_url(self, async_driver: bool = False) -> str:
        """Get database URL with optional async driver."""
        if async_driver:
            return self.async_database_url
        return str(self.DATABASE_URL)
    
    def get_quota(self, tier: str, resource: str) -> int:
        """Get quota value for a specific tier and resource."""
        quota_map = {
            "free": {
                "funnels": self.QUOTA_FREE_FUNNELS,
                "responses": self.QUOTA_FREE_RESPONSES_PER_MONTH,
                "leads_export": self.QUOTA_FREE_LEADS_EXPORT,
            },
            "pro": {
                "funnels": self.QUOTA_PRO_FUNNELS,
                "responses": self.QUOTA_PRO_RESPONSES_PER_MONTH,
                "leads_export": self.QUOTA_PRO_LEADS_EXPORT,
            }
        }
        return quota_map.get(tier, {}).get(resource, 0)
    
    def get_cache_ttl(self, cache_type: str) -> int:
        """Get cache TTL for a specific cache type."""
        cache_ttls = {
            "benchmarks": self.CACHE_TTL_BENCHMARKS,
            "analytics": self.CACHE_TTL_ANALYTICS,
            "templates": self.CACHE_TTL_TEMPLATES,
            "user_session": self.CACHE_TTL_USER_SESSION,
        }
        return cache_ttls.get(cache_type, 3600)


# =============================================================================
# SETTINGS INSTANCE (Singleton)
# =============================================================================

@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to ensure only one instance is created.
    """
    return Settings()


# Global settings instance
settings = get_settings()


# =============================================================================
# CONFIGURATION VALIDATION
# =============================================================================

def validate_configuration() -> None:
    """
    Validate critical configuration at startup.
    Raises warnings for development, errors for production.
    """
    warnings = []
    errors = []
    
    # Check secret keys
    if "change-in-prod" in settings.SECRET_KEY.lower() or len(settings.SECRET_KEY) < 32:
        msg = "SECRET_KEY should be changed from default value and be at least 32 characters"
        if settings.is_production:
            errors.append(msg)
        else:
            warnings.append(msg)
    
    if "change-in-production" in settings.JWT_SECRET_KEY.lower() or len(settings.JWT_SECRET_KEY) < 32:
        msg = "JWT_SECRET_KEY should be changed from default value and be at least 32 characters"
        if settings.is_production:
            errors.append(msg)
        else:
            warnings.append(msg)
    
    # Check OpenAI key
    if settings.OPENAI_API_KEY.startswith("sk-dev") or "placeholder" in settings.OPENAI_API_KEY.lower():
        msg = "OPENAI_API_KEY should be set to a valid key for AI features to work"
        if settings.is_production:
            errors.append(msg)
        else:
            warnings.append(msg)
    
    # Check CORS origins in production
    if settings.is_production:
        localhost_origins = [
            origin for origin in settings.BACKEND_CORS_ORIGINS 
            if "localhost" in origin or "127.0.0.1" in origin
        ]
        if localhost_origins:
            warnings.append(
                f"BACKEND_CORS_ORIGINS contains localhost URLs in production: {localhost_origins}"
            )
    
    # Print results
    if errors:
        error_msg = "🔴 Configuration Errors (must be fixed):\n" + "\n".join(f"  ❌ {e}" for e in errors)
        print(error_msg)
        if settings.is_production:
            raise ValueError(error_msg)
    
    if warnings:
        warning_msg = "⚠️  Configuration Warnings:\n" + "\n".join(f"  ⚠️  {w}" for w in warnings)
        print(warning_msg + "\n")
    
    if not errors and not warnings:
        print("✅ Configuration validation passed\n")


# Run validation on import
validate_configuration()


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "settings",
    "get_settings",
    "Settings",
    "validate_configuration"
]
