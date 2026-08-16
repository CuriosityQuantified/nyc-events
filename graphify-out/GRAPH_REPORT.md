# Graph Report - nyc-events  (2026-08-16)

## Corpus Check
- 178 files · ~114,631 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1483 nodes · 2905 edges · 122 communities (96 shown, 26 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7098966b`
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
- EventMatch NYC
- compilerOptions
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- devDependencies
- Issue #16 backend handoff
- TestHealthEndpoint
- frontend/README.md
- _event_to_contract
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- events.ts
- app/concierge.py
- nyc-events-backend
- TestParseEvent
- SavedEvent
- test_interests_matches.py
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
- apiToUiEvent
- revision/route.ts
- backend_container_smoke.sh
- 3. Map view
- profile_preferences.py
- EventDetail.tsx
- start.sh
- BackendContainerSmokeTests
- 0004_event_lifecycle.py
- Issue #15 backend handoff
- test_concierge.py
- test_migrations.py
- test_sync_worker.py
- socrata.py
- SocrataClient
- filters.ts
- Issue #13 backend handoff
- DateStrip.tsx
- env.py
- profiles.py
- SavedProvider.tsx
- load_fixture
- event-detail.spec.ts
- Issue #26 frontend handoff
- test_contract.py
- conftest.py
- maps.ts
- Issue #19 backend handoff
- Issue #21 backend handoff
- ingest_rows
- get_settings
- explore-interactions.spec.ts
- services/__init__.py
- maps.spec.ts
- apiBaseUrl
- CurrentEvent
- current_event_search.py
- validate_contract.py
- SavedView.tsx
- scripts
- accessibility_evidence
- saved.spec.ts
- matches/[guid]/route.ts
- Application shell
- EventExplorer.tsx
- saved/[guid]/route.ts
- Trust and system states
- profile.spec.ts
- dependencies
- test_events.py
- filter-state.spec.ts
- freshness-status.spec.ts
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
- `test_approval_executes_once_with_trusted_profile_context()` --uses--> `ConciergeContext`  [INFERRED]
  backend/tests/test_concierge.py → backend/app/concierge.py
- `test_malformed_hidden_harness_tool_call_is_rejected()` --uses--> `ConciergeContext`  [INFERRED]
  backend/tests/test_concierge.py → backend/app/concierge.py
- `test_model_sees_exactly_two_concierge_tools()` --uses--> `ConciergeContext`  [INFERRED]
  backend/tests/test_concierge.py → backend/app/concierge.py
- `test_save_tool_interrupts_and_rejection_resumes_without_execution()` --uses--> `ConciergeContext`  [INFERRED]
  backend/tests/test_concierge.py → backend/app/concierge.py
- `search_current_events_tool()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/app/concierge.py → backend/app/services/current_event_search.py

## Import Cycles
- None detected.

## Communities (122 total, 26 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "routes/concierge.py"
Cohesion: 0.12
Nodes (31): ConciergeContext, ConciergeSettings, get_concierge_settings(), BaseSettings, Concierge-specific environment configuration., Settings that are required only when the concierge is enabled., Trusted identity injected by the server and hidden from the model., _agent() (+23 more)

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
Nodes (30): _calendar_date_fact(), _date_fact(), _datetime_fact(), _derived_boolean_fact(), get_event(), get_ingestion_health(), list_event_changes(), list_events() (+22 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "get_session_factory"
Cohesion: 0.11
Nodes (35): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., dismiss_match(), follow_interest(), _interest_contract(), InterestRequest (+27 more)

### Community 20 - "EventMatch NYC"
Cohesion: 0.11
Nodes (15): EventMatch NYC API contract, Run the mock, Validate, CI/CD extension matrix, Clean-runner commands, Trust boundary, Architecture, EventMatch NYC (+7 more)

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

### Community 29 - "_event_to_contract"
Cohesion: 0.17
Nodes (18): EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., _event_to_contract(), Convert an Event model instance to the contract Event shape., _event() (+10 more)

### Community 34 - "events.ts"
Cohesion: 0.14
Nodes (20): dynamic, GET(), { getEvent, EventsApiError }, dynamic, GET(), ApiEventsResponse, apiFetch(), ApiFreshness (+12 more)

### Community 38 - "app/concierge.py"
Cohesion: 0.12
Nodes (23): create_concierge_agent(), create_default_concierge_agent(), enforce_concierge_tool_allowlist(), Any, BaseChatModel, date, Constrained LangChain Deep Agent for current Event discovery and saving., Save one current Event after the human approves this exact Event ID. (+15 more)

### Community 45 - "TestParseEvent"
Cohesion: 0.10
Nodes (11): Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats., Pipe-delimited categories must be split into a list., Registration not required.' maps to not_required., The live Socrata URL object must imply registration and stay raw. (+3 more)

### Community 46 - "SavedEvent"
Cohesion: 0.17
Nodes (20): Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., PreferenceAudit, Profile, Anonymous Profile and Saved Event persistence models., Secret-free evidence for one approved concierge preference write., Anonymous-first application state keyed by a device-token digest. (+12 more)

### Community 47 - "test_interests_matches.py"
Cohesion: 0.26
Nodes (17): Interest, MatchedEvent, One durable Facet followed by a Profile., An automatic Event suggestion kept separate from Saved Events., _headers(), parametrize, requires_docker, Issue #21 Interest, Match, preference, migration, and security gates. (+9 more)

### Community 48 - "preferences.ts"
Cohesion: 0.18
Nodes (15): Followable, followableFacets(), FollowFacets(), MatchesSection(), ProfileView(), dismissMatch(), FacetType, fetchInterests() (+7 more)

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

### Community 60 - "apiToUiEvent"
Cohesion: 0.24
Nodes (10): dynamic, GET(), dynamic, GET(), EventDetail(), load(), apiToUiEvent(), formatDate() (+2 more)

### Community 64 - "3. Map view"
Cohesion: 0.50
Nodes (4): 3. Map view, Location identity, Marker sizing, Required behavior

### Community 65 - "profile_preferences.py"
Cohesion: 0.18
Nodes (21): apply_concierge_preference(), _event_matches_interest(), match_new_events(), _normalize_preference(), PreferenceConflictError, PreferenceValidationError, AsyncSession, Interest (+13 more)

### Community 66 - "EventDetail.tsx"
Cohesion: 0.10
Nodes (26): EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance(), PresentedFact, presentFact() (+18 more)

### Community 69 - "0004_event_lifecycle.py"
Cohesion: 0.50
Nodes (3): _content_hash(), Any, upgrade()

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 71 - "test_concierge.py"
Cohesion: 0.13
Nodes (19): CurrentEventSearch, BaseModel, Structured, bounded search over the latest ``current_events`` Snapshot., _agent(), Any, BaseChatModel, requires_docker, Deep Agent, SQL search, and human-approved Saved Event gates. (+11 more)

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "test_sync_worker.py"
Cohesion: 0.12
Nodes (23): Secret-free operational evidence for one attempted synchronization., SyncRun, EventSource, Fetch and store one complete Snapshot with durable attempt evidence., The narrow transport contract used by the synchronization job., sync_events(), _main(), RuntimeError (+15 more)

### Community 74 - "socrata.py"
Cohesion: 0.06
Nodes (51): _content_hash(), _derive_borough(), _derive_registration(), ingest_events(), _is_explicitly_cancelled(), _location_key(), _missing_classification(), _normalize_socrata_url() (+43 more)

### Community 75 - "SocrataClient"
Cohesion: 0.07
Nodes (31): AsyncClient, CredentialFilter, Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., Prevent credential values from appearing in log output., SocrataClient, AlwaysErrorTransport, MockTransport (+23 more)

### Community 76 - "filters.ts"
Cohesion: 0.07
Nodes (37): dynamic, GET(), emptyPage, { getFilteredEvents }, EventExplorer(), changeFilters(), restoreFilters(), eventsPath() (+29 more)

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
Cohesion: 0.11
Nodes (26): get_profile(), list_saved_events(), _profile_contract(), Any, delete, DeviceToken, get, put (+18 more)

### Community 81 - "SavedProvider.tsx"
Cohesion: 0.20
Nodes (12): chronological(), SavedContext, SavedContextValue, SavedProvider(), generateToken(), getDeviceToken(), fetchSavedEvents(), headers() (+4 more)

### Community 82 - "load_fixture"
Cohesion: 0.15
Nodes (10): load_fixture(), Load a JSON fixture file by name from the fixtures directory., requires_docker, A malformed row must not leave a partially ingested Snapshot., Verify atomic current Snapshot replacement and archival retention., All events from snapshot_a must be stored in the database., A live Socrata URL object must ingest and retain its raw shape., Ingesting snapshot_b after snapshot_a must add 1 new event and update 1 changed… (+2 more)

### Community 83 - "event-detail.spec.ts"
Cohesion: 0.18
Nodes (5): AuditedPage, listEvent, AuditedPage, firstPage, nextEvent

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "test_contract.py"
Cohesion: 0.15
Nodes (13): _build_validator(), _load_spec(), Any, Draft202012Validator, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec. (+5 more)

### Community 86 - "conftest.py"
Cohesion: 0.23
Nodes (13): Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), _check_docker(), client(), db_session(), _maybe_start_postgres(), postgres_url(), fixture (+5 more)

### Community 87 - "maps.ts"
Cohesion: 0.09
Nodes (30): ALLOWED_PARAMS, dynamic, errorResponse(), GET(), event, { getEvent, EventsApiError }, VARIANTS, escapeAttribute() (+22 more)

### Community 88 - "Issue #19 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #19 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 89 - "Issue #21 backend handoff"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Commands and results, Issue #21 backend handoff, Ordered next actions, Ownership, Required phases, State

### Community 90 - "ingest_rows"
Cohesion: 0.15
Nodes (10): ingest_rows(), Any, Parse raw Socrata rows and merge them into the database. This is the shared…, requires_docker, test_date_filter_and_order_include_date_only_and_missing_rows(), parametrize, requires_docker, Issue #11 API gates for composable Event facet filters. (+2 more)

### Community 92 - "get_settings"
Cohesion: 0.09
Nodes (29): AsyncEngine, concierge_runtime(), _psycopg_url(), Any, Production lifecycle for the concierge model and durable checkpointer., Convert SQLAlchemy's asyncpg URL into a psycopg-compatible URL., Yield the configured agent, or ``None`` when no model key is configured., get_settings() (+21 more)

### Community 93 - "explore-interactions.spec.ts"
Cohesion: 0.29
Nodes (6): allEvents, base, eventsFor(), installRoutes(), manhattanEvent, queensEvent

### Community 96 - "maps.spec.ts"
Cohesion: 0.20
Nodes (8): AuditedPage, events, invalid, multiple, shared, source, TILE_PNG, unlocatable

### Community 97 - "apiBaseUrl"
Cohesion: 0.33
Nodes (9): DELETE(), dynamic, badToken(), dynamic, FACET_TYPES, GET(), PUT(), deviceTokenFrom() (+1 more)

### Community 99 - "CurrentEvent"
Cohesion: 0.10
Nodes (24): CurrentEventSearch, get_current_event(), Any, BaseModel, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden. (+16 more)

### Community 100 - "current_event_search.py"
Cohesion: 0.29
Nodes (9): _event_date_expression(), Return the canonical New York calendar date SQL expression., _all_current_event_values(), _literal_contains(), Any, Server-owned SQL search over the latest complete Event Snapshot., Build one searchable SQL text projection from every table column., Search ``current_events`` using validated arguments and no arbitrary SQL. (+1 more)

### Community 101 - "validate_contract.py"
Cohesion: 0.37
Nodes (12): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+4 more)

