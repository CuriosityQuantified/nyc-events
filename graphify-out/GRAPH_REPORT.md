# Graph Report - nyc-events-backend  (2026-08-16)

## Corpus Check
- 111 files · ~55,849 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 885 nodes · 1486 edges · 87 communities (67 shown, 20 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `544d0264`
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
- accessibility_evidence
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
- load_fixture
- nyc-events-backend
- parse_event
- get_settings
- socrata.py
- SocrataError
- EventMatch NYC — Initial Frontend Direction
- 0003_current_repository_sync_runs.py
- 2. Results explorer
- 8. Desired user-facing features
- get_session_factory
- railway_release.py
- WorkflowPolicyTests
- tsconfig.tests.json
- api-contract.test.ts
- CI/CD extension matrix
- revision/route.ts
- backend_container_smoke.sh
- 3. Map view
- Application shell
- test_events.py
- start.sh
- BackendContainerSmokeTests
- test_contract.py
- concierge_tools.py
- .test_invalid_filters_fail_as_errors
- test_migrations.py
- env.py
- Any
- CurrentEvent
- test_event_provenance.py
- Issue #13 backend handoff
- DateStrip.tsx
- _normalize_socrata_url
- filters.ts
- EventExplorer
- events/route.ts
- filter-state.spec.ts
- EventCard.tsx
- shell.spec.ts
- Trust and system states

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 50 edges
2. `ingest_rows()` - 34 edges
3. `parse_event()` - 29 edges
4. `CurrentEvent` - 28 edges
5. `WorkflowPolicyTests` - 24 edges
6. `SocrataClient` - 23 edges
7. `validate_workflows()` - 23 edges
8. `SocrataError` - 20 edges
9. `get_session_factory()` - 19 edges
10. `_event_to_contract()` - 18 edges

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

## Communities (87 total, 20 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "EventExplorer.tsx"
Cohesion: 0.14
Nodes (13): BottomNav(), DesktopSidebar(), EventExplorerProps, boroughs, Header(), ListMapToggle(), ListMapToggleProps, View (+5 more)

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
Cohesion: 0.06
Nodes (33): AsyncClient, CredentialFilter, Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., Prevent credential values from appearing in log output., Allow only the fixed NYC Open Data HTTPS query origin., SocrataClient, _validated_endpoint() (+25 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "accessibility_evidence"
Cohesion: 0.33
Nodes (8): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts()

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
Cohesion: 0.13
Nodes (26): _date_fact(), _datetime_fact(), _derived_boolean_fact(), _event_to_contract(), get_event(), get_ingestion_health(), list_events(), Any (+18 more)

### Community 27 - "TestHealthEndpoint"
Cohesion: 0.11
Nodes (11): requires_docker, Tests for the /health endpoint., Verify the health endpoint reports service status correctly., Return JSON with status, database, and Redis keys., With a real Postgres container, database must report connected., The integration gate requires both real backing services., Without a running Redis, the endpoint must return 503 and degraded status., Verify deployment cutover can identify the exact running revision. (+3 more)

### Community 28 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 34 - "events.ts"
Cohesion: 0.15
Nodes (22): dynamic, GET(), apiBaseUrl(), ApiEvent, ApiEventsResponse, ApiFact, apiFetch(), ApiFreshness (+14 more)

### Community 38 - "load_fixture"
Cohesion: 0.10
Nodes (17): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, requires_docker, Issue #11 API gates for composable Event facet filters., Exercise filters through GET /events against real PostgreSQL. (+9 more)

### Community 45 - "parse_event"
Cohesion: 0.13
Nodes (13): parse_event(), Convert a Socrata row dict to Event model field values. Returns a dict suitable…, Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats., Pipe-delimited categories must be split into a list. (+5 more)

### Community 46 - "get_settings"
Cohesion: 0.13
Nodes (19): AsyncEngine, get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, get_engine(), Return a singleton async engine. (+11 more)

### Community 47 - "socrata.py"
Cohesion: 0.14
Nodes (14): _derive_borough(), _location_key(), _parse_categories(), _parse_coordinates(), _parse_date(), _parse_datetime(), Socrata NYC Parks Events API client with pagination and retry., Convert MM/DD/YYYY to ISO date string, or return None. (+6 more)

### Community 48 - "SocrataError"
Cohesion: 0.10
Nodes (20): CurrentEventSearch, Validated search inputs with a hard result bound., ingest_events(), AsyncSession, Atomically archive a valid Snapshot and replace the current dataset., Fetch and store one complete Snapshot with durable attempt evidence., Raised when the Socrata API returns an unrecoverable error., SocrataError (+12 more)

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

### Community 55 - "get_session_factory"
Cohesion: 0.20
Nodes (13): async_sessionmaker, get_session_factory(), AsyncSession, Async SQLAlchemy engine and session factory., Return a singleton async session factory., Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), _main() (+5 more)

### Community 56 - "railway_release.py"
Cohesion: 0.11
Nodes (36): ArgumentParser, BaseException, Namespace, RuntimeError, capture_revision(), choose_origin(), classify_cli_diagnostic(), configure_sync_worker() (+28 more)

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

### Community 66 - "test_events.py"
Cohesion: 0.24
Nodes (8): requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., Verify Event and Location identity rules., TestGetEvent, TestIdentity, TestListEvents

### Community 69 - "test_contract.py"
Cohesion: 0.16
Nodes (12): _build_validator(), _load_spec(), Any, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec., Validate real API responses against the OpenAPI contract schema. (+4 more)

### Community 70 - "concierge_tools.py"
Cohesion: 0.29
Nodes (8): get_current_event(), Any, The two bounded, read-only Event data operations used by the concierge., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden., search_current_events(), get_freshness(), Report the latest successful Snapshot and failed-attempt evidence.

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Revision 0003 must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "env.py"
Cohesion: 0.23
Nodes (11): do_run_migrations(), get_url(), Alembic environment configuration for async SQLAlchemy., Return the database URL from application settings., Run migrations in offline mode (emit SQL without connecting)., Execute migrations against the provided connection., Run migrations in online mode with an async engine., Run migrations in online mode. (+3 more)

### Community 74 - "Any"
Cohesion: 0.16
Nodes (10): EventSource, _optional_text(), Any, Response, POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., Normalize an optional source string or reject an unsupported shape. (+2 more)

### Community 75 - "CurrentEvent"
Cohesion: 0.13
Nodes (25): CurrentEvent, EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., One Event in the latest complete successful source Snapshot., Secret-free operational evidence for one attempted synchronization. (+17 more)

### Community 76 - "test_event_provenance.py"
Cohesion: 0.33
Nodes (8): parametrize, requires_docker, Issue #13 executable gates for single-Event provenance., _source_row(), test_free_status_is_never_inferred_from_silence_or_ambiguous_text(), test_missing_source_facts_are_absent_not_negative_claims(), test_positive_source_language_sets_only_positive_derived_flags(), test_single_event_returns_complete_provenance_and_preserves_raw_source()

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 79 - "_normalize_socrata_url"
Cohesion: 0.50
Nodes (4): _derive_registration(), _normalize_socrata_url(), Normalize a Socrata URL string or object without changing the raw row., Derive registration status and provenance from source fields.

### Community 80 - "filters.ts"
Cohesion: 0.19
Nodes (14): event, FilterChips(), FilterChipsProps, GROUPS, applyEventFilters(), dateRange(), EMPTY_FILTERS, FILTER_KEYS (+6 more)

### Community 81 - "EventExplorer"
Cohesion: 0.15
Nodes (13): EventExplorer(), changeFilters(), restoreFilters(), eventsPath(), formatSyncTime(), mergeWithoutDuplicates(), describeFilters(), filterLabel() (+5 more)

### Community 82 - "events/route.ts"
Cohesion: 0.27
Nodes (8): dynamic, GET(), emptyPage, { getFilteredEvents }, getFilteredEvents(), isAllowedValue(), valueFor(), parseStrictFilterSearchParams()

### Community 83 - "filter-state.spec.ts"
Cohesion: 0.25
Nodes (3): AuditedPage, FilterKey, fixtureEvent

### Community 84 - "EventCard.tsx"
Cohesion: 0.53
Nodes (5): costBadgeClass(), costLabel(), EventCard(), EventCardProps, ParkEvent

### Community 85 - "shell.spec.ts"
Cohesion: 0.40
Nodes (3): AuditedPage, firstPage, nextEvent

### Community 86 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

## Knowledge Gaps
- **193 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getFilteredEvents }`, `emptyPage`, `dynamic` (+188 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sync_events()` connect `SocrataError` to `SocrataClient`, `concierge_tools.py`, `Any`, `CurrentEvent`, `socrata.py`, `get_session_factory`, `railway_release.py`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `load_fixture()` connect `load_fixture` to `test_events.py`, `test_contract.py`, `concierge_tools.py`, `SocrataClient`, `CurrentEvent`, `parse_event`, `SocrataError`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `test_events.py`, `concierge_tools.py`, `load_fixture`, `test_event_provenance.py`, `socrata.py`, `SocrataError`, `get_session_factory`, `events.py`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getFilteredEvents }` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `EventExplorer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._