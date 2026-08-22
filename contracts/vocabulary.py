"""Dependency-free contract vocabulary rules."""

from __future__ import annotations

from typing import Any

FORBIDDEN_KEYS = {
    "occurrence",
    "venue",
    "preference",
    "walking_time",
    "transit_time",
    "route_availability",
    "routing",
    "directions",
    "eta",
}
FORBIDDEN_TRANSIT_KEY_PARTS = {
    "duration",
    "route_steps",
    "routing",
    "transit_time",
    "travel_time",
    "walking",
}


def walk_keys(value: Any) -> None:
    """Reject API keys that claim routes or travel time."""
    if isinstance(value, dict):
        for key, child in value.items():
            normalized_key = key.casefold()
            if normalized_key in FORBIDDEN_KEYS or any(
                part in normalized_key for part in FORBIDDEN_TRANSIT_KEY_PARTS
            ):
                raise ValueError(f"CONTEXT.md vocabulary violation in payload key: {key}")
            walk_keys(child)
    elif isinstance(value, list):
        for child in value:
            walk_keys(child)
