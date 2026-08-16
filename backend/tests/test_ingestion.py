"""Tests for event ingestion — snapshot deltas, guid identity, network isolation."""

from __future__ import annotations

from unittest.mock import patch
from zoneinfo import ZoneInfo

import httpx
import pytest
from sqlalchemy import func, select

from app.models.event import CurrentEvent, EventRepository, SyncRun
from app.socrata import SocrataClient, SocrataError, sync_events
from tests.conftest import (
    AlwaysErrorTransport,
    ingest_rows,
    load_fixture,
    requires_docker,
)


@requires_docker
class TestIngestionWithDb:
    """Verify atomic current Snapshot replacement and archival retention."""

    async def test_ingest_snapshot_a(self, db_session):
        """All events from snapshot_a must be stored in the database."""
        rows = load_fixture("snapshot_a.json")
        await ingest_rows(db_session, rows)

        assert await db_session.scalar(
            select(func.count()).select_from(CurrentEvent)
        ) == len(rows)
        assert await db_session.scalar(
            select(func.count()).select_from(EventRepository)
        ) == len(rows)

        event = await db_session.get(CurrentEvent, "2,146,733")
        assert event is not None
        assert event.title == "Summer on the Hudson: Tai Chi"
        assert event.borough == "Manhattan"

    async def test_ingest_live_registration_url_object(self, db_session):
        """A live Socrata URL object must ingest and retain its raw shape."""
        rows = load_fixture("live_registration_url_object.json")

        await ingest_rows(db_session, rows)

        event = await db_session.get(CurrentEvent, "live-object-1")
        assert event is not None
        assert event.official_event_url == rows[0]["link"]["url"]
        assert event.registration_status == "required"
        assert event.raw_data["registration_url"] == rows[0]["registration_url"]
        assert event.raw_data["link"] == rows[0]["link"]

    async def test_ingest_snapshot_b_delta(self, db_session):
        """Ingesting snapshot_b after snapshot_a must add 1 new event and
        update 1 changed event (endtime changed for guid 2,181,767)."""
        rows_a = load_fixture("snapshot_a.json")
        await ingest_rows(db_session, rows_a)

        rows_b = load_fixture("snapshot_b.json")
        await ingest_rows(db_session, rows_b)

        assert await db_session.scalar(
            select(func.count()).select_from(CurrentEvent)
        ) == len(rows_b)
        assert await db_session.scalar(
            select(func.count()).select_from(EventRepository)
        ) == len({row["guid"] for row in rows_a + rows_b})

        new_event = await db_session.get(CurrentEvent, "2,098,303")
        assert new_event is not None
        assert new_event.borough == "Queens"

        # Verify the modified event was updated (endtime changed to 16:00).
        modified_event = await db_session.get(CurrentEvent, "2,181,767")
        assert modified_event is not None
        local_end = modified_event.end_datetime.astimezone(ZoneInfo("America/New_York"))
        assert local_end.hour == 16

    async def test_source_guid_is_primary_key(self, db_session):
        """Duplicate guid must update, not create a second row."""
        rows = load_fixture("snapshot_a.json")[:1]
        await ingest_rows(db_session, rows)

        # Ingest the same guid again with a modified title.
        modified = dict(rows[0])
        modified["title"] = "Updated Title"
        await ingest_rows(db_session, [modified])

        assert (
            await db_session.scalar(
                select(func.count())
                .select_from(CurrentEvent)
                .where(CurrentEvent.guid == "2,146,733")
            )
            == 1
        )

        event = await db_session.get(CurrentEvent, "2,146,733")
        assert event is not None
        assert event.title == "Updated Title"

    async def test_invalid_row_rolls_back_the_whole_snapshot(self, db_session):
        """A malformed row must not leave a partially ingested Snapshot."""
        valid = load_fixture("snapshot_a.json")[0]
        invalid = dict(load_fixture("snapshot_a.json")[1])
        invalid.pop("guid")

        with pytest.raises(SocrataError, match="guid"):
            await ingest_rows(db_session, [valid, invalid])

        count = await db_session.scalar(select(func.count()).select_from(CurrentEvent))
        assert count == 0

    async def test_snapshot_replacement_preserves_archival_union(self, db_session):
        rows_a = load_fixture("snapshot_a.json")
        rows_b = [dict(rows_a[1], title="Changed title"), rows_a[2]]

        await ingest_rows(db_session, rows_a)
        archived = await db_session.get(EventRepository, rows_a[1]["guid"])
        assert archived is not None
        first_seen_at = archived.first_seen_at
        await ingest_rows(db_session, rows_b)

        current = (await db_session.scalars(select(CurrentEvent))).all()
        repository = (await db_session.scalars(select(EventRepository))).all()
        assert {event.guid for event in current} == {
            rows_a[1]["guid"],
            rows_a[2]["guid"],
        }
        assert {event.guid for event in repository} == {row["guid"] for row in rows_a}
        changed = await db_session.get(EventRepository, rows_a[1]["guid"])
        assert changed is not None
        assert changed.title == "Changed title"
        assert changed.first_seen_at == first_seen_at
        assert changed.first_seen_at <= changed.last_seen_at

    async def test_empty_and_malformed_snapshots_preserve_both_tables(self, db_session):
        rows = load_fixture("snapshot_a.json")
        await ingest_rows(db_session, rows)
        before_current = {
            item.guid: item.title
            for item in (await db_session.scalars(select(CurrentEvent))).all()
        }
        before_repository = {
            item.guid: item.title
            for item in (await db_session.scalars(select(EventRepository))).all()
        }

        with pytest.raises(SocrataError, match="empty Snapshot"):
            await ingest_rows(db_session, [])
        with pytest.raises(SocrataError, match="title"):
            await ingest_rows(db_session, [dict(rows[0]), {"guid": "broken"}])

        after_current = {
            item.guid: item.title
            for item in (await db_session.scalars(select(CurrentEvent))).all()
        }
        after_repository = {
            item.guid: item.title
            for item in (await db_session.scalars(select(EventRepository))).all()
        }
        assert after_current == before_current
        assert after_repository == before_repository

    async def test_unsupported_optional_field_shape_preserves_snapshot(
        self, db_session
    ):
        rows = load_fixture("snapshot_a.json")
        await ingest_rows(db_session, rows)
        malformed = dict(rows[0], categories={"unexpected": "object"})

        with pytest.raises(SocrataError, match="categories must be a string"):
            await ingest_rows(db_session, [malformed])

        current = (await db_session.scalars(select(CurrentEvent))).all()
        repository = (await db_session.scalars(select(EventRepository))).all()
        assert {event.guid for event in current} == {row["guid"] for row in rows}
        assert {event.guid for event in repository} == {row["guid"] for row in rows}

    async def test_sync_run_records_success_and_failure_without_secrets(
        self, db_session
    ):
        class FixtureClient:
            def __init__(self, result):
                self.result = result

            async def fetch_all_events(self):
                if isinstance(self.result, Exception):
                    raise self.result
                return self.result

        rows = load_fixture("snapshot_a.json")
        assert await sync_events(db_session, FixtureClient(rows)) == len(rows)
        with pytest.raises(SocrataError, match="upstream unavailable"):
            await sync_events(
                db_session, FixtureClient(SocrataError("upstream unavailable"))
            )

        runs = (await db_session.scalars(select(SyncRun).order_by(SyncRun.id))).all()
        assert [run.status for run in runs] == ["succeeded", "failed"]
        assert runs[0].row_count == len(rows)
        assert runs[1].failure_code == "SocrataError"
        assert "upstream unavailable" not in repr(runs[1].__dict__)


class TestNetworkEnforcement:
    """Verify that transport-layer substitution prevents real network access."""

    async def test_no_network_enforcement(self):
        """The Socrata client with an injected transport must not reach
        the network. The error transport simulates a blocked connection."""
        transport = AlwaysErrorTransport(503)
        http_client = httpx.AsyncClient(transport=transport)

        with patch("app.socrata.get_settings") as mock_settings:
            mock_settings.return_value.socrata_query_endpoint = (
                "https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json"
            )
            mock_settings.return_value.socrata_api_key_id = ""
            mock_settings.return_value.socrata_api_key_secret = ""
            mock_settings.return_value.socrata_app_token = ""

            with patch("app.socrata.asyncio.sleep", return_value=None):
                client = SocrataClient(http_client=http_client)
                client._page_size = 10
                with pytest.raises(SocrataError):
                    await client.fetch_all_events()
