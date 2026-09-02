"""Production lifecycle for the concierge model and durable checkpointer."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any, cast

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from app.concierge import create_default_concierge_agent
from app.concierge_agui import build_default_concierge_agui_agent
from app.concierge_config import get_concierge_settings
from app.config import get_settings


def _psycopg_url(database_url: str) -> str:
    """Convert SQLAlchemy's asyncpg URL into a psycopg-compatible URL."""
    if database_url.startswith("postgresql+asyncpg://"):
        return "postgresql://" + database_url.removeprefix("postgresql+asyncpg://")
    if database_url.startswith("postgres://"):
        return "postgresql://" + database_url.removeprefix("postgres://")
    return database_url


@dataclass(frozen=True)
class ConciergeAgents:
    legacy: Any
    agui: Any


@asynccontextmanager
async def concierge_runtime() -> AsyncIterator[ConciergeAgents | None]:
    """Yield the configured agent, or ``None`` when no model key is configured."""
    settings = get_settings()
    concierge_settings = get_concierge_settings()
    if not concierge_settings.openrouter_api_key:
        yield None
        return

    pool = AsyncConnectionPool(
        _psycopg_url(settings.database_url),
        min_size=1,
        max_size=10,
        open=False,
        kwargs={
            "autocommit": True,
            "prepare_threshold": 0,
            "row_factory": dict_row,
        },
    )
    await pool.open()
    try:
        await pool.wait()
        checkpointer = AsyncPostgresSaver(cast(Any, pool))
        await checkpointer.setup()
        yield ConciergeAgents(
            legacy=create_default_concierge_agent(checkpointer),
            agui=build_default_concierge_agui_agent(checkpointer),
        )
    finally:
        await pool.close()
