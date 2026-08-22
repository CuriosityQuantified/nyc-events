#!/usr/bin/env python3
"""Build the committed subway dataset from one verified MTA GTFS archive."""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import io
import json
from collections import defaultdict
from pathlib import Path
from typing import Any
from zipfile import ZipFile

EXPECTED_ARCHIVE_SHA256 = (
    "056d1fc821f26e859c41ffb227197bdd45dbf4a0c3ef41b3509a5ff6dda4602e"
)
SOURCE = {
    "id": "mta-nyct-subway-gtfs",
    "attribution": "Metropolitan Transportation Authority (MTA)",
    "publisher": "MTA New York City Transit",
    "source_url": "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip",
    "developer_url": "https://www.mta.info/developers",
    "last_updated": "2026-08-07T12:10:36+00:00",
    "feed_version": "20260807-H-rockaways-extension-removed",
    "feed_start_date": "2026-05-26",
    "feed_end_date": "2026-10-31",
    "archive_sha256": EXPECTED_ARCHIVE_SHA256,
}
SOURCE_FILES = ("routes.txt", "stops.txt", "trips.txt", "stop_times.txt", "shapes.txt")


def _rows(archive: ZipFile, name: str) -> list[dict[str, str]]:
    with archive.open(name) as raw:
        return list(
            csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8-sig", newline=""))
        )


def build_dataset(archive_path: Path) -> dict[str, Any]:
    """Transform the pinned GTFS archive into canonical JSON-compatible data."""
    archive_bytes = archive_path.read_bytes()
    actual_hash = hashlib.sha256(archive_bytes).hexdigest()
    if actual_hash != EXPECTED_ARCHIVE_SHA256:
        raise ValueError(f"unexpected GTFS archive SHA-256: {actual_hash}")

    with ZipFile(io.BytesIO(archive_bytes)) as archive:
        routes = _rows(archive, "routes.txt")
        stops = _rows(archive, "stops.txt")
        trips = _rows(archive, "trips.txt")
        stop_times = _rows(archive, "stop_times.txt")
        shapes = _rows(archive, "shapes.txt")
        source_files = {
            name: hashlib.sha256(archive.read(name)).hexdigest()
            for name in SOURCE_FILES
        }

    trip_lookup = {
        trip["trip_id"]: (trip["route_id"], trip["shape_id"]) for trip in trips
    }
    route_stops = sorted(
        {
            (
                trip_lookup[row["trip_id"]][0],
                row["stop_id"],
                trip_lookup[row["trip_id"]][1],
            )
            for row in stop_times
        }
    )

    shape_points: dict[str, list[tuple[int, list[float]]]] = defaultdict(list)
    for point in shapes:
        shape_points[point["shape_id"]].append(
            (
                int(point["shape_pt_sequence"]),
                [float(point["shape_pt_lon"]), float(point["shape_pt_lat"])],
            )
        )
    route_shapes: dict[str, set[str]] = defaultdict(set)
    for trip in trips:
        route_shapes[trip["route_id"]].add(trip["shape_id"])

    transformed_routes = []
    for route in sorted(routes, key=lambda value: value["route_id"]):
        shape_ids = sorted(route_shapes[route["route_id"]])
        transformed_routes.append(
            {
                "route_id": route["route_id"],
                "route_short_name": route["route_short_name"],
                "route_long_name": route["route_long_name"],
                "route_desc": route["route_desc"],
                "route_url": route["route_url"],
                "route_color": route["route_color"],
                "route_text_color": route["route_text_color"],
                "geometry": {
                    "type": "Feature",
                    "properties": {"branch_ids": shape_ids},
                    "geometry": {
                        "type": "MultiLineString",
                        "coordinates": [
                            [
                                coordinate
                                for _, coordinate in sorted(shape_points[shape_id])
                            ]
                            for shape_id in shape_ids
                        ],
                    },
                },
            }
        )

    transformed_stops = [
        {
            "stop_id": stop["stop_id"],
            "name": stop["stop_name"],
            "latitude": float(stop["stop_lat"]),
            "longitude": float(stop["stop_lon"]),
            "location_type": int(stop["location_type"] or 0),
            "parent_station": stop["parent_station"] or None,
        }
        for stop in sorted(stops, key=lambda value: value["stop_id"])
    ]
    return {
        "source": {**SOURCE, "source_file_sha256": source_files},
        "routes": transformed_routes,
        "stops": transformed_stops,
        "route_stops": [
            {"route_id": route_id, "stop_id": stop_id, "branch_id": branch_id}
            for route_id, stop_id, branch_id in route_stops
        ],
    }


def write_dataset(dataset: dict[str, Any], output_path: Path) -> None:
    """Write byte-reproducible sorted JSON in gzip format."""
    payload = json.dumps(
        dataset,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with (
        output_path.open("wb") as raw,
        gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0) as compressed,
    ):
        compressed.write(payload)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path, help="Pinned gtfs_subway.zip input")
    parser.add_argument("output", type=Path, help="Output .json.gz path")
    args = parser.parse_args()
    write_dataset(build_dataset(args.archive), args.output)


if __name__ == "__main__":
    main()
