"""Authenticated request/approval API for the EventMatch concierge."""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from langchain_core.messages import AIMessage
from langgraph.types import Command
from pydantic import BaseModel, ConfigDict, Field

from app.concierge import ConciergeContext
from app.concierge_config import get_concierge_settings
from app.database import get_session_factory
from app.routes.profiles import DeviceToken, _get_or_create_profile

router = APIRouter(prefix="/concierge")


class ConciergeMessageRequest(BaseModel):
    """One human message in a new or existing conversation."""

    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1)
    conversation_id: UUID | None = None


class ConciergeDecisionRequest(BaseModel):
    """Human resolution for the pending save proposal."""

    model_config = ConfigDict(extra="forbid")

    interrupt_id: str = Field(min_length=1, max_length=255)
    decision: Literal["approve", "reject"]
    reason: str | None = Field(default=None, max_length=500)


class ConciergeResponse(BaseModel):
    """Bounded non-streaming representation of a Deep Agent turn."""

    conversation_id: UUID
    status: Literal["completed", "approval_required"]
    response: str | None
    approval: dict[str, Any] | None = None


def _agent(request: Request) -> Any:
    agent = getattr(request.app.state, "concierge_agent", None)
    if agent is None:
        raise HTTPException(status_code=503, detail="Concierge is not configured")
    return agent


def _thread_id(profile_id: UUID, conversation_id: UUID) -> str:
    """Bind an untrusted conversation UUID to the trusted Profile identity."""
    return f"profile:{profile_id}:conversation:{conversation_id}"


def _config(profile_id: UUID, conversation_id: UUID) -> dict[str, Any]:
    return {"configurable": {"thread_id": _thread_id(profile_id, conversation_id)}}


async def _profile_id(device_token: str) -> UUID:
    async with get_session_factory()() as session:
        profile = await _get_or_create_profile(session, device_token)
        await session.commit()
        return profile.id


def _assistant_text(result: dict[str, Any]) -> str | None:
    for message in reversed(result.get("messages", [])):
        if not isinstance(message, AIMessage) or not message.content:
            continue
        if isinstance(message.content, str):
            return message.content
        text_blocks = [
            block.get("text", "")
            for block in message.content
            if isinstance(block, dict) and block.get("type") == "text"
        ]
        text = "".join(text_blocks)
        if text:
            return text
    return None


def _response(conversation_id: UUID, result: dict[str, Any]) -> ConciergeResponse:
    interrupts = result.get("__interrupt__", ())
    if interrupts:
        interrupt = interrupts[0]
        return ConciergeResponse(
            conversation_id=conversation_id,
            status="approval_required",
            response=_assistant_text(result),
            approval=jsonable_encoder(
                {"interrupt_id": interrupt.id, **interrupt.value}
            ),
        )
    return ConciergeResponse(
        conversation_id=conversation_id,
        status="completed",
        response=_assistant_text(result),
    )


@router.post("/messages", response_model=ConciergeResponse)
async def send_message(
    payload: ConciergeMessageRequest,
    request: Request,
    x_device_token: DeviceToken,
) -> ConciergeResponse:
    """Run one bounded concierge turn, pausing before every Saved Event write."""
    settings = get_concierge_settings()
    message = payload.message.strip()
    if not message or len(message) > settings.concierge_max_input_chars:
        raise HTTPException(
            status_code=422,
            detail=(
                "message must contain 1 to "
                f"{settings.concierge_max_input_chars} characters"
            ),
        )

    profile_id = await _profile_id(x_device_token)
    conversation_id = payload.conversation_id or uuid4()
    agent = _agent(request)
    config = _config(profile_id, conversation_id)

    if payload.conversation_id is not None:
        state = await agent.aget_state(config)
        if state.interrupts:
            raise HTTPException(
                status_code=409,
                detail="Resolve the pending save approval before sending a message",
            )

    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": message}]},
        config=config,
        context=ConciergeContext(profile_id=str(profile_id)),
    )
    return _response(conversation_id, result)


@router.post(
    "/conversations/{conversation_id}/decision",
    response_model=ConciergeResponse,
)
async def resolve_save(
    conversation_id: UUID,
    payload: ConciergeDecisionRequest,
    request: Request,
    x_device_token: DeviceToken,
) -> ConciergeResponse:
    """Approve or reject the exact pending save on this Profile-owned thread."""
    profile_id = await _profile_id(x_device_token)
    agent = _agent(request)
    config = _config(profile_id, conversation_id)
    state = await agent.aget_state(config)
    if not state.interrupts:
        raise HTTPException(status_code=409, detail="No save approval is pending")

    interrupt = state.interrupts[0]
    if interrupt.id != payload.interrupt_id:
        raise HTTPException(status_code=409, detail="Save approval is stale")
    action_requests = interrupt.value.get("action_requests", [])
    if len(action_requests) != 1 or action_requests[0].get("name") != "save_event":
        raise HTTPException(status_code=409, detail="Pending action is not a save")

    if payload.decision == "approve":
        decision: dict[str, str] = {"type": "approve"}
    else:
        decision = {
            "type": "reject",
            "message": payload.reason or "The user rejected saving this Event.",
        }
    result = await agent.ainvoke(
        Command(resume={"decisions": [decision]}),
        config=config,
        context=ConciergeContext(profile_id=str(profile_id)),
    )
    return _response(conversation_id, result)
