"""Issue #29 deterministic Concierge AG-UI contract tests."""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Any
from uuid import UUID

import pytest
from ag_ui.core import ResumeEntry, RunAgentInput
from copilotkit import LangGraphAGUIAgent
from fastapi import HTTPException
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.types import Command
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool
from pydantic import Field
from starlette.requests import Request

from app.concierge_agui import (
    CONCIERGE_TOOL_NAMES,
    build_concierge_agui_agent,
    normalize_evaluation_result,
    save_event_alert_preference_tool,
)
from app.concierge_runtime import _psycopg_url
from app.routes.agui import (
    InvalidResumeError,
    _anonymize_trace_payload,
    _event_stream,
    _verify_request_boundary,
    sanitize_agui_input,
    trusted_thread_id,
    validate_resume_entries,
)


class ScriptedModel(BaseChatModel):
    """Provider-independent model fake that records the bound tool surface."""

    responses: list[AIMessage]
    index: int = 0
    bound_tool_names: list[str] = Field(default_factory=list)

    @property
    def _llm_type(self) -> str:
        return "scripted-concierge"

    def bind_tools(self, tools: Any, **kwargs: Any) -> BaseChatModel:
        self.bound_tool_names = [tool.name for tool in tools]
        return self

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        response = self.responses[self.index]
        if self.index < len(self.responses) - 1:
            self.index += 1
        return ChatResult(generations=[ChatGeneration(message=response)])


class SecretFailingModel(ScriptedModel):
    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        raise RuntimeError("provider-secret-detail")


def _input(**updates: Any) -> RunAgentInput:
    values: dict[str, Any] = {
        "threadId": "browser-thread",
        "runId": "browser-run",
        "messages": [{"id": "m1", "role": "user", "content": "Find family events"}],
        "tools": [],
        "context": [],
        "forwardedProps": {},
    }
    values.update(updates)
    return RunAgentInput.model_validate(values)


async def test_agent_exposes_exactly_three_bounded_tools() -> None:
    model = ScriptedModel(responses=[AIMessage(content="No results.")])
    agent = build_concierge_agui_agent(
        model=model,
        checkpointer=InMemorySaver(),
        profile_key="scriptedmodel",
    )

    await agent.ainvoke(
        {"messages": [{"role": "user", "content": "Find events"}]},
        config={
            "configurable": {
                "thread_id": "test-thread",
                "profile_id": "00000000-0000-0000-0000-000000000001",
                "run_id": "test-run",
            }
        },
    )

    assert set(model.bound_tool_names) == CONCIERGE_TOOL_NAMES
    assert len(model.bound_tool_names) == 3
    assert set(save_event_alert_preference_tool.args) == {
        "facet_type",
        "facet_value",
        "alert_enabled",
    }


def test_untrusted_agui_fields_are_removed_and_input_is_bounded() -> None:
    sanitized = sanitize_agui_input(
        _input(
            state={"profile_id": "attacker", "messages": ["override"]},
            tools=[
                {
                    "name": "execute_sql",
                    "description": "bad",
                    "parameters": {"type": "object", "properties": {}},
                }
            ],
            context=[{"description": "identity", "value": "admin"}],
        ),
        profile_id="00000000-0000-0000-0000-000000000001",
        max_input_chars=2000,
    )

    assert sanitized.tools == []
    assert sanitized.context == []
    assert sanitized.state == {}
    assert sanitized.thread_id.startswith("concierge:")
    assert "attacker" not in sanitized.model_dump_json()


@pytest.mark.parametrize(
    "input_data",
    [
        _input(runId="bad run"),
        _input(threadId="bad thread"),
        _input(messages=[]),
        _input(
            messages=[
                {"id": f"m{index}", "role": "user", "content": "x"}
                for index in range(101)
            ]
        ),
        _input(messages=[{"id": "large", "role": "user", "content": "x" * 21}]),
    ],
)
def test_agui_input_bounds_fail_closed(input_data: RunAgentInput) -> None:
    with pytest.raises(ValueError):
        sanitize_agui_input(
            input_data,
            profile_id="00000000-0000-0000-0000-000000000001",
            max_input_chars=20,
        )


