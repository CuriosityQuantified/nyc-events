# Graph Report - nyc-events  (2026-08-16)

## Corpus Check
- 177 files · ~119,413 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1455 nodes · 2860 edges · 121 communities (99 shown, 22 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 148 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `118c0b97`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- test_concierge.py
- Core screens
- NYC Events — Handoff Document
- ContractMockTests
- CredentialFilter
- Language
- CLAUDE.md
- _event_to_contract
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
- _get_or_create_profile
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
- CurrentEvent
- nyc-events-backend
- TestParseEvent
- test_interests_matches.py
- get_settings
- sync_events
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
- ingest_rows
- test_migrations.py
- events.py
- socrata.py
- SocrataClient
- filters.ts
- Issue #13 backend handoff
- DateStrip.tsx
- ParkEvent
- test_ingestion.py
- routes/concierge.py
- load_fixture
- maps.spec.ts
- Issue #26 frontend handoff
- TestIngestionWithDb
- SocrataError
- maps.ts
- Issue #19 backend handoff
- Issue #21 backend handoff
- preferences.ts
- SavedView.tsx
- test_contract.py
- services/__init__.py
- save_event_tool
- apiBaseUrl
- app/concierge.py
- accessibility_evidence
- concierge_runtime.py
- validate_contract.py
- test_profiles.py
- test_event_lifecycle.py
- saved.spec.ts
- get_session_factory
- Application shell
- CurrentEventSearch
- SavedCalendar.tsx
- saved/[guid]/route.ts
- profile.spec.ts
- explore-interactions.spec.ts
- filter-state.spec.ts
- EventExplorer
- EventExplorer.tsx
- list_saved_events
- test_event_provenance.py
- FollowFacets.tsx
- EventSource
- Trust and system states

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 73 edges
2. `ingest_rows()` - 53 edges
3. `CurrentEvent` - 44 edges
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
- `test_current_events_fallback_is_consistent_across_api_and_consumers()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_current_event_dates.py → backend/app/concierge_tools.py
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py

## Import Cycles
- None detected.

## Communities (121 total, 22 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "test_concierge.py"
Cohesion: 0.19
Nodes (15): ConciergeContext, Trusted identity injected by the server and hidden from the model., _agent(), Any, BaseChatModel, Deep Agent, SQL search, and human-approved Saved Event gates., Provider-free model that emits deterministic tool calls and records schemas., ScriptedToolModel (+7 more)

### Community 2 - "Core screens"
Cohesion: 0.20
Nodes (10): 1. Discover, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens, Detail sections, Flow (+2 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.17
Nodes (12): 10. Future data integrations, 11. Completion criteria for the first implementation, 1. Project concept, 2. Local project path, 3. Primary data source, 4. Local API configuration, 5. SODA3 request pattern, 6. Required synchronization architecture (+4 more)

### Community 4 - "ContractMockTests"
Cohesion: 0.11
Nodes (13): BaseHTTPRequestHandler, ContractHandler, create_server(), fact_value(), filter_events(), load_json(), main(), parse_positive_int() (+5 more)

### Community 5 - "CredentialFilter"
Cohesion: 0.25
Nodes (6): AsyncClient, CredentialFilter, Prevent credential values from appearing in log output., Allow only the fixed NYC Open Data HTTPS query origin., _validated_endpoint(), LogRecord

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "_event_to_contract"
Cohesion: 0.09
Nodes (34): EventRepository, The union of all source Events observed in successful Sync Runs., _calendar_date_fact(), _date_fact(), _datetime_fact(), _derived_boolean_fact(), _event_to_contract(), Any (+26 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "_get_or_create_profile"
Cohesion: 0.09
Nodes (36): dismiss_match(), follow_interest(), _interest_contract(), InterestRequest, list_interests(), list_matches(), promote_match(), Any (+28 more)

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
Cohesion: 0.13
Nodes (23): dynamic, GET(), { getEvent, EventsApiError }, dynamic, GET(), ApiEvent, ApiEventsResponse, apiFetch() (+15 more)

### Community 38 - "CurrentEvent"
Cohesion: 0.13
Nodes (24): CurrentEventSearch, get_current_event(), Any, BaseModel, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden. (+16 more)

### Community 45 - "TestParseEvent"
Cohesion: 0.10
Nodes (11): Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats., Pipe-delimited categories must be split into a list., Registration not required.' maps to not_required., The live Socrata URL object must imply registration and stay raw. (+3 more)

### Community 46 - "test_interests_matches.py"
Cohesion: 0.13
Nodes (36): Interest, One durable Facet followed by a Profile., apply_concierge_preference(), _event_matches_interest(), match_new_events(), _normalize_preference(), PreferenceConflictError, PreferenceValidationError (+28 more)

### Community 47 - "get_settings"
Cohesion: 0.07
Nodes (41): get_settings(), BaseSettings, Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, deployment_revision(), health_check() (+33 more)

### Community 48 - "sync_events"
Cohesion: 0.12
Nodes (13): ingest_events(), AsyncSession, Atomically archive a valid Snapshot and replace the current dataset., Fetch and store one complete Snapshot with durable attempt evidence., sync_events(), Any, AsyncSession, Return the current row count and the API's deterministic first guid. (+5 more)

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

### Community 65 - "conftest.py"
Cohesion: 0.12
Nodes (28): Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), Secret-free operational evidence for one attempted synchronization., SyncRun, Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., MatchedEvent (+20 more)

### Community 66 - "EventDetail.tsx"
Cohesion: 0.10
Nodes (26): EventDetail(), load(), EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance() (+18 more)

### Community 69 - "0004_event_lifecycle.py"
Cohesion: 0.50
Nodes (3): _content_hash(), Any, upgrade()

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 71 - "ingest_rows"
Cohesion: 0.16
Nodes (10): ingest_rows(), Parse raw Socrata rows and merge them into the database. This is the shared…, requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., Verify Event and Location identity rules., TestGetEvent (+2 more)

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "events.py"
Cohesion: 0.17
Nodes (14): AsyncEngine, get_engine(), Async SQLAlchemy engine and session factory., Return a singleton async engine., lifespan(), FastAPI application entry point., Manage application startup and shutdown., EventFields (+6 more)

### Community 74 - "socrata.py"
Cohesion: 0.10
Nodes (31): _content_hash(), _derive_borough(), _derive_registration(), _is_explicitly_cancelled(), _location_key(), _missing_classification(), _normalize_socrata_url(), _optional_text() (+23 more)

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

### Community 79 - "ParkEvent"
Cohesion: 0.29
Nodes (9): event, routerPush, costBadgeClass(), costLabel(), EventCard(), EventCardProps, useSaved(), SaveHeart() (+1 more)

### Community 80 - "test_ingestion.py"
Cohesion: 0.19
Nodes (8): AlwaysErrorTransport, Request, Response, Transport that always returns the given error status code., Tests for event ingestion — snapshot deltas, guid identity, network isolation., Verify that transport-layer substitution prevents real network access., The Socrata client with an injected transport must not reach the network. The…, TestNetworkEnforcement

### Community 81 - "routes/concierge.py"
Cohesion: 0.18
Nodes (24): _agent(), _assistant_text(), ConciergeDecisionRequest, ConciergeMessageRequest, ConciergeResponse, _config(), _profile_id(), Any (+16 more)

### Community 82 - "load_fixture"
Cohesion: 0.16
Nodes (8): load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., parametrize, requires_docker, Issue #11 API gates for composable Event facet filters., Exercise filters through GET /events against real PostgreSQL., TestEventFacetFilters

### Community 83 - "maps.spec.ts"
Cohesion: 0.08
Nodes (14): AuditedPage, listEvent, AuditedPage, lifecycleEvents, sourceEvents, AuditedPage, events, invalid (+6 more)

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "TestIngestionWithDb"
Cohesion: 0.12
Nodes (8): requires_docker, A malformed row must not leave a partially ingested Snapshot., Verify atomic current Snapshot replacement and archival retention., All events from snapshot_a must be stored in the database., A live Socrata URL object must ingest and retain its raw shape., Ingesting snapshot_b after snapshot_a must add 1 new event and update 1 changed…, Duplicate guid must update, not create a second row., TestIngestionWithDb

### Community 86 - "SocrataError"
Cohesion: 0.22
Nodes (7): Response, POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., Raised when the Socrata API returns an unrecoverable error., SocrataError, Exception

### Community 87 - "maps.ts"
Cohesion: 0.11
Nodes (26): ALLOWED_PARAMS, dynamic, errorResponse(), GET(), event, { getEvent, EventsApiError }, VARIANTS, EventMap() (+18 more)

### Community 88 - "Issue #19 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #19 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 89 - "Issue #21 backend handoff"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Commands and results, Issue #21 backend handoff, Ordered next actions, Ownership, Required phases, State

### Community 90 - "preferences.ts"
Cohesion: 0.22
Nodes (12): MatchesSection(), FACET_TYPE_LABELS, ProfileView(), dismissMatch(), fetchInterests(), fetchMatches(), headers(), Interest (+4 more)

### Community 92 - "SavedView.tsx"
Cohesion: 0.19
Nodes (9): BottomNav(), DesktopSidebar(), isMonthKey(), newYorkToday(), SavedView(), coreNavItems, NavItem, sidebarNavItems (+1 more)

### Community 93 - "test_contract.py"
Cohesion: 0.15
Nodes (13): _build_validator(), _load_spec(), Any, Draft202012Validator, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec. (+5 more)

### Community 96 - "save_event_tool"
Cohesion: 0.15
Nodes (15): Save one current Event after the human approves this exact Event ID., save_event_tool(), EventNotCurrentError, AsyncSession, UUID, ValueError, Canonical Profile-owned Saved Event operations., Raised when an Event is not part of the latest successful Snapshot. (+7 more)

### Community 97 - "apiBaseUrl"
Cohesion: 0.16
Nodes (22): DELETE(), dynamic, badToken(), dynamic, FACET_TYPES, GET(), PUT(), badGuid() (+14 more)

### Community 99 - "app/concierge.py"
Cohesion: 0.17
Nodes (16): create_concierge_agent(), create_default_concierge_agent(), enforce_concierge_tool_allowlist(), Any, BaseChatModel, date, Constrained LangChain Deep Agent for current Event discovery and saving., Prevent even a malformed model response from invoking harness tools. (+8 more)

### Community 100 - "accessibility_evidence"
Cohesion: 0.33
Nodes (8): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts()

### Community 101 - "concierge_runtime.py"
Cohesion: 0.21
Nodes (11): ConciergeSettings, get_concierge_settings(), BaseSettings, Concierge-specific environment configuration., Settings that are required only when the concierge is enabled., concierge_runtime(), _psycopg_url(), Any (+3 more)

### Community 102 - "validate_contract.py"
Cohesion: 0.37
Nodes (12): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+4 more)

### Community 103 - "test_profiles.py"
Cohesion: 0.40
Nodes (9): _headers(), requires_docker, Issue #19 API, persistence, migration, and security gates., test_browser_preflight_allows_only_the_profile_write_contract(), test_profile_api_rejects_bad_tokens_and_unknown_events(), test_profile_is_created_anonymously_and_keyed_by_hashed_device_token(), test_profile_schema_is_anonymous_by_default_and_collects_no_contact_data(), test_save_list_and_unsave_are_idempotent_and_isolated_by_profile() (+1 more)

### Community 104 - "test_event_lifecycle.py"
Cohesion: 0.40
Nodes (9): _changes(), requires_docker, Issue #16 executable API gates for Event lifecycle classification., test_absence_is_expired_or_removed_and_never_cancelled(), test_committed_snapshots_classify_new_changed_and_unchanged_through_api(), test_content_hash_is_stable_for_key_order_and_changes_with_content(), test_explicit_cancellation_surfaces_without_word_inference(), test_generated_api_schema_documents_lifecycle_contract() (+1 more)

### Community 106 - "get_session_factory"
Cohesion: 0.14
Nodes (17): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., get_event(), get_ingestion_health(), list_event_changes(), list_events() (+9 more)

### Community 107 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 108 - "CurrentEventSearch"
Cohesion: 0.29
Nodes (6): CurrentEventSearch, BaseModel, Structured, bounded search over the latest ``current_events`` Snapshot., requires_docker, test_searches_all_current_values_and_returns_saveable_event_id(), model_validator

### Community 109 - "SavedCalendar.tsx"
Cohesion: 0.33
Nodes (8): dayLabel(), MonthKey, monthKeyOf(), monthLabel(), SavedCalendar(), SavedCalendarProps, shiftMonth(), WEEKDAYS

### Community 110 - "saved/[guid]/route.ts"
Cohesion: 0.48
Nodes (6): badGuid(), badToken(), DELETE(), dynamic, PUT(), RouteContext

### Community 112 - "explore-interactions.spec.ts"
Cohesion: 0.29
Nodes (6): allEvents, base, eventsFor(), installRoutes(), manhattanEvent, queensEvent

### Community 114 - "EventExplorer"
Cohesion: 0.16
Nodes (12): EventExplorer(), changeFilters(), restoreFilters(), eventsPath(), mergeWithoutDuplicates(), parseFilterSearchParams(), dateFor(), writeFilterSearchParams() (+4 more)

### Community 115 - "EventExplorer.tsx"
Cohesion: 0.23
Nodes (8): EventExplorerProps, boroughs, Header(), ListMapToggle(), ListMapToggleProps, View, SearchBar(), EventPage

### Community 116 - "list_saved_events"
Cohesion: 0.25
Nodes (11): get_profile(), list_saved_events(), _profile_contract(), Any, DeviceToken, get, put, Idempotently add one current Event to this Profile's Saved list. (+3 more)

### Community 117 - "test_event_provenance.py"
Cohesion: 0.33
Nodes (8): parametrize, requires_docker, Issue #13 executable gates for single-Event provenance., _source_row(), test_free_status_is_never_inferred_from_silence_or_ambiguous_text(), test_missing_source_facts_are_absent_not_negative_claims(), test_positive_source_language_sets_only_positive_derived_flags(), test_single_event_returns_complete_provenance_and_preserves_raw_source()

### Community 118 - "FollowFacets.tsx"
Cohesion: 0.43
Nodes (6): Followable, followableFacets(), FollowFacets(), filterLabel(), FacetType, followInterest()

### Community 119 - "EventSource"
Cohesion: 0.50
Nodes (3): EventSource, The narrow transport contract used by the synchronization job., Protocol

### Community 120 - "Trust and system states"
Cohesion: 0.67
Nodes (3): Global freshness banner, Required states, Trust and system states

## Knowledge Gaps
- **290 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+285 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `conftest.py`, `test_concierge.py`, `CurrentEvent`, `ingest_rows`, `_event_to_contract`, `test_event_lifecycle.py`, `test_profiles.py`, `SocrataClient`, `CurrentEventSearch`, `TestParseEvent`, `test_interests_matches.py`, `get_settings`, `test_ingestion.py`, `sync_events`, `TestIngestionWithDb`, `test_contract.py`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `get_session_factory()` connect `get_session_factory` to `save_event_tool`, `conftest.py`, `app/concierge.py`, `CurrentEvent`, `events.py`, `test_interests_matches.py`, `get_settings`, `routes/concierge.py`, `_get_or_create_profile`, `list_saved_events`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `save_event_tool`, `conftest.py`, `ingest_rows`, `_event_to_contract`, `events.py`, `get_session_factory`, `socrata.py`, `test_interests_matches.py`, `get_settings`, `sync_events`, `test_ingestion.py`, `list_saved_events`, `test_event_provenance.py`, `TestIngestionWithDb`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 24 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _290 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `ContractMockTests` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._