# Issue #15 backend handoff

- Job: `045d186768ad` (`nyc-events` backend worker)
- Lane/worktree: persistent `backend` at `/Users/halgorithm/workspaces/AI/nyc-events-backend`
- Issue: #15, Sync worker on a schedule, with Sync Run recording and freshness
- Branch: `backend` tracking `origin/backend`; never switch, rebase, squash, force-push, or delete
- PR: pending local graph refresh, commit, push, and creation
- Shared deployment blocker: #61, CI/CD: provision Redis and smoke the scheduled sync worker

## State

Fresh Claude Code session `13fb96aa-a162-4d7e-985c-fad9d654b0a2` failed before tools with verified HTTP 401: OAuth access token revoked. No Claude retry or delegated child was allowed. This dedicated Hermes backend profile completed the backend-owned implementation and local verification directly.

The current shared `configure-sync-worker` implementation copies `DATABASE_URL` and Socrata credentials but omits `REDIS_URL`. The worker code therefore cannot use its Redis lock in Railway. Fullstack setup issue #61 carries the shared deployment, policy-test, exact-revision smoke, freshness evidence, and rollback work. Issue #15 must not auto-merge before #61 lands and its setup PR is deployed.

## Acceptance criteria

- [x] Separate Railway cron worker; no in-process scheduler (`backend/railway-sync.toml` plus deterministic gate)
- [x] Real Redis lock rejects a concurrent Sync Run
- [x] Each acquired execution records succeeded/failed status, row count, duration, and secret-free failure code
- [x] Failed execution preserves the prior Snapshot and releases the lock for the next run
- [x] Freshness endpoint reports the last successful Sync Run
- [x] A snapshot older than the configured threshold is reported stale
- [x] Issue-specific positive and negative gates execute under the protected backend test command
- [ ] Production worker receives `REDIS_URL` and produces exact-revision freshness evidence; blocked by #61

## Required phases

- [x] Direct test-first implementation and issue-specific CI gates
- [x] Standards/spec review of the complete backend diff; no backend-code finding remains
- [x] Changed-code simplification review; dependency injection retained because the real-Redis tests use it
- [x] Security review of the lock and touched data flow; no injection, auth, secret, unsafe-deserialization, dependency, or validation finding
- [x] Full local backend quality, 91-test integration/migration/contract suite, one Alembic head, and production container smoke
- [x] Graphify refresh and CI-equivalent freshness comparison
- [ ] Commit, push, and one `backend` to `main` PR
- [ ] Exact-head GitHub checks
- [ ] MERGE auto-merge, production verification, and lane alignment; blocked by #61

## Commands and results

- Lane preflight, fullstack exclusion, dependency checks, and claim: pass
- `git merge --ff-only origin/main` and `git push origin backend`: pass
- Graphify MCP with explicit project path: 925 nodes, 1564 edges; relevant sync/freshness architecture found
- Fresh Claude launch: verified HTTP 401 before any repository tool call
- Focused TDD gate before implementation: failed import of missing lock symbols as expected
- `uv sync --frozen && uv lock --check`: pass
- `uv run ruff format --check . && uv run ruff check . && uv run mypy app`: pass
- `TESTCONTAINERS_RYUK_DISABLED=true uv run pytest -v --cov=app --cov-report=xml:coverage.xml --cov-fail-under=80`: 91 passed, 89.34% coverage
- `uv run alembic heads`: one head, `0003`
- `./scripts/ci/backend_container_smoke.sh`: pass, including fresh image build, migration, real Postgres/Redis health
- `graphify update .`: 953 nodes and 1633 edges; two consecutive rebuilds produced identical `graph.json`
- Fullstack setup issue #61 created and linked from issue #15

## Ordered next actions

1. Refresh Graphify and verify tracked-output freshness after this final handoff update.
2. Commit, push, and open the single `backend` to `main` PR with the CI/CD delta table and explicit #61 blocker.
3. Verify exact-head pull-request CI; fix any backend or graph failure normally.
4. Do not enable auto-merge until #61 is closed and its production smoke proves the worker receives `REDIS_URL` and `/freshness` reports the exact deployed revision’s successful run.
5. After every required check succeeds, enable GraphQL MERGE auto-merge, verify production, align `backend` to `origin/main`, push, close #15, and remove `in-progress` if needed.
