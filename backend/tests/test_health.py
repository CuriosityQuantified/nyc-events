"""Tests for the /health endpoint."""

import pytest

from tests.conftest import requires_docker


@requires_docker
class TestHealthEndpoint:
    """Verify the health endpoint reports service status correctly."""

    async def test_health_returns_json(self, client):
        """The health endpoint must return a JSON body with status, database, and redis keys."""
        resp = await client.get("/health")
        body = resp.json()
        assert "status" in body
        assert "database" in body
        assert "redis" in body

    async def test_health_database_connected(self, client):
        """With a real Postgres container, database must report connected."""
        resp = await client.get("/health")
        body = resp.json()
        assert body["database"] == "connected"

    async def test_health_degraded_without_redis(self, client):
        """Without a running Redis, the endpoint must return 503 and degraded status."""
        resp = await client.get("/health")
        body = resp.json()
        # Redis is intentionally unreachable in tests
        assert body["redis"] == "disconnected"
        assert body["status"] == "degraded"
        assert resp.status_code == 503

    async def test_health_all_fields_present(self, client):
        """Response must contain exactly the three required fields."""
        resp = await client.get("/health")
        body = resp.json()
        assert set(body.keys()) == {"status", "database", "redis"}
