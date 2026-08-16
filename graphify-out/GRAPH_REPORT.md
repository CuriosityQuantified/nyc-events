# Graph Report - nyc-events  (2026-08-16)

## Corpus Check
- 159 files · ~105,122 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1290 nodes · 2483 edges · 107 communities (87 shown, 20 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 152 edges (avg confidence: 0.56)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1f66decb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- BottomNav.tsx
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
- preferences.py
- EventMatch NYC API contract
- compilerOptions
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- devDependencies
- Issue #16 backend handoff
- TestHealthEndpoint
- frontend/README.md
- SavedProvider.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- events.ts
- ingest_rows
- nyc-events-backend
- parse_event
- Interest
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
- conftest.py
- EventDetail.tsx
- start.sh
- BackendContainerSmokeTests
- 0004_event_lifecycle.py
- Issue #15 backend handoff
- Trust and system states
- test_migrations.py
- database.py
- socrata.py
- TrustStatus.tsx
- EventExplorer.tsx
- Issue #13 backend handoff
- DateStrip.tsx
- EventExplorer
- test_contract.py
- test_event_lifecycle.py
- load_fixture
- apiToUiEvent
- Issue #26 frontend handoff
- test_events.py
- get_session_factory
- maps.ts
- Issue #19 backend handoff
- Issue #21 backend handoff
- events/route.ts
- SavedView.tsx
- Base
- services/__init__.py
- test_interests_matches.py
- saved/[guid]/route.ts
- test_profiles.py
- SavedCalendar.tsx
- filter-state.spec.ts
- maps.spec.ts
- events/[guid]/route.ts
- EventSource
- saved.spec.ts
- Initial MVP scope

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 70 edges
2. `ingest_rows()` - 50 edges
3. `CurrentEvent` - 39 edges
4. `get_session_factory()` - 33 edges
5. `parse_event()` - 30 edges
6. `_event_to_contract()` - 27 edges
7. `EventRepository` - 26 edges
8. `SocrataError` - 24 edges
9. `WorkflowPolicyTests` - 24 edges
10. `SocrataClient` - 23 edges

## Surprising Connections (you probably didn't know these)
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `TestCurrentPipelineContract` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `_event_to_contract()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `list_event_changes()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `list_matches()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/preferences.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (107 total, 20 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "BottomNav.tsx"
Cohesion: 0.32
Nodes (5): BottomNav(), DesktopSidebar(), coreNavItems, NavItem, sidebarNavItems

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
Cohesion: 0.06
Nodes (68): CurrentEventSearch, get_current_event(), Any, BaseModel, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden. (+60 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "preferences.py"
Cohesion: 0.12
Nodes (32): _event_date_expression(), Return the canonical New York calendar date SQL expression., dismiss_match(), follow_interest(), _interest_contract(), InterestRequest, list_interests(), list_matches() (+24 more)

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
Cohesion: 0.40
Nodes (4): Deploy on Vercel, Getting Started, Learn More, Map configuration

### Community 29 - "SavedProvider.tsx"
Cohesion: 0.20
Nodes (12): chronological(), SavedContext, SavedContextValue, SavedProvider(), generateToken(), getDeviceToken(), fetchSavedEvents(), headers() (+4 more)

### Community 34 - "events.ts"
Cohesion: 0.19
Nodes (17): dynamic, GET(), ApiEventsResponse, apiFetch(), ApiFreshness, EVENT_LIFECYCLE_STATUSES, EventPage, FACT_FIELDS (+9 more)

### Community 38 - "ingest_rows"
Cohesion: 0.14
Nodes (11): ingest_rows(), Any, Parse raw Socrata rows and merge them into the database. This is the shared…, requires_docker, A malformed row must not leave a partially ingested Snapshot., Verify atomic current Snapshot replacement and archival retention., All events from snapshot_a must be stored in the database., A live Socrata URL object must ingest and retain its raw shape. (+3 more)

### Community 45 - "parse_event"
Cohesion: 0.07
Nodes (31): _derive_borough(), _location_key(), _parse_categories(), _parse_coordinates(), _parse_date(), parse_event(), Convert MM/DD/YYYY to ISO date string, or return None., Parse coordinate string into (lat, lon, coordinate_list). Returns the first… (+23 more)

### Community 46 - "Interest"
Cohesion: 0.19
Nodes (21): Interest, Anonymous Profile and Saved Event persistence models., One durable Facet followed by a Profile., apply_concierge_preference(), _event_matches_interest(), match_new_events(), _normalize_preference(), PreferenceValidationError (+13 more)

### Community 47 - "test_sync_worker.py"
Cohesion: 0.11
Nodes (26): get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, Secret-free operational evidence for one attempted synchronization., SyncRun, _main() (+18 more)

### Community 48 - "test_pipeline_contract.py"
Cohesion: 0.12
Nodes (13): AsyncSession, Fetch and store one complete Snapshot with durable attempt evidence., sync_events(), Any, AsyncSession, Return the current row count and the API's deterministic first guid., snapshot_evidence(), FixtureSource (+5 more)

### Community 51 - "EventMatch NYC — Initial Frontend Direction"
Cohesion: 0.18
Nodes (9): Accessibility baseline, Application shell, Consensus basis, Consensus summary, Desktop, EventMatch NYC — Initial Frontend Direction, Mobile, Product definition (+1 more)

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
Cohesion: 0.17
Nodes (23): RFC-5545, AddToCalendar(), basicDate(), basicDateTime(), buildIcs(), descriptionParts(), escapeIcsText(), eventSchedule (+15 more)

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

### Community 65 - "conftest.py"
Cohesion: 0.19
Nodes (15): MatchedEvent, Profile, Anonymous-first application state keyed by a device-token digest., An automatic Event suggestion kept separate from Saved Events., _check_docker(), client(), db_session(), _maybe_start_postgres() (+7 more)

### Community 66 - "EventDetail.tsx"
Cohesion: 0.14
Nodes (15): EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance(), PresentedFact, presentFact() (+7 more)

### Community 69 - "0004_event_lifecycle.py"
Cohesion: 0.50
Nodes (3): _content_hash(), Any, upgrade()

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 71 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "database.py"
Cohesion: 0.14
Nodes (18): AsyncEngine, get_engine(), Async SQLAlchemy engine and session factory., Return a singleton async engine., Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), deployment_revision(), health_check() (+10 more)

### Community 74 - "socrata.py"
Cohesion: 0.08
Nodes (36): EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., _content_hash(), _derive_registration(), ingest_events() (+28 more)

### Community 75 - "TrustStatus.tsx"
Cohesion: 0.24
Nodes (10): COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime(), FreshnessBanner(), FreshnessBannerProps, STATUS_COPY, current (+2 more)

### Community 76 - "EventExplorer.tsx"
Cohesion: 0.12
Nodes (22): event, routerPush, EventExplorerProps, FilterChips(), FilterChipsProps, GROUPS, ListMapToggle(), ListMapToggleProps (+14 more)

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 79 - "EventExplorer"
Cohesion: 0.17
Nodes (11): EventExplorer(), changeFilters(), restoreFilters(), eventsPath(), mergeWithoutDuplicates(), parseFilterSearchParams(), writeFilterSearchParams(), EventDetailPageProps (+3 more)

### Community 80 - "test_contract.py"
Cohesion: 0.18
Nodes (10): _build_validator(), Draft202012Validator, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Build a JSON Schema validator for a given $ref in the OpenAPI spec., Validate real API responses against the OpenAPI contract schema., GET /events response must validate against EventListResponse., GET /events/{guid} response must validate against Event. (+2 more)

### Community 81 - "test_event_lifecycle.py"
Cohesion: 0.40
Nodes (9): _changes(), requires_docker, Issue #16 executable API gates for Event lifecycle classification., test_absence_is_expired_or_removed_and_never_cancelled(), test_committed_snapshots_classify_new_changed_and_unchanged_through_api(), test_content_hash_is_stable_for_key_order_and_changes_with_content(), test_explicit_cancellation_surfaces_without_word_inference(), test_generated_api_schema_documents_lifecycle_contract() (+1 more)

### Community 82 - "load_fixture"
Cohesion: 0.19
Nodes (7): load_fixture(), Load a JSON fixture file by name from the fixtures directory., parametrize, requires_docker, Issue #11 API gates for composable Event facet filters., Exercise filters through GET /events against real PostgreSQL., TestEventFacetFilters

### Community 83 - "apiToUiEvent"
Cohesion: 0.10
Nodes (12): apiToUiEvent(), formatDate(), formatTime(), safeOfficialUrl(), AuditedPage, listEvent, AuditedPage, lifecycleEvents (+4 more)

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "test_events.py"
Cohesion: 0.14
Nodes (8): requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., Verify Event and Location identity rules., TestGetEvent, TestIdentity, TestListEvents

### Community 86 - "get_session_factory"
Cohesion: 0.13
Nodes (24): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., An Event deliberately kept by one Profile., SavedEvent, get_profile(), list_saved_events() (+16 more)

### Community 87 - "maps.ts"
Cohesion: 0.11
Nodes (26): ALLOWED_PARAMS, dynamic, errorResponse(), GET(), event, { getEvent, EventsApiError }, VARIANTS, EventMap() (+18 more)

### Community 88 - "Issue #19 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #19 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 89 - "Issue #21 backend handoff"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Commands and results, Issue #21 backend handoff, Ordered next actions, Ownership, Required phases, State

### Community 90 - "events/route.ts"
Cohesion: 0.28
Nodes (7): dynamic, GET(), emptyPage, { getFilteredEvents }, isAllowedValue(), valueFor(), parseStrictFilterSearchParams()

### Community 92 - "SavedView.tsx"
Cohesion: 0.17
Nodes (13): costBadgeClass(), costLabel(), EventCard(), EventCardProps, boroughs, Header(), isMonthKey(), useSaved() (+5 more)

### Community 93 - "Base"
Cohesion: 0.15
Nodes (15): Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., do_run_migrations(), get_url(), Alembic environment configuration for async SQLAlchemy., Return the database URL from application settings., Run migrations in offline mode (emit SQL without connecting). (+7 more)

### Community 96 - "test_interests_matches.py"
Cohesion: 0.24
Nodes (16): PreferenceAudit, Secret-free evidence for one approved concierge preference write., PreferenceConflictError, Raised when an idempotency key is replayed with different input., _headers(), parametrize, requires_docker, Issue #21 Interest, Match, preference, migration, and security gates. (+8 more)

### Community 97 - "saved/[guid]/route.ts"
Cohesion: 0.24
Nodes (13): badGuid(), badToken(), DELETE(), dynamic, PUT(), RouteContext, dynamic, GET() (+5 more)

### Community 99 - "test_profiles.py"
Cohesion: 0.40
Nodes (9): _headers(), requires_docker, Issue #19 API, persistence, migration, and security gates., test_browser_preflight_allows_only_the_profile_write_contract(), test_profile_api_rejects_bad_tokens_and_unknown_events(), test_profile_is_created_anonymously_and_keyed_by_hashed_device_token(), test_profile_schema_is_anonymous_by_default_and_collects_no_contact_data(), test_save_list_and_unsave_are_idempotent_and_isolated_by_profile() (+1 more)

### Community 100 - "SavedCalendar.tsx"
Cohesion: 0.33
Nodes (8): dayLabel(), MonthKey, monthKeyOf(), monthLabel(), SavedCalendar(), SavedCalendarProps, shiftMonth(), WEEKDAYS

### Community 101 - "filter-state.spec.ts"
Cohesion: 0.25
Nodes (3): AuditedPage, FilterKey, fixtureEvent

### Community 102 - "maps.spec.ts"
Cohesion: 0.25
Nodes (6): AuditedPage, events, invalid, multiple, shared, source

### Community 103 - "events/[guid]/route.ts"
Cohesion: 0.33
Nodes (4): dynamic, GET(), { getEvent, EventsApiError }, EventsApiError

### Community 104 - "EventSource"
Cohesion: 0.50
Nodes (3): EventSource, The narrow transport contract used by the synchronization job., Protocol

### Community 106 - "Initial MVP scope"
Cohesion: 0.67
Nodes (3): Defer, Include, Initial MVP scope

## Knowledge Gaps
- **276 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+271 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_current_event()` connect `CurrentEvent` to `railway_release.py`, `test_pipeline_contract.py`, `get_session_factory`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `load_fixture()` connect `load_fixture` to `test_interests_matches.py`, `conftest.py`, `test_profiles.py`, `SocrataClient`, `ingest_rows`, `CurrentEvent`, `socrata.py`, `parse_event`, `test_sync_worker.py`, `test_contract.py`, `test_event_lifecycle.py`, `test_pipeline_contract.py`, `test_events.py`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `conftest.py`, `ingest_rows`, `database.py`, `socrata.py`, `parse_event`, `Interest`, `test_sync_worker.py`, `test_pipeline_contract.py`, `test_events.py`, `get_session_factory`, `Base`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _276 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `ContractMockTests` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._