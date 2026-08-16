"""Constrained LangChain Deep Agent for current Event discovery and saving."""

import json
from dataclasses import dataclass
from datetime import date
from typing import Annotated, Any, Literal
from uuid import UUID

from deepagents import (
    GeneralPurposeSubagentProfile,
    HarnessProfile,
    create_deep_agent,
    register_harness_profile,
)
from langchain.agents.middleware import (
    AgentMiddleware,
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
from app.database import get_session_factory
from app.services.current_event_search import CurrentEventSearch, search_current_events
from app.services.saved_events import EventNotCurrentError, save_current_event

CONCIERGE_TOOL_NAMES = frozenset({"search_current_events", "save_event"})
_DEEP_AGENT_TOOLS = frozenset(
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
    }
)

CONCIERGE_SYSTEM_PROMPT = """You are the EventMatch NYC concierge.

You have exactly two capabilities:
1. Search the latest successful NYC Parks Event snapshot with search_current_events.
2. Propose saving a returned Event with save_event. Every save pauses for the human
   to approve or reject before any database write occurs.

Search before recommending or saving. Use only Event facts returned by the search
tool. Treat event_id as the authoritative identifier. Never invent price, capacity,
availability, accessibility, cancellation status, or travel time. Preserve explicit
"Not listed" uncertainty, mention freshness when relevant, and link to the official
Event URL when one is present. A zero-result search means only that the current data
did not return a match; it does not prove that no suitable Event exists.

For a discovery request, make a focused search_current_events call and set limit to
the number of Events requested (or 5 when no number is given). Do not call any
filesystem, shell, or other harness tools, and do not retry an equivalent search.

Call save_event only after the user explicitly asks to save a specific Event. Do not
claim that an Event was saved until the approved tool call returns successfully.
"""


@dataclass(frozen=True)
class ConciergeContext:
    """Trusted identity injected by the server and hidden from the model."""

    profile_id: str


def _concierge_fact(event: dict[str, Any], key: str, *, limit: int = 800) -> Any:
    """Keep the model-facing search payload factual without duplicating raw data."""
    fact = event.get(key)
    if not isinstance(fact, dict):
        return fact
    value = fact.get("value")
    if isinstance(value, str) and len(value) > limit:
        value = value[:limit].rstrip() + "…"
    return {"value": value, "provenance": fact.get("provenance")}


def _compact_concierge_event(event: dict[str, Any]) -> dict[str, Any]:
    """Return only the bounded facts needed to recommend or save an Event."""
    return {
        "event_id": event.get("event_id") or event.get("guid"),
        "title": _concierge_fact(event, "title"),
        "description": _concierge_fact(event, "description"),
        "official_event_url": _concierge_fact(event, "official_event_url"),
        "location_name": _concierge_fact(event, "location_name"),
        "borough": _concierge_fact(event, "borough"),
        "start_date": _concierge_fact(event, "start_date"),
        "end_date": _concierge_fact(event, "end_date"),
        "start_datetime": _concierge_fact(event, "start_datetime"),
        "end_datetime": _concierge_fact(event, "end_datetime"),
        "categories": _concierge_fact(event, "categories"),
        "registration_status": _concierge_fact(event, "registration_status"),
        "registration_description": _concierge_fact(event, "registration_description"),
        "is_free_explicit": _concierge_fact(event, "is_free_explicit"),
        "accessibility_mentioned": _concierge_fact(event, "accessibility_mentioned"),
    }


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
    """Search all values in the latest current Events SQL table."""
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
    result = await search_current_events(criteria)
    result["events"] = [
        _compact_concierge_event(event)
        for event in result.get("events", [])
        if isinstance(event, dict)
    ]
    return json.dumps(result, separators=(",", ":"), default=str)


