#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["jsonschema==4.25.1", "openapi-spec-validator==0.7.2"]
# ///
"""Validate golden responses against the shared OpenAPI contract."""

from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from jsonschema import Draft202012Validator, FormatChecker
from openapi_spec_validator import validate_spec  # type: ignore[import-not-found]
from vocabulary import walk_keys

ROOT = Path(__file__).resolve().parent
SPEC_PATH = ROOT / "openapi.json"
CSV_PATHS = tuple(ROOT.parent.glob("NYC_Parks_Public_Events_*.csv"))
REQUIRED_PATHS = {"/events", "/events/{guid}", "/freshness"}
REQUIRED_FACETS = {"borough", "category", "registration", "location", "subway_line"}

CSV_FACT_COLUMNS = {
    "title": "title",
    "description": "description",
    "official_event_url": "link",
    "location_id": "parkids",
    "location_name": "location",
    "registration_description": "registration_description",
    "categories": "categories",
    "coordinates": "coordinates",
}
STATED_TEXT_FACTS = (
    "title",
    "description",
    "official_event_url",
    "location_id",
    "location_name",
)


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def reject_nonlocal_refs(value: Any) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key == "$ref" and (
                not isinstance(child, str) or not child.startswith("#/")
            ):
                raise ValueError(
                    f"only local OpenAPI references are allowed: {child!r}"
                )
            reject_nonlocal_refs(child)
    elif isinstance(value, list):
        for child in value:
            reject_nonlocal_refs(child)


def response_schema_ref(operation: dict[str, Any]) -> str:
    return operation["responses"]["200"]["content"]["application/json"]["schema"][
        "$ref"
    ]


def validate_operation(
    spec: dict[str, Any], route: str, operation: dict[str, Any]
) -> Path:
    relative = Path(operation["x-golden-response"])
    golden_path = (ROOT / relative).resolve()
    if ROOT.resolve() not in golden_path.parents:
        raise ValueError(f"golden response escapes contracts/: {relative}")
    if not golden_path.is_file():
        raise FileNotFoundError(f"missing golden response for {route}: {relative}")

    root_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$ref": response_schema_ref(operation),
        "components": spec["components"],
    }
    Draft202012Validator(root_schema, format_checker=FormatChecker()).validate(
        load_json(golden_path)
    )
    return golden_path



BOROUGHS = {
    "M": "Manhattan",
    "B": "Brooklyn",
    "Q": "Queens",
    "R": "Staten Island",
    "X": "Bronx",
}


def derived_registration(row: dict[str, str]) -> tuple[str | None, str]:
    description = row["registration_description"].strip()
    lowered = description.casefold()
    if "closed" in lowered:
        return "closed", "Derived"
    if "not required" in lowered:
        return "not_required", "Derived"
    if row["registration_url"].strip() or "required" in lowered:
        return "required", "Derived"
    return None, "Not listed"


def parsed_coordinates(raw: str) -> list[dict[str, float]]:
    coordinates = []
    for pair in raw.split(";"):
        latitude, longitude = pair.split(",", 1)
        coordinates.append(
            {"latitude": float(latitude.strip()), "longitude": float(longitude.strip())}
        )
    return coordinates


def local_iso(raw: str) -> str:
    parsed = datetime.strptime(raw, "%Y-%m-%d %H:%M:%S").replace(
        tzinfo=ZoneInfo("America/New_York")
    )
    return parsed.isoformat()


