# Graph Report - nyc-events  (2026-08-15)

## Corpus Check
- 79 files · ~37,440 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 566 nodes · 800 edges · 50 communities (34 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `caa2ce3c`
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
- get_settings
- TestHealthEndpoint
- frontend/README.md
- layout.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- shell.spec.ts
- load_fixture
- nyc-events-backend
- socrata.py
- Event
- conftest.py

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 28 edges
2. `SocrataClient` - 23 edges
3. `parse_event()` - 19 edges
4. `ingest_rows()` - 19 edges
5. `Event` - 16 edges
6. `compilerOptions` - 16 edges
7. `MockTransport` - 14 edges
8. `SocrataError` - 13 edges
9. `419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff` - 13 edges
10. `get_settings()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `ingest_events()` --uses--> `Event`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py
- `db_session()` --uses--> `Event`  [INFERRED]
  backend/tests/conftest.py → backend/app/models/event.py
- `TestIdentity` --uses--> `Event`  [INFERRED]
  backend/tests/test_events.py → backend/app/models/event.py
- `TestIngestionWithDb` --uses--> `Event`  [INFERRED]
  backend/tests/test_ingestion.py → backend/app/models/event.py
- `TestIngestionWithDb` --uses--> `SocrataError`  [INFERRED]
  backend/tests/test_ingestion.py → backend/app/socrata.py

## Import Cycles
- None detected.

## Communities (50 total, 16 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state — NO application code yet, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "page.tsx"
Cohesion: 0.08
Nodes (30): BottomNav(), event, DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), DesktopSidebar(), costBadgeClass() (+22 more)

### Community 2 - "Core screens"
Cohesion: 0.11
Nodes (19): 1. Discover, 2. Results explorer, 3. Map view, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens (+11 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.06
Nodes (32): Accessibility baseline, Application shell, Consensus basis, Consensus summary, Defer, Desktop, Global freshness banner, Include (+24 more)

### Community 4 - "ContractMockTests"
Cohesion: 0.11
Nodes (13): BaseHTTPRequestHandler, ContractHandler, create_server(), fact_value(), filter_events(), load_json(), main(), parse_positive_int() (+5 more)

### Community 5 - "SocrataClient"
Cohesion: 0.05
Nodes (42): AsyncClient, CredentialFilter, Any, Response, Close the HTTP client if this instance created it., POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns. (+34 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "scripts"
Cohesion: 0.09
Nodes (21): dependencies, next, react, react-dom, name, private, scripts, build (+13 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "validate_contract.py"
Cohesion: 0.37
Nodes (12): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+4 more)

### Community 20 - "EventMatch NYC API contract"
Cohesion: 0.50
Nodes (3): EventMatch NYC API contract, Run the mock, Validate

### Community 23 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 24 - "419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff"
Cohesion: 0.14
Nodes (13): 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff, Assets and supporting files, CJX-ready UX contract, Coding checklist for AI tools, Color and brand contract, Design fidelity contract, Entry points, Implementation sequence for AI coding tools (+5 more)

### Community 25 - "devDependencies"
Cohesion: 0.09
Nodes (23): @axe-core/playwright, eslint, eslint-config-next, devDependencies, @axe-core/playwright, eslint, eslint-config-next, jsdom (+15 more)

### Community 26 - "get_settings"
Cohesion: 0.09
Nodes (29): get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, get_engine(), Async SQLAlchemy engine and session factory., Return a singleton async engine. (+21 more)

### Community 27 - "TestHealthEndpoint"
Cohesion: 0.15
Nodes (8): requires_docker, Tests for the /health endpoint., Verify the health endpoint reports service status correctly., The health endpoint must return a JSON body with status, database, and redis…, With a real Postgres container, database must report connected., Without a running Redis, the endpoint must return 503 and degraded status., Response must contain exactly the three required fields., TestHealthEndpoint

### Community 28 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 38 - "load_fixture"
Cohesion: 0.07
Nodes (33): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, _build_validator(), _load_spec(), Any (+25 more)

### Community 45 - "socrata.py"
Cohesion: 0.07
Nodes (35): _derive_borough(), _derive_registration(), ingest_events(), _location_key(), _parse_categories(), _parse_coordinates(), _parse_date(), _parse_datetime() (+27 more)

### Community 46 - "Event"
Cohesion: 0.10
Nodes (32): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., Event, Event SQLAlchemy model for NYC Parks events., A single NYC Parks event identified by its source guid., Base (+24 more)

### Community 47 - "conftest.py"
Cohesion: 0.14
Nodes (18): _check_docker(), client(), db_session(), _maybe_start_postgres(), postgres_url(), Test fixtures using Testcontainers for real Postgres., Return the async Postgres URL (skips if Docker unavailable)., Provide an async test client for the FastAPI app. (+10 more)

## Knowledge Gaps
- **150 isolated node(s):** `nyc-events-backend`, `DayInfo`, `DAY_NAMES`, `categories`, `boroughs` (+145 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Event` connect `Event` to `SocrataClient`, `socrata.py`, `load_fixture`, `conftest.py`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `load_fixture()` connect `load_fixture` to `socrata.py`, `SocrataClient`, `conftest.py`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `get_settings()` connect `get_settings` to `SocrataClient`, `socrata.py`, `conftest.py`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `SocrataClient` (e.g. with `TestNetworkEnforcement` and `TestCredentialFiltering`) actually correct?**
  _`SocrataClient` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `Event` (e.g. with `_event_to_contract()` and `get_event()`) actually correct?**
  _`Event` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `DayInfo`, `DAY_NAMES` to the rest of the system?**
  _150 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._