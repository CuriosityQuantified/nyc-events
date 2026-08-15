# Graph Report - nyc-events  (2026-08-15)

## Corpus Check
- 53 files · ~34,389 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 427 nodes · 643 edges · 37 communities (26 shown, 11 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd775271`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- NYC Events — Handoff Document
- Core screens
- SocrataClient
- ContractMockTests
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- Language
- CLAUDE.md
- socrata.py
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
- env.py
- load_fixture
- TestHealthEndpoint
- client
- nyc-events-backend
- events.py
- test_migrations.py

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 28 edges
2. `SocrataClient` - 23 edges
3. `parse_event()` - 19 edges
4. `ingest_rows()` - 19 edges
5. `Event` - 16 edges
6. `MockTransport` - 14 edges
7. `SocrataError` - 13 edges
8. `419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff` - 13 edges
9. `get_settings()` - 12 edges
10. `get_session_factory()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `_event_to_contract()` --uses--> `Event`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `get_event()` --uses--> `Event`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `list_events()` --uses--> `Event`  [INFERRED]
  backend/app/routes/events.py → backend/app/models/event.py
- `ingest_events()` --uses--> `Event`  [INFERRED]
  backend/app/socrata.py → backend/app/models/event.py
- `db_session()` --uses--> `Event`  [INFERRED]
  backend/tests/conftest.py → backend/app/models/event.py

## Import Cycles
- None detected.

## Communities (37 total, 11 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state — NO application code yet, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "NYC Events — Handoff Document"
Cohesion: 0.06
Nodes (32): Accessibility baseline, Application shell, Consensus basis, Consensus summary, Defer, Desktop, Global freshness banner, Include (+24 more)

### Community 2 - "Core screens"
Cohesion: 0.11
Nodes (19): 1. Discover, 2. Results explorer, 3. Map view, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens (+11 more)

### Community 3 - "SocrataClient"
Cohesion: 0.06
Nodes (40): CredentialFilter, Any, Response, Close the HTTP client if this instance created it., POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., Prevent credential values from appearing in log output. (+32 more)

### Community 4 - "ContractMockTests"
Cohesion: 0.11
Nodes (13): BaseHTTPRequestHandler, ContractHandler, create_server(), fact_value(), filter_events(), load_json(), main(), parse_positive_int() (+5 more)

### Community 5 - "419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff"
Cohesion: 0.14
Nodes (13): 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff, Assets and supporting files, CJX-ready UX contract, Coding checklist for AI tools, Color and brand contract, Design fidelity contract, Entry points, Implementation sequence for AI coding tools (+5 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "socrata.py"
Cohesion: 0.08
Nodes (31): _derive_borough(), _derive_registration(), ingest_events(), _location_key(), _parse_categories(), _parse_coordinates(), _parse_date(), _parse_datetime() (+23 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "validate_contract.py"
Cohesion: 0.33
Nodes (13): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+5 more)

### Community 20 - "EventMatch NYC API contract"
Cohesion: 0.50
Nodes (3): EventMatch NYC API contract, Run the mock, Validate

### Community 23 - "env.py"
Cohesion: 0.23
Nodes (11): do_run_migrations(), get_url(), Alembic environment configuration for async SQLAlchemy., Return the database URL from application settings., Run migrations in offline mode (emit SQL without connecting)., Execute migrations against the provided connection., Run migrations in online mode with an async engine., Run migrations in online mode. (+3 more)

### Community 24 - "load_fixture"
Cohesion: 0.06
Nodes (41): Event, Event SQLAlchemy model for NYC Parks events., A single NYC Parks event identified by its source guid., Base, SQLAlchemy model definitions., Base class for all SQLAlchemy models., ingest_rows(), load_fixture() (+33 more)

### Community 25 - "TestHealthEndpoint"
Cohesion: 0.15
Nodes (8): requires_docker, Tests for the /health endpoint., Verify the health endpoint reports service status correctly., The health endpoint must return a JSON body with status, database, and redis…, With a real Postgres container, database must report connected., Without a running Redis, the endpoint must return 503 and degraded status., Response must contain exactly the three required fields., TestHealthEndpoint

### Community 26 - "client"
Cohesion: 0.22
Nodes (11): AsyncClient, _check_docker(), client(), db_session(), _maybe_start_postgres(), postgres_url(), Return the async Postgres URL (skips if Docker unavailable)., Provide an async test client for the FastAPI app. (+3 more)

### Community 33 - "events.py"
Cohesion: 0.07
Nodes (47): async_sessionmaker, get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, get_engine(), get_session_factory() (+39 more)

### Community 34 - "test_migrations.py"
Cohesion: 0.29
Nodes (7): _alembic(), requires_docker, Migration regression gates for the Events schema., Run Alembic exactly as the deployment pre-start gate does., Revision 0002 must downgrade, upgrade, and re-upgrade cleanly., test_events_migration_upgrade_and_idempotency(), CompletedProcess

## Knowledge Gaps
- **80 isolated node(s):** `nyc-events-backend`, `Identity`, `Current state — NO application code yet`, `Stack — decided 2026-08-15`, `Gate commands` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Event` connect `load_fixture` to `socrata.py`, `events.py`, `client`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `load_fixture()` connect `load_fixture` to `socrata.py`, `SocrataClient`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `get_settings()` connect `events.py` to `socrata.py`, `load_fixture`, `SocrataClient`, `env.py`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `SocrataClient` (e.g. with `TestNetworkEnforcement` and `TestCredentialFiltering`) actually correct?**
  _`SocrataClient` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `Event` (e.g. with `_event_to_contract()` and `get_event()`) actually correct?**
  _`Event` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `Identity`, `Current state — NO application code yet` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._