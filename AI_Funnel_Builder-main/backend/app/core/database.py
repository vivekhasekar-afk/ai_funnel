# =============================================================================
# AI FUNNEL BUILDER - DATABASE CONFIGURATION
# =============================================================================
# SQLAlchemy setup for PostgreSQL with async support
# MongoDB setup for flexible document storage
# =============================================================================

from typing import TYPE_CHECKING, AsyncGenerator, Generator, Optional, Any
from contextlib import asynccontextmanager, contextmanager
import logging

from sqlalchemy import create_engine, event, pool, text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import QueuePool, NullPool
from pymongo import MongoClient

from app.core.config import settings

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorClient

# =============================================================================
# LOGGING
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# SQLALCHEMY BASE MODEL
# =============================================================================

# Declarative base for all SQLAlchemy models
Base = declarative_base()

# Metadata for migrations
metadata = Base.metadata


# =============================================================================
# POSTGRESQL - SYNC ENGINE (for migrations, scripts)
# =============================================================================

# Create sync engine for Alembic migrations and management scripts
sync_engine = create_engine(
    str(settings.DATABASE_URL),
    poolclass=QueuePool,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # Test connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=settings.DATABASE_ECHO,  # Log SQL queries in debug mode
    echo_pool=False,  # Don't log pool events (too verbose)
    future=True,  # Use SQLAlchemy 2.0 style
)

# Session factory for sync sessions
SyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine,
    class_=Session,
    expire_on_commit=False,
)


# =============================================================================
# POSTGRESQL - ASYNC ENGINE (for FastAPI routes)
# =============================================================================

# Create async engine for FastAPI async operations
async_engine = create_async_engine(
    settings.async_database_url,
    poolclass=QueuePool,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.DATABASE_ECHO,
    future=True,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


# =============================================================================
# MONGODB SETUP
# =============================================================================

class MongoDB:
    """
    MongoDB client wrapper for flexible document storage.
    
    Used for:
    - AI training data
    - Response patterns
    - Funnel configurations (flexible schema)
    - Analytics aggregations
    """
    
    def __init__(self):
        self.client: Optional[Any] = None  # AsyncIOMotorClient from motor.motor_asyncio
        self.sync_client: Optional[MongoClient] = None
        self.database = None
        self.sync_database = None
    
    def connect(self):
        """Initialize MongoDB async connection."""
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
                minPoolSize=10,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
            )
            self.database = self.client[settings.MONGODB_DATABASE]
            logger.info(f"✅ Connected to MongoDB: {settings.MONGODB_DATABASE}")
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise
    
    def connect_sync(self):
        """Initialize MongoDB sync connection (for scripts)."""
        try:
            self.sync_client = MongoClient(
                settings.MONGODB_URL,
                maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
            )
            self.sync_database = self.sync_client[settings.MONGODB_DATABASE]
            logger.info(f"✅ Connected to MongoDB (sync): {settings.MONGODB_DATABASE}")
        except Exception as e:
            logger.error(f"❌ MongoDB sync connection failed: {e}")
            raise
    
    async def close(self):
        """Close MongoDB async connection."""
        if self.client:
            self.client.close()
            logger.info("MongoDB async connection closed")
    
    def close_sync(self):
        """Close MongoDB sync connection."""
        if self.sync_client:
            self.sync_client.close()
            logger.info("MongoDB sync connection closed")
    
    async def ping(self) -> bool:
        """Check MongoDB connection health."""
        try:
            await self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"MongoDB ping failed: {e}")
            return False
    
    # Collection accessors
    @property
    def funnel_configs(self):
        """Funnel configurations collection."""
        return self.database.funnel_configs
    
    @property
    def response_raw(self):
        """Raw response data collection."""
        return self.database.response_raw
    
    @property
    def ai_training_data(self):
        """AI training datasets collection."""
        return self.database.ai_training_data
    
    @property
    def insights(self):
        """AI-generated insights collection."""
        return self.database.insights
    
    @property
    def prompt_cache(self):
        """AI prompt cache collection."""
        return self.database.prompt_cache
    
    @property
    def experiment_results(self):
        """A/B test results collection."""
        return self.database.experiment_results


# Global MongoDB instance
mongodb = MongoDB()


# =============================================================================
# SESSION DEPENDENCIES (for FastAPI)
# =============================================================================

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for async database sessions.
    
    Usage:
        @router.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
    
    Yields:
        AsyncSession: Database session
    
    Features:
        - Automatic session cleanup
        - Rollback on exception
        - Connection pooling
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


