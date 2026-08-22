"""Offline and PostgreSQL regressions for strict subway proximity filtering."""

from __future__ import annotations

import gzip
import hashlib
import json
import math
from collections import Counter
from pathlib import Path

import pytest
from sqlalchemy import delete, func, select, text
from sqlalchemy.orm import aliased

from app.models.subway import SubwayRoute, SubwayRouteStop, SubwaySource, SubwayStop
from app.services.subway import (
    EARTH_RADIUS_MILES,
    nearest_stop_subquery,
    straight_line_distance_miles,
)
from tests.conftest import ingest_rows, load_fixture, requires_docker


def _coordinate_north(latitude: float, longitude: float, miles: float) -> str:
    latitude_delta = math.degrees(miles / EARTH_RADIUS_MILES)
    return f"{latitude + latitude_delta:.15f},{longitude:.15f}"


def _event(guid: str, coordinates: str) -> dict[str, str]:
    return {"guid": guid, "title": guid, "coordinates": coordinates}


def test_straight_line_distance_is_deterministic_and_rejects_bad_coordinates():
    assert straight_line_distance_miles(40.75529, -73.987495, 40.75529, -73.987495) == 0
    assert straight_line_distance_miles(
        40.75529, -73.987495, 40.761728, -73.983849
    ) == pytest.approx(0.48402387564720106)
    assert straight_line_distance_miles(0, 0, 40.75529, -73.987495) is None
    assert straight_line_distance_miles(91, 0, 40.75529, -73.987495) is None
    assert straight_line_distance_miles(float("nan"), 0, 40.75529, -73.987495) is None


def test_committed_transformation_is_exact_canonical_and_reproducible():
    dataset_path = (
        Path(__file__).resolve().parents[1]
        / "app/data/mta_subway_gtfs_2026-08-07.json.gz"
    )
    artifact = dataset_path.read_bytes()
    assert hashlib.sha256(artifact).hexdigest() == (
        "25cba3d96c7c1c0cbc2221806f027e491506f9966cc4b137d4b4a2db01d42c3d"
    )
    assert int.from_bytes(artifact[4:8], "little") == 0
    with gzip.open(dataset_path, "rt", encoding="utf-8") as stream:
        dataset = json.load(stream)

    assert dataset["source"]["archive_sha256"] == (
        "056d1fc821f26e859c41ffb227197bdd45dbf4a0c3ef41b3509a5ff6dda4602e"
    )
    assert dataset["source"]["source_file_sha256"] == {
        "routes.txt": (
            "8f1917e6fb1feee9ad0158a5414b9de4bff8ca73ddb4818f9520c9acfae644b6"
        ),
        "shapes.txt": (
            "012945d9b5efff0365c5ad5b3a1f89d1d6f53189492ef53b82a97bede0d20086"
        ),
        "stop_times.txt": (
            "a222539b8f17d6352ddc7f0c789decdf1d5e647db1c66ff43efd179b69248e4f"
        ),
        "stops.txt": (
            "423036143d340315590054c138b76692010886527ea0b3693dabe74fc1b55162"
        ),
        "trips.txt": (
            "35f8aba33d8771c88a953646a6ece8b0e29ea9817edf5126e636ed05769e146d"
        ),
    }
    assert (
        len(dataset["routes"]),
        len(dataset["stops"]),
        len(dataset["route_stops"]),
    ) == (
        29,
        1488,
        7361,
    )
    assert Counter(stop["location_type"] for stop in dataset["stops"]) == {
        0: 992,
        1: 496,
    }
    stops = {stop["stop_id"]: stop for stop in dataset["stops"]}
    assert stops["101N"]["parent_station"] == "101"
    assert stops["101"]["location_type"] == 1
    assert all(
        stop["parent_station"] in stops
        for stop in dataset["stops"]
        if stop["parent_station"] is not None
    )
    branch_unique_relationship = {
        "route_id": "5",
        "stop_id": "248N",
        "branch_id": "5..N60R",
    }
    assert branch_unique_relationship in dataset["route_stops"]
    assert {
        relationship["branch_id"]
        for relationship in dataset["route_stops"]
        if relationship["route_id"] == "5" and relationship["stop_id"] == "248N"
    } == {"5..N60R"}
    for route in dataset["routes"]:
        geometry = route["geometry"]
        assert geometry["type"] == "Feature"
        assert geometry["geometry"]["type"] == "MultiLineString"
        longitude, latitude = geometry["geometry"]["coordinates"][0][0]
        assert -180 <= longitude <= 180
        assert -90 <= latitude <= 90


