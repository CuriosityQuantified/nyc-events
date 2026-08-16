"""Contract tests — validate API responses against the OpenAPI schema."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker

from tests.conftest import ingest_rows, load_fixture, requires_docker

CONTRACTS_DIR = Path(__file__).resolve().parent.parent.parent / "contracts"
SPEC_PATH = CONTRACTS_DIR / "openapi.json"


def _load_spec() -> dict[str, Any]:
    """Load the OpenAPI spec."""
    with SPEC_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def _build_validator(schema_ref: str) -> Draft202012Validator:
    """Build a JSON Schema validator for a given $ref in the OpenAPI spec."""
    spec = _load_spec()
    root_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$ref": schema_ref,
        "components": spec["components"],
    }
    return Draft202012Validator(root_schema, format_checker=FormatChecker())


@requires_docker
class TestContractValidation:
    """Validate real API responses against the OpenAPI contract schema."""

    async def test_events_response_validates_against_openapi_schema(
        self, client, db_session
    ):
        """GET /events response must validate against EventListResponse."""
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        resp = await client.get("/events")
        assert resp.status_code == 200
        body = resp.json()

        validator = _build_validator("#/components/schemas/EventListResponse")
        # This raises if the response does not match the schema.
        validator.validate(body)

    async def test_event_detail_validates_against_openapi_schema(
        self, client, db_session
    ):
        """GET /events/{guid} response must validate against Event."""
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        resp = await client.get("/events/2,146,733")
        assert resp.status_code == 200
        body = resp.json()

        validator = _build_validator("#/components/schemas/Event")
        validator.validate(body)

    async def test_event_with_registration_validates(self, client, db_session):
        """An event with registration_status=closed must still validate."""
        await ingest_rows(db_session, load_fixture("snapshot_a.json"))
        resp = await client.get("/events/2,181,767")
        assert resp.status_code == 200
        body = resp.json()

        validator = _build_validator("#/components/schemas/Event")
        validator.validate(body)
