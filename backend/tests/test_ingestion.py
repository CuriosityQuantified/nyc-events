"""Tests for event ingestion — snapshot deltas, guid identity, network isolation."""

from __future__ import annotations

from unittest.mock import patch

import httpx
import pytest
from sqlalchemy import select, func

from app.models.event import Event
from app.socrata import SocrataClient, SocrataError
from tests.conftest import AlwaysErrorTransport, ingest_rows, load_fixture, requires_docker


@requires_docker
class TestIngestionWithDb:
    """Verify snapshot ingestion, deltas, and guid-based identity (needs Postgres)."""

    async def test_ingest_snapshot_a(self, db_session):
        """All events from snapshot_a must be stored in the database."""
        rows = load_fixture("snapshot_a.json")
        await ingest_rows(db_session, rows)

        count_result = await db_session.execute(
            select(func.count()).select_from(Event)
        )
        assert count_result.scalar() == 3

        result = await db_session.execute(
            select(Event).where(Event.guid == "2,146,733")
        )
        event = result.scalar_one()
        assert event.title == "Summer on the Hudson: Tai Chi"
        assert event.borough == "Manhattan"

    async def test_ingest_snapshot_b_delta(self, db_session):
        """Ingesting snapshot_b after snapshot_a must add 1 new event and
        update 1 changed event (endtime changed for guid 2,181,767)."""
        rows_a = load_fixture("snapshot_a.json")
        await ingest_rows(db_session, rows_a)

        rows_b = load_fixture("snapshot_b.json")
        await ingest_rows(db_session, rows_b)

        # snapshot_b has 4 events: 3 from A (1 modified) + 1 new
        count_result = await db_session.execute(
            select(func.count()).select_from(Event)
        )
        assert count_result.scalar() == 4

        # Verify the new event exists.
        result = await db_session.execute(
            select(Event).where(Event.guid == "2,098,303")
        )
        new_event = result.scalar_one()
        assert new_event.borough == "Queens"

        # Verify the modified event was updated (endtime changed to 16:00).
        result2 = await db_session.execute(
            select(Event).where(Event.guid == "2,181,767")
        )
        modified_event = result2.scalar_one()
        assert modified_event.end_datetime.hour == 16

    async def test_source_guid_is_primary_key(self, db_session):
        """Duplicate guid must update, not create a second row."""
        rows = load_fixture("snapshot_a.json")[:1]
        await ingest_rows(db_session, rows)

        # Ingest the same guid again with a modified title.
        modified = dict(rows[0])
        modified["title"] = "Updated Title"
        await ingest_rows(db_session, [modified])

        count_result = await db_session.execute(
            select(func.count()).select_from(Event).where(
                Event.guid == "2,146,733"
            )
        )
        assert count_result.scalar() == 1

        result = await db_session.execute(
            select(Event).where(Event.guid == "2,146,733")
        )
        event = result.scalar_one()
        assert event.title == "Updated Title"


class TestNetworkEnforcement:
    """Verify that transport-layer substitution prevents real network access."""

    async def test_no_network_enforcement(self):
        """The Socrata client with an injected transport must not reach
        the network. The error transport simulates a blocked connection."""
        transport = AlwaysErrorTransport(503)
        http_client = httpx.AsyncClient(transport=transport)

        with patch("app.socrata.get_settings") as mock_settings:
            mock_settings.return_value.socrata_query_endpoint = "https://fake.socrata/query"
            mock_settings.return_value.socrata_api_key_id = ""
            mock_settings.return_value.socrata_api_key_secret = ""
            mock_settings.return_value.socrata_app_token = ""

            with patch("app.socrata.asyncio.sleep", return_value=None):
                client = SocrataClient(http_client=http_client)
                client._page_size = 10
                with pytest.raises(SocrataError):
                    await client.fetch_all_events()
