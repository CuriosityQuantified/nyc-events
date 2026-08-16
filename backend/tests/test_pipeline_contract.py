"""Issue #10 gates for freshness, CORS, and concierge current-only tools."""

from __future__ import annotations

from sqlalchemy import text

from app.concierge_tools import (
    CurrentEventSearch,
    get_current_event,
    search_current_events,
)
from app.models.event import CurrentEvent, EventRepository
from app.socrata import sync_events
from app.verify_snapshot import snapshot_evidence
from tests.conftest import load_fixture, requires_docker


class FixtureSource:
    def __init__(self, rows):
        self.rows = rows

    async def fetch_all_events(self):
        return self.rows


@requires_docker
class TestCurrentPipelineContract:
    async def test_freshness_reports_success_count_and_stale_state(
        self, client, db_session, monkeypatch
    ):
        rows = load_fixture("snapshot_a.json")
        await sync_events(db_session, FixtureSource(rows))
        monkeypatch.setattr(
            "app.routes.events.get_settings",
            lambda: type("Settings", (), {"snapshot_stale_after_seconds": 3600})(),
        )

        response = await client.get("/freshness")
        assert response.status_code == 200
        body = response.json()
        assert body["snapshot_row_count"]["value"] == len(rows)
        assert body["last_successful_sync"]["provenance"] == "Derived"
        assert body["is_stale"]["value"] is False

    async def test_ingestion_health_exposes_failed_attempt_without_losing_snapshot(
        self, client, db_session
    ):
        from app.socrata import SocrataError

        rows = load_fixture("snapshot_a.json")
        await sync_events(db_session, FixtureSource(rows))

        class FailedSource:
            async def fetch_all_events(self):
                raise SocrataError("credential-free failure detail")

        import pytest

        with pytest.raises(SocrataError):
            await sync_events(db_session, FailedSource())

        response = await client.get("/ingestion-health")
        assert response.status_code == 200
        assert response.json()["status"] == "failed"
        assert response.json()["failure_code"] == "SocrataError"
        assert response.json()["row_count"] == len(rows)
        assert "credential-free failure detail" not in response.text

    async def test_cors_allows_only_the_configured_frontend(self, client):
        allowed = await client.options(
            "/events",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        rejected = await client.options(
            "/events",
            headers={
                "Origin": "https://attacker.example",
                "Access-Control-Request-Method": "GET",
            },
        )

        assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
        assert "access-control-allow-origin" not in rejected.headers

    async def test_concierge_tools_are_bounded_and_current_only(self, db_session):
        rows = load_fixture("snapshot_a.json")
        await sync_events(db_session, FixtureSource(rows))
        await sync_events(db_session, FixtureSource(rows[1:]))

        assert await db_session.get(EventRepository, rows[0]["guid"]) is not None
        assert await db_session.get(CurrentEvent, rows[0]["guid"]) is None
        assert await get_current_event(rows[0]["guid"]) is None
        search = await search_current_events(CurrentEventSearch(limit=1))
        assert len(search["events"]) == 1
        assert search["events"][0]["guid"] in {row["guid"] for row in rows[1:]}
        assert search["freshness"]["snapshot_row_count"]["value"] == len(rows[1:])

    async def test_concierge_search_order_is_deterministic(self, db_session):
        rows = load_fixture("snapshot_a.json")
        tied = [dict(row, starttime="2026-08-09 08:00:00") for row in rows]
        await sync_events(db_session, FixtureSource(tied))

        result = await search_current_events(CurrentEventSearch(limit=25))
        assert [event["guid"] for event in result["events"]] == sorted(
            row["guid"] for row in tied
        )

    async def test_database_contains_exactly_two_event_domain_tables(self, db_session):
        names = set(
            await db_session.scalars(
                text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            )
        )
        assert "current_events" in names
        assert "event_repository" in names
        assert "events" not in names

    async def test_snapshot_evidence_matches_the_first_public_event(
        self, client, db_session
    ):
        rows = load_fixture("snapshot_a.json")
        await sync_events(db_session, FixtureSource(rows))

        evidence = await snapshot_evidence(db_session)
        response = await client.get("/events", params={"page_size": 1})

        assert evidence == {
            "row_count": len(rows),
            "first_guid": response.json()["events"][0]["guid"],
        }

    async def test_snapshot_evidence_fails_closed_when_current_is_empty(
        self, db_session
    ):
        import pytest

        with pytest.raises(RuntimeError, match="Snapshot is empty"):
            await snapshot_evidence(db_session)


def test_concierge_input_bounds_fail_closed():
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        CurrentEventSearch(limit=26)
    with pytest.raises(ValidationError):
        CurrentEventSearch(text="x" * 201)
