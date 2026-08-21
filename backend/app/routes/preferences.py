"""Profile Interest, alert-preference, and Match API."""

from __future__ import annotations

from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Path, Query, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_session_factory
from app.models.event import EventRepository
from app.models.profile import Interest, MatchedEvent, SavedEvent
from app.routes.events import _event_date_expression, _event_to_contract
from app.routes.profiles import (
    DeviceToken,
    _database_unavailable,
    _get_or_create_profile,
)
from app.services.profile_preferences import (
    PreferenceValidationError,
    remove_interest,
    set_manual_composite_interest,
    set_manual_interest,
)

router = APIRouter(prefix="/profile")
InterestId = Annotated[UUID, Path()]


class FacetMember(BaseModel):
    """One Facet inside a combined Interest."""

    model_config = ConfigDict(extra="forbid")

    facet_type: Literal["borough", "category", "registration"]
    facet_value: Annotated[str, Field(min_length=1, max_length=100)]


class InterestRequest(BaseModel):
    """One Facet — or a combination of Facets — and its alert preference."""

    model_config = ConfigDict(extra="forbid")

    facet_type: Literal["borough", "category", "registration"] | None = None
    facet_value: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    facets: Annotated[list[FacetMember], Field(min_length=2, max_length=3)] | None = (
        None
    )
    alert_enabled: bool = True


def _interest_contract(interest: Interest) -> dict[str, Any]:
    facets = interest.facets or [
        {
            "facet_type": interest.facet_type,
            "facet_value": interest.facet_value,
        }
    ]
    return {
        "id": str(interest.id),
        "facet_type": interest.facet_type,
        "facet_value": interest.facet_value,
        "facets": [
            {
                "facet_type": member["facet_type"],
                "facet_value": member["facet_value"],
            }
            for member in facets
        ],
        "alert_enabled": interest.alert_enabled,
        "origin": interest.origin,
    }


@router.get("/interests")
async def list_interests(x_device_token: DeviceToken) -> dict[str, Any]:
    """List every Facet followed by this Profile."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            interests = (
                await session.scalars(
                    select(Interest)
                    .where(Interest.profile_id == profile.id)
                    .order_by(Interest.facet_type, Interest.normalized_value)
                )
            ).all()
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
        return {
            "profile_id": str(profile.id),
            "interests": [_interest_contract(interest) for interest in interests],
            "total": len(interests),
        }


@router.put("/interests")
async def follow_interest(
    preference: InterestRequest, x_device_token: DeviceToken
) -> dict[str, Any]:
    """Idempotently follow or update one repeatable Facet."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            if preference.facets is not None:
                interest = await set_manual_composite_interest(
                    session,
                    profile_id=profile.id,
                    facets=[
                        (member.facet_type, member.facet_value)
                        for member in preference.facets
                    ],
                    alert_enabled=preference.alert_enabled,
                )
            elif preference.facet_type and preference.facet_value:
                interest = await set_manual_interest(
                    session,
                    profile_id=profile.id,
                    facet_type=preference.facet_type,
                    facet_value=preference.facet_value,
                    alert_enabled=preference.alert_enabled,
                )
            else:
                await session.rollback()
                raise HTTPException(
                    status_code=422,
                    detail="Provide facet_type and facet_value, or facets",
                )
            await session.commit()
            await session.refresh(interest)
        except PreferenceValidationError as error:
            await session.rollback()
            raise HTTPException(status_code=422, detail=str(error)) from error
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
        return _interest_contract(interest)


@router.delete("/interests/{interest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_interest(
    x_device_token: DeviceToken,
    interest_id: InterestId,
) -> Response:
    """Idempotently stop following one Profile-owned Interest."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            await remove_interest(
                session, profile_id=profile.id, interest_id=interest_id
            )
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/matches")
async def list_matches(
    x_device_token: DeviceToken,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict[str, Any]:
    """List active automatic suggestions separately from Saved Events."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            match_filter = (
                MatchedEvent.profile_id == profile.id,
                MatchedEvent.status == "active",
            )
            total = (
                await session.scalar(
                    select(func.count()).select_from(MatchedEvent).where(*match_filter)
                )
                or 0
            )
            events = (
                await session.scalars(
                    select(EventRepository)
                    .join(
                        MatchedEvent,
                        MatchedEvent.event_guid == EventRepository.guid,
                    )
                    .where(*match_filter)
                    .order_by(
                        _event_date_expression(EventRepository).asc().nullslast(),
                        EventRepository.start_datetime.asc().nullslast(),
                        MatchedEvent.matched_at,
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


@router.put("/matches/{guid}/saved")
async def promote_match(
    x_device_token: DeviceToken,
    guid: str = Path(min_length=1, max_length=255),
) -> dict[str, Any]:
    """Promote one Profile-owned Match into Saved without merging the lists."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            match = await session.scalar(
                select(MatchedEvent).where(
                    MatchedEvent.profile_id == profile.id,
                    MatchedEvent.event_guid == guid,
                    MatchedEvent.status.in_(["active", "promoted"]),
                )
            )
            if match is None:
                await session.rollback()
                raise HTTPException(status_code=404, detail="Match not found")
            await session.execute(
                insert(SavedEvent)
                .values(profile_id=profile.id, event_guid=guid)
                .on_conflict_do_nothing(
                    index_elements=[SavedEvent.profile_id, SavedEvent.event_guid]
                )
            )
            match.status = "promoted"
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
        return {
            "profile_id": str(profile.id),
            "event_guid": guid,
            "matched": False,
            "saved": True,
        }


@router.delete("/matches/{guid}", status_code=status.HTTP_204_NO_CONTENT)
async def dismiss_match(
    x_device_token: DeviceToken,
    guid: str = Path(min_length=1, max_length=255),
) -> Response:
    """Idempotently dismiss one Profile-owned Match."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            profile = await _get_or_create_profile(session, x_device_token)
            await session.execute(
                update(MatchedEvent)
                .where(
                    MatchedEvent.profile_id == profile.id,
                    MatchedEvent.event_guid == guid,
                    MatchedEvent.status == "active",
                )
                .values(status="dismissed")
            )
            await session.commit()
        except SQLAlchemyError as error:
            await _database_unavailable(session, error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
