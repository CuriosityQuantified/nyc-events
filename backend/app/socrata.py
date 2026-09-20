"""Socrata NYC Parks Events API client with pagination and retry."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from email.utils import parsedate_to_datetime
from time import monotonic
from typing import Any, Protocol
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.event import CurrentEvent, EventRepository, SyncRun
from app.models.subway import CurrentEventLocation
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
_SOCRATA_QUERY = "SELECT * ORDER BY starttime ASC, guid ASC"

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

    #: The failed Sync Run that durably recorded this error, when one exists.
    sync_run_id: int | None = None


class SocrataCooldown(SocrataError):
    """Persist a long Retry-After across scheduled executions."""

    def __init__(self, not_before: datetime):
        self.not_before = not_before
        super().__init__("Upstream requested a longer cooldown")


class EventSource(Protocol):
    """The narrow transport contract used by the synchronization job."""

    async def fetch_all_events(self) -> list[dict[str, Any]]: ...


@dataclass(frozen=True)
class SourceRevision:
    """Dataset metadata; never inferred from the time our worker ran."""

    version: str
    updated_at: datetime


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
        return await self._request_with_retry("POST", self._endpoint, payload)

    async def _request_with_retry(
        self, method: str, endpoint: str, payload: dict[str, Any] | None = None
    ) -> httpx.Response:
        """Bounded retries for metadata and data, honoring upstream Retry-After."""
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
                response = await self._client.request(
                    method,
                    endpoint,
                    json=payload,
                    auth=auth,
                    headers=headers,
                    timeout=60.0,
                )
                if response.status_code in _RETRYABLE_STATUS_CODES:
                    last_exc = SocrataError(f"Server returned {response.status_code}")
                    delay = _BASE_BACKOFF_SECONDS * (2**attempt)
                    retry_after = response.headers.get("Retry-After")
                    if retry_after:
                        try:
                            requested_delay = float(retry_after)
                        except ValueError:
                            try:
                                requested_delay = (
                                    parsedate_to_datetime(retry_after)
                                    - datetime.now(UTC)
                                ).total_seconds()
                            except (ValueError, TypeError, OverflowError):
                                requested_delay = 0
                        delay = max(delay, requested_delay)
                        # Do not retry early when the source asks us to wait
                        # longer than this short-lived worker can accommodate.
                        if delay > 60:
                            raise SocrataCooldown(
                                datetime.now(UTC) + timedelta(seconds=delay)
                            )
                    if attempt < _MAX_RETRIES:
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

    async def fetch_revision(self) -> SourceRevision:
        """Check the same dataset as the query without fetching its event rows."""
        dataset_id = urlparse(self._endpoint).path.split("/")[4]
        response = await self._request_with_retry(
            "GET", f"https://data.cityofnewyork.us/api/views/{dataset_id}.json"
        )
        try:
            metadata = response.json()
            if not isinstance(metadata, dict) or metadata.get("id") != dataset_id:
                raise ValueError("wrong dataset")
            updated = metadata["rowsUpdatedAt"]
            if type(updated) is not int or updated <= 0:
                raise ValueError("missing data update timestamp")
            updated_at = datetime.fromtimestamp(updated, UTC)
            version = _content_hash(
                {
                    "endpoint": self._endpoint,
                    "rowsUpdatedAt": updated,
                    "viewLastModified": metadata.get("viewLastModified"),
                    "publicationDate": metadata.get("publicationDate"),
                }
            )
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            raise SocrataError("Socrata returned invalid dataset metadata") from error
        return SourceRevision(version, updated_at)

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

        while page_number <= 100:
            page = await self._fetch_page(page_number)
            if not page:
                break
            all_rows.extend(page)
            page_number += 1
        else:
            raise SocrataError("Socrata pagination exceeded the safety limit")

        logger.info("Fetched %d total events from Socrata", len(all_rows))
        return all_rows


def _parse_date(raw: str | None) -> str | None:
    """Normalize supported Socrata calendar-date shapes to an ISO date."""
    if not raw:
        return None
    value = raw.strip()
    try:
        return datetime.strptime(value, "%m/%d/%Y").date().isoformat()
    except ValueError:
        pass
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return None


def _parse_datetime(raw: str | None) -> datetime | None:
    """Parse Socrata timestamps, treating floating times as New York local time."""
    if not raw:
        return None
    value = raw.strip()
    # A calendar date alone must not invent a midnight event time.
    if len(value) <= 10 or value[10] not in {"T", " "}:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=_NY_TZ)
    return parsed.astimezone(_NY_TZ)


def _apply_calendar_date(
    event_datetime: datetime | None, calendar_date: str | None
) -> datetime | None:
    """Apply the explicit event date to Socrata's time-bearing timestamp."""
    if event_datetime is None or calendar_date is None:
        return event_datetime
    return datetime.combine(
        date.fromisoformat(calendar_date), event_datetime.time(), tzinfo=_NY_TZ
    )


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


