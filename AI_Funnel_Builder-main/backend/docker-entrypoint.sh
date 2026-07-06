#!/bin/bash
set -euo pipefail

echo "🚀 Starting FunnelML Backend (Production)"

# 1. Database migrations
echo "📦 Running database migrations..."
alembic upgrade head || {
    echo "❌ Migration failed, but continuing for healthcheck..."
}

# 2. Background services startup
echo "⚙️ Starting background services..."

# Start Redis (in-container)
redis-server --daemonize yes --port 6379 --maxmemory 256mb --maxmemory-policy allkeys-lru &

# Start Celery worker (low priority)
nohup celery -A app.data_pipeline.tasks.celery_app worker \
    --loglevel=INFO \
    --concurrency=4 \
    -Q email,analytics \
    --max-memory-per-child=200MB \
    --detach &

# Start Celery beat (scheduler)
nohup celery -A app.data_pipeline.tasks.celery_app beat \
    --loglevel=INFO \
    --detach &

# 3. Model registry warmup
echo "🤖 Warming up ML models..."
python -c "
import asyncio
from app.services.model_registry import ModelRegistry
async def warmup():
    registry = ModelRegistry()
    await registry.warmup_models()
asyncio.run(warmup())
" || echo "Model warmup skipped"

# 4. Feature store sync
echo "📊 Syncing feature store..."
python -c "
from app.services.feature_store import get_feature_store
import asyncio
async def sync():
    fs = await get_feature_store()
    await fs.materialize_incremental()
asyncio.run(sync())
" || echo "Feature store sync skipped"

# 5. Healthcheck endpoints
echo "✅ Health endpoints ready:"
echo "   Health:    http://localhost:8000/health"
echo "   Metrics:   http://localhost:8000/metrics"
echo "   Ready:     http://localhost:8000/ready"

# 6. Start main application
echo "🌟 Starting FastAPI application..."
exec "$@"
