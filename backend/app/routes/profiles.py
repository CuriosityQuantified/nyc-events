"""Anonymous Profile, Saved Events, and Clerk claim/merge API."""

from __future__ import annotations

import hashlib
from typing import Annotated, Any, NoReturn
from uuid import UUID, uuid4

from fastapi import APIRouter, Header, HTTPException, Path, Query, Response, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import ClerkTokenPayload, get_clerk_verifier
from app.database import get_session_factory
from app.models.event import EventRepository
from app.models.profile import (
    Interest,
    MatchedEvent,
    Notification,
    PreferenceAudit,
    Profile,
    ProfileDeviceAlias,
    PushSubscription,
    SavedEvent,
)
from app.routes.events import _event_date_expression, _event_to_contract
from app.services.saved_events import EventNotCurrentError, save_current_event

router = APIRouter(prefix="/profile")

DeviceToken = Annotated[
    str,
    Header(
        alias="X-Device-Token",
        min_length=32,
        max_length=255,
        pattern=r"^[A-Za-z0-9._~-]+$",
    ),
]

OptionalBearer = Annotated[str | None, Header(alias="Authorization")]


def _token_digest(token: str) -> str:
    """Return a non-reversible lookup key for a high-entropy device token."""
    return hashlib.sha256(token.encode()).hexdigest()


def _advisory_lock_id(domain: str, value: str) -> int:
    """Return a stable, domain-separated signed Postgres advisory-lock key."""
    digest_prefix = hashlib.sha256(f"{domain}\0{value}".encode()).digest()[:8]
    return int.from_bytes(digest_prefix, byteorder="big", signed=True)


def _token_lock_id(token: str) -> int:
    """Return the advisory-lock key for one device token."""
    return _advisory_lock_id("profile-device-token:v1", token)


def _clerk_user_lock_id(user_id: str) -> int:
    """Return the advisory-lock key for one Clerk user."""
    return _advisory_lock_id("profile-clerk-user:v1", user_id)


async def _get_or_create_profile(session: AsyncSession, token: str) -> Profile:
    """Return the token's canonical Profile, creating it atomically on first use."""
    # Serialize resolution with claim/merge for this token. This prevents a request
    # from using a source Profile while that Profile becomes an alias.
    await session.execute(select(func.pg_advisory_xact_lock(_token_lock_id(token))))
    token_hash = _token_digest(token)
    aliased_profile = await session.scalar(
        select(Profile)
        .join(ProfileDeviceAlias, ProfileDeviceAlias.profile_id == Profile.id)
        .where(ProfileDeviceAlias.device_token_hash == token_hash)
    )
    if aliased_profile is not None:
        # Direct mapping, not an alias chain: resolution is one bounded query.
        return aliased_profile

    await session.execute(
        insert(Profile)
        .values(id=uuid4(), device_token_hash=token_hash, user_id=None)
        .on_conflict_do_nothing(index_elements=[Profile.device_token_hash])
    )
    profile = await session.scalar(
        select(Profile).where(Profile.device_token_hash == token_hash)
    )
    if profile is None:  # pragma: no cover - database invariant guard
        raise RuntimeError("Profile upsert did not return a Profile")
    return profile


def _profile_contract(profile: Profile) -> dict[str, Any]:
    return {"id": str(profile.id), "claimed": profile.user_id is not None}


async def _database_unavailable(
    session: AsyncSession, error: SQLAlchemyError
) -> NoReturn:
    await session.rollback()
    raise HTTPException(
        status_code=503, detail="Profile database unavailable"
    ) from error


