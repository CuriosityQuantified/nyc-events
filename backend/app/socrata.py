"""Socrata NYC Parks Events API client with pagination and retry."""

from __future__ import annotations

import asyncio
import logging
import re
from datetime import date, datetime
from typing import Any
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.event import Event

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

    lat, lon, coordinates = _parse_coordinates(row.get("coordinates"))
    location_id = row.get("parkids")
    official_event_url = _normalize_socrata_url(row.get("link"), "link")
    reg_status, _reg_prov = _derive_registration(
        row.get("registration_url"),
        row.get("registration_description"),
    )
    reg_desc = row.get("registration_description", "").strip() or None

    return {
        "guid": guid,
        "title": title,
        "description": row.get("description"),
        "official_event_url": official_event_url,
        "location_key": _location_key(location_id, coordinates),
        "location_id": location_id,
        "location_name": row.get("location"),
        "start_date": _parse_date(row.get("startdate")),
        "end_date": _parse_date(row.get("enddate")),
        "start_datetime": _parse_datetime(row.get("starttime")),
        "end_datetime": _parse_datetime(row.get("endtime")),
        "categories": _parse_categories(row.get("categories")),
        "latitude": lat,
        "longitude": lon,
        "borough": _derive_borough(row.get("parkids")),
        "registration_status": reg_status,
        "registration_description": reg_desc,
        "is_free_explicit": None,
        "accessibility_mentioned": None,
        "raw_data": row,
    }


async def ingest_events(session: AsyncSession, rows: list[dict[str, Any]]) -> int:
    """Atomically upsert validated source rows by source guid."""
    try:
        for row in rows:
            values = parse_event(row)
            if values["start_date"]:
                values["start_date"] = date.fromisoformat(values["start_date"])
            if values["end_date"]:
                values["end_date"] = date.fromisoformat(values["end_date"])
            await session.merge(Event(**values))
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    return len(rows)


async def sync_events(
    session: AsyncSession, client: SocrataClient | None = None
) -> int:
    """Fetch the complete source Snapshot and store it in Postgres."""
    source = client or SocrataClient()
    owns_client = client is None
    try:
        rows = await source.fetch_all_events()
        return await ingest_events(session, rows)
    finally:
        if owns_client:
            await source.close()
