"""Test fixtures using Testcontainers for real Postgres."""

import os
import subprocess

import pytest
import pytest_asyncio

_docker_available = None
_in_ci = os.environ.get("CI", "").lower() == "true"


def _check_docker() -> bool:
    global _docker_available
    if _docker_available is None:
        try:
            result = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                timeout=5,
            )
            _docker_available = result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            _docker_available = False
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


@pytest.fixture(scope="session")
def postgres_url():
    """Start a PostgreSQL container for the test session.

    Yields the async connection URL. Stops the container on teardown.
    """
    if not _check_docker():
        pytest.skip("Docker is not available")

    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("postgres:16-alpine") as pg:
        sync_url = pg.get_connection_url()
        # Convert psycopg2 URL to asyncpg URL
        async_url = sync_url.replace("psycopg2", "asyncpg")
        yield async_url


@pytest.fixture(scope="session", autouse=True)
def _set_env(postgres_url):
    """Set DATABASE_URL and REDIS_URL for the test session.

    Redis is pointed at a non-existent host on purpose so the health
    endpoint reports it as disconnected (the test verifies degraded
    behaviour when Redis is missing).
    """
    from app.config import get_settings

    # Clear any cached settings so get_settings() reads test env vars.
    get_settings.cache_clear()

    os.environ["DATABASE_URL"] = postgres_url
    os.environ["REDIS_URL"] = "redis://localhost:63999/0"  # intentionally invalid
    yield
    os.environ.pop("DATABASE_URL", None)
    os.environ.pop("REDIS_URL", None)
    get_settings.cache_clear()


@pytest.fixture(scope="session", autouse=True)
def _run_migrations(postgres_url, _set_env):
    """Run Alembic migrations against the Testcontainers database."""
    from alembic import command
    from alembic.config import Config

    alembic_cfg = Config(
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "alembic.ini")
    )
    # Note: sqlalchemy.url is set programmatically in env.py via get_settings(),
    # which reads DATABASE_URL from the environment (_set_env fixture).

    # Override the script_location to be absolute
    alembic_cfg.set_main_option(
        "script_location",
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "migrations"),
    )

    command.upgrade(alembic_cfg, "head")


@pytest_asyncio.fixture
async def client():
    """Provide an async test client for the FastAPI app."""
    # Reset the engine so it picks up the test DATABASE_URL
    from app.database import reset_engine
    await reset_engine()

    from httpx import ASGITransport, AsyncClient
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    await reset_engine()
