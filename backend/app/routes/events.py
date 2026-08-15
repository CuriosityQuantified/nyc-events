"""Events API router — GET /events and GET /events/{guid}."""

from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session_factory
from app.models.event import Event
from app.socrata import BOROUGHS

router = APIRouter()

_NY_TZ_NAME = "America/New_York"


def _text_fact(
    value: str | None, *, provenance: str = "Stated", raw: str | None = None
) -> dict[str, Any]:
    """Build a TextFact dict."""
    if not value and provenance != "Not listed":
        provenance = "Not listed"
    if provenance == "Not listed":
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {"value": value, "provenance": provenance, "raw": raw if raw is not None else value}


def _uri_fact(
    value: str | None, *, provenance: str = "Stated", raw: str | None = None
) -> dict[str, Any]:
    """Build a UriFact dict."""
    if not value:
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {"value": value, "provenance": provenance, "raw": raw if raw is not None else value}


def _date_fact(
    value: str | None, *, provenance: str = "Derived", raw: str | None = None
) -> dict[str, Any]:
    """Build a DateFact dict."""
    if value is None:
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {"value": value, "provenance": provenance, "raw": raw}


def _datetime_fact(
    value: str | None, *, provenance: str = "Derived", raw: str | None = None
) -> dict[str, Any]:
    """Build a DateTimeFact dict."""
    if value is None:
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {"value": value, "provenance": provenance, "raw": raw}


def _boolean_fact(
    value: bool | None, *, provenance: str = "Not listed", raw: str | None = None
) -> dict[str, Any]:
    """Build a BooleanFact dict."""
    if provenance == "Not listed":
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {"value": value, "provenance": provenance, "raw": raw}


def _registration_fact(
    value: str | None,
    *,
    provenance: str,
    raw: str | None = None,
) -> dict[str, Any]:
    """Build a RegistrationFact dict."""
    if provenance == "Not listed":
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {"value": value, "provenance": provenance, "raw": raw}


def _event_to_contract(event: Event) -> dict[str, Any]:
    """Convert an Event model instance to the contract Event shape."""
    raw = event.raw_data or {}

    # Coordinates
    coords_raw = raw.get("coordinates", "")
    coord_list: list[dict[str, float]] | None = None
    coords_provenance = "Not listed"
    if event.latitude is not None and event.longitude is not None:
        coords_provenance = "Stated"
        coord_list = []
        if coords_raw:
            for pair in coords_raw.split(";"):
                parts = pair.split(",", 1)
                if len(parts) == 2:
                    try:
                        coord_list.append(
                            {
                                "latitude": float(parts[0].strip()),
                                "longitude": float(parts[1].strip()),
                            }
                        )
                    except ValueError:
                        continue

    # Categories
    cat_raw = raw.get("categories", "")
    cats_provenance = "Stated" if event.categories else "Not listed"
    cats_value = event.categories if event.categories else None

    # Registration
    reg_status = event.registration_status
    reg_desc_raw = raw.get("registration_description", "")
    if reg_status is not None:
        reg_provenance = "Derived"
        reg_raw = reg_desc_raw if reg_desc_raw else None
    else:
        reg_provenance = "Not listed"
        reg_raw = None

    # Registration description
    reg_desc_value = event.registration_description
    if reg_desc_value:
        reg_desc_provenance = "Stated"
    else:
        reg_desc_provenance = "Not listed"
        reg_desc_value = None

    # Start/end dates
    start_date_raw = raw.get("startdate")
    end_date_raw = raw.get("enddate")
    start_dt_raw = raw.get("starttime")
    end_dt_raw = raw.get("endtime")

    start_date_val = event.start_date.isoformat() if event.start_date else None
    end_date_val = event.end_date.isoformat() if event.end_date else None
    start_dt_val = event.start_datetime.isoformat() if event.start_datetime else None
    end_dt_val = event.end_datetime.isoformat() if event.end_datetime else None

    # Borough
    borough_raw = raw.get("parkids")
    borough_val = event.borough

    return {
        "guid": event.guid,
        "title": _text_fact(event.title, raw=raw.get("title")),
        "description": _text_fact(event.description, raw=raw.get("description")),
        "official_event_url": _uri_fact(
            event.official_event_url, raw=raw.get("link")
        ),
        "location_id": _text_fact(event.location_id, raw=raw.get("parkids")),
        "location_name": _text_fact(event.location_name, raw=raw.get("location")),
        "start_date": _date_fact(start_date_val, raw=start_date_raw),
        "end_date": _date_fact(end_date_val, raw=end_date_raw),
        "start_datetime": _datetime_fact(start_dt_val, raw=start_dt_raw),
        "end_datetime": _datetime_fact(end_dt_val, raw=end_dt_raw),
        "categories": {
            "value": cats_value,
            "provenance": cats_provenance,
            "raw": cat_raw if cat_raw else None,
        },
        "coordinates": {
            "value": coord_list,
            "provenance": coords_provenance,
            "raw": coords_raw if coords_raw else None,
        },
        "borough": _text_fact(borough_val, provenance="Derived", raw=borough_raw),
        "registration_status": _registration_fact(
            reg_status, provenance=reg_provenance, raw=reg_raw
        ),
        "registration_description": _text_fact(
            reg_desc_value,
            provenance=reg_desc_provenance,
            raw=raw.get("registration_description") or None,
        ),
        "is_free_explicit": _boolean_fact(event.is_free_explicit),
        "accessibility_mentioned": _boolean_fact(event.accessibility_mentioned),
    }


@router.get("/events")
async def list_events(
    borough: str | None = None,
    category: str | None = None,
    registration: str | None = None,
    location: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict[str, Any]:
    """Return a paginated list of events with optional filters."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        query = select(Event)

        if borough:
            query = query.where(Event.borough == borough)
        if category:
            # JSON array containment — check if any category matches
            query = query.where(
                Event.categories.op("@>")(f'["{category}"]')
            )
        if registration:
            if registration == "not_listed":
                query = query.where(Event.registration_status.is_(None))
            else:
                query = query.where(Event.registration_status == registration)
        if location:
            query = query.where(Event.location_id == location)
        if date_from:
            query = query.where(Event.start_date >= date_from)
        if date_to:
            query = query.where(Event.start_date <= date_to)

        # Count total matching rows
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await session.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(Event.start_datetime, Event.guid)
        query = query.offset(offset).limit(page_size)

        result = await session.execute(query)
        events = result.scalars().all()

        return {
            "events": [_event_to_contract(e) for e in events],
            "page": page,
            "page_size": page_size,
            "total": total,
            "applied_facets": {},
        }


@router.get("/events/{guid}")
async def get_event(guid: str) -> dict[str, Any]:
    """Return a single event by its source guid."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        result = await session.execute(
            select(Event).where(Event.guid == guid)
        )
        event = result.scalar_one_or_none()
        if event is None:
            raise HTTPException(status_code=404, detail="Event not found")
        return _event_to_contract(event)
