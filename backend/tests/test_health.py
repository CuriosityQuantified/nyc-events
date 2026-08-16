"""Tests for the /health endpoint."""

from tests.conftest import requires_docker


class TestRevisionEndpoint:
    """Verify deployment cutover can identify the exact running revision."""

    async def test_revision_reports_the_deployed_commit(self, client, monkeypatch):
        monkeypatch.setenv("DEPLOY_REVISION", "abc123")
        response = await client.get("/api/revision")
        assert response.status_code == 200
        assert response.json() == {"revision": "abc123"}
        assert "no-store" in response.headers["cache-control"]
        assert response.headers["x-deployment-revision"] == "abc123"

    async def test_revision_fails_closed_to_an_explicit_unknown_value(
        self, client, monkeypatch
    ):
        monkeypatch.delenv("DEPLOY_REVISION", raising=False)
        response = await client.get("/api/revision")
        assert response.status_code == 200
        assert response.json() == {"revision": "unknown"}
        assert "no-store" in response.headers["cache-control"]


@requires_docker
class TestHealthEndpoint:
    """Verify the health endpoint reports service status correctly."""

    async def test_health_returns_json(self, client):
        """Return JSON with status, database, and Redis keys."""
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

    async def test_health_reports_real_postgres_and_redis(self, client):
        """The integration gate requires both real backing services."""
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {
            "status": "healthy",
            "database": "connected",
            "redis": "connected",
        }

    async def test_health_degraded_without_redis(self, client, monkeypatch):
        """Without a running Redis, the endpoint must return 503 and degraded status."""

        class UnreachableRedis:
            async def ping(self):
                raise ConnectionError("offline fixture")

            async def aclose(self):
                return None

        monkeypatch.setattr(
            "app.main.aioredis.from_url",
            lambda *args, **kwargs: UnreachableRedis(),
        )
        resp = await client.get("/health")
        body = resp.json()
        assert body["redis"] == "disconnected"
        assert body["status"] == "degraded"
        assert resp.status_code == 503

    async def test_health_all_fields_present(self, client):
        """Response must contain exactly the three required fields."""
        resp = await client.get("/health")
        body = resp.json()
        assert set(body.keys()) == {"status", "database", "redis"}
