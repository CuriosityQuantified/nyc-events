# Issue #19 backend handoff

## Ownership

- Job: `045d186768ad` backend issue worker
- Repository: `CuriosityQuantified/nyc-events`
- Worktree: `/Users/halgorithm/workspaces/AI/nyc-events-backend`
- Branch: persistent `backend` tracking `origin/backend`
- Issue: #19 — Anonymous Profile and Saved

## State

- Issue #19 is claimed with `in-progress`.
- Branch started clean and aligned with `origin/main` and `origin/backend` at `a43b627`.
- Dependency #9 is closed. No backend or fullstack PR is open. No fullstack issue has `in-progress`.
- Fresh Claude session `d07d088c-3d18-4bb3-918e-a9ac3d60cc1a` failed before inference with verified HTTP 401: OAuth access token revoked.
- Per the fast-failover contract, no Claude retry occurred. This dedicated Hermes profile completed the implementation directly.

## Acceptance criteria

- [x] Create a Profile on first use, keyed to a hashed opaque device token.
- [x] Keep account association nullable from the first Profile migration.
- [x] Add idempotent save, unsave, and paginated list Saved Events endpoints.
- [x] Collect no personal contact information.
- [x] Assert Profile behavior through the API.
- [x] Add deterministic positive and negative/error/edge automated gates for every criterion.

## Required phases

- [x] Lane recovery, fullstack exclusion, dependency check, and claim
- [x] Graphify reconnaissance with the explicit project path
- [x] Implementation and issue-specific CI tests
- [x] Standards/spec code review; no missing criteria, scope creep, or standards blocker found
- [x] Simplification review; retained explicit transaction boundaries and removed account identifier exposure from the public response
- [x] Security review; token digests, bounded input/listing, parameterized queries, atomic idempotency, profile isolation, restrictive CORS, no PII/secrets/dependency findings
- [x] Full local gates
- [x] Final Graphify refresh and freshness comparison
- [ ] Commit, push, and PR from `backend` to `main`
- [ ] Exact-head GitHub CI and auto-merge

## Files

- `backend/app/main.py`
- `backend/app/models/__init__.py`
- `backend/app/models/profile.py`
- `backend/app/routes/events.py`
- `backend/app/routes/profiles.py`
- `backend/migrations/versions/0005_anonymous_profiles_saved_events.py`
- `backend/tests/conftest.py`
- `backend/tests/test_migrations.py`
- `backend/tests/test_profiles.py`
- `backend/HANDOFF-issue-19.md`
- tracked `graphify-out/` outputs after the final refresh

## Commands and results

- `git fetch origin && git merge --ff-only origin/main && git push origin backend` — passed; lane aligned at `a43b627`.
- Graphify query for anonymous Profiles and Saved Events — passed; relevant patterns were ADR-0004, Events models/routes, API tests, migration tests, and backend fixtures.
- Claude lean launch — failed before inference with HTTP 401; zero tokens and zero repository edits.
- Focused Profile and migration suite — 8 passed.
- `uv sync --frozen && uv lock --check` — passed.
- `uv run ruff format --check . && uv run ruff check . && uv run mypy app` — passed.
- Full real-Postgres/Redis coverage suite — 103 passed; 87.25% coverage.
- `uv run alembic heads` — exactly `0005 (head)`.
- Shared OpenAPI/golden validation — 3 responses passed; contract mock — 6 passed; frontend golden consumer — 48 unit tests passed.
- Workflow policy — 23 passed; deployment unit tests under Python 3.12 — 12 passed.
- Production container smoke — image built, migration 0005 applied, health passed.
- `pip-audit` — no known vulnerabilities.
- Final `graphify update .` — rebuilt 1,058 nodes and 1,865 edges; second rebuild reported no topology changes; tracked graph diff stayed clean.

## CI/CD delta

| Gate | Command/job | Failure caught | Local result |
|---|---|---|---|
| Anonymous Profile API integration | `pytest tests/test_profiles.py` / `backend` | Unstable identity, raw token storage, non-null account default, PII schema | passed |
| Saved API isolation and lifecycle | `pytest tests/test_profiles.py` / `backend` | IDOR, duplicate saves, concurrent idempotency, unsave failure, archival loss | passed |
| API boundary and browser contract | `pytest tests/test_profiles.py` / `backend` | Missing/malformed token, unknown Event, unbounded list, unsafe CORS method/header | passed |
| Real Postgres migration | `pytest tests/test_migrations.py` / `backend` | 0005 upgrade/downgrade/idempotency, nullable account regression, split heads | passed |
| Full backend regression | canonical coverage suite / `backend` | Cross-feature or contract regression | 103 passed; 87.25% |
| Production container smoke | `scripts/ci/backend_container_smoke.sh` / `backend` | Image cannot migrate 0005 or become healthy with Postgres/Redis | passed |
| Security | `pip-audit` plus changed-data-flow review / `security` | Vulnerable dependency, token/IDOR/query/CORS/PII exposure | clean |
| Graph freshness | `graphify update .` plus tracked-output diff / `graph` | Code graph does not match final tree | passed; second rebuild unchanged |

## Ordered next actions

1. Commit and push `backend`.
2. Create one PR to `main` with `Closes #19` and the CI/CD delta table.
3. Verify pull-request CI enqueues for the exact head SHA within 2 minutes.
4. Enable GraphQL auto-merge with method `MERGE`; do not call a direct merge endpoint.
5. After GitHub merges, fast-forward `backend` to `origin/main`, push, verify #19 closed, and remove `in-progress` if needed.
