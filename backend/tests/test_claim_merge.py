"""Clerk claim-and-merge tests (issue #23)."""

from __future__ import annotations

import asyncio
import hashlib
from uuid import UUID, uuid4

from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert

from app.auth import (
    ClerkTokenPayload,
    get_clerk_verifier,
    reset_clerk_verifier,
    set_clerk_verifier,
    verify_clerk_token,
)
from app.models.profile import (
    Interest,
    MatchedEvent,
    PreferenceAudit,
    Profile,
    SavedEvent,
)
from tests.conftest import ingest_rows, load_fixture, requires_docker

DEVICE_TOKEN_A = "device-claim-A-abcdefghijklmnopqrstuvwxyz_1234"
DEVICE_TOKEN_B = "device-claim-B-abcdefghijklmnopqrstuvwxyz_1234"
DEVICE_TOKEN_C = "device-claim-C-abcdefghijklmnopqrstuvwxyz_1234"
CLERK_USER_ID = "user_clerk_test_12345"
CLERK_EMAIL = "testuser@example.com"


def _device_headers(token: str = DEVICE_TOKEN_A) -> dict[str, str]:
    return {"X-Device-Token": token}


def _claim_headers(
    token: str = DEVICE_TOKEN_A, bearer: str = "fake-clerk-jwt"
) -> dict[str, str]:
    return {"X-Device-Token": token, "Authorization": f"Bearer {bearer}"}


def _bearer_headers(
    token: str = DEVICE_TOKEN_B, bearer: str = "fake-clerk-jwt"
) -> dict[str, str]:
    return {"X-Device-Token": token, "Authorization": f"Bearer {bearer}"}


async def _fake_verifier(token: str) -> ClerkTokenPayload:
    """Return a predetermined payload without reaching Clerk."""
    return ClerkTokenPayload(user_id=CLERK_USER_ID, email=CLERK_EMAIL)


async def _fake_verifier_alt(token: str) -> ClerkTokenPayload:
    """Return a different user_id for testing isolation."""
    return ClerkTokenPayload(user_id="user_clerk_other_99999", email=None)


async def _failing_verifier(token: str) -> ClerkTokenPayload:
    """Always raise — simulates invalid token."""
    raise ValueError("Token verification failed")


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def _create_profile(db_session, token: str, user_id: str | None = None) -> UUID:
    """Insert a Profile directly and return its id."""
    pid = uuid4()
    await db_session.execute(
        insert(Profile)
        .values(id=pid, device_token_hash=_token_hash(token), user_id=user_id)
        .on_conflict_do_nothing(index_elements=[Profile.device_token_hash])
    )
    await db_session.commit()
    return pid


async def _add_saved_event(db_session, profile_id: UUID, guid: str) -> None:
    await db_session.execute(
        insert(SavedEvent)
        .values(profile_id=profile_id, event_guid=guid)
        .on_conflict_do_nothing(
            index_elements=[SavedEvent.profile_id, SavedEvent.event_guid]
        )
    )
    await db_session.commit()


async def _add_interest(
    db_session,
    profile_id: UUID,
    facet_type: str = "category",
    facet_value: str = "Music",
    normalized: str = "music",
    origin: str = "manual",
    idempotency_key: str | None = None,
) -> UUID:
    iid = uuid4()
    await db_session.execute(
        insert(Interest).values(
            id=iid,
            profile_id=profile_id,
            facet_type=facet_type,
            facet_value=facet_value,
            normalized_value=normalized,
            alert_enabled=True,
            origin=origin,
            origin_idempotency_key=idempotency_key,
        )
    )
    await db_session.commit()
    return iid


async def _add_matched_event(
    db_session, profile_id: UUID, guid: str, status: str = "active"
) -> None:
    await db_session.execute(
        insert(MatchedEvent)
        .values(profile_id=profile_id, event_guid=guid, status=status)
        .on_conflict_do_nothing(
            index_elements=[MatchedEvent.profile_id, MatchedEvent.event_guid]
        )
    )
    await db_session.commit()


