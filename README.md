# EventMatch NYC

**Find a real NYC Parks event worth showing up for.**

[Open the live app](https://eventmatch.nyc) · [Production health](https://backend-production-0da0a.up.railway.app/health) · [Source data](https://data.cityofnewyork.us/City-Government/NYC-Parks-Public-Events-Upcoming-14-Days/w3wp-dpdi/about_data)

EventMatch NYC turns the official NYC Parks upcoming-events feed into a fast, mobile-friendly discovery experience. It keeps source facts and derived values visibly distinct, reports when the live snapshot was refreshed, and never fills gaps in the public record with guesses.

## What you can do

- Explore the current NYC Parks event snapshot as a list or a real street map.
- Search and filter by date, borough, category, registration state, and location.
- Open an event detail view with the official source link and provenance-aware facts.
- Save events anonymously with one tap; no account is required.
- View Saved events as a list or calendar and export them to a phone calendar.
- Follow an interest and see newly matching events separately from deliberate saves.
- Use the experience at phone and desktop sizes with keyboard and screen-reader semantics covered by automated accessibility gates.

The repository also contains a constrained AI-concierge backend slice. Its model-visible surface is limited to current-event search and a save tool; every save requires explicit human approval before the database write. The public Concierge UI remains intentionally unavailable until its end-to-end interaction is complete.

## Trust model

The production dataset is NYC Parks' rolling upcoming-events feed (`w3wp-dpdi`). A synchronization run paginates the source into Postgres atomically: a failed run leaves the previous complete snapshot in place. Redis supports service coordination, and the API reports snapshot freshness and ingestion status.

- **Stated** — present in the source record.
- **Derived** — computed from a source record and labelled as such.
- **Not listed** — the source is silent; EventMatch does not turn silence into a claim.

Source GUIDs remain the stable Event identity across ingestion, API responses, saves, matches, and calendar exports.

## Architecture

| Layer | Implementation |
|---|---|
| Web app | Next.js 16, React 19, TypeScript |
| Browser verification | Playwright at 390×844 and 1440×900, axe accessibility checks |
| API | FastAPI, SQLAlchemy, Pydantic |
| Data | PostgreSQL, Redis, NYC Open Data / Socrata |
| Delivery | Railway, custom domain, protected GitHub Actions |
| AI safety slice | LangChain Deep Agents with two tools, trusted Profile context, Postgres checkpoints, human-approved writes |

The frontend and backend deploy as separate Railway services. A scheduled worker refreshes the source snapshot. Deployment is fail-closed: each release proves the exact Git revision, verifies live Postgres and Redis connectivity, runs a production synchronization, and then exercises the public frontend in real Chromium at phone and desktop viewports. A failed cutover or smoke test invokes rollback.

## Production and evidence

| Resource | URL |
|---|---|
| Live product | <https://eventmatch.nyc> |
| Backend health (Postgres + Redis) | <https://backend-production-0da0a.up.railway.app/health> |
| Snapshot freshness | <https://backend-production-0da0a.up.railway.app/freshness> |
| Ingestion status | <https://backend-production-0da0a.up.railway.app/ingestion-health> |
| Protected CI runs | <https://github.com/CuriosityQuantified/nyc-events/actions/workflows/ci.yml> |
| Production deployment runs and downloadable evidence | <https://github.com/CuriosityQuantified/nyc-events/actions/workflows/deploy-production.yml> |
| CI/CD evidence contract | [docs/ci-cd-matrix.md](docs/ci-cd-matrix.md) |
| API contract | [contracts/README.md](contracts/README.md) |
| Architecture decisions | [docs/adr](docs/adr) |

Production workflow artifacts include exact Railway deployment records, backend health and freshness payloads, database/API consistency evidence, scheduled-worker evidence, JUnit output, an HTML Playwright report, and full-page phone and desktop screenshots.

## Run locally

Prerequisites: Python 3.12+, [`uv`](https://docs.astral.sh/uv/), Node.js 22+, Docker, and Docker Compose.

```bash
# Backing services
docker compose up -d postgres redis

# Backend
cd backend
uv sync --frozen
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

In another terminal:

```bash
cd frontend
npm ci
API_BASE_URL=http://localhost:8000 npm run dev
```

Open <http://localhost:3000>.

## Quality gates

```bash
# Backend
cd backend
uv lock --check
uv run ruff format --check .
uv run ruff check .
uv run mypy app
uv run pytest -v --cov=app --cov-fail-under=80

# Frontend
cd frontend
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
```

`main` is protected by required backend, frontend, contract, security, secrets, and knowledge-graph checks. Production credentials are never exposed to pull-request code.

## Repository map

```text
backend/       FastAPI app, migrations, sync worker, and tests
frontend/      Next.js app, component tests, and Playwright journeys
contracts/     OpenAPI contract, golden responses, and mock validation
docs/adr/      Architectural decision records
scripts/       CI policy and deterministic Railway release tooling
graphify-out/  Committed code knowledge graph
```

## Product scope

EventMatch is a trustworthy discovery layer, not the source of record. Official event pages remain authoritative for schedules, registration, capacity, accessibility, and cancellation details. Account claim, notifications, transit overlays, and the end-to-end Concierge UI are tracked future work rather than implied production capabilities.
