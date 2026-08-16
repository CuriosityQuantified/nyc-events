"""Deep Agent, SQL search, and human-approved Saved Event gates."""

from __future__ import annotations

import json
from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langgraph.checkpoint.memory import InMemorySaver
from pydantic import Field
from sqlalchemy import func, select

from app.concierge import (
    ConciergeContext,
    create_concierge_agent,
    create_default_concierge_agent,
    save_event_tool,
)
from app.main import app
from app.models.profile import SavedEvent
from app.services.current_event_search import CurrentEventSearch, search_current_events
from tests.conftest import ingest_rows, load_fixture, requires_docker
from tests.test_profiles import DEVICE_TOKEN, OTHER_DEVICE_TOKEN, _headers


class ScriptedToolModel(BaseChatModel):
    """Provider-free model that emits deterministic tool calls and records schemas."""

    model_name: str = "eventmatch-concierge-test"
    responses: list[AIMessage]
    response_index: int = 0
    bound_tool_names: list[str] = Field(default_factory=list)

    @property
    def _llm_type(self) -> str:
        return "openai-chat"

    @property
    def _identifying_params(self) -> dict[str, Any]:
        return {"model_name": self.model_name}

    def _get_ls_params(self, **kwargs: Any) -> dict[str, Any]:
        return {
            "ls_provider": "openai",
            "ls_model_name": self.model_name,
            "ls_model_type": "chat",
        }

    def bind_tools(self, tools: Any, **kwargs: Any) -> BaseChatModel:
        names = []
        for item in tools:
            if hasattr(item, "name"):
                names.append(item.name)
            elif isinstance(item, dict):
                names.append(item.get("name") or item.get("function", {}).get("name"))
        self.bound_tool_names = [name for name in names if isinstance(name, str)]
        return self

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        response = self.responses[self.response_index]
        if self.response_index < len(self.responses) - 1:
            self.response_index += 1
        return ChatResult(generations=[ChatGeneration(message=response)])


def _agent(model: ScriptedToolModel) -> Any:
    return create_concierge_agent(
        model=model,
        checkpointer=InMemorySaver(),
        profile_key=f"openai:{model.model_name}",
    )


def _sse_events(body: str) -> list[tuple[str, dict[str, Any]]]:
    events: list[tuple[str, dict[str, Any]]] = []
    for block in body.strip().split("\n\n"):
        lines = block.splitlines()
        event = next(line[7:] for line in lines if line.startswith("event: "))
        data = next(line[6:] for line in lines if line.startswith("data: "))
        events.append((event, json.loads(data)))
    return events


async def test_model_sees_exactly_two_concierge_tools() -> None:
    model = ScriptedToolModel(responses=[AIMessage(content="Ready")])
    agent = _agent(model)

    await agent.ainvoke(
        {"messages": [{"role": "user", "content": "What is happening?"}]},
        config={"configurable": {"thread_id": "tool-surface"}},
        context=ConciergeContext(profile_id="00000000-0000-0000-0000-000000000001"),
    )

    assert set(model.bound_tool_names) == {"search_current_events", "save_event"}
    assert len(model.bound_tool_names) == 2
    assert set(save_event_tool.args) == {"event_id"}


def test_default_openrouter_model_builds_with_a_valid_harness_key(
    monkeypatch,
) -> None:
    class Settings:
        openrouter_api_key = "test-key"
        openrouter_base_url = "https://openrouter.test/v1"
        concierge_model_primary = "provider/model:free"
        concierge_model_fallback = "provider/fallback:free"

    monkeypatch.setattr("app.concierge.get_concierge_settings", Settings)

    agent = create_default_concierge_agent(InMemorySaver())

    assert agent is not None


async def test_malformed_hidden_harness_tool_call_is_rejected() -> None:
    model = ScriptedToolModel(
        responses=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "write_file",
                        "args": {"file_path": "/forbidden", "content": "no"},
                        "id": "forbidden-call",
                        "type": "tool_call",
                    }
                ],
            ),
            AIMessage(content="I cannot do that."),
        ]
    )
    agent = _agent(model)

    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "Write a file"}]},
        config={"configurable": {"thread_id": "forbidden-tool"}},
        context=ConciergeContext(profile_id="00000000-0000-0000-0000-000000000001"),
    )

    tool_message = result["messages"][-2]
    assert tool_message.status == "error"
    assert "only Event search and save" in tool_message.content


