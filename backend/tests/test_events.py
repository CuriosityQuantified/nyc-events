"""Tests for the events API endpoints."""

from __future__ import annotations

from datetime import date

import pytest

from app.models.event import Event
from app.socrata import parse_event
from tests.conftest import ingest_rows, load_fixture, requires_docker


@requires_docker
class TestListEvents:
    """Verify the GET /events endpoint returns correct contract shape."""

    async def test_list_events_returns_contract_schema(self, client, db_session):
        """Response must contain events, page, page_size, total, applied_facets."""
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        resp = await client.get("/events")
        assert resp.status_code == 200
        body = resp.json()

        assert "events" in body
        assert "page" in body
        assert "page_size" in body
        assert "total" in body
        assert "applied_facets" in body
        assert body["total"] == 3
        assert len(body["events"]) == 3

        # Each event must have the required contract fields.
        event = body["events"][0]
        required_fields = [
            "guid", "title", "description", "official_event_url",
            "location_id", "location_name", "start_date", "end_date",
            "start_datetime", "end_datetime", "categories", "coordinates",
            "borough", "registration_status", "registration_description",
            "is_free_explicit", "accessibility_mentioned",
        ]
        for field in required_fields:
            assert field in event, f"Missing field: {field}"

    async def test_list_events_pagination(self, client, db_session):
        """Pagination must limit results and report correct totals."""
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        resp = await client.get("/events", params={"page_size": 2, "page": 1})
        body = resp.json()
        assert len(body["events"]) == 2
        assert body["total"] == 3
        assert body["page"] == 1
        assert body["page_size"] == 2

        resp2 = await client.get("/events", params={"page_size": 2, "page": 2})
        body2 = resp2.json()
        assert len(body2["events"]) == 1
        assert body2["total"] == 3
        assert body2["page"] == 2


@requires_docker
class TestGetEvent:
    """Verify the GET /events/{guid} endpoint."""

    async def test_get_event_by_guid(self, client, db_session):
        """A valid guid must return the matching event."""
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        resp = await client.get("/events/2,146,733")
        assert resp.status_code == 200
        body = resp.json()
        assert body["guid"] == "2,146,733"
        assert body["title"]["value"] == "Summer on the Hudson: Tai Chi"

    async def test_get_event_not_found(self, client, db_session):
        """A nonexistent guid must return 404."""
        resp = await client.get("/events/nonexistent-guid-xyz")
        assert resp.status_code == 404


@requires_docker
class TestEventIdentity:
    """Verify identity semantics — guid is the key, not title+location."""

    async def test_event_guid_identity(self, client, db_session):
        """Two rows with different titles but the same guid must be one event."""
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        # The event with guid 2,146,733 already exists. Verify it's one record.
        resp = await client.get("/events")
        guids = [e["guid"] for e in resp.json()["events"]]
        assert guids.count("2,146,733") == 1

    async def test_location_identity_excludes_name(self, db_session):
        """Changing location_name while keeping location_id and coords must
        not create a new record — the guid governs identity."""
        rows = load_fixture("snapshot_a.json")
        # Modify the location_name of the first event.
        modified = dict(rows[0])
        modified["location"] = "Completely Different Name"

        parsed = parse_event(modified)
        event = Event(
            guid=parsed["guid"],
            title=parsed["title"],
            description=parsed["description"],
            official_event_url=parsed["official_event_url"],
            location_id=parsed["location_id"],
            location_name=parsed["location_name"],
            start_date=date.fromisoformat(parsed["start_date"]) if parsed["start_date"] else None,
            end_date=date.fromisoformat(parsed["end_date"]) if parsed["end_date"] else None,
            start_datetime=parsed["start_datetime"],
            end_datetime=parsed["end_datetime"],
            categories=parsed["categories"],
            latitude=parsed["latitude"],
            longitude=parsed["longitude"],
            borough=parsed["borough"],
            registration_status=parsed["registration_status"],
            registration_description=parsed["registration_description"],
            is_free_explicit=parsed["is_free_explicit"],
            accessibility_mentioned=parsed["accessibility_mentioned"],
            raw_data=parsed["raw_data"],
        )
        await db_session.merge(event)
        await db_session.commit()

        from sqlalchemy import select, func
        count_result = await db_session.execute(
            select(func.count()).select_from(Event).where(Event.guid == "2,146,733")
        )
        assert count_result.scalar() == 1

        result = await db_session.execute(
            select(Event).where(Event.guid == "2,146,733")
        )
        updated_event = result.scalar_one()
        assert updated_event.location_name == "Completely Different Name"
        assert updated_event.location_id == "M072"


@requires_docker
class TestFilters:
    """Verify query parameter filtering on the events endpoint."""

    async def test_borough_filter(self, client, db_session):
        """Filtering by borough must return only matching events."""
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        resp = await client.get("/events", params={"borough": "Manhattan"})
        body = resp.json()
        assert body["total"] == 1
        assert body["events"][0]["borough"]["value"] == "Manhattan"

    async def test_category_filter(self, client, db_session):
        """Filtering by category must return only events containing that category."""
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        resp = await client.get("/events", params={"category": "Running/Jogging"})
        body = resp.json()
        assert body["total"] == 1
        assert "Running/Jogging" in body["events"][0]["categories"]["value"]

    async def test_date_range_filter(self, client, db_session):
        """Filtering by date_from and date_to must limit results to the range."""
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        # All events in snapshot_a are on 2026-08-09
        resp = await client.get(
            "/events",
            params={"date_from": "2026-08-09", "date_to": "2026-08-09"},
        )
        body = resp.json()
        assert body["total"] == 3

        # A range that excludes all events.
        resp2 = await client.get(
            "/events",
            params={"date_from": "2026-12-01", "date_to": "2026-12-31"},
        )
        body2 = resp2.json()
        assert body2["total"] == 0
