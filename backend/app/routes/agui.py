"""Authenticated AG-UI endpoint for the Issue #29 Concierge."""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import re
from collections.abc import AsyncIterator, Iterable
from typing import Any
from uuid import UUID

import redis.asyncio as aioredis
from ag_ui.core import (
    EventType,
    ResumeEntry,
    RunAgentInput,
    RunErrorEvent,
    RunStartedEvent,
)
from ag_ui.encoder import EventEncoder
from copilotkit import LangGraphAGUIAgent
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from langsmith import Client, tracing_context

from app.concierge_config import get_concierge_settings
from app.config import get_settings
from app.routes.concierge import _profile_id
from app.routes.profiles import DeviceToken

router = APIRouter(prefix="/ag-ui")
logger = logging.getLogger(__name__)
_SAFE_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")
_ALLOWED_DECISIONS = {"approve", "edit", "reject"}
_TRACE_PRIVATE_KEYS = {
    "authorization",
    "content",
    "cookie",
    "device_token",
    "error",
    "messages",
    "profile_id",
    "prompt",
    "secret",
}


class InvalidResumeError(ValueError):
    """A resume does not match the one durable pending interrupt."""


def trusted_thread_id(profile_id: str, client_thread_id: str) -> str:
    """Bind a bounded opaque thread to a Profile without exposing its identifier."""
    if not _SAFE_ID.fullmatch(client_thread_id):
        raise ValueError("threadId has an invalid format")
    digest = hashlib.sha256(f"{profile_id}:{client_thread_id}".encode()).hexdigest()
    return f"concierge:{digest}"


def _audit_id(value: str) -> str:
    """Return a non-reversible identifier safe for structured audit logs."""
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def _anonymize_trace_payload(value: Any) -> Any:
    """Remove free-form text, identity, auth data, and secrets before export."""
    if isinstance(value, dict):
        return {
            key: (
                "[redacted]"
                if key.casefold() in _TRACE_PRIVATE_KEYS
                else _anonymize_trace_payload(item)
            )
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [_anonymize_trace_payload(item) for item in value[:25]]
    if isinstance(value, str):
        return value[:256]
    return value


def _langsmith_client() -> Client | None:
    """Build a bounded asynchronous trace client only in trusted environments."""
    settings = get_concierge_settings()
    if not settings.langsmith_tracing or settings.langsmith_api_key is None:
        return None
    return Client(
        api_key=settings.langsmith_api_key.get_secret_value(),
        workspace_id=settings.langsmith_workspace_id,
        auto_batch_tracing=True,
        timeout_ms=500,
        anonymizer=_anonymize_trace_payload,
        tracing_error_callback=lambda _error: None,
    )


def _message_text_size(message: Any) -> int:
    content = getattr(message, "content", "")
    if isinstance(content, str):
        return len(content)
    return len(json.dumps(content, separators=(",", ":"), default=str))


def sanitize_agui_input(
    input_data: RunAgentInput, *, profile_id: str, max_input_chars: int
) -> RunAgentInput:
    """Remove model-controlled tools, context, state, and trusted identity fields."""
    if not _SAFE_ID.fullmatch(input_data.run_id):
        raise ValueError("runId has an invalid format")
    if not input_data.messages or len(input_data.messages) > 100:
        raise ValueError("messages must contain 1 to 100 entries")
    if (
        sum(_message_text_size(message) for message in input_data.messages)
        > max_input_chars
    ):
        raise ValueError("message input is too large")
    return input_data.model_copy(
        update={
            "thread_id": trusted_thread_id(profile_id, input_data.thread_id),
            "tools": [],
            "context": [],
            "state": {},
            "forwarded_props": {},
        }
    )


def validate_resume_entries(
    entries: Iterable[ResumeEntry], open_interrupt_ids: set[str]
) -> None:
    """Reject stale, duplicate, out-of-order, and malformed resume decisions."""
    entries = list(entries)
    ids = [entry.interrupt_id for entry in entries]
    if len(ids) != len(set(ids)) or set(ids) != open_interrupt_ids:
        raise InvalidResumeError("Resume is stale, duplicated, or out of order")
    for entry in entries:
        if entry.status == "cancelled":
            if entry.payload not in (None, {}):
                raise InvalidResumeError("Cancelled resume must not carry a payload")
            continue
        payload = entry.payload
        decisions = payload.get("decisions") if isinstance(payload, dict) else None
        if not isinstance(decisions, list) or len(decisions) != 1:
            raise InvalidResumeError("Resume must contain exactly one decision")
        decision = decisions[0]
        if (
            not isinstance(decision, dict)
            or decision.get("type") not in _ALLOWED_DECISIONS
        ):
            raise InvalidResumeError("Unsupported resume decision")
        if decision["type"] == "edit":
            action = decision.get("edited_action") or decision.get("editedAction")
            if not isinstance(action, dict) or action.get("name") != (
                "save_event_alert_preference"
            ):
                raise InvalidResumeError("Edited decision must target the pending tool")
            args = action.get("args")
            if not isinstance(args, dict) or set(args) != {
                "facet_type",
                "facet_value",
                "alert_enabled",
            }:
                raise InvalidResumeError("Edited preference has an invalid schema")


def _verify_request_boundary(request: Request) -> None:
    settings = get_concierge_settings()
    origin = request.headers.get("origin")
    if origin and origin != get_settings().frontend_origin:
        raise HTTPException(status_code=403, detail="Origin is not allowed")
    expected = settings.concierge_proxy_secret
    provided = request.headers.get("x-concierge-proxy-token", "")
    if expected and not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="AG-UI proxy authentication failed")
    if get_settings().environment == "production" and not expected:
        raise HTTPException(
            status_code=503, detail="AG-UI proxy authentication is not configured"
        )