async def _add_audit(
    db_session,
    profile_id: UUID,
    interest_id: UUID,
    idempotency_key: str,
) -> UUID:
    aid = uuid4()
    await db_session.execute(
        insert(PreferenceAudit).values(
            id=aid,
            profile_id=profile_id,
            interest_id=interest_id,
            origin="concierge",
            outcome="approved",
            idempotency_key=idempotency_key,
            facet_type="category",
            normalized_value="music",
            alert_enabled=True,
        )
    )
    await db_session.commit()
    return aid


async def _install_claim_update_delay(db_session) -> None:
    """Hold first-claim updates briefly so both requests reach the race window."""
    await db_session.execute(
        text(
            """
            CREATE OR REPLACE FUNCTION test_delay_profile_claim()
            RETURNS trigger AS $$
            BEGIN
                PERFORM pg_sleep(0.2);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
            """
        )
    )
    await db_session.execute(
        text(
            """
            CREATE TRIGGER test_delay_profile_claim
            BEFORE UPDATE OF user_id ON profiles
            FOR EACH ROW
            WHEN (OLD.user_id IS NULL AND NEW.user_id IS NOT NULL)
            EXECUTE FUNCTION test_delay_profile_claim()
            """
        )
    )
    await db_session.commit()


async def _remove_claim_update_delay(db_session) -> None:
    await db_session.execute(text("DROP TRIGGER test_delay_profile_claim ON profiles"))
    await db_session.execute(text("DROP FUNCTION test_delay_profile_claim()"))
    await db_session.commit()


@requires_docker
async def test_injectable_verifier_no_clerk_calls(client):
    """Override the verifier dependency; verify no Clerk calls are made."""
    call_count = 0

    async def counting_verifier(token: str) -> ClerkTokenPayload:
        nonlocal call_count
        call_count += 1
        return ClerkTokenPayload(user_id="user_counting", email=None)

    set_clerk_verifier(counting_verifier)
    try:
        resp = await client.post("/profile/claim", headers=_claim_headers())
        assert resp.status_code == 200
        assert call_count == 1
        assert get_clerk_verifier() is counting_verifier
        assert get_clerk_verifier() is not verify_clerk_token
    finally:
        reset_clerk_verifier()


@requires_docker
async def test_first_claim_sets_user_id(client, db_session):
    """Claiming on the first device simply sets user_id."""
    set_clerk_verifier(_fake_verifier)
    try:
        # Create anonymous profile
        anon = await client.get("/profile", headers=_device_headers())
        assert anon.status_code == 200
        assert anon.json()["claimed"] is False

        # Claim it
        resp = await client.post("/profile/claim", headers=_claim_headers())
        assert resp.status_code == 200
        body = resp.json()
        assert body["claimed"] is True
        assert body["id"] == anon.json()["id"]

        # Verify in DB
        profile = await db_session.scalar(
            select(Profile).where(Profile.id == UUID(body["id"]))
        )
        assert profile is not None
        assert profile.user_id == CLERK_USER_ID
    finally:
        reset_clerk_verifier()


@requires_docker
async def test_idempotent_claim_same_device(client, db_session):
    """Claiming twice with the same user_id on the same device is a no-op."""
    set_clerk_verifier(_fake_verifier)
    try:
        await client.get("/profile", headers=_device_headers())
        first = await client.post("/profile/claim", headers=_claim_headers())
        second = await client.post("/profile/claim", headers=_claim_headers())

        assert first.status_code == second.status_code == 200
        assert first.json() == second.json()
        assert first.json()["claimed"] is True
        count = await db_session.scalar(select(func.count()).select_from(Profile))
        assert count == 1
    finally:
        reset_clerk_verifier()


