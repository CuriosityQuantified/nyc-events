# Graph Report - nyc-events-fullstack-38  (2026-08-15)

## Corpus Check
- 92 files · ~43,873 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 676 nodes · 1017 edges · 64 communities (45 shown, 19 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.51)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5c8f4623`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- page.tsx
- Core screens
- NYC Events — Handoff Document
- ContractMockTests
- MockTransport
- Language
- CLAUDE.md
- scripts
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
- validate_contract.py
- EventMatch NYC API contract
- compilerOptions
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- devDependencies
- conftest.py
- TestHealthEndpoint
- frontend/README.md
- layout.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- shell.spec.ts
- load_fixture
- nyc-events-backend
- parse_event
- events.py
- test_migrations.py
- AlwaysErrorTransport
- socrata.py
- CredentialFilter
- SocrataError
- SocrataClient
- .handle_async_request
- railway_release.py
- validate_workflows
- tsconfig.tests.json
- api-contract.test.ts
- CI/CD extension matrix
- route.ts
- backend_container_smoke.sh

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 32 edges
2. `SocrataClient` - 26 edges
3. `parse_event()` - 23 edges
4. `Event` - 21 edges
5. `ingest_rows()` - 20 edges
6. `SocrataError` - 18 edges
7. `MockTransport` - 16 edges
8. `AlwaysErrorTransport` - 16 edges
9. `TestParseEvent` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CredentialFilter` --uses--> `Event`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py
- `SocrataClient` --uses--> `Event`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py
- `SocrataError` --uses--> `Event`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py
- `AlwaysErrorTransport` --uses--> `Event`  [INFERRED]
  backend/tests/conftest.py → backend/app/models/event.py
- `MockTransport` --uses--> `Event`  [INFERRED]
  backend/tests/conftest.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (64 total, 19 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "page.tsx"
Cohesion: 0.07
Nodes (31): BottomNav(), event, DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), DesktopSidebar(), costBadgeClass() (+23 more)

