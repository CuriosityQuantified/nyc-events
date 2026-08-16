"""Tests for the events API endpoints."""

from __future__ import annotations

from sqlalchemy import func, select

from app.models.event import Event
from tests.conftest import ingest_rows, load_fixture, requires_docker


@requires_docker
class TestListEvents:
    """Verify that GET /events returns stored Events in contract shape."""

    async def test_list_events_returns_contract_schema(self, client, db_session):
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        response = await client.get("/events")
        assert response.status_code == 200
        body = response.json()

        assert set(body) == {"events", "page", "page_size", "total", "applied_facets"}
        assert body["total"] == 3
        assert len(body["events"]) == 3
        assert body["applied_facets"] == {}

        required_fields = {
            "guid",
            "title",
            "description",
            "official_event_url",
            "location_id",
            "location_name",
            "start_date",
            "end_date",
            "start_datetime",
            "end_datetime",
            "categories",
            "coordinates",
            "borough",
            "registration_status",
            "registration_description",
            "is_free_explicit",
            "accessibility_mentioned",
        }
        assert set(body["events"][0]) == required_fields

    async def test_list_events_pagination_and_bounds(self, client, db_session):
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        first = await client.get("/events", params={"page_size": 2, "page": 1})
        second = await client.get("/events", params={"page_size": 2, "page": 2})
        invalid = await client.get("/events", params={"page_size": 101})

        assert len(first.json()["events"]) == 2
        assert first.json()["total"] == 3
        assert len(second.json()["events"]) == 1
        assert second.json()["total"] == 3
        assert invalid.status_code == 422


@requires_docker
class TestGetEvent:
    """Verify that GET /events/{guid} uses the source guid."""

    async def test_get_event_by_guid(self, client, db_session):
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        response = await client.get("/events/2,146,733")
        assert response.status_code == 200
        assert response.json()["guid"] == "2,146,733"
        assert response.json()["title"]["value"] == "Summer on the Hudson: Tai Chi"

    async def test_get_event_not_found_and_guid_bound(self, client):
        assert (await client.get("/events/nonexistent-guid-xyz")).status_code == 404
        assert (await client.get(f"/events/{'x' * 256}")).status_code == 422


@requires_docker
class TestIdentity:
    """Verify Event and Location identity rules."""

    async def test_source_guid_is_the_only_event_key(self, db_session):
        row = load_fixture("snapshot_a.json")[0]
        await ingest_rows(db_session, [row])
        changed = dict(row, title="Updated title")
        await ingest_rows(db_session, [changed])

        count = await db_session.scalar(
            select(func.count()).select_from(Event).where(Event.guid == row["guid"])
        )
        stored = await db_session.scalar(select(Event).where(Event.guid == row["guid"]))
        assert count == 1
        assert stored.title == "Updated title"

    async def test_location_key_uses_source_id_and_normalized_coordinates_not_name(
        self, db_session
    ):
        row = load_fixture("snapshot_a.json")[0]
        await ingest_rows(db_session, [row])
        original = await db_session.scalar(
            select(Event).where(Event.guid == row["guid"])
        )
        original_key = original.location_key

        renamed = dict(row, location="A renamed display label")
        await ingest_rows(db_session, [renamed])
        renamed_event = await db_session.scalar(
            select(Event).where(Event.guid == row["guid"])
        )
        assert renamed_event.location_key == original_key
        assert renamed_event.location_name == "A renamed display label"
        assert original_key == "M072|40.792000,-73.978996"

        moved = dict(row, coordinates="40.700000, -73.900000")
        await ingest_rows(db_session, [moved])
        moved_event = await db_session.scalar(
            select(Event).where(Event.guid == row["guid"])
        )
        assert moved_event.location_key != original_key
