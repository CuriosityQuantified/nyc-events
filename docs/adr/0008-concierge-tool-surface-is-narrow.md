# The concierge gets two tools and no interpreter

The AI concierge is built with `deepagents` inside the FastAPI application, restricted to exactly two tools — `search_events` and `get_event` — with the default filesystem, planning, and task-dispatch harness tools removed and `CodeInterpreterMiddleware` absent. Event facts render from database rows; the model's output is confined to the "why this matches" explanation.

A deep agent's value is autonomous planning and free tool use, which pulls directly against this product's hardest requirement: never invent capacity, price, accessibility, cancellation status, or travel time. Constraining the tool surface makes that guarantee structural rather than a prompt instruction that a model may ignore. The interpreter is excluded outright because code execution behind a public unauthenticated natural-language endpoint is not a trade-off worth entertaining.
