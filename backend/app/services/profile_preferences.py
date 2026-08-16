"""Canonical Interest, alert-preference, and match service."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import CurrentEvent
from app.models.profile import Interest, MatchedEvent, PreferenceAudit

FacetType = Literal["borough", "category", "registration"]
ConciergeDecision = Literal["approved", "edited", "rejected", "unapproved"]
_ALLOWED_FACETS = {"borough", "category", "registration"}
_ALLOWED_REGISTRATION_VALUES = {"required", "not_required", "closed", "not_listed"}


class PreferenceValidationError(ValueError):
    """Raised when a preference does not match the public Facet contract."""


class PreferenceConflictError(ValueError):
    """Raised when an idempotency key is replayed with different input."""


def _normalize_preference(facet_type: str, facet_value: str) -> tuple[str, str]:
    normalized_type = facet_type.strip().casefold()
    normalized_value = facet_value.strip().casefold()
    if normalized_type not in _ALLOWED_FACETS:
        raise PreferenceValidationError("Unsupported Facet type")
    if not normalized_value or len(facet_value.strip()) > 100:
        raise PreferenceValidationError("Facet value must contain 1 to 100 characters")
    if any(ord(character) < 32 or ord(character) == 127 for character in facet_value):
        raise PreferenceValidationError("Facet value contains control characters")
    if (
        normalized_type == "registration"
        and normalized_value not in _ALLOWED_REGISTRATION_VALUES
    ):
        raise PreferenceValidationError("Unsupported registration Facet value")
    return normalized_type, normalized_value


async def _upsert_interest(
    session: AsyncSession,
    *,
    profile_id: UUID,
    facet_type: str,
    facet_value: str,
    normalized_value: str,
    alert_enabled: bool,
    origin: str,
    idempotency_key: str | None,
) -> Interest:
    statement = insert(Interest).values(
        profile_id=profile_id,
        facet_type=facet_type,
        facet_value=facet_value.strip(),
        normalized_value=normalized_value,
        alert_enabled=alert_enabled,
        origin=origin,
        origin_idempotency_key=idempotency_key,
    )
    interest_id = await session.scalar(
        statement.on_conflict_do_update(
            index_elements=[
                Interest.profile_id,
                Interest.facet_type,
                Interest.normalized_value,
            ],
            set_={
                "facet_value": statement.excluded.facet_value,
                "alert_enabled": statement.excluded.alert_enabled,
                "origin": statement.excluded.origin,
                "origin_idempotency_key": statement.excluded.origin_idempotency_key,
                "updated_at": datetime.now(UTC),
            },
        ).returning(Interest.id)
    )
    if interest_id is None:  # pragma: no cover - database invariant guard
        raise RuntimeError("Interest upsert did not return an identifier")
    interest = await session.get(Interest, interest_id)
    if interest is None:  # pragma: no cover - database invariant guard
        raise RuntimeError("Interest upsert did not return an Interest")
    await session.refresh(interest)
    return interest


async def set_manual_interest(
    session: AsyncSession,
    *,
    profile_id: UUID,
    facet_type: str,
    facet_value: str,
    alert_enabled: bool,
) -> Interest:
    """Validate and persist one manually requested Interest."""
    normalized_type, normalized_value = _normalize_preference(facet_type, facet_value)
    return await _upsert_interest(
        session,
        profile_id=profile_id,
        facet_type=normalized_type,
        facet_value=facet_value,
        normalized_value=normalized_value,
        alert_enabled=alert_enabled,
        origin="manual",
        idempotency_key=None,
    )


async def remove_interest(
    session: AsyncSession, *, profile_id: UUID, interest_id: UUID
) -> None:
    """Remove only the named Profile-owned Interest."""
    await session.execute(
        delete(Interest).where(
            Interest.id == interest_id, Interest.profile_id == profile_id
        )
    )


async def apply_concierge_preference(
    session: AsyncSession,
    *,
    profile_id: UUID,
    facet_type: str,
    facet_value: str,
    alert_enabled: bool,
    decision: ConciergeDecision,
    idempotency_key: str,
) -> Interest | None:
    """Persist only an approved or edited concierge preference once."""
    if decision not in {"approved", "edited"}:
        return None
    if not 16 <= len(idempotency_key) <= 128 or any(
        ord(character) < 33 or ord(character) == 127 for character in idempotency_key
    ):
        raise PreferenceValidationError("Invalid idempotency key")

    normalized_type, normalized_value = _normalize_preference(facet_type, facet_value)
    await session.execute(
        select(func.pg_advisory_xact_lock(func.hashtextextended(idempotency_key, 0)))
    )
    existing_audit = await session.scalar(
        select(PreferenceAudit).where(
            PreferenceAudit.idempotency_key == idempotency_key
        )
    )
    if existing_audit is not None:
        same_request = (
            existing_audit.profile_id == profile_id
            and existing_audit.facet_type == normalized_type
            and existing_audit.normalized_value == normalized_value
            and existing_audit.alert_enabled == alert_enabled
        )
        if not same_request:
            raise PreferenceConflictError(
                "Idempotency key was already used for another preference"
            )
        interest = await session.get(Interest, existing_audit.interest_id)
        if interest is None:  # pragma: no cover - foreign key invariant guard
            raise RuntimeError("Preference audit references a missing Interest")
        return interest

    interest = await _upsert_interest(
        session,
        profile_id=profile_id,
        facet_type=normalized_type,
        facet_value=facet_value,
        normalized_value=normalized_value,
        alert_enabled=alert_enabled,
        origin="concierge",
        idempotency_key=idempotency_key,
    )
    session.add(
        PreferenceAudit(
            profile_id=profile_id,
            interest_id=interest.id,
            origin="concierge",
            outcome=decision,
            idempotency_key=idempotency_key,
            facet_type=normalized_type,
            normalized_value=normalized_value,
            alert_enabled=alert_enabled,
        )
    )
    await session.flush()
    return interest


def _event_matches_interest(event: CurrentEvent, interest: Interest) -> bool:
    if interest.facet_type == "borough":
        return (event.borough or "").casefold() == interest.normalized_value
    if interest.facet_type == "category":
        return any(
            category.casefold() == interest.normalized_value
            for category in event.categories or []
        )
    if interest.facet_type == "registration":
        registration = event.registration_status or "not_listed"
        return registration.casefold() == interest.normalized_value
    return False  # pragma: no cover - database constraint guard


async def match_new_events(session: AsyncSession) -> int:
    """Intersect the current Sync Run's new Events with all Interests."""
    new_events = (
        await session.scalars(
            select(CurrentEvent).where(CurrentEvent.lifecycle_status == "new")
        )
    ).all()
    interests = (await session.scalars(select(Interest))).all()
    inserted = 0
    for event in new_events:
        for interest in interests:
            if not _event_matches_interest(event, interest):
                continue
            result = await session.execute(
                insert(MatchedEvent)
                .values(profile_id=interest.profile_id, event_guid=event.guid)
                .on_conflict_do_nothing(
                    index_elements=[MatchedEvent.profile_id, MatchedEvent.event_guid]
                )
                .returning(MatchedEvent.event_guid)
            )
            if result.scalar_one_or_none() is not None:
                inserted += 1
    return inserted
