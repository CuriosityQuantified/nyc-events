# Handoff — Issue #7: Backend Walking Skeleton on Railway

**Branch:** `backend` (persistent lane branch)
**Issue:** https://github.com/CuriosityQuantified/nyc-events/issues/7
**Open PR:** None yet — deployment blocker prevents completion PR.
**Date:** 2026-08-15

## Current state

All code, tests, and CI infrastructure are complete and locally verified.
Railway deployment is blocked by missing CLI authentication.

### Done

- [x] FastAPI application with `/health` endpoint (`backend/app/main.py`)
  - Probes Postgres with `SELECT 1` (async SQLAlchemy)
  - Probes Redis with `PING` (redis.asyncio)
  - Returns 200 `{"status":"healthy","database":"connected","redis":"connected"}` when both respond
  - Returns 503 `{"status":"degraded",...}` when either fails
- [x] Alembic initialized with async support; baseline migration creates `health_checks` table
  - `alembic heads` reports exactly one head: `0001`
- [x] Testcontainers-based test suite — 4 tests run against real PostgreSQL 16
  - Fail-closed in CI: `RuntimeError` if `CI=true` and Docker is absent
  - Graceful skip on local machines without Docker
- [x] `backend/Dockerfile` — multi-stage build, non-root user, pinned uv image
- [x] `backend/railway.toml` — Dockerfile builder, health check, migration-on-start
- [x] `backend/pyproject.toml` + `uv.lock` — all deps locked, `uv sync --frozen` passes
- [x] `backend/.gitignore` — Python artifacts + `.env` excluded
- [x] No credentials in code, logs, or committed files
- [x] graphify refreshed and staged

### Local gate results

| Gate | Result |
|------|--------|
| `uv sync --frozen` | PASS |
| `uv run pytest -v` | 4 skipped (no Docker locally) |
| `CI=true uv run pytest -v` | RuntimeError — fail-closed confirmed |
| `uv run alembic heads` | `0001 (head)` |
| FastAPI import smoke | PASS — 5 routes |
| Secrets scan | Clean |
| `graphify update .` | 234 nodes, fresh |
| `git diff --exit-code graphify-out/graph.json` | exit 0 |
| Lane scope check | Only `backend/` + `graphify-out/` |

### NOT done

- [ ] **Railway deployment** — `railway whoami` reports `Unauthorized`. No `RAILWAY_TOKEN` or `RAILWAY_API_TOKEN` in local env, `.env`, or `~/.railway/agent-state.json`. The GitHub repository secret `RAILWAY_API_TOKEN` exists but is write-only and unavailable to local CLI.
- [ ] **Postgres + Redis provisioned on Railway** — requires authenticated Railway CLI or dashboard
- [ ] **Health endpoint returns 200 on deployed preview** — requires deployment

## Blocker

Railway CLI v5.30.4 is installed at `/opt/homebrew/bin/railway` but has no
stored authentication token. The CLI requires either:

1. `railway login` — opens a browser OAuth flow (interactive, cannot be automated by this agent)
2. `RAILWAY_TOKEN=<project-token>` environment variable — not present
3. `RAILWAY_API_TOKEN=<team-token>` environment variable — not present

The `RAILWAY_API_TOKEN` secret exists in the GitHub repository (confirmed via
CI `configuration` job) but is write-only and cannot be read by CLI or API.

## What the next agent should do

1. **Authenticate Railway CLI.** The operator must run `railway login` interactively, OR set `RAILWAY_TOKEN` or `RAILWAY_API_TOKEN` in the shell environment. Do not print or commit the token.

2. **Create Railway project and provision services.** Once authenticated:
   ```bash
   railway init          # or railway link to existing project
   railway add --database postgres
   railway add --database redis
   ```

3. **Deploy the backend service.**
   ```bash
   cd /Users/halgorithm/workspaces/AI/nyc-events-backend/backend
   railway up
   ```
   Railway reads `railway.toml` and builds from the Dockerfile. The start
   command runs `alembic upgrade head` then starts uvicorn.

4. **Set environment variables on the Railway service.**
   Railway auto-populates `DATABASE_URL` and `REDIS_URL` for provisioned
   add-ons. Verify they are set. The app reads them via `pydantic-settings`.

5. **Verify the deployed health endpoint.**
   ```bash
   curl -s https://<railway-preview-url>/health
   # Must return HTTP 200 with {"status":"healthy","database":"connected","redis":"connected"}
   ```

6. **Create the completion PR.**
   ```bash
   git commit -m "fix #7: Backend walking skeleton on Railway"
   git push origin backend
   gh pr create --title "fix #7: Backend walking skeleton on Railway" --body "Closes #7" --base main --head backend
   ```

## Files changed (all in `backend/`)

```
backend/.gitignore
backend/Dockerfile
backend/alembic.ini
backend/app/__init__.py
backend/app/config.py
backend/app/database.py
backend/app/main.py
backend/app/models/__init__.py
backend/migrations/__init__.py
backend/migrations/env.py
backend/migrations/script.py.mako
backend/migrations/versions/0001_create_health_checks.py
backend/migrations/versions/__init__.py
backend/pyproject.toml
backend/railway.toml
backend/tests/__init__.py
backend/tests/conftest.py
backend/tests/test_health.py
backend/uv.lock
```

Plus tracked `graphify-out/` outputs (mandatory generated artifacts).
