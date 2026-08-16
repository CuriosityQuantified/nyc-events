"""Server-owned SQL search over the latest complete Event Snapshot."""

from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import Text, cast, func, select

from app.database import get_session_factory
from app.models.event import CurrentEvent
from app.routes.events import _event_date_expression, _event_to_contract, get_freshness


class CurrentEventSearch(BaseModel):
    """Structured, bounded search over the latest ``current_events`` Snapshot."""

    model_config = ConfigDict(extra="forbid")

    query: str | None = Field(default=None, min_length=1, max_length=200)
    event_id: str | None = Field(default=None, min_length=1, max_length=255)
    borough: str | None = Field(default=None, min_length=1, max_length=100)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    date_from: date | None = None
    date_to: date | None = None
    registration: Literal["required", "not_required", "closed", "not_listed"] | None = (
        None
    )
    is_free_explicit: bool | None = None
    accessibility_mentioned: bool | None = None
    latitude_min: float | None = Field(default=None, ge=-90, le=90)
    latitude_max: float | None = Field(default=None, ge=-90, le=90)
    longitude_min: float | None = Field(default=None, ge=-180, le=180)
    longitude_max: float | None = Field(default=None, ge=-180, le=180)
    limit: int = Field(default=10, ge=1, le=25)

    @model_validator(mode="after")
    def validate_ranges(self) -> CurrentEventSearch:
        if (
            self.date_from is not None
            and self.date_to is not None
            and self.date_from > self.date_to
        ):
            raise ValueError("date_from must be on or before date_to")
        if (
            self.latitude_min is not None
            and self.latitude_max is not None
            and self.latitude_min > self.latitude_max
        ):
            raise ValueError("latitude_min must be at most latitude_max")
        if (
            self.longitude_min is not None
            and self.longitude_max is not None
            and self.longitude_min > self.longitude_max
        ):
            raise ValueError("longitude_min must be at most longitude_max")
        return self


def _literal_contains(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def _all_current_event_values() -> Any:
    """Build one searchable SQL text projection from every table column."""
    columns = (
        CurrentEvent.guid,
        CurrentEvent.title,
        CurrentEvent.description,
        CurrentEvent.official_event_url,
        CurrentEvent.location_key,
        CurrentEvent.location_id,
        CurrentEvent.location_name,
        CurrentEvent.start_date,
        CurrentEvent.end_date,
        CurrentEvent.start_datetime,
        CurrentEvent.end_datetime,
        CurrentEvent.categories,
        CurrentEvent.latitude,
        CurrentEvent.longitude,
        CurrentEvent.borough,
        CurrentEvent.registration_status,
        CurrentEvent.registration_description,
        CurrentEvent.is_free_explicit,
        CurrentEvent.accessibility_mentioned,
        CurrentEvent.raw_data,
        CurrentEvent.content_hash,
        CurrentEvent.lifecycle_status,
        CurrentEvent.synced_at,
        CurrentEvent.snapshot_at,
    )
    return func.concat_ws(" ", *(cast(column, Text) for column in columns))


async def search_current_events(criteria: CurrentEventSearch) -> dict[str, Any]:
    """Search ``current_events`` using validated arguments and no arbitrary SQL."""
    filters: list[Any] = []
    event_date = _event_date_expression(CurrentEvent)

    if criteria.query is not None:
        filters.append(
            _all_current_event_values().ilike(
                _literal_contains(criteria.query), escape="\\"
            )
        )
    if criteria.event_id is not None:
        filters.append(CurrentEvent.guid == criteria.event_id)
    if criteria.borough is not None:
        filters.append(func.lower(CurrentEvent.borough) == criteria.borough.casefold())
    if criteria.category is not None:
        category_values = func.jsonb_array_elements_text(
            CurrentEvent.categories
        ).table_valued("value")
        filters.append(
            select(1)
            .select_from(category_values)
            .where(func.lower(category_values.c.value) == criteria.category.casefold())
            .exists()
        )
    if criteria.location is not None:
        filters.append(
            func.concat_ws(
                " ",
                CurrentEvent.location_key,
                CurrentEvent.location_id,
                CurrentEvent.location_name,
            ).ilike(_literal_contains(criteria.location), escape="\\")
        )
    if criteria.date_from is not None:
        filters.append(event_date >= criteria.date_from)
    if criteria.date_to is not None:
        filters.append(event_date <= criteria.date_to)
    if criteria.registration is not None:
        if criteria.registration == "not_listed":
            filters.append(CurrentEvent.registration_status.is_(None))
        else:
            filters.append(CurrentEvent.registration_status == criteria.registration)
    if criteria.is_free_explicit is not None:
        filters.append(CurrentEvent.is_free_explicit.is_(criteria.is_free_explicit))
    if criteria.accessibility_mentioned is not None:
        filters.append(
            CurrentEvent.accessibility_mentioned.is_(criteria.accessibility_mentioned)
        )
    if criteria.latitude_min is not None:
        filters.append(CurrentEvent.latitude >= criteria.latitude_min)
    if criteria.latitude_max is not None:
        filters.append(CurrentEvent.latitude <= criteria.latitude_max)
    if criteria.longitude_min is not None:
        filters.append(CurrentEvent.longitude >= criteria.longitude_min)
    if criteria.longitude_max is not None:
        filters.append(CurrentEvent.longitude <= criteria.longitude_max)

    base_query = select(CurrentEvent).where(*filters)
    ordered_query = base_query.order_by(
        event_date.asc().nullslast(),
        CurrentEvent.start_datetime.asc().nullslast(),
        CurrentEvent.guid,
    ).limit(criteria.limit)

    async with get_session_factory()() as session:
        total = (
            await session.scalar(
                select(func.count()).select_from(base_query.subquery())
            )
            or 0
        )
        events = (await session.scalars(ordered_query)).all()

    serialized_events = [
        {"event_id": event.guid, **_event_to_contract(event)} for event in events
    ]
    return {
        "events": serialized_events,
        "total": total,
        "limit": criteria.limit,
        "truncated": total > len(serialized_events),
        "freshness": await get_freshness(),
    }