def test_thread_identity_is_profile_bound_and_does_not_expose_profile_id() -> None:
    first = trusted_thread_id("00000000-0000-0000-0000-000000000001", "browser-thread")
    second = trusted_thread_id("00000000-0000-0000-0000-000000000002", "browser-thread")

    assert first != second
    assert len(first) < 255
    assert "00000000" not in first


def test_resume_rejects_stale_duplicate_and_malformed_decisions() -> None:
    valid = ResumeEntry.model_validate(
        {
            "interruptId": "interrupt-1",
            "status": "resolved",
            "payload": {"decisions": [{"type": "approve"}]},
        }
    )
    validate_resume_entries([valid], {"interrupt-1"})

    with pytest.raises(InvalidResumeError):
        validate_resume_entries([valid, valid], {"interrupt-1"})
    with pytest.raises(InvalidResumeError):
        validate_resume_entries([valid], {"interrupt-2"})
    with pytest.raises(InvalidResumeError):
        validate_resume_entries(
            [
                ResumeEntry.model_validate(
                    {
                        "interruptId": "interrupt-1",
                        "status": "resolved",
                        "payload": {"decisions": [{"type": "respond"}]},
                    }
                )
            ],
            {"interrupt-1"},
        )


@pytest.mark.parametrize(
    "entry",
    [
        {
            "interruptId": "interrupt-1",
            "status": "cancelled",
            "payload": {"unexpected": True},
        },
        {
            "interruptId": "interrupt-1",
            "status": "resolved",
            "payload": {"decisions": []},
        },
        {
            "interruptId": "interrupt-1",
            "status": "resolved",
            "payload": {
                "decisions": [
                    {
                        "type": "edit",
                        "edited_action": {"name": "execute_sql", "args": {}},
                    }
                ]
            },
        },
        {
            "interruptId": "interrupt-1",
            "status": "resolved",
            "payload": {
                "decisions": [
                    {
                        "type": "edit",
                        "edited_action": {
                            "name": "save_event_alert_preference",
                            "args": {"facet_type": "borough"},
                        },
                    }
                ]
            },
        },
    ],
)
def test_resume_payload_variants_fail_closed(entry: dict[str, Any]) -> None:
    with pytest.raises(InvalidResumeError):
        validate_resume_entries(
            [ResumeEntry.model_validate(entry)],
            {"interrupt-1"},
        )


def test_evaluation_target_is_stable_and_redacts_tool_payloads() -> None:
    result = normalize_evaluation_result(
        final_response="Family Day matches because it is in Queens.",
        trajectory=[
            {
                "name": "search_current_events",
                "arguments": {"borough": "Queens"},
                "result": {"count": 1, "api_key": "secret"},
                "status": "ok",
            }
        ],
    )

    assert result == {
        "final_response": "Family Day matches because it is in Queens.",
        "trajectory": [
            {
                "name": "search_current_events",
                "arguments": {"borough": "Queens"},
                "result": {"count": 1},
                "status": "ok",
            }
        ],
    }


def test_langsmith_payload_masking_removes_private_free_form_data() -> None:
    masked = _anonymize_trace_payload(
        {
            "messages": [{"content": "My email is private@example.com"}],
            "profile_id": "private-profile",
            "authorization": "Bearer secret",
            "tool": {"name": "search_current_events", "count": 2},
        }
    )

    assert masked == {
        "messages": "[redacted]",
        "profile_id": "[redacted]",
        "authorization": "[redacted]",
        "tool": {"name": "search_current_events", "count": 2},
    }


