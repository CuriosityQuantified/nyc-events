# Graph Report - nyc-events-backend  (2026-08-15)

## Corpus Check
- 54 files · ~34,762 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 437 nodes · 690 edges · 36 communities (25 shown, 11 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.51)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af6464d8`
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
- parse_event
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
- socrata.py
- load_fixture
- TestHealthEndpoint
- conftest.py
- nyc-events-backend
- events.py

## God Nodes (most connected - your core abstractions)
1. `load_fixture()` - 32 edges
2. `SocrataClient` - 26 edges
3. `parse_event()` - 22 edges
4. `Event` - 21 edges
5. `ingest_rows()` - 20 edges
6. `SocrataError` - 18 edges
7. `MockTransport` - 16 edges
8. `AlwaysErrorTransport` - 16 edges
9. `TestParseEvent` - 16 edges
10. `_event_to_contract()` - 13 edges

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

## Communities (36 total, 11 thin omitted)

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
Nodes (43): AsyncClient, CredentialFilter, Response, POST to the Socrata endpoint with exponential-backoff retry., Fetch one page of events from the Socrata API., Page through all events until an empty page returns., Prevent credential values from appearing in log output., Raised when the Socrata API returns an unrecoverable error. (+35 more)

### Community 4 - "ContractMockTests"
Cohesion: 0.11
Nodes (13): BaseHTTPRequestHandler, ContractHandler, create_server(), fact_value(), filter_events(), load_json(), main(), parse_positive_int() (+5 more)

### Community 5 - "419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff"
Cohesion: 0.14
Nodes (13): 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff, Assets and supporting files, CJX-ready UX contract, Coding checklist for AI tools, Color and brand contract, Design fidelity contract, Entry points, Implementation sequence for AI coding tools (+5 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "parse_event"
Cohesion: 0.07
Nodes (24): _derive_borough(), _derive_registration(), _location_key(), _normalize_socrata_url(), _parse_categories(), _parse_coordinates(), _parse_date(), parse_event() (+16 more)

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "validate_contract.py"
Cohesion: 0.24
Nodes (16): _parse_datetime(), Convert 'YYYY-MM-DD HH:MM:SS' to a timezone-aware datetime., derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any (+8 more)

### Community 20 - "EventMatch NYC API contract"
Cohesion: 0.50
Nodes (3): EventMatch NYC API contract, Run the mock, Validate

### Community 23 - "socrata.py"
Cohesion: 0.06
Nodes (46): get_settings(), Application configuration via environment variables., Return a cached Settings instance., Settings loaded from environment variables., Settings, get_engine(), Async SQLAlchemy engine and session factory., Return a singleton async engine. (+38 more)

### Community 24 - "load_fixture"
Cohesion: 0.07
Nodes (33): ingest_rows(), load_fixture(), Any, Load a JSON fixture file by name from the fixtures directory., Parse raw Socrata rows and merge them into the database. This is the shared…, _build_validator(), _load_spec(), Any (+25 more)

### Community 25 - "TestHealthEndpoint"
Cohesion: 0.15
Nodes (8): requires_docker, Tests for the /health endpoint., Verify the health endpoint reports service status correctly., The health endpoint must return a JSON body with status, database, and redis…, With a real Postgres container, database must report connected., Without a running Redis, the endpoint must return 503 and degraded status., Response must contain exactly the three required fields., TestHealthEndpoint

### Community 26 - "conftest.py"
Cohesion: 0.13
Nodes (20): Dispose of the current engine. Use for testing or reconfiguration., reset_engine(), _check_docker(), client(), db_session(), _maybe_start_postgres(), postgres_url(), Test fixtures using Testcontainers for real Postgres. (+12 more)

### Community 33 - "events.py"
Cohesion: 0.14
Nodes (25): async_sessionmaker, get_session_factory(), AsyncSession, Return a singleton async session factory., _boolean_fact(), _date_fact(), _datetime_fact(), _event_to_contract() (+17 more)

## Knowledge Gaps
- **80 isolated node(s):** `nyc-events-backend`, `Identity`, `Current state — NO application code yet`, `Stack — decided 2026-08-15`, `Gate commands` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Event` connect `socrata.py` to `load_fixture`, `events.py`, `conftest.py`, `SocrataClient`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `load_fixture()` connect `load_fixture` to `parse_event`, `conftest.py`, `SocrataClient`, `socrata.py`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `get_settings()` connect `socrata.py` to `conftest.py`, `SocrataClient`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `SocrataClient` (e.g. with `Event` and `TestIngestionWithDb`) actually correct?**
  _`SocrataClient` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `Event` (e.g. with `Base` and `CredentialFilter`) actually correct?**
  _`Event` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nyc-events-backend`, `Identity`, `Current state — NO application code yet` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._