@requires_docker
async def test_lossless_merge_two_profiles(client, db_session):
    """Create two profiles with distinct data. Claim. Verify ALL items survive."""
    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, rows)
    guids = [r["guid"] for r in rows]
    assert len(guids) >= 3, "Need at least 3 events for the merge test"

    # Profile A: anonymous, has guids[0..1]
    pid_a = await _create_profile(db_session, DEVICE_TOKEN_A)
    await _add_saved_event(db_session, pid_a, guids[0])
    await _add_saved_event(db_session, pid_a, guids[1])
    iid_a = await _add_interest(
        db_session,
        pid_a,
        facet_type="category",
        facet_value="Music",
        normalized="music",
        idempotency_key="interest-a-music",
    )
    await _add_matched_event(db_session, pid_a, guids[0])
    await _add_audit(db_session, pid_a, iid_a, "audit-a-music")

    # Profile B: already claimed, has guids[1..2]
    pid_b = await _create_profile(db_session, DEVICE_TOKEN_B, user_id=CLERK_USER_ID)
    await _add_saved_event(db_session, pid_b, guids[1])
    await _add_saved_event(db_session, pid_b, guids[2])
    iid_b = await _add_interest(
        db_session,
        pid_b,
        facet_type="borough",
        facet_value="Brooklyn",
        normalized="brooklyn",
        idempotency_key="interest-b-brooklyn",
    )
    await _add_matched_event(db_session, pid_b, guids[2])
    await _add_audit(db_session, pid_b, iid_b, "audit-b-brooklyn")

    saved_before = await db_session.scalar(select(func.count()).select_from(SavedEvent))
    interest_before = await db_session.scalar(
        select(func.count()).select_from(Interest)
    )
    match_before = await db_session.scalar(
        select(func.count()).select_from(MatchedEvent)
    )
    assert saved_before == 4  # 2 + 2
    assert interest_before == 2
    assert match_before == 2

    # Claim A -- triggers merge into B
    set_clerk_verifier(_fake_verifier)
    try:
        resp = await client.post(
            "/profile/claim", headers=_claim_headers(DEVICE_TOKEN_A)
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["claimed"] is True
        assert body["id"] == str(pid_b)  # Merged into B
    finally:
        reset_clerk_verifier()

    assert (await db_session.scalar(select(Profile).where(Profile.id == pid_a))) is None

    saved_guids = set(
        (
            await db_session.scalars(
                select(SavedEvent.event_guid).where(SavedEvent.profile_id == pid_b)
            )
        ).all()
    )
    assert saved_guids == set(guids[:3]), (
        f"Lossless: expected all 3 guids, got {saved_guids}"
    )

    interests = (
        await db_session.scalars(
            select(Interest.normalized_value).where(Interest.profile_id == pid_b)
        )
    ).all()
    assert set(interests) == {"music", "brooklyn"}

    matched_guids = set(
        (
            await db_session.scalars(
                select(MatchedEvent.event_guid).where(MatchedEvent.profile_id == pid_b)
            )
        ).all()
    )
    assert matched_guids == {guids[0], guids[2]}

    audit_count = await db_session.scalar(
        select(func.count())
        .select_from(PreferenceAudit)
        .where(PreferenceAudit.profile_id == pid_b)
    )
    assert audit_count >= 1


@requires_docker
async def test_claim_already_claimed_by_different_user_returns_409(client, db_session):
    """A profile already claimed by user X cannot be stolen by user Y."""
    set_clerk_verifier(_fake_verifier)
    try:
        await client.get("/profile", headers=_device_headers(DEVICE_TOKEN_A))
        headers = _claim_headers(DEVICE_TOKEN_A)
        claim = await client.post("/profile/claim", headers=headers)
        assert claim.status_code == 200
    finally:
        reset_clerk_verifier()

    set_clerk_verifier(_fake_verifier_alt)
    try:
        headers = _claim_headers(DEVICE_TOKEN_A)
        resp = await client.post("/profile/claim", headers=headers)
        assert resp.status_code == 409
    finally:
        reset_clerk_verifier()


@requires_docker
async def test_duplicate_merge_no_constraint_violation(client, db_session):
    """Both profiles save the same event. After merge, only one copy exists."""
    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, rows)
    guid = rows[0]["guid"]

    pid_a = await _create_profile(db_session, DEVICE_TOKEN_A)
    await _add_saved_event(db_session, pid_a, guid)
    await _add_matched_event(db_session, pid_a, guid)
    await _add_interest(
        db_session,
        pid_a,
        facet_type="category",
        facet_value="Music",
        normalized="music",
        idempotency_key="dup-interest-a",
    )

    pid_b = await _create_profile(db_session, DEVICE_TOKEN_B, user_id=CLERK_USER_ID)
    await _add_saved_event(db_session, pid_b, guid)
    await _add_matched_event(db_session, pid_b, guid)
    await _add_interest(
        db_session,
        pid_b,
        facet_type="category",
        facet_value="Music",
        normalized="music",
        idempotency_key="dup-interest-b",
    )

    set_clerk_verifier(_fake_verifier)
    try:
        resp = await client.post(
            "/profile/claim", headers=_claim_headers(DEVICE_TOKEN_A)
        )
        assert resp.status_code == 200
    finally:
        reset_clerk_verifier()

    saved_count = await db_session.scalar(
        select(func.count())
        .select_from(SavedEvent)
        .where(SavedEvent.profile_id == pid_b, SavedEvent.event_guid == guid)
    )
    assert saved_count == 1

    match_count = await db_session.scalar(
        select(func.count())
        .select_from(MatchedEvent)
        .where(MatchedEvent.profile_id == pid_b, MatchedEvent.event_guid == guid)
    )
    assert match_count == 1

    interest_count = await db_session.scalar(
        select(func.count())
        .select_from(Interest)
        .where(
            Interest.profile_id == pid_b,
            Interest.facet_type == "category",
            Interest.normalized_value == "music",
        )
    )
    assert interest_count == 1