async def test_agui_adapter_orders_one_start_interrupt_and_finish() -> None:
    model = ScriptedModel(
        responses=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "save_event_alert_preference",
                        "args": {
                            "facet_type": "borough",
                            "facet_value": "Queens",
                            "alert_enabled": True,
                        },
                        "id": "preference-call",
                        "type": "tool_call",
                    }
                ],
            )
        ]
    )
    graph = build_concierge_agui_agent(
        model=model,
        checkpointer=InMemorySaver(),
        profile_key="scriptedmodel",
    )
    adapter = LangGraphAGUIAgent(
        name="concierge",
        graph=graph,
        config={
            "configurable": {
                "profile_id": "00000000-0000-0000-0000-000000000001",
                "run_id": "test-run",
            }
        },
    )

    events = [event async for event in adapter.run(_input())]
    event_types = [event.type.value for event in events]

    assert event_types[0] == "RUN_STARTED"
    assert event_types[-1] == "RUN_FINISHED"
    assert event_types.count("RUN_STARTED") == 1
    assert event_types.count("RUN_FINISHED") == 1
    assert event_types.count("RUN_ERROR") == 0
    interrupts = [
        event
        for event in events
        if event.type.value == "CUSTOM" and event.name == "on_interrupt"
    ]
    assert len(interrupts) == 1
    interrupt_value = json.loads(interrupts[0].value)
    action = interrupt_value["action_requests"][0]
    assert action["args"] == {
        "facet_type": "borough",
        "facet_value": "Queens",
        "alert_enabled": True,
    }
    assert action["description"] == "Save borough = 'Queens' and send alerts."


async def test_agui_stream_redacts_provider_errors() -> None:
    graph = build_concierge_agui_agent(
        model=SecretFailingModel(responses=[]),
        checkpointer=InMemorySaver(),
        profile_key="secretfailingmodel",
    )
    payload = _input().model_copy(update={"thread_id": "concierge:trusted"})

    encoded = "".join(
        [
            chunk
            async for chunk in _event_stream(
                graph=graph,
                input_data=payload,
                profile_id=UUID("00000000-0000-0000-0000-000000000001"),
                accept="text/event-stream",
            )
        ]
    )

    assert "provider-secret-detail" not in encoded
    assert "The concierge is unavailable right now." in encoded


async def test_langsmith_setup_failure_does_not_change_the_stream(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.routes.agui._langsmith_client",
        lambda: (_ for _ in ()).throw(RuntimeError("langsmith unavailable")),
    )
    graph = build_concierge_agui_agent(
        model=ScriptedModel(responses=[AIMessage(content="No results.")]),
        checkpointer=InMemorySaver(),
        profile_key="scriptedmodel",
    )
    payload = _input().model_copy(update={"thread_id": "concierge:trusted"})

    encoded = "".join(
        [
            chunk
            async for chunk in _event_stream(
                graph=graph,
                input_data=payload,
                profile_id=UUID("00000000-0000-0000-0000-000000000001"),
                accept="application/x-protobuf",
            )
        ]
    )

    assert "langsmith unavailable" not in encoded
    assert encoded.count('"type":"RUN_STARTED"') == 1
    assert encoded.count('"type":"RUN_FINISHED"') == 1
    assert "data:" in encoded


async def test_pending_approval_resumes_after_agent_restart(
    monkeypatch: pytest.MonkeyPatch,
    postgres_url: str,
) -> None:
    calls: list[tuple[str, str]] = []

    async def fake_apply(
        _session: Any, *, facet_type: str, facet_value: str, **_kwargs: Any
    ) -> Any:
        calls.append((facet_type, facet_value))
        return SimpleNamespace(
            facet_type=facet_type,
            facet_value=facet_value,
            alert_enabled=True,
        )

    monkeypatch.setattr("app.concierge_agui.apply_concierge_preference", fake_apply)
    pool = AsyncConnectionPool(
        _psycopg_url(postgres_url),
        min_size=1,
        max_size=2,
        open=False,
        kwargs={
            "autocommit": True,
            "prepare_threshold": 0,
            "row_factory": dict_row,
        },
    )
    await pool.open()
    try:
        await pool.wait()
        checkpointer = AsyncPostgresSaver(pool)
        await checkpointer.setup()
        proposing_agent = build_concierge_agui_agent(
            model=ScriptedModel(
                responses=[
                    AIMessage(
                        content="",
                        tool_calls=[
                            {
                                "name": "save_event_alert_preference",
                                "args": {
                                    "facet_type": "borough",
                                    "facet_value": "Queens",
                                    "alert_enabled": True,
                                },
                                "id": "restart-call",
                                "type": "tool_call",
                            }
                        ],
                    )
                ]
            ),
            checkpointer=checkpointer,
            profile_key="scriptedmodel",
        )
        config = {
            "configurable": {
                "thread_id": "concierge:restart-test",
                "profile_id": "00000000-0000-0000-0000-000000000001",
                "run_id": "restart-test",
                "concierge_decision": "approve",
            }
        }
        proposed = await proposing_agent.ainvoke(
            {"messages": [{"role": "user", "content": "Save Queens."}]}, config
        )
        assert len(proposed["__interrupt__"]) == 1
        assert calls == []

        restarted_agent = build_concierge_agui_agent(
            model=ScriptedModel(responses=[AIMessage(content="Saved.")]),
            checkpointer=AsyncPostgresSaver(pool),
            profile_key="scriptedmodel",
        )
        await restarted_agent.ainvoke(
            Command(resume={"decisions": [{"type": "approve"}]}), config
        )
        assert calls == [("borough", "Queens")]
    finally:
        await pool.close()


