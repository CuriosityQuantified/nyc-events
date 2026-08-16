# Graph Report - nyc-events-concierge.ISdIVO  (2026-08-16)

## Corpus Check
- 177 files · ~113,857 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1473 nodes · 2894 edges · 120 communities (95 shown, 25 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1594c991`
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
- get_session_factory
- EventMatch NYC API contract
- compilerOptions
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- devDependencies
- Issue #16 backend handoff
- TestHealthEndpoint
- frontend/README.md
- test_current_event_dates.py
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- events.ts
- app/concierge.py
- nyc-events-backend
- TestParseEvent
- thumbnail/route.ts
- SocrataError
- preferences.ts
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
- EventExplorer.tsx
- Issue #13 backend handoff
- DateStrip.tsx
- env.py
- profiles.py
- SavedProvider.tsx
- ingest_rows
- apiToUiEvent
- Issue #26 frontend handoff
- test_contract.py
- CurrentEvent
- maps.ts
- Issue #19 backend handoff
- Issue #21 backend handoff
- load_fixture
- database.py
- explore-interactions.spec.ts
- services/__init__.py
- CredentialFilter
- apiBaseUrl
- TestCurrentPipelineContract
- current_event_search.py
- validate_contract.py
- ParkEvent
- scripts
- TrustStatus.tsx
- saved.spec.ts
- SavedCalendar.tsx
- Application shell
- SavedView.tsx
- FollowFacets.tsx
- Trust and system states
- profile.spec.ts
- dependencies
- TestGetEvent
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
8. `WorkflowPolicyTests` - 26 edges
9. `validate_workflows()` - 25 edges
10. `SocrataError` - 24 edges

## Surprising Connections (you probably didn't know these)
- `resolve_save()` --uses--> `ConciergeContext`  [INFERRED]
  backend/app/routes/concierge.py → backend/app/concierge.py
- `send_message()` --uses--> `ConciergeContext`  [INFERRED]
  backend/app/routes/concierge.py → backend/app/concierge.py
- `search_current_events_tool()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/app/concierge.py → backend/app/services/current_event_search.py
- `save_event_tool()` --uses--> `EventNotCurrentError`  [INFERRED]
  backend/app/concierge.py → backend/app/services/saved_events.py
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py

## Import Cycles
- None detected.

## Communities (120 total, 25 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "routes/concierge.py"
Cohesion: 0.18
Nodes (24): _agent(), _assistant_text(), ConciergeDecisionRequest, ConciergeMessageRequest, ConciergeResponse, _config(), _profile_id(), Any (+16 more)

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
Cohesion: 0.08
Nodes (43): The two bounded, read-only Event data operations used by the concierge., accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it. (+35 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "get_session_factory"
Cohesion: 0.10
Nodes (39): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., dismiss_match(), follow_interest(), _interest_contract(), InterestRequest (+31 more)

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

### Community 29 - "test_current_event_dates.py"
Cohesion: 0.14
Nodes (21): CurrentEventSearch, get_current_event(), Any, BaseModel, Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden., search_current_events() (+13 more)

### Community 34 - "events.ts"
Cohesion: 0.21
Nodes (16): dynamic, GET(), ApiEventsResponse, apiFetch(), ApiFreshness, EVENT_LIFECYCLE_STATUSES, FACT_FIELDS, getEvents() (+8 more)

### Community 38 - "app/concierge.py"
Cohesion: 0.08
Nodes (34): ConciergeSettings, get_concierge_settings(), BaseSettings, Concierge-specific environment configuration., Settings that are required only when the concierge is enabled., create_concierge_agent(), create_default_concierge_agent(), enforce_concierge_tool_allowlist() (+26 more)

### Community 45 - "TestParseEvent"
Cohesion: 0.12
Nodes (9): Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats., Pipe-delimited categories must be split into a list., Registration not required.' maps to not_required., The live Socrata URL object must imply registration and stay raw. (+1 more)

### Community 46 - "thumbnail/route.ts"
Cohesion: 0.15
Nodes (12): dynamic, GET(), { getEvent, EventsApiError }, ALLOWED_PARAMS, dynamic, errorResponse(), GET(), event (+4 more)

### Community 47 - "SocrataError"
Cohesion: 0.09
Nodes (25): _content_hash(), EventSource, ingest_events(), _is_explicitly_cancelled(), _optional_text(), _present_classification(), Any, AsyncSession (+17 more)

### Community 48 - "preferences.ts"
Cohesion: 0.22
Nodes (12): MatchesSection(), FACET_TYPE_LABELS, ProfileView(), dismissMatch(), fetchInterests(), fetchMatches(), headers(), Interest (+4 more)

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
Cohesion: 0.10
Nodes (38): ArgumentParser, BaseException, Namespace, capture_revision(), choose_origin(), classify_cli_diagnostic(), configure_sync_worker(), deployment_command() (+30 more)

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
Cohesion: 0.09
Nodes (54): Interest, MatchedEvent, PreferenceAudit, Profile, Anonymous Profile and Saved Event persistence models., Secret-free evidence for one approved concierge preference write., Anonymous-first application state keyed by a device-token digest., An Event deliberately kept by one Profile. (+46 more)

### Community 66 - "EventDetail.tsx"
Cohesion: 0.12
Nodes (18): EventDetail(), load(), EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance() (+10 more)

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
Cohesion: 0.11
Nodes (24): get_settings(), BaseSettings, Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, _main(), RuntimeError (+16 more)

### Community 74 - "socrata.py"
Cohesion: 0.08
Nodes (32): _derive_borough(), _derive_registration(), _location_key(), _missing_classification(), _normalize_socrata_url(), _parse_categories(), _parse_coordinates(), _parse_date() (+24 more)

### Community 75 - "SocrataClient"
Cohesion: 0.08
Nodes (27): Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., SocrataClient, AlwaysErrorTransport, MockTransport, Request, Response, Transport-layer mock that intercepts httpx requests. Returns paginated… (+19 more)

### Community 76 - "EventExplorer.tsx"
Cohesion: 0.07
Nodes (42): dynamic, GET(), emptyPage, { getFilteredEvents }, EventExplorer(), changeFilters(), restoreFilters(), EventExplorerProps (+34 more)

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 79 - "env.py"
Cohesion: 0.23
Nodes (11): do_run_migrations(), get_url(), Alembic environment configuration for async SQLAlchemy., Return the database URL from application settings., Run migrations in offline mode (emit SQL without connecting)., Execute migrations against the provided connection., Run migrations in online mode with an async engine., Run migrations in online mode. (+3 more)

### Community 80 - "profiles.py"
Cohesion: 0.12
Nodes (24): _event_date_expression(), Return the canonical New York calendar date SQL expression., get_profile(), list_saved_events(), _profile_contract(), Any, DeviceToken, get (+16 more)

### Community 81 - "SavedProvider.tsx"
Cohesion: 0.20
Nodes (12): chronological(), SavedContext, SavedContextValue, SavedProvider(), generateToken(), getDeviceToken(), fetchSavedEvents(), headers() (+4 more)

### Community 82 - "ingest_rows"
Cohesion: 0.12
Nodes (12): ingest_rows(), Parse raw Socrata rows and merge them into the database. This is the shared…, Verify Event and Location identity rules., TestIdentity, requires_docker, A malformed row must not leave a partially ingested Snapshot., Verify atomic current Snapshot replacement and archival retention., All events from snapshot_a must be stored in the database. (+4 more)

### Community 83 - "apiToUiEvent"
Cohesion: 0.06
Nodes (21): apiToUiEvent(), formatDate(), formatTime(), AuditedPage, listEvent, AuditedPage, fixtureEvent, AuditedPage (+13 more)

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "test_contract.py"
Cohesion: 0.15
Nodes (13): _build_validator(), _load_spec(), Any, Draft202012Validator, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec. (+5 more)

### Community 86 - "CurrentEvent"
Cohesion: 0.10
Nodes (31): Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), CurrentEvent, EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs. (+23 more)

### Community 87 - "maps.ts"
Cohesion: 0.13
Nodes (23): escapeAttribute(), EventMap(), onCanvasClick(), onCanvasKeyDown(), selectFromMarker(), EventMapProps, markerLabel(), NYC_CENTER (+15 more)

### Community 88 - "Issue #19 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #19 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 89 - "Issue #21 backend handoff"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Commands and results, Issue #21 backend handoff, Ordered next actions, Ownership, Required phases, State

### Community 90 - "load_fixture"
Cohesion: 0.16
Nodes (8): load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., parametrize, requires_docker, Issue #11 API gates for composable Event facet filters., Exercise filters through GET /events against real PostgreSQL., TestEventFacetFilters

### Community 92 - "database.py"
Cohesion: 0.17
Nodes (14): AsyncEngine, get_engine(), Async SQLAlchemy engine and session factory., Return a singleton async engine., deployment_revision(), health_check(), lifespan(), get (+6 more)

### Community 93 - "explore-interactions.spec.ts"
Cohesion: 0.29
Nodes (6): allEvents, base, eventsFor(), installRoutes(), manhattanEvent, queensEvent

### Community 96 - "CredentialFilter"
Cohesion: 0.25
Nodes (6): AsyncClient, CredentialFilter, Prevent credential values from appearing in log output., Allow only the fixed NYC Open Data HTTPS query origin., _validated_endpoint(), LogRecord

### Community 97 - "apiBaseUrl"
Cohesion: 0.14
Nodes (25): DELETE(), dynamic, badToken(), dynamic, FACET_TYPES, GET(), PUT(), badGuid() (+17 more)

### Community 99 - "TestCurrentPipelineContract"
Cohesion: 0.16
Nodes (7): Any, AsyncSession, Return the current row count and the API's deterministic first guid., snapshot_evidence(), FixtureSource, requires_docker, TestCurrentPipelineContract

### Community 100 - "current_event_search.py"
Cohesion: 0.21
Nodes (11): _all_current_event_values(), CurrentEventSearch, _literal_contains(), Any, BaseModel, Server-owned SQL search over the latest complete Event Snapshot., Structured, bounded search over the latest ``current_events`` Snapshot., Build one searchable SQL text projection from every table column. (+3 more)

### Community 101 - "validate_contract.py"
Cohesion: 0.37
Nodes (12): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+4 more)

