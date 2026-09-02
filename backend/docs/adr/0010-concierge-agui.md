# ADR-0010: Concierge Deep Agent and authenticated AG-UI

- Status: Accepted
- Date: 2026-09-02
- Issue: #29

## Decision

Use a second, production AG-UI graph while the old `/concierge` contract remains for
compatibility. The AG-UI graph uses `deepagents==0.6.12`, `copilotkit==0.1.96`,
`ag-ui-langgraph==0.0.44`, and `langsmith==0.11.0`. `uv.lock` holds the exact
transitive set.

The graph has exactly three model tools:

1. `search_current_events`: bounded read from `current_events`.
2. `get_current_event`: bounded read of one `current_events` row by source `guid`.
3. `save_event_alert_preference`: one canonical Interest write through
   `apply_concierge_preference`.

`CopilotKitMiddleware` supplies protocol integration. Explicit
`HumanInTheLoopMiddleware` permits only `approve`, `edit`, and `reject` for the
write tool. Deep Agents filesystem, planning, execution, and dispatch tools are
excluded. A second allowlist rejects an injected tool call.

The API uses `LangGraphAGUIAgent` from the supported adapter. A custom FastAPI route
wraps it because the stock `add_langgraph_fastapi_endpoint` route does not enforce
this product's Profile, proxy-secret, origin, input, rate, and resume ownership
rules. Production continues to use `AsyncPostgresSaver`; `InMemorySaver` is only in
tests and prototypes.

## Official-source research

| Source | Current API or finding | Decision |
|---|---|---|
| https://docs.copilotkit.ai/deepagents/quickstart | Python uses `CopilotKitMiddleware`, `LangGraphAGUIAgent`, and `ag-ui-langgraph`; quickstart uses `MemorySaver` | Use the adapter APIs; reject `MemorySaver` in production |
| https://docs.copilotkit.ai/prebuilt-components/chat | `CopilotChat` is the inline surface | Backend exposes agent ID `concierge` for #30 |
| https://docs.copilotkit.ai/reference/hooks/useComponent | `useComponent` is display-only and Zod validates props | Do not make it an approval or identity boundary |
| https://docs.copilotkit.ai/generative-ui/a2ui | A2UI is declarative and streaming-first; runtime scopes it by agent | Keep A2UI in the same-origin #30 runtime, not this public service |
| https://docs.copilotkit.ai/generative-ui/tool-based | Component tools do not execute server actions | Reject browser-supplied tools at the Python boundary |
| https://docs.copilotkit.ai/reference | Current v2 hooks include `useInterrupt` and `useHumanInTheLoop` | Resume through AG-UI standard `resume[]` only |
| https://docs.copilotkit.ai/langgraph-fastapi/deep-agents | FastAPI path wraps a compiled graph in `LangGraphAGUIAgent` | Use this wrapper, not a bare compiled graph |
| https://github.com/ag-ui-protocol/ag-ui/tree/main/integrations/langgraph/python | Endpoint clones request agents and encodes typed events | Create an isolated wrapper per authenticated request |
| https://docs.langchain.com/oss/python/langchain/human-in-the-loop | HITL saves state before tool execution; production needs a durable saver | Validate interrupt IDs before `Command(resume=...)` |
| https://docs.langchain.com/oss/python/langgraph/persistence | Checkpoints are thread-scoped; Postgres is restart-safe | Hash Profile plus client thread into a thread ID under 255 chars |
| https://docs.langchain.com/langsmith/evaluate-llm-application | `evaluate()` and `aevaluate()` consume a stable target dict | Export normalized final response and tool trajectory for #31 |
| https://github.com/langchain-ai/langsmith-sdk | SDK tracing integrates with LangChain run trees | Use SDK-native tracing, not ad hoc HTTP |
| https://github.com/langchain-ai/langsmith-cli | CLI is for inspection and evidence | Keep the CLI outside application dependencies |

PyPI metadata was checked on 2026-09-02. The latest releases were
`copilotkit==0.1.96`, `ag-ui-langgraph==0.0.44`, `deepagents==0.7.12`, and
`langsmith==0.12.1`. We retained `deepagents==0.6.12` and `langsmith==0.11.0`
because this repository already verified that pair and the new adapters accept it.
A framework-major upgrade is separate work, not part of an endpoint change.

## Prototype evidence

Three provider-free probes used the same `ScriptedModel` and in-memory checkpointer:

| Probe | Result | Production decision |
|---|---|---|
| Existing custom SSE route | Product events, not AG-UI; no standard lifecycle | Retain only for compatibility |
| Bare `LangGraphAGUIAgent` completion | One `RUN_STARTED`, ordered step/state/message events, one `RUN_FINISHED` | Selected adapter core |
| HITL tool proposal | `RUN_STARTED`, CopilotKit `on_interrupt` custom event, `RUN_FINISHED`; no tool execution | Selected with pre-resume ownership validation |

No probe called a model provider or third-party API.

## Security and operations

- The browser must call the same-origin Next.js runtime from #30. The runtime sends
  `X-Concierge-Proxy-Token` from a server-only secret and the Profile device token.
- Production fails closed if `CONCIERGE_PROXY_SECRET` is absent. Redis applies a
  shared Profile-bound request limit before a model run.
- Client state, context, and tool definitions are removed. Profile ID, trusted thread,
  and decision status are inserted only in `RunnableConfig`.
- Resume must match all current interrupt IDs exactly. Duplicate, stale, cross-Profile,
  malformed, and unsupported decisions fail before graph execution.
- Browser errors are fixed text. Server logs do not include prompt or provider errors.
- Set `LANGSMITH_TRACING=true`, `LANGSMITH_PROJECT=eventmatch-nyc-concierge`, and
  `LANGSMITH_API_KEY` only in trusted deployment settings. Never expose the key to #30.
  `LANGSMITH_WORKSPACE_ID` is optional. The SDK client batches exports, uses a bounded
  timeout, ignores exporter failures, and masks message content, errors, auth data, and
  Profile identity before export. LangChain creates the root/model/middleware/tool
  hierarchy. Tool payloads are bounded before execution. The evaluation adapter strips
  known secret and identity keys.

## Deployment and rollback

Deploy the backend revision first. Verify `/api/revision`, `/health`, and an
authenticated scripted AG-UI smoke through the same-origin runtime. Then deploy #30.
Rollback #30 first, then the backend. The old `/concierge` routes remain available, so
rollback does not need a database downgrade. No schema migration is part of this ADR.
