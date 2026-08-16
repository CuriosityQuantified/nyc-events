# Graph Report - nyc-events-wt-clerk  (2026-08-16)

## Corpus Check
- 182 files · ~114,821 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1486 nodes · 2925 edges · 123 communities (97 shown, 26 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad3d5c59`
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
- test_current_event_dates.py
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- events.ts
- app/concierge.py
- nyc-events-backend
- TestParseEvent
- getEvent
- get_session_factory
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
- test_sync_worker.py
- socrata.py
- SocrataClient
- EventExplorer
- Issue #13 backend handoff
- DateStrip.tsx
- env.py
- profiles.py
- test_ingestion.py
- load_fixture
- apiToUiEvent
- Issue #26 frontend handoff
- test_contract.py
- CurrentEvent
- ParkEvent
- Issue #19 backend handoff
- Issue #21 backend handoff
- FilterChips.tsx
- get_settings
- explore-interactions.spec.ts
- services/__init__.py
- conftest.py
- apiBaseUrl
- test_pipeline_contract.py
- events/route.ts
- validate_contract.py
- maps.spec.ts
- scripts
- EventCard.tsx
- saved.spec.ts
- accessibility_evidence
- Application shell
- EventExplorer.tsx
- filters.ts
- Trust and system states
- profile.spec.ts
- dependencies
- test_event_provenance.py
- matches/[guid]/route.ts
- saved/[guid]/route.ts
- filter-state.spec.ts
- eslint
- typescript
- package.json
- jsdom
- prettier

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
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `resolve_save()` --uses--> `ConciergeContext`  [INFERRED]
  backend/app/routes/concierge.py → backend/app/concierge.py
- `send_message()` --uses--> `ConciergeContext`  [INFERRED]
  backend/app/routes/concierge.py → backend/app/concierge.py
- `search_current_events_tool()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/app/concierge.py → backend/app/services/current_event_search.py
- `save_event_tool()` --uses--> `EventNotCurrentError`  [INFERRED]
  backend/app/concierge.py → backend/app/services/saved_events.py

## Import Cycles
- None detected.

## Communities (123 total, 26 thin omitted)

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
Cohesion: 0.11
Nodes (32): _calendar_date_fact(), _date_fact(), _datetime_fact(), _derived_boolean_fact(), _event_to_contract(), get_event(), get_ingestion_health(), list_event_changes() (+24 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "preferences.py"
Cohesion: 0.12
Nodes (31): dismiss_match(), follow_interest(), _interest_contract(), InterestRequest, list_interests(), list_matches(), promote_match(), Any (+23 more)

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
Nodes (17): @axe-core/playwright, eslint-config-next, devDependencies, @axe-core/playwright, eslint-config-next, @playwright/test, @testing-library/react, @types/node (+9 more)

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
Cohesion: 0.13
Nodes (23): CurrentEventSearch, get_current_event(), Any, BaseModel, Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden., search_current_events() (+15 more)

### Community 34 - "events.ts"
Cohesion: 0.23
Nodes (13): dynamic, GET(), ApiEventsResponse, apiFetch(), ApiFreshness, EVENT_LIFECYCLE_STATUSES, FACT_FIELDS, getEvents() (+5 more)

### Community 38 - "app/concierge.py"
Cohesion: 0.09
Nodes (28): ConciergeSettings, get_concierge_settings(), BaseSettings, Concierge-specific environment configuration., Settings that are required only when the concierge is enabled., create_concierge_agent(), create_default_concierge_agent(), enforce_concierge_tool_allowlist() (+20 more)

### Community 45 - "TestParseEvent"
Cohesion: 0.10
Nodes (11): Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats., Pipe-delimited categories must be split into a list., Registration not required.' maps to not_required., The live Socrata URL object must imply registration and stay raw. (+3 more)

### Community 46 - "getEvent"
Cohesion: 0.32
Nodes (5): dynamic, GET(), { getEvent, EventsApiError }, EventsApiError, getEvent()

### Community 47 - "get_session_factory"
Cohesion: 0.12
Nodes (20): async_sessionmaker, get_session_factory(), AsyncSession, Async SQLAlchemy engine and session factory., Return a singleton async session factory., Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), EventSource (+12 more)

### Community 48 - "preferences.ts"
Cohesion: 0.08
Nodes (36): AccountPanel(), clerk, AuthProvider(), boroughs, Header(), HeaderAuth(), MatchesSection(), FACET_TYPE_LABELS (+28 more)

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
Nodes (56): Interest, MatchedEvent, PreferenceAudit, Profile, Anonymous Profile and Saved Event persistence models., Secret-free evidence for one approved concierge preference write., Anonymous-first application state keyed by a device-token digest., An Event deliberately kept by one Profile. (+48 more)

### Community 66 - "EventDetail.tsx"
Cohesion: 0.14
Nodes (16): EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance(), PresentedFact, presentFact() (+8 more)

### Community 69 - "0004_event_lifecycle.py"
Cohesion: 0.50
Nodes (3): _content_hash(), Any, upgrade()

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 71 - "test_concierge.py"
Cohesion: 0.13
Nodes (21): ConciergeContext, Trusted identity injected by the server and hidden from the model., CurrentEventSearch, BaseModel, Structured, bounded search over the latest ``current_events`` Snapshot., _agent(), Any, BaseChatModel (+13 more)

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "test_sync_worker.py"
Cohesion: 0.19
Nodes (12): Secret-free operational evidence for one attempted synchronization., SyncRun, BlockingSource, FixtureSource, fixture, requires_docker, Issue #15 gates for the scheduled synchronization worker., redis_client() (+4 more)

### Community 74 - "socrata.py"
Cohesion: 0.08
Nodes (42): _content_hash(), _derive_borough(), _derive_registration(), ingest_events(), _is_explicitly_cancelled(), _location_key(), _missing_classification(), _normalize_socrata_url() (+34 more)

### Community 75 - "SocrataClient"
Cohesion: 0.09
Nodes (23): CredentialFilter, Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., Prevent credential values from appearing in log output., SocrataClient, MockTransport, Transport-layer mock that intercepts httpx requests. Returns paginated…, parametrize (+15 more)

### Community 76 - "EventExplorer"
Cohesion: 0.15
Nodes (13): EventDetail(), load(), EventExplorer(), changeFilters(), restoreFilters(), eventsPath(), mergeWithoutDuplicates(), parseFilterSearchParams() (+5 more)

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

### Community 81 - "test_ingestion.py"
Cohesion: 0.19
Nodes (8): AlwaysErrorTransport, Request, Response, Transport that always returns the given error status code., Tests for event ingestion — snapshot deltas, guid identity, network isolation., Verify that transport-layer substitution prevents real network access., The Socrata client with an injected transport must not reach the network. The…, TestNetworkEnforcement

### Community 82 - "load_fixture"
Cohesion: 0.07
Nodes (28): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, GET /events response must validate against EventListResponse., An event with registration_status=closed must still validate., parametrize (+20 more)

### Community 83 - "apiToUiEvent"
Cohesion: 0.11
Nodes (11): apiToUiEvent(), formatDate(), formatTime(), AuditedPage, listEvent, AuditedPage, lifecycleEvents, sourceEvents (+3 more)

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "test_contract.py"
Cohesion: 0.22
Nodes (8): _build_validator(), Draft202012Validator, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Build a JSON Schema validator for a given $ref in the OpenAPI spec., Validate real API responses against the OpenAPI contract schema., GET /events/{guid} response must validate against Event., TestContractValidation

### Community 86 - "CurrentEvent"
Cohesion: 0.13
Nodes (23): The two bounded, read-only Event data operations used by the concierge., CurrentEvent, EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., One Event in the latest complete successful source Snapshot. (+15 more)

### Community 87 - "ParkEvent"
Cohesion: 0.09
Nodes (31): ALLOWED_PARAMS, dynamic, errorResponse(), GET(), event, { getEvent, EventsApiError }, VARIANTS, escapeAttribute() (+23 more)

### Community 88 - "Issue #19 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #19 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 89 - "Issue #21 backend handoff"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Commands and results, Issue #21 backend handoff, Ordered next actions, Ownership, Required phases, State

### Community 90 - "FilterChips.tsx"
Cohesion: 0.22
Nodes (9): FilterChips(), setExactDate(), FilterChipsProps, GROUPS, FILTER_OPTIONS, FilterKey, hasActiveFilters(), isValidIsoDate() (+1 more)

### Community 92 - "get_settings"
Cohesion: 0.11
Nodes (25): AsyncEngine, concierge_runtime(), _psycopg_url(), Any, Production lifecycle for the concierge model and durable checkpointer., Convert SQLAlchemy's asyncpg URL into a psycopg-compatible URL., Yield the configured agent, or ``None`` when no model key is configured., get_settings() (+17 more)

### Community 93 - "explore-interactions.spec.ts"
Cohesion: 0.29
Nodes (6): allEvents, base, eventsFor(), installRoutes(), manhattanEvent, queensEvent

### Community 96 - "conftest.py"
Cohesion: 0.25
Nodes (10): AsyncClient, _check_docker(), client(), _maybe_start_postgres(), postgres_url(), fixture, Test fixtures using Testcontainers for real Postgres., Return the async Postgres URL (skips if Docker unavailable). (+2 more)

### Community 97 - "apiBaseUrl"
Cohesion: 0.23
Nodes (14): DELETE(), dynamic, badToken(), dynamic, FACET_TYPES, GET(), PUT(), dynamic (+6 more)

### Community 99 - "test_pipeline_contract.py"
Cohesion: 0.12
Nodes (13): AsyncSession, Fetch and store one complete Snapshot with durable attempt evidence., sync_events(), Any, AsyncSession, Return the current row count and the API's deterministic first guid., snapshot_evidence(), FixtureSource (+5 more)

### Community 100 - "events/route.ts"
Cohesion: 0.27
Nodes (8): dynamic, GET(), emptyPage, { getFilteredEvents }, getFilteredEvents(), isAllowedValue(), valueFor(), parseStrictFilterSearchParams()

### Community 101 - "validate_contract.py"
Cohesion: 0.37
Nodes (12): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+4 more)