@requires_docker
async def test_cross_device_returns_same_saved_and_matches(client, db_session):
    """After claiming, a second device with Bearer sees the same data."""
    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, rows)
    guid = rows[0]["guid"]

    set_clerk_verifier(_fake_verifier)
    try:
        await client.get("/profile", headers=_device_headers(DEVICE_TOKEN_A))
        await client.put(
            f"/profile/saved/{guid}", headers=_device_headers(DEVICE_TOKEN_A)
        )
        claim_resp = await client.post(
            "/profile/claim", headers=_claim_headers(DEVICE_TOKEN_A)
        )
        assert claim_resp.status_code == 200
        account_id = claim_resp.json()["id"]

        profile_b = await client.get(
            "/profile", headers=_bearer_headers(DEVICE_TOKEN_B)
        )
        assert profile_b.status_code == 200
        assert profile_b.json()["id"] == account_id
        assert profile_b.json()["claimed"] is True
    finally:
        reset_clerk_verifier()


@requires_docker
async def test_merged_device_tokens_share_saved_interests_and_matches(
    client, db_session
):
    """Both raw device tokens resolve to one Profile after a merge."""
    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, rows)
    guids = [row["guid"] for row in rows]

    pid_a = await _create_profile(db_session, DEVICE_TOKEN_A)
    await _add_saved_event(db_session, pid_a, guids[0])
    await _add_interest(db_session, pid_a, facet_value="Music", normalized="music")
    await _add_matched_event(db_session, pid_a, guids[0])

    pid_b = await _create_profile(db_session, DEVICE_TOKEN_B, user_id=CLERK_USER_ID)
    await _add_saved_event(db_session, pid_b, guids[1])
    await _add_interest(
        db_session,
        pid_b,
        facet_type="borough",
        facet_value="Brooklyn",
        normalized="brooklyn",
    )
    await _add_matched_event(db_session, pid_b, guids[1])

    set_clerk_verifier(_fake_verifier)
    try:
        claim = await client.post(
            "/profile/claim", headers=_claim_headers(DEVICE_TOKEN_A)
        )
        repeated = await client.post(
            "/profile/claim", headers=_claim_headers(DEVICE_TOKEN_A)
        )
        assert claim.status_code == repeated.status_code == 200
        assert claim.json() == repeated.json()
        assert claim.json()["id"] == str(pid_b)

        for path, expected_total in (
            ("/profile/saved", 2),
            ("/profile/interests", 2),
            ("/profile/matches", 2),
        ):
            from_a = await client.get(path, headers=_device_headers(DEVICE_TOKEN_A))
            from_b = await client.get(path, headers=_device_headers(DEVICE_TOKEN_B))
            assert from_a.status_code == from_b.status_code == 200
            assert (
                from_a.json()["profile_id"] == from_b.json()["profile_id"] == str(pid_b)
            )
            assert from_a.json()["total"] == from_b.json()["total"] == expected_total

        saved_by_a = await client.put(
            f"/profile/saved/{guids[2]}", headers=_device_headers(DEVICE_TOKEN_A)
        )
        interest_by_b = await client.put(
            "/profile/interests",
            headers=_device_headers(DEVICE_TOKEN_B),
            json={"facet_type": "category", "facet_value": "Fitness"},
        )
        dismissed_by_a = await client.delete(
            f"/profile/matches/{guids[0]}",
            headers=_device_headers(DEVICE_TOKEN_A),
        )
        assert saved_by_a.status_code == interest_by_b.status_code == 200
        assert dismissed_by_a.status_code == 204

        saved_from_b = await client.get(
            "/profile/saved", headers=_device_headers(DEVICE_TOKEN_B)
        )
        interests_from_a = await client.get(
            "/profile/interests", headers=_device_headers(DEVICE_TOKEN_A)
        )
        matches_from_b = await client.get(
            "/profile/matches", headers=_device_headers(DEVICE_TOKEN_B)
        )
        assert saved_from_b.json()["total"] == 3
        assert interests_from_a.json()["total"] == 3
        assert matches_from_b.json()["total"] == 1

        alias_rows = (
            await db_session.execute(
                text(
                    "SELECT profile_id FROM profile_device_aliases "
                    "WHERE device_token_hash = :token_hash"
                ),
                {"token_hash": _token_hash(DEVICE_TOKEN_A)},
            )
        ).all()
        assert alias_rows == [(pid_b,)]
    finally:
        reset_clerk_verifier()

    set_clerk_verifier(_fake_verifier_alt)
    try:
        stolen = await client.post(
            "/profile/claim", headers=_claim_headers(DEVICE_TOKEN_A)
        )
        assert stolen.status_code == 409
    finally:
        reset_clerk_verifier()


