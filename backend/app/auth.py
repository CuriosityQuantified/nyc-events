"""Clerk JWT verification with injectable dependency for testing."""

from __future__ import annotations

from collections.abc import Callable, Coroutine
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import get_settings


@dataclass(frozen=True, slots=True)
class ClerkTokenPayload:
    """Claims extracted from a verified Clerk session token."""

    user_id: str
    email: str | None = None


ClerkVerifier = Callable[[str], Coroutine[Any, Any, ClerkTokenPayload]]


async def verify_clerk_token(token: str) -> ClerkTokenPayload:
    """Verify a Clerk session JWT via the Clerk Backend API.

    Raises ``ValueError`` on any verification failure.
    """
    secret_key = get_settings().clerk_secret_key
    if not secret_key:
        raise ValueError("CLERK_SECRET_KEY is not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.clerk.com/v1/tokens/verify",
            json={"token": token},
            headers={
                "Authorization": f"Bearer {secret_key}",
                "Content-Type": "application/json",
            },
        )

    if resp.status_code != 200:
        raise ValueError(f"Clerk token verification failed: {resp.status_code}")

    data = resp.json()
    user_id = data.get("sub") or data.get("user_id")
    if not user_id:
        raise ValueError("Clerk token missing user identifier")

    return ClerkTokenPayload(user_id=user_id, email=data.get("email"))


# Injectable verifier — tests replace via set/reset_clerk_verifier.

_clerk_verifier: ClerkVerifier = verify_clerk_token


def get_clerk_verifier() -> ClerkVerifier:
    """Return the current Clerk token verifier."""
    return _clerk_verifier


def set_clerk_verifier(verifier: ClerkVerifier) -> None:
    """Replace the Clerk token verifier (used by tests)."""
    global _clerk_verifier
    _clerk_verifier = verifier


def reset_clerk_verifier() -> None:
    """Restore the production Clerk verifier."""
    global _clerk_verifier
    _clerk_verifier = verify_clerk_token
