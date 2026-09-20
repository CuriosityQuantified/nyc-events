"""Executable Socrata-to-Postgres synchronization command."""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from collections.abc import Sequence

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
from app.socrata import EventSource, SocrataError, sync_events

logger = logging.getLogger(__name__)
SYNC_LOCK_NAME = "nyc-events:sync"
EXIT_SUCCESS = 0
EXIT_FAILURE = 1


class SyncAlreadyRunning(RuntimeError):
    """Raised when another worker owns the distributed synchronization lock."""


async def run(
    *,
    source: EventSource | None = None,
    redis_client: Redis | None = None,
    push_transport: PushTransport | None = None,
    force: bool = False,
) -> int:
    """Run one locked Snapshot synchronization from the standalone worker."""
    settings = get_settings()
    if not 0 < settings.sync_run_timeout_seconds < settings.sync_lock_timeout_seconds:
        raise ValueError(
            "Sync deadline must be positive and shorter than its lock lease"
        )
    connection = redis_client or aioredis.from_url(
        settings.redis_url, socket_timeout=10, socket_connect_timeout=10
    )
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
        async with asyncio.timeout(settings.sync_run_timeout_seconds):
            async with session_factory() as session:
                count = await sync_events(session, source, force=force)
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


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    """Parse the worker command line."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force", action="store_true", help="Force a full Snapshot refresh"
    )
    return parser.parse_args(argv)


async def main(argv: Sequence[str] | None = None) -> int:
    """Run one check and map its outcome to the process exit status.

    A scheduled check that records its own failure as a Sync Run has done its
    job: the previous Snapshot stays in place, ``/ingestion-health`` exposes the
    failure code, ``/ingestion-health/ready`` turns 503 once checks are overdue,
    and the next schedule retries. Such a run exits 0 so that an NYC Open Data
    outage is reported as a failed source check, not as a worker crash. A lock
    held by another worker is a skipped schedule, also exit 0.

    ``--force`` is an explicit request for a refresh: it exits 1 whenever that
    refresh did not happen. Every error that no Sync Run recorded propagates
    with its traceback and a nonzero status, because that is a real crash.
    """
    args = parse_args(argv)
    try:
        await run(force=args.force)
    except SyncAlreadyRunning as error:
        logger.warning("Skipped this schedule: %s", error)
        return EXIT_FAILURE if args.force else EXIT_SUCCESS
    except SocrataError as error:
        if error.sync_run_id is None:
            raise
        logger.warning(
            "Source check failed; previous Snapshot preserved: "
            "failure_code=%s sync_run_id=%s detail=%s",
            type(error).__name__,
            error.sync_run_id,
            error,
        )
        return EXIT_FAILURE if args.force else EXIT_SUCCESS
    finally:
        await reset_engine()
    return EXIT_SUCCESS


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    sys.exit(asyncio.run(main()))
