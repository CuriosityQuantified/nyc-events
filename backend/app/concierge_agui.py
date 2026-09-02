"""Issue #29 constrained Deep Agent and stable evaluation target."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Sequence
from datetime import date
from typing import Annotated, Any, Literal, cast
from uuid import UUID

from copilotkit import CopilotKitMiddleware
from deepagents import (
    GeneralPurposeSubagentProfile,
    HarnessProfile,
    create_deep_agent,
    register_harness_profile,
)
from langchain.agents.middleware import (
    AgentMiddleware,
    HumanInTheLoopMiddleware,
    ModelCallLimitMiddleware,
    ModelFallbackMiddleware,
    ToolCallLimitMiddleware,
    wrap_tool_call,
)
from langchain.tools import ToolRuntime, tool
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.base import BaseCheckpointSaver
from pydantic import Field, SecretStr

from app.concierge_config import get_concierge_settings
from app.concierge_tools import get_current_event
from app.database import get_session_factory
from app.services.current_event_search import CurrentEventSearch, search_current_events
from app.services.profile_preferences import (
    ConciergeDecision,
    apply_concierge_preference,
)

CONCIERGE_TOOL_NAMES = frozenset(
    {
        "search_current_events",
        "get_current_event",
        "save_event_alert_preference",
    }
)
_HARNESS_TOOLS = frozenset(
    {
        "write_todos",
        "ls",
        "read_file",
        "write_file",
        "edit_file",
        "delete",
        "glob",
        "grep",
        "execute",
        "task",
    }
)
_SENSITIVE_KEYS = frozenset(
    {"api_key", "authorization", "cookie", "device_token", "profile_id", "secret"}
)

SYSTEM_PROMPT = """You are the EventMatch NYC Concierge.
Use only search_current_events and get_current_event for Event facts. These tools read
only the latest current_events snapshot. Cite the source guid, freshness, and official
listing when available. Never invent or alter Event facts. You may write only a short
explanation of why stored facts match the request. An empty result does not prove that
no suitable Event exists; point the user to the official NYC Parks listing.