### Community 102 - "maps.spec.ts"
Cohesion: 0.20
Nodes (8): AuditedPage, events, invalid, multiple, shared, source, TILE_PNG, unlocatable

### Community 103 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format:check, lint, pretest, start, test (+5 more)

### Community 104 - "EventCard.tsx"
Cohesion: 0.18
Nodes (14): costBadgeClass(), costLabel(), EventCard(), EventCardProps, COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime() (+6 more)

### Community 106 - "accessibility_evidence"
Cohesion: 0.33
Nodes (8): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts()

### Community 107 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 108 - "EventExplorer.tsx"
Cohesion: 0.16
Nodes (13): BottomNav(), event, routerPush, DesktopSidebar(), EventExplorerProps, ListMapToggle(), ListMapToggleProps, View (+5 more)

### Community 109 - "filters.ts"
Cohesion: 0.18
Nodes (15): Followable, followableFacets(), FollowFacets(), applyEventFilters(), dateRange(), describeFilters(), EMPTY_FILTERS, EXACT_DATE_PARAMS (+7 more)

### Community 110 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

### Community 112 - "dependencies"
Cohesion: 0.15
Nodes (13): @clerk/nextjs, dependencies, @clerk/nextjs, leaflet, next, react, react-dom, @types/leaflet (+5 more)

