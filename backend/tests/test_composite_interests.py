"""Combined-Facet Interests: AND matching, validation, and the API contract."""

from __future__ import annotations

import copy
from uuid import uuid4

import pytest

from app.models.event import CurrentEvent
from app.models.profile import Interest
from app.services.profile_preferences import (
    PreferenceValidationError,
    _event_matches_interest,
    set_manual_composite_interest,
)
from tests.conftest import ingest_rows, load_fixture, requires_docker

DEVICE_TOKEN = "device-token-composite-abcdefghijklmnopqrstuvwxyz1"


def _headers() -> dict[str, str]:
    return {"X-Device-Token": DEVICE_TOKEN}


def _event(**overrides) -> CurrentEvent:
    values = {
        "guid": "guid-1",
        "borough": "Brooklyn",
        "categories": ["Best for Kids", "Sports"],
        "registration_status": None,
    }
    values.update(overrides)
    return CurrentEvent(**values)


def _composite(facets: list[dict[str, str]]) -> Interest:
    return Interest(
        id=uuid4(),
        profile_id=uuid4(),
        facet_type="composite",
        facet_value=" + ".join(member["facet_value"] for member in facets),
        normalized_value="canonical",
        alert_enabled=True,
        origin="manual",
        facets=facets,
    )


def test_composite_interest_matches_only_when_every_facet_matches():
    interest = _composite(
        [
            {
                "facet_type": "borough",
                "facet_value": "Brooklyn",
                "normalized_value": "brooklyn",
            },
            {
                "facet_type": "category",
                "facet_value": "Best for Kids",
                "normalized_value": "best for kids",
            },
        ]
    )
    assert _event_matches_interest(_event(), interest) is True
    assert (
        _event_matches_interest(_event(categories=["Fitness"]), interest) is False
    )
    assert _event_matches_interest(_event(borough="Queens"), interest) is False
    assert _event_matches_interest(_event(borough=None), interest) is False


def test_single_facet_interest_still_matches_without_facets_payload():
    interest = Interest(
        id=uuid4(),
        profile_id=uuid4(),
        facet_type="borough",
        facet_value="Brooklyn",
        normalized_value="brooklyn",
        alert_enabled=True,
        origin="manual",
        facets=None,
    )
    assert _event_matches_interest(_event(), interest) is True
    assert _event_matches_interest(_event(borough="Queens"), interest) is False


async def test_composite_validation_rejects_bad_combinations():
    with pytest.raises(PreferenceValidationError, match="2 or 3 Facets"):
        await set_manual_composite_interest(
            None,
            profile_id=uuid4(),
            facets=[("borough", "Brooklyn")],
            alert_enabled=True,
        )
    with pytest.raises(PreferenceValidationError, match="at most once"):
        await set_manual_composite_interest(
            None,
            profile_id=uuid4(),
            facets=[("category", "Fitness"), ("category", "Nature")],
            alert_enabled=True,
        )
    with pytest.raises(PreferenceValidationError, match="Unsupported Facet type"):
        await set_manual_composite_interest(
            None,
            profile_id=uuid4(),
            facets=[("borough", "Brooklyn"), ("season", "Summer")],
            alert_enabled=True,
        )


@requires_docker
async def test_composite_follow_persists_and_matches_with_and_semantics(
    client, db_session
):
    followed = await client.put(
        "/profile/interests",
        headers=_headers(),
        json={
            "facets": [
                {"facet_type": "borough", "facet_value": "Brooklyn"},
                {"facet_type": "category", "facet_value": "Best for Kids"},
            ],
        },
    )
    assert followed.status_code == 200
    contract = followed.json()
    assert contract["facet_type"] == "composite"
    assert contract["facets"] == [
        {"facet_type": "borough", "facet_value": "Brooklyn"},
        {"facet_type": "category", "facet_value": "Best for Kids"},
    ]

    # Following the same combination again (any member order) is idempotent.
    repeated = await client.put(
        "/profile/interests",
        headers=_headers(),
        json={
            "facets": [
                {"facet_type": "category", "facet_value": "Best for Kids"},
                {"facet_type": "borough", "facet_value": "Brooklyn"},
            ],
        },
    )
    assert repeated.status_code == 200
    assert repeated.json()["id"] == contract["id"]

    listed = await client.get("/profile/interests", headers=_headers())
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["interests"][0]["facets"] == contract["facets"]

    # Three crafted rows: only the Brooklyn kids event satisfies BOTH facets.
    template = load_fixture("snapshot_a.json")[1]
    both = copy.deepcopy(template)
    both["guid"] = "composite-both"
    both["parkids"] = "B901"
    both["categories"] = "Best for Kids | Sports"
    borough_only = copy.deepcopy(template)
    borough_only["guid"] = "composite-borough-only"
    borough_only["parkids"] = "B902"
    borough_only["categories"] = "Fitness"
    category_only = copy.deepcopy(template)
    category_only["guid"] = "composite-category-only"
    category_only["parkids"] = "Q903"
    category_only["categories"] = "Best for Kids"

    await ingest_rows(db_session, [both, borough_only, category_only])

    matches = await client.get("/profile/matches", headers=_headers())
    assert matches.status_code == 200
    assert {event["guid"] for event in matches.json()["events"]} == {
        "composite-both"
    }


@requires_docker
async def test_interest_request_requires_single_facet_or_combination(client):
    empty = await client.put(
        "/profile/interests", headers=_headers(), json={"alert_enabled": True}
    )
    assert empty.status_code == 422

    too_few = await client.put(
        "/profile/interests",
        headers=_headers(),
        json={"facets": [{"facet_type": "borough", "facet_value": "Brooklyn"}]},
    )
    assert too_few.status_code == 422
