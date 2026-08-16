# Graph Report - nyc-events-composite  (2026-08-16)

## Corpus Check
- 172 files · ~111,505 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1384 nodes · 2714 edges · 126 communities (101 shown, 25 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 160 edges (avg confidence: 0.56)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3a175483`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- ingest_rows
- Core screens
- NYC Events — Handoff Document
- ContractMockTests
- test_event_lifecycle.py
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
- get_session_factory
- EventMatch NYC API contract
- compilerOptions
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- devDependencies
- Issue #16 backend handoff
- TestHealthEndpoint
- frontend/README.md
- CurrentEvent
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- events.ts
- conftest.py
- nyc-events-backend
- parse_event
- EventExplorer
- test_sync_worker.py
- test_pipeline_contract.py
- EventMatch NYC — Initial Frontend Direction
- 0003_current_repository_sync_runs.py
- 2. Results explorer
- 8. Desired user-facing features
- calendar-export.ts
- railway_release.py
- WorkflowPolicyTests
- tsconfig.tests.json
- api-contract.test.ts
- CI/CD extension matrix
- revision/route.ts
- backend_container_smoke.sh
- 3. Map view
- preferences.py
- EventDetail.tsx
- start.sh
- BackendContainerSmokeTests
- 0004_event_lifecycle.py
- Issue #15 backend handoff
- thumbnail/route.ts
- test_migrations.py
- main.py
- socrata.py
- SocrataClient
- filters.ts
- Issue #13 backend handoff
- DateStrip.tsx
- EventCard.tsx
- profiles.py
- test_profiles.py
- load_fixture
- apiToUiEvent
- Issue #26 frontend handoff
- test_contract.py
- client
- ParkEvent
- Issue #19 backend handoff
- Issue #21 backend handoff
- preferences.ts
- test_current_event_dates.py
- explore-interactions.spec.ts
- services/__init__.py
- database.py
- apiBaseUrl
- InterestRequest
- Trust and system states
- test_ingestion.py
- env.py
- scripts
- _event_date_expression
- saved.spec.ts
- SocrataError
- Application shell
- EventExplorer.tsx
- maps.spec.ts
- accessibility_evidence
- profile.spec.ts
- dependencies
- test_events.py
- events/route.ts
- get_settings
- CredentialFilter
- sync_events
- test_composite_follow_persists_and_matches_with_and_semantics
- package.json
- eslint-config-next
- jsdom
- prettier
- @testing-library/react

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 72 edges
2. `ingest_rows()` - 52 edges
3. `CurrentEvent` - 42 edges
4. `get_session_factory()` - 33 edges
5. `parse_event()` - 30 edges
6. `_event_to_contract()` - 27 edges
7. `EventRepository` - 26 edges
8. `Interest` - 26 edges
9. `SocrataError` - 24 edges
10. `WorkflowPolicyTests` - 24 edges

## Surprising Connections (you probably didn't know these)
- `test_current_events_fallback_is_consistent_across_api_and_consumers()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_current_event_dates.py → backend/app/concierge_tools.py
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `search_current_events()` --uses--> `CurrentEvent`  [INFERRED]
  backend/app/concierge_tools.py → backend/app/models/event.py
- `get_current_event()` --uses--> `CurrentEvent`  [INFERRED]
  backend/app/concierge_tools.py → backend/app/models/event.py
- `_event_to_contract()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (126 total, 25 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "ingest_rows"
Cohesion: 0.16
Nodes (8): ingest_rows(), Any, Parse raw Socrata rows and merge them into the database. This is the shared…, parametrize, requires_docker, Issue #11 API gates for composable Event facet filters., Exercise filters through GET /events against real PostgreSQL., TestEventFacetFilters

### Community 2 - "Core screens"
Cohesion: 0.20
Nodes (10): 1. Discover, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens, Detail sections, Flow (+2 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.17
Nodes (12): 10. Future data integrations, 11. Completion criteria for the first implementation, 1. Project concept, 2. Local project path, 3. Primary data source, 4. Local API configuration, 5. SODA3 request pattern, 6. Required synchronization architecture (+4 more)

### Community 4 - "ContractMockTests"
Cohesion: 0.11
Nodes (13): BaseHTTPRequestHandler, ContractHandler, create_server(), fact_value(), filter_events(), load_json(), main(), parse_positive_int() (+5 more)

### Community 5 - "test_event_lifecycle.py"
Cohesion: 0.40
Nodes (9): _changes(), requires_docker, Issue #16 executable API gates for Event lifecycle classification., test_absence_is_expired_or_removed_and_never_cancelled(), test_committed_snapshots_classify_new_changed_and_unchanged_through_api(), test_content_hash_is_stable_for_key_order_and_changes_with_content(), test_explicit_cancellation_surfaces_without_word_inference(), test_generated_api_schema_documents_lifecycle_contract() (+1 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "events.py"
Cohesion: 0.15
Nodes (23): _calendar_date_fact(), _date_fact(), _datetime_fact(), _derived_boolean_fact(), _event_to_contract(), get_event(), Any, datetime (+15 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "get_session_factory"
Cohesion: 0.13
Nodes (25): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., dismiss_match(), follow_interest(), _interest_contract(), list_interests() (+17 more)

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
Cohesion: 0.12
Nodes (17): @axe-core/playwright, eslint, devDependencies, @axe-core/playwright, eslint, @playwright/test, @types/node, @types/react (+9 more)

### Community 26 - "Issue #16 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #16 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 27 - "TestHealthEndpoint"
Cohesion: 0.11
Nodes (11): requires_docker, Tests for the /health endpoint., Verify the health endpoint reports service status correctly., Return JSON with status, database, and Redis keys., With a real Postgres container, database must report connected., The integration gate requires both real backing services., Without a running Redis, the endpoint must return 503 and degraded status., Verify deployment cutover can identify the exact running revision. (+3 more)

### Community 28 - "frontend/README.md"
Cohesion: 0.40
Nodes (4): Deploy on Vercel, Getting Started, Learn More, Map configuration

### Community 29 - "CurrentEvent"
Cohesion: 0.21
Nodes (15): CurrentEvent, EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., One Event in the latest complete successful source Snapshot., _event_matches_interest() (+7 more)

### Community 34 - "events.ts"
Cohesion: 0.14
Nodes (21): dynamic, GET(), { getEvent, EventsApiError }, dynamic, GET(), event, ApiEventsResponse, apiFetch() (+13 more)

### Community 38 - "conftest.py"
Cohesion: 0.15
Nodes (31): Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., Interest, MatchedEvent, PreferenceAudit, Profile, Anonymous Profile and Saved Event persistence models. (+23 more)

### Community 45 - "parse_event"
Cohesion: 0.09
Nodes (23): _parse_coordinates(), parse_event(), Parse coordinate string into (lat, lon, coordinate_list). Returns the first…, Convert a Socrata row dict to Event model field values. Returns a dict suitable…, parametrize, requires_docker, Issue #13 executable gates for single-Event provenance., _source_row() (+15 more)

### Community 46 - "EventExplorer"
Cohesion: 0.15
Nodes (13): EventDetail(), load(), EventExplorer(), changeFilters(), restoreFilters(), eventsPath(), mergeWithoutDuplicates(), parseFilterSearchParams() (+5 more)

### Community 47 - "test_sync_worker.py"
Cohesion: 0.16
Nodes (16): Secret-free operational evidence for one attempted synchronization., SyncRun, RuntimeError, Raised when another worker owns the distributed synchronization lock., Run one locked Snapshot synchronization from the standalone worker., run(), SyncAlreadyRunning, BlockingSource (+8 more)

### Community 48 - "test_pipeline_contract.py"
Cohesion: 0.13
Nodes (16): CurrentEventSearch, get_current_event(), Any, BaseModel, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden. (+8 more)

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

### Community 55 - "calendar-export.ts"
Cohesion: 0.09
Nodes (35): RFC-5545, AddToCalendar(), dayLabel(), isMonthKey(), MonthKey, monthKeyOf(), monthLabel(), SavedCalendar() (+27 more)

### Community 56 - "railway_release.py"
Cohesion: 0.08
Nodes (49): ArgumentParser, BaseException, derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any (+41 more)

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

### Community 65 - "preferences.py"
Cohesion: 0.18
Nodes (23): Profile Interest, alert-preference, and Match API., apply_concierge_preference(), match_new_events(), _normalize_preference(), PreferenceConflictError, PreferenceValidationError, AsyncSession, Interest (+15 more)

### Community 66 - "EventDetail.tsx"
Cohesion: 0.15
Nodes (15): EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance(), PresentedFact, presentFact() (+7 more)

### Community 69 - "0004_event_lifecycle.py"
Cohesion: 0.50
Nodes (3): _content_hash(), Any, upgrade()

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 71 - "thumbnail/route.ts"
Cohesion: 0.24
Nodes (7): ALLOWED_PARAMS, dynamic, errorResponse(), GET(), event, { getEvent, EventsApiError }, VARIANTS

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "main.py"
Cohesion: 0.19
Nodes (13): AsyncEngine, get_engine(), Return a singleton async engine., deployment_revision(), health_check(), lifespan(), get, FastAPI application entry point. (+5 more)

### Community 74 - "socrata.py"
Cohesion: 0.09
Nodes (29): _content_hash(), _derive_borough(), _derive_registration(), ingest_events(), _is_explicitly_cancelled(), _location_key(), _missing_classification(), _normalize_socrata_url() (+21 more)

### Community 75 - "SocrataClient"
Cohesion: 0.11
Nodes (20): Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., SocrataClient, MockTransport, Transport-layer mock that intercepts httpx requests. Returns paginated…, parametrize, Tests for the Socrata client — pagination, retry, credential filtering, parsing., The client must raise after all retries are exhausted. (+12 more)

### Community 76 - "filters.ts"
Cohesion: 0.14
Nodes (19): FilterChips(), setExactDate(), FilterChipsProps, GROUPS, applyEventFilters(), dateRange(), describeFilters(), EMPTY_FILTERS (+11 more)

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 79 - "EventCard.tsx"
Cohesion: 0.18
Nodes (13): costBadgeClass(), costLabel(), EventCard(), EventCardProps, COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime() (+5 more)

### Community 80 - "profiles.py"
Cohesion: 0.14
Nodes (24): _database_unavailable(), _get_or_create_profile(), get_profile(), list_saved_events(), _profile_contract(), Any, AsyncSession, delete (+16 more)

### Community 81 - "test_profiles.py"
Cohesion: 0.40
Nodes (9): _headers(), requires_docker, Issue #19 API, persistence, migration, and security gates., test_browser_preflight_allows_only_the_profile_write_contract(), test_profile_api_rejects_bad_tokens_and_unknown_events(), test_profile_is_created_anonymously_and_keyed_by_hashed_device_token(), test_profile_schema_is_anonymous_by_default_and_collects_no_contact_data(), test_save_list_and_unsave_are_idempotent_and_isolated_by_profile() (+1 more)

### Community 82 - "load_fixture"
Cohesion: 0.15
Nodes (10): load_fixture(), Load a JSON fixture file by name from the fixtures directory., requires_docker, A malformed row must not leave a partially ingested Snapshot., Verify atomic current Snapshot replacement and archival retention., All events from snapshot_a must be stored in the database., A live Socrata URL object must ingest and retain its raw shape., Ingesting snapshot_b after snapshot_a must add 1 new event and update 1 changed… (+2 more)

### Community 83 - "apiToUiEvent"
Cohesion: 0.08
Nodes (14): apiToUiEvent(), formatDate(), formatTime(), safeOfficialUrl(), AuditedPage, listEvent, AuditedPage, fixtureEvent (+6 more)

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "test_contract.py"
Cohesion: 0.18
Nodes (10): _build_validator(), Draft202012Validator, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Build a JSON Schema validator for a given $ref in the OpenAPI spec., Validate real API responses against the OpenAPI contract schema., GET /events response must validate against EventListResponse., GET /events/{guid} response must validate against Event. (+2 more)

### Community 86 - "client"
Cohesion: 0.25
Nodes (9): AsyncClient, _check_docker(), client(), _maybe_start_postgres(), postgres_url(), fixture, Return the async Postgres URL (skips if Docker unavailable)., Provide an async test client for the FastAPI app. (+1 more)

### Community 87 - "ParkEvent"
Cohesion: 0.13
Nodes (24): escapeAttribute(), EventMap(), onCanvasClick(), onCanvasKeyDown(), selectFromMarker(), EventMapProps, markerLabel(), NYC_CENTER (+16 more)

### Community 88 - "Issue #19 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #19 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 89 - "Issue #21 backend handoff"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Commands and results, Issue #21 backend handoff, Ordered next actions, Ownership, Required phases, State

### Community 90 - "preferences.ts"
Cohesion: 0.08
Nodes (37): Followable, followableFacets(), FollowFacets(), boroughs, Header(), MatchesSection(), FACET_TYPE_LABELS, interestLabel() (+29 more)

### Community 92 - "test_current_event_dates.py"
Cohesion: 0.21
Nodes (16): _load_spec(), Any, Load the OpenAPI spec., _event(), _event_validator(), datetime, Draft202012Validator, parametrize (+8 more)

### Community 93 - "explore-interactions.spec.ts"
Cohesion: 0.29
Nodes (6): allEvents, base, eventsFor(), installRoutes(), manhattanEvent, queensEvent

### Community 96 - "database.py"
Cohesion: 0.17
Nodes (12): Application configuration via environment variables., Async SQLAlchemy engine and session factory., Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), _main(), Executable Socrata-to-Postgres synchronization command., _main(), Any (+4 more)

### Community 97 - "apiBaseUrl"
Cohesion: 0.13
Nodes (25): DELETE(), dynamic, badToken(), dynamic, FACET_TYPES, GET(), PUT(), badGuid() (+17 more)

### Community 99 - "InterestRequest"
Cohesion: 0.40
Nodes (5): FacetMember, InterestRequest, BaseModel, One Facet inside a combined Interest., One Facet — or a combination of Facets — and its alert preference.

### Community 100 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

### Community 101 - "test_ingestion.py"
Cohesion: 0.19
Nodes (8): AlwaysErrorTransport, Response, Transport that always returns the given error status code., Tests for event ingestion — snapshot deltas, guid identity, network isolation., Verify that transport-layer substitution prevents real network access., The Socrata client with an injected transport must not reach the network. The…, TestNetworkEnforcement, Request

### Community 102 - "env.py"
Cohesion: 0.23
Nodes (11): do_run_migrations(), get_url(), Alembic environment configuration for async SQLAlchemy., Return the database URL from application settings., Run migrations in offline mode (emit SQL without connecting)., Execute migrations against the provided connection., Run migrations in online mode with an async engine., Run migrations in online mode. (+3 more)

### Community 103 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format:check, lint, pretest, start, test (+5 more)

### Community 104 - "_event_date_expression"
Cohesion: 0.20
Nodes (10): _event_date_expression(), get_ingestion_health(), list_event_changes(), list_events(), get, Return a paginated list of events with optional filters., Expose latest Snapshot lifecycle classifications and content hashes., Expose secret-free evidence for the latest attempted synchronization. (+2 more)

### Community 106 - "SocrataError"
Cohesion: 0.22
Nodes (7): Response, POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., Raised when the Socrata API returns an unrecoverable error., SocrataError, Exception

### Community 107 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 108 - "EventExplorer.tsx"
Cohesion: 0.16
Nodes (13): BottomNav(), event, routerPush, DesktopSidebar(), EventExplorerProps, ListMapToggle(), ListMapToggleProps, View (+5 more)

### Community 109 - "maps.spec.ts"
Cohesion: 0.20
Nodes (8): AuditedPage, events, invalid, multiple, shared, source, TILE_PNG, unlocatable

### Community 110 - "accessibility_evidence"
Cohesion: 0.33
Nodes (8): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts()

### Community 112 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, leaflet, next, react, react-dom, @types/leaflet, leaflet, next (+3 more)

### Community 113 - "test_events.py"
Cohesion: 0.14
Nodes (8): requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., Verify Event and Location identity rules., TestGetEvent, TestIdentity, TestListEvents

### Community 114 - "events/route.ts"
Cohesion: 0.28
Nodes (7): dynamic, GET(), emptyPage, { getFilteredEvents }, isAllowedValue(), valueFor(), parseStrictFilterSearchParams()

### Community 115 - "get_settings"
Cohesion: 0.25
Nodes (8): get_settings(), Return a cached Settings instance., Settings loaded from environment variables., Settings, fixture, redis_client(), test_railway_uses_a_separate_scheduled_worker(), BaseSettings

### Community 116 - "CredentialFilter"
Cohesion: 0.29
Nodes (5): CredentialFilter, Prevent credential values from appearing in log output., Allow only the fixed NYC Open Data HTTPS query origin., _validated_endpoint(), LogRecord

### Community 117 - "sync_events"
Cohesion: 0.25
Nodes (6): EventSource, AsyncSession, Fetch and store one complete Snapshot with durable attempt evidence., The narrow transport contract used by the synchronization job., sync_events(), Protocol

### Community 118 - "test_composite_follow_persists_and_matches_with_and_semantics"
Cohesion: 0.67
Nodes (4): _headers(), requires_docker, test_composite_follow_persists_and_matches_with_and_semantics(), test_interest_request_requires_single_facet_or_combination()

### Community 119 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **295 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+290 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `ingest_rows`, `test_event_lifecycle.py`, `conftest.py`, `test_ingestion.py`, `SocrataClient`, `parse_event`, `test_sync_worker.py`, `test_pipeline_contract.py`, `test_events.py`, `test_profiles.py`, `test_contract.py`, `test_composite_follow_persists_and_matches_with_and_semantics`, `sync_events`, `test_current_event_dates.py`, `CurrentEvent`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `get_current_event()` connect `test_pipeline_contract.py` to `events.py`, `get_session_factory`, `railway_release.py`, `test_current_event_dates.py`, `CurrentEvent`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `database.py`, `preferences.py`, `test_ingestion.py`, `conftest.py`, `events.py`, `_event_date_expression`, `socrata.py`, `parse_event`, `test_sync_worker.py`, `test_pipeline_contract.py`, `profiles.py`, `test_events.py`, `load_fixture`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _295 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `ContractMockTests` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._