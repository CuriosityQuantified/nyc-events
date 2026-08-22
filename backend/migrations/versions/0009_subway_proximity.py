"""Import canonical MTA subway routes, stops, branches, and Event locations.

Revision ID: 0009
Revises: 0008
Create Date: 2026-08-22
"""

from __future__ import annotations

import gzip
import json
from collections.abc import Sequence
from datetime import datetime
from pathlib import Path
from typing import Any

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_DATASET = (
    Path(__file__).resolve().parents[2]
    / "app"
    / "data"
    / "mta_subway_gtfs_2026-08-07.json.gz"
)


def _load_dataset() -> dict[str, Any]:
    with gzip.open(_DATASET, "rt", encoding="utf-8") as stream:
        dataset = json.load(stream)
    if (len(dataset["routes"]), len(dataset["stops"]), len(dataset["route_stops"])) != (
        29,
        1488,
        7361,
    ):
        raise ValueError("canonical MTA subway dataset counts changed")
    stop_ids = {stop["stop_id"] for stop in dataset["stops"]}
    if any(
        stop["parent_station"] not in stop_ids
        for stop in dataset["stops"]
        if stop["parent_station"] is not None
    ):
        raise ValueError("canonical MTA subway dataset has an unknown parent station")
    if any(
        route["geometry"].get("type") != "Feature"
        or route["geometry"].get("geometry", {}).get("type") != "MultiLineString"
        for route in dataset["routes"]
    ):
        raise ValueError("canonical MTA subway route geometry is not GeoJSON")
    return dataset


