"""Issue #21 Interest, Match, preference, migration, and security gates."""

from __future__ import annotations

import asyncio
from uuid import UUID

import pytest
from sqlalchemy import func, select, text

from app.database import get_session_factory
from app.models.profile import (
    Interest,
    MatchedEvent,
    PreferenceAudit,
    Profile,
    SavedEvent,
)
from app.services.profile_preferences import (
    PreferenceConflictError,
    PreferenceValidationError,
    apply_concierge_preference,
    set_manual_interest,
)
from tests.conftest import ingest_rows, load_fixture, requires_docker

DEVICE_TOKEN = "device-token-21-abcdefghijklmnopqrstuvwxyz_123456"
OTHER_DEVICE_TOKEN = "other-device-21-abcdefghijklmnopqrstuvwxyz_12345"


def _headers(token: str = DEVICE_TOKEN) -> dict[str, str]:
    return {"X-Device-Token": token}


@requires_docker
async def test_follow_list_update_and_unfollow_are_idempotent_and_profile_owned(
    client, db_session
):
    followed = await client.put(
        "/profile/interests",
        headers=_headers(),
        json={
            "facet_type": "category",
            "facet_value": " Fitness ",
            "alert_enabled": False,
        },
    )
    repeated = await client.put(
        "/profile/interests",
        headers=_headers(),
        json={
            "facet_type": "category",
            "facet_value": "fitness",
            "alert_enabled": True,
        },
    )
    own_list = await client.get("/profile/interests", headers=_headers())
    other_list = await client.get(
        "/profile/interests", headers=_headers(OTHER_DEVICE_TOKEN)
    )

    assert followed.status_code == repeated.status_code == 200
    assert followed.json()["id"] == repeated.json()["id"]
    assert repeated.json() == {
        "id": repeated.json()["id"],
        "facet_type": "category",
        "facet_value": "fitness",
        "facets": [{"facet_type": "category", "facet_value": "fitness"}],
        "alert_enabled": True,
        "origin": "manual",
    }
    assert own_list.json()["total"] == 1
    assert own_list.json()["interests"] == [repeated.json()]
    assert other_list.json()["total"] == 0
    assert await db_session.scalar(select(func.count()).select_from(Interest)) == 1

    interest_id = repeated.json()["id"]
    other_delete = await client.delete(
        f"/profile/interests/{interest_id}", headers=_headers(OTHER_DEVICE_TOKEN)
    )
    assert other_delete.status_code == 204
    assert (await client.get("/profile/interests", headers=_headers())).json()[
        "total"
    ] == 1

    removed = await client.delete(
        f"/profile/interests/{interest_id}", headers=_headers()
    )
    repeated_remove = await client.delete(
        f"/profile/interests/{interest_id}", headers=_headers()
    )
    assert removed.status_code == repeated_remove.status_code == 204
    assert (await client.get("/profile/interests", headers=_headers())).json()[
        "total"
    ] == 0


@requires_docker
async def test_manual_and_concierge_paths_share_validation_and_uniqueness(
    client, db_session
):
    profile_response = await client.get("/profile", headers=_headers())
    profile = await db_session.get(Profile, UUID(profile_response.json()["id"]))
    assert profile is not None

    with pytest.raises(PreferenceValidationError, match="registration"):
        await set_manual_interest(
            db_session,
            profile_id=profile.id,
            facet_type="registration",
            facet_value="sometimes",
            alert_enabled=True,
        )
    with pytest.raises(PreferenceValidationError, match="registration"):
        await apply_concierge_preference(
            db_session,
            profile_id=profile.id,
            facet_type="registration",
            facet_value="sometimes",
            alert_enabled=True,
            decision="approved",
            idempotency_key="proposal-invalid-21",
        )

    manual = await set_manual_interest(
        db_session,
        profile_id=profile.id,
        facet_type="borough",
        facet_value="Queens",
        alert_enabled=False,
    )
    approved = await apply_concierge_preference(
        db_session,
        profile_id=profile.id,
        facet_type="BOROUGH",
        facet_value="queens",
        alert_enabled=True,
        decision="approved",
        idempotency_key="proposal-approved-21",
    )
    await db_session.commit()

    assert approved is not None
    assert approved.id == manual.id
    assert approved.origin == "concierge"
    assert approved.origin_idempotency_key == "proposal-approved-21"
    assert approved.alert_enabled is True
    assert await db_session.scalar(select(func.count()).select_from(Interest)) == 1


