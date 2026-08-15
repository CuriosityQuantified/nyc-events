"""Tests for the Socrata client — pagination, retry, credential filtering, parsing."""

from __future__ import annotations

import logging
from unittest.mock import patch

import httpx
import pytest

from app.socrata import SocrataClient, SocrataError, parse_event
from tests.conftest import (
    AlwaysErrorTransport,
    MockTransport,
    load_fixture,
)


class TestPagination:
    """Verify the client pages through all results and stops on empty."""

    async def test_pagination_fetches_all_pages(self):
        """The client must fetch all pages and combine the rows."""
        rows = load_fixture("snapshot_a.json")
        transport = MockTransport(rows, page_size=2)
        http_client = httpx.AsyncClient(transport=transport)

        with patch("app.socrata.get_settings") as mock_settings:
            mock_settings.return_value.socrata_query_endpoint = "https://fake.socrata/query"
            mock_settings.return_value.socrata_api_key_id = ""
            mock_settings.return_value.socrata_api_key_secret = ""
            mock_settings.return_value.socrata_app_token = ""

            client = SocrataClient(http_client=http_client)
            client._page_size = 2
            result = await client.fetch_all_events()

        assert len(result) == 3
        assert result[0]["guid"] == "2,146,733"
        assert result[1]["guid"] == "2,181,767"
        assert result[2]["guid"] == "2,095,486"
        # 2 rows on page 1, 1 row on page 2, 0 rows on page 3 (empty → stop)
        assert transport.request_count == 3

    async def test_pagination_stops_on_empty_page(self):
        """The client must stop when an empty page is returned."""
        transport = MockTransport([], page_size=2)
        http_client = httpx.AsyncClient(transport=transport)

        with patch("app.socrata.get_settings") as mock_settings:
            mock_settings.return_value.socrata_query_endpoint = "https://fake.socrata/query"
            mock_settings.return_value.socrata_api_key_id = ""
            mock_settings.return_value.socrata_api_key_secret = ""
            mock_settings.return_value.socrata_app_token = ""

            client = SocrataClient(http_client=http_client)
            client._page_size = 2
            result = await client.fetch_all_events()

        assert result == []
        assert transport.request_count == 1


class TestRetry:
    """Verify exponential-backoff retry on server errors."""

    async def test_retry_on_server_error(self):
        """The client must retry on 503 and succeed when the server recovers."""
        rows = load_fixture("snapshot_a.json")[:1]
        # Return 503 twice, then serve real data.
        transport = MockTransport(rows, page_size=10, error_responses=[503, 503])
        http_client = httpx.AsyncClient(transport=transport)

        with patch("app.socrata.get_settings") as mock_settings:
            mock_settings.return_value.socrata_query_endpoint = "https://fake.socrata/query"
            mock_settings.return_value.socrata_api_key_id = ""
            mock_settings.return_value.socrata_api_key_secret = ""
            mock_settings.return_value.socrata_app_token = ""

            with patch("app.socrata.asyncio.sleep", return_value=None) as mock_sleep:
                client = SocrataClient(http_client=http_client)
                client._page_size = 10
                result = await client.fetch_all_events()

        assert len(result) == 1
        # 503, 503, 200 (1 row), 200 (empty -> stop)
        assert transport.request_count == 4
        # Verify exponential backoff delays: 1.0s then 2.0s.
        delays = [call.args[0] for call in mock_sleep.call_args_list]
        assert delays == [1.0, 2.0]

    async def test_retry_exhaustion_raises(self):
        """The client must raise after all retries are exhausted."""
        transport = AlwaysErrorTransport(503)
        http_client = httpx.AsyncClient(transport=transport)

        with patch("app.socrata.get_settings") as mock_settings:
            mock_settings.return_value.socrata_query_endpoint = "https://fake.socrata/query"
            mock_settings.return_value.socrata_api_key_id = ""
            mock_settings.return_value.socrata_api_key_secret = ""
            mock_settings.return_value.socrata_app_token = ""

            with patch("app.socrata.asyncio.sleep", return_value=None) as mock_sleep:
                client = SocrataClient(http_client=http_client)
                client._page_size = 10
                with pytest.raises(SocrataError):
                    await client.fetch_all_events()

        # All 3 retries must use exponential backoff: 1.0, 2.0, 4.0 seconds.
        delays = [call.args[0] for call in mock_sleep.call_args_list]
        assert delays == [1.0, 2.0, 4.0]


