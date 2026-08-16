"""Issue #13 executable gates for single-Event provenance."""

from __future__ import annotations

import pytest

from app.models.event import CurrentEvent
from app.socrata import parse_event
from tests.conftest import ingest_rows, requires_docker

PROVENANCE_VALUES = {"Stated", "Derived", "Not listed"}


def _source_row(**overrides):
    row = {
        "guid": "provenance-13",
        "title": "Provenance event",
        "description": "Admission is free. The venue is wheelchair accessible.",
        "link": {
            "url": "https://www.nycgovparks.org/events/provenance-13",
            "description": "Official event page",
        },
        "parkids": "Q001",
        "location": "Example Park",
        "coordinates": "40.700000, -73.900000",
        "categories": "Arts & Culture|Accessible",
        "startdate": "08/16/2026",
        "enddate": "08/16/2026",
        "starttime": "2026-08-16 10:00:00",
        "endtime": "2026-08-16 11:00:00",
        "registration_description": "Registration is not required.",
        "registration_url": "",
    }
    row.update(overrides)
    return row


@pytest.mark.parametrize(
    "description",
    [
        "Tickets cost $5.",
        "This is not a free event.",
        "Free snacks and free parking are available.",
        "Sugar-free snacks are served.",
        None,
    ],
)
def test_free_status_is_never_inferred_from_silence_or_ambiguous_text(description):
    parsed = parse_event(_source_row(description=description))

    assert parsed["is_free_explicit"] is None
    assert parsed["raw_data"]["description"] == description


def test_positive_source_language_sets_only_positive_derived_flags():
    row = _source_row()

    parsed = parse_event(row)

    assert parsed["is_free_explicit"] is True
    assert parsed["accessibility_mentioned"] is True
    assert parsed["raw_data"] == row


@requires_docker
async def test_single_event_returns_complete_provenance_and_preserves_raw_source(
    client, db_session
):
    row = _source_row()
    await ingest_rows(db_session, [row])

    response = await client.get(f"/events/{row['guid']}")

    assert response.status_code == 200
    body = response.json()
    assert body["guid"] == row["guid"]
    facts = {name: fact for name, fact in body.items() if name != "guid"}
    assert facts
    assert all(set(fact) == {"value", "provenance", "raw"} for fact in facts.values())
    assert all(fact["provenance"] in PROVENANCE_VALUES for fact in facts.values())
    assert body["is_free_explicit"] == {
        "value": True,
        "provenance": "Derived",
        "raw": row["description"],
    }
    assert body["accessibility_mentioned"] == {
        "value": True,
        "provenance": "Derived",
        "raw": row["description"],
    }
    assert body["official_event_url"] == {
        "value": row["link"]["url"],
        "provenance": "Stated",
        "raw": row["link"]["url"],
    }
    assert body["borough"] == {
        "value": "Queens",
        "provenance": "Derived",
        "raw": row["parkids"],
    }

    stored = await db_session.get(CurrentEvent, row["guid"])
    assert stored is not None
    assert stored.is_free_explicit is True
    assert stored.accessibility_mentioned is True
    assert stored.raw_data == row


@requires_docker
async def test_missing_source_facts_are_absent_not_negative_claims(client, db_session):
    row = {"guid": "not-listed-13", "title": "Source-only title"}
    await ingest_rows(db_session, [row])

    response = await client.get(f"/events/{row['guid']}")

    assert response.status_code == 200
    body = response.json()
    for field in (
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
    ):
        assert body[field] == {
            "value": None,
            "provenance": "Not listed",
            "raw": None,
        }