async def test_save_tool_interrupts_and_rejection_resumes_without_execution() -> None:
    model = ScriptedToolModel(
        responses=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "save_event",
                        "args": {"event_id": "event-123"},
                        "id": "save-call-1",
                        "type": "tool_call",
                    }
                ],
            ),
            AIMessage(content="I did not save that Event."),
        ]
    )
    agent = _agent(model)
    config = {"configurable": {"thread_id": "rejected-save"}}
    context = ConciergeContext(profile_id="00000000-0000-0000-0000-000000000001")

    interrupted = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "Save that"}]},
        config=config,
        context=context,
    )
    action = interrupted["__interrupt__"][0].value["action_requests"][0]
    assert action == {
        "name": "save_event",
        "args": {"event_id": "event-123"},
        "description": (
            "Save this exact Event to your Saved Events. No database write "
            "occurs unless you approve."
        ),
    }

    from langgraph.types import Command

    completed = await agent.ainvoke(
        Command(
            resume={"decisions": [{"type": "reject", "message": "The user said no."}]}
        ),
        config=config,
        context=context,
    )
    assert "__interrupt__" not in completed
    assert completed["messages"][-1].content == "I did not save that Event."


async def test_approval_executes_once_with_trusted_profile_context(monkeypatch) -> None:
    calls: list[tuple[str, str]] = []

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def commit(self) -> None:
            return None

        async def rollback(self) -> None:
            return None

    class FakeSessionFactory:
        def __call__(self) -> FakeSession:
            return FakeSession()

    async def fake_save(session, *, profile_id, event_id: str) -> bool:
        calls.append((str(profile_id), event_id))
        return True

    monkeypatch.setattr(
        "app.concierge.get_session_factory", lambda: FakeSessionFactory()
    )
    monkeypatch.setattr("app.concierge.save_current_event", fake_save)
    model = ScriptedToolModel(
        responses=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "save_event",
                        "args": {"event_id": "event-approved"},
                        "id": "save-call-approved-unit",
                        "type": "tool_call",
                    }
                ],
            ),
            AIMessage(content="The Event is saved."),
        ]
    )
    agent = _agent(model)
    config = {"configurable": {"thread_id": "approved-save"}}
    context = ConciergeContext(profile_id="00000000-0000-0000-0000-000000000042")

    proposed = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "Save that Event"}]},
        config=config,
        context=context,
    )
    assert proposed["__interrupt__"]
    assert calls == []

    from langgraph.types import Command

    completed = await agent.ainvoke(
        Command(resume={"decisions": [{"type": "approve"}]}),
        config=config,
        context=context,
    )
    assert completed["messages"][-1].content == "The Event is saved."
    assert calls == [("00000000-0000-0000-0000-000000000042", "event-approved")]


@requires_docker
async def test_searches_all_current_values_and_returns_saveable_event_id(
    db_session,
) -> None:
    row = dict(
        load_fixture("snapshot_a.json")[0],
        registration_description="Bring the unique-lantern phrase to check in.",
    )
    await ingest_rows(db_session, [row])

    result = await search_current_events(
        CurrentEventSearch(query="unique-lantern", borough="manhattan")
    )

    assert result["total"] == 1
    assert result["events"][0]["event_id"] == row["guid"]
    assert result["events"][0]["guid"] == row["guid"]
    assert result["truncated"] is False