### Community 102 - "ParkEvent"
Cohesion: 0.29
Nodes (9): event, routerPush, costBadgeClass(), costLabel(), EventCard(), EventCardProps, useSaved(), SaveHeart() (+1 more)

### Community 103 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format:check, lint, pretest, start, test (+5 more)

### Community 104 - "TrustStatus.tsx"
Cohesion: 0.24
Nodes (10): COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime(), FreshnessBanner(), FreshnessBannerProps, STATUS_COPY, current (+2 more)

### Community 106 - "SavedCalendar.tsx"
Cohesion: 0.33
Nodes (8): dayLabel(), MonthKey, monthKeyOf(), monthLabel(), SavedCalendar(), SavedCalendarProps, shiftMonth(), WEEKDAYS

### Community 107 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 108 - "SavedView.tsx"
Cohesion: 0.16
Nodes (11): BottomNav(), DesktopSidebar(), boroughs, Header(), isMonthKey(), newYorkToday(), SavedView(), coreNavItems (+3 more)

### Community 109 - "FollowFacets.tsx"
Cohesion: 0.43
Nodes (6): Followable, followableFacets(), FollowFacets(), filterLabel(), FacetType, followInterest()

### Community 110 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

### Community 112 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, leaflet, next, react, react-dom, @types/leaflet, leaflet, next (+3 more)

### Community 113 - "TestGetEvent"
Cohesion: 0.22
Nodes (5): requires_docker, Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., TestGetEvent, TestListEvents

### Community 119 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **294 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+289 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `test_interests_matches.py`, `TestCurrentPipelineContract`, `test_event_lifecycle.py`, `test_concierge.py`, `get_settings`, `socrata.py`, `SocrataClient`, `TestParseEvent`, `TestGetEvent`, `ingest_rows`, `test_contract.py`, `CurrentEvent`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `get_session_factory()` connect `get_session_factory` to `routes/concierge.py`, `test_interests_matches.py`, `current_event_search.py`, `app/concierge.py`, `events.py`, `get_settings`, `profiles.py`, `CurrentEvent`, `database.py`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `test_interests_matches.py`, `TestCurrentPipelineContract`, `current_event_search.py`, `events.py`, `get_settings`, `socrata.py`, `SocrataError`, `profiles.py`, `ingest_rows`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _294 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `ContractMockTests` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._