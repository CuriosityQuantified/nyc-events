"""Test fixtures using Testcontainers for real Postgres."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import httpx
import pytest
import pytest_asyncio

from tests.docker_probe import probe_docker

_docker_available = None
_in_ci = os.environ.get("CI", "").lower() == "true"

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def _check_docker() -> bool:
    global _docker_available
    if _docker_available is None:
        _docker_available = probe_docker(
            attempts=6 if _in_ci else 1,
            retry_delay=2 if _in_ci else 0,
        )
    return _docker_available


if _in_ci and not _check_docker():
    raise RuntimeError(
        "CI requires Docker for Testcontainers PostgreSQL tests. "
        "Docker is not available — cannot run the test suite against SQLite or skip."
    )

requires_docker = pytest.mark.skipif(
    not _check_docker(),
    reason="Docker is not available — skipping locally (CI would fail here)",
)

# ---- Session-scoped Postgres container (only started when Docker is present) ----

_pg_container = None
_pg_async_url = None


@pytest.fixture(scope="session", autouse=True)
def _maybe_start_postgres():
    """Start a PostgreSQL container if Docker is available.

    This fixture is autouse but does NOT skip — it simply becomes a no-op
    when Docker is absent, so that non-Docker tests still run.
    """
    global _pg_container, _pg_async_url
    if not _check_docker():
        yield
        return

    from testcontainers.community.postgres import PostgresContainer

    container = PostgresContainer("postgres:16-alpine")
    container.start()
    _pg_container = container

    sync_url = container.get_connection_url()
    _pg_async_url = sync_url.replace("psycopg2", "asyncpg")

    # Set env vars so the app picks up the test database.
    from app.config import get_settings

    get_settings.cache_clear()
    os.environ["DATABASE_URL"] = _pg_async_url
    # CI and the production-grade local gate provide a real Redis service.
    # Keep an explicit caller value; otherwise require the standard local port.
    redis_url_was_set = "REDIS_URL" in os.environ
    os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

    # Run Alembic migrations.
    from alembic import command
    from alembic.config import Config

    backend_dir = os.path.dirname(os.path.dirname(__file__))
    alembic_cfg = Config(os.path.join(backend_dir, "alembic.ini"))
    alembic_cfg.set_main_option(
        "script_location", os.path.join(backend_dir, "migrations")
    )
    command.upgrade(alembic_cfg, "head")

    yield

    container.stop()
    _pg_container = None
    _pg_async_url = None
    os.environ.pop("DATABASE_URL", None)
    if not redis_url_was_set:
        os.environ.pop("REDIS_URL", None)
    get_settings.cache_clear()


@pytest.fixture
def postgres_url():
    """Return the async Postgres URL (skips if Docker unavailable)."""
    if _pg_async_url is None:
        pytest.skip("Docker is not available")
    return _pg_async_url


@pytest_asyncio.fixture
async def client():
    """Provide an async test client for the FastAPI app."""
    if not _check_docker():
        pytest.skip("Docker is not available")

    from app.database import reset_engine

    await reset_engine()

    from httpx import ASGITransport, AsyncClient

    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    await reset_engine()


@pytest_asyncio.fixture
async def db_session():
    """Provide an async SQLAlchemy session for direct DB operations."""
    if not _check_docker():
        pytest.skip("Docker is not available")

    from sqlalchemy import delete

    from app.database import get_session_factory, reset_engine
    from app.models.event import CurrentEvent, EventRepository, SyncRun
    from app.models.profile import (
        Interest,
        MatchedEvent,
        PreferenceAudit,
        Profile,
        SavedEvent,
    )

    await reset_engine()
    factory = get_session_factory()
    async with factory() as session:
        await session.execute(delete(PreferenceAudit))
        await session.execute(delete(MatchedEvent))
        await session.execute(delete(Interest))
        await session.execute(delete(SavedEvent))
        await session.execute(delete(Profile))
        await session.execute(delete(CurrentEvent))
        await session.execute(delete(EventRepository))
        await session.execute(delete(SyncRun))
        await session.commit()
        yield session
        await session.rollback()
        await session.execute(delete(PreferenceAudit))
        await session.execute(delete(MatchedEvent))
        await session.execute(delete(Interest))
        await session.execute(delete(SavedEvent))
        await session.execute(delete(Profile))
        await session.execute(delete(CurrentEvent))
        await session.execute(delete(EventRepository))
        await session.execute(delete(SyncRun))
        await session.commit()

    await reset_engine()


def load_fixture(name: str) -> list[dict[str, Any]]:
    """Load a JSON fixture file by name from the fixtures directory."""
    path = FIXTURES_DIR / name
    with path.open(encoding="utf-8") as f:
        return json.load(f)


class MockTransport(httpx.AsyncBaseTransport):
    """Transport-layer mock that intercepts httpx requests.

    Returns paginated responses from a list of rows. Supports injecting
    error responses to exercise retry logic.
    """

    def __init__(
        self,
        rows: list[dict[str, Any]],
        page_size: int = 2,
        error_responses: list[int] | None = None,
    ) -> None:
        self._rows = rows
        self._page_size = page_size
        # error_responses: list of HTTP status codes to return before
        # serving real data. Each call pops the first entry.
        self._error_queue: list[int] = list(error_responses or [])
        self._request_count = 0
        self.requests: list[dict[str, Any]] = []

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        self._request_count += 1

        # The Socrata client must use POST for queries (AC-1).
        assert request.method == "POST", f"Expected POST but got {request.method}"
        assert request.headers["accept"] == "application/json"
        assert request.headers["content-type"] == "application/json"

        body = json.loads(request.content) if request.content else {}
        self.requests.append(body)

        # If error responses are queued, return them first.
        if self._error_queue:
            status = self._error_queue.pop(0)
            return httpx.Response(
                status_code=status,
                json={"error": f"Simulated {status}"},
            )

        # Parse the request body for pagination parameters.
        page = body["page"]
        page_number = page["pageNumber"]
        limit = page["pageSize"]
        offset = (page_number - 1) * limit

        page_rows = self._rows[offset : offset + limit]
        return httpx.Response(
            status_code=200,
            json=page_rows,
        )

    @property
    def request_count(self) -> int:
        return self._request_count


class AlwaysErrorTransport(httpx.AsyncBaseTransport):
    """Transport that always returns the given error status code."""

    def __init__(self, status_code: int = 503) -> None:
        self._status_code = status_code

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        assert request.method == "POST", f"Expected POST but got {request.method}"
        return httpx.Response(
            status_code=self._status_code,
            json={"error": "Service Unavailable"},
        )


async def ingest_rows(db_session, rows: list[dict[str, Any]]) -> None:
    """Parse raw Socrata rows and merge them into the database.

    This is the shared ingestion helper used by all test modules that
    need to populate the events table from fixture data.
    """
    from app.socrata import ingest_events

    await ingest_events(db_session, rows)
