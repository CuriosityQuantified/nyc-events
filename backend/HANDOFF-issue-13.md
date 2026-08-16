# Issue #13 backend handoff

- Job: `045d186768ad` (`nyc-events` backend worker)
- Lane/worktree: persistent `backend` at `/Users/halgorithm/workspaces/AI/nyc-events-backend`
- Issue: #13, Single Event with provenance
- Branch: `backend` tracking `origin/backend`; do not switch, rebase, squash, force-push, or delete
- PR: pending local commit and push

## State

Claude Code launch `7f61a5b4-3865-4b44-a30c-05742364194a` stopped before tools with HTTP 401: OAuth access token revoked. No Claude retry was allowed. The dedicated Hermes backend profile completed the local implementation and verification directly.

## Acceptance criteria

- [x] Retrieval by source `guid`
- [x] Every non-identity response field carries `Stated`, `Derived`, or `Not listed` provenance; `guid` remains the source identity required by the shared contract
- [x] Free-ness is explicit only for conservative source pricing statements
- [x] Derived values remain alongside the unchanged raw source row
- [x] Official NYC Parks URL included for string and Socrata URL-object shapes
- [x] `Not listed` means `null`, never `false` or another negative claim

## Required phases

- [x] Implementation and 8 issue-specific unit/real-Postgres API gates
- [x] Full code review against issue body; no remaining findings
- [x] Changed-code simplification review; consolidated derived Boolean fact construction
- [x] Security review; no high, medium, or low findings
- [x] Full local backend gates: 87 tests, 87.33% coverage, format/lint/types, migration idempotency, and production container smoke pass
- [ ] Graphify refresh and freshness comparison
- [ ] Commit, push, and one `backend` → `main` PR
- [ ] Required GitHub checks and merge-method auto-merge verification
- [ ] Exact production revision and public smoke verification after merge

## Commands and results

- `git fetch origin --prune`: pass
- `git merge --ff-only origin/main`: pass, already aligned
- `git push origin backend`: pass, already aligned
- `graphify query "issue 13 single event provenance API backend implementation tests"`: pass
- Claude Code launch: blocked by verified HTTP 401 before any repository tool call
- `uv sync --frozen && uv lock --check`: pass
- `uv run ruff format --check . && uv run ruff check . && uv run mypy app`: pass
- `TESTCONTAINERS_RYUK_DISABLED=true uv run pytest -v --cov=app --cov-report=xml:coverage.xml --cov-fail-under=80`: 87 passed; 87.33% coverage
- `./scripts/ci/backend_container_smoke.sh`: pass, including Alembic upgrade and real Postgres/Redis health

## Ordered next actions

1. Refresh Graphify and verify tracked-output freshness after this final handoff update.
2. Commit, push, and open the single `backend` → `main` PR with the CI/CD delta table.
3. Verify exact-head CI, enable merge-method auto-merge, align `backend`, close the issue, and verify the deployed revision and public behavior.
