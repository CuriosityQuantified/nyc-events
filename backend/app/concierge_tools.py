"""The two bounded, read-only Event data operations used by the concierge."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import or_, select

from app.database import get_session_factory
from app.models.event import CurrentEvent
from app.routes.events import _event_to_contract, get_freshness


class CurrentEventSearch(BaseModel):
    """Validated search inputs with a hard result bound."""

    text: str | None = Field(default=None, max_length=200)
    borough: str | None = Field(default=None, max_length=64)
    category: str | None = Field(default=None, max_length=100)
    limit: int = Field(default=10, ge=1, le=25)


async def search_current_events(criteria: CurrentEventSearch) -> dict[str, Any]:
    """Search only the latest current Snapshot in deterministic order."""
    query = select(CurrentEvent)
    if criteria.text:
        term = f"%{criteria.text}%"
        query = query.where(
            or_(CurrentEvent.title.ilike(term), CurrentEvent.description.ilike(term))
        )
    if criteria.borough:
        query = query.where(CurrentEvent.borough == criteria.borough)
    if criteria.category:
        query = query.where(CurrentEvent.categories.contains([criteria.category]))
    query = query.order_by(
        CurrentEvent.start_datetime.asc().nullslast(), CurrentEvent.guid
    ).limit(criteria.limit)

    async with get_session_factory()() as session:
        events = (await session.execute(query)).scalars().all()
    return {
        "events": [_event_to_contract(event) for event in events],
        "freshness": await get_freshness(),
    }


async def get_current_event(guid: str) -> dict[str, Any] | None:
    """Retrieve one current Event by source guid; archival rows stay hidden."""
    if not guid or len(guid) > 255:
        raise ValueError("guid must contain 1 to 255 characters")
    async with get_session_factory()() as session:
        event = await session.get(CurrentEvent, guid)
    if event is None:
        return None
    return {"event": _event_to_contract(event), "freshness": await get_freshness()}