### Community 2 - "Core screens"
Cohesion: 0.11
Nodes (19): 1. Discover, 2. Results explorer, 3. Map view, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens (+11 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.06
Nodes (32): Accessibility baseline, Application shell, Consensus basis, Consensus summary, Defer, Desktop, EventMatch NYC — Initial Frontend Direction, Global freshness banner (+24 more)

### Community 4 - "ContractMockTests"
Cohesion: 0.11
Nodes (13): BaseHTTPRequestHandler, ContractHandler, create_server(), fact_value(), filter_events(), load_json(), main(), parse_positive_int() (+5 more)

### Community 5 - "MockTransport"
Cohesion: 0.16
Nodes (10): MockTransport, Transport-layer mock that intercepts httpx requests. Returns paginated…, Verify that credential values never appear in log output., Log output during a request must not contain API key values., Verify the client pages through all results and stops on empty., The client must fetch all pages and combine the rows., The client must stop when an empty page is returned., The client must retry on 503 and succeed when the server recovers. (+2 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "scripts"
Cohesion: 0.08
Nodes (23): dependencies, next, react, react-dom, name, private, scripts, build (+15 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "validate_contract.py"
Cohesion: 0.37
Nodes (12): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+4 more)

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
Cohesion: 0.08
Nodes (25): @axe-core/playwright, eslint, eslint-config-next, devDependencies, @axe-core/playwright, eslint, eslint-config-next, jsdom (+17 more)

### Community 26 - "conftest.py"
Cohesion: 0.07
Nodes (42): async_sessionmaker, AsyncClient, AsyncEngine, get_engine(), get_session_factory(), AsyncSession, Async SQLAlchemy engine and session factory., Return a singleton async engine. (+34 more)

### Community 27 - "TestHealthEndpoint"
Cohesion: 0.11
Nodes (11): requires_docker, Tests for the /health endpoint., Verify the health endpoint reports service status correctly., Return JSON with status, database, and Redis keys., With a real Postgres container, database must report connected., The integration gate requires both real backing services., Without a running Redis, the endpoint must return 503 and degraded status., Verify deployment cutover can identify the exact running revision. (+3 more)

### Community 28 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 38 - "load_fixture"
Cohesion: 0.07
Nodes (34): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, _build_validator(), _load_spec(), Any (+26 more)

### Community 45 - "parse_event"
Cohesion: 0.11
Nodes (18): _derive_registration(), _normalize_socrata_url(), parse_event(), Any, Normalize a Socrata URL string or object without changing the raw row., Derive registration status and provenance from source fields., Convert a Socrata row dict to Event model field values. Returns a dict suitable…, Verify raw Socrata rows are correctly parsed into Event fields. (+10 more)

### Community 46 - "events.py"
Cohesion: 0.17
Nodes (21): _boolean_fact(), _date_fact(), _datetime_fact(), _event_to_contract(), get_event(), list_events(), Any, get (+13 more)

### Community 47 - "test_migrations.py"
Cohesion: 0.24
Nodes (9): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Revision 0002 must downgrade, upgrade, and re-upgrade cleanly., Parallel migration work must not leave an undeployable split head., test_events_migration_upgrade_and_idempotency(), test_migration_history_has_exactly_one_head() (+1 more)

### Community 48 - "AlwaysErrorTransport"
Cohesion: 0.28
Nodes (6): AlwaysErrorTransport, Transport that always returns the given error status code., Tests for the Socrata client — pagination, retry, credential filtering, parsing., The client must raise after all retries are exhausted., Verify exponential-backoff retry on server errors., TestRetry

### Community 51 - "socrata.py"
Cohesion: 0.06
Nodes (39): get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, Event, Event SQLAlchemy model for NYC Parks events., A single NYC Parks event identified by its source guid. (+31 more)

### Community 52 - "CredentialFilter"
Cohesion: 0.29
Nodes (5): CredentialFilter, Prevent credential values from appearing in log output., Allow only the fixed NYC Open Data HTTPS query origin., _validated_endpoint(), LogRecord

### Community 53 - "SocrataError"
Cohesion: 0.22
Nodes (7): Response, POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., Raised when the Socrata API returns an unrecoverable error., SocrataError, Exception

### Community 54 - "SocrataClient"
Cohesion: 0.25
Nodes (8): Async client for the Socrata NYC Parks Events API. Uses HTTP Basic…, SocrataClient, Verify that transport-layer substitution prevents real network access., The Socrata client with an injected transport must not reach the network. The…, TestNetworkEnforcement, Reject unsafe endpoints and malformed source responses., TestResponseValidation, parametrize

### Community 56 - "railway_release.py"
Cohesion: 0.17
Nodes (24): ArgumentParser, Namespace, capture_revision(), choose_origin(), deployment_command(), deployment_records(), discover(), domain_names() (+16 more)

### Community 57 - "validate_workflows"
Cohesion: 0.21
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

## Knowledge Gaps
- **170 isolated node(s):** `nyc-events-backend`, `DayInfo`, `DAY_NAMES`, `categories`, `boroughs` (+165 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Event` connect `socrata.py` to `MockTransport`, `load_fixture`, `events.py`, `AlwaysErrorTransport`, `CredentialFilter`, `SocrataError`, `SocrataClient`, `conftest.py`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `load_fixture()` connect `load_fixture` to `MockTransport`, `parse_event`, `AlwaysErrorTransport`, `socrata.py`, `conftest.py`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `get_settings()` connect `socrata.py` to `conftest.py`, `CredentialFilter`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `SocrataClient` (e.g. with `Event` and `TestIngestionWithDb`) actually correct?**
  _`SocrataClient` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `Event` (e.g. with `Base` and `CredentialFilter`) actually correct?**
  _`Event` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `DayInfo`, `DAY_NAMES` to the rest of the system?**
  _170 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._