# Graph Report - nyc-events-composite  (2026-08-16)

## Corpus Check
- 180 files · ~116,149 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1507 nodes · 2970 edges · 120 communities (95 shown, 25 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 157 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8fbfb3d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- routes/concierge.py
- Core screens
- NYC Events — Handoff Document
- ContractMockTests
- sync_events
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
- _get_or_create_profile
- EventMatch NYC
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
- parse_event
- test_profiles.py
- EventExplorer
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
- parseEventResponse
- revision/route.ts
- backend_container_smoke.sh
- 3. Map view
- conftest.py
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
- TrustStatus.tsx
- get_session_factory
- SavedProvider.tsx
- load_fixture
- apiToUiEvent
- Issue #26 frontend handoff
- test_contract.py
- CredentialFilter
- ParkEvent
- Issue #19 backend handoff
- Issue #21 backend handoff
- AlwaysErrorTransport
- preferences.py
- explore-interactions.spec.ts
- services/__init__.py
- maps.spec.ts
- apiBaseUrl
- CurrentEvent
- current_event_search.py
- validate_contract.py
- EventCard.tsx
- scripts
- accessibility_evidence
- saved.spec.ts
- events/route.ts
- Application shell
- SavedView.tsx
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
1. `load_fixture()` - 75 edges
2. `ingest_rows()` - 55 edges
3. `CurrentEvent` - 45 edges
4. `get_session_factory()` - 39 edges
5. `parse_event()` - 30 edges
6. `_event_to_contract()` - 29 edges
7. `EventRepository` - 26 edges
8. `Interest` - 26 edges
9. `WorkflowPolicyTests` - 26 edges
10. `validate_workflows()` - 25 edges

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

### Community 5 - "sync_events"
Cohesion: 0.14
Nodes (10): AsyncSession, Fetch and store one complete Snapshot with durable attempt evidence., sync_events(), Any, AsyncSession, Return the current row count and the API's deterministic first guid., snapshot_evidence(), FixtureSource (+2 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "events.py"
Cohesion: 0.11
Nodes (34): _calendar_date_fact(), _date_fact(), _datetime_fact(), _derived_boolean_fact(), _event_to_contract(), get_event(), get_freshness(), get_ingestion_health() (+26 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "_get_or_create_profile"
Cohesion: 0.13
Nodes (27): dismiss_match(), follow_interest(), _interest_contract(), list_interests(), list_matches(), promote_match(), Any, delete (+19 more)

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

### Community 29 - "test_current_event_dates.py"
Cohesion: 0.27
Nodes (12): _event(), _event_validator(), datetime, Draft202012Validator, parametrize, requires_docker, Regression gates for canonical current-event calendar dates (issue #68)., test_current_events_fallback_is_consistent_across_api_and_consumers() (+4 more)

### Community 34 - "events.ts"
Cohesion: 0.15
Nodes (18): dynamic, GET(), { getEvent, EventsApiError }, dynamic, GET(), ApiEventsResponse, apiFetch(), ApiFreshness (+10 more)

### Community 38 - "app/concierge.py"
Cohesion: 0.12
Nodes (22): ConciergeSettings, get_concierge_settings(), BaseSettings, Concierge-specific environment configuration., Settings that are required only when the concierge is enabled., create_default_concierge_agent(), Constrained LangChain Deep Agent for current Event discovery and saving., Build the production OpenRouter-backed concierge with a fallback model. (+14 more)

### Community 45 - "parse_event"
Cohesion: 0.07
Nodes (31): _derive_borough(), _location_key(), _parse_categories(), _parse_coordinates(), _parse_date(), parse_event(), Convert MM/DD/YYYY to ISO date string, or return None., Parse coordinate string into (lat, lon, coordinate_list). Returns the first… (+23 more)

### Community 46 - "test_profiles.py"
Cohesion: 0.40
Nodes (9): _headers(), requires_docker, Issue #19 API, persistence, migration, and security gates., test_browser_preflight_allows_only_the_profile_write_contract(), test_profile_api_rejects_bad_tokens_and_unknown_events(), test_profile_is_created_anonymously_and_keyed_by_hashed_device_token(), test_profile_schema_is_anonymous_by_default_and_collects_no_contact_data(), test_save_list_and_unsave_are_idempotent_and_isolated_by_profile() (+1 more)

### Community 47 - "EventExplorer"
Cohesion: 0.17
Nodes (11): EventExplorer(), changeFilters(), restoreFilters(), eventsPath(), mergeWithoutDuplicates(), parseFilterSearchParams(), writeFilterSearchParams(), EventDetailPageProps (+3 more)

### Community 48 - "preferences.ts"
Cohesion: 0.23
Nodes (14): Followable, followableFacets(), FollowFacets(), MatchesSection(), filterLabel(), dismissMatch(), FacetType, fetchMatches() (+6 more)

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

### Community 60 - "parseEventResponse"
Cohesion: 0.40
Nodes (5): dynamic, GET(), EventDetail(), load(), parseEventResponse()

### Community 64 - "3. Map view"
Cohesion: 0.50
Nodes (4): 3. Map view, Location identity, Marker sizing, Required behavior

### Community 65 - "conftest.py"
Cohesion: 0.05
Nodes (89): Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), Secret-free operational evidence for one attempted synchronization., SyncRun, Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., Interest (+81 more)

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
Cohesion: 0.08
Nodes (37): ConciergeContext, create_concierge_agent(), enforce_concierge_tool_allowlist(), Any, BaseChatModel, date, Save one current Event after the human approves this exact Event ID., Prevent even a malformed model response from invoking harness tools. (+29 more)

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "get_settings"
Cohesion: 0.09
Nodes (27): get_settings(), BaseSettings, Return a cached Settings instance., Settings loaded from environment variables., Settings, EventSource, The narrow transport contract used by the synchronization job., _main() (+19 more)

### Community 74 - "socrata.py"
Cohesion: 0.12
Nodes (26): _content_hash(), _derive_registration(), ingest_events(), _is_explicitly_cancelled(), _missing_classification(), _normalize_socrata_url(), _optional_text(), _parse_datetime() (+18 more)

### Community 75 - "SocrataClient"
Cohesion: 0.09
Nodes (21): Response, Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., SocrataClient, MockTransport (+13 more)

### Community 76 - "EventExplorer.tsx"
Cohesion: 0.10
Nodes (27): event, routerPush, EventExplorerProps, FilterChips(), setExactDate(), FilterChipsProps, GROUPS, ListMapToggle() (+19 more)

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 79 - "TrustStatus.tsx"
Cohesion: 0.24
Nodes (10): COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime(), FreshnessBanner(), FreshnessBannerProps, STATUS_COPY, current (+2 more)

### Community 80 - "get_session_factory"
Cohesion: 0.15
Nodes (19): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., get_profile(), list_saved_events(), _profile_contract(), Any (+11 more)

### Community 81 - "SavedProvider.tsx"
Cohesion: 0.20
Nodes (12): chronological(), SavedContext, SavedContextValue, SavedProvider(), generateToken(), getDeviceToken(), fetchSavedEvents(), headers() (+4 more)

### Community 82 - "load_fixture"
Cohesion: 0.08
Nodes (29): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, parametrize, requires_docker, Issue #11 API gates for composable Event facet filters. (+21 more)

### Community 83 - "apiToUiEvent"
Cohesion: 0.08
Nodes (13): apiToUiEvent(), formatDate(), formatTime(), AuditedPage, listEvent, AuditedPage, fixtureEvent, AuditedPage (+5 more)

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "test_contract.py"
Cohesion: 0.15
Nodes (13): _build_validator(), _load_spec(), Any, Draft202012Validator, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec. (+5 more)

### Community 86 - "CredentialFilter"
Cohesion: 0.22
Nodes (7): AsyncClient, CredentialFilter, Prevent credential values from appearing in log output., Verify that credential values never appear in log output., Log output during a request must not contain API key values., TestCredentialFiltering, LogRecord

### Community 87 - "ParkEvent"
Cohesion: 0.07
Nodes (39): ALLOWED_PARAMS, dynamic, errorResponse(), GET(), event, { getEvent, EventsApiError }, VARIANTS, escapeAttribute() (+31 more)

### Community 88 - "Issue #19 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #19 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 89 - "Issue #21 backend handoff"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Commands and results, Issue #21 backend handoff, Ordered next actions, Ownership, Required phases, State

### Community 90 - "AlwaysErrorTransport"
Cohesion: 0.22
Nodes (7): AlwaysErrorTransport, Request, Response, Transport that always returns the given error status code., Verify that transport-layer substitution prevents real network access., The Socrata client with an injected transport must not reach the network. The…, TestNetworkEnforcement

### Community 92 - "preferences.py"
Cohesion: 0.09
Nodes (26): AsyncEngine, Application configuration via environment variables., get_engine(), Async SQLAlchemy engine and session factory., Return a singleton async engine., deployment_revision(), health_check(), lifespan() (+18 more)

### Community 93 - "explore-interactions.spec.ts"
Cohesion: 0.29
Nodes (6): allEvents, base, eventsFor(), installRoutes(), manhattanEvent, queensEvent

### Community 96 - "maps.spec.ts"
Cohesion: 0.20
Nodes (8): AuditedPage, events, invalid, multiple, shared, source, TILE_PNG, unlocatable

### Community 97 - "apiBaseUrl"
Cohesion: 0.15
Nodes (23): DELETE(), dynamic, badToken(), dynamic, FACET_TYPES, GET(), PUT(), badGuid() (+15 more)

### Community 99 - "CurrentEvent"
Cohesion: 0.12
Nodes (22): CurrentEventSearch, get_current_event(), Any, BaseModel, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden. (+14 more)

### Community 100 - "current_event_search.py"
Cohesion: 0.21
Nodes (11): _all_current_event_values(), CurrentEventSearch, _literal_contains(), Any, BaseModel, Server-owned SQL search over the latest complete Event Snapshot., Structured, bounded search over the latest ``current_events`` Snapshot., Build one searchable SQL text projection from every table column. (+3 more)

### Community 101 - "validate_contract.py"
Cohesion: 0.37
Nodes (12): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+4 more)

### Community 102 - "EventCard.tsx"
Cohesion: 0.39
Nodes (6): costBadgeClass(), costLabel(), EventCard(), EventCardProps, useSaved(), SaveHeart()

### Community 103 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format:check, lint, pretest, start, test (+5 more)

### Community 104 - "accessibility_evidence"
Cohesion: 0.33
Nodes (8): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts()

### Community 106 - "events/route.ts"
Cohesion: 0.27
Nodes (8): dynamic, GET(), emptyPage, { getFilteredEvents }, getFilteredEvents(), isAllowedValue(), valueFor(), parseStrictFilterSearchParams()

### Community 107 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 108 - "SavedView.tsx"
Cohesion: 0.11
Nodes (18): BottomNav(), DesktopSidebar(), boroughs, Header(), FACET_TYPE_LABELS, interestLabel(), ProfileView(), isMonthKey() (+10 more)

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
- **303 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+298 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `conftest.py`, `CurrentEvent`, `sync_events`, `test_concierge.py`, `get_settings`, `SocrataClient`, `parse_event`, `test_profiles.py`, `TestGetEvent`, `test_contract.py`, `CredentialFilter`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `get_session_factory()` connect `get_session_factory` to `routes/concierge.py`, `conftest.py`, `CurrentEvent`, `current_event_search.py`, `app/concierge.py`, `test_concierge.py`, `events.py`, `get_settings`, `_get_or_create_profile`, `preferences.py`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 25 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _303 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `ContractMockTests` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._
- **Should `sync_events` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._