@requires_docker
async def test_approval_saves_once_and_cross_profile_resume_is_rejected(
    client, db_session
) -> None:
    row = load_fixture("snapshot_a.json")[0]
    await ingest_rows(db_session, [row])
    model = ScriptedToolModel(
        responses=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "save_event",
                        "args": {"event_id": row["guid"]},
                        "id": "save-call-approved",
                        "type": "tool_call",
                    }
                ],
            ),
            AIMessage(content="The Event is saved."),
        ]
    )
    app.state.concierge_agent = _agent(model)
    try:
        proposed = await client.post(
            "/concierge/messages",
            headers=_headers(DEVICE_TOKEN),
            json={"message": "Save the Event"},
        )
        assert proposed.status_code == 200
        proposal = proposed.json()
        assert proposal["status"] == "approval_required"
        assert proposal["approval"]["action_requests"][0]["args"] == {
            "event_id": row["guid"]
        }
        assert (
            await db_session.scalar(select(func.count()).select_from(SavedEvent)) == 0
        )

        cross_profile = await client.post(
            f"/concierge/conversations/{proposal['conversation_id']}/decision",
            headers=_headers(OTHER_DEVICE_TOKEN),
            json={
                "interrupt_id": proposal["approval"]["interrupt_id"],
                "decision": "approve",
            },
        )
        assert cross_profile.status_code == 409
        assert (
            await db_session.scalar(select(func.count()).select_from(SavedEvent)) == 0
        )

        approved = await client.post(
            f"/concierge/conversations/{proposal['conversation_id']}/decision",
            headers=_headers(DEVICE_TOKEN),
            json={
                "interrupt_id": proposal["approval"]["interrupt_id"],
                "decision": "approve",
            },
        )
        assert approved.status_code == 200
        assert approved.json()["status"] == "completed"
        assert approved.json()["response"] == "The Event is saved."
        saved = (await db_session.scalars(select(SavedEvent))).one()
        assert saved.event_guid == row["guid"]

        duplicate = await client.post(
            f"/concierge/conversations/{proposal['conversation_id']}/decision",
            headers=_headers(DEVICE_TOKEN),
            json={
                "interrupt_id": proposal["approval"]["interrupt_id"],
                "decision": "approve",
            },
        )
        assert duplicate.status_code == 409
        assert (
            await db_session.scalar(select(func.count()).select_from(SavedEvent)) == 1
        )
    finally:
        app.state.concierge_agent = None


@requires_docker
async def test_streams_tokens_and_resumes_human_approved_save(
    client, db_session
) -> None:
    row = load_fixture("snapshot_a.json")[0]
    await ingest_rows(db_session, [row])
    model = ScriptedToolModel(
        responses=[
            AIMessage(content="I found a current Event."),
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "save_event",
                        "args": {"event_id": row["guid"]},
                        "id": "streamed-save-call",
                        "type": "tool_call",
                    }
                ],
            ),
            AIMessage(content="The Event is saved."),
        ]
    )
    app.state.concierge_agent = _agent(model)
    try:
        discovery = await client.post(
            "/concierge/messages/stream",
            headers=_headers(DEVICE_TOKEN),
            json={"message": "Find an Event"},
        )
        assert discovery.status_code == 200
        assert discovery.headers["content-type"].startswith("text/event-stream")
        discovery_events = _sse_events(discovery.text)
        assert discovery_events[0][0] == "conversation"
        assert any(
            event == "token" and data["text"] == "I found a current Event."
            for event, data in discovery_events
        )
        discovery_done = discovery_events[-1][1]
        assert discovery_events[-1][0] == "done"
        assert discovery_done["status"] == "completed"

        conversation_id = discovery_done["conversation_id"]
        proposed = await client.post(
            "/concierge/messages/stream",
            headers=_headers(DEVICE_TOKEN),
            json={
                "message": "Save it",
                "conversation_id": conversation_id,
            },
        )
        proposal = _sse_events(proposed.text)[-1][1]
        assert proposal["status"] == "approval_required"
        assert (
            await db_session.scalar(select(func.count()).select_from(SavedEvent)) == 0
        )

        approved = await client.post(
            f"/concierge/conversations/{conversation_id}/decision/stream",
            headers=_headers(DEVICE_TOKEN),
            json={
                "interrupt_id": proposal["approval"]["interrupt_id"],
                "decision": "approve",
            },
        )
        approved_events = _sse_events(approved.text)
        assert any(
            event == "token" and data["text"] == "The Event is saved."
            for event, data in approved_events
        )
        assert approved_events[-1][1]["status"] == "completed"
        assert (
            await db_session.scalar(select(func.count()).select_from(SavedEvent)) == 1
        )
    finally:
        app.state.concierge_agent = None