def _unique_matchable_coordinates(
    coordinates: list[dict[str, float]],
) -> list[dict[str, float]]:
    """Keep unique valid locations and reject the null-island sentinel."""
    unique: list[dict[str, float]] = []
    seen: set[tuple[float, float]] = set()
    for coordinate in coordinates:
        key = (coordinate["latitude"], coordinate["longitude"])
        if key == (0, 0) or key in seen:
            continue
        seen.add(key)
        unique.append(coordinate)
    return unique


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
    parsed_start_date = _parse_date(start_date)
    parsed_end_date = _parse_date(end_date)
    parsed_start_datetime = _apply_calendar_date(
        _parse_datetime(start_time), parsed_start_date
    )
    parsed_end_datetime = _apply_calendar_date(
        _parse_datetime(end_time), parsed_end_date
    )

    return {
        "guid": guid,
        "title": title,
        "description": description,
        "official_event_url": official_event_url,
        "location_key": _location_key(location_id, coordinates_list),
        "location_id": location_id,
        "location_name": location_name,
        "start_date": parsed_start_date,
        "end_date": parsed_end_date,
        "start_datetime": parsed_start_datetime,
        "end_datetime": parsed_end_datetime,
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
        "_locations": _unique_matchable_coordinates(coordinates_list),
    }


async def ingest_events(
    session: AsyncSession, rows: list[dict[str, Any]], *, commit: bool = True
) -> int:
    """Atomically archive a valid Snapshot and replace the current dataset."""
    if not rows:
        raise SocrataError("Socrata returned an empty Snapshot")

    parsed: list[dict[str, Any]] = []
    event_locations: dict[str, list[dict[str, float]]] = {}
    seen: set[str] = set()
    snapshot_at = datetime.now(UTC)
    for row in rows:
        values = parse_event(row)
        event_locations[values["guid"]] = values.pop("_locations")
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
        location_rows = [
            {
                "event_guid": guid,
                "ordinal": ordinal,
                "latitude": coordinate["latitude"],
                "longitude": coordinate["longitude"],
            }
            for guid, coordinates in event_locations.items()
            for ordinal, coordinate in enumerate(coordinates)
        ]
        if location_rows:
            await session.execute(insert(CurrentEventLocation), location_rows)
        from app.services.profile_preferences import match_new_events

        await match_new_events(session)
        if commit:
            await session.commit()
            session.expire_all()
        else:
            await session.flush()
    except Exception:
        await session.rollback()
        raise
    return len(rows)


async def sync_events(
    session: AsyncSession, client: EventSource | None = None, *, force: bool = False
) -> int:
    """Fetch and store one complete Snapshot with durable attempt evidence."""
    source = client or SocrataClient()
    owns_client = client is None
    started = monotonic()
    run = SyncRun(
        status="running", deployment_revision=get_settings().deploy_revision or None
    )
    session.add(run)
    await session.commit()
    run_id = run.id
    try:
        cooldown = await session.scalar(
            select(func.max(SyncRun.retry_not_before)).where(
                SyncRun.retry_not_before > datetime.now(UTC)
            )
        )
        if cooldown is not None:
            run.status = "deferred"
            run.finished_at = datetime.now(UTC)
            run.duration_ms = int((monotonic() - started) * 1000)
            await session.commit()
            logger.warning("Source check deferred until %s", cooldown.isoformat())
            return (
                await session.scalar(select(func.count()).select_from(CurrentEvent))
                or 0
            )
        revision_fetcher = getattr(source, "fetch_revision", None)
        revision = await revision_fetcher() if revision_fetcher else None
        previous = await session.scalar(
            select(SyncRun)
            .where(SyncRun.status == "succeeded")
            .order_by(SyncRun.finished_at.desc(), SyncRun.id.desc())
            .limit(1)
        )
        current_count = await session.scalar(
            select(func.count()).select_from(CurrentEvent)
        )
        if (
            not force
            and revision is not None
            and previous is not None
            and previous.finished_at is not None
            and previous.source_version == revision.version
            and current_count
            and current_count == previous.row_count
            and (datetime.now(UTC) - previous.finished_at).total_seconds()
            < get_settings().sync_full_refresh_seconds
        ):
            run.status = "unchanged"
            run.source_version = revision.version
            run.source_updated_at = revision.updated_at
            run.row_count = current_count
            run.finished_at = datetime.now(UTC)
            run.duration_ms = int((monotonic() - started) * 1000)
            await session.commit()
            logger.info("Source unchanged; kept %d Events", current_count)
            return current_count

        rows = await source.fetch_all_events()
        if revision is not None:
            assert revision_fetcher is not None
            after = await revision_fetcher()
            if after.version != revision.version:
                raise SocrataError("Source changed during pagination; retry next check")
        count = await ingest_events(session, rows, commit=False)
        completed_run = await session.get(SyncRun, run_id)
        if completed_run is None:  # pragma: no cover - database invariant
            raise RuntimeError("Sync Run disappeared")
        completed_run.status = "succeeded"
        completed_run.finished_at = datetime.now(UTC)
        completed_run.row_count = count
        completed_run.duration_ms = int((monotonic() - started) * 1000)
        if revision is not None:
            completed_run.source_version = revision.version
            completed_run.source_updated_at = revision.updated_at
        await session.commit()
        return count
    except (Exception, asyncio.CancelledError) as error:
        await session.rollback()
        failed_run = await session.get(SyncRun, run_id)
        if failed_run is not None:
            failed_run.status = "failed"
            failed_run.finished_at = datetime.now(UTC)
            failed_run.row_count = None
            failed_run.duration_ms = int((monotonic() - started) * 1000)
            failed_run.failure_code = type(error).__name__
            if isinstance(error, SocrataCooldown):
                failed_run.retry_not_before = error.not_before
            await session.commit()
            if isinstance(error, SocrataError):
                error.sync_run_id = run_id
        raise
    finally:
        if owns_client:
            assert isinstance(source, SocrataClient)
            await source.close()