@requires_docker
async def test_concurrent_different_token_first_claims_share_all_data(
    client, db_session
):
    """Concurrent first claims for one user converge without an external retry."""
    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, rows)
    guids = [row["guid"] for row in rows]

    pid_a = await _create_profile(db_session, DEVICE_TOKEN_A)
    await _add_saved_event(db_session, pid_a, guids[0])
    await _add_interest(db_session, pid_a, facet_value="Music", normalized="music")
    await _add_matched_event(db_session, pid_a, guids[0])

    pid_b = await _create_profile(db_session, DEVICE_TOKEN_B)
    await _add_saved_event(db_session, pid_b, guids[1])
    await _add_interest(
        db_session,
        pid_b,
        facet_type="borough",
        facet_value="Brooklyn",
        normalized="brooklyn",
    )
    await _add_matched_event(db_session, pid_b, guids[1])
    await _install_claim_update_delay(db_session)

    set_clerk_verifier(_fake_verifier)
    try:
        first, second = await asyncio.gather(
            client.post("/profile/claim", headers=_claim_headers(DEVICE_TOKEN_A)),
            client.post("/profile/claim", headers=_claim_headers(DEVICE_TOKEN_B)),
        )
    finally:
        reset_clerk_verifier()
        await _remove_claim_update_delay(db_session)

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    canonical_id = first.json()["id"]
    assert canonical_id in {str(pid_a), str(pid_b)}

    for path in ("/profile/saved", "/profile/interests", "/profile/matches"):
        from_a = await client.get(path, headers=_device_headers(DEVICE_TOKEN_A))
        from_b = await client.get(path, headers=_device_headers(DEVICE_TOKEN_B))
        assert from_a.status_code == from_b.status_code == 200
        assert from_a.json()["profile_id"] == canonical_id
        assert from_b.json()["profile_id"] == canonical_id
        assert from_a.json()["total"] == from_b.json()["total"] == 2

    account_count = await db_session.scalar(
        select(func.count())
        .select_from(Profile)
        .where(Profile.user_id == CLERK_USER_ID)
    )
    assert account_count == 1


