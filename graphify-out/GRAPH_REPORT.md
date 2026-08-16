# Graph Report - nyc-events-concierge.ISdIVO  (2026-08-16)

## Corpus Check
- 177 files · ~113,108 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1467 nodes · 2878 edges · 125 communities (99 shown, 26 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 147 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3a175483`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- routes/concierge.py
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
- app/concierge.py
- nyc-events-backend
- parse_event
- EventExplorer
- SocrataError
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
- test_interests_matches.py
- EventDetail.tsx
- start.sh
- BackendContainerSmokeTests
- 0004_event_lifecycle.py
- Issue #15 backend handoff
- test_concierge.py
- test_migrations.py
- get_settings
- socrata.py
- SocrataClient
- filters.ts
- Issue #13 backend handoff
- DateStrip.tsx
- TrustStatus.tsx
- profiles.py
- test_profiles.py
- load_fixture
- apiToUiEvent
- Issue #26 frontend handoff
- test_contract.py
- conftest.py
- maps.ts
- Issue #19 backend handoff
- Issue #21 backend handoff
- preferences.ts
- SavedCalendar.tsx
- explore-interactions.spec.ts
- services/__init__.py
- CurrentEvent
- apiBaseUrl
- Any
- get_session_factory
- concierge_runtime.py
- validate_contract.py
- scripts
- ParkEvent
- saved.spec.ts
- EventExplorer.tsx
- Application shell
- SavedView.tsx
- maps.spec.ts
- accessibility_evidence
- profile.spec.ts
- dependencies
- ingest_rows
- CredentialFilter
- FollowFacets.tsx
- CurrentEventSearch
- .handle_async_request
- Trust and system states
- package.json
- eslint-config-next
- jsdom
- prettier
- @testing-library/react

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 73 edges
2. `ingest_rows()` - 53 edges
3. `CurrentEvent` - 42 edges
4. `get_session_factory()` - 39 edges
5. `parse_event()` - 30 edges
6. `_event_to_contract()` - 29 edges
7. `EventRepository` - 26 edges
8. `SocrataError` - 24 edges
9. `WorkflowPolicyTests` - 24 edges
10. `SocrataClient` - 23 edges

## Surprising Connections (you probably didn't know these)
- `resolve_save()` --uses--> `ConciergeContext`  [INFERRED]
  backend/app/routes/concierge.py → backend/app/concierge.py
- `send_message()` --uses--> `ConciergeContext`  [INFERRED]
  backend/app/routes/concierge.py → backend/app/concierge.py
- `search_current_events_tool()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/app/concierge.py → backend/app/services/current_event_search.py
- `save_event_tool()` --uses--> `EventNotCurrentError`  [INFERRED]
  backend/app/concierge.py → backend/app/services/saved_events.py
- `test_current_events_fallback_is_consistent_across_api_and_consumers()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_current_event_dates.py → backend/app/concierge_tools.py

## Import Cycles
- None detected.

## Communities (125 total, 26 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "routes/concierge.py"
Cohesion: 0.14
Nodes (28): _agent(), _assistant_text(), ConciergeDecisionRequest, ConciergeMessageRequest, ConciergeResponse, _config(), _profile_id(), Any (+20 more)

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
Cohesion: 0.10
Nodes (37): The two bounded, read-only Event data operations used by the concierge., _calendar_date_fact(), _date_fact(), _datetime_fact(), _derived_boolean_fact(), _event_date_expression(), _event_to_contract(), get_event() (+29 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "preferences.py"
Cohesion: 0.09
Nodes (31): AsyncEngine, get_engine(), Return a singleton async engine., deployment_revision(), health_check(), lifespan(), get, FastAPI application entry point. (+23 more)

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

### Community 29 - "SavedProvider.tsx"
Cohesion: 0.20
Nodes (12): chronological(), SavedContext, SavedContextValue, SavedProvider(), generateToken(), getDeviceToken(), fetchSavedEvents(), headers() (+4 more)

### Community 34 - "events.ts"
Cohesion: 0.13
Nodes (23): dynamic, GET(), { getEvent, EventsApiError }, dynamic, GET(), ApiEvent, ApiEventsResponse, apiFetch() (+15 more)

### Community 38 - "app/concierge.py"
Cohesion: 0.12
Nodes (23): create_concierge_agent(), create_default_concierge_agent(), enforce_concierge_tool_allowlist(), Any, BaseChatModel, date, Constrained LangChain Deep Agent for current Event discovery and saving., Save one current Event after the human approves this exact Event ID. (+15 more)

### Community 45 - "parse_event"
Cohesion: 0.10
Nodes (21): _parse_categories(), parse_event(), Split pipe-delimited categories into a list., Convert a Socrata row dict to Event model field values. Returns a dict suitable…, parametrize, requires_docker, Issue #13 executable gates for single-Event provenance., _source_row() (+13 more)

### Community 46 - "EventExplorer"
Cohesion: 0.16
Nodes (12): EventExplorer(), changeFilters(), restoreFilters(), eventsPath(), mergeWithoutDuplicates(), parseFilterSearchParams(), dateFor(), writeFilterSearchParams() (+4 more)

### Community 47 - "SocrataError"
Cohesion: 0.13
Nodes (16): Raised when the Socrata API returns an unrecoverable error., SocrataError, RuntimeError, Raised when another worker owns the distributed synchronization lock., SyncAlreadyRunning, BlockingSource, FailedSource, FixtureSource (+8 more)

### Community 48 - "test_pipeline_contract.py"
Cohesion: 0.11
Nodes (19): CurrentEventSearch, get_current_event(), Any, BaseModel, Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden., search_current_events() (+11 more)

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
Cohesion: 0.17
Nodes (23): RFC-5545, AddToCalendar(), basicDate(), basicDateTime(), buildIcs(), descriptionParts(), escapeIcsText(), eventSchedule (+15 more)

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

### Community 65 - "test_interests_matches.py"
Cohesion: 0.12
Nodes (41): Interest, MatchedEvent, PreferenceAudit, Anonymous Profile and Saved Event persistence models., Secret-free evidence for one approved concierge preference write., One durable Facet followed by a Profile., An automatic Event suggestion kept separate from Saved Events., apply_concierge_preference() (+33 more)

### Community 66 - "EventDetail.tsx"
Cohesion: 0.14
Nodes (16): EventDetail(), load(), EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance() (+8 more)

### Community 69 - "0004_event_lifecycle.py"
Cohesion: 0.50
Nodes (3): _content_hash(), Any, upgrade()

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 71 - "test_concierge.py"
Cohesion: 0.17
Nodes (17): ConciergeContext, Trusted identity injected by the server and hidden from the model., _agent(), Any, BaseChatModel, requires_docker, Deep Agent, SQL search, and human-approved Saved Event gates., Provider-free model that emits deterministic tool calls and records schemas. (+9 more)

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "get_settings"
Cohesion: 0.09
Nodes (28): get_settings(), BaseSettings, Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, Async SQLAlchemy engine and session factory., Dispose of the current engine. Use for testing or reconfiguration. (+20 more)

### Community 74 - "socrata.py"
Cohesion: 0.10
Nodes (23): _derive_borough(), ingest_events(), _is_explicitly_cancelled(), _location_key(), _missing_classification(), _parse_coordinates(), _parse_date(), _parse_datetime() (+15 more)

### Community 75 - "SocrataClient"
Cohesion: 0.11
Nodes (20): Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., SocrataClient, MockTransport, Transport-layer mock that intercepts httpx requests. Returns paginated…, parametrize, Tests for the Socrata client — pagination, retry, credential filtering, parsing., The client must raise after all retries are exhausted. (+12 more)

### Community 76 - "filters.ts"
Cohesion: 0.11
Nodes (24): dynamic, GET(), emptyPage, { getFilteredEvents }, FilterChips(), setExactDate(), FilterChipsProps, GROUPS (+16 more)

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 79 - "TrustStatus.tsx"
Cohesion: 0.24
Nodes (10): COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime(), FreshnessBanner(), FreshnessBannerProps, STATUS_COPY, current (+2 more)

### Community 80 - "profiles.py"
Cohesion: 0.11
Nodes (28): _database_unavailable(), get_profile(), list_saved_events(), _profile_contract(), Any, AsyncSession, delete, DeviceToken (+20 more)

### Community 81 - "test_profiles.py"
Cohesion: 0.33
Nodes (11): Profile, Anonymous-first application state keyed by a device-token digest., _headers(), requires_docker, Issue #19 API, persistence, migration, and security gates., test_browser_preflight_allows_only_the_profile_write_contract(), test_profile_api_rejects_bad_tokens_and_unknown_events(), test_profile_is_created_anonymously_and_keyed_by_hashed_device_token() (+3 more)

### Community 82 - "load_fixture"
Cohesion: 0.07
Nodes (19): load_fixture(), Load a JSON fixture file by name from the fixtures directory., requires_docker, test_date_filter_and_order_include_date_only_and_missing_rows(), parametrize, requires_docker, Issue #11 API gates for composable Event facet filters., Exercise filters through GET /events against real PostgreSQL. (+11 more)

### Community 83 - "apiToUiEvent"
Cohesion: 0.08
Nodes (13): apiToUiEvent(), formatDate(), formatTime(), AuditedPage, listEvent, AuditedPage, fixtureEvent, AuditedPage (+5 more)

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "test_contract.py"
Cohesion: 0.15
Nodes (13): _build_validator(), _load_spec(), Any, Draft202012Validator, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec. (+5 more)

### Community 86 - "conftest.py"
Cohesion: 0.15
Nodes (15): AlwaysErrorTransport, _check_docker(), client(), _maybe_start_postgres(), postgres_url(), fixture, Test fixtures using Testcontainers for real Postgres., Return the async Postgres URL (skips if Docker unavailable). (+7 more)

### Community 87 - "maps.ts"
Cohesion: 0.09
Nodes (30): ALLOWED_PARAMS, dynamic, errorResponse(), GET(), event, { getEvent, EventsApiError }, VARIANTS, escapeAttribute() (+22 more)

### Community 88 - "Issue #19 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #19 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 89 - "Issue #21 backend handoff"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Commands and results, Issue #21 backend handoff, Ordered next actions, Ownership, Required phases, State

### Community 90 - "preferences.ts"
Cohesion: 0.22
Nodes (12): MatchesSection(), FACET_TYPE_LABELS, ProfileView(), dismissMatch(), fetchInterests(), fetchMatches(), headers(), Interest (+4 more)

### Community 92 - "SavedCalendar.tsx"
Cohesion: 0.33
Nodes (8): dayLabel(), MonthKey, monthKeyOf(), monthLabel(), SavedCalendar(), SavedCalendarProps, shiftMonth(), WEEKDAYS

### Community 93 - "explore-interactions.spec.ts"
Cohesion: 0.29
Nodes (6): allEvents, base, eventsFor(), installRoutes(), manhattanEvent, queensEvent

### Community 96 - "CurrentEvent"
Cohesion: 0.12
Nodes (27): CurrentEvent, EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., One Event in the latest complete successful source Snapshot., Secret-free operational evidence for one attempted synchronization. (+19 more)

### Community 97 - "apiBaseUrl"
Cohesion: 0.14
Nodes (25): DELETE(), dynamic, badToken(), dynamic, FACET_TYPES, GET(), PUT(), badGuid() (+17 more)

### Community 99 - "Any"
Cohesion: 0.12
Nodes (16): _content_hash(), _derive_registration(), EventSource, _normalize_socrata_url(), _optional_text(), Any, Response, POST to the Socrata endpoint with exponential-backoff retry. (+8 more)

### Community 100 - "get_session_factory"
Cohesion: 0.14
Nodes (18): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., dismiss_match(), delete, Response, Idempotently stop following one Profile-owned Interest. (+10 more)

### Community 101 - "concierge_runtime.py"
Cohesion: 0.21
Nodes (11): ConciergeSettings, get_concierge_settings(), BaseSettings, Concierge-specific environment configuration., Settings that are required only when the concierge is enabled., concierge_runtime(), _psycopg_url(), Any (+3 more)

### Community 102 - "validate_contract.py"
Cohesion: 0.37
Nodes (12): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+4 more)

### Community 103 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format:check, lint, pretest, start, test (+5 more)

### Community 104 - "ParkEvent"
Cohesion: 0.29
Nodes (9): event, routerPush, costBadgeClass(), costLabel(), EventCard(), EventCardProps, useSaved(), SaveHeart() (+1 more)

### Community 106 - "EventExplorer.tsx"
Cohesion: 0.23
Nodes (8): EventExplorerProps, boroughs, Header(), ListMapToggle(), ListMapToggleProps, View, SearchBar(), EventPage

### Community 107 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 108 - "SavedView.tsx"
Cohesion: 0.19
Nodes (9): BottomNav(), DesktopSidebar(), isMonthKey(), newYorkToday(), SavedView(), coreNavItems, NavItem, sidebarNavItems (+1 more)

### Community 109 - "maps.spec.ts"
Cohesion: 0.20
Nodes (8): AuditedPage, events, invalid, multiple, shared, source, TILE_PNG, unlocatable

### Community 110 - "accessibility_evidence"
Cohesion: 0.33
Nodes (8): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts()

### Community 112 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, leaflet, next, react, react-dom, @types/leaflet, leaflet, next (+3 more)

### Community 113 - "ingest_rows"
Cohesion: 0.14
Nodes (11): ingest_rows(), Any, Parse raw Socrata rows and merge them into the database. This is the shared…, requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., Verify Event and Location identity rules. (+3 more)

### Community 114 - "CredentialFilter"
Cohesion: 0.33
Nodes (4): AsyncClient, CredentialFilter, Prevent credential values from appearing in log output., LogRecord

### Community 115 - "FollowFacets.tsx"
Cohesion: 0.43
Nodes (6): Followable, followableFacets(), FollowFacets(), filterLabel(), FacetType, followInterest()

### Community 116 - "CurrentEventSearch"
Cohesion: 0.40
Nodes (4): CurrentEventSearch, BaseModel, Structured, bounded search over the latest ``current_events`` Snapshot., model_validator

### Community 118 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

### Community 119 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **294 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+289 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `CurrentEvent`, `test_interests_matches.py`, `test_event_lifecycle.py`, `test_concierge.py`, `get_settings`, `SocrataClient`, `parse_event`, `SocrataError`, `test_pipeline_contract.py`, `ingest_rows`, `test_profiles.py`, `test_contract.py`, `conftest.py`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `get_session_factory()` connect `get_session_factory` to `CurrentEvent`, `routes/concierge.py`, `test_interests_matches.py`, `app/concierge.py`, `events.py`, `get_settings`, `test_pipeline_contract.py`, `profiles.py`, `preferences.py`, `conftest.py`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `test_interests_matches.py`, `get_session_factory`, `events.py`, `get_settings`, `socrata.py`, `parse_event`, `SocrataError`, `test_pipeline_contract.py`, `profiles.py`, `load_fixture`, `ingest_rows`, `conftest.py`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _294 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `routes/concierge.py` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._