class TestCredentialFiltering:
    """Verify that credential values never appear in log output."""

    async def test_credentials_not_logged(self, caplog):
        """Log output during a request must not contain API key values."""
        secret_key_id = "SUPER_SECRET_KEY_ID_12345"
        secret_key = "SUPER_SECRET_KEY_VALUE_67890"
        secret_token = "SUPER_SECRET_TOKEN_ABCDE"

        rows = load_fixture("snapshot_a.json")[:1]
        transport = MockTransport(rows, page_size=10)
        http_client = httpx.AsyncClient(transport=transport)

        with patch("app.socrata.get_settings") as mock_settings:
            mock_settings.return_value.socrata_query_endpoint = "https://fake.socrata/query"
            mock_settings.return_value.socrata_api_key_id = secret_key_id
            mock_settings.return_value.socrata_api_key_secret = secret_key
            mock_settings.return_value.socrata_app_token = secret_token

            with caplog.at_level(logging.DEBUG, logger="app.socrata"):
                with patch("app.socrata.asyncio.sleep", return_value=None):
                    client = SocrataClient(http_client=http_client)
                    client._page_size = 10
                    await client.fetch_all_events()

        full_log = caplog.text
        assert secret_key_id not in full_log
        assert secret_key not in full_log
        assert secret_token not in full_log


class TestParseEvent:
    """Verify raw Socrata rows are correctly parsed into Event fields."""

    def test_parse_event_stated_fields(self):
        """Stated fields must carry their raw values through."""
        row = load_fixture("snapshot_a.json")[0]
        parsed = parse_event(row)

        assert parsed["guid"] == "2,146,733"
        assert parsed["title"] == "Summer on the Hudson: Tai Chi"
        assert parsed["official_event_url"] == (
            "http://www.nycgovparks.org/events/2026/08/09/"
            "summer-on-the-hudson-tai-chi"
        )
        assert parsed["location_id"] == "M072"
        assert parsed["location_name"] == (
            "Soldiers' and Sailors' Monument (in Riverside Park)"
        )

    def test_parse_event_derived_fields(self):
        """Borough, dates, and registration must be derived correctly."""
        row = load_fixture("snapshot_a.json")[1]  # R129 → Staten Island, closed
        parsed = parse_event(row)

        assert parsed["borough"] == "Staten Island"
        assert parsed["start_date"] == "2026-08-09"
        assert parsed["end_date"] == "2026-08-09"
        assert parsed["start_datetime"].isoformat() == "2026-08-09T08:00:00-04:00"
        assert parsed["end_datetime"].isoformat() == "2026-08-09T14:00:00-04:00"
        assert parsed["registration_status"] == "closed"

        # Brooklyn event with registration_url → required
        row_b = load_fixture("snapshot_a.json")[2]  # B057, has reg_url
        parsed_b = parse_event(row_b)
        assert parsed_b["borough"] == "Brooklyn"
        assert parsed_b["registration_status"] == "required"

    def test_parse_event_not_listed(self):
        """Absent fields must return None / Not listed equivalents."""
        row = load_fixture("snapshot_a.json")[0]  # No registration
        parsed = parse_event(row)

        assert parsed["registration_status"] is None
        assert parsed["registration_description"] is None
        assert parsed["is_free_explicit"] is None
        assert parsed["accessibility_mentioned"] is None

    def test_parse_event_coordinates(self):
        """Coordinates must be parsed into lat/lon floats."""
        row = load_fixture("snapshot_a.json")[0]
        parsed = parse_event(row)

        assert parsed["latitude"] == pytest.approx(40.791999816895, abs=1e-6)
        assert parsed["longitude"] == pytest.approx(-73.978996276855, abs=1e-6)

    def test_parse_event_categories(self):
        """Pipe-delimited categories must be split into a list."""
        row = load_fixture("snapshot_a.json")[0]
        parsed = parse_event(row)

        assert parsed["categories"] == [
            "Fitness",
            "Outdoor Fitness",
            "Exercise Classes",
        ]

    def test_parse_event_registration_not_required(self):
        """'Registration not required.' maps to not_required."""
        row = dict(load_fixture("snapshot_a.json")[0])
        row["registration_description"] = "Registration not required."
        row["registration_url"] = ""
        parsed = parse_event(row)
        assert parsed["registration_status"] == "not_required"
