# Graph Report - nyc-events  (2026-08-16)

## Corpus Check
- 92 files · ~43,888 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 677 nodes · 995 edges · 62 communities (44 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d422f6cf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- page.tsx
- Core screens
- NYC Events — Handoff Document
- ContractMockTests
- SocrataClient
- Language
- CLAUDE.md
- scripts
- pull_request_template.md
- 0001-split-backend-and-frontend.md
- 0002-event-identity-is-the-source-guid.md
- 0003-railway-hosts-everything.md
- 0004-anonymous-profiles-with-optional-account-claim.md
- 0005-tests-never-call-the-live-api.md
- 0006-distance-is-straight-line-only.md
- 0007-html-prototype-is-a-sketch.md
- 0008-concierge-tool-surface-is-narrow.md
- 0009-issues-carry-a-lane-label.md
- validate_contract.py
- EventMatch NYC API contract
- compilerOptions
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- devDependencies
- events.py
- TestHealthEndpoint
- frontend/README.md
- layout.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- shell.spec.ts
- load_fixture
- nyc-events-backend
- parse_event
- env.py
- conftest.py
- get_settings
- socrata.py
- ingest_events
- SocrataError
- railway_release.py
- validate_workflows
- tsconfig.tests.json
- api-contract.test.ts
- CI/CD extension matrix
- route.ts
- backend_container_smoke.sh

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 32 edges
2. `SocrataClient` - 23 edges
3. `parse_event()` - 23 edges
4. `ingest_rows()` - 20 edges
5. `Event` - 16 edges
6. `compilerOptions` - 16 edges
7. `SocrataError` - 15 edges
8. `MockTransport` - 14 edges
9. `validate_workflows()` - 14 edges
10. `scripts` - 13 edges

## Surprising Connections (you probably didn't know these)
- `_event_to_contract()` --uses--> `Event`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `get_event()` --uses--> `Event`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `list_events()` --uses--> `Event`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `ingest_events()` --uses--> `Event`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py
- `db_session()` --uses--> `Event`  [INFERRED]
  backend/tests/conftest.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (62 total, 18 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "page.tsx"
Cohesion: 0.07
Nodes (31): BottomNav(), event, DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), DesktopSidebar(), costBadgeClass() (+23 more)

### Community 2 - "Core screens"
Cohesion: 0.11
Nodes (19): 1. Discover, 2. Results explorer, 3. Map view, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens (+11 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.06
Nodes (32): Accessibility baseline, Application shell, Consensus basis, Consensus summary, Defer, Desktop, EventMatch NYC — Initial Frontend Direction, Global freshness banner (+24 more)

### Community 4 - "ContractMockTests"
Cohesion: 0.11
Nodes (13): BaseHTTPRequestHandler, ContractHandler, create_server(), fact_value(), filter_events(), load_json(), main(), parse_positive_int() (+5 more)

### Community 5 - "SocrataClient"
Cohesion: 0.07
Nodes (31): AsyncClient, CredentialFilter, Close the HTTP client if this instance created it., Prevent credential values from appearing in log output., Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, SocrataClient, AlwaysErrorTransport, MockTransport (+23 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "scripts"
Cohesion: 0.08
Nodes (23): dependencies, next, react, react-dom, name, private, scripts, build (+15 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "validate_contract.py"
Cohesion: 0.11
Nodes (25): _build_validator(), _load_spec(), Any, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec., Validate real API responses against the OpenAPI contract schema. (+17 more)

### Community 20 - "EventMatch NYC API contract"
Cohesion: 0.50
Nodes (3): EventMatch NYC API contract, Run the mock, Validate

### Community 23 - "compilerOptions"
Cohesion: 0.06
Nodes (31): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+23 more)

### Community 24 - "419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff"
Cohesion: 0.14
Nodes (13): 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff, Assets and supporting files, CJX-ready UX contract, Coding checklist for AI tools, Color and brand contract, Design fidelity contract, Entry points, Implementation sequence for AI coding tools (+5 more)

### Community 25 - "devDependencies"
Cohesion: 0.08
Nodes (25): @axe-core/playwright, eslint, eslint-config-next, devDependencies, @axe-core/playwright, eslint, eslint-config-next, jsdom (+17 more)

### Community 26 - "events.py"
Cohesion: 0.07
Nodes (45): async_sessionmaker, AsyncEngine, get_engine(), get_session_factory(), AsyncSession, Async SQLAlchemy engine and session factory., Return a singleton async engine., Return a singleton async session factory. (+37 more)

### Community 27 - "TestHealthEndpoint"
Cohesion: 0.15
Nodes (8): requires_docker, Verify the health endpoint reports service status correctly., Return JSON with status, database, and Redis keys., With a real Postgres container, database must report connected., The integration gate requires both real backing services., Without a running Redis, the endpoint must return 503 and degraded status., Response must contain exactly the three required fields., TestHealthEndpoint

### Community 28 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 38 - "load_fixture"
Cohesion: 0.06
Nodes (32): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape. (+24 more)

### Community 45 - "parse_event"
Cohesion: 0.17
Nodes (12): _derive_borough(), _location_key(), _parse_categories(), _parse_coordinates(), _parse_date(), parse_event(), Convert MM/DD/YYYY to ISO date string, or return None., Parse coordinate string into (lat, lon, coordinate_list). Returns the first… (+4 more)

### Community 46 - "env.py"
Cohesion: 0.23
Nodes (11): do_run_migrations(), get_url(), Alembic environment configuration for async SQLAlchemy., Return the database URL from application settings., Run migrations in offline mode (emit SQL without connecting)., Execute migrations against the provided connection., Run migrations in online mode with an async engine., Run migrations in online mode. (+3 more)

### Community 47 - "conftest.py"
Cohesion: 0.09
Nodes (23): _check_docker(), client(), db_session(), _maybe_start_postgres(), postgres_url(), Test fixtures using Testcontainers for real Postgres., Return the async Postgres URL (skips if Docker unavailable)., Provide an async test client for the FastAPI app. (+15 more)

### Community 48 - "get_settings"
Cohesion: 0.33
Nodes (6): get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, BaseSettings

### Community 51 - "socrata.py"
Cohesion: 0.19
Nodes (12): Event, Event SQLAlchemy model for NYC Parks events., A single NYC Parks event identified by its source guid., Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., _parse_datetime(), Socrata NYC Parks Events API client with pagination and retry. (+4 more)

### Community 52 - "ingest_events"
Cohesion: 0.50
Nodes (5): ingest_events(), AsyncSession, Atomically upsert validated source rows by source guid., Fetch the complete source Snapshot and store it in Postgres., sync_events()

### Community 53 - "SocrataError"
Cohesion: 0.15
Nodes (14): _derive_registration(), _normalize_socrata_url(), Any, Response, POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., Normalize a Socrata URL string or object without changing the raw row. (+6 more)

### Community 56 - "railway_release.py"
Cohesion: 0.17
Nodes (24): ArgumentParser, Namespace, capture_revision(), choose_origin(), deployment_command(), deployment_records(), discover(), domain_names() (+16 more)

### Community 57 - "validate_workflows"
Cohesion: 0.21
Nodes (8): WorkflowPolicyTests, event_names(), iter_steps(), load_workflow(), main(), Any, Path, validate_workflows()

### Community 58 - "tsconfig.tests.json"
Cohesion: 0.17
Nodes (11): compilerOptions, incremental, exclude, extends, include, next-env.d.ts, node_modules, **/*.test.ts (+3 more)

### Community 59 - "api-contract.test.ts"
Cohesion: 0.40
Nodes (3): Fact, FrontendEvent, Provenance

### Community 60 - "CI/CD extension matrix"
Cohesion: 0.50
Nodes (3): CI/CD extension matrix, Clean-runner commands, Trust boundary

## Knowledge Gaps
- **172 isolated node(s):** `nyc-events-backend`, `dynamic`, `DayInfo`, `DAY_NAMES`, `categories` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `socrata.py`, `validate_contract.py`, `SocrataClient`, `conftest.py`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `Event` connect `socrata.py` to `events.py`, `ingest_events`, `load_fixture`, `conftest.py`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `get_settings()` connect `get_settings` to `SocrataClient`, `env.py`, `conftest.py`, `socrata.py`, `events.py`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `SocrataClient` (e.g. with `TestNetworkEnforcement` and `TestCredentialFiltering`) actually correct?**
  _`SocrataClient` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `Event` (e.g. with `_event_to_contract()` and `get_event()`) actually correct?**
  _`Event` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `dynamic`, `DayInfo` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._