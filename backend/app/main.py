"""FastAPI application entry point."""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.concierge_runtime import concierge_runtime
from app.config import get_settings
from app.database import get_engine, reset_engine
from app.routes.concierge import router as concierge_router
from app.routes.events import router as events_router
from app.routes.preferences import router as preferences_router
from app.routes.profiles import router as profiles_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and shutdown."""
    async with concierge_runtime() as concierge_agent:
        app.state.concierge_agent = concierge_agent
        try:
            yield
        finally:
            app.state.concierge_agent = None
            await reset_engine()


app = FastAPI(title="NYC Events API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Accept", "Content-Type", "X-Device-Token"],
)
app.include_router(events_router)
app.include_router(profiles_router)
app.include_router(preferences_router)
app.include_router(concierge_router)


@app.get("/api/revision")
async def deployment_revision() -> JSONResponse:
    """Return the immutable revision attached to the running deployment."""
    revision = os.environ.get("DEPLOY_REVISION", "unknown")
    return JSONResponse(
        content={"revision": revision},
        headers={
            "Cache-Control": "no-store, max-age=0",
            "X-Deployment-Revision": revision,
        },
    )


@app.get("/health")
async def health_check() -> JSONResponse:
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