@requires_docker
async def test_concurrent_different_token_claims_merge_into_existing_account(
    client, db_session
):
    """Different-token claims serialize and preserve an existing account's data."""
    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, rows)
    guids = [row["guid"] for row in rows]

    pid_a = await _create_profile(db_session, DEVICE_TOKEN_A)
    await _add_saved_event(db_session, pid_a, guids[0])
    await _add_interest(db_session, pid_a, facet_value="Music", normalized="music")
    await _add_matched_event(db_session, pid_a, guids[0])

    pid_b = await _create_profile(db_session, DEVICE_TOKEN_B)
    await _add_saved_event(db_session, pid_b, guids[1])
    await _add_interest(
        db_session,
        pid_b,
        facet_type="borough",
        facet_value="Brooklyn",
        normalized="brooklyn",
    )
    await _add_matched_event(db_session, pid_b, guids[1])

    account_id = await _create_profile(
        db_session, DEVICE_TOKEN_C, user_id=CLERK_USER_ID
    )
    await _add_saved_event(db_session, account_id, guids[2])
    await _add_interest(
        db_session,
        account_id,
        facet_type="registration",
        facet_value="Required",
        normalized="required",
    )
    await _add_matched_event(db_session, account_id, guids[2])

    set_clerk_verifier(_fake_verifier)
    try:
        first, second = await asyncio.gather(
            client.post("/profile/claim", headers=_claim_headers(DEVICE_TOKEN_A)),
            client.post("/profile/claim", headers=_claim_headers(DEVICE_TOKEN_B)),
        )
    finally:
        reset_clerk_verifier()

    expected = {"id": str(account_id), "claimed": True}
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json() == expected

    for path in ("/profile/saved", "/profile/interests", "/profile/matches"):
        for token in (DEVICE_TOKEN_A, DEVICE_TOKEN_B, DEVICE_TOKEN_C):
            response = await client.get(path, headers=_device_headers(token))
            assert response.status_code == 200
            assert response.json()["profile_id"] == str(account_id)
            assert response.json()["total"] == 3

    aliases = (
        await db_session.execute(
            text(
                "SELECT device_token_hash, profile_id FROM profile_device_aliases "
                "WHERE device_token_hash IN (:token_a, :token_b)"
            ),
            {
                "token_a": _token_hash(DEVICE_TOKEN_A),
                "token_b": _token_hash(DEVICE_TOKEN_B),
            },
        )
    ).all()
    assert set(aliases) == {
        (_token_hash(DEVICE_TOKEN_A), account_id),
        (_token_hash(DEVICE_TOKEN_B), account_id),
    }


@requires_docker
async def test_concurrent_repeated_merge_claim_is_idempotent(client, db_session):
    """Concurrent claims for one token both resolve to the canonical Profile."""
    await _create_profile(db_session, DEVICE_TOKEN_A)
    pid_b = await _create_profile(db_session, DEVICE_TOKEN_B, user_id=CLERK_USER_ID)

    set_clerk_verifier(_fake_verifier)
    try:
        first, second = await asyncio.gather(
            client.post("/profile/claim", headers=_claim_headers(DEVICE_TOKEN_A)),
            client.post("/profile/claim", headers=_claim_headers(DEVICE_TOKEN_A)),
        )
    finally:
        reset_clerk_verifier()

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json() == {"id": str(pid_b), "claimed": True}
    alias_count = await db_session.scalar(
        text(
            "SELECT count(*) FROM profile_device_aliases "
            "WHERE device_token_hash = :token_hash"
        ),
        {"token_hash": _token_hash(DEVICE_TOKEN_A)},
    )
    assert alias_count == 1


@requires_docker
async def test_claim_missing_bearer_returns_401(client):
    """POST /profile/claim without Authorization header returns 401."""
    resp = await client.post("/profile/claim", headers=_device_headers())
    assert resp.status_code == 401
    assert "Bearer" in resp.json()["detail"]


@requires_docker
async def test_claim_invalid_token_returns_401(client):
    """POST /profile/claim with an invalid token returns 401."""
    set_clerk_verifier(_failing_verifier)
    try:
        resp = await client.post(
            "/profile/claim",
            headers=_claim_headers(DEVICE_TOKEN_A, bearer="bad-token"),
        )
        assert resp.status_code == 401
    finally:
        reset_clerk_verifier()


@requires_docker
async def test_clerk_secret_key_not_in_openapi(client):
    """CLERK_SECRET_KEY must not appear in the OpenAPI schema."""
    schema = (await client.get("/openapi.json")).json()
    serialized = str(schema).casefold()
    assert "clerk_secret_key" not in serialized
    assert "clerk_secret" not in serialized


@requires_docker
async def test_cors_allows_authorization_header(client):
    """Verify CORS preflight accepts the Authorization header."""
    origin = "http://localhost:3000"
    resp = await client.options(
        "/profile/claim",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization, X-Device-Token",
        },
    )
    assert resp.status_code == 200
    assert "Authorization" in resp.headers.get("access-control-allow-headers", "")