@pytest.mark.parametrize(
    ("decision", "expected"),
    [
        (
            {"type": "approve"},
            ("borough", "Queens", True, "approved"),
        ),
        (
            {
                "type": "edit",
                "edited_action": {
                    "name": "save_event_alert_preference",
                    "args": {
                        "facet_type": "category",
                        "facet_value": "Music",
                        "alert_enabled": False,
                    },
                },
            },
            ("category", "Music", False, "edited"),
        ),
        ({"type": "reject"}, None),
    ],
)
async def test_human_decision_controls_the_only_write(
    monkeypatch: pytest.MonkeyPatch,
    decision: dict[str, Any],
    expected: tuple[str, str, bool, str] | None,
) -> None:
    calls: list[tuple[str, str, bool, str]] = []

    async def fake_apply(
        _session: Any,
        *,
        facet_type: str,
        facet_value: str,
        alert_enabled: bool,
        decision: str,
        **_kwargs: Any,
    ) -> Any:
        calls.append((facet_type, facet_value, alert_enabled, decision))
        return type(
            "SavedInterest",
            (),
            {
                "facet_type": facet_type,
                "facet_value": facet_value,
                "alert_enabled": alert_enabled,
            },
        )()

    monkeypatch.setattr("app.concierge_agui.apply_concierge_preference", fake_apply)
    model = ScriptedModel(
        responses=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "save_event_alert_preference",
                        "args": {
                            "facet_type": "borough",
                            "facet_value": "Queens",
                            "alert_enabled": True,
                        },
                        "id": "preference-call",
                        "type": "tool_call",
                    }
                ],
            ),
            AIMessage(content="Decision handled."),
        ]
    )
    graph = build_concierge_agui_agent(
        model=model,
        checkpointer=InMemorySaver(),
        profile_key="scriptedmodel",
    )
    config = {
        "configurable": {
            "thread_id": f"concierge:{decision['type']}",
            "profile_id": "00000000-0000-0000-0000-000000000001",
            "run_id": "decision-test",
            "concierge_decision": decision["type"],
        }
    }

    proposed = await graph.ainvoke(
        {"messages": [{"role": "user", "content": "Save this preference."}]},
        config,
    )
    assert len(proposed["__interrupt__"]) == 1
    await graph.ainvoke(Command(resume={"decisions": [decision]}), config)

    assert calls == ([] if expected is None else [expected])


def test_proxy_secret_and_origin_fail_closed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.routes.agui.get_concierge_settings",
        lambda: SimpleNamespace(concierge_proxy_secret="proxy-secret"),
    )
    monkeypatch.setattr(
        "app.routes.agui.get_settings",
        lambda: SimpleNamespace(
            frontend_origin="https://events.example",
            environment="production",
        ),
    )

    def request(*, origin: str, token: str) -> Request:
        headers = [
            (b"origin", origin.encode()),
            (b"x-concierge-proxy-token", token.encode()),
        ]
        return Request({"type": "http", "method": "POST", "headers": headers})

    _verify_request_boundary(
        request(origin="https://events.example", token="proxy-secret")
    )

    with pytest.raises(HTTPException) as wrong_origin:
        _verify_request_boundary(
            request(origin="https://attacker.example", token="proxy-secret")
        )
    assert wrong_origin.value.status_code == 403

    with pytest.raises(HTTPException) as wrong_token:
        _verify_request_boundary(
            request(origin="https://events.example", token="wrong-secret")
        )
    assert wrong_token.value.status_code == 401