async def _enforce_rate_limit(profile_id: UUID) -> None:
    """Use Redis so limits are shared across workers and fail closed."""
    settings = get_concierge_settings()
    redis = aioredis.from_url(get_settings().redis_url, socket_timeout=2)
    key = f"concierge-rate:{hashlib.sha256(str(profile_id).encode()).hexdigest()}"
    try:
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, 60)
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail="Rate limiter is unavailable"
        ) from exc
    finally:
        await redis.aclose()
    if count > settings.concierge_runs_per_minute:
        raise HTTPException(status_code=429, detail="Concierge rate limit exceeded")


def _decision_type(input_data: RunAgentInput) -> str:
    for entry in input_data.resume or []:
        if isinstance(entry.payload, dict):
            decisions = entry.payload.get("decisions")
            if isinstance(decisions, list) and decisions:
                decision = decisions[0]
                if isinstance(decision, dict):
                    return str(decision.get("type", "approve"))
    return "approve"


async def _open_interrupt_ids(graph: Any, thread_id: str) -> set[str]:
    state = await graph.aget_state({"configurable": {"thread_id": thread_id}})
    return {interrupt.id for interrupt in state.interrupts}


async def _event_stream(
    *, graph: Any, input_data: RunAgentInput, profile_id: UUID, accept: str | None
) -> AsyncIterator[str]:
    """Encode one isolated AG-UI run and redact terminal exceptions."""
    del accept  # This endpoint supports SSE only.
    encoder = EventEncoder(accept="text/event-stream")
    settings = get_concierge_settings()
    config = {
        "run_name": "eventmatch_concierge",
        "configurable": {
            "thread_id": input_data.thread_id,
            "profile_id": str(profile_id),
            "run_id": input_data.run_id,
            "concierge_decision": _decision_type(input_data),
        },
        "tags": ["concierge", "ag-ui"],
        "metadata": {
            "environment": get_settings().environment,
            "agent_version": "issue-29-v1",
            "prompt_version": "issue-29-v1",
            "model_version": settings.model_chain[0],
            "deployment_revision": os.environ.get(
                "RAILWAY_GIT_COMMIT_SHA", os.environ.get("GIT_COMMIT_SHA", "local")
            )[:64],
            "thread_hash": input_data.thread_id.removeprefix("concierge:")[:16],
            "request_hash": _audit_id(input_data.run_id),
        },
    }
    agent = LangGraphAGUIAgent(
        name="concierge",
        description="Grounded NYC Event discovery with approved alert preferences.",
        graph=graph,
        config=config,
    )
    started = False
    terminal = False
    try:
        try:
            trace_client = _langsmith_client()
        except Exception as exc:
            logger.warning(
                "concierge_tracing_disabled exception_type=%s", type(exc).__name__
            )
            trace_client = None
        with tracing_context(
            project_name=settings.langsmith_project,
            enabled=trace_client is not None,
            client=trace_client,
        ):
            async for event in agent.run(input_data):
                event_type = getattr(event, "type", None)
                if terminal:
                    break
                if event_type == EventType.RUN_STARTED:
                    if started:
                        raise ValueError("AG-UI run started more than once")
                    started = True
                elif not started:
                    raise ValueError("AG-UI event arrived before RUN_STARTED")
                terminal = event_type in {
                    EventType.RUN_FINISHED,
                    EventType.RUN_ERROR,
                }
                if event_type == EventType.RUN_ERROR:
                    event = RunErrorEvent(
                        type=EventType.RUN_ERROR,
                        message="The concierge is unavailable right now.",
                    )
                yield encoder.encode(event)
            if not terminal:
                raise RuntimeError("AG-UI run ended without a terminal event")
    except Exception as exc:
        logger.error(
            "concierge_agui_run_failed exception_type=%s run=%s",
            type(exc).__name__,
            _audit_id(input_data.run_id),
        )
        if not started:
            yield encoder.encode(
                RunStartedEvent(
                    type=EventType.RUN_STARTED,
                    thread_id=input_data.thread_id,
                    run_id=input_data.run_id,
                )
            )
        if not terminal:
            yield encoder.encode(
                RunErrorEvent(
                    type=EventType.RUN_ERROR,
                    message="The concierge is unavailable right now.",
                )
            )


@router.post("/concierge")
async def concierge_agui_endpoint(
    input_data: RunAgentInput,
    request: Request,
    x_device_token: DeviceToken,
) -> StreamingResponse:
    """Authenticate, authorize, bound, and stream one AG-UI run."""
    _verify_request_boundary(request)
    profile_id = await _profile_id(x_device_token)
    await _enforce_rate_limit(profile_id)
    settings = get_concierge_settings()
    try:
        sanitized = sanitize_agui_input(
            input_data,
            profile_id=str(profile_id),
            max_input_chars=settings.concierge_max_input_chars,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    graph = getattr(request.app.state, "concierge_agui_agent", None)
    if graph is None:
        raise HTTPException(status_code=503, detail="Concierge is not configured")
    if sanitized.resume:
        try:
            validate_resume_entries(
                sanitized.resume,
                await _open_interrupt_ids(graph, sanitized.thread_id),
            )
        except InvalidResumeError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc

    logger.info(
        "concierge_agui_request profile=%s thread=%s resumed=%s decision=%s",
        _audit_id(str(profile_id)),
        _audit_id(sanitized.thread_id),
        bool(sanitized.resume),
        _decision_type(sanitized) if sanitized.resume else "none",
    )

    return StreamingResponse(
        _event_stream(
            graph=graph,
            input_data=sanitized,
            profile_id=profile_id,
            accept=request.headers.get("accept"),
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store",
            "X-Accel-Buffering": "no",
        },
    )