### Community 113 - "test_event_provenance.py"
Cohesion: 0.33
Nodes (8): parametrize, requires_docker, Issue #13 executable gates for single-Event provenance., _source_row(), test_free_status_is_never_inferred_from_silence_or_ambiguous_text(), test_missing_source_facts_are_absent_not_negative_claims(), test_positive_source_language_sets_only_positive_derived_flags(), test_single_event_returns_complete_provenance_and_preserves_raw_source()

### Community 114 - "matches/[guid]/route.ts"
Cohesion: 0.48
Nodes (6): badGuid(), badToken(), DELETE(), dynamic, PUT(), RouteContext

### Community 115 - "saved/[guid]/route.ts"
Cohesion: 0.48
Nodes (6): badGuid(), badToken(), DELETE(), dynamic, PUT(), RouteContext

### Community 119 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **296 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+291 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `conftest.py`, `test_interests_matches.py`, `test_pipeline_contract.py`, `test_event_lifecycle.py`, `test_concierge.py`, `test_sync_worker.py`, `SocrataClient`, `TestParseEvent`, `test_ingestion.py`, `test_contract.py`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `get_session_factory()` connect `get_session_factory` to `conftest.py`, `routes/concierge.py`, `test_interests_matches.py`, `app/concierge.py`, `events.py`, `profiles.py`, `preferences.py`, `CurrentEvent`, `get_settings`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `conftest.py`, `test_interests_matches.py`, `test_pipeline_contract.py`, `events.py`, `test_sync_worker.py`, `socrata.py`, `get_session_factory`, `profiles.py`, `test_event_provenance.py`, `load_fixture`, `test_ingestion.py`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _296 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `ContractMockTests` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._