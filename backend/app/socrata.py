"""Socrata NYC Parks Events API client with pagination and retry."""

from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

import httpx

from app.config import get_settings

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


class CredentialFilter(logging.Filter):
    """Prevent credential values from appearing in log output."""

    def __init__(self, secret_values: list[str] | None = None) -> None:
        super().__init__()
        self._secret_values = [v for v in (secret_values or []) if v]

    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        for secret in self._secret_values:
            if secret in msg:
                return False
        if _CREDENTIAL_PATTERN.search(msg):
            return False
        return True


class SocrataError(Exception):
    """Raised when the Socrata API returns an unrecoverable error."""


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
        self._endpoint = settings.socrata_query_endpoint
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

    async def _post_with_retry(
        self, payload: dict[str, Any]
    ) -> httpx.Response:
        """POST to the Socrata endpoint with exponential-backoff retry."""
        auth = None
        if self._api_key_id and self._api_key_secret:
            auth = (self._api_key_id, self._api_key_secret)

        headers: dict[str, str] = {}
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
                    timeout=30.0,
                )
                if response.status_code in _RETRYABLE_STATUS_CODES:
                    last_exc = SocrataError(
                        f"Server returned {response.status_code}"
                    )
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

    async def _fetch_page(self, offset: int) -> list[dict[str, Any]]:
        """Fetch one page of events from the Socrata API."""
        payload = {
            "$select": "*",
            "$limit": self._page_size,
            "$offset": offset,
        }
        response = await self._post_with_retry(payload)
        data = response.json()

        # The Socrata v3 query endpoint returns rows under various keys.
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return data.get("rows", data.get("results", []))
        return []

    async def fetch_all_events(self) -> list[dict[str, Any]]:
        """Page through all events until an empty page returns."""
        all_rows: list[dict[str, Any]] = []
        offset = 0

        while True:
            page = await self._fetch_page(offset)
            if not page:
                break
            all_rows.extend(page)
            offset += self._page_size

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


def _derive_registration(
    registration_url: str | None,
    registration_description: str | None,
) -> tuple[str | None, str]:
    """Derive registration status and provenance from source fields."""
    desc = (registration_description or "").strip()
    lowered = desc.casefold()

    if "closed" in lowered:
        return "closed", "Derived"
    if "not required" in lowered:
        return "not_required", "Derived"
    if (registration_url or "").strip() or "required" in lowered:
        return "required", "Derived"
    return None, "Not listed"


def _parse_categories(raw: str | None) -> list[str]:
    """Split pipe-delimited categories into a list."""
    if not raw:
        return []
    return [c.strip() for c in raw.split("|") if c.strip()]


def parse_event(row: dict[str, Any]) -> dict[str, Any]:
    """Convert a Socrata row dict to Event model field values.

    Returns a dict suitable for constructing or updating an Event model
    instance.
    """
    lat, lon, _coords = _parse_coordinates(row.get("coordinates"))
    reg_status, _reg_prov = _derive_registration(
        row.get("registration_url"),
        row.get("registration_description"),
    )
    reg_desc = row.get("registration_description", "").strip() or None

    return {
        "guid": row["guid"],
        "title": row.get("title", ""),
        "description": row.get("description"),
        "official_event_url": row.get("link"),
        "location_id": row.get("parkids"),
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
