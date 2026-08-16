"""Regression gates for canonical current-event calendar dates (issue #68)."""

from __future__ import annotations

from datetime import UTC, date, datetime
from types import SimpleNamespace

import pytest
from jsonschema import Draft202012Validator, FormatChecker
from sqlalchemy import select

from app.concierge_tools import (
    CurrentEventSearch,
    get_current_event,
    search_current_events,
)
from app.models.event import CurrentEvent, EventRepository
from app.routes.events import _event_to_contract
from tests.conftest import ingest_rows, load_fixture, requires_docker
from tests.test_contract import _load_spec
from tests.test_profiles import DEVICE_TOKEN, _headers


def _event(**overrides):
    values = {
        "guid": "date-regression",
        "title": "Date regression",
        "description": None,
        "official_event_url": None,
        "location_id": None,
        "location_name": None,
        "start_date": None,
        "end_date": None,
        "start_datetime": None,
        "end_datetime": None,
        "categories": None,
        "latitude": None,
        "longitude": None,
        "borough": None,
        "registration_status": None,
        "registration_description": None,
        "is_free_explicit": None,
        "accessibility_mentioned": None,
        "raw_data": {},
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def _event_validator() -> Draft202012Validator:
    spec = _load_spec()
    return Draft202012Validator(
        {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$ref": "#/components/schemas/Event",
            "components": spec["components"],
        },
        format_checker=FormatChecker(),
    )


def test_explicit_dates_win_and_keep_source_evidence() -> None:
    event = _event(
        start_date=date(2026, 8, 20),
        end_date=date(2026, 8, 21),
        start_datetime=datetime(2026, 8, 16, 2, 30, tzinfo=UTC),
        end_datetime=datetime(2026, 8, 16, 3, 30, tzinfo=UTC),
        raw_data={
            "startdate": "08/20/2026",
            "enddate": "08/21/2026",
            "starttime": "2026-08-15 22:30:00",
            "endtime": "2026-08-15 23:30:00",
        },
    )

    contract = _event_to_contract(event)

    assert contract["start_date"] == {
        "value": "2026-08-20",
        "provenance": "Derived",
        "raw": "08/20/2026",
    }
    assert contract["end_date"] == {
        "value": "2026-08-21",
        "provenance": "Derived",
        "raw": "08/21/2026",
    }


@pytest.mark.parametrize(
    ("instant", "expected_date"),
    (
        (datetime(2026, 8, 16, 2, 30, tzinfo=UTC), "2026-08-15"),
        (datetime(2026, 3, 8, 6, 59, tzinfo=UTC), "2026-03-08"),
        (datetime(2026, 3, 8, 7, 0, tzinfo=UTC), "2026-03-08"),
        (datetime(2026, 11, 1, 3, 30, tzinfo=UTC), "2026-10-31"),
        (datetime(2026, 11, 1, 6, 30, tzinfo=UTC), "2026-11-01"),
    ),
)
def test_missing_date_derives_new_york_date_with_datetime_evidence(
    instant: datetime, expected_date: str
) -> None:
    event = _event(
        start_datetime=instant,
        end_datetime=instant,
        raw_data={"starttime": instant.isoformat(), "endtime": instant.isoformat()},
    )

    contract = _event_to_contract(event)

    expected = {
        "value": expected_date,
        "provenance": "Derived",
        "raw": instant.isoformat(),
    }
    assert contract["start_date"] == expected
    assert contract["end_date"] == expected


def test_date_only_and_fully_missing_values_do_not_invent_datetimes_or_dates() -> None:
    date_only = _event(
        start_date=date(2026, 9, 1),
        raw_data={"startdate": "09/01/2026"},
    )
    missing = _event()

    date_only_contract = _event_to_contract(date_only)
    missing_contract = _event_to_contract(missing)

    assert date_only_contract["start_date"]["value"] == "2026-09-01"
    assert date_only_contract["start_datetime"] == {
        "value": None,
        "provenance": "Not listed",
        "raw": None,
    }
    for field in ("start_date", "end_date"):
        assert missing_contract[field] == {
            "value": None,
            "provenance": "Not listed",
            "raw": None,
        }


@requires_docker
async def test_current_events_fallback_is_consistent_across_api_and_consumers(
    client, db_session
) -> None:
    row = load_fixture("snapshot_a.json")[0]
    interest = await client.put(
        "/profile/interests",
        headers=_headers(DEVICE_TOKEN),
        json={"facet_type": "category", "facet_value": "Fitness"},
    )
    assert interest.status_code == 200
    await ingest_rows(db_session, [row])
    current = await db_session.get(CurrentEvent, row["guid"])
    repository = await db_session.get(EventRepository, row["guid"])
    assert current is not None and repository is not None

    instant = datetime(2026, 8, 16, 2, 30, tzinfo=UTC)
    raw_datetime = "2026-08-16T02:30:00+00:00"
    for event in (current, repository):
        event.start_date = None
        event.end_date = None
        event.start_datetime = instant
        event.end_datetime = instant
        event.raw_data = {
            **(event.raw_data or {}),
            "startdate": "",
            "enddate": "",
            "starttime": raw_datetime,
            "endtime": raw_datetime,
        }
    await db_session.commit()

    list_response = await client.get(
        "/events", params={"date_from": "2026-08-15", "date_to": "2026-08-15"}
    )
    detail_response = await client.get(f"/events/{row['guid']}")
    assert list_response.status_code == detail_response.status_code == 200
    listed = list_response.json()["events"][0]
    detailed = detail_response.json()
    assert (
        listed["start_date"]
        == detailed["start_date"]
        == {
            "value": "2026-08-15",
            "provenance": "Derived",
            "raw": raw_datetime,
        }
    )
    _event_validator().validate(listed)
    _event_validator().validate(detailed)

    saved_response = await client.put(
        f"/profile/saved/{row['guid']}", headers=_headers(DEVICE_TOKEN)
    )
    assert saved_response.status_code == 200
    saved = await client.get("/profile/saved", headers=_headers(DEVICE_TOKEN))
    matches = await client.get("/profile/matches", headers=_headers(DEVICE_TOKEN))
    assert saved.json()["events"][0]["start_date"] == detailed["start_date"]
    assert matches.json()["events"][0]["start_date"] == detailed["start_date"]

    concierge_detail = await get_current_event(row["guid"])
    concierge_list = await search_current_events(CurrentEventSearch(limit=1))
    assert concierge_detail is not None
    assert concierge_detail["event"]["start_date"] == detailed["start_date"]
    assert concierge_list["events"][0]["start_date"] == detailed["start_date"]

    repository.start_date = date(2030, 1, 1)
    await db_session.commit()
    still_current = await client.get(f"/events/{row['guid']}")
    assert still_current.json()["start_date"]["value"] == "2026-08-15"


@requires_docker
async def test_date_filter_and_order_include_date_only_and_missing_rows(
    client, db_session
) -> None:
    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, rows)
    current = (
        await db_session.scalars(select(CurrentEvent).order_by(CurrentEvent.guid))
    ).all()
    by_guid = {event.guid: event for event in current}

    date_only = by_guid[rows[0]["guid"]]
    datetime_only = by_guid[rows[1]["guid"]]
    missing = by_guid[rows[2]["guid"]]
    date_only.start_date = date(2026, 8, 14)
    date_only.start_datetime = None
    datetime_only.start_date = None
    datetime_only.start_datetime = datetime(2026, 8, 16, 2, 30, tzinfo=UTC)
    missing.start_date = None
    missing.start_datetime = None
    await db_session.commit()

    response = await client.get("/events")
    assert response.status_code == 200
    assert [event["guid"] for event in response.json()["events"]] == [
        date_only.guid,
        datetime_only.guid,
        missing.guid,
    ]
    assert response.json()["events"][-1]["start_date"]["provenance"] == "Not listed"
