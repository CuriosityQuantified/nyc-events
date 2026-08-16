"""Tests for the Socrata client — pagination, retry, credential filtering, parsing."""

from __future__ import annotations

import logging
from unittest.mock import patch

import httpx
import pytest

from app.socrata import CredentialFilter, SocrataClient, SocrataError, parse_event
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
            mock_settings.return_value.socrata_query_endpoint = (
                "https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json"
            )
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
        assert [request["page"] for request in transport.requests] == [
            {"pageNumber": 1, "pageSize": 2},
            {"pageNumber": 2, "pageSize": 2},
            {"pageNumber": 3, "pageSize": 2},
        ]

    async def test_pagination_stops_on_empty_page(self):
        """The client must stop when an empty page is returned."""
        transport = MockTransport([], page_size=2)
        http_client = httpx.AsyncClient(transport=transport)

        with patch("app.socrata.get_settings") as mock_settings:
            mock_settings.return_value.socrata_query_endpoint = (
                "https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json"
            )
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
            mock_settings.return_value.socrata_query_endpoint = (
                "https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json"
            )
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
            mock_settings.return_value.socrata_query_endpoint = (
                "https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json"
            )
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
            mock_settings.return_value.socrata_query_endpoint = (
                "https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json"
            )
            mock_settings.return_value.socrata_api_key_id = secret_key_id
            mock_settings.return_value.socrata_api_key_secret = secret_key
            mock_settings.return_value.socrata_app_token = secret_token

            with (
                caplog.at_level(logging.DEBUG, logger="app.socrata"),
                patch("app.socrata.asyncio.sleep", return_value=None),
            ):
                client = SocrataClient(http_client=http_client)
                client._page_size = 10
                await client.fetch_all_events()

        full_log = caplog.text
        assert secret_key_id not in full_log
        assert secret_key not in full_log
        assert secret_token not in full_log

        record = logging.LogRecord(
            "app.socrata",
            logging.WARNING,
            __file__,
            0,
            "api_key=%s authorization=%s token=%s",
            (secret_key_id, secret_key, secret_token),
            None,
        )
        credential_filter = CredentialFilter([secret_key_id, secret_key, secret_token])
        assert credential_filter.filter(record)
        assert record.getMessage() == (
            "api_key=[REDACTED] authorization=[REDACTED] token=[REDACTED]"
        )


class TestResponseValidation:
    """Reject unsafe endpoints and malformed source responses."""

    @pytest.mark.parametrize(
        "endpoint",
        [
            "http://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json",
            "https://example.com/api/v3/views/w3wp-dpdi/query.json",
            "https://user@data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json",
            "https://data.cityofnewyork.us:444/api/v3/views/w3wp-dpdi/query.json",
            "https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json?x=1",
            "https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json#fragment",
        ],
    )
    def test_unapproved_endpoint_is_rejected(self, endpoint):
        with patch("app.socrata.get_settings") as mock_settings:
            mock_settings.return_value.socrata_query_endpoint = endpoint
            mock_settings.return_value.socrata_api_key_id = ""
            mock_settings.return_value.socrata_api_key_secret = ""
            mock_settings.return_value.socrata_app_token = ""

            with pytest.raises(SocrataError, match="approved NYC Open Data"):
                SocrataClient()

    @pytest.mark.parametrize(
        "response",
        [
            httpx.Response(200, text="not-json"),
            httpx.Response(200, json={"rows": []}),
            httpx.Response(200, json=["not-an-object"]),
        ],
    )
    async def test_malformed_response_is_rejected(self, response):
        async def handler(_request):
            return response

        http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        with patch("app.socrata.get_settings") as mock_settings:
            mock_settings.return_value.socrata_query_endpoint = (
                "https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json"
            )
            mock_settings.return_value.socrata_api_key_id = ""
            mock_settings.return_value.socrata_api_key_secret = ""
            mock_settings.return_value.socrata_app_token = ""

            client = SocrataClient(http_client=http_client)
            with pytest.raises(SocrataError):
                await client.fetch_all_events()


class TestParseEvent:
    """Verify raw Socrata rows are correctly parsed into Event fields."""

    def test_parse_event_stated_fields(self):
        """Stated fields must carry their raw values through."""
        row = load_fixture("snapshot_a.json")[0]
        parsed = parse_event(row)

        assert parsed["guid"] == "2,146,733"
        assert parsed["title"] == "Summer on the Hudson: Tai Chi"
        assert parsed["official_event_url"] == (
            "http://www.nycgovparks.org/events/2026/08/09/summer-on-the-hudson-tai-chi"
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

    def test_live_registration_url_object_is_normalized_without_mutation(self):
        """The live Socrata URL object must imply registration and stay raw."""
        row = load_fixture("live_registration_url_object.json")[0]
        original_registration_url = dict(row["registration_url"])
        original_event_url = dict(row["link"])

        parsed = parse_event(row)

        assert parsed["official_event_url"] == original_event_url["url"]
        assert parsed["registration_status"] == "required"
        assert parsed["raw_data"]["registration_url"] == original_registration_url
        assert parsed["raw_data"]["link"] == original_event_url
        assert row["registration_url"] == original_registration_url
        assert row["link"] == original_event_url

    @pytest.mark.parametrize(
        ("registration_url", "expected_status"),
        [
            (" https://example.org/register ", "required"),
            (None, None),
            ("", None),
        ],
    )
    def test_registration_url_string_and_null_shapes(
        self, registration_url, expected_status
    ):
        """String, null, and empty URL shapes must normalize consistently."""
        row = dict(load_fixture("snapshot_a.json")[0])
        row["registration_url"] = registration_url

        parsed = parse_event(row)

        assert parsed["registration_status"] == expected_status
        assert parsed["raw_data"]["registration_url"] == registration_url

    @pytest.mark.parametrize(
        "registration_url",
        [
            {"description": "Missing URL"},
            {"url": 42},
            ["https://example.org/register"],
            "javascript:alert(1)",
            "https://user:password@example.org/register",
            "https:///missing-host",
        ],
    )
    def test_unsafe_or_malformed_registration_url_is_rejected(self, registration_url):
        """Unsupported URL values must fail closed instead of implying registration."""
        row = dict(load_fixture("snapshot_a.json")[0])
        row["registration_url"] = registration_url

        with pytest.raises(SocrataError, match="registration_url"):
            parse_event(row)
