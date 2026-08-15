"""Executable Socrata-to-Postgres synchronization command."""

from __future__ import annotations

import asyncio
import logging

from app.database import get_session_factory, reset_engine
from app.socrata import sync_events

logger = logging.getLogger(__name__)


async def run() -> int:
    """Fetch the complete Snapshot and atomically upsert its Events."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        count = await sync_events(session)
    logger.info("Stored %d Events", count)
    return count


async def _main() -> None:
    try:
        await run()
    finally:
        await reset_engine()


if __name__ == "__main__":
    asyncio.run(_main())
