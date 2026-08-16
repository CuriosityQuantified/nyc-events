"""Authenticated request/approval API for the EventMatch concierge."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, AIMessageChunk
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
        if not isinstance(message, AIMessage):
            continue
        if not message.content:
            return None
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


def _sse(event: str, data: Any) -> str:
    """Encode one bounded Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(data, separators=(',', ':'))}\n\n"


def _streamed_text(part: Any) -> str | None:
    """Extract visible assistant text from LangGraph v1 or v2 message events."""
    data: Any = None
    if isinstance(part, dict) and part.get("type") == "messages":
        data = part.get("data")
    elif isinstance(part, tuple) and len(part) == 2 and part[0] == "messages":
        data = part[1]
    if not isinstance(data, tuple) or not data:
        return None
    chunk = data[0]
    if not isinstance(chunk, (AIMessage, AIMessageChunk)) or not chunk.content:
        return None
    if isinstance(chunk.content, str):
        return chunk.content
    text = "".join(
        block.get("text", "")
        for block in chunk.content
        if isinstance(block, dict) and block.get("type") == "text"
    )
    return text or None


async def _stream_turn(
    *,
    agent: Any,
    conversation_id: UUID,
    config: dict[str, Any],
    context: ConciergeContext,
    input_value: Any,
) -> AsyncIterator[str]:
    """Stream model tokens, then emit the authoritative checkpoint state."""
    yield _sse("conversation", {"conversation_id": str(conversation_id)})
    try:
        async for part in agent.astream(
            input_value,
            config=config,
            context=context,
            stream_mode=["messages", "updates"],
            version="v2",
        ):
            text = _streamed_text(part)
            if text:
                yield _sse("token", {"text": text})

        state = await agent.aget_state(config)
        result = dict(state.values)
        if state.interrupts:
            result["__interrupt__"] = state.interrupts
        response = _response(conversation_id, result)
        yield _sse("done", response.model_dump(mode="json"))
    except Exception:
        # Streaming responses have already sent their HTTP status. Keep provider,
        # database, and orchestration details out of the browser-visible event.
        yield _sse("error", {"error": "The concierge is unavailable right now."})


def _streaming_response(events: AsyncIterator[str]) -> StreamingResponse:
    return StreamingResponse(
        events,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store",
            "X-Accel-Buffering": "no",
        },
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


@router.post("/messages/stream")
async def stream_message(
    payload: ConciergeMessageRequest,
    request: Request,
    x_device_token: DeviceToken,
) -> StreamingResponse:
    """Stream one concierge turn while retaining the same approval boundary."""
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

    return _streaming_response(
        _stream_turn(
            agent=agent,
            conversation_id=conversation_id,
            config=config,
            context=ConciergeContext(profile_id=str(profile_id)),
            input_value={"messages": [{"role": "user", "content": message}]},
        )
    )


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


@router.post("/conversations/{conversation_id}/decision/stream")
async def stream_save_resolution(
    conversation_id: UUID,
    payload: ConciergeDecisionRequest,
    request: Request,
    x_device_token: DeviceToken,
) -> StreamingResponse:
    """Stream the continuation after approving or rejecting a pending save."""
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
    return _streaming_response(
        _stream_turn(
            agent=agent,
            conversation_id=conversation_id,
            config=config,
            context=ConciergeContext(profile_id=str(profile_id)),
            input_value=Command(resume={"decisions": [decision]}),
        )
    )