def get_sync_db() -> Generator[Session, None, None]:
    """
    Sync database session generator (for scripts/migrations).
    
    Usage:
        with get_sync_db() as db:
            users = db.query(User).all()
    """
    db = SyncSessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Sync database session error: {e}")
        raise
    finally:
        db.close()


# =============================================================================
# CONTEXT MANAGERS
# =============================================================================

@asynccontextmanager
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Async context manager for database sessions.
    
    Usage:
        async with get_async_session() as db:
            result = await db.execute(select(User))
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@contextmanager
def get_sync_session() -> Generator[Session, None, None]:
    """
    Sync context manager for database sessions.
    
    Usage:
        with get_sync_session() as db:
            users = db.query(User).all()
    """
    session = SyncSessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# =============================================================================
# DATABASE UTILITIES
# =============================================================================

async def init_db():
    """
    Initialize database on application startup.
    
    - Create tables if they don't exist
    - Set up indexes
    - Initialize MongoDB collections
    """
    try:
        # PostgreSQL: Create tables
        async with async_engine.begin() as conn:
            # Import all models to ensure they're registered
            from app.models import (
                user, funnel, question, response, response_answer,
                lead, event, analytics_daily, benchmark, question_effectiveness
            )
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ PostgreSQL tables created/verified")
        
        # MongoDB: Initialize collections and indexes
        mongodb.connect()
        
        # Create indexes for frequently queried fields
        await mongodb.funnel_configs.create_index("funnel_id")
        await mongodb.response_raw.create_index([("funnel_id", 1), ("created_at", -1)])
        await mongodb.prompt_cache.create_index("prompt_hash")
        await mongodb.prompt_cache.create_index(
            "expires_at", 
            expireAfterSeconds=0  # TTL index
        )
        
        logger.info("✅ MongoDB indexes created/verified")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise


async def close_db():
    """
    Close database connections on application shutdown.
    """
    await async_engine.dispose()
    await mongodb.close()
    logger.info("Database connections closed")


async def check_db_health() -> dict:
    """
    Check database health for monitoring endpoints.
    
    Returns:
        dict: Health status of PostgreSQL and MongoDB
    """
    health = {
        "postgresql": False,
        "mongodb": False,
    }
    
    # Check PostgreSQL
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            if result.scalar() == 1:
                health["postgresql"] = True
    except Exception as e:
        logger.error(f"PostgreSQL health check failed: {e}")
    
    # Check MongoDB
    try:
        health["mongodb"] = await mongodb.ping()
    except Exception as e:
        logger.error(f"MongoDB health check failed: {e}")
    
    return health


# =============================================================================
# EVENT LISTENERS (Performance & Debugging)
# =============================================================================

@event.listens_for(sync_engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Set connection pragmas (if using SQLite for testing)."""
    # This would only apply if using SQLite
    # For PostgreSQL, we can set session variables here if needed
    pass


@event.listens_for(sync_engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Log when a connection is checked out from the pool (debug only)."""
    if settings.DEBUG and settings.DATABASE_ECHO:
        logger.debug("Database connection checked out from pool")


@event.listens_for(sync_engine, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    """Log when a connection is returned to the pool (debug only)."""
    if settings.DEBUG and settings.DATABASE_ECHO:
        logger.debug("Database connection returned to pool")


# =============================================================================
# TRANSACTION HELPERS
# =============================================================================

class DatabaseTransaction:
    """
    Context manager for explicit transaction control.
    
    Usage:
        async with DatabaseTransaction() as db:
            user = User(email="test@example.com")
            db.add(user)
            # Auto-commits on success, rolls back on exception
    """
    
    def __init__(self):
        self.session: AsyncSession = None
    
    async def __aenter__(self) -> AsyncSession:
        self.session = AsyncSessionLocal()
        return self.session
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            await self.session.rollback()
            logger.error(f"Transaction rolled back: {exc_val}")
        else:
            await self.session.commit()
        await self.session.close()


async def execute_in_transaction(func, *args, **kwargs):
    """
    Execute a function within a database transaction.
    
    Args:
        func: Async function to execute
        *args, **kwargs: Arguments to pass to the function
    
    Returns:
        Result of the function
    
    Usage:
        result = await execute_in_transaction(create_user, email="test@example.com")
    """
    async with DatabaseTransaction() as db:
        return await func(db, *args, **kwargs)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "Base",
    "metadata",
    "sync_engine",
    "async_engine",
    "SyncSessionLocal",
    "AsyncSessionLocal",
    "get_db",
    "get_sync_db",
    "get_async_session",
    "get_sync_session",
    "mongodb",
    "MongoDB",
    "init_db",
    "close_db",
    "check_db_health",
    "DatabaseTransaction",
    "execute_in_transaction",
]
