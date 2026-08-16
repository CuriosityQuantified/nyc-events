# Issue #16 backend handoff

## Ownership

- Job: `045d186768ad` backend issue worker
- Repository: `CuriosityQuantified/nyc-events`
- Worktree: `/Users/halgorithm/workspaces/AI/nyc-events-backend`
- Branch: persistent `backend` tracking `origin/backend`
- Issue: #16 — Change detection and Event lifecycle classification

## State

- Issue #16 is claimed with `in-progress`.
- Branch started clean and aligned with `origin/main` and `origin/backend` at `1fda5b5`.
- No backend or fullstack PR was open. No fullstack issue had `in-progress`.
- Blocker #9 is closed.
- Fresh Claude session `49b49744-6018-4ed6-bc2c-efa6dcdab3a3` failed before inference with verified HTTP 401: OAuth access token revoked.
- Per the fast-failover contract, no Claude retry occurred. The dedicated Hermes profile completed the implementation directly.

## Acceptance criteria

- [x] Every stored Event has a stable SHA-256 content hash.
- [x] Latest Snapshot classifications cover new, changed, unchanged, cancelled, expired, and removed.
- [x] Feed absence becomes expired or removed, never cancellation.
- [x] Committed Snapshot A/B fixtures prove new and changed Events through the API.
- [x] Explicitly cancelled Events surface through `/event-changes` and retain cancellation evidence after later feed absence.
- [x] Classification and content hashes are asserted through the API.
- [x] Positive, negative, boundary, migration, contract, and security gates are issue-specific and offline.

## Required phases

- [x] Lane recovery, fullstack exclusion, dependency check, and claim
- [x] Graphify reconnaissance with the explicit project path
- [x] Implementation and issue-specific CI tests
- [x] Standards/spec code review; fixed cancellation retention and compatibility-view migration gaps
- [x] Simplification review; replaced nested conditional classification with explicit control flow
- [x] Security review; bounded enum/pagination, parameterized SQL, validated URL output, no secrets/dependencies; no blocker found
- [x] Full local gates
- [x] Final Graphify refresh and freshness comparison
- [ ] Commit, push, and PR from `backend` to `main`
- [ ] Exact-head GitHub CI and auto-merge

## Files

- `backend/app/models/event.py`
- `backend/app/routes/events.py`
- `backend/app/socrata.py`
- `backend/migrations/versions/0004_event_lifecycle.py`
- `backend/tests/test_event_lifecycle.py`
- `backend/tests/test_migrations.py`
- `backend/HANDOFF-issue-16.md`
- tracked `graphify-out/` outputs

## Commands and results

- `uv sync --frozen && uv lock --check` — passed
- `uv run ruff format --check . && uv run ruff check . && uv run mypy app` — passed
- `TESTCONTAINERS_RYUK_DISABLED=true uv run pytest -v --cov=app --cov-report=xml:coverage.xml --cov-fail-under=80` — 97 passed; 89.31% coverage
- Focused lifecycle + migration suite — 8 passed
- `uv run contracts/validate_contract.py` — 3 golden responses passed
- Contract mock server — 6 passed
- Frontend golden contract consumer — 3 passed
- `./scripts/ci/backend_container_smoke.sh` — migration 0004 and production health smoke passed
- Workflow policy — 23 passed
- Deployment unit tests under Python 3.12 — 12 passed
- `pip-audit` — no known vulnerabilities
- Graphify final refresh and clean rerun — passed; no topology changes on the second run

## CI/CD delta

| Gate | Command/job | Failure caught | Local result |
|---|---|---|---|
| Lifecycle API integration | `pytest tests/test_event_lifecycle.py` / `backend` | Wrong new/changed/unchanged/cancelled/expired/removed state, false cancellation, unstable hashes, invalid filters, unbounded pages | 6 passed |
| Real Postgres migration | `pytest tests/test_migrations.py` / `backend` | 0004 upgrade/downgrade/idempotency, split heads, stale compatibility view | 2 passed |
| Full backend regression | canonical coverage suite / `backend` | Cross-feature or contract regression | 97 passed; 89.31% |
| Production container smoke | `scripts/ci/backend_container_smoke.sh` / `backend` | Image cannot migrate 0004 or become healthy with Postgres/Redis | passed |
| Security | `pip-audit` plus manual changed-data-flow review / `security` | Vulnerable dependency or unsafe query/URL/secret exposure | clean |
| Graph freshness | `graphify update .` plus tracked-output diff / `graph` | Code graph does not match the final tree | passed; second run unchanged |

## Ordered next actions

1. Commit and push `backend`.
2. Create one PR to `main` with the CI/CD delta table and `Closes #16`.
3. Verify pull-request CI enqueues for the exact head SHA within 2 minutes.
4. Enable GraphQL auto-merge with method `MERGE`; do not call a direct merge endpoint.
5. After GitHub merges, fast-forward `backend` to `origin/main`, push, verify #16 closed, and remove `in-progress` if needed.
