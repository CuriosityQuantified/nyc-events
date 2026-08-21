# The concierge gets two tools, human-approved writes, and no interpreter

The AI concierge is built with `deepagents` inside the FastAPI application and restricted to exactly two tools: `search_current_events` and `save_event`. Search accepts structured filters, including an exact `event_id`, and reads only the latest `current_events` snapshot, so a separate retrieval tool would add surface area without adding capability. Search results return the source GUID as `event_id` together with stored Event facts and snapshot freshness.

`save_event` accepts only that `event_id`; Profile identity comes from trusted request context and is never model-generated. Every save interrupts the graph and requires an explicit human approve or reject decision before the canonical Saved Events service can write. Durable Postgres checkpoints bind the interrupt and resume to the Profile-owned conversation thread.

The default filesystem, planning, task-dispatch, and code-execution tools are removed. A deep agent's broad autonomy pulls against this product's hardest requirement: never invent capacity, price, accessibility, cancellation status, or travel time. Constraining the tool surface makes that guarantee structural rather than a prompt instruction that a model may ignore. Code execution behind a public natural-language endpoint remains out of scope.
