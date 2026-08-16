# Graph Report - nyc-events-backend  (2026-08-16)

## Corpus Check
- 135 files · ~95,083 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1137 nodes · 2127 edges · 101 communities (80 shown, 21 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 143 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a18f2620`
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
- CurrentEvent
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
- test_interests_matches.py
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
- TestIngestionWithDb
- nyc-events-backend
- TestParseEvent
- SavedEvent
- filter-state.spec.ts
- sync_events
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
- load_fixture
- EventDetail.tsx
- start.sh
- BackendContainerSmokeTests
- 0004_event_lifecycle.py
- Issue #15 backend handoff
- preferences.py
- test_migrations.py
- SocrataError
- test_contract.py
- filters.ts
- test_events.py
- Issue #13 backend handoff
- DateStrip.tsx
- event-detail.spec.ts
- get_settings
- get_session_factory
- parse_event
- freshness-status.spec.ts
- profiles.py
- Issue #21 backend handoff
- Trust and system states
- components.test.tsx
- Issue #19 backend handoff
- ingest_rows
- events/route.ts
- accessibility_evidence
- test_event_provenance.py
- TestCurrentPipelineContract
- BottomNav.tsx
- shell.spec.ts
- socrata.py
- Application shell
- services/__init__.py

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 67 edges
2. `ingest_rows()` - 47 edges
3. `CurrentEvent` - 36 edges
4. `get_session_factory()` - 33 edges
5. `parse_event()` - 30 edges
6. `EventRepository` - 24 edges
7. `SocrataError` - 24 edges
8. `WorkflowPolicyTests` - 24 edges
9. `_event_to_contract()` - 23 edges
10. `SocrataClient` - 23 edges

## Surprising Connections (you probably didn't know these)
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `_event_to_contract()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `list_event_changes()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `list_matches()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/preferences.py → backend/app/models/event.py
- `list_saved_events()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/profiles.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (101 total, 21 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "EventExplorer.tsx"
Cohesion: 0.11
Nodes (19): EventExplorer(), changeFilters(), restoreFilters(), EventExplorerProps, eventsPath(), mergeWithoutDuplicates(), FilterChips(), boroughs (+11 more)

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
Nodes (31): AsyncClient, CredentialFilter, Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., Prevent credential values from appearing in log output., SocrataClient, AlwaysErrorTransport, MockTransport (+23 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "CurrentEvent"
Cohesion: 0.10
Nodes (39): get_current_event(), Any, The two bounded, read-only Event data operations used by the concierge., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden., search_current_events(), CurrentEvent, One Event in the latest complete successful source Snapshot. (+31 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "test_interests_matches.py"
Cohesion: 0.13
Nodes (39): Interest, MatchedEvent, PreferenceAudit, Anonymous Profile and Saved Event persistence models., Secret-free evidence for one approved concierge preference write., One durable Facet followed by a Profile., An automatic Event suggestion kept separate from Saved Events., apply_concierge_preference() (+31 more)

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
Cohesion: 0.12
Nodes (24): dynamic, GET(), { getEvent, EventsApiError }, dynamic, GET(), event, apiBaseUrl(), ApiEventsResponse (+16 more)

### Community 38 - "TestIngestionWithDb"
Cohesion: 0.12
Nodes (8): requires_docker, A malformed row must not leave a partially ingested Snapshot., Verify atomic current Snapshot replacement and archival retention., All events from snapshot_a must be stored in the database., A live Socrata URL object must ingest and retain its raw shape., Ingesting snapshot_b after snapshot_a must add 1 new event and update 1 changed…, Duplicate guid must update, not create a second row., TestIngestionWithDb

### Community 45 - "TestParseEvent"
Cohesion: 0.10
Nodes (11): Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats., Pipe-delimited categories must be split into a list., Registration not required.' maps to not_required., The live Socrata URL object must imply registration and stay raw. (+3 more)

### Community 46 - "SavedEvent"
Cohesion: 0.29
Nodes (13): Profile, Anonymous-first application state keyed by a device-token digest., An Event deliberately kept by one Profile., SavedEvent, _headers(), requires_docker, Issue #19 API, persistence, migration, and security gates., test_browser_preflight_allows_only_the_profile_write_contract() (+5 more)

### Community 47 - "filter-state.spec.ts"
Cohesion: 0.25
Nodes (3): AuditedPage, FilterKey, fixtureEvent

### Community 48 - "sync_events"
Cohesion: 0.14
Nodes (16): EventSource, ingest_events(), AsyncSession, Atomically archive a valid Snapshot and replace the current dataset., Fetch and store one complete Snapshot with durable attempt evidence., The narrow transport contract used by the synchronization job., sync_events(), _main() (+8 more)

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
Cohesion: 0.26
Nodes (11): _check_docker(), client(), db_session(), _maybe_start_postgres(), postgres_url(), fixture, Test fixtures using Testcontainers for real Postgres., Return the async Postgres URL (skips if Docker unavailable). (+3 more)

### Community 56 - "railway_release.py"
Cohesion: 0.08
Nodes (50): ArgumentParser, BaseException, derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any (+42 more)

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

### Community 65 - "load_fixture"
Cohesion: 0.17
Nodes (8): load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., parametrize, requires_docker, Issue #11 API gates for composable Event facet filters., Exercise filters through GET /events against real PostgreSQL., TestEventFacetFilters

### Community 66 - "EventDetail.tsx"
Cohesion: 0.09
Nodes (27): EventDetail(), load(), EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance() (+19 more)

### Community 69 - "0004_event_lifecycle.py"
Cohesion: 0.50
Nodes (3): _content_hash(), Any, upgrade()

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 71 - "preferences.py"
Cohesion: 0.13
Nodes (30): dismiss_match(), follow_interest(), _interest_contract(), InterestRequest, list_interests(), list_matches(), promote_match(), Any (+22 more)

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "SocrataError"
Cohesion: 0.17
Nodes (13): Raised when the Socrata API returns an unrecoverable error., Allow only the fixed NYC Open Data HTTPS query origin., SocrataError, _validated_endpoint(), BlockingSource, FailedSource, FixtureSource, requires_docker (+5 more)

### Community 74 - "test_contract.py"
Cohesion: 0.16
Nodes (12): _build_validator(), _load_spec(), Any, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec., Validate real API responses against the OpenAPI contract schema. (+4 more)

### Community 75 - "filters.ts"
Cohesion: 0.20
Nodes (14): FilterChipsProps, GROUPS, applyEventFilters(), dateRange(), describeFilters(), EMPTY_FILTERS, FILTER_KEYS, FILTER_OPTIONS (+6 more)

### Community 76 - "test_events.py"
Cohesion: 0.14
Nodes (8): requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., Verify Event and Location identity rules., TestGetEvent, TestIdentity, TestListEvents

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 80 - "get_settings"
Cohesion: 0.12
Nodes (20): get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, do_run_migrations(), get_url(), Alembic environment configuration for async SQLAlchemy. (+12 more)

### Community 81 - "get_session_factory"
Cohesion: 0.15
Nodes (19): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., get_profile(), list_saved_events(), _profile_contract(), Any (+11 more)

### Community 82 - "parse_event"
Cohesion: 0.08
Nodes (29): _content_hash(), _derive_borough(), _derive_registration(), _is_explicitly_cancelled(), _location_key(), _normalize_socrata_url(), _optional_text(), _parse_categories() (+21 more)

### Community 83 - "freshness-status.spec.ts"
Cohesion: 0.33
Nodes (3): AuditedPage, lifecycleEvents, sourceEvents

### Community 84 - "profiles.py"
Cohesion: 0.12
Nodes (21): AsyncEngine, get_engine(), Async SQLAlchemy engine and session factory., Return a singleton async engine., Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), deployment_revision(), health_check() (+13 more)

### Community 85 - "Issue #21 backend handoff"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Commands and results, Issue #21 backend handoff, Ordered next actions, Ownership, Required phases, State

### Community 86 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

### Community 87 - "components.test.tsx"
Cohesion: 0.26
Nodes (9): event, costBadgeClass(), costLabel(), EventCard(), EventCardProps, ListMapToggle(), ListMapToggleProps, View (+1 more)

### Community 88 - "Issue #19 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #19 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 89 - "ingest_rows"
Cohesion: 0.38
Nodes (11): ingest_rows(), Parse raw Socrata rows and merge them into the database. This is the shared…, _changes(), requires_docker, Issue #16 executable API gates for Event lifecycle classification., test_absence_is_expired_or_removed_and_never_cancelled(), test_committed_snapshots_classify_new_changed_and_unchanged_through_api(), test_content_hash_is_stable_for_key_order_and_changes_with_content() (+3 more)

### Community 90 - "events/route.ts"
Cohesion: 0.27
Nodes (8): dynamic, GET(), emptyPage, { getFilteredEvents }, getFilteredEvents(), isAllowedValue(), valueFor(), parseStrictFilterSearchParams()

### Community 91 - "accessibility_evidence"
Cohesion: 0.33
Nodes (8): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts()

### Community 92 - "test_event_provenance.py"
Cohesion: 0.33
Nodes (8): parametrize, requires_docker, Issue #13 executable gates for single-Event provenance., _source_row(), test_free_status_is_never_inferred_from_silence_or_ambiguous_text(), test_missing_source_facts_are_absent_not_negative_claims(), test_positive_source_language_sets_only_positive_derived_flags(), test_single_event_returns_complete_provenance_and_preserves_raw_source()

### Community 93 - "TestCurrentPipelineContract"
Cohesion: 0.13
Nodes (11): CurrentEventSearch, BaseModel, Validated search inputs with a hard result bound., Any, AsyncSession, Return the current row count and the API's deterministic first guid., snapshot_evidence(), FixtureSource (+3 more)

### Community 94 - "BottomNav.tsx"
Cohesion: 0.32
Nodes (5): BottomNav(), DesktopSidebar(), coreNavItems, NavItem, sidebarNavItems

### Community 96 - "shell.spec.ts"
Cohesion: 0.40
Nodes (3): AuditedPage, firstPage, nextEvent

### Community 97 - "socrata.py"
Cohesion: 0.14
Nodes (19): EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., Secret-free operational evidence for one attempted synchronization., SyncRun, Base (+11 more)

### Community 100 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

## Knowledge Gaps
- **235 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+230 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `socrata.py`, `SocrataClient`, `TestIngestionWithDb`, `CurrentEvent`, `SocrataError`, `test_contract.py`, `test_events.py`, `TestParseEvent`, `SavedEvent`, `sync_events`, `test_interests_matches.py`, `conftest.py`, `ingest_rows`, `TestCurrentPipelineContract`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `get_current_event()` connect `CurrentEvent` to `railway_release.py`, `get_session_factory`, `socrata.py`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `socrata.py`, `TestIngestionWithDb`, `SocrataError`, `test_events.py`, `sync_events`, `get_session_factory`, `test_interests_matches.py`, `profiles.py`, `conftest.py`, `test_event_provenance.py`, `TestCurrentPipelineContract`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 19 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _235 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `EventExplorer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11083743842364532 - nodes in this community are weakly interconnected._