def verify_csv_reference(events: list[dict[str, Any]]) -> None:
    if len(CSV_PATHS) != 1:
        raise ValueError(
            f"expected one committed NYC Parks CSV reference, found {len(CSV_PATHS)}"
        )
    with CSV_PATHS[0].open(encoding="utf-8-sig", newline="") as handle:
        rows = {row["guid"]: row for row in csv.DictReader(handle)}

    for event in events:
        row = rows.get(event["guid"])
        if row is None:
            raise ValueError(
                f"golden Event guid is absent from CSV reference: {event['guid']}"
            )
        for fact_name, csv_name in CSV_FACT_COLUMNS.items():
            raw = event[fact_name].get("raw")
            expected = row[csv_name] or None
            if raw != expected:
                raise ValueError(
                    f"{event['guid']} {fact_name}.raw does not match CSV {csv_name}: {raw!r} != {expected!r}"
                )

        for fact_name in STATED_TEXT_FACTS:
            if event[fact_name]["value"] != event[fact_name]["raw"]:
                raise ValueError(
                    f"{event['guid']} {fact_name}.value drifted from its Stated raw source text"
                )

        expected_categories = [
            category.strip()
            for category in row["categories"].split("|")
            if category.strip()
        ]
        if event["categories"]["value"] != expected_categories:
            raise ValueError(
                f"{event['guid']} categories.value drifted from the CSV reference"
            )
        if event["coordinates"]["value"] != parsed_coordinates(row["coordinates"]):
            raise ValueError(
                f"{event['guid']} coordinates.value drifted from the CSV reference"
            )

        expected_derived = {
            "start_date": datetime.strptime(row["startdate"], "%m/%d/%Y")
            .date()
            .isoformat(),
            "end_date": datetime.strptime(row["enddate"], "%m/%d/%Y")
            .date()
            .isoformat(),
            "start_datetime": local_iso(row["starttime"]),
            "end_datetime": local_iso(row["endtime"]),
            "borough": BOROUGHS[row["parkids"][0]],
        }
        for fact_name, expected in expected_derived.items():
            if (
                event[fact_name]["value"] != expected
                or event[fact_name]["provenance"] != "Derived"
            ):
                raise ValueError(
                    f"{event['guid']} {fact_name} is not the expected Derived value"
                )

        registration_value, registration_provenance = derived_registration(row)
        registration = event["registration_status"]
        if (registration["value"], registration["provenance"]) != (
            registration_value,
            registration_provenance,
        ):
            raise ValueError(
                f"{event['guid']} registration_status drifted from source registration text"
            )
        if event["registration_description"]["value"] != (
            row["registration_description"] or None
        ):
            raise ValueError(
                f"{event['guid']} registration_description.value drifted from the CSV reference"
            )

    freshness = load_json(ROOT / "golden/freshness.json")
    if freshness["snapshot_row_count"]["value"] != len(rows):
        raise ValueError(
            "freshness snapshot_row_count does not match the committed CSV reference"
        )


def main() -> None:
    spec = load_json(SPEC_PATH)
    reject_nonlocal_refs(spec)
    validate_spec(spec)
    if spec.get("openapi") != "3.1.0":
        raise ValueError("openapi.json must use OpenAPI 3.1.0")
    if set(spec["paths"]) != REQUIRED_PATHS:
        raise ValueError(f"required API surface drifted: {set(spec['paths'])!r}")

    list_parameters = {
        parameter.get("name")
        for parameter in spec["paths"]["/events"]["get"]["parameters"]
        if "name" in parameter
    }
    referenced_parameters = {
        spec["components"]["parameters"][parameter["$ref"].rsplit("/", 1)[-1]]["name"]
        for parameter in spec["paths"]["/events"]["get"]["parameters"]
        if "$ref" in parameter
    }
    if not REQUIRED_FACETS <= list_parameters | referenced_parameters:
        raise ValueError(
            "Event listing is missing one or more required Facet parameters"
        )

    golden_paths: list[Path] = []
    for route, path_item in spec["paths"].items():
        golden_paths.append(validate_operation(spec, route, path_item["get"]))

    payloads = [load_json(path) for path in golden_paths]
    walk_keys(spec)
    for payload in payloads:
        walk_keys(payload)

    list_payload = load_json(ROOT / "golden/events-list.json")
    detail_payload = load_json(ROOT / "golden/event-detail.json")
    if list_payload["events"][0] != detail_payload:
        raise ValueError("detail golden drifted from the matching Event in list golden")
    verify_csv_reference(list_payload["events"])

    provenance_values: set[str] = set()

    def collect(value: Any) -> None:
        if isinstance(value, dict):
            if "provenance" in value:
                provenance_values.add(value["provenance"])
            for child in value.values():
                collect(child)
        elif isinstance(value, list):
            for child in value:
                collect(child)

    for payload in payloads:
        collect(payload)
    expected = {"Stated", "Derived", "Not listed"}
    if provenance_values != expected:
        raise ValueError(
            f"goldens must demonstrate all provenance states: {provenance_values!r}"
        )

    print(
        f"validated {len(golden_paths)} golden responses against OpenAPI; CSV reference and vocabulary checks passed"
    )


if __name__ == "__main__":
    main()