You may propose one alert preference with save_event_alert_preference. The tool always
pauses for approve, edit, or reject. Do not claim a Profile change before the approved
tool returns. Do not use SQL, code execution, files, planning, or task delegation.
"""


def _compact_event_result(result: dict[str, Any]) -> str:
    """Return bounded stored facts and provenance without raw repository data."""
    events = []
    for event in result.get("events", []):
        if not isinstance(event, dict):
            continue
        events.append(
            {
                key: event.get(key)
                for key in (
                    "guid",
                    "event_id",
                    "title",
                    "description",
                    "official_event_url",
                    "location_name",
                    "borough",
                    "start_date",
                    "end_date",
                    "start_datetime",
                    "end_datetime",
                    "categories",
                    "registration_status",
                    "is_free_explicit",
                    "accessibility_mentioned",
                )
            }
        )
    payload = {
        "events": events,
        "total": result.get("total", len(events)),
        "truncated": result.get("truncated", False),
        "freshness": result.get("freshness"),
    }
    return json.dumps(payload, separators=(",", ":"), default=str)


@tool("search_current_events", args_schema=CurrentEventSearch)
async def search_current_events_tool(
    query: str | None = None,
    event_id: str | None = None,
    borough: str | None = None,
    category: str | None = None,
    location: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    registration: Literal["required", "not_required", "closed", "not_listed"]
    | None = None,
    is_free_explicit: bool | None = None,
    accessibility_mentioned: bool | None = None,
    latitude_min: float | None = None,
    latitude_max: float | None = None,
    longitude_min: float | None = None,
    longitude_max: float | None = None,
    limit: int = 10,
) -> str:
    """Search only Event facts in the latest current_events snapshot."""
    criteria = CurrentEventSearch(
        query=query,
        event_id=event_id,
        borough=borough,
        category=category,
        location=location,
        date_from=date_from,
        date_to=date_to,
        registration=registration,
        is_free_explicit=is_free_explicit,
        accessibility_mentioned=accessibility_mentioned,
        latitude_min=latitude_min,
        latitude_max=latitude_max,
        longitude_min=longitude_min,
        longitude_max=longitude_max,
        limit=limit,
    )
    return _compact_event_result(await search_current_events(criteria))


@tool("get_current_event")
async def get_current_event_tool(
    guid: Annotated[str, Field(min_length=1, max_length=255)],
) -> str:
    """Get one Event from current_events by its exact source guid."""
    result = await get_current_event(guid)
    if result is None:
        return json.dumps({"guid": guid, "event": None}, separators=(",", ":"))
    event = result.get("event")
    return _compact_event_result(
        {
            "events": [event] if isinstance(event, dict) else [],
            "freshness": result.get("freshness"),
        }
    )


def _trusted_config(runtime: ToolRuntime[Any, Any]) -> dict[str, Any]:
    configurable = runtime.config.get("configurable", {})
    if not isinstance(configurable, dict):
        raise RuntimeError("Trusted concierge context is missing")
    return configurable


@tool("save_event_alert_preference")
async def save_event_alert_preference_tool(
    facet_type: Annotated[
        Literal["borough", "category", "registration"],
        Field(description="The exact supported Event facet."),
    ],
    facet_value: Annotated[str, Field(min_length=1, max_length=100)],
    alert_enabled: bool,
    runtime: ToolRuntime[Any, Any],
) -> str:
    """Save one validated alert preference after explicit human approval."""
    trusted = _trusted_config(runtime)
    profile_id = UUID(str(trusted["profile_id"]))
    thread_id = str(trusted["thread_id"])
    tool_call_id = runtime.tool_call_id or "missing-tool-call"
    digest = hashlib.sha256(
        f"{profile_id}:{thread_id}:{tool_call_id}".encode()
    ).hexdigest()
    decision: ConciergeDecision = (
        "edited" if trusted.get("concierge_decision") == "edit" else "approved"
    )
    async with get_session_factory()() as session:
        interest = await apply_concierge_preference(
            session,
            profile_id=profile_id,
            facet_type=facet_type,
            facet_value=facet_value,
            alert_enabled=alert_enabled,
            decision=decision,
            idempotency_key=digest,
        )
        await session.commit()
    if interest is None:  # pragma: no cover - approved decision invariant
        raise RuntimeError("Approved preference was not stored")
    return json.dumps(
        {
            "saved": True,
            "facet_type": interest.facet_type,
            "facet_value": interest.facet_value,
            "alert_enabled": interest.alert_enabled,
        },
        separators=(",", ":"),
    )


def _approval_description(tool_call: dict[str, Any], _state: Any, _runtime: Any) -> str:
    args = tool_call.get("args", {})
    facet_type = str(args.get("facet_type", "unknown"))[:32]
    facet_value = str(args.get("facet_value", "unknown"))[:100]
    effect = (
        "send alerts" if args.get("alert_enabled") is True else "save without alerts"
    )
    return f"Save {facet_type} = {facet_value!r} and {effect}."


@wrap_tool_call
async def enforce_tool_allowlist(request: Any, handler: Any) -> Any:
    """Reject injected frontend, harness, SQL, and code-execution tools."""
    if request.tool_call["name"] not in CONCIERGE_TOOL_NAMES:
        return ToolMessage(
            content="Tool rejected: the Concierge has exactly three bounded tools.",
            tool_call_id=request.tool_call["id"],
            status="error",
        )
    return await handler(request)


def _register_profile(profile_key: str) -> None:
    register_harness_profile(
        profile_key,
        HarnessProfile(
            base_system_prompt=SYSTEM_PROMPT,
            excluded_tools=_HARNESS_TOOLS,
            general_purpose_subagent=GeneralPurposeSubagentProfile(enabled=False),
        ),
    )


def build_concierge_agui_agent(
    *,
    model: BaseChatModel,
    checkpointer: BaseCheckpointSaver[Any],
    profile_key: str = "openai",
    fallback_models: Sequence[BaseChatModel] = (),
) -> Any:
    """Build the production-shaped three-tool Deep Agent."""
    _register_profile(profile_key)
    middleware: list[AgentMiddleware[Any, Any, Any]] = [
        CopilotKitMiddleware(),
        enforce_tool_allowlist,
        HumanInTheLoopMiddleware(
            interrupt_on=cast(
                Any,
                {
                    "save_event_alert_preference": {
                        "allowed_decisions": ["approve", "edit", "reject"],
                        "description": _approval_description,
                    }
                },
            )
        ),
        ModelCallLimitMiddleware(run_limit=8, exit_behavior="end"),
        ToolCallLimitMiddleware(run_limit=8, exit_behavior="end"),
        ToolCallLimitMiddleware(
            tool_name="save_event_alert_preference", run_limit=1, exit_behavior="end"
        ),
    ]
    if fallback_models:
        middleware.append(ModelFallbackMiddleware(*fallback_models))
    return create_deep_agent(
        model=model,
        tools=[
            search_current_events_tool,
            get_current_event_tool,
            save_event_alert_preference_tool,
        ],
        middleware=middleware,
        checkpointer=checkpointer,
        name="eventmatch_concierge",
    )


def build_default_concierge_agui_agent(
    checkpointer: BaseCheckpointSaver[Any],
) -> Any:
    """Build the production model object and explicit ordered fallback chain."""
    settings = get_concierge_settings()
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY is required for the concierge")

    def model(model_name: str) -> ChatOpenAI:
        return ChatOpenAI(
            model=model_name,
            api_key=SecretStr(settings.openrouter_api_key),
            base_url=settings.openrouter_base_url,
            temperature=0,
            max_retries=0,
        )

    models = [model(name) for name in settings.model_chain]
    return build_concierge_agui_agent(
        model=models[0],
        fallback_models=models[1:],
        checkpointer=checkpointer,
    )


def _redact(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: _redact(item)
            for key, item in value.items()
            if key.casefold() not in _SENSITIVE_KEYS
        }
    if isinstance(value, list):
        return [_redact(item) for item in value[:25]]
    if isinstance(value, str):
        return value[:500]
    return value


def normalize_evaluation_result(
    *, final_response: str, trajectory: list[dict[str, Any]]
) -> dict[str, Any]:
    """Return the stable, privacy-safe target consumed by Issue #31."""
    normalized = []
    for step in trajectory[:25]:
        normalized.append(
            {
                "name": str(step.get("name", ""))[:64],
                "arguments": _redact(step.get("arguments", {})),
                "result": _redact(step.get("result", {})),
                "status": str(step.get("status", "unknown"))[:16],
            }
        )
    return {"final_response": final_response[:4000], "trajectory": normalized}