@requires_docker
class TestSubwayDataset:
    async def test_canonical_dataset_has_stable_ids_branches_geometry_and_metadata(
        self, db_session
    ):
        source = await db_session.get(SubwaySource, "mta-nyct-subway-gtfs")
        route = await db_session.get(SubwayRoute, "A")
        assert source is not None
        assert source.attribution == "Metropolitan Transportation Authority (MTA)"
        assert (
            source.source_url == "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip"
        )
        assert source.updated_at.isoformat() == "2026-08-07T12:10:36+00:00"
        assert route is not None
        assert route.geometry["type"] == "Feature"

        branch_count = await db_session.scalar(
            select(func.count(func.distinct(SubwayRouteStop.branch_id))).where(
                SubwayRouteStop.route_id == "A"
            )
        )
        stop_count = await db_session.scalar(
            select(func.count(func.distinct(SubwayRouteStop.stop_id))).where(
                SubwayRouteStop.route_id == "A"
            )
        )
        assert branch_count == 25
        assert stop_count == 131

        assert (
            await db_session.scalar(select(func.count()).select_from(SubwayStop))
            == 1488
        )
        assert (
            await db_session.scalar(select(func.count()).select_from(SubwayRouteStop))
            == 7361
        )

    async def test_migration_has_server_side_proximity_indexes(self, db_session):
        indexes = (
            (
                await db_session.execute(
                    text(
                        "SELECT indexname FROM pg_indexes "
                        "WHERE tablename IN ('subway_stops', 'subway_route_stops')"
                    )
                )
            )
            .scalars()
            .all()
        )
        assert "ix_subway_stops_coordinates" in indexes
        assert "ix_subway_route_stops_route_stop" in indexes

    async def test_candidate_plan_uses_coordinate_index_not_all_pairs(self, db_session):
        await db_session.execute(
            text(
                "INSERT INTO current_events "
                "(guid, title, raw_data, content_hash, lifecycle_status, snapshot_at) "
                "SELECT 'plan-' || value, 'plan', '{}'::jsonb, repeat('0', 64), "
                "'unchanged', now() FROM generate_series(1, 10000) AS value"
            )
        )
        await db_session.execute(
            text(
                "INSERT INTO current_event_locations"
                "(event_guid, ordinal, latitude, longitude) "
                "SELECT 'plan-' || value, 0, 40.5 + (value % 500) / 1000.0, "
                "-74.2 + (value % 500) / 1000.0 "
                "FROM generate_series(1, 10000) AS value"
            )
        )
        await db_session.execute(text("ANALYZE current_event_locations"))
        await db_session.execute(text("ANALYZE subway_stops"))
        nearest = nearest_stop_subquery("A")
        statement = select(nearest)
        sql = str(
            statement.compile(db_session.bind, compile_kwargs={"literal_binds": True})
        )
        plan = (
            await db_session.execute(text(f"EXPLAIN (ANALYZE, FORMAT JSON) {sql}"))
        ).scalar_one()[0]["Plan"]

        nodes = []

        def collect(node):
            nodes.append(node)
            for child in node.get("Plans", []):
                collect(child)

        collect(plan)
        assert any(
            node.get("Index Name")
            in {
                "ix_subway_stops_coordinates",
                "ix_current_event_locations_coordinates",
            }
            for node in nodes
        )
        assert (
            sum(node.get("Rows Removed by Join Filter", 0) for node in nodes) < 100_000
        )


