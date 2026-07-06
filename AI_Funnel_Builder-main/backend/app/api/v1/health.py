"""
Health Checks - Ultimate Production Grade Implementation (Simplified)
=====================================================================
Enterprise-grade health monitoring with essential dependencies only.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
import asyncio
import time
import psutil
from enum import Enum
import logging

# Local imports (KEEP THESE)
from app.core.database import get_db
from app.core.config import settings
from app.utils.logger import get_logger
from app.data_pipeline.storage.cache import get_cache_client

logger = get_logger(__name__)
router = APIRouter(prefix="/health", tags=["health"])

# ================================
# Health Status Models (UNCHANGED)
# ================================

class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"

class DependencyStatus(BaseModel):
    name: str
    status: HealthStatus
    latency_ms: float = Field(..., ge=0)
    response_time_p95: Optional[float] = None
    error_rate: Optional[float] = None
    last_checked: datetime
    critical: bool = False

class OverallHealth(BaseModel):
    status: HealthStatus
    score: float = Field(..., ge=0, le=1.0, description="0-1.0 health score")
    uptime_seconds: float
    services: Dict[str, DependencyStatus]
    critical_services: List[str]
    degraded_services: List[str]
    timestamp: datetime
    version: str
    environment: str

class ReadinessResponse(BaseModel):
    status: HealthStatus
    dependencies: Dict[str, DependencyStatus]
    ready_to_accept_traffic: bool
    timestamp: datetime

class StartupResponse(BaseModel):
    status: str
    progress: float  # 0-1.0
    completed_checks: int
    total_checks: int
    timestamp: datetime

# ================================
# SIMPLIFIED HealthMonitor (REMOVED ML/S3/Celery checks)
# ================================

class HealthMonitor:
    """Simplified health monitoring system"""
    
    def __init__(self):
        self.start_time = time.time()
        self.cache = {}  # Simple cache
        self.critical_threshold = 0.85
        self.unhealthy_threshold = 0.50
        
    async def check_all_dependencies(self) -> Dict[str, DependencyStatus]:
        """Essential dependency checks only"""
        
        async def postgres_check(db: AsyncSession) -> DependencyStatus:
            start = time.time()
            try:
                await db.execute(text("SELECT 1"))
                latency = (time.time() - start) * 1000
                return DependencyStatus(
                    name="postgres",
                    status=HealthStatus.HEALTHY,
                    latency_ms=latency,
                    last_checked=datetime.now(timezone.utc),
                    critical=True
                )
            except Exception as e:
                logger.error(f"Postgres health check failed: {e}")
                return DependencyStatus(
                    name="postgres",
                    status=HealthStatus.UNHEALTHY,
                    latency_ms=(time.time() - start) * 1000,
                    last_checked=datetime.now(timezone.utc),
                    critical=True
                )
        
        async def redis_check() -> DependencyStatus:
            start = time.time()
            try:
                redis = await get_cache_client()
                await redis.ping()
                latency = (time.time() - start) * 1000
                return DependencyStatus(
                    name="redis",
                    status=HealthStatus.HEALTHY,
                    latency_ms=latency,
                    last_checked=datetime.now(timezone.utc),
                    critical=True
                )
            except Exception as e:
                return DependencyStatus(
                    name="redis",
                    status=HealthStatus.UNHEALTHY,
                    latency_ms=(time.time() - start) * 1000,
                    last_checked=datetime.now(timezone.utc),
                    critical=True
                )
        
        # Parallel execution (only essential services)
        checks = await asyncio.gather(
            postgres_check(AsyncSession(get_db())),
            redis_check(),
            return_exceptions=True
        )        
        results = {}
        for check in checks:
            if isinstance(check, Exception):
                results["unknown"] = DependencyStatus(
                    name="unknown",
                    status=HealthStatus.UNKNOWN,
                    latency_ms=0,
                    last_checked=datetime.now(timezone.utc)
                )
            else:
                results[check.name] = check
        
        return results

    def compute_overall_score(self, services: Dict[str, DependencyStatus]) -> HealthStatus:
        """Simple weighted health score"""
        critical_services = [s for s in services.values() if s.critical]
        critical_healthy = sum(1 for s in critical_services if s.status == HealthStatus.HEALTHY)
        critical_total = len(critical_services)
        overall_score = critical_healthy / max(critical_total, 1)
        
        if overall_score >= self.critical_threshold:
            return HealthStatus.HEALTHY
        elif overall_score >= self.unhealthy_threshold:
            return HealthStatus.DEGRADED
        else:
            return HealthStatus.UNHEALTHY

health_monitor = HealthMonitor()

# ================================
# Kubernetes Probes (SIMPLIFIED)
# ================================

@router.get("/live", status_code=status.HTTP_200_OK, summary="Kubernetes Liveness Probe")
async def liveness_probe():
    """Minimal liveness probe"""
    return {"status": "live", "timestamp": datetime.now(timezone.utc).isoformat()}

@router.get("/ready", status_code=status.HTTP_200_OK, summary="Kubernetes Readiness Probe")
async def readiness_probe(db: AsyncSession = Depends(get_db)) -> ReadinessResponse:
    """Essential readiness probe"""
    postgres_status = await health_monitor.check_all_dependencies().get("postgres", 
        DependencyStatus(name="postgres", status=HealthStatus.UNKNOWN, 
                        latency_ms=0, last_checked=datetime.now(timezone.utc)))
    
    redis_status = await health_monitor.check_all_dependencies().get("redis",
        DependencyStatus(name="redis", status=HealthStatus.UNKNOWN,
                        latency_ms=0, last_checked=datetime.now(timezone.utc)))
    
    ready = (postgres_status.status == HealthStatus.HEALTHY and 
             redis_status.status == HealthStatus.HEALTHY)
    
    result = ReadinessResponse(
        status=HealthStatus.HEALTHY if ready else HealthStatus.UNHEALTHY,
        dependencies={
            "postgres": postgres_status,
            "redis": redis_status
        },
        ready_to_accept_traffic=ready,
        timestamp=datetime.now(timezone.utc)
    )
    
    return result

@router.get("/startup", status_code=status.HTTP_200_OK, summary="Kubernetes Startup Probe")
async def startup_probe():
    """Startup probe"""
    progress = min(1.0, time.time() / 300)  # 5min warmup
    return StartupResponse(
        status="initializing" if progress < 1.0 else "ready",
        progress=progress,
        completed_checks=int(progress * 10),
        total_checks=10,
        timestamp=datetime.now(timezone.utc)
    )

# ================================
# Main Health Check (SIMPLIFIED)
# ================================

@router.get("/", status_code=status.HTTP_200_OK, summary="Full System Health")
async def health_check(db: AsyncSession = Depends(get_db)) -> OverallHealth:
    """Essential health check"""
    services = await health_monitor.check_all_dependencies()
    overall_status = health_monitor.compute_overall_score(services)
    
    critical = [s.name for s in services.values() if s.critical and s.status != HealthStatus.HEALTHY]
    degraded = [s.name for s in services.values() if s.status == HealthStatus.DEGRADED]
    
    uptime = time.time() - health_monitor.start_time
    
    result = OverallHealth(
        status=overall_status,
        score=float(health_monitor.compute_overall_score(services)),
        uptime_seconds=uptime,
        services={k: v.dict() for k, v in services.items()},
        critical_services=critical,
        degraded_services=degraded,
        timestamp=datetime.now(timezone.utc),
        version=settings.VERSION,
        environment=settings.ENVIRONMENT
    )
    
    if overall_status == HealthStatus.UNHEALTHY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Critical services unhealthy"
        )
    
    return result

# ================================
# Resource Monitoring (KEEP)
# ================================

@router.get("/resources", status_code=status.HTTP_200_OK, summary="System Resources")
async def resource_health():
    """CPU, memory, disk health"""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "cpu": {
            "percent": cpu_percent,
            "healthy": cpu_percent < 80
        },
        "memory": {
            "percent": memory.percent,
            "available_gb": memory.available / (1024**3),
            "healthy": memory.percent < 85
        },
        "disk": {
            "percent": disk.percent,
            "free_gb": disk.free / (1024**3),
            "healthy": disk.percent < 90
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
