"""Canonical Profile-owned Saved Event operations."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import CurrentEvent
from app.models.profile import SavedEvent


class EventNotCurrentError(ValueError):
    """Raised when an Event is not part of the latest successful Snapshot."""


async def save_current_event(
    session: AsyncSession, *, profile_id: UUID, event_id: str
) -> bool:
    """Idempotently save one current Event for a trusted Profile.

    Returns ``True`` when this call created the Saved row and ``False`` when the
    Event was already saved.
    """
    normalized_event_id = event_id.strip()
    if not normalized_event_id or len(normalized_event_id) > 255:
        raise EventNotCurrentError("Event not found in the current Snapshot")

    event_exists = await session.scalar(
        select(CurrentEvent.guid).where(CurrentEvent.guid == normalized_event_id)
    )
    if event_exists is None:
        raise EventNotCurrentError("Event not found in the current Snapshot")

    inserted = await session.scalar(
        insert(SavedEvent)
        .values(profile_id=profile_id, event_guid=normalized_event_id)
        .on_conflict_do_nothing(
            index_elements=[SavedEvent.profile_id, SavedEvent.event_guid]
        )
        .returning(SavedEvent.event_guid)
    )
    return inserted is not None
