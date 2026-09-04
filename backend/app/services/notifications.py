"""Web Push transport and exact Profile/Event delivery deduplication."""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from enum import Enum
from typing import Any, Protocol

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models.event import EventRepository
from app.models.profile import Notification, PushSubscription


class DeliveryResult(Enum):
    """A transport result with explicit subscription expiry."""

    DELIVERED = "delivered"
    EXPIRED = "expired"
    RETRY = "retry"


@dataclass(frozen=True)
class PushMessage:
    """Transport-neutral Web Push message."""

    title: str
    body: str
    url: str


class PushTransport(Protocol):
    """Injected boundary used by production and offline tests."""

    async def send(
        self, subscription: PushSubscription, message: PushMessage
    ) -> DeliveryResult: ...


class PyWebPushTransport:
    """Production adapter for the Web Push protocol."""

    def __init__(self, settings: Settings) -> None:
        self._private_key = settings.vapid_private_key
        self._claims = {"sub": settings.vapid_subject}

    async def send(
        self, subscription: PushSubscription, message: PushMessage
    ) -> DeliveryResult:
        if not self._private_key:
            return DeliveryResult.RETRY

        def deliver() -> DeliveryResult:
            from pywebpush import WebPushException, webpush

            try:
                webpush(
                    subscription_info={
                        "endpoint": subscription.endpoint,
                        "keys": {
                            "p256dh": subscription.p256dh,
                            "auth": subscription.auth,
                        },
                    },
                    data=json.dumps(
                        {
                            "title": message.title,
                            "body": message.body,
                            "url": message.url,
                        }
                    ),
                    vapid_private_key=self._private_key,
                    vapid_claims=self._claims,
                    ttl=86400,
                )
            except WebPushException as error:
                status = getattr(error.response, "status_code", None)
                return (
                    DeliveryResult.EXPIRED
                    if status in {404, 410}
                    else DeliveryResult.RETRY
                )
            return DeliveryResult.DELIVERED

        return await asyncio.to_thread(deliver)


async def dispatch_push_notifications(
    session: AsyncSession,
    redis_client: Any,
    transport: PushTransport,
) -> int:
    """Send pending push alerts once per exact Profile/Event pair."""
    notifications = (
        await session.scalars(
            select(Notification).where(
                Notification.push_enabled.is_(True), Notification.pushed_at.is_(None)
            )
        )
    ).all()
    delivered = 0
    for notification in notifications:
        event = await session.get(EventRepository, notification.event_guid)
        if event is None:  # pragma: no cover - foreign-key invariant
            continue
        subscriptions = (
            await session.scalars(
                select(PushSubscription).where(
                    PushSubscription.profile_id == notification.profile_id,
                    PushSubscription.expired_at.is_(None),
                )
            )
        ).all()
        if not subscriptions:
            continue
        key = f"nyc-events:push:{notification.profile_id}:{notification.event_guid}"
        claimed = await redis_client.set(key, "1", nx=True)
        if not claimed:
            continue
        had_delivery = False
        for subscription in subscriptions:
            result = await transport.send(
                subscription,
                PushMessage(
                    title="New event match",
                    body=event.title,
                    url=f"/events/{event.guid}",
                ),
            )
            if result is DeliveryResult.EXPIRED:
                await session.delete(subscription)
                continue
            if result is DeliveryResult.RETRY:
                continue
            had_delivery = True
        if had_delivery:
            from datetime import UTC, datetime

            notification.pushed_at = datetime.now(UTC)
            delivered += 1
        else:
            await redis_client.delete(key)
    await session.flush()
    return delivered
