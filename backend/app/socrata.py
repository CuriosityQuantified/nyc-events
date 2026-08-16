"""Socrata NYC Parks Events API client with pagination and retry."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
from datetime import UTC, date, datetime
from time import monotonic
from typing import Any, Protocol
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.event import CurrentEvent, EventRepository, SyncRun
from app.provenance import accessibility_evidence, explicit_free_evidence

logger = logging.getLogger(__name__)

# Patterns that match credential values in log output.
_CREDENTIAL_PATTERN = re.compile(
    r"(api[_-]?key|secret|token|authorization|password)"
    r"\s*[:=]\s*\S+",
    re.IGNORECASE,
)

BOROUGHS: dict[str, str] = {
    "M": "Manhattan",
    "B": "Brooklyn",
    "Q": "Queens",
    "R": "Staten Island",
    "X": "Bronx",
}

_NY_TZ = ZoneInfo("America/New_York")

# Retry configuration
_MAX_RETRIES = 3
_BASE_BACKOFF_SECONDS = 1.0
_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}

# Pagination
_DEFAULT_PAGE_SIZE = 1000
_ALLOWED_SOCRATA_HOST = "data.cityofnewyork.us"
_SOCRATA_QUERY = "SELECT * ORDER BY startdate ASC, starttime ASC"

_CANCELLED_VALUES = {"cancelled", "canceled"}


class CredentialFilter(logging.Filter):
    """Prevent credential values from appearing in log output."""

    def __init__(self, secret_values: list[str] | None = None) -> None:
        super().__init__()
        self._secret_values = [v for v in (secret_values or []) if len(v) >= 8]

    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        for secret in self._secret_values:
            msg = msg.replace(secret, "[REDACTED]")
        msg = _CREDENTIAL_PATTERN.sub(r"\1=[REDACTED]", msg)
        if msg != record.getMessage():
            record.msg = msg
            record.args = ()
        return True


class SocrataError(Exception):
    """Raised when the Socrata API returns an unrecoverable error."""


class EventSource(Protocol):
    """The narrow transport contract used by the synchronization job."""

    async def fetch_all_events(self) -> list[dict[str, Any]]: ...


def _validated_endpoint(value: str) -> str:
    """Allow only the fixed NYC Open Data HTTPS query origin."""
    parsed = urlparse(value)
    if (
        parsed.scheme != "https"
        or parsed.hostname != _ALLOWED_SOCRATA_HOST
        or parsed.username is not None
        or parsed.password is not None
        or parsed.port not in (None, 443)
        or not parsed.path.startswith("/api/v3/views/")
        or not parsed.path.endswith("/query.json")
        or parsed.query
        or parsed.fragment
    ):
        raise SocrataError(
            "SOCRATA_QUERY_ENDPOINT is not an approved NYC Open Data query URL"
        )
    return value


class SocrataClient:
    """Async client for the Socrata NYC Parks Events API.

    Uses HTTP Basic authentication (API key ID / secret) and an
    X-App-Token header. Paginates with POST, retries on transient
    server errors with exponential backoff.
    """

    def __init__(
        self,
        *,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        settings = get_settings()
        self._endpoint = _validated_endpoint(settings.socrata_query_endpoint)
        self._api_key_id = settings.socrata_api_key_id
        self._api_key_secret = settings.socrata_api_key_secret
        self._app_token = settings.socrata_app_token
        self._page_size = _DEFAULT_PAGE_SIZE

        # Install credential filter on the module logger.
        _filter = CredentialFilter(
            secret_values=[
                self._api_key_id,
                self._api_key_secret,
                self._app_token,
            ]
        )
        logger.addFilter(_filter)

        if http_client is not None:
            self._client = http_client
            self._owns_client = False
        else:
            self._client = httpx.AsyncClient()
            self._owns_client = True

    async def close(self) -> None:
        """Close the HTTP client if this instance created it."""
        if self._owns_client:
            await self._client.aclose()

    async def _post_with_retry(self, payload: dict[str, Any]) -> httpx.Response:
        """POST to the Socrata endpoint with exponential-backoff retry."""
        auth = (
            httpx.BasicAuth(self._api_key_id, self._api_key_secret)
            if self._api_key_id and self._api_key_secret
            else httpx.USE_CLIENT_DEFAULT
        )

        headers: dict[str, str] = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if self._app_token:
            headers["X-App-Token"] = self._app_token

        last_exc: Exception | None = None
        for attempt in range(_MAX_RETRIES + 1):
            try:
                response = await self._client.post(
                    self._endpoint,
                    json=payload,
                    auth=auth,
                    headers=headers,
                    timeout=60.0,
                )
                if response.status_code in _RETRYABLE_STATUS_CODES:
                    last_exc = SocrataError(f"Server returned {response.status_code}")
                    if attempt < _MAX_RETRIES:
                        delay = _BASE_BACKOFF_SECONDS * (2**attempt)
                        logger.warning(
                            "Socrata returned %d, retry %d after %.1fs",
                            response.status_code,
                            attempt + 1,
                            delay,
                        )
                        await asyncio.sleep(delay)
                        continue
                    raise last_exc

                response.raise_for_status()
                return response

            except httpx.HTTPStatusError:
                raise
            except SocrataError:
                raise
            except httpx.HTTPError as exc:
                last_exc = exc
                if attempt < _MAX_RETRIES:
                    delay = _BASE_BACKOFF_SECONDS * (2**attempt)
                    await asyncio.sleep(delay)
                    continue
                raise SocrataError(
                    f"Request failed after {_MAX_RETRIES + 1} attempts"
                ) from last_exc

        # Unreachable, but satisfies type checkers.
        raise SocrataError("Retry loop exited unexpectedly")  # pragma: no cover

    async def _fetch_page(self, page_number: int) -> list[dict[str, Any]]:
        """Fetch one page of events from the Socrata API."""
        payload = {
            "query": _SOCRATA_QUERY,
            "page": {"pageNumber": page_number, "pageSize": self._page_size},
            "includeSynthetic": False,
        }
        response = await self._post_with_retry(payload)
        try:
            data = response.json()
        except ValueError as exc:
            raise SocrataError("Socrata returned invalid JSON") from exc
        if not isinstance(data, list) or not all(isinstance(row, dict) for row in data):
            raise SocrataError("Socrata response must be a JSON array of objects")
        return data

    async def fetch_all_events(self) -> list[dict[str, Any]]:
        """Page through all events until an empty page returns."""
        all_rows: list[dict[str, Any]] = []
        page_number = 1

        while True:
            page = await self._fetch_page(page_number)
            if not page:
                break
            all_rows.extend(page)
            page_number += 1

        logger.info("Fetched %d total events from Socrata", len(all_rows))
        return all_rows


def _parse_date(raw: str | None) -> str | None:
    """Convert MM/DD/YYYY to ISO date string, or return None."""
    if not raw:
        return None
    try:
        return datetime.strptime(raw.strip(), "%m/%d/%Y").date().isoformat()
    except ValueError:
        return None


def _parse_datetime(raw: str | None) -> datetime | None:
    """Convert 'YYYY-MM-DD HH:MM:SS' to a timezone-aware datetime."""
    if not raw:
        return None
    try:
        return datetime.strptime(raw.strip(), "%Y-%m-%d %H:%M:%S").replace(
            tzinfo=_NY_TZ
        )
    except ValueError:
        return None


def _parse_coordinates(
    raw: str | None,
) -> tuple[float | None, float | None, list[dict[str, float]]]:
    """Parse coordinate string into (lat, lon, coordinate_list).

    Returns the first coordinate pair as lat/lon for the model, and the
    full list for the contract response.
    """
    if not raw or not raw.strip():
        return None, None, []

    coords: list[dict[str, float]] = []
    for pair in raw.split(";"):
        parts = pair.split(",", 1)
        if len(parts) == 2:
            try:
                lat = float(parts[0].strip())
                lon = float(parts[1].strip())
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    continue
                coords.append({"latitude": lat, "longitude": lon})
            except ValueError:
                continue

    if coords:
        return coords[0]["latitude"], coords[0]["longitude"], coords
    return None, None, []


def _derive_borough(parkids: str | None) -> str | None:
    """Derive borough name from the first character of parkids."""
    if not parkids or not parkids.strip():
        return None
    return BOROUGHS.get(parkids.strip()[0])


def _normalize_socrata_url(value: Any, field_name: str) -> str | None:
    """Normalize a Socrata URL string or object without changing the raw row."""
    if value is None:
        return None
    if isinstance(value, dict):
        if "url" not in value or not isinstance(value["url"], str):
            raise SocrataError(f"Socrata {field_name} object must contain a string url")
        value = value["url"]
    elif not isinstance(value, str):
        raise SocrataError(f"Socrata {field_name} must be a string, object, or null")

    normalized = value.strip()
    if not normalized:
        return None
    if any(ord(character) < 32 or ord(character) == 127 for character in normalized):
        raise SocrataError(f"Socrata {field_name} contains control characters")

    try:
        parsed = urlparse(normalized)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError as exc:
        raise SocrataError(f"Socrata {field_name} is malformed") from exc
    if (
        parsed.scheme.casefold() not in {"http", "https"}
        or hostname is None
        or parsed.username is not None
        or parsed.password is not None
        or (port is not None and not 1 <= port <= 65535)
    ):
        raise SocrataError(f"Socrata {field_name} is not a safe HTTP URL")
    return normalized


def _optional_text(value: Any, field_name: str) -> str | None:
    """Normalize an optional source string or reject an unsupported shape."""
    if value is None:
        return None
    if not isinstance(value, str):
        raise SocrataError(f"Socrata {field_name} must be a string or null")
    normalized = value.strip()
    return normalized or None


def _derive_registration(
    registration_url: Any,
    registration_description: str | None,
) -> tuple[str | None, str]:
    """Derive registration status and provenance from source fields."""
    normalized_url = _normalize_socrata_url(registration_url, "registration_url")
    desc = (registration_description or "").strip()
    lowered = desc.casefold()

    if "closed" in lowered:
        return "closed", "Derived"
    if "not required" in lowered:
        return "not_required", "Derived"
    if normalized_url or "required" in lowered:
        return "required", "Derived"
    return None, "Not listed"


def _parse_categories(raw: str | None) -> list[str]:
    """Split pipe-delimited categories into a list."""
    if not raw:
        return []
    return [c.strip() for c in raw.split("|") if c.strip()]


def _location_key(
    location_id: str | None, coordinates: list[dict[str, float]]
) -> str | None:
    """Build Location identity from source ID and normalized coordinates."""
    stable_id = (location_id or "").strip()
    if not stable_id or not coordinates:
        return None
    normalized = ";".join(
        f"{item['latitude']:.6f},{item['longitude']:.6f}" for item in coordinates
    )
    return f"{stable_id}|{normalized}"


def _content_hash(row: dict[str, Any]) -> str:
    """Return a stable digest of the complete source row."""
    canonical = json.dumps(
        row,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode()).hexdigest()


def _is_explicitly_cancelled(row: dict[str, Any]) -> bool:
    """Recognize only explicit source cancellation evidence."""
    for field in ("cancelled", "canceled", "is_cancelled", "is_canceled"):
        if row.get(field) is True:
            return True
    for field in ("status", "event_status", "cancellation_status"):
        value = row.get(field)
        if isinstance(value, str) and value.strip().casefold() in _CANCELLED_VALUES:
            return True
    title = row.get("title")
    if not isinstance(title, str):
        return False
    normalized = title.strip().casefold()
    return any(
        normalized == value
        or normalized.startswith(f"{value}:")
        or normalized.startswith(f"{value} -")
        for value in _CANCELLED_VALUES
    )


def _missing_classification(event: EventRepository, snapshot_at: datetime) -> str:
    """Classify an absent row without treating absence as cancellation."""
    if event.lifecycle_status == "cancelled":
        return "cancelled"
    if event.end_datetime is not None:
        end_datetime = event.end_datetime
        if end_datetime.tzinfo is None:
            end_datetime = end_datetime.replace(tzinfo=UTC)
        if end_datetime.astimezone(UTC) < snapshot_at:
            return "expired"
    if event.end_date is not None and event.end_date < snapshot_at.date():
        return "expired"
    return "removed"


def _present_classification(
    values: dict[str, Any], existing: EventRepository | None
) -> str:
    """Classify one row that is present in the new Snapshot."""
    if _is_explicitly_cancelled(values["raw_data"]):
        return "cancelled"
    if existing is None:
        return "new"
    if existing.content_hash != values["content_hash"]:
        return "changed"
    return "unchanged"


def parse_event(row: dict[str, Any]) -> dict[str, Any]:
    """Convert a Socrata row dict to Event model field values.

    Returns a dict suitable for constructing or updating an Event model
    instance.
    """
    guid = row.get("guid")
    title = row.get("title")
    if not isinstance(guid, str) or not guid.strip():
        raise SocrataError("Socrata row is missing a non-empty guid")
    if not isinstance(title, str) or not title.strip():
        raise SocrataError(f"Socrata row {guid!r} is missing a non-empty title")

    guid = guid.strip()
    title = title.strip()
    description = _optional_text(row.get("description"), "description")
    location_id = _optional_text(row.get("parkids"), "parkids")
    location_name = _optional_text(row.get("location"), "location")
    start_date = _optional_text(row.get("startdate"), "startdate")
    end_date = _optional_text(row.get("enddate"), "enddate")
    start_time = _optional_text(row.get("starttime"), "starttime")
    end_time = _optional_text(row.get("endtime"), "endtime")
    categories = _optional_text(row.get("categories"), "categories")
    coordinate_text = _optional_text(row.get("coordinates"), "coordinates")
    registration_description = _optional_text(
        row.get("registration_description"), "registration_description"
    )
    lat, lon, coordinates_list = _parse_coordinates(coordinate_text)
    official_event_url = _normalize_socrata_url(row.get("link"), "link")
    reg_status, _reg_prov = _derive_registration(
        row.get("registration_url"),
        registration_description,
    )
    free_evidence = explicit_free_evidence(row)
    access_evidence = accessibility_evidence(row)

    return {
        "guid": guid,
        "title": title,
        "description": description,
        "official_event_url": official_event_url,
        "location_key": _location_key(location_id, coordinates_list),
        "location_id": location_id,
        "location_name": location_name,
        "start_date": _parse_date(start_date),
        "end_date": _parse_date(end_date),
        "start_datetime": _parse_datetime(start_time),
        "end_datetime": _parse_datetime(end_time),
        "categories": _parse_categories(categories),
        "latitude": lat,
        "longitude": lon,
        "borough": _derive_borough(location_id),
        "registration_status": reg_status,
        "registration_description": registration_description,
        "is_free_explicit": True if free_evidence is not None else None,
        "accessibility_mentioned": True if access_evidence is not None else None,
        "raw_data": row,
        "content_hash": _content_hash(row),
    }


async def ingest_events(session: AsyncSession, rows: list[dict[str, Any]]) -> int:
    """Atomically archive a valid Snapshot and replace the current dataset."""
    if not rows:
        raise SocrataError("Socrata returned an empty Snapshot")

    parsed: list[dict[str, Any]] = []
    seen: set[str] = set()
    snapshot_at = datetime.now(UTC)
    for row in rows:
        values = parse_event(row)
        if values["guid"] in seen:
            raise SocrataError(f"Socrata Snapshot repeats guid {values['guid']!r}")
        seen.add(values["guid"])
        if values["start_date"]:
            values["start_date"] = date.fromisoformat(values["start_date"])
        if values["end_date"]:
            values["end_date"] = date.fromisoformat(values["end_date"])
        values["synced_at"] = snapshot_at
        parsed.append(values)

    try:
        existing_events = {
            event.guid: event
            for event in (await session.scalars(select(EventRepository))).all()
        }
        for values in parsed:
            existing = existing_events.get(values["guid"])
            values["lifecycle_status"] = _present_classification(values, existing)

        absent_guids = set(existing_events) - seen
        for guid in absent_guids:
            existing_events[guid].lifecycle_status = _missing_classification(
                existing_events[guid], snapshot_at
            )

        mutable = {
            column.name
            for column in EventRepository.__table__.columns
            if column.name not in {"guid", "first_seen_at"}
        }
        for values in parsed:
            archival = {
                **values,
                "first_seen_at": snapshot_at,
                "last_seen_at": snapshot_at,
            }
            statement = insert(EventRepository).values(**archival)
            await session.execute(
                statement.on_conflict_do_update(
                    index_elements=[EventRepository.guid],
                    set_={name: getattr(statement.excluded, name) for name in mutable},
                )
            )
        await session.execute(delete(CurrentEvent))
        await session.execute(
            insert(CurrentEvent),
            [{**values, "snapshot_at": snapshot_at} for values in parsed],
        )
        from app.services.profile_preferences import match_new_events

        await match_new_events(session)
        await session.commit()
        session.expire_all()
    except Exception:
        await session.rollback()
        raise
    return len(rows)


async def sync_events(session: AsyncSession, client: EventSource | None = None) -> int:
    """Fetch and store one complete Snapshot with durable attempt evidence."""
    source = client or SocrataClient()
    owns_client = client is None
    started = monotonic()
    run = SyncRun(status="running")
    session.add(run)
    await session.commit()
    run_id = run.id
    try:
        rows = await source.fetch_all_events()
        count = await ingest_events(session, rows)
        completed_run = await session.get(SyncRun, run_id)
        if completed_run is None:  # pragma: no cover - database invariant
            raise RuntimeError("Sync Run disappeared")
        completed_run.status = "succeeded"
        completed_run.finished_at = datetime.now(UTC)
        completed_run.row_count = count
        completed_run.duration_ms = int((monotonic() - started) * 1000)
        await session.commit()
        return count
    except Exception as error:
        await session.rollback()
        failed_run = await session.get(SyncRun, run_id)
        if failed_run is not None:
            failed_run.status = "failed"
            failed_run.finished_at = datetime.now(UTC)
            failed_run.row_count = None
            failed_run.duration_ms = int((monotonic() - started) * 1000)
            failed_run.failure_code = type(error).__name__
            await session.commit()
        raise
    finally:
        if owns_client:
            assert isinstance(source, SocrataClient)
            await source.close()
