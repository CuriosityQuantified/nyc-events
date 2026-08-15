"""FastAPI application entry point."""

from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import get_settings
from app.database import get_engine, reset_engine
from app.routes.events import router as events_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    yield
    await reset_engine()


app = FastAPI(title="NYC Events API", lifespan=lifespan)
app.include_router(events_router)


@app.get("/health")
async def health_check():
    """Check database and Redis connectivity.

    Returns 200 with all-healthy status when both services respond.
    Returns 503 with degraded status when either service fails.
    """
    settings = get_settings()
    db_status = "connected"
    redis_status = "connected"

    # Check Postgres
    try:
        engine = get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    # Check Redis
    try:
        r = aioredis.from_url(settings.redis_url, socket_connect_timeout=2)
        try:
            await r.ping()
        finally:
            await r.aclose()
    except Exception:
        redis_status = "disconnected"

    healthy = db_status == "connected" and redis_status == "connected"
    status_code = 200 if healthy else 503
    body = {
        "status": "healthy" if healthy else "degraded",
        "database": db_status,
        "redis": redis_status,
    }
    return JSONResponse(content=body, status_code=status_code)
