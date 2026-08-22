"""Events API router — GET /events and GET /events/{guid}."""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any, Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Path, Query
from fastapi.responses import JSONResponse
from sqlalchemy import Date as SQLDate
from sqlalchemy import cast, func, select
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database import get_session_factory
from app.models.event import CurrentEvent, EventRepository, SyncRun
from app.models.subway import SubwayRoute, SubwaySource
from app.provenance import accessibility_evidence, explicit_free_evidence
from app.services.subway import apply_subway_filter

router = APIRouter()
_NEW_YORK = ZoneInfo("America/New_York")

LifecycleClassification = Literal[
    "new", "changed", "unchanged", "cancelled", "expired", "removed"
]


def _text_fact(
    value: str | None, *, provenance: str = "Stated", raw: str | None = None
) -> dict[str, Any]:
    """Build a TextFact dict."""
    if not value and provenance != "Not listed":
        provenance = "Not listed"
    if provenance == "Not listed":
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {
        "value": value,
        "provenance": provenance,
        "raw": raw if raw is not None else value,
    }


def _uri_fact(
    value: str | None, *, provenance: str = "Stated", raw: str | None = None
) -> dict[str, Any]:
    """Build a UriFact dict."""
    if not value:
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {
        "value": value,
        "provenance": provenance,
        "raw": raw if raw is not None else value,
    }


def _date_fact(
    value: str | None, *, provenance: str = "Derived", raw: str | None = None
) -> dict[str, Any]:
    """Build a DateFact dict."""
    if value is None:
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {"value": value, "provenance": provenance, "raw": raw}


def _calendar_date_fact(
    explicit_date: date | None,
    event_datetime: datetime | None,
    *,
    explicit_raw: str | None,
    datetime_raw: str | None,
) -> dict[str, Any]:
    """Use an explicit date, or derive its New York date from the datetime."""
    if explicit_date is not None:
        return _date_fact(explicit_date.isoformat(), raw=explicit_raw)
    if event_datetime is None:
        return _date_fact(None)

    # PostgreSQL returns aware values for TIMESTAMP WITH TIME ZONE. Treat a
    # direct model value without tzinfo as UTC so behavior never depends on
    # the host timezone.
    aware_datetime = (
        event_datetime
        if event_datetime.tzinfo is not None
        else event_datetime.replace(tzinfo=UTC)
    )
    evidence = datetime_raw or event_datetime.isoformat()
    local_date = aware_datetime.astimezone(_NEW_YORK).date().isoformat()
    return _date_fact(local_date, provenance="Derived", raw=evidence)


def _event_date_expression(model: Any) -> Any:
    """Return the canonical New York calendar date SQL expression."""
    return func.coalesce(
        model.start_date,
        cast(func.timezone("America/New_York", model.start_datetime), SQLDate),
    )


def _datetime_fact(
    value: str | None, *, provenance: str = "Derived", raw: str | None = None
) -> dict[str, Any]:
    """Build a DateTimeFact dict."""
    if value is None:
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {"value": value, "provenance": provenance, "raw": raw}


def _derived_boolean_fact(
    value: bool | None, *, raw: str | None = None
) -> dict[str, Any]:
    """Build a derived BooleanFact without turning missing data into false."""
    if value is None:
        return {"value": None, "provenance": "Not listed", "raw": None}
    return {"value": value, "provenance": "Derived", "raw": raw}


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


def _source_url_text(value: Any) -> str | None:
    """Return the source URL string from either supported Socrata shape."""
    if isinstance(value, dict):
        value = value.get("url")
    return value if isinstance(value, str) and value else None