### Community 102 - "SavedView.tsx"
Cohesion: 0.14
Nodes (19): costBadgeClass(), costLabel(), EventCard(), EventCardProps, dayLabel(), isMonthKey(), MonthKey, monthKeyOf() (+11 more)

### Community 103 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format:check, lint, pretest, start, test (+5 more)

### Community 104 - "accessibility_evidence"
Cohesion: 0.33
Nodes (8): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts()

### Community 106 - "matches/[guid]/route.ts"
Cohesion: 0.48
Nodes (6): badGuid(), badToken(), DELETE(), dynamic, PUT(), RouteContext

### Community 107 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 108 - "EventExplorer.tsx"
Cohesion: 0.13
Nodes (17): BottomNav(), event, routerPush, DesktopSidebar(), EventExplorerProps, boroughs, Header(), ListMapToggle() (+9 more)

### Community 109 - "saved/[guid]/route.ts"
Cohesion: 0.48
Nodes (6): badGuid(), badToken(), DELETE(), dynamic, PUT(), RouteContext

### Community 110 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

### Community 112 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, leaflet, next, react, react-dom, @types/leaflet, leaflet, next (+3 more)

### Community 113 - "test_events.py"
Cohesion: 0.14
Nodes (8): requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., Verify Event and Location identity rules., TestGetEvent, TestIdentity, TestListEvents

### Community 115 - "freshness-status.spec.ts"
Cohesion: 0.33
Nodes (3): AuditedPage, lifecycleEvents, sourceEvents

### Community 119 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **302 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `CurrentEvent`, `test_event_lifecycle.py`, `test_concierge.py`, `test_sync_worker.py`, `SocrataClient`, `TestParseEvent`, `SavedEvent`, `test_interests_matches.py`, `test_events.py`, `test_contract.py`, `conftest.py`, `ingest_rows`, `_event_to_contract`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `get_session_factory()` connect `get_session_factory` to `routes/concierge.py`, `CurrentEvent`, `current_event_search.py`, `app/concierge.py`, `events.py`, `test_sync_worker.py`, `test_interests_matches.py`, `profiles.py`, `conftest.py`, `get_settings`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `profile_preferences.py`, `current_event_search.py`, `events.py`, `test_sync_worker.py`, `socrata.py`, `SavedEvent`, `profiles.py`, `test_events.py`, `load_fixture`, `conftest.py`, `ingest_rows`, `_event_to_contract`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `routes/concierge.py` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._