@requires_docker
async def test_concierge_rejection_is_write_free_and_approval_is_idempotent(
    client, db_session
):
    profile_response = await client.get("/profile", headers=_headers())
    profile = await db_session.get(Profile, UUID(profile_response.json()["id"]))
    assert profile is not None

    for decision in ("rejected", "unapproved"):
        assert (
            await apply_concierge_preference(
                db_session,
                profile_id=profile.id,
                facet_type="category",
                facet_value="Fitness",
                alert_enabled=True,
                decision=decision,
                idempotency_key=f"proposal-{decision}-21",
            )
            is None
        )
    assert await db_session.scalar(select(func.count()).select_from(Interest)) == 0
    assert await db_session.scalar(select(func.count()).select_from(MatchedEvent)) == 0
    assert await db_session.scalar(select(func.count()).select_from(SavedEvent)) == 0
    assert (
        await db_session.scalar(select(func.count()).select_from(PreferenceAudit)) == 0
    )

    first = await apply_concierge_preference(
        db_session,
        profile_id=profile.id,
        facet_type="category",
        facet_value="Fitness",
        alert_enabled=True,
        decision="approved",
        idempotency_key="proposal-idempotent-21",
    )
    repeated = await apply_concierge_preference(
        db_session,
        profile_id=profile.id,
        facet_type="category",
        facet_value="Fitness",
        alert_enabled=True,
        decision="approved",
        idempotency_key="proposal-idempotent-21",
    )
    await db_session.commit()

    assert first is not None and repeated is not None
    assert first.id == repeated.id
    assert await db_session.scalar(select(func.count()).select_from(Interest)) == 1
    assert (
        await db_session.scalar(select(func.count()).select_from(PreferenceAudit)) == 1
    )

    with pytest.raises(PreferenceConflictError, match="another preference"):
        await apply_concierge_preference(
            db_session,
            profile_id=profile.id,
            facet_type="category",
            facet_value="Sports",
            alert_enabled=True,
            decision="edited",
            idempotency_key="proposal-idempotent-21",
        )

    other_response = await client.get("/profile", headers=_headers(OTHER_DEVICE_TOKEN))
    other_profile = await db_session.get(Profile, UUID(other_response.json()["id"]))
    assert other_profile is not None
    with pytest.raises(PreferenceConflictError, match="another preference"):
        await apply_concierge_preference(
            db_session,
            profile_id=other_profile.id,
            facet_type="category",
            facet_value="Fitness",
            alert_enabled=True,
            decision="approved",
            idempotency_key="proposal-idempotent-21",
        )


@requires_docker
async def test_concurrent_concierge_approval_executes_once(client, db_session):
    profile_response = await client.get("/profile", headers=_headers())
    profile_id = UUID(profile_response.json()["id"])

    async def approve_once() -> UUID:
        session_factory = get_session_factory()
        async with session_factory() as session:
            interest = await apply_concierge_preference(
                session,
                profile_id=profile_id,
                facet_type="category",
                facet_value="Fitness",
                alert_enabled=True,
                decision="approved",
                idempotency_key="proposal-concurrent-21",
            )
            assert interest is not None
            interest_id = interest.id
            await session.commit()
            return interest_id

    interest_ids = await asyncio.gather(approve_once(), approve_once())

    assert interest_ids[0] == interest_ids[1]
    assert await db_session.scalar(select(func.count()).select_from(Interest)) == 1
    assert (
        await db_session.scalar(select(func.count()).select_from(PreferenceAudit)) == 1
    )


@requires_docker
@pytest.mark.parametrize(
    ("facet_type", "facet_value", "expected_indexes"),
    [
        ("borough", "Manhattan", {0}),
        ("category", "Running/Jogging", {2}),
        ("registration", "closed", {1}),
        ("registration", "not_listed", {0}),
    ],
)
async def test_each_supported_interest_facet_matches_only_qualifying_new_events(
    client, db_session, facet_type, facet_value, expected_indexes
):
    rows = load_fixture("snapshot_a.json")
    followed = await client.put(
        "/profile/interests",
        headers=_headers(),
        json={"facet_type": facet_type, "facet_value": facet_value},
    )
    assert followed.status_code == 200

    await ingest_rows(db_session, rows)

    matches = await client.get("/profile/matches", headers=_headers())
    assert {event["guid"] for event in matches.json()["events"]} == {
        rows[index]["guid"] for index in expected_indexes
    }


