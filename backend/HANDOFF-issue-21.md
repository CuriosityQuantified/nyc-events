# Issue #21 backend handoff

## Ownership

- Repository: `CuriosityQuantified/nyc-events`
- Job: backend lane `045d186768ad`, issue #21
- Worktree: `/Users/halgorithm/workspaces/AI/nyc-events-backend`
- Branch: persistent `backend` tracking `origin/backend`

## State

- Issue #21 is open and claimed with `in-progress`
- Blockers #16 and #19 are closed
- No backend or fullstack PR/worktree is active
- Work started from `a18f262`; implementation is complete but not yet committed
- The fresh Claude worker failed before repository access: HTTP 401, revoked OAuth token, session `81dca837-5b04-436b-8d46-b2be540da9e5`
- Per the one-shot fast-failover contract, this dedicated Hermes profile is continuing directly with no Claude retry and no delegated child

## Acceptance criteria

- Done: canonical service follows, updates, lists, and unfollows one borough, category, or registration Facet
- Done: each ingestion intersects only lifecycle `new` Events with Interests
- Done: Matches use separate persistence and list API from Saved Events
- Done: Profile-owned promote and dismiss endpoints are idempotent and IDOR-safe
- Done: manual and approved/edited concierge writes share validation and uniqueness
- Done: concierge writes retain approved origin and idempotency evidence without chat/model context
- Done: sequential and concurrent approval replays execute once; conflicting and cross-Profile replays fail
- Done: rejected and unapproved proposals create no Interest, Match, Saved Event, or success audit
- Done: composite and unsupported Facets fail closed

## Required phases

- Graphify/codebase analysis: complete
- Implementation plus issue-specific CI tests: complete
- Code review: complete directly; no unresolved spec or standards finding
- Simplification review: complete directly; canonical writes were consolidated in one service
- Security review: complete directly; IDOR, replay, input, SQL-injection, data-retention, and race paths covered; no unresolved high-confidence finding
- Full local gates: complete; graph refresh, commit, push, and PR remain
- Exact-head GitHub CI and MERGE auto-merge: remaining

## Commands and results

- `git fetch origin && git merge --ff-only origin/main && git push origin backend`: passed; already aligned
- `graphify query "Issue 21 interests alert preferences match-on-sync backend models API services tests"`: passed
- Claude launch 1: launcher found no `claude` on non-login PATH
- Claude launch 2 with corrected PATH: failed deterministically with HTTP 401 revoked OAuth token before any tool turn or repository change
- `uv sync --frozen`; `uv lock --check`; Ruff format/check; `mypy app`: passed
- `uv run alembic heads`: passed, exactly `0006 (head)`
- full real-Postgres/Redis suite with coverage: 115 passed, 85.82%
- `uv run contracts/validate_contract.py`: passed, 3 golden responses
- workflow policy suite: 23 passed
- `scripts/ci/backend_container_smoke.sh`: passed migration through 0006 and production health

## Ordered next actions

1. Refresh Graphify and verify tracked-output freshness
2. Commit and push `backend`; open exactly one PR to `main`
3. Verify exact-head CI and enable GraphQL auto-merge with method `MERGE`
4. After GitHub merges, fast-forward and push `backend`, verify issue closure, and remove `in-progress`