def _event_to_contract(event: CurrentEvent | EventRepository) -> dict[str, Any]:
    """Convert an Event model instance to the contract Event shape."""
    raw = event.raw_data or {}
    free_raw = explicit_free_evidence(raw)
    accessibility_raw = accessibility_evidence(raw)

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

    start_dt_val = event.start_datetime.isoformat() if event.start_datetime else None
    end_dt_val = event.end_datetime.isoformat() if event.end_datetime else None

    start_date_fact = _calendar_date_fact(
        event.start_date,
        event.start_datetime,
        explicit_raw=start_date_raw,
        datetime_raw=start_dt_raw,
    )
    end_date_fact = _calendar_date_fact(
        event.end_date,
        event.end_datetime,
        explicit_raw=end_date_raw,
        datetime_raw=end_dt_raw,
    )

    # Borough
    borough_raw = raw.get("parkids")
    borough_val = event.borough

    return {
        "guid": event.guid,
        "title": _text_fact(event.title, raw=raw.get("title")),
        "description": _text_fact(event.description, raw=raw.get("description")),
        "official_event_url": _uri_fact(
            event.official_event_url, raw=_source_url_text(raw.get("link"))
        ),
        "location_id": _text_fact(event.location_id, raw=raw.get("parkids")),
        "location_name": _text_fact(event.location_name, raw=raw.get("location")),
        "start_date": start_date_fact,
        "end_date": end_date_fact,
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
        "is_free_explicit": _derived_boolean_fact(event.is_free_explicit, raw=free_raw),
        "accessibility_mentioned": _derived_boolean_fact(
            event.accessibility_mentioned, raw=accessibility_raw
        ),
    }


