"""Anonymous Profile and Saved Events API."""

from __future__ import annotations

import hashlib
from typing import Annotated, Any, NoReturn
from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException, Path, Query, Response, status
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session_factory
from app.models.event import EventRepository
from app.models.profile import Profile, SavedEvent
from app.routes.events import _event_date_expression, _event_to_contract
from app.services.saved_events import EventNotCurrentError, save_current_event

router = APIRouter(prefix="/profile")

DeviceToken = Annotated[
    str,
    Header(
        alias="X-Device-Token",
        min_length=32,
        max_length=255,
        pattern=r"^[A-Za-z0-9._~-]+$",
    ),
]


def _token_digest(token: str) -> str:
    """Return a non-reversible lookup key for a high-entropy device token."""
    return hashlib.sha256(token.encode()).hexdigest()


async def _get_or_create_profile(session: AsyncSession, token: str) -> Profile:
    """Return the token's Profile, creating it atomically on first use."""
    token_hash = _token_digest(token)
    new_id = uuid4()
    await session.execute(
        insert(Profile)
        .values(id=new_id, device_token_hash=token_hash, user_id=None)
        .on_conflict_do_nothing(index_elements=[Profile.device_token_hash])
    )
    profile = await session.scalar(
        select(Profile).where(Profile.device_token_hash == token_hash)
    )
    if profile is None:  # pragma: no cover - database invariant guard
        raise RuntimeError("Profile upsert did not return a Profile")
    return profile


def _profile_contract(profile: Profile) -> dict[str, Any]:
    return {"id": str(profile.id), "claimed": profile.user_id is not None}


async def _database_unavailable(
    session: AsyncSession, error: SQLAlchemyError
) -> NoReturn:
    await session.rollback()
    raise HTTPException(
        status_code=503, detail="Profile database unavailable"
    ) from error


@router.get("")
async def get_profile(x_device_token: DeviceToken) -> dict[str, Any]:
    """Create or return the anonymous Profile for this device token."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
        return _profile_contract(profile)


@router.get("/saved")
async def list_saved_events(
    x_device_token: DeviceToken,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict[str, Any]:
    """Return this Profile's Saved Events, including archival Events."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            profile_filter = SavedEvent.profile_id == profile.id
            total = (
                await session.scalar(
                    select(func.count()).select_from(SavedEvent).where(profile_filter)
                )
                or 0
            )
            events = (
                await session.scalars(
                    select(EventRepository)
                    .join(SavedEvent, SavedEvent.event_guid == EventRepository.guid)
                    .where(profile_filter)
                    .order_by(
                        _event_date_expression(EventRepository).asc().nullslast(),
                        EventRepository.start_datetime.asc().nullslast(),
                        SavedEvent.saved_at,
                        EventRepository.guid,
                    )
                    .offset((page - 1) * page_size)
                    .limit(page_size)
                )
            ).all()
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
        return {
            "profile_id": str(profile.id),
            "events": [_event_to_contract(event) for event in events],
            "page": page,
            "page_size": page_size,
            "total": total,
        }


@router.put("/saved/{guid}")
async def save_event(
    x_device_token: DeviceToken,
    guid: str = Path(min_length=1, max_length=255),
) -> dict[str, Any]:
    """Idempotently add one current Event to this Profile's Saved list."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            try:
                await save_current_event(session, profile_id=profile.id, event_id=guid)
            except EventNotCurrentError:
                await session.rollback()
                raise HTTPException(status_code=404, detail="Event not found") from None
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
        return {"profile_id": str(profile.id), "event_guid": guid, "saved": True}


@router.delete("/saved/{guid}", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_event(
    x_device_token: DeviceToken,
    guid: str = Path(min_length=1, max_length=255),
) -> Response:
    """Idempotently remove one Event from this Profile's Saved list."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            await session.execute(
                delete(SavedEvent).where(
                    SavedEvent.profile_id == profile.id,
                    SavedEvent.event_guid == guid,
                )
            )
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
