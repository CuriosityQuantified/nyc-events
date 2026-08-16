# Graph Report - nyc-events-frontend  (2026-08-16)

## Corpus Check
- 121 files · ~86,610 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 968 nodes · 1664 edges · 93 communities (72 shown, 21 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5a310066`
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
- test_contract.py
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
- test_events.py
- TestHealthEndpoint
- frontend/README.md
- layout.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- events.ts
- load_fixture
- nyc-events-backend
- TestParseEvent
- main.py
- test_event_provenance.py
- events.py
- EventMatch NYC — Initial Frontend Direction
- 0003_current_repository_sync_runs.py
- 2. Results explorer
- 8. Desired user-facing features
- conftest.py
- railway_release.py
- WorkflowPolicyTests
- tsconfig.tests.json
- api-contract.test.ts
- CI/CD extension matrix
- revision/route.ts
- backend_container_smoke.sh
- 3. Map view
- Application shell
- EventDetail.tsx
- start.sh
- BackendContainerSmokeTests
- EventSource
- Issue #15 backend handoff
- test_ingestion.py
- test_migrations.py
- test_sync_worker.py
- SocrataError
- socrata.py
- [guid]/route.ts
- Issue #13 backend handoff
- DateStrip.tsx
- event-detail.spec.ts
- sync.py
- parse_event
- Any
- apiToUiEvent
- env.py
- TrustStatus.tsx
- Trust and system states
- events/route.ts
- get_settings
- CredentialFilter
- freshness-status.spec.ts
- ingest_events
- .test_invalid_filters_fail_as_errors

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 54 edges
2. `ingest_rows()` - 34 edges
3. `CurrentEvent` - 30 edges
4. `parse_event()` - 29 edges
5. `SocrataError` - 24 edges
6. `WorkflowPolicyTests` - 24 edges
7. `SocrataClient` - 23 edges
8. `validate_workflows()` - 23 edges
9. `get_settings()` - 20 edges
10. `get_session_factory()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `search_current_events()` --uses--> `CurrentEvent`  [INFERRED]
  backend/app/concierge_tools.py → backend/app/models/event.py
- `get_current_event()` --uses--> `CurrentEvent`  [INFERRED]
  backend/app/concierge_tools.py → backend/app/models/event.py
- `ingest_events()` --uses--> `EventRepository`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py
- `TestIdentity` --uses--> `EventRepository`  [INFERRED]
  backend/tests/test_events.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (93 total, 21 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "EventExplorer.tsx"
Cohesion: 0.06
Nodes (47): BottomNav(), event, DesktopSidebar(), costBadgeClass(), costLabel(), EventCard(), EventCardProps, EventExplorer() (+39 more)

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
Cohesion: 0.09
Nodes (22): Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., SocrataClient, MockTransport, Transport-layer mock that intercepts httpx requests. Returns paginated…, parametrize, Tests for the Socrata client — pagination, retry, credential filtering, parsing., The client must raise after all retries are exhausted. (+14 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "test_contract.py"
Cohesion: 0.16
Nodes (12): _build_validator(), _load_spec(), Any, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec., Validate real API responses against the OpenAPI contract schema. (+4 more)

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

### Community 26 - "test_events.py"
Cohesion: 0.14
Nodes (8): requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., Verify Event and Location identity rules., TestGetEvent, TestIdentity, TestListEvents

### Community 27 - "TestHealthEndpoint"
Cohesion: 0.11
Nodes (11): requires_docker, Tests for the /health endpoint., Verify the health endpoint reports service status correctly., Return JSON with status, database, and Redis keys., With a real Postgres container, database must report connected., The integration gate requires both real backing services., Without a running Redis, the endpoint must return 503 and degraded status., Verify deployment cutover can identify the exact running revision. (+3 more)

### Community 28 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 34 - "events.ts"
Cohesion: 0.20
Nodes (16): dynamic, GET(), apiBaseUrl(), ApiEventsResponse, apiFetch(), ApiFreshness, EVENT_LIFECYCLE_STATUSES, EventPage (+8 more)

### Community 38 - "load_fixture"
Cohesion: 0.11
Nodes (17): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, requires_docker, Issue #11 API gates for composable Event facet filters., Exercise filters through GET /events against real PostgreSQL. (+9 more)

### Community 45 - "TestParseEvent"
Cohesion: 0.12
Nodes (9): Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats., Pipe-delimited categories must be split into a list., Registration not required.' maps to not_required., The live Socrata URL object must imply registration and stay raw. (+1 more)

### Community 46 - "main.py"
Cohesion: 0.19
Nodes (13): AsyncEngine, get_engine(), Return a singleton async engine., deployment_revision(), health_check(), lifespan(), get, FastAPI application entry point. (+5 more)

### Community 47 - "test_event_provenance.py"
Cohesion: 0.33
Nodes (8): parametrize, requires_docker, Issue #13 executable gates for single-Event provenance., _source_row(), test_free_status_is_never_inferred_from_silence_or_ambiguous_text(), test_missing_source_facts_are_absent_not_negative_claims(), test_positive_source_language_sets_only_positive_derived_flags(), test_single_event_returns_complete_provenance_and_preserves_raw_source()

### Community 48 - "events.py"
Cohesion: 0.05
Nodes (60): async_sessionmaker, CurrentEventSearch, get_current_event(), Any, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden. (+52 more)

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

### Community 55 - "conftest.py"
Cohesion: 0.29
Nodes (9): _check_docker(), client(), _maybe_start_postgres(), postgres_url(), fixture, Test fixtures using Testcontainers for real Postgres., Return the async Postgres URL (skips if Docker unavailable)., Provide an async test client for the FastAPI app. (+1 more)

### Community 56 - "railway_release.py"
Cohesion: 0.11
Nodes (36): ArgumentParser, BaseException, Namespace, capture_revision(), choose_origin(), classify_cli_diagnostic(), configure_sync_worker(), deployment_command() (+28 more)

### Community 57 - "WorkflowPolicyTests"
Cohesion: 0.11
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

### Community 66 - "EventDetail.tsx"
Cohesion: 0.12
Nodes (18): EventDetail(), load(), EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance() (+10 more)

### Community 69 - "EventSource"
Cohesion: 0.50
Nodes (3): EventSource, The narrow transport contract used by the synchronization job., Protocol

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 71 - "test_ingestion.py"
Cohesion: 0.19
Nodes (8): AlwaysErrorTransport, Response, Transport that always returns the given error status code., Tests for event ingestion — snapshot deltas, guid identity, network isolation., Verify that transport-layer substitution prevents real network access., The Socrata client with an injected transport must not reach the network. The…, TestNetworkEnforcement, Request

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Revision 0003 must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "test_sync_worker.py"
Cohesion: 0.18
Nodes (15): Secret-free operational evidence for one attempted synchronization., SyncRun, RuntimeError, Raised when another worker owns the distributed synchronization lock., Run one locked Snapshot synchronization from the standalone worker., run(), SyncAlreadyRunning, BlockingSource (+7 more)

### Community 74 - "SocrataError"
Cohesion: 0.25
Nodes (8): _optional_text(), Normalize an optional source string or reject an unsupported shape., Raised when the Socrata API returns an unrecoverable error., Allow only the fixed NYC Open Data HTTPS query origin., SocrataError, _validated_endpoint(), FailedSource, Exception

### Community 75 - "socrata.py"
Cohesion: 0.16
Nodes (17): CurrentEvent, EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., One Event in the latest complete successful source Snapshot., Base (+9 more)

### Community 76 - "[guid]/route.ts"
Cohesion: 0.32
Nodes (5): dynamic, GET(), { getEvent, EventsApiError }, EventsApiError, getEvent()

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 80 - "sync.py"
Cohesion: 0.24
Nodes (8): Application configuration via environment variables., Async SQLAlchemy engine and session factory., Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), _main(), Executable Socrata-to-Postgres synchronization command., _main(), Emit secret-free evidence for the current production Event Snapshot.

### Community 81 - "parse_event"
Cohesion: 0.17
Nodes (12): _derive_borough(), _location_key(), _parse_categories(), _parse_coordinates(), _parse_date(), parse_event(), Convert MM/DD/YYYY to ISO date string, or return None., Parse coordinate string into (lat, lon, coordinate_list). Returns the first… (+4 more)

### Community 82 - "Any"
Cohesion: 0.21
Nodes (9): _derive_registration(), _normalize_socrata_url(), Any, Response, POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., Normalize a Socrata URL string or object without changing the raw row. (+1 more)

### Community 83 - "apiToUiEvent"
Cohesion: 0.12
Nodes (9): apiToUiEvent(), formatDate(), formatTime(), AuditedPage, FilterKey, fixtureEvent, AuditedPage, firstPage (+1 more)

### Community 84 - "env.py"
Cohesion: 0.23
Nodes (11): do_run_migrations(), get_url(), Alembic environment configuration for async SQLAlchemy., Return the database URL from application settings., Run migrations in offline mode (emit SQL without connecting)., Execute migrations against the provided connection., Run migrations in online mode with an async engine., Run migrations in online mode. (+3 more)

### Community 85 - "TrustStatus.tsx"
Cohesion: 0.24
Nodes (10): COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime(), FreshnessBanner(), FreshnessBannerProps, STATUS_COPY, current (+2 more)

### Community 86 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

### Community 87 - "events/route.ts"
Cohesion: 0.31
Nodes (7): dynamic, GET(), emptyPage, { getFilteredEvents }, getFilteredEvents(), applyEventFilters(), parseStrictFilterSearchParams()

### Community 88 - "get_settings"
Cohesion: 0.25
Nodes (8): get_settings(), Return a cached Settings instance., Settings loaded from environment variables., Settings, fixture, redis_client(), test_railway_uses_a_separate_scheduled_worker(), BaseSettings

### Community 89 - "CredentialFilter"
Cohesion: 0.33
Nodes (4): AsyncClient, CredentialFilter, Prevent credential values from appearing in log output., LogRecord

### Community 90 - "freshness-status.spec.ts"
Cohesion: 0.33
Nodes (3): AuditedPage, lifecycleEvents, sourceEvents

### Community 91 - "ingest_events"
Cohesion: 0.67
Nodes (3): ingest_events(), AsyncSession, Atomically archive a valid Snapshot and replace the current dataset.

## Knowledge Gaps
- **213 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+208 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `SocrataClient`, `test_ingestion.py`, `test_contract.py`, `test_sync_worker.py`, `TestParseEvent`, `events.py`, `conftest.py`, `test_events.py`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `socrata.py` to `load_fixture`, `test_ingestion.py`, `test_sync_worker.py`, `test_event_provenance.py`, `events.py`, `sync.py`, `conftest.py`, `test_events.py`, `ingest_events`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `get_settings()` connect `get_settings` to `test_sync_worker.py`, `socrata.py`, `main.py`, `sync.py`, `events.py`, `env.py`, `conftest.py`, `CredentialFilter`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 15 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `SocrataError` (e.g. with `TestIngestionWithDb` and `TestNetworkEnforcement`) actually correct?**
  _`SocrataError` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _213 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._