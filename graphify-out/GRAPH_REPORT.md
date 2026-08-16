# Graph Report - nyc-events  (2026-08-16)

## Corpus Check
- 169 files · ~109,232 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1352 nodes · 2636 edges · 115 communities (89 shown, 26 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 153 edges (avg confidence: 0.56)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c97a62a`
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
- events/route.ts
- nyc-events-backend
- TestParseEvent
- EventExplorer
- test_sync_worker.py
- CurrentEvent
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
- getEvent
- test_migrations.py
- preferences.py
- socrata.py
- SocrataClient
- filters.ts
- Issue #13 backend handoff
- DateStrip.tsx
- EventCard.tsx
- .handle_async_request
- Initial MVP scope
- load_fixture
- filter-state.spec.ts
- Issue #26 frontend handoff
- test_contract.py
- maps.ts
- Issue #19 backend handoff
- Issue #21 backend handoff
- preferences.ts
- SavedView.tsx
- test_current_event_dates.py
- services/__init__.py
- apiBaseUrl
- EventSource
- accessibility_evidence
- maps.spec.ts
- scripts
- saved.spec.ts
- test_event_provenance.py
- Application shell
- EventExplorer.tsx
- profile.spec.ts
- dependencies
- test_events.py
- freshness-status.spec.ts
- package.json
- eslint-config-next
- jsdom
- prettier
- @testing-library/react

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
- `test_current_events_fallback_is_consistent_across_api_and_consumers()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_current_event_dates.py → backend/app/concierge_tools.py
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `_event_to_contract()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `list_event_changes()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `list_matches()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/preferences.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (115 total, 26 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "ingest_rows"
Cohesion: 0.17
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
Cohesion: 0.09
Nodes (41): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., _calendar_date_fact(), _date_fact(), _datetime_fact(), _derived_boolean_fact() (+33 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "_get_or_create_profile"
Cohesion: 0.07
Nodes (43): dismiss_match(), follow_interest(), _interest_contract(), InterestRequest, list_interests(), promote_match(), Any, BaseModel (+35 more)

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
Cohesion: 0.17
Nodes (20): dynamic, GET(), dynamic, GET(), ApiEventsResponse, apiFetch(), ApiFreshness, apiToUiEvent() (+12 more)

### Community 38 - "events/route.ts"
Cohesion: 0.28
Nodes (7): dynamic, GET(), emptyPage, { getFilteredEvents }, isAllowedValue(), valueFor(), parseStrictFilterSearchParams()

### Community 45 - "TestParseEvent"
Cohesion: 0.09
Nodes (14): parametrize, Reject unsafe endpoints and malformed source responses., Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats., Pipe-delimited categories must be split into a list. (+6 more)

### Community 46 - "EventExplorer"
Cohesion: 0.17
Nodes (11): EventExplorer(), changeFilters(), restoreFilters(), eventsPath(), mergeWithoutDuplicates(), parseFilterSearchParams(), writeFilterSearchParams(), EventDetailPageProps (+3 more)

### Community 47 - "test_sync_worker.py"
Cohesion: 0.13
Nodes (18): Secret-free operational evidence for one attempted synchronization., SyncRun, RuntimeError, Raised when another worker owns the distributed synchronization lock., Run one locked Snapshot synchronization from the standalone worker., run(), SyncAlreadyRunning, BlockingSource (+10 more)

### Community 48 - "CurrentEvent"
Cohesion: 0.08
Nodes (33): CurrentEventSearch, get_current_event(), Any, BaseModel, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden. (+25 more)

### Community 51 - "EventMatch NYC — Initial Frontend Direction"
Cohesion: 0.18
Nodes (9): Accessibility baseline, Consensus basis, Consensus summary, EventMatch NYC — Initial Frontend Direction, Global freshness banner, Product definition, Required states, Trust and system states (+1 more)

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
Cohesion: 0.06
Nodes (80): AsyncClient, Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., Interest, MatchedEvent, PreferenceAudit, Profile (+72 more)

### Community 66 - "EventDetail.tsx"
Cohesion: 0.12
Nodes (18): EventDetail(), load(), EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance() (+10 more)

### Community 69 - "0004_event_lifecycle.py"
Cohesion: 0.50
Nodes (3): _content_hash(), Any, upgrade()

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 71 - "getEvent"
Cohesion: 0.32
Nodes (5): dynamic, GET(), { getEvent, EventsApiError }, EventsApiError, getEvent()

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "preferences.py"
Cohesion: 0.10
Nodes (27): AsyncEngine, get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, get_engine(), Async SQLAlchemy engine and session factory. (+19 more)

### Community 74 - "socrata.py"
Cohesion: 0.07
Nodes (43): _content_hash(), _derive_borough(), _derive_registration(), ingest_events(), _is_explicitly_cancelled(), _location_key(), _missing_classification(), _normalize_socrata_url() (+35 more)

### Community 75 - "SocrataClient"
Cohesion: 0.08
Nodes (24): CredentialFilter, Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., Prevent credential values from appearing in log output., SocrataClient, AlwaysErrorTransport, MockTransport, Transport-layer mock that intercepts httpx requests. Returns paginated… (+16 more)

### Community 76 - "filters.ts"
Cohesion: 0.12
Nodes (24): FilterChips(), setExactDate(), FilterChipsProps, GROUPS, Followable, followableFacets(), FollowFacets(), applyEventFilters() (+16 more)

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 79 - "EventCard.tsx"
Cohesion: 0.20
Nodes (13): costBadgeClass(), costLabel(), EventCard(), COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime(), FreshnessBanner() (+5 more)

### Community 81 - "Initial MVP scope"
Cohesion: 0.67
Nodes (3): Defer, Include, Initial MVP scope

### Community 82 - "load_fixture"
Cohesion: 0.15
Nodes (10): load_fixture(), Load a JSON fixture file by name from the fixtures directory., requires_docker, A malformed row must not leave a partially ingested Snapshot., Verify atomic current Snapshot replacement and archival retention., All events from snapshot_a must be stored in the database., A live Socrata URL object must ingest and retain its raw shape., Ingesting snapshot_b after snapshot_a must add 1 new event and update 1 changed… (+2 more)

### Community 83 - "filter-state.spec.ts"
Cohesion: 0.11
Nodes (7): AuditedPage, listEvent, AuditedPage, fixtureEvent, AuditedPage, firstPage, nextEvent

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "test_contract.py"
Cohesion: 0.15
Nodes (13): _build_validator(), _load_spec(), Any, Draft202012Validator, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec. (+5 more)

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
Cohesion: 0.21
Nodes (13): MatchesSection(), FACET_TYPE_LABELS, ProfileView(), dismissMatch(), fetchInterests(), fetchMatches(), followInterest(), headers() (+5 more)

### Community 92 - "SavedView.tsx"
Cohesion: 0.15
Nodes (16): EventCardProps, dayLabel(), isMonthKey(), MonthKey, monthKeyOf(), monthLabel(), SavedCalendar(), SavedCalendarProps (+8 more)

### Community 93 - "test_current_event_dates.py"
Cohesion: 0.27
Nodes (13): _event(), _event_validator(), datetime, Draft202012Validator, parametrize, requires_docker, Regression gates for canonical current-event calendar dates (issue #68)., test_current_events_fallback_is_consistent_across_api_and_consumers() (+5 more)

### Community 97 - "apiBaseUrl"
Cohesion: 0.16
Nodes (23): DELETE(), dynamic, badToken(), dynamic, FACET_TYPES, GET(), PUT(), badGuid() (+15 more)

### Community 99 - "EventSource"
Cohesion: 0.50
Nodes (3): EventSource, The narrow transport contract used by the synchronization job., Protocol

### Community 100 - "accessibility_evidence"
Cohesion: 0.33
Nodes (8): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts()

### Community 102 - "maps.spec.ts"
Cohesion: 0.20
Nodes (8): AuditedPage, events, invalid, multiple, shared, source, TILE_PNG, unlocatable

### Community 103 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format:check, lint, pretest, start, test (+5 more)

### Community 106 - "test_event_provenance.py"
Cohesion: 0.33
Nodes (8): parametrize, requires_docker, Issue #13 executable gates for single-Event provenance., _source_row(), test_free_status_is_never_inferred_from_silence_or_ambiguous_text(), test_missing_source_facts_are_absent_not_negative_claims(), test_positive_source_language_sets_only_positive_derived_flags(), test_single_event_returns_complete_provenance_and_preserves_raw_source()

### Community 107 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 108 - "EventExplorer.tsx"
Cohesion: 0.13
Nodes (15): BottomNav(), event, routerPush, DesktopSidebar(), EventExplorerProps, boroughs, Header(), ListMapToggle() (+7 more)

### Community 112 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, leaflet, next, react, react-dom, @types/leaflet, leaflet, next (+3 more)

### Community 113 - "test_events.py"
Cohesion: 0.14
Nodes (8): requires_docker, Tests for the events API endpoints., Verify that GET /events returns stored Events in contract shape., Verify that GET /events/{guid} uses the source guid., Verify Event and Location identity rules., TestGetEvent, TestIdentity, TestListEvents

### Community 117 - "freshness-status.spec.ts"
Cohesion: 0.33
Nodes (3): AuditedPage, lifecycleEvents, sourceEvents

### Community 119 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **290 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+285 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_current_event()` connect `CurrentEvent` to `events.py`, `railway_release.py`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `load_fixture()` connect `load_fixture` to `conftest.py`, `ingest_rows`, `test_event_lifecycle.py`, `socrata.py`, `SocrataClient`, `TestParseEvent`, `test_sync_worker.py`, `CurrentEvent`, `test_events.py`, `test_contract.py`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `conftest.py`, `events.py`, `preferences.py`, `socrata.py`, `test_event_provenance.py`, `test_sync_worker.py`, `test_events.py`, `load_fixture`, `_get_or_create_profile`, `test_current_event_dates.py`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _290 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `ContractMockTests` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._