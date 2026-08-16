"""Conservative provenance evidence extracted from source Event text."""

from __future__ import annotations

import re
from collections.abc import Mapping
from typing import Any

_SOURCE_TEXT_FIELDS = ("title", "description", "registration_description")
_EXPLICIT_FREE = re.compile(
    r"\b(?:"
    r"(?:admission|entry|registration|tickets?|this event|the event|"
    r"this program|the program)\s+(?:is|are)\s+free|"
    r"free\s+(?:admission|entry|registration|event|program)|"
    r"(?:at|for)\s+no\s+cost|free\s+of\s+charge"
    r")\b",
    re.IGNORECASE,
)
_FREE_NEGATION = re.compile(
    r"\b(?:not|no|never|without)\b(?:\W+\w+){0,3}\W*$", re.IGNORECASE
)
_ACCESSIBILITY = re.compile(r"\b(?:accessib(?:le|ility)|wheelchair)\b", re.IGNORECASE)


def _source_texts(raw: Mapping[str, Any]) -> list[str]:
    """Return only source-owned text fields that can support derived claims."""
    return [
        value
        for field in _SOURCE_TEXT_FIELDS
        if isinstance(value := raw.get(field), str)
    ]


def explicit_free_evidence(raw: Mapping[str, Any]) -> str | None:
    """Return source text that explicitly says an Event is free.

    The result is deliberately three-state at the model boundary: positive source
    language becomes ``True`` and missing or ambiguous language remains ``None``.
    It never infers ``False`` from silence.
    """
    for text in _source_texts(raw):
        for match in _EXPLICIT_FREE.finditer(text):
            prefix = text[max(0, match.start() - 48) : match.start()]
            if not _FREE_NEGATION.search(prefix):
                return text
    return None


def accessibility_evidence(raw: Mapping[str, Any]) -> str | None:
    """Return source text that mentions accessibility without judging it."""
    return next(
        (text for text in _source_texts(raw) if _ACCESSIBILITY.search(text)), None
    )