@tool("save_event")
async def save_event_tool(
    event_id: Annotated[
        str,
        Field(
            min_length=1,
            max_length=255,
            description="Exact event_id returned by search_current_events.",
        ),
    ],
    runtime: ToolRuntime[ConciergeContext],
) -> str:
    """Save one current Event after the human approves this exact Event ID."""
    profile_id = UUID(runtime.context.profile_id)
    async with get_session_factory()() as session:
        try:
            created = await save_current_event(
                session, profile_id=profile_id, event_id=event_id
            )
            await session.commit()
        except EventNotCurrentError:
            await session.rollback()
            return json.dumps(
                {
                    "event_id": event_id,
                    "saved": False,
                    "error": "Event is not in the current Snapshot",
                },
                separators=(",", ":"),
            )
    return json.dumps(
        {
            "event_id": event_id,
            "saved": True,
            "already_saved": not created,
        },
        separators=(",", ":"),
    )


@wrap_tool_call
async def enforce_concierge_tool_allowlist(request: Any, handler: Any) -> Any:
    """Prevent even a malformed model response from invoking harness tools."""
    tool_name = request.tool_call["name"]
    if tool_name not in CONCIERGE_TOOL_NAMES:
        return ToolMessage(
            content=(
                "Tool call rejected: this concierge has only Event search and save."
            ),
            tool_call_id=request.tool_call["id"],
            status="error",
        )
    return await handler(request)


def _register_concierge_profile(profile_key: str) -> None:
    register_harness_profile(
        profile_key,
        HarnessProfile(
            base_system_prompt=CONCIERGE_SYSTEM_PROMPT,
            excluded_tools=_DEEP_AGENT_TOOLS,
            general_purpose_subagent=GeneralPurposeSubagentProfile(enabled=False),
        ),
    )


def create_concierge_agent(
    *,
    model: BaseChatModel,
    checkpointer: BaseCheckpointSaver[Any],
    profile_key: str,
    fallback_model: BaseChatModel | None = None,
) -> Any:
    """Build the two-tool Deep Agent around an injected model/checkpointer."""
    _register_concierge_profile(profile_key)
    middleware: list[AgentMiddleware[Any, Any, Any]] = [
        enforce_concierge_tool_allowlist,
        ModelCallLimitMiddleware(run_limit=8, exit_behavior="end"),
        ToolCallLimitMiddleware(run_limit=8, exit_behavior="end"),
        ToolCallLimitMiddleware(
            tool_name="save_event", run_limit=4, exit_behavior="end"
        ),
    ]
    if fallback_model is not None:
        middleware.append(ModelFallbackMiddleware(fallback_model))
    return create_deep_agent(
        model=model,
        tools=[search_current_events_tool, save_event_tool],
        middleware=middleware,
        interrupt_on={
            "save_event": {
                "allowed_decisions": ["approve", "reject"],
                "description": (
                    "Save this exact Event to your Saved Events. No database write "
                    "occurs unless you approve."
                ),
            }
        },
        context_schema=ConciergeContext,
        checkpointer=checkpointer,
        name="eventmatch_concierge",
    )


def create_default_concierge_agent(
    checkpointer: BaseCheckpointSaver[Any],
) -> Any:
    """Build the production OpenRouter-backed concierge with a fallback model."""
    settings = get_concierge_settings()
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY is required for the concierge")

    primary = ChatOpenAI(
        model=settings.concierge_model_primary,
        api_key=SecretStr(settings.openrouter_api_key),
        base_url=settings.openrouter_base_url,
        temperature=0,
        max_retries=0,
    )
    fallback = ChatOpenAI(
        model=settings.concierge_model_fallback,
        api_key=SecretStr(settings.openrouter_api_key),
        base_url=settings.openrouter_base_url,
        temperature=0,
        max_retries=0,
    )
    return create_concierge_agent(
        model=primary,
        fallback_model=fallback,
        checkpointer=checkpointer,
        # ChatOpenAI resolves as the ``openai`` provider even when its base URL
        # points at OpenRouter. Register the provider-level profile because
        # OpenRouter model identifiers may themselves contain a colon.
        profile_key="openai",
    )
