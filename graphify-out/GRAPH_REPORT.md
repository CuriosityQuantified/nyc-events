# Graph Report - nyc-events  (2026-08-16)

## Corpus Check
- 81 files · ~37,940 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 578 nodes · 829 edges · 59 communities (41 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2df1e69f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- page.tsx
- Core screens
- NYC Events — Handoff Document
- ContractMockTests
- test_socrata.py
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
- conftest.py
- TestHealthEndpoint
- frontend/README.md
- layout.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- shell.spec.ts
- ingest_rows
- nyc-events-backend
- load_fixture
- Event
- test_migrations.py
- test_ingestion.py
- socrata.py
- CredentialFilter
- SocrataError
- SocrataClient
- .handle_async_request
- test_contract.py
- TestIngestionWithDb
- Any

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 32 edges
2. `SocrataClient` - 23 edges
3. `parse_event()` - 23 edges
4. `ingest_rows()` - 20 edges
5. `Event` - 16 edges
6. `compilerOptions` - 16 edges
7. `SocrataError` - 15 edges
8. `MockTransport` - 14 edges
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

## Communities (59 total, 18 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state — NO application code yet, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

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

### Community 5 - "test_socrata.py"
Cohesion: 0.18
Nodes (10): MockTransport, Transport-layer mock that intercepts httpx requests. Returns paginated…, Tests for the Socrata client — pagination, retry, credential filtering, parsing., Verify the client pages through all results and stops on empty., The client must fetch all pages and combine the rows., The client must stop when an empty page is returned., Verify exponential-backoff retry on server errors., The client must retry on 503 and succeed when the server recovers. (+2 more)

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

### Community 26 - "conftest.py"
Cohesion: 0.06
Nodes (48): async_sessionmaker, get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, get_engine(), get_session_factory() (+40 more)

### Community 27 - "TestHealthEndpoint"
Cohesion: 0.15
Nodes (8): requires_docker, Tests for the /health endpoint., Verify the health endpoint reports service status correctly., The health endpoint must return a JSON body with status, database, and redis…, With a real Postgres container, database must report connected., Without a running Redis, the endpoint must return 503 and degraded status., Response must contain exactly the three required fields., TestHealthEndpoint

### Community 28 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 38 - "ingest_rows"
Cohesion: 0.17
Nodes (10): ingest_rows(), Parse raw Socrata rows and merge them into the database. This is the shared…, requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., Verify Event and Location identity rules., TestGetEvent (+2 more)

### Community 45 - "load_fixture"
Cohesion: 0.13
Nodes (13): load_fixture(), Load a JSON fixture file by name from the fixtures directory., Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats., Pipe-delimited categories must be split into a list. (+5 more)

### Community 46 - "Event"
Cohesion: 0.12
Nodes (28): Event, Event SQLAlchemy model for NYC Parks events., A single NYC Parks event identified by its source guid., Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., _boolean_fact(), _date_fact() (+20 more)

### Community 47 - "test_migrations.py"
Cohesion: 0.29
Nodes (7): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Revision 0002 must downgrade, upgrade, and re-upgrade cleanly., test_events_migration_upgrade_and_idempotency(), CompletedProcess

### Community 48 - "test_ingestion.py"
Cohesion: 0.22
Nodes (7): AlwaysErrorTransport, Transport that always returns the given error status code., Tests for event ingestion — snapshot deltas, guid identity, network isolation., Verify that transport-layer substitution prevents real network access., The Socrata client with an injected transport must not reach the network. The…, TestNetworkEnforcement, The client must raise after all retries are exhausted.

### Community 51 - "socrata.py"
Cohesion: 0.13
Nodes (21): _derive_borough(), ingest_events(), _location_key(), _parse_categories(), _parse_coordinates(), _parse_date(), _parse_datetime(), parse_event() (+13 more)

### Community 52 - "CredentialFilter"
Cohesion: 0.22
Nodes (7): AsyncClient, CredentialFilter, Prevent credential values from appearing in log output., Verify that credential values never appear in log output., Log output during a request must not contain API key values., TestCredentialFiltering, LogRecord

### Community 53 - "SocrataError"
Cohesion: 0.15
Nodes (14): _derive_registration(), _normalize_socrata_url(), Any, Response, POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., Normalize a Socrata URL string or object without changing the raw row. (+6 more)

### Community 54 - "SocrataClient"
Cohesion: 0.31
Nodes (6): Close the HTTP client if this instance created it., Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, SocrataClient, Reject unsafe endpoints and malformed source responses., TestResponseValidation, parametrize

### Community 56 - "test_contract.py"
Cohesion: 0.15
Nodes (13): _build_validator(), _load_spec(), Any, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec., Validate real API responses against the OpenAPI contract schema. (+5 more)

### Community 57 - "TestIngestionWithDb"
Cohesion: 0.15
Nodes (8): requires_docker, A malformed row must not leave a partially ingested Snapshot., Verify snapshot ingestion, deltas, and guid-based identity (needs Postgres)., All events from snapshot_a must be stored in the database., A live Socrata URL object must ingest and retain its raw shape., Ingesting snapshot_b after snapshot_a must add 1 new event and update 1 changed…, Duplicate guid must update, not create a second row., TestIngestionWithDb

## Knowledge Gaps
- **151 isolated node(s):** `nyc-events-backend`, `DayInfo`, `DAY_NAMES`, `categories`, `boroughs` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `Any`, `test_socrata.py`, `ingest_rows`, `test_ingestion.py`, `CredentialFilter`, `test_contract.py`, `TestIngestionWithDb`, `conftest.py`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `Event` connect `Event` to `ingest_rows`, `test_ingestion.py`, `socrata.py`, `TestIngestionWithDb`, `conftest.py`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `get_settings()` connect `conftest.py` to `socrata.py`, `CredentialFilter`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `SocrataClient` (e.g. with `TestNetworkEnforcement` and `TestCredentialFiltering`) actually correct?**
  _`SocrataClient` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `Event` (e.g. with `_event_to_contract()` and `get_event()`) actually correct?**
  _`Event` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `DayInfo`, `DAY_NAMES` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._