def _extract_bearer(authorization: str | None) -> str | None:
    """Extract the raw token from an ``Authorization: Bearer <token>`` header."""
    if authorization is None:
        return None
    parts = authorization.split(" ", maxsplit=1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


async def _verify_bearer(authorization: str | None) -> ClerkTokenPayload:
    """Verify a Bearer token, raising 401 on any failure."""
    raw = _extract_bearer(authorization)
    if raw is None:
        raise HTTPException(status_code=401, detail="Missing or malformed Bearer token")
    try:
        return await get_clerk_verifier()(raw)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid Clerk token") from exc


@router.get("")
async def get_profile(
    x_device_token: DeviceToken,
    authorization: OptionalBearer = None,
) -> dict[str, Any]:
    """Create or return the anonymous Profile for this device token.

    When a valid ``Authorization: Bearer <clerk_token>`` is also provided,
    the Profile is looked up by ``user_id`` first -- enabling cross-device
    access after claiming.
    """
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            # Cross-device: if a Bearer token is present, look up by user_id.
            if _extract_bearer(authorization) is not None:
                try:
                    payload = await _verify_bearer(authorization)
                    account_profile = await session.scalar(
                        select(Profile).where(Profile.user_id == payload.user_id)
                    )
                    if account_profile is not None:
                        return _profile_contract(account_profile)
                except HTTPException:
                    pass  # Fall through to device-token lookup

            profile = await _get_or_create_profile(session, x_device_token)
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
        return _profile_contract(profile)


async def _merge_profiles(
    session: AsyncSession,
    *,
    source_id: UUID,
    target_id: UUID,
) -> None:
    """Move source children and retain its device token as a target alias.

    Duplicates are skipped via ``ON CONFLICT DO NOTHING`` for SavedEvent /
    MatchedEvent, and by a check-then-move strategy for Interest rows.
    """
    # -- SavedEvents --
    source_saved = (
        await session.scalars(
            select(SavedEvent).where(SavedEvent.profile_id == source_id)
        )
    ).all()
    for saved in source_saved:
        await session.execute(
            insert(SavedEvent)
            .values(
                profile_id=target_id,
                event_guid=saved.event_guid,
                saved_at=saved.saved_at,
            )
            .on_conflict_do_nothing(
                index_elements=[SavedEvent.profile_id, SavedEvent.event_guid]
            )
        )
    await session.execute(delete(SavedEvent).where(SavedEvent.profile_id == source_id))

    # -- MatchedEvents --
    source_matches = (
        await session.scalars(
            select(MatchedEvent).where(MatchedEvent.profile_id == source_id)
        )
    ).all()
    for matched in source_matches:
        await session.execute(
            insert(MatchedEvent)
            .values(
                profile_id=target_id,
                event_guid=matched.event_guid,
                status=matched.status,
                matched_at=matched.matched_at,
            )
            .on_conflict_do_nothing(
                index_elements=[MatchedEvent.profile_id, MatchedEvent.event_guid]
            )
        )
    await session.execute(
        delete(MatchedEvent).where(MatchedEvent.profile_id == source_id)
    )

    # -- Notifications --
    source_notifications = (
        await session.scalars(
            select(Notification).where(Notification.profile_id == source_id)
        )
    ).all()
    for notification in source_notifications:
        existing = await session.get(
            Notification,
            {"profile_id": target_id, "event_guid": notification.event_guid},
        )
        if existing is None:
            notification.profile_id = target_id
            continue
        existing.push_enabled = existing.push_enabled or notification.push_enabled
        existing.pushed_at = existing.pushed_at or notification.pushed_at
        existing.read_at = (
            existing.read_at
            if existing.read_at is not None and notification.read_at is not None
            else None
        )
        existing.created_at = min(existing.created_at, notification.created_at)
        await session.delete(notification)

    # -- Push subscriptions --
    await session.execute(
        update(PushSubscription)
        .where(PushSubscription.profile_id == source_id)
        .values(profile_id=target_id)
    )

    # -- Interests --
    source_interests = (
        await session.scalars(select(Interest).where(Interest.profile_id == source_id))
    ).all()

    for interest in source_interests:
        existing = await session.scalar(
            select(Interest).where(
                Interest.profile_id == target_id,
                Interest.facet_type == interest.facet_type,
                Interest.normalized_value == interest.normalized_value,
            )
        )
        if existing is None:
            interest.profile_id = target_id
            if interest.origin_idempotency_key is not None:
                interest.origin_idempotency_key = (
                    f"merged-{uuid4().hex[:8]}-{interest.origin_idempotency_key}"
                )
        else:
            await session.delete(interest)

    # -- PreferenceAudits --
    # Interests that stayed on source (duplicate, deleted above) still have
    # audit rows referencing them; delete those before removing the profile.
    duplicate_interest_ids = {
        i.id for i in source_interests if i.profile_id != target_id
    }
    if duplicate_interest_ids:
        await session.execute(
            delete(PreferenceAudit).where(
                PreferenceAudit.interest_id.in_(duplicate_interest_ids)
            )
        )
    await session.execute(
        update(PreferenceAudit)
        .where(PreferenceAudit.profile_id == source_id)
        .values(profile_id=target_id)
    )

    source_profile = await session.get(Profile, source_id)
    if source_profile is None:  # pragma: no cover - transaction invariant guard
        raise RuntimeError("Merge source Profile does not exist")
    await session.execute(
        insert(ProfileDeviceAlias).values(
            device_token_hash=source_profile.device_token_hash,
            profile_id=target_id,
        )
    )
    await session.execute(delete(Profile).where(Profile.id == source_id))


@router.post("/claim")
async def claim_profile(
    x_device_token: DeviceToken,
    authorization: OptionalBearer = None,
) -> dict[str, Any]:
    """Claim an anonymous Profile for a signed-in Clerk user.

    If the user_id already owns a different Profile (from another device),
    the anonymous Profile's Saved Events, Interests, and Matches are merged
    into the account Profile — nothing is lost.
    """
    clerk_payload = await _verify_bearer(authorization)

    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            anon_profile = await _get_or_create_profile(session, x_device_token)

            # Lock order for every claim is: device token, Clerk user, then Profile
            # row. Domain-separated advisory keys keep token and user inputs in
            # separate namespaces. The user lock serializes simultaneous first claims
            # before either transaction queries for the canonical account Profile.
            await session.execute(
                select(
                    func.pg_advisory_xact_lock(
                        _clerk_user_lock_id(clerk_payload.user_id)
                    )
                )
            )

            # Idempotent: already claimed by the same user
            if anon_profile.user_id == clerk_payload.user_id:
                await session.commit()
                return _profile_contract(anon_profile)

            # Reject: profile already claimed by a different user
            if anon_profile.user_id is not None:
                await session.rollback()
                raise HTTPException(
                    status_code=409,
                    detail="Profile is already claimed by another account",
                )

            # Check if this user_id already owns another profile (second device)
            account_profile = await session.scalar(
                select(Profile)
                .where(
                    Profile.user_id == clerk_payload.user_id,
                    Profile.id != anon_profile.id,
                )
                .with_for_update()
            )

            if account_profile is not None:
                await _merge_profiles(
                    session,
                    source_id=anon_profile.id,
                    target_id=account_profile.id,
                )
                await session.commit()
                return _profile_contract(account_profile)

            # First claim: attach user_id to the anonymous profile
            anon_profile.user_id = clerk_payload.user_id
            await session.commit()
            return _profile_contract(anon_profile)

        except IntegrityError:
            await session.rollback()
            raise HTTPException(
                status_code=409,
                detail="Profile claim conflict — retry the request",
            ) from None
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)

    # Unreachable but keeps mypy happy
    raise RuntimeError("claim_profile fell through")  # pragma: no cover


