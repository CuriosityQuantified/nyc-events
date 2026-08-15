#!/usr/bin/env python3
"""Offline mock server backed by the contract's hand-authored golden responses."""

from __future__ import annotations

import argparse
import json
from datetime import date
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


LIST_GOLDEN = load_json(ROOT / "golden/events-list.json")
DETAIL_GOLDEN = load_json(ROOT / "golden/event-detail.json")
FRESHNESS_GOLDEN = load_json(ROOT / "golden/freshness.json")
EVENTS_BY_GUID = {event["guid"]: event for event in LIST_GOLDEN["events"]}
EVENTS_BY_GUID[DETAIL_GOLDEN["guid"]] = DETAIL_GOLDEN
REGISTRATION_VALUES = {"required", "not_required", "closed", "not_listed"}


def fact_value(event: dict[str, Any], name: str) -> Any:
    return event[name]["value"]


def parse_positive_int(query: dict[str, list[str]], name: str, default: int, maximum: int | None = None) -> int:
    raw = query.get(name, [str(default)])[0]
    try:
        value = int(raw)
    except ValueError as error:
        raise ValueError(f"{name} must be an integer") from error
    if value < 1 or (maximum is not None and value > maximum):
        suffix = f" and at most {maximum}" if maximum is not None else ""
        raise ValueError(f"{name} must be at least 1{suffix}")
    return value


def filter_events(query: dict[str, list[str]]) -> tuple[list[dict[str, Any]], dict[str, list[str]]]:
    events = list(LIST_GOLDEN["events"])
    applied: dict[str, list[str]] = {}

    if "registration" in query and query["registration"][0] not in REGISTRATION_VALUES:
        raise ValueError(f"registration must be one of: {', '.join(sorted(REGISTRATION_VALUES))}")

    scalar_facets = {
        "borough": "borough",
        "registration": "registration_status",
        "location": "location_id",
    }
    for query_name, fact_name in scalar_facets.items():
        if query_name not in query:
            continue
        wanted = query[query_name][0]
        applied[query_name] = [wanted]
        events = [
            event
            for event in events
            if str(fact_value(event, fact_name) or "not_listed").casefold() == wanted.casefold()
        ]

    if "category" in query:
        wanted = query["category"][0]
        applied["category"] = [wanted]
        events = [
            event
            for event in events
            if any(category.casefold() == wanted.casefold() for category in (fact_value(event, "categories") or []))
        ]

    for query_name, predicate in (
        ("date_from", lambda event_date, boundary: event_date >= boundary),
        ("date_to", lambda event_date, boundary: event_date <= boundary),
    ):
        if query_name not in query:
            continue
        raw_boundary = query[query_name][0]
        try:
            boundary = date.fromisoformat(raw_boundary)
        except ValueError as error:
            raise ValueError(f"{query_name} must be an ISO 8601 date") from error
        applied[query_name] = [raw_boundary]
        events = [
            event
            for event in events
            if predicate(date.fromisoformat(fact_value(event, "start_date")), boundary)
        ]

    return events, applied


class ContractHandler(BaseHTTPRequestHandler):
    server_version = "EventMatchContract/0.1"

    def log_message(self, format: str, *args: object) -> None:
        return

    def _send(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/events":
                query = parse_qs(parsed.query, keep_blank_values=True)
                page = parse_positive_int(query, "page", 1)
                page_size = parse_positive_int(query, "page_size", 20, maximum=100)
                events, applied = filter_events(query)
                start = (page - 1) * page_size
                self._send(
                    HTTPStatus.OK,
                    {
                        "events": events[start : start + page_size],
                        "page": page,
                        "page_size": page_size,
                        "total": len(events),
                        "applied_facets": applied,
                    },
                )
                return

            if parsed.path.startswith("/events/"):
                guid = unquote(parsed.path.removeprefix("/events/"))
                event = EVENTS_BY_GUID.get(guid)
                if event is None:
                    self._send(HTTPStatus.NOT_FOUND, {"error": f"Event not found: {guid}"})
                else:
                    self._send(HTTPStatus.OK, event)
                return

            if parsed.path == "/freshness":
                self._send(HTTPStatus.OK, FRESHNESS_GOLDEN)
                return

            self._send(HTTPStatus.NOT_FOUND, {"error": "Route not found"})
        except ValueError as error:
            self._send(HTTPStatus.BAD_REQUEST, {"error": str(error)})


def create_server(host: str = "127.0.0.1", port: int = 4010) -> ThreadingHTTPServer:
    if host not in {"127.0.0.1", "localhost"}:
        raise ValueError("the fixture mock is development-only and may bind only to loopback")
    return ThreadingHTTPServer((host, port), ContractHandler)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1", choices=("127.0.0.1", "localhost"))
    parser.add_argument("--port", type=int, default=4010)
    args = parser.parse_args()
    server = create_server(args.host, args.port)
    host, port = server.server_address[:2]
    print(f"EventMatch contract mock listening on http://{host}:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
