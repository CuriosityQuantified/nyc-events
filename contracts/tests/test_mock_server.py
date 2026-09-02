from __future__ import annotations

import http.client
import json
import threading
import unittest
from typing import cast
from urllib.parse import quote

from contracts.mock_server import create_server


class ContractMockTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.server = create_server(port=0)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        host, cls.port = cls.server.server_address[:2]
        cls.host = cast(str, host)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def request(self, path: str, *, device_token: str | None = None) -> tuple[int, dict]:
        connection = http.client.HTTPConnection(self.host, self.port, timeout=2)
        headers = {"X-Device-Token": device_token} if device_token else {}
        connection.request("GET", path, headers=headers)
        response = connection.getresponse()
        payload = json.loads(response.read())
        connection.close()
        return response.status, payload

    def test_every_schema_endpoint_is_served(self) -> None:
        status, listing = self.request("/events")
        self.assertEqual(status, 200)
        self.assertEqual(listing["total"], 2)

        guid = quote(listing["events"][0]["guid"], safe="")
        status, detail = self.request(f"/events/{guid}")
        self.assertEqual(status, 200)
        self.assertEqual(detail["guid"], listing["events"][0]["guid"])

        status, freshness = self.request("/freshness")
        self.assertEqual(status, 200)
        self.assertTrue(freshness["is_stale"]["value"])

        token = "contract-device-token-abcdefghijklmnopqrstuvwxyz"
        status, notifications = self.request(
            "/profile/notifications", device_token=token
        )
        self.assertEqual(status, 200)
        self.assertEqual(notifications["total"], 1)

        status, push = self.request(
            "/profile/push-subscription", device_token=token
        )
        self.assertEqual(status, 200)
        self.assertFalse(push["enabled"])

    def test_profile_contract_requires_device_ownership(self) -> None:
        status, payload = self.request("/profile/notifications")
        self.assertEqual(status, 400)
        self.assertIn("X-Device-Token", payload["error"])

    def test_facet_filters_compose(self) -> None:
        status, payload = self.request("/events?borough=Manhattan&category=Fitness&location=M072")
        self.assertEqual(status, 200)
        self.assertEqual([event["guid"] for event in payload["events"]], ["2,146,733"])
        self.assertEqual(
            payload["applied_facets"],
            {"borough": ["Manhattan"], "category": ["Fitness"], "location": ["M072"]},
        )

        status, payload = self.request("/events?registration=closed&date_from=2026-08-09&date_to=2026-08-09")
        self.assertEqual(status, 200)
        self.assertEqual([event["guid"] for event in payload["events"]], ["2,181,767"])

    def test_not_listed_is_filterable_without_becoming_a_negative_claim(self) -> None:
        status, payload = self.request("/events?registration=not_listed")
        self.assertEqual(status, 200)
        self.assertEqual([event["guid"] for event in payload["events"]], ["2,146,733"])
        self.assertIsNone(payload["events"][0]["registration_status"]["value"])
        self.assertEqual(payload["events"][0]["registration_status"]["provenance"], "Not listed")

    def test_pagination_and_bad_input(self) -> None:
        status, payload = self.request("/events?page=2&page_size=1")
        self.assertEqual(status, 200)
        self.assertEqual([event["guid"] for event in payload["events"]], ["2,181,767"])

        status, payload = self.request("/events?page=zero")
        self.assertEqual(status, 400)
        self.assertIn("integer", payload["error"])

        status, payload = self.request("/events?registration=banana")
        self.assertEqual(status, 400)
        self.assertIn("registration", payload["error"])

        status, payload = self.request("/events?date_from=not-a-date")
        self.assertEqual(status, 400)
        self.assertIn("ISO 8601 date", payload["error"])

    def test_unknown_event_is_404(self) -> None:
        status, payload = self.request("/events/unknown")
        self.assertEqual(status, 404)
        self.assertIn("not found", payload["error"])

    def test_mock_refuses_non_loopback_binding(self) -> None:
        with self.assertRaisesRegex(ValueError, "loopback"):
            create_server(host="0.0.0.0", port=0)


if __name__ == "__main__":
    unittest.main()