def upgrade() -> None:
    op.create_table(
        "subway_sources",
        sa.Column("source_id", sa.String(), primary_key=True),
        sa.Column("attribution", sa.String(), nullable=False),
        sa.Column("publisher", sa.String(), nullable=False),
        sa.Column("source_url", sa.String(), nullable=False),
        sa.Column("developer_url", sa.String(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("feed_version", sa.String(), nullable=False),
        sa.Column("feed_start_date", sa.String(10), nullable=False),
        sa.Column("feed_end_date", sa.String(10), nullable=False),
        sa.Column("archive_sha256", sa.String(64), nullable=False),
    )
    op.create_table(
        "subway_routes",
        sa.Column("route_id", sa.String(), primary_key=True),
        sa.Column(
            "source_id",
            sa.String(),
            sa.ForeignKey("subway_sources.source_id"),
            nullable=False,
        ),
        sa.Column("short_name", sa.String(), nullable=False),
        sa.Column("long_name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("route_url", sa.String(), nullable=False),
        sa.Column("color", sa.String(6), nullable=False),
        sa.Column("text_color", sa.String(6), nullable=False),
        sa.Column("geometry", JSONB(), nullable=False),
    )
    op.create_table(
        "subway_stops",
        sa.Column("stop_id", sa.String(), primary_key=True),
        sa.Column(
            "source_id",
            sa.String(),
            sa.ForeignKey("subway_sources.source_id"),
            nullable=False,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("location_type", sa.Integer(), nullable=False),
        sa.Column("parent_station", sa.String(), sa.ForeignKey("subway_stops.stop_id")),
        sa.CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_subway_stop_lat"),
        sa.CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_subway_stop_lon"),
    )
    op.create_index(
        "ix_subway_stops_coordinates",
        "subway_stops",
        ["latitude", "longitude"],
    )
    op.create_table(
        "subway_route_stops",
        sa.Column(
            "route_id",
            sa.String(),
            sa.ForeignKey("subway_routes.route_id"),
            primary_key=True,
        ),
        sa.Column(
            "stop_id",
            sa.String(),
            sa.ForeignKey("subway_stops.stop_id"),
            primary_key=True,
        ),
        sa.Column("branch_id", sa.String(), primary_key=True),
    )
    op.create_index(
        "ix_subway_route_stops_route_stop",
        "subway_route_stops",
        ["route_id", "stop_id"],
    )
    op.create_table(
        "current_event_locations",
        sa.Column(
            "event_guid",
            sa.String(),
            sa.ForeignKey("current_events.guid", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("ordinal", sa.Integer(), primary_key=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_event_location_lat"),
        sa.CheckConstraint(
            "longitude BETWEEN -180 AND 180", name="ck_event_location_lon"
        ),
        sa.CheckConstraint(
            "latitude <> 0 OR longitude <> 0", name="ck_event_location_not_null_island"
        ),
        sa.UniqueConstraint(
            "event_guid",
            "latitude",
            "longitude",
            name="uq_current_event_location_coordinates",
        ),
    )
    op.create_index(
        "ix_current_event_locations_coordinates",
        "current_event_locations",
        ["latitude", "longitude"],
    )

    dataset = _load_dataset()
    source = dict(dataset["source"])
    source.pop("source_file_sha256")
    source["source_id"] = source.pop("id")
    source["updated_at"] = datetime.fromisoformat(source.pop("last_updated"))
    op.bulk_insert(
        sa.table("subway_sources", *[sa.column(key) for key in source]), [source]
    )
    routes = [
        {
            "route_id": route["route_id"],
            "source_id": source["source_id"],
            "short_name": route["route_short_name"],
            "long_name": route["route_long_name"],
            "description": route["route_desc"],
            "route_url": route["route_url"],
            "color": route["route_color"],
            "text_color": route["route_text_color"],
            "geometry": route["geometry"],
        }
        for route in dataset["routes"]
    ]
    route_table = sa.table(
        "subway_routes",
        sa.column("route_id"),
        sa.column("source_id"),
        sa.column("short_name"),
        sa.column("long_name"),
        sa.column("description"),
        sa.column("route_url"),
        sa.column("color"),
        sa.column("text_color"),
        sa.column("geometry", JSONB()),
    )
    op.bulk_insert(route_table, routes)
    stops = [dict(stop, source_id=source["source_id"]) for stop in dataset["stops"]]
    op.bulk_insert(
        sa.table("subway_stops", *[sa.column(key) for key in stops[0]]), stops
    )
    route_stops = dataset["route_stops"]
    route_stop_table = sa.table(
        "subway_route_stops",
        sa.column("route_id"),
        sa.column("stop_id"),
        sa.column("branch_id"),
    )
    for offset in range(0, len(route_stops), 1000):
        op.bulk_insert(route_stop_table, route_stops[offset : offset + 1000])

    op.execute(
        r"""
        WITH split_locations AS (
            SELECT event.guid AS event_guid,
                   pair.ordinality::integer AS ordinal,
                   btrim(pair.value) AS coordinate
            FROM current_events AS event
            CROSS JOIN LATERAL regexp_split_to_table(
                coalesce(event.raw_data ->> 'coordinates', ''), ';'
            ) WITH ORDINALITY AS pair(value, ordinality)
        ), valid_locations AS (
            SELECT event_guid,
                   ordinal,
                   split_part(coordinate, ',', 1)::double precision AS latitude,
                   split_part(coordinate, ',', 2)::double precision AS longitude
            FROM split_locations
            WHERE coordinate ~ (
                '^\s*[+-]?(\d+(\.\d*)?|\.\d+)\s*,' ||
                '\s*[+-]?(\d+(\.\d*)?|\.\d+)\s*$'
            )
        ), unique_locations AS (
            SELECT event_guid, min(ordinal) AS ordinal, latitude, longitude
            FROM valid_locations
            WHERE latitude BETWEEN -90 AND 90
              AND longitude BETWEEN -180 AND 180
              AND (latitude <> 0 OR longitude <> 0)
            GROUP BY event_guid, latitude, longitude
        )
        INSERT INTO current_event_locations(event_guid, ordinal, latitude, longitude)
        SELECT event_guid, ordinal, latitude, longitude FROM unique_locations
        """
    )


def downgrade() -> None:
    op.drop_index(
        "ix_current_event_locations_coordinates",
        table_name="current_event_locations",
    )
    op.drop_table("current_event_locations")
    op.drop_index("ix_subway_route_stops_route_stop", table_name="subway_route_stops")
    op.drop_table("subway_route_stops")
    op.drop_index("ix_subway_stops_coordinates", table_name="subway_stops")
    op.drop_table("subway_stops")
    op.drop_table("subway_routes")
    op.drop_table("subway_sources")