@router.get("/saved")
async def list_saved_events(
    x_device_token: DeviceToken,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict[str, Any]:
    """Return this Profile's Saved Events, including archival Events."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            profile_filter = SavedEvent.profile_id == profile.id
            total = (
                await session.scalar(
                    select(func.count()).select_from(SavedEvent).where(profile_filter)
                )
                or 0
            )
            events = (
                await session.scalars(
                    select(EventRepository)
                    .join(SavedEvent, SavedEvent.event_guid == EventRepository.guid)
                    .where(profile_filter)
                    .order_by(
                        _event_date_expression(EventRepository).asc().nullslast(),
                        EventRepository.start_datetime.asc().nullslast(),
                        SavedEvent.saved_at,
                        EventRepository.guid,
                    )
                    .offset((page - 1) * page_size)
                    .limit(page_size)
                )
            ).all()
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
        return {
            "profile_id": str(profile.id),
            "events": [_event_to_contract(event) for event in events],
            "page": page,
            "page_size": page_size,
            "total": total,
        }


@router.put("/saved/{guid}")
async def save_event(
    x_device_token: DeviceToken,
    guid: str = Path(min_length=1, max_length=255),
) -> dict[str, Any]:
    """Idempotently add one current Event to this Profile's Saved list."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            try:
                await save_current_event(session, profile_id=profile.id, event_id=guid)
            except EventNotCurrentError:
                await session.rollback()
                raise HTTPException(status_code=404, detail="Event not found") from None
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
        return {"profile_id": str(profile.id), "event_guid": guid, "saved": True}


@router.delete("/saved/{guid}", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_event(
    x_device_token: DeviceToken,
    guid: str = Path(min_length=1, max_length=255),
) -> Response:
    """Idempotently remove one Event from this Profile's Saved list."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            await session.execute(
                delete(SavedEvent).where(
                    SavedEvent.profile_id == profile.id,
                    SavedEvent.event_guid == guid,
                )
            )
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
