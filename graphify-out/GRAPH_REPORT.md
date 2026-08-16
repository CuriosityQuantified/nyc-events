# Graph Report - nyc-events  (2026-08-16)

## Corpus Check
- 169 files · ~115,618 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1340 nodes · 2621 edges · 107 communities (86 shown, 21 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 153 edges (avg confidence: 0.56)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5ba9d7d0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- BottomNav.tsx
- Core screens
- NYC Events — Handoff Document
- ContractMockTests
- CredentialFilter
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
- SavedProvider.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- events.ts
- CurrentEvent
- nyc-events-backend
- TestParseEvent
- profile_preferences.py
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
- preferences.py
- socrata.py
- SocrataClient
- EventExplorer.tsx
- Issue #13 backend handoff
- DateStrip.tsx
- ParkEvent
- test_ingestion.py
- env.py
- load_fixture
- apiToUiEvent
- Issue #26 frontend handoff
- TrustStatus.tsx
- SocrataError
- maps.ts
- Issue #19 backend handoff
- Issue #21 backend handoff
- preferences.ts
- SavedView.tsx
- _event_to_contract
- services/__init__.py
- test_interests_matches.py
- apiBaseUrl
- accessibility_evidence
- maps.spec.ts
- thumbnail/route.ts
- saved.spec.ts
- test_event_provenance.py
- Application shell
- follow_interest
- profile.spec.ts

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
- `search_current_events()` --uses--> `CurrentEvent`  [INFERRED]
  backend/app/concierge_tools.py → backend/app/models/event.py
- `get_current_event()` --uses--> `CurrentEvent`  [INFERRED]
  backend/app/concierge_tools.py → backend/app/models/event.py
- `_event_to_contract()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (107 total, 21 thin omitted)

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

### Community 5 - "CredentialFilter"
Cohesion: 0.20
Nodes (8): CredentialFilter, Prevent credential values from appearing in log output., Allow only the fixed NYC Open Data HTTPS query origin., _validated_endpoint(), Verify that credential values never appear in log output., Log output during a request must not contain API key values., TestCredentialFiltering, LogRecord

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "events.py"
Cohesion: 0.11
Nodes (29): _calendar_date_fact(), _date_fact(), _datetime_fact(), _derived_boolean_fact(), get_event(), get_freshness(), get_ingestion_health(), list_event_changes() (+21 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "get_session_factory"
Cohesion: 0.09
Nodes (34): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., dismiss_match(), delete, Response, Idempotently stop following one Profile-owned Interest. (+26 more)

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
Cohesion: 0.21
Nodes (15): dynamic, GET(), ApiEventsResponse, apiFetch(), ApiFreshness, EVENT_LIFECYCLE_STATUSES, EventPage, FACT_FIELDS (+7 more)

### Community 38 - "CurrentEvent"
Cohesion: 0.15
Nodes (15): Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), CurrentEvent, EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs. (+7 more)

### Community 45 - "TestParseEvent"
Cohesion: 0.10
Nodes (11): Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents., Coordinates must be parsed into lat/lon floats., Pipe-delimited categories must be split into a list., Registration not required.' maps to not_required., The live Socrata URL object must imply registration and stay raw. (+3 more)

### Community 46 - "profile_preferences.py"
Cohesion: 0.19
Nodes (20): apply_concierge_preference(), _event_matches_interest(), match_new_events(), _normalize_preference(), PreferenceConflictError, PreferenceValidationError, AsyncSession, Interest (+12 more)

### Community 47 - "test_sync_worker.py"
Cohesion: 0.09
Nodes (30): get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, Secret-free operational evidence for one attempted synchronization., SyncRun, EventSource (+22 more)

### Community 48 - "test_pipeline_contract.py"
Cohesion: 0.13
Nodes (17): CurrentEventSearch, get_current_event(), Any, BaseModel, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden. (+9 more)

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
Cohesion: 0.11
Nodes (34): AsyncClient, Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., MatchedEvent, PreferenceAudit, Profile, Anonymous Profile and Saved Event persistence models. (+26 more)

### Community 66 - "EventDetail.tsx"
Cohesion: 0.12
Nodes (18): EventDetail(), load(), EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance() (+10 more)

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

### Community 73 - "preferences.py"
Cohesion: 0.14
Nodes (18): AsyncEngine, get_engine(), Async SQLAlchemy engine and session factory., Return a singleton async engine., deployment_revision(), health_check(), lifespan(), get (+10 more)

### Community 74 - "socrata.py"
Cohesion: 0.10
Nodes (33): _content_hash(), _derive_borough(), _derive_registration(), ingest_events(), _is_explicitly_cancelled(), _location_key(), _missing_classification(), _normalize_socrata_url() (+25 more)

### Community 75 - "SocrataClient"
Cohesion: 0.13
Nodes (17): Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., SocrataClient, MockTransport, Transport-layer mock that intercepts httpx requests. Returns paginated…, parametrize, Tests for the Socrata client — pagination, retry, credential filtering, parsing., The client must raise after all retries are exhausted. (+9 more)

### Community 76 - "EventExplorer.tsx"
Cohesion: 0.06
Nodes (51): dynamic, GET(), emptyPage, { getFilteredEvents }, event, routerPush, EventExplorer(), changeFilters() (+43 more)

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 79 - "ParkEvent"
Cohesion: 0.39
Nodes (7): costBadgeClass(), costLabel(), EventCard(), EventCardProps, useSaved(), SaveHeart(), ParkEvent

### Community 80 - "test_ingestion.py"
Cohesion: 0.19
Nodes (8): AlwaysErrorTransport, Response, Transport that always returns the given error status code., Tests for event ingestion — snapshot deltas, guid identity, network isolation., Verify that transport-layer substitution prevents real network access., The Socrata client with an injected transport must not reach the network. The…, TestNetworkEnforcement, Request

### Community 81 - "env.py"
Cohesion: 0.23
Nodes (11): do_run_migrations(), get_url(), Alembic environment configuration for async SQLAlchemy., Return the database URL from application settings., Run migrations in offline mode (emit SQL without connecting)., Execute migrations against the provided connection., Run migrations in online mode with an async engine., Run migrations in online mode. (+3 more)

### Community 82 - "load_fixture"
Cohesion: 0.05
Nodes (47): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, _build_validator(), Draft202012Validator, requires_docker (+39 more)

### Community 83 - "apiToUiEvent"
Cohesion: 0.08
Nodes (13): apiToUiEvent(), formatDate(), formatTime(), AuditedPage, listEvent, AuditedPage, fixtureEvent, AuditedPage (+5 more)

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "TrustStatus.tsx"
Cohesion: 0.24
Nodes (10): COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime(), FreshnessBanner(), FreshnessBannerProps, STATUS_COPY, current (+2 more)

### Community 86 - "SocrataError"
Cohesion: 0.22
Nodes (7): Response, POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., Raised when the Socrata API returns an unrecoverable error., SocrataError, Exception

### Community 87 - "maps.ts"
Cohesion: 0.16
Nodes (19): EventMap(), EventMapProps, markerLabel(), MarkerPosition, markerPositions(), MapThumbnail(), MapThumbnailProps, Coordinate (+11 more)

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
Cohesion: 0.15
Nodes (14): boroughs, Header(), dayLabel(), isMonthKey(), MonthKey, monthKeyOf(), monthLabel(), SavedCalendar() (+6 more)

### Community 93 - "_event_to_contract"
Cohesion: 0.19
Nodes (18): _event_to_contract(), list_events(), Convert an Event model instance to the contract Event shape., Return a paginated list of events with optional filters., _load_spec(), Any, Load the OpenAPI spec., _event() (+10 more)

### Community 96 - "test_interests_matches.py"
Cohesion: 0.30
Nodes (15): Interest, One durable Facet followed by a Profile., _headers(), parametrize, requires_docker, Issue #21 Interest, Match, preference, migration, and security gates., test_concierge_rejection_is_write_free_and_approval_is_idempotent(), test_concurrent_concierge_approval_executes_once() (+7 more)

### Community 97 - "apiBaseUrl"
Cohesion: 0.14
Nodes (25): DELETE(), dynamic, badToken(), dynamic, FACET_TYPES, GET(), PUT(), badGuid() (+17 more)

### Community 100 - "accessibility_evidence"
Cohesion: 0.33
Nodes (8): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts()

### Community 102 - "maps.spec.ts"
Cohesion: 0.25
Nodes (6): AuditedPage, events, invalid, multiple, shared, source

### Community 103 - "thumbnail/route.ts"
Cohesion: 0.15
Nodes (12): dynamic, GET(), { getEvent, EventsApiError }, ALLOWED_PARAMS, dynamic, errorResponse(), GET(), event (+4 more)

### Community 106 - "test_event_provenance.py"
Cohesion: 0.33
Nodes (8): parametrize, requires_docker, Issue #13 executable gates for single-Event provenance., _source_row(), test_free_status_is_never_inferred_from_silence_or_ambiguous_text(), test_missing_source_facts_are_absent_not_negative_claims(), test_positive_source_language_sets_only_positive_derived_flags(), test_single_event_returns_complete_provenance_and_preserves_raw_source()

### Community 107 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 110 - "follow_interest"
Cohesion: 0.17
Nodes (17): follow_interest(), _interest_contract(), InterestRequest, list_interests(), list_matches(), promote_match(), Any, BaseModel (+9 more)

## Knowledge Gaps
- **286 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+281 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_current_event()` connect `test_pipeline_contract.py` to `CurrentEvent`, `events.py`, `get_session_factory`, `railway_release.py`, `_event_to_contract`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `load_fixture()` connect `load_fixture` to `test_interests_matches.py`, `conftest.py`, `CredentialFilter`, `SocrataClient`, `TestParseEvent`, `test_sync_worker.py`, `test_ingestion.py`, `test_pipeline_contract.py`, `_event_to_contract`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `conftest.py`, `events.py`, `preferences.py`, `socrata.py`, `test_event_provenance.py`, `profile_preferences.py`, `test_sync_worker.py`, `test_pipeline_contract.py`, `test_ingestion.py`, `load_fixture`, `get_session_factory`, `_event_to_contract`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _286 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `ContractMockTests` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._