@router.get("/events")
async def list_events(
    borough: str | None = Query(default=None, min_length=1, max_length=100),
    category: str | None = Query(default=None, min_length=1, max_length=100),
    date_from: date | None = None,
    date_to: date | None = None,
    registration: Literal["required", "not_required", "closed", "not_listed"]
    | None = Query(default=None),
    subway_line: str | None = Query(default=None, min_length=1, max_length=8),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Any:
    """Return a paginated list of events with optional filters."""
    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(
            status_code=400, detail="date_from must be on or before date_to"
        )

    applied_facets: dict[str, list[str]] = {}
    filters = []
    event_date = _event_date_expression(CurrentEvent)
    if borough is not None:
        applied_facets["borough"] = [borough]
        filters.append(func.lower(CurrentEvent.borough) == borough.casefold())
    if category is not None:
        applied_facets["category"] = [category]
        category_values = func.jsonb_array_elements_text(
            CurrentEvent.categories
        ).table_valued("value")
        filters.append(
            select(1)
            .select_from(category_values)
            .where(func.lower(category_values.c.value) == category.casefold())
            .exists()
        )
    if date_from is not None:
        applied_facets["date_from"] = [date_from.isoformat()]
        filters.append(event_date >= date_from)
    if date_to is not None:
        applied_facets["date_to"] = [date_to.isoformat()]
        filters.append(event_date <= date_to)
    if registration is not None:
        applied_facets["registration"] = [registration]
        if registration == "not_listed":
            filters.append(CurrentEvent.registration_status.is_(None))
        else:
            filters.append(CurrentEvent.registration_status == registration)
    normalized_line = subway_line.strip().upper() if subway_line is not None else None
    if normalized_line is not None:
        applied_facets["subway_line"] = [normalized_line]

    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            query = select(CurrentEvent).where(*filters)
            nearest = None
            transit_source = None
            if normalized_line is not None:
                transit_source = await session.scalar(
                    select(SubwaySource)
                    .join(SubwayRoute, SubwayRoute.source_id == SubwaySource.source_id)
                    .where(SubwayRoute.route_id == normalized_line)
                )
                if transit_source is None:
                    return JSONResponse(
                        status_code=400, content={"error": "Unknown subway line"}
                    )
                query, nearest = apply_subway_filter(query, normalized_line)
            total = (
                await session.scalar(select(func.count()).select_from(query.subquery()))
                or 0
            )
            offset = (page - 1) * page_size
            query = query.order_by(
                event_date.asc().nullslast(),
                CurrentEvent.start_datetime.asc().nullslast(),
                CurrentEvent.guid,
            )
            query = query.offset(offset).limit(page_size)
            if nearest is not None:
                query = query.add_columns(
                    nearest.c.stop_id,
                    nearest.c.stop_name,
                    nearest.c.distance_miles,
                )
            result = await session.execute(query)
            rows = result.all()
        except SQLAlchemyError as error:
            raise HTTPException(
                status_code=503, detail="Event database unavailable"
            ) from error

        events = []
        for row in rows:
            event_contract = _event_to_contract(row[0])
            if nearest is not None:
                event_contract["subway_proximity"] = {
                    "line_id": normalized_line,
                    "nearest_stop": {"id": row[1], "name": row[2]},
                    "straight_line_distance_miles": row[3],
                }
            events.append(event_contract)
        response = {
            "events": events,
            "page": page,
            "page_size": page_size,
            "total": total,
            "applied_facets": applied_facets,
        }
        if transit_source is not None:
            response["transit_source"] = {
                "id": transit_source.source_id,
                "attribution": transit_source.attribution,
                "source_url": transit_source.source_url,
                "last_updated": transit_source.updated_at.isoformat(),
            }
        return response


@router.get("/events/{guid}")
async def get_event(guid: str = Path(min_length=1, max_length=255)) -> dict[str, Any]:
    """Return a single event by its source guid."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            result = await session.execute(
                select(CurrentEvent).where(CurrentEvent.guid == guid)
            )
        except SQLAlchemyError as error:
            raise HTTPException(
                status_code=503, detail="Event database unavailable"
            ) from error
        event = result.scalar_one_or_none()
        if event is None:
            raise HTTPException(status_code=404, detail="Event not found")
        return _event_to_contract(event)


@router.get("/event-changes")
async def list_event_changes(
    classification: LifecycleClassification | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=100),
) -> dict[str, Any]:
    """Expose latest Snapshot lifecycle classifications and content hashes."""
    filters = []
    if classification is not None:
        filters.append(EventRepository.lifecycle_status == classification)

    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            query = select(EventRepository).where(*filters)
            total = (
                await session.scalar(select(func.count()).select_from(query.subquery()))
                or 0
            )
            events = (
                await session.scalars(
                    query.order_by(EventRepository.guid)
                    .offset((page - 1) * page_size)
                    .limit(page_size)
                )
            ).all()
            snapshot_at = await session.scalar(
                select(func.max(CurrentEvent.snapshot_at))
            )
        except SQLAlchemyError as error:
            raise HTTPException(
                status_code=503, detail="Event database unavailable"
            ) from error

    return {
        "events": [
            {
                "guid": event.guid,
                "classification": event.lifecycle_status,
                "content_hash": event.content_hash,
                "official_event_url": event.official_event_url,
            }
            for event in events
        ],
        "snapshot_at": snapshot_at.isoformat() if snapshot_at else None,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/freshness")
async def get_freshness() -> dict[str, Any]:
    """Report the latest successful Snapshot and failed-attempt evidence."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            latest_success = await session.scalar(
                select(SyncRun)
                .where(SyncRun.status == "succeeded")
                .order_by(SyncRun.finished_at.desc())
                .limit(1)
            )
            row_count = await session.scalar(
                select(func.count()).select_from(CurrentEvent)
            )
        except SQLAlchemyError as error:
            raise HTTPException(
                status_code=503, detail="Event database unavailable"
            ) from error

    successful_at = latest_success.finished_at if latest_success else None
    stale = True
    if successful_at is not None:
        age = datetime.now(UTC) - successful_at.astimezone(UTC)
        stale = age.total_seconds() > get_settings().snapshot_stale_after_seconds
    stale_after_seconds = get_settings().snapshot_stale_after_seconds
    return {
        "last_successful_sync": _text_fact(
            successful_at.isoformat() if successful_at else None,
            provenance="Derived" if successful_at else "Not listed",
            raw="Latest successful Sync Run" if successful_at else None,
        ),
        "snapshot_row_count": {
            "value": row_count if latest_success else None,
            "provenance": "Derived" if latest_success else "Not listed",
            "raw": "current_events row count" if latest_success else None,
        },
        "is_stale": {
            "value": stale,
            "provenance": "Derived",
            "raw": (
                "No successful Sync Run"
                if latest_success is None
                else f"stale after {stale_after_seconds} seconds"
            ),
        },
    }


@router.get("/ingestion-health")
async def get_ingestion_health() -> dict[str, Any]:
    """Expose secret-free evidence for the latest attempted synchronization."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            latest = await session.scalar(
                select(SyncRun)
                .order_by(SyncRun.started_at.desc(), SyncRun.id.desc())
                .limit(1)
            )
            row_count = await session.scalar(
                select(func.count()).select_from(CurrentEvent)
            )
        except SQLAlchemyError as error:
            raise HTTPException(
                status_code=503, detail="Event database unavailable"
            ) from error
    return {
        "status": latest.status if latest else "never_run",
        "last_attempted_sync": latest.started_at.isoformat() if latest else None,
        "last_finished_sync": (
            latest.finished_at.isoformat() if latest and latest.finished_at else None
        ),
        "row_count": row_count,
        "failure_code": latest.failure_code if latest else None,
    }
