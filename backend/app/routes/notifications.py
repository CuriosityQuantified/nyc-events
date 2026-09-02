"""Profile-owned in-app notifications and Web Push subscriptions."""

from __future__ import annotations

from typing import Annotated, Any
from urllib.parse import urlsplit

from fastapi import APIRouter, HTTPException, Query, Response, status
from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database import get_session_factory
from app.models.event import EventRepository
from app.models.profile import Notification, PushSubscription
from app.routes.profiles import (
    DeviceToken,
    _database_unavailable,
    _get_or_create_profile,
)

router = APIRouter(prefix="/profile")


class SubscriptionKeys(BaseModel):
    model_config = ConfigDict(extra="forbid")

    p256dh: Annotated[str, Field(min_length=16, max_length=255)]
    auth: Annotated[str, Field(min_length=8, max_length=255)]


class SubscriptionRequest(BaseModel):
    """The browser-issued consent record contains only push delivery data."""

    model_config = ConfigDict(extra="forbid")

    endpoint: Annotated[HttpUrl, Field(max_length=2048)]
    keys: SubscriptionKeys


_PUSH_SERVICE_HOSTS = frozenset(
    {
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
    }
)


def _safe_push_endpoint(value: HttpUrl) -> str:
    endpoint = str(value)
    parts = urlsplit(endpoint)
    if (
        parts.scheme != "https"
        or parts.username
        or parts.password
        or not parts.hostname
        or parts.port not in (None, 443)
        or parts.fragment
    ):
        raise HTTPException(status_code=422, detail="Invalid push endpoint")
    hostname = parts.hostname.rstrip(".").casefold()
    is_microsoft_push = hostname == "notify.windows.com" or hostname.endswith(
        ".notify.windows.com"
    )
    if hostname not in _PUSH_SERVICE_HOSTS and not is_microsoft_push:
        # A fixed provider allowlist prevents private targets and DNS rebinding.
        raise HTTPException(status_code=422, detail="Unsupported push service")
    return endpoint


@router.get("/notifications")
async def list_notifications(
    x_device_token: DeviceToken,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict[str, Any]:
    """List the always-on in-app notification baseline."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            where = (Notification.profile_id == profile.id,)
            total = await session.scalar(
                select(func.count()).select_from(Notification).where(*where)
            )
            rows = (
                await session.execute(
                    select(Notification, EventRepository)
                    .join(
                        EventRepository, EventRepository.guid == Notification.event_guid
                    )
                    .where(*where)
                    .order_by(Notification.created_at.desc(), Notification.event_guid)
                    .offset((page - 1) * page_size)
                    .limit(page_size)
                )
            ).all()
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
        return {
            "profile_id": str(profile.id),
            "notifications": [
                {
                    "event_guid": notification.event_guid,
                    "title": event.title,
                    "url": f"/events/{event.guid}",
                    "created_at": notification.created_at.isoformat(),
                    "read": notification.read_at is not None,
                }
                for notification, event in rows
            ],
            "page": page,
            "page_size": page_size,
            "total": total or 0,
        }


@router.get("/push-subscription")
async def push_subscription_status(x_device_token: DeviceToken) -> dict[str, Any]:
    """Return consent state without exposing subscription key material."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            enabled = (
                await session.scalar(
                    select(func.count())
                    .select_from(PushSubscription)
                    .where(
                        PushSubscription.profile_id == profile.id,
                        PushSubscription.expired_at.is_(None),
                    )
                )
                or 0
            ) > 0
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
    return {"enabled": enabled, "vapid_public_key": get_settings().vapid_public_key}


@router.put("/push-subscription")
async def enable_push(
    subscription: SubscriptionRequest, x_device_token: DeviceToken
) -> dict[str, bool]:
    """Store consent produced by the browser permission prompt."""
    endpoint = _safe_push_endpoint(subscription.endpoint)
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            existing = await session.scalar(
                select(PushSubscription).where(PushSubscription.endpoint == endpoint)
            )
            if existing is not None and existing.profile_id != profile.id:
                await session.rollback()
                raise HTTPException(
                    status_code=409, detail="Subscription is already owned"
                )
            statement = insert(PushSubscription).values(
                profile_id=profile.id,
                endpoint=endpoint,
                p256dh=subscription.keys.p256dh,
                auth=subscription.keys.auth,
            )
            await session.execute(
                statement.on_conflict_do_update(
                    index_elements=[PushSubscription.endpoint],
                    set_={
                        "p256dh": statement.excluded.p256dh,
                        "auth": statement.excluded.auth,
                        "expired_at": None,
                    },
                )
            )
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
    return {"enabled": True}


@router.delete("/push-subscription", status_code=status.HTTP_204_NO_CONTENT)
async def disable_push(x_device_token: DeviceToken) -> Response:
    """Opt out of push without changing any Interest."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            await session.execute(
                delete(PushSubscription).where(
                    PushSubscription.profile_id == profile.id
                )
            )
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
