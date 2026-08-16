# Graph Report - nyc-events-frontend  (2026-08-16)

## Corpus Check
- 124 files · ~89,824 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1004 nodes · 1737 edges · 82 communities (62 shown, 20 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5871783a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- EventExplorer.tsx
- Core screens
- NYC Events — Handoff Document
- ContractMockTests
- test_socrata.py
- Language
- CLAUDE.md
- events.py
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
- Issue #16 backend handoff
- TestHealthEndpoint
- frontend/README.md
- layout.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- events.ts
- load_fixture
- nyc-events-backend
- parse_event
- main.py
- filter-state.spec.ts
- CurrentEvent
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
- 0004_event_lifecycle.py
- Issue #15 backend handoff
- test_migrations.py
- test_sync_worker.py
- [guid]/route.ts
- Issue #13 backend handoff
- DateStrip.tsx
- event-detail.spec.ts
- socrata.py
- apiToUiEvent
- get_settings
- TrustStatus.tsx
- Trust and system states

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 60 edges
2. `ingest_rows()` - 40 edges
3. `CurrentEvent` - 31 edges
4. `parse_event()` - 30 edges
5. `SocrataError` - 24 edges
6. `WorkflowPolicyTests` - 24 edges
7. `SocrataClient` - 23 edges
8. `validate_workflows()` - 23 edges
9. `get_settings()` - 20 edges
10. `get_session_factory()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `list_event_changes()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `ingest_events()` --uses--> `EventRepository`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py
- `_missing_classification()` --uses--> `EventRepository`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py
- `_present_classification()` --uses--> `EventRepository`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (82 total, 20 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "EventExplorer.tsx"
Cohesion: 0.05
Nodes (54): dynamic, GET(), emptyPage, { getFilteredEvents }, BottomNav(), event, DesktopSidebar(), costBadgeClass() (+46 more)

### Community 2 - "Core screens"
Cohesion: 0.20
Nodes (10): 1. Discover, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens, Detail sections, Flow (+2 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.17
Nodes (12): 10. Future data integrations, 11. Completion criteria for the first implementation, 1. Project concept, 2. Local project path, 3. Primary data source, 4. Local API configuration, 5. SODA3 request pattern, 6. Required synchronization architecture (+4 more)

### Community 4 - "ContractMockTests"
Cohesion: 0.11
Nodes (13): BaseHTTPRequestHandler, ContractHandler, create_server(), fact_value(), filter_events(), load_json(), main(), parse_positive_int() (+5 more)

### Community 5 - "test_socrata.py"
Cohesion: 0.08
Nodes (22): AsyncClient, CredentialFilter, Prevent credential values from appearing in log output., AlwaysErrorTransport, MockTransport, Response, Transport-layer mock that intercepts httpx requests. Returns paginated…, Transport that always returns the given error status code. (+14 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "events.py"
Cohesion: 0.11
Nodes (33): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., _date_fact(), _datetime_fact(), _derived_boolean_fact(), _event_to_contract() (+25 more)

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

### Community 26 - "Issue #16 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #16 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 27 - "TestHealthEndpoint"
Cohesion: 0.11
Nodes (11): requires_docker, Tests for the /health endpoint., Verify the health endpoint reports service status correctly., Return JSON with status, database, and Redis keys., With a real Postgres container, database must report connected., The integration gate requires both real backing services., Without a running Redis, the endpoint must return 503 and degraded status., Verify deployment cutover can identify the exact running revision. (+3 more)

### Community 28 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 34 - "events.ts"
Cohesion: 0.21
Nodes (16): dynamic, GET(), apiBaseUrl(), ApiEventsResponse, apiFetch(), ApiFreshness, EVENT_LIFECYCLE_STATUSES, FACT_FIELDS (+8 more)

### Community 38 - "load_fixture"
Cohesion: 0.05
Nodes (46): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, _build_validator(), _load_spec(), Any (+38 more)

### Community 45 - "parse_event"
Cohesion: 0.05
Nodes (42): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts() (+34 more)

### Community 46 - "main.py"
Cohesion: 0.19
Nodes (13): AsyncEngine, get_engine(), Return a singleton async engine., deployment_revision(), health_check(), lifespan(), get, FastAPI application entry point. (+5 more)

### Community 47 - "filter-state.spec.ts"
Cohesion: 0.25
Nodes (3): AuditedPage, FilterKey, fixtureEvent

### Community 48 - "CurrentEvent"
Cohesion: 0.10
Nodes (24): CurrentEventSearch, get_current_event(), Any, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden., search_current_events() (+16 more)

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
Cohesion: 0.12
Nodes (20): EventFields, EventRepository, Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., _check_docker() (+12 more)

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

### Community 69 - "0004_event_lifecycle.py"
Cohesion: 0.50
Nodes (3): _content_hash(), Any, upgrade()

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "test_sync_worker.py"
Cohesion: 0.16
Nodes (17): Secret-free operational evidence for one attempted synchronization., SyncRun, RuntimeError, Raised when another worker owns the distributed synchronization lock., Run one locked Snapshot synchronization from the standalone worker., run(), SyncAlreadyRunning, BlockingSource (+9 more)

### Community 76 - "[guid]/route.ts"
Cohesion: 0.32
Nodes (5): dynamic, GET(), { getEvent, EventsApiError }, EventsApiError, getEvent()

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 82 - "socrata.py"
Cohesion: 0.06
Nodes (45): Current, archival, and synchronization persistence models., _content_hash(), _derive_registration(), EventSource, ingest_events(), _is_explicitly_cancelled(), _missing_classification(), _normalize_socrata_url() (+37 more)

### Community 83 - "apiToUiEvent"
Cohesion: 0.14
Nodes (9): apiToUiEvent(), formatDate(), formatTime(), AuditedPage, lifecycleEvents, sourceEvents, AuditedPage, firstPage (+1 more)

### Community 84 - "get_settings"
Cohesion: 0.11
Nodes (23): get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, Async SQLAlchemy engine and session factory., Dispose of the current engine. Use for testing or reconfiguration., reset_engine() (+15 more)

### Community 85 - "TrustStatus.tsx"
Cohesion: 0.24
Nodes (10): COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime(), FreshnessBanner(), FreshnessBannerProps, STATUS_COPY, current (+2 more)

### Community 86 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

## Knowledge Gaps
- **221 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+216 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `test_socrata.py`, `test_sync_worker.py`, `parse_event`, `CurrentEvent`, `socrata.py`, `conftest.py`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `load_fixture`, `events.py`, `test_sync_worker.py`, `parse_event`, `socrata.py`, `conftest.py`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `SocrataError` connect `socrata.py` to `test_socrata.py`, `load_fixture`, `test_sync_worker.py`, `parse_event`, `CurrentEvent`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `SocrataError` (e.g. with `TestIngestionWithDb` and `TestNetworkEnforcement`) actually correct?**
  _`SocrataError` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _221 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._