"""Executable Socrata-to-Postgres synchronization command."""

from __future__ import annotations

import asyncio
import logging

import redis.asyncio as aioredis
from redis.asyncio import Redis
from redis.exceptions import LockError

from app.config import get_settings
from app.database import get_session_factory, reset_engine
from app.services.notifications import (
    PushTransport,
    PyWebPushTransport,
    dispatch_push_notifications,
)
from app.socrata import EventSource, sync_events

logger = logging.getLogger(__name__)
SYNC_LOCK_NAME = "nyc-events:sync"


class SyncAlreadyRunning(RuntimeError):
    """Raised when another worker owns the distributed synchronization lock."""


async def run(
    *,
    source: EventSource | None = None,
    redis_client: Redis | None = None,
    push_transport: PushTransport | None = None,
) -> int:
    """Run one locked Snapshot synchronization from the standalone worker."""
    settings = get_settings()
    connection = redis_client or aioredis.from_url(settings.redis_url)
    owns_connection = redis_client is None
    lock = connection.lock(
        SYNC_LOCK_NAME,
        timeout=settings.sync_lock_timeout_seconds,
        blocking=False,
    )
    acquired = False
    try:
        acquired = await lock.acquire(blocking=False)
        if not acquired:
            raise SyncAlreadyRunning("A synchronization is already running")

        session_factory = get_session_factory()
        async with session_factory() as session:
            count = await sync_events(session, source)
            transport = push_transport or PyWebPushTransport(settings)
            await dispatch_push_notifications(session, connection, transport)
            await session.commit()
        logger.info("Stored %d Events", count)
        return count
    finally:
        if acquired:
            try:
                await lock.release()
            except LockError:
                logger.exception("Could not release the synchronization lock")
        if owns_connection:
            await connection.aclose()


async def _main() -> None:
    try:
        await run()
    finally:
        await reset_engine()


if __name__ == "__main__":
    asyncio.run(_main())