@requires_docker
async def test_new_events_generate_matches_separate_from_saved_and_support_actions(
    client, db_session
):
    rows = load_fixture("snapshot_a.json")
    for category in ("Fitness", "Running/Jogging"):
        response = await client.put(
            "/profile/interests",
            headers=_headers(),
            json={"facet_type": "category", "facet_value": category},
        )
        assert response.status_code == 200

    await ingest_rows(db_session, rows)
    matches = await client.get("/profile/matches", headers=_headers())
    saved = await client.get("/profile/saved", headers=_headers())

    assert matches.status_code == saved.status_code == 200
    assert {event["guid"] for event in matches.json()["events"]} == {
        rows[0]["guid"],
        rows[2]["guid"],
    }
    assert saved.json()["total"] == 0
    assert await db_session.scalar(select(func.count()).select_from(MatchedEvent)) == 2
    assert await db_session.scalar(select(func.count()).select_from(SavedEvent)) == 0

    other_promote = await client.put(
        f"/profile/matches/{rows[0]['guid']}/saved",
        headers=_headers(OTHER_DEVICE_TOKEN),
    )
    assert other_promote.status_code == 404

    promoted = await client.put(
        f"/profile/matches/{rows[0]['guid']}/saved", headers=_headers()
    )
    repeated_promote = await client.put(
        f"/profile/matches/{rows[0]['guid']}/saved", headers=_headers()
    )
    dismissed = await client.delete(
        f"/profile/matches/{rows[2]['guid']}", headers=_headers()
    )
    repeated_dismiss = await client.delete(
        f"/profile/matches/{rows[2]['guid']}", headers=_headers()
    )

    assert promoted.status_code == repeated_promote.status_code == 200
    assert promoted.json()["saved"] is True
    assert dismissed.status_code == repeated_dismiss.status_code == 204
    assert (await client.get("/profile/matches", headers=_headers())).json()[
        "total"
    ] == 0
    saved_after = await client.get("/profile/saved", headers=_headers())
    assert [event["guid"] for event in saved_after.json()["events"]] == [
        rows[0]["guid"]
    ]
    statuses = set((await db_session.scalars(select(MatchedEvent.status))).all())
    assert statuses == {"promoted", "dismissed"}


@requires_docker
async def test_match_generation_uses_only_each_sync_runs_new_event_set(
    client, db_session
):
    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, [rows[0]])
    assert (
        await client.put(
            "/profile/interests",
            headers=_headers(),
            json={"facet_type": "category", "facet_value": "Fitness"},
        )
    ).status_code == 200

    new_matching = dict(
        rows[2],
        guid="issue-21-new-event",
        title="New matching Event",
        categories="Fitness",
    )
    await ingest_rows(db_session, [rows[0], new_matching])

    matches = await client.get("/profile/matches", headers=_headers())
    assert [event["guid"] for event in matches.json()["events"]] == [
        new_matching["guid"]
    ]


@requires_docker
async def test_interest_api_rejects_unsupported_and_unsafe_facets(client, db_session):
    unsupported_type = await client.put(
        "/profile/interests",
        headers=_headers(),
        json={"facet_type": "date_from", "facet_value": "2026-08-16"},
    )
    unsupported_value = await client.put(
        "/profile/interests",
        headers=_headers(),
        json={"facet_type": "registration", "facet_value": "maybe"},
    )
    control_character = await client.put(
        "/profile/interests",
        headers=_headers(),
        json={"facet_type": "category", "facet_value": "Fitness\nInjected"},
    )
    composite = await client.put(
        "/profile/interests",
        headers=_headers(),
        json={
            "facet_type": "category",
            "facet_value": "Fitness",
            "facets": [{"facet_type": "borough", "facet_value": "Queens"}],
        },
    )

    assert (
        unsupported_type.status_code
        == unsupported_value.status_code
        == control_character.status_code
        == composite.status_code
        == 422
    )
    assert await db_session.scalar(select(func.count()).select_from(Interest)) == 0


@requires_docker
async def test_issue_21_schema_and_migration_contract_are_fail_closed(
    client, db_session
):
    schema = (await client.get("/openapi.json")).json()
    paths = schema["paths"]
    assert {"get", "put"} <= set(paths["/profile/interests"])
    assert {"delete"} <= set(paths["/profile/interests/{interest_id}"])
    assert {"get"} <= set(paths["/profile/matches"])
    assert {"delete"} <= set(paths["/profile/matches/{guid}"])
    assert {"put"} <= set(paths["/profile/matches/{guid}/saved"])

    columns = (
        await db_session.execute(
            text(
                "SELECT table_name, column_name FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name IN "
                "('interests', 'matched_events', 'preference_audits') "
                "ORDER BY table_name, column_name"
            )
        )
    ).all()
    by_table: dict[str, set[str]] = {}
    for table_name, column_name in columns:
        by_table.setdefault(table_name, set()).add(column_name)
    assert by_table["interests"] >= {
        "profile_id",
        "facet_type",
        "normalized_value",
        "alert_enabled",
        "origin",
        "origin_idempotency_key",
    }
    assert by_table["matched_events"] >= {"profile_id", "event_guid", "status"}
    assert by_table["preference_audits"] == {
        "alert_enabled",
        "created_at",
        "facet_type",
        "id",
        "idempotency_key",
        "interest_id",
        "normalized_value",
        "origin",
        "outcome",
        "profile_id",
    }
    serialized = str(schema).casefold()
    assert "raw_chat" not in serialized
    assert "model_context" not in serialized
    assert "device_token_hash" not in serialized
