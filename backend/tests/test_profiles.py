"""Issue #19 API, persistence, migration, and security gates."""

from __future__ import annotations

import asyncio
import hashlib
from uuid import UUID

from sqlalchemy import func, select, text

from app.models.profile import Profile, SavedEvent
from tests.conftest import ingest_rows, load_fixture, requires_docker

DEVICE_TOKEN = "device-token-19-abcdefghijklmnopqrstuvwxyz_123456"
OTHER_DEVICE_TOKEN = "other-device-19-abcdefghijklmnopqrstuvwxyz_12345"


def _headers(token: str = DEVICE_TOKEN) -> dict[str, str]:
    return {"X-Device-Token": token}


@requires_docker
async def test_profile_is_created_anonymously_and_keyed_by_hashed_device_token(
    client, db_session
):
    first = await client.get("/profile", headers=_headers())
    repeated = await client.get("/profile", headers=_headers())
    other = await client.get("/profile", headers=_headers(OTHER_DEVICE_TOKEN))

    assert first.status_code == repeated.status_code == other.status_code == 200
    assert first.json() == repeated.json()
    assert UUID(first.json()["id"])
    assert first.json()["claimed"] is False
    assert other.json()["id"] != first.json()["id"]

    profiles = (await db_session.scalars(select(Profile).order_by(Profile.id))).all()
    assert len(profiles) == 2
    stored = next(
        profile for profile in profiles if str(profile.id) == first.json()["id"]
    )
    assert stored.user_id is None
    assert stored.device_token_hash == hashlib.sha256(DEVICE_TOKEN.encode()).hexdigest()
    assert DEVICE_TOKEN not in stored.device_token_hash
    assert set(first.json()) == {"id", "claimed"}


@requires_docker
async def test_save_list_and_unsave_are_idempotent_and_isolated_by_profile(
    client, db_session
):
    event = load_fixture("snapshot_a.json")[0]
    await ingest_rows(db_session, [event])
    path = f"/profile/saved/{event['guid']}"

    saved, repeated = await asyncio.gather(
        client.put(path, headers=_headers()),
        client.put(path, headers=_headers()),
    )
    own_list = await client.get("/profile/saved", headers=_headers())
    other_list = await client.get(
        "/profile/saved", headers=_headers(OTHER_DEVICE_TOKEN)
    )

    assert saved.status_code == repeated.status_code == 200
    assert saved.json() == repeated.json()
    assert saved.json()["saved"] is True
    assert saved.json()["event_guid"] == event["guid"]
    assert own_list.status_code == 200
    assert own_list.json()["total"] == 1
    assert [item["guid"] for item in own_list.json()["events"]] == [event["guid"]]
    assert other_list.json()["total"] == 0
    assert await db_session.scalar(select(func.count()).select_from(SavedEvent)) == 1

    other_delete = await client.delete(path, headers=_headers(OTHER_DEVICE_TOKEN))
    assert other_delete.status_code == 204
    assert (await client.get("/profile/saved", headers=_headers())).json()["total"] == 1

    removed = await client.delete(path, headers=_headers())
    repeated_remove = await client.delete(path, headers=_headers())
    assert removed.status_code == repeated_remove.status_code == 204
    assert (await client.get("/profile/saved", headers=_headers())).json()["total"] == 0


@requires_docker
async def test_profile_api_rejects_bad_tokens_and_unknown_events(client, db_session):
    missing = await client.get("/profile")
    short = await client.get("/profile", headers=_headers("predictable"))
    malformed = await client.get("/profile", headers=_headers("x" * 31 + " "))

    assert missing.status_code == short.status_code == malformed.status_code == 422
    assert await db_session.scalar(select(func.count()).select_from(Profile)) == 0

    missing_event = await client.put(
        "/profile/saved/not-a-current-event", headers=_headers()
    )
    assert missing_event.status_code == 404
    assert missing_event.json() == {"detail": "Event not found"}
    assert await db_session.scalar(select(func.count()).select_from(SavedEvent)) == 0
    assert (
        await client.get(
            "/profile/saved", headers=_headers(), params={"page_size": 101}
        )
    ).status_code == 422


@requires_docker
async def test_profile_schema_is_anonymous_by_default_and_collects_no_contact_data(
    client, db_session
):
    columns = (
        await db_session.execute(
            text(
                "SELECT column_name, is_nullable FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = 'profiles' "
                "ORDER BY column_name"
            )
        )
    ).all()

    assert dict(columns)["user_id"] == "YES"
    assert set(dict(columns)) == {
        "created_at",
        "device_token_hash",
        "id",
        "user_id",
    }
    schema = (await client.get("/openapi.json")).json()
    operations = schema["paths"]
    assert {"get"} <= set(operations["/profile"])
    assert {"get"} <= set(operations["/profile/saved"])
    assert {"put", "delete"} <= set(operations["/profile/saved/{guid}"])
    serialized = str(schema).casefold()
    assert "email" not in serialized
    assert "phone" not in serialized


@requires_docker
async def test_browser_preflight_allows_only_the_profile_write_contract(client):
    origin = "http://localhost:3000"
    allowed = await client.options(
        "/profile/saved/example",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "X-Device-Token",
        },
    )
    disallowed = await client.options(
        "/profile/saved/example",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization",
        },
    )

    assert allowed.status_code == 200
    assert "PUT" in allowed.headers["access-control-allow-methods"]
    assert "X-Device-Token" in allowed.headers["access-control-allow-headers"]
    assert disallowed.status_code == 400


@requires_docker
async def test_saved_event_survives_source_snapshot_removal(client, db_session):
    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, rows)
    guid = rows[0]["guid"]
    assert (
        await client.put(f"/profile/saved/{guid}", headers=_headers())
    ).status_code == 200

    await ingest_rows(db_session, rows[1:])

    saved = await client.get("/profile/saved", headers=_headers())
    assert saved.status_code == 200
    assert saved.json()["total"] == 1
    assert saved.json()["events"][0]["guid"] == guid
