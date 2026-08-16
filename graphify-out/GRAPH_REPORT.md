# Graph Report - nyc-events-fullstack-51  (2026-08-16)

## Corpus Check
- 144 files · ~99,398 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1193 nodes · 2233 edges · 100 communities (79 shown, 21 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 144 edges (avg confidence: 0.56)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d6fd2451`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- EventExplorer.tsx
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
- layout.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- events.ts
- load_fixture
- nyc-events-backend
- parse_event
- conftest.py
- filters.ts
- test_pipeline_contract.py
- EventMatch NYC — Initial Frontend Direction
- 0003_current_repository_sync_runs.py
- 2. Results explorer
- 8. Desired user-facing features
- TestIngestionWithDb
- railway_release.py
- WorkflowPolicyTests
- tsconfig.tests.json
- api-contract.test.ts
- CI/CD extension matrix
- revision/route.ts
- backend_container_smoke.sh
- 3. Map view
- Any
- EventDetail.tsx
- start.sh
- BackendContainerSmokeTests
- 0004_event_lifecycle.py
- Issue #15 backend handoff
- get_session_factory
- test_migrations.py
- SocrataError
- test_ingestion.py
- TrustStatus.tsx
- events/route.ts
- Issue #13 backend handoff
- DateStrip.tsx
- CredentialFilter
- test_contract.py
- test_event_lifecycle.py
- socrata.py
- apiToUiEvent
- Issue #26 frontend handoff
- EventRepository
- Initial MVP scope
- maps.ts
- Issue #19 backend handoff
- Issue #21 backend handoff
- BottomNav.tsx
- test_event_provenance.py
- _normalize_socrata_url
- services/__init__.py
- Application shell
- sync_events
- _parse_datetime

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 67 edges
2. `ingest_rows()` - 47 edges
3. `CurrentEvent` - 36 edges
4. `get_session_factory()` - 33 edges
5. `parse_event()` - 30 edges
6. `EventRepository` - 24 edges
7. `SocrataError` - 24 edges
8. `WorkflowPolicyTests` - 24 edges
9. `_event_to_contract()` - 23 edges
10. `SocrataClient` - 23 edges

## Surprising Connections (you probably didn't know these)
- `test_concierge_input_bounds_fail_closed()` --uses--> `CurrentEventSearch`  [INFERRED]
  backend/tests/test_pipeline_contract.py → backend/app/concierge_tools.py
- `search_current_events()` --uses--> `CurrentEvent`  [INFERRED]
  backend/app/concierge_tools.py → backend/app/models/event.py
- `get_current_event()` --uses--> `CurrentEvent`  [INFERRED]
  backend/app/concierge_tools.py → backend/app/models/event.py
- `_event_to_contract()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `list_event_changes()` --uses--> `EventRepository`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (100 total, 21 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "EventExplorer.tsx"
Cohesion: 0.10
Nodes (22): EventDetail(), load(), EventExplorer(), changeFilters(), restoreFilters(), EventExplorerProps, eventsPath(), mergeWithoutDuplicates() (+14 more)

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
Cohesion: 0.09
Nodes (22): Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, Close the HTTP client if this instance created it., SocrataClient, MockTransport, Transport-layer mock that intercepts httpx requests. Returns paginated…, parametrize, Tests for the Socrata client — pagination, retry, credential filtering, parsing., The client must raise after all retries are exhausted. (+14 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "CurrentEvent"
Cohesion: 0.12
Nodes (33): CurrentEvent, One Event in the latest complete successful source Snapshot., _date_fact(), _datetime_fact(), _derived_boolean_fact(), _event_to_contract(), get_event(), get_freshness() (+25 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "preferences.py"
Cohesion: 0.13
Nodes (30): dismiss_match(), follow_interest(), _interest_contract(), InterestRequest, list_interests(), list_matches(), promote_match(), Any (+22 more)

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

### Community 34 - "events.ts"
Cohesion: 0.14
Nodes (21): dynamic, GET(), { getEvent, EventsApiError }, dynamic, GET(), apiBaseUrl(), ApiEventsResponse, apiFetch() (+13 more)

### Community 38 - "load_fixture"
Cohesion: 0.10
Nodes (18): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, parametrize, requires_docker, Issue #11 API gates for composable Event facet filters. (+10 more)

### Community 45 - "parse_event"
Cohesion: 0.13
Nodes (13): _parse_date(), parse_event(), Convert MM/DD/YYYY to ISO date string, or return None., Convert a Socrata row dict to Event model field values. Returns a dict suitable…, Verify raw Socrata rows are correctly parsed into Event fields., Stated fields must carry their raw values through., Borough, dates, and registration must be derived correctly., Absent fields must return None / Not listed equivalents. (+5 more)

### Community 46 - "conftest.py"
Cohesion: 0.06
Nodes (80): Secret-free operational evidence for one attempted synchronization., SyncRun, Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., Interest, MatchedEvent, PreferenceAudit (+72 more)

### Community 47 - "filters.ts"
Cohesion: 0.17
Nodes (16): event, FilterChips(), FilterChipsProps, GROUPS, ParkEvent, applyEventFilters(), dateRange(), EMPTY_FILTERS (+8 more)

### Community 48 - "test_pipeline_contract.py"
Cohesion: 0.13
Nodes (14): CurrentEventSearch, get_current_event(), Any, BaseModel, The two bounded, read-only Event data operations used by the concierge., Validated search inputs with a hard result bound., Search only the latest current Snapshot in deterministic order., Retrieve one current Event by source guid; archival rows stay hidden. (+6 more)

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

### Community 55 - "TestIngestionWithDb"
Cohesion: 0.12
Nodes (8): requires_docker, A malformed row must not leave a partially ingested Snapshot., Verify atomic current Snapshot replacement and archival retention., All events from snapshot_a must be stored in the database., A live Socrata URL object must ingest and retain its raw shape., Ingesting snapshot_b after snapshot_a must add 1 new event and update 1 changed…, Duplicate guid must update, not create a second row., TestIngestionWithDb

### Community 56 - "railway_release.py"
Cohesion: 0.08
Nodes (50): ArgumentParser, BaseException, derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any (+42 more)

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

### Community 65 - "Any"
Cohesion: 0.15
Nodes (13): _content_hash(), _is_explicitly_cancelled(), _optional_text(), _present_classification(), Any, Response, POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API. (+5 more)

### Community 66 - "EventDetail.tsx"
Cohesion: 0.14
Nodes (16): EventDetailContent(), EventDetailProps, formatDate(), formatTime(), LoadState, normalizeProvenance(), PresentedFact, presentFact() (+8 more)

### Community 69 - "0004_event_lifecycle.py"
Cohesion: 0.50
Nodes (3): _content_hash(), Any, upgrade()

### Community 70 - "Issue #15 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #15 backend handoff, Ordered next actions, Required phases, State

### Community 71 - "get_session_factory"
Cohesion: 0.13
Nodes (22): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., get_profile(), list_saved_events(), _profile_contract(), Any (+14 more)

### Community 72 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 73 - "SocrataError"
Cohesion: 0.06
Nodes (50): AsyncEngine, get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, get_engine(), Async SQLAlchemy engine and session factory. (+42 more)

### Community 74 - "test_ingestion.py"
Cohesion: 0.19
Nodes (8): AlwaysErrorTransport, Response, Transport that always returns the given error status code., Tests for event ingestion — snapshot deltas, guid identity, network isolation., Verify that transport-layer substitution prevents real network access., The Socrata client with an injected transport must not reach the network. The…, TestNetworkEnforcement, Request

### Community 75 - "TrustStatus.tsx"
Cohesion: 0.18
Nodes (14): costBadgeClass(), costLabel(), EventCard(), EventCardProps, COVERAGE_LABEL, EventLifecycleStatus(), EventStatusProps, formatSyncTime() (+6 more)

### Community 76 - "events/route.ts"
Cohesion: 0.27
Nodes (8): dynamic, GET(), emptyPage, { getFilteredEvents }, getFilteredEvents(), isAllowedValue(), valueFor(), parseStrictFilterSearchParams()

### Community 77 - "Issue #13 backend handoff"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Commands and results, Issue #13 backend handoff, Ordered next actions, Required phases, State

### Community 78 - "DateStrip.tsx"
Cohesion: 0.33
Nodes (6): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), getUpcomingDates(), NYC_DATE_FORMATTER

### Community 79 - "CredentialFilter"
Cohesion: 0.25
Nodes (6): AsyncClient, CredentialFilter, Prevent credential values from appearing in log output., Allow only the fixed NYC Open Data HTTPS query origin., _validated_endpoint(), LogRecord

### Community 80 - "test_contract.py"
Cohesion: 0.16
Nodes (12): _build_validator(), _load_spec(), Any, requires_docker, Contract tests — validate API responses against the OpenAPI schema., Load the OpenAPI spec., Build a JSON Schema validator for a given $ref in the OpenAPI spec., Validate real API responses against the OpenAPI contract schema. (+4 more)

### Community 81 - "test_event_lifecycle.py"
Cohesion: 0.40
Nodes (9): _changes(), requires_docker, Issue #16 executable API gates for Event lifecycle classification., test_absence_is_expired_or_removed_and_never_cancelled(), test_committed_snapshots_classify_new_changed_and_unchanged_through_api(), test_content_hash_is_stable_for_key_order_and_changes_with_content(), test_explicit_cancellation_surfaces_without_word_inference(), test_generated_api_schema_documents_lifecycle_contract() (+1 more)

### Community 82 - "socrata.py"
Cohesion: 0.14
Nodes (17): accessibility_evidence(), explicit_free_evidence(), Any, Conservative provenance evidence extracted from source Event text., Return only source-owned text fields that can support derived claims., Return source text that explicitly says an Event is free. The result is…, Return source text that mentions accessibility without judging it., _source_texts() (+9 more)

### Community 83 - "apiToUiEvent"
Cohesion: 0.06
Nodes (20): apiToUiEvent(), formatDate(), formatTime(), AuditedPage, listEvent, AuditedPage, FilterKey, fixtureEvent (+12 more)

### Community 84 - "Issue #26 frontend handoff"
Cohesion: 0.22
Nodes (8): Blocker, CI/CD delta, Commands and results, Completed acceptance areas, Issue #26 frontend handoff, Ownership, Remaining ordered actions, State

### Community 85 - "EventRepository"
Cohesion: 0.28
Nodes (8): EventFields, EventRepository, Current, archival, and synchronization persistence models., Columns shared by the current Snapshot and archival repository., The union of all source Events observed in successful Sync Runs., _missing_classification(), Classify an absent row without treating absence as cancellation., datetime

### Community 86 - "Initial MVP scope"
Cohesion: 0.67
Nodes (3): Defer, Include, Initial MVP scope

### Community 87 - "maps.ts"
Cohesion: 0.11
Nodes (26): ALLOWED_PARAMS, dynamic, errorResponse(), GET(), event, { getEvent, EventsApiError }, VARIANTS, EventMap() (+18 more)

### Community 88 - "Issue #19 backend handoff"
Cohesion: 0.20
Nodes (9): Acceptance criteria, CI/CD delta, Commands and results, Files, Issue #19 backend handoff, Ordered next actions, Ownership, Required phases (+1 more)

### Community 89 - "Issue #21 backend handoff"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Commands and results, Issue #21 backend handoff, Ordered next actions, Ownership, Required phases, State

### Community 90 - "BottomNav.tsx"
Cohesion: 0.32
Nodes (5): BottomNav(), DesktopSidebar(), coreNavItems, NavItem, sidebarNavItems

### Community 92 - "test_event_provenance.py"
Cohesion: 0.33
Nodes (8): parametrize, requires_docker, Issue #13 executable gates for single-Event provenance., _source_row(), test_free_status_is_never_inferred_from_silence_or_ambiguous_text(), test_missing_source_facts_are_absent_not_negative_claims(), test_positive_source_language_sets_only_positive_derived_flags(), test_single_event_returns_complete_provenance_and_preserves_raw_source()

### Community 93 - "_normalize_socrata_url"
Cohesion: 0.50
Nodes (4): _derive_registration(), _normalize_socrata_url(), Normalize a Socrata URL string or object without changing the raw row., Derive registration status and provenance from source fields.

### Community 96 - "Application shell"
Cohesion: 0.67
Nodes (3): Application shell, Desktop, Mobile

### Community 97 - "sync_events"
Cohesion: 0.25
Nodes (8): EventSource, ingest_events(), AsyncSession, Atomically archive a valid Snapshot and replace the current dataset., Fetch and store one complete Snapshot with durable attempt evidence., The narrow transport contract used by the synchronization job., sync_events(), Protocol

## Knowledge Gaps
- **259 isolated node(s):** `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }`, `dynamic`, `{ getFilteredEvents }` (+254 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_fixture()` connect `load_fixture` to `SocrataClient`, `SocrataError`, `test_ingestion.py`, `parse_event`, `conftest.py`, `test_contract.py`, `test_event_lifecycle.py`, `test_pipeline_contract.py`, `TestIngestionWithDb`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `get_current_event()` connect `test_pipeline_contract.py` to `CurrentEvent`, `railway_release.py`, `get_session_factory`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `CurrentEvent` connect `CurrentEvent` to `sync_events`, `load_fixture`, `get_session_factory`, `SocrataError`, `test_ingestion.py`, `conftest.py`, `test_pipeline_contract.py`, `socrata.py`, `EventRepository`, `TestIngestionWithDb`, `test_event_provenance.py`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `CurrentEvent` (e.g. with `get_current_event()` and `search_current_events()`) actually correct?**
  _`CurrentEvent` has 19 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `start.sh script`, `{ getEvent, EventsApiError }` to the rest of the system?**
  _259 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `EventExplorer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._