@requires_docker
class TestSubwayAPI:
    async def _station(self, db_session, route_id: str) -> SubwayStop:
        platform = aliased(SubwayStop)
        station_record = aliased(SubwayStop)
        station = await db_session.scalar(
            select(station_record)
            .join(platform, platform.parent_station == station_record.stop_id)
            .join(SubwayRouteStop, SubwayRouteStop.stop_id == platform.stop_id)
            .where(SubwayRouteStop.route_id == route_id)
            .order_by(station_record.stop_id)
            .limit(1)
        )
        assert station is not None
        return station

    async def test_strict_boundary_multi_location_invalid_coordinates_and_provenance(
        self, client, db_session
    ):
        station = await self._station(db_session, "A")
        near = _coordinate_north(station.latitude, station.longitude, 0.499)
        boundary = _coordinate_north(station.latitude, station.longitude, 0.5)
        farther = _coordinate_north(station.latitude, station.longitude, 0.501)
        await ingest_rows(
            db_session,
            [
                _event("near", near),
                _event("boundary", boundary),
                _event("farther", farther),
                _event("multi", f"40.000000,-74.500000;{near};{near}"),
                _event("null-island", "0,0"),
                _event("invalid-secondary", f"40.000000,-74.500000;91,0;bad;{near}"),
            ],
        )

        response = await client.get(
            "/events", params={"subway_line": "A", "page_size": 100}
        )
        assert response.status_code == 200
        body = response.json()
        by_guid = {event["guid"]: event for event in body["events"]}
        assert set(by_guid) == {"near", "multi", "invalid-secondary"}
        assert body["applied_facets"]["subway_line"] == ["A"]
        assert body["transit_source"] == {
            "id": "mta-nyct-subway-gtfs",
            "attribution": "Metropolitan Transportation Authority (MTA)",
            "source_url": "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip",
            "last_updated": "2026-08-07T12:10:36+00:00",
        }
        proximity = by_guid["near"]["subway_proximity"]
        assert proximity["line_id"] == "A"
        assert proximity["nearest_stop"]["id"]
        assert proximity["nearest_stop"]["name"]
        assert proximity["straight_line_distance_miles"] == pytest.approx(
            0.499, abs=0.001
        )
        forbidden = {"walking_time", "transit_time", "route_availability", "routing"}
        assert forbidden.isdisjoint(proximity)
        assert forbidden.isdisjoint(body)

    async def test_line_and_branch_selection_is_strict(self, client, db_session):
        branch_platform = await db_session.get(SubwayStop, "248N")
        assert branch_platform is not None
        branch_station = await db_session.get(
            SubwayStop, branch_platform.parent_station
        )
        assert branch_station is not None
        branch_station_id = branch_station.stop_id
        branch_platform_id = branch_platform.stop_id
        await ingest_rows(
            db_session,
            [
                _event(
                    "branch-only",
                    f"{branch_station.latitude},{branch_station.longitude}",
                )
            ],
        )

        on_5 = await client.get("/events", params={"subway_line": "5"})
        on_7 = await client.get("/events", params={"subway_line": "7"})
        unknown = await client.get("/events", params={"subway_line": "NOPE"})
        assert {event["guid"] for event in on_5.json()["events"]} == {"branch-only"}
        assert on_7.json()["events"] == []
        assert unknown.status_code == 400
        assert unknown.json() == {"error": "Unknown subway line"}
        nearest = on_5.json()["events"][0]["subway_proximity"]["nearest_stop"]
        assert nearest["id"] == branch_station_id
        assert nearest["id"] != branch_platform_id

    async def test_nearest_stop_tie_uses_stable_stop_id(self, client, db_session):
        tied = [
            SubwayStop(
                stop_id=stop_id,
                source_id="mta-nyct-subway-gtfs",
                name=stop_id,
                latitude=40.6,
                longitude=-74.1,
                location_type=1,
                parent_station=None,
            )
            for stop_id in ("TIE-A", "TIE-B")
        ]
        db_session.add_all(tied)
        await db_session.flush()
        db_session.add_all(
            SubwayRouteStop(route_id="1", stop_id=stop.stop_id, branch_id="test-tie")
            for stop in tied
        )
        await db_session.flush()
        await ingest_rows(
            db_session,
            [_event("tie", "40.6,-74.1")],
        )

        body = (await client.get("/events", params={"subway_line": "1"})).json()
        await db_session.execute(
            delete(SubwayRouteStop).where(SubwayRouteStop.branch_id == "test-tie")
        )
        await db_session.execute(
            delete(SubwayStop).where(SubwayStop.stop_id.in_(("TIE-A", "TIE-B")))
        )
        await db_session.commit()
        assert len(body["events"]) == 1
        nearest = body["events"][0]["subway_proximity"]["nearest_stop"]
        assert nearest["id"] == "TIE-A"

    async def test_subway_composes_with_facets_totals_and_stable_pagination(
        self, client, db_session
    ):
        station = await self._station(db_session, "A")
        template = load_fixture("snapshot_a.json")[0]
        rows = [
            dict(
                template,
                guid=guid,
                title=guid,
                categories="Fitness",
                registration_description="Registration required.",
                registration_url="https://example.test/register",
                startdate="08/08/2026",
                enddate="08/08/2026",
                starttime="2026-08-08 08:00:00",
                endtime="2026-08-08 09:00:00",
                coordinates=f"{station.latitude},{station.longitude}",
            )
            for guid in ("page-3", "page-1", "page-2")
        ]
        await ingest_rows(db_session, rows)
        params = {
            "subway_line": "A",
            "category": "fitness",
            "registration": "required",
            "date_from": "2026-08-08",
            "date_to": "2026-08-08",
            "page_size": 2,
        }

        first = await client.get("/events", params={**params, "page": 1})
        second = await client.get("/events", params={**params, "page": 2})

        assert first.status_code == second.status_code == 200
        assert first.json()["total"] == second.json()["total"] == 3
        assert [event["guid"] for event in first.json()["events"]] == [
            "page-1",
            "page-2",
        ]
        assert [event["guid"] for event in second.json()["events"]] == ["page-3"]
        assert first.json()["applied_facets"] == {
            "category": ["fitness"],
            "date_from": ["2026-08-08"],
            "date_to": ["2026-08-08"],
            "registration": ["required"],
            "subway_line": ["A"],
        }
