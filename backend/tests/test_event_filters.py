"""Issue #11 API gates for composable Event facet filters."""

from __future__ import annotations

import pytest

from tests.conftest import ingest_rows, load_fixture, requires_docker


@requires_docker
class TestEventFacetFilters:
    """Exercise filters through GET /events against real PostgreSQL."""

    async def test_each_supported_facet_filters_the_public_api(
        self, client, db_session
    ):
        rows = load_fixture("snapshot_a.json")
        dates = ("08/08/2026", "08/09/2026", "08/10/2026")
        dated_rows = [
            dict(
                row,
                startdate=event_date,
                enddate=event_date,
                starttime=f"2026-08-{8 + index:02d} 08:00:00",
                endtime=f"2026-08-{8 + index:02d} 09:00:00",
            )
            for index, (row, event_date) in enumerate(zip(rows, dates, strict=True))
        ]
        drop_in = dict(
            dated_rows[0],
            registration_description="Registration not required.",
        )
        await ingest_rows(db_session, [drop_in, *dated_rows[1:]])

        cases = (
            ({"borough": "manhattan"}, {rows[0]["guid"]}),
            ({"category": "fitness"}, {rows[0]["guid"]}),
            ({"date_from": "2026-08-09"}, {row["guid"] for row in rows[1:]}),
            ({"date_to": "2026-08-09"}, {row["guid"] for row in rows[:2]}),
            ({"registration": "required"}, {rows[2]["guid"]}),
            ({"registration": "not_required"}, {rows[0]["guid"]}),
            ({"registration": "closed"}, {rows[1]["guid"]}),
        )

        for params, expected_guids in cases:
            response = await client.get("/events", params=params)
            assert response.status_code == 200
            body = response.json()
            assert {event["guid"] for event in body["events"]} == expected_guids
            assert body["total"] == len(expected_guids)
            assert body["applied_facets"] == {
                name: [str(value)] for name, value in params.items()
            }

    async def test_not_listed_registration_remains_unknown(self, client, db_session):
        rows = load_fixture("snapshot_a.json")
        await ingest_rows(db_session, rows)

        response = await client.get("/events", params={"registration": "not_listed"})

        assert response.status_code == 200
        body = response.json()
        assert [event["guid"] for event in body["events"]] == [rows[0]["guid"]]
        assert body["events"][0]["registration_status"] == {
            "value": None,
            "provenance": "Not listed",
            "raw": None,
        }
        assert body["applied_facets"] == {"registration": ["not_listed"]}

    async def test_facets_compose_before_counting_and_pagination(
        self, client, db_session
    ):
        rows = load_fixture("snapshot_a.json")
        await ingest_rows(db_session, rows)

        params = {
            "borough": "BROOKLYN",
            "category": "running/jogging",
            "date_from": "2026-08-09",
            "date_to": "2026-08-09",
            "registration": "required",
            "page": 1,
            "page_size": 1,
        }
        response = await client.get("/events", params=params)

        assert response.status_code == 200
        body = response.json()
        assert [event["guid"] for event in body["events"]] == [rows[2]["guid"]]
        assert body["total"] == 1
        assert body["applied_facets"] == {
            "borough": ["BROOKLYN"],
            "category": ["running/jogging"],
            "date_from": ["2026-08-09"],
            "date_to": ["2026-08-09"],
            "registration": ["required"],
        }

    async def test_zero_results_are_successful_and_report_applied_facets(
        self, client, db_session
    ):
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))

        response = await client.get(
            "/events",
            params={"borough": "Queens", "category": "Fitness"},
        )

        assert response.status_code == 200
        assert response.json() == {
            "events": [],
            "page": 1,
            "page_size": 20,
            "total": 0,
            "applied_facets": {
                "borough": ["Queens"],
                "category": ["Fitness"],
            },
        }

    @pytest.mark.parametrize(
        ("params", "expected_status"),
        (
            ({"registration": "sometimes"}, 422),
            ({"date_from": "08/09/2026"}, 422),
            ({"date_from": "2026-08-10", "date_to": "2026-08-09"}, 400),
            ({"borough": ""}, 422),
            ({"category": "x" * 101}, 422),
        ),
    )
    async def test_invalid_filters_fail_as_errors(
        self, client, params, expected_status
    ):
        response = await client.get("/events", params=params)
        assert response.status_code == expected_status
        assert response.status_code != 200

    async def test_filter_values_are_data_not_sql(self, client, db_session):
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))

        response = await client.get(
            "/events",
            params={"category": "Fitness') OR TRUE --"},
        )

        assert response.status_code == 200
        assert response.json()["events"] == []
        assert response.json()["total"] == 0
