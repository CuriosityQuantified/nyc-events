# Graph Report - nyc-events-frontend  (2026-08-16)

## Corpus Check
- 105 files · ~52,597 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 833 nodes · 1385 edges · 79 communities (60 shown, 19 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b77e229`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- EventExplorer.tsx
- Core screens
- NYC Events — Handoff Document
- ContractMockTests
- SocrataClient
- Language
- CLAUDE.md
- load_fixture
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
- events.ts
- ingest_rows
- nyc-events-backend
- socrata.py
- get_settings
- test_migrations.py
- get_session_factory
- EventMatch NYC — Initial Frontend Direction
- 0003_current_repository_sync_runs.py
- 2. Results explorer
- 8. Desired user-facing features
- DateStrip.tsx
- railway_release.py
- validate_workflows
- tsconfig.tests.json
- api-contract.test.ts
- CI/CD extension matrix
- revision/route.ts
- backend_container_smoke.sh
- 3. Map view
- Application shell
- Trust and system states
- start.sh
- CurrentEvent
- test_contract.py
- SocrataError
- main.py
- concierge_tools.py
- conftest.py
- TestCurrentPipelineContract
- test_ingestion.py
- TestGetEvent
- sync_events
- TestIdentity

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 43 edges
2. `CurrentEvent` - 26 edges
3. `parse_event()` - 24 edges
4. `ingest_rows()` - 24 edges
5. `SocrataClient` - 23 edges
6. `validate_workflows()` - 21 edges
7. `SocrataError` - 20 edges
8. `get_session_factory()` - 19 edges
9. `sync_events()` - 18 edges
10. `WorkflowPolicyTests` - 18 edges

## Surprising Connections (you probably didn't know these)
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `TestCurrentPipelineContract` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `search_current_events()` --uses--> `CurrentEvent`  [INFERRED]
  backend/app/concierge_tools.py → backend/app/models/event.py
- `get_current_event()` --uses--> `CurrentEvent`  [INFERRED]
  backend/app/concierge_tools.py → backend/app/models/event.py
- `ingest_events()` --uses--> `EventRepository`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (79 total, 19 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "EventExplorer.tsx"
Cohesion: 0.06
Nodes (48): BottomNav(), event, DesktopSidebar(), costBadgeClass(), costLabel(), EventCard(), EventCardProps, EventExplorer() (+40 more)

### Community 2 - "Core screens"
Cohesion: 0.20
Nodes (10): 1. Discover, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens, Detail sections, Flow (+2 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.17
Nodes (12): 10. Future data integrations, 11. Completion criteria for the first implementation, 1. Project concept, 2. Local project path, 3. Primary data source, 4. Local API configuration, 5. SODA3 request pattern, 6. Required synchronization architecture (+4 more)

### Community 4 - "ContractMockTests"
Cohesion: 0.11
Nodes (13): BaseHTTPRequestHandler, ContractHandler, create_server(), fact_value(), filter_events(), load_json(), main(), parse_positive_int() (+5 more)

### Community 5 - "SocrataClient"
Cohesion: 0.07
Nodes (25): Response, Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., SocrataClient, MockTransport (+17 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "load_fixture"
Cohesion: 0.11
Nodes (14): load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats. (+6 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "validate_contract.py"
Cohesion: 0.33
Nodes (13): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+5 more)

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
Cohesion: 0.04
Nodes (48): @axe-core/playwright, eslint, eslint-config-next, dependencies, next, react, react-dom, devDependencies (+40 more)

### Community 26 - "events.py"
Cohesion: 0.15
Nodes (23): _boolean_fact(), _date_fact(), _datetime_fact(), _event_to_contract(), get_event(), get_ingestion_health(), list_events(), Any (+15 more)

### Community 27 - "TestHealthEndpoint"
Cohesion: 0.11
Nodes (11): requires_docker, Tests for the /health endpoint., Verify the health endpoint reports service status correctly., Return JSON with status, database, and Redis keys., With a real Postgres container, database must report connected., The integration gate requires both real backing services., Without a running Redis, the endpoint must return 503 and degraded status., Verify deployment cutover can identify the exact running revision. (+3 more)

### Community 28 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 34 - "events.ts"
Cohesion: 0.07
Nodes (33): dynamic, GET(), emptyPage, { getFilteredEvents }, dynamic, GET(), apiBaseUrl(), ApiEvent (+25 more)

### Community 38 - "ingest_rows"
Cohesion: 0.16
Nodes (10): ingest_rows(), Parse raw Socrata rows and merge them into the database. This is the shared…, requires_docker, A malformed row must not leave a partially ingested Snapshot., Verify atomic current Snapshot replacement and archival retention., All events from snapshot_a must be stored in the database., A live Socrata URL object must ingest and retain its raw shape., Ingesting snapshot_b after snapshot_a must add 1 new event and update 1 changed… (+2 more)

### Community 45 - "socrata.py"
Cohesion: 0.13
Nodes (23): _derive_borough(), _derive_registration(), _location_key(), _normalize_socrata_url(), _optional_text(), _parse_categories(), _parse_coordinates(), _parse_date() (+15 more)

### Community 46 - "get_settings"
Cohesion: 0.15
Nodes (17): get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, do_run_migrations(), get_url(), Alembic environment configuration for async SQLAlchemy. (+9 more)

### Community 47 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Revision 0003 must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 48 - "get_session_factory"
Cohesion: 0.15
Nodes (17): async_sessionmaker, get_session_factory(), AsyncSession, Async SQLAlchemy engine and session factory., Return a singleton async session factory., Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), _main() (+9 more)

### Community 51 - "EventMatch NYC — Initial Frontend Direction"
Cohesion: 0.18
Nodes (9): Accessibility baseline, Consensus basis, Consensus summary, Defer, EventMatch NYC — Initial Frontend Direction, Include, Initial MVP scope, Product definition (+1 more)

### Community 52 - "0003_current_repository_sync_runs.py"
Cohesion: 0.50
Nodes (3): _event_columns(), upgrade(), Column

### Community 53 - "2. Results explorer"
Cohesion: 0.40
Nodes (5): 2. Results explorer, Event cards, Filters, Shareable state, Sort options

### Community 54 - "8. Desired user-facing features"
Cohesion: 0.40
Nodes (5): 8. Desired user-facing features, AI concierge, Event exploration, Saved preferences and notifications, Social distribution

### Community 55 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 56 - "railway_release.py"
Cohesion: 0.11
Nodes (34): ArgumentParser, BaseException, Namespace, RuntimeError, capture_revision(), choose_origin(), classify_cli_diagnostic(), configure_sync_worker() (+26 more)

### Community 57 - "validate_workflows"
Cohesion: 0.15
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

### Community 64 - "3. Map view"
Cohesion: 0.50
Nodes (4): 3. Map view, Location identity, Marker sizing, Required behavior

### Community 65 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 66 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

### Community 68 - "CurrentEvent"
Cohesion: 0.18
Nodes (14): CurrentEvent, EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., One Event in the latest complete successful source Snapshot., Base (+6 more)

### Community 69 - "test_contract.py"
Cohesion: 0.16
Nodes (12): _build_validator(), _load_spec(), Any, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec., Validate real API responses against the OpenAPI contract schema. (+4 more)

### Community 70 - "SocrataError"
Cohesion: 0.16
Nodes (10): AsyncClient, CredentialFilter, Prevent credential values from appearing in log output., Raised when the Socrata API returns an unrecoverable error., Allow only the fixed NYC Open Data HTTPS query origin., SocrataError, _validated_endpoint(), Tests for the Socrata client — pagination, retry, credential filtering, parsing. (+2 more)

### Community 71 - "main.py"
Cohesion: 0.19
Nodes (13): AsyncEngine, get_engine(), Return a singleton async engine., deployment_revision(), health_check(), lifespan(), get, FastAPI application entry point. (+5 more)

### Community 72 - "concierge_tools.py"
Cohesion: 0.22
Nodes (11): CurrentEventSearch, get_current_event(), Any, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden., search_current_events() (+3 more)

### Community 73 - "conftest.py"
Cohesion: 0.22
Nodes (13): Secret-free operational evidence for one attempted synchronization., SyncRun, _check_docker(), client(), db_session(), _maybe_start_postgres(), postgres_url(), Test fixtures using Testcontainers for real Postgres. (+5 more)

### Community 74 - "TestCurrentPipelineContract"
Cohesion: 0.22
Nodes (3): FixtureSource, requires_docker, TestCurrentPipelineContract

### Community 75 - "test_ingestion.py"
Cohesion: 0.28
Nodes (6): AlwaysErrorTransport, Transport that always returns the given error status code., Tests for event ingestion — snapshot deltas, guid identity, network isolation., Verify that transport-layer substitution prevents real network access., The Socrata client with an injected transport must not reach the network. The…, TestNetworkEnforcement

### Community 76 - "TestGetEvent"
Cohesion: 0.22
Nodes (5): requires_docker, Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., TestGetEvent, TestListEvents

### Community 77 - "sync_events"
Cohesion: 0.29
Nodes (8): EventSource, ingest_events(), AsyncSession, Atomically archive a valid Snapshot and replace the current dataset., Fetch and store one complete Snapshot with durable attempt evidence., The narrow transport contract used by the synchronization job., sync_events(), Protocol

## Knowledge Gaps
- **188 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getFilteredEvents }`, `emptyPage`, `dynamic` (+183 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sync_events()` connect `sync_events` to `CurrentEvent`, `SocrataClient`, `load_fixture`, `conftest.py`, `concierge_tools.py`, `test_ingestion.py`, `TestCurrentPipelineContract`, `socrata.py`, `get_session_factory`, `railway_release.py`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `load_fixture()` connect `load_fixture` to `CurrentEvent`, `test_contract.py`, `ingest_rows`, `SocrataError`, `concierge_tools.py`, `conftest.py`, `TestCurrentPipelineContract`, `test_ingestion.py`, `TestGetEvent`, `SocrataClient`, `TestIdentity`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `ingest_rows`, `concierge_tools.py`, `conftest.py`, `TestCurrentPipelineContract`, `test_ingestion.py`, `sync_events`, `socrata.py`, `TestIdentity`, `get_session_factory`, `events.py`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `SocrataClient` (e.g. with `TestNetworkEnforcement` and `TestCredentialFiltering`) actually correct?**
  _`SocrataClient` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getFilteredEvents }` to the rest of the system?**
  _188 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._