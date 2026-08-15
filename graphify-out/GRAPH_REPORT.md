# Graph Report - nyc-events  (2026-08-15)

## Corpus Check
- 27 files · ~28,065 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 159 nodes · 172 edges · 23 communities (13 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0748897c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- ParkMatch NYC — Initial Frontend Direction
- Core screens
- NYC Events — Handoff Document
- mock_server.py
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- Language
- CLAUDE.md
- ContractMockTests
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

## God Nodes (most connected - your core abstractions)
1. `419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff` - 13 edges
2. `NYC Events — Handoff Document` - 12 edges
3. `ContractMockTests` - 10 edges
4. `ParkMatch NYC — Initial Frontend Direction` - 10 edges
5. `Development pipeline — nyc-events` - 9 edges
6. `verify_csv_reference()` - 7 edges
7. `Core screens` - 7 edges
8. `ContractHandler` - 6 edges
9. `create_server()` - 6 edges
10. `load_json()` - 6 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (23 total, 10 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state — NO application code yet, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "ParkMatch NYC — Initial Frontend Direction"
Cohesion: 0.12
Nodes (15): Accessibility baseline, Application shell, Consensus basis, Consensus summary, Defer, Desktop, Global freshness banner, Include (+7 more)

### Community 2 - "Core screens"
Cohesion: 0.11
Nodes (19): 1. Discover, 2. Results explorer, 3. Map view, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens (+11 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.12
Nodes (17): 10. Future data integrations, 11. Completion criteria for the first implementation, 1. Project concept, 2. Local project path, 3. Primary data source, 4. Local API configuration, 5. SODA3 request pattern, 6. Required synchronization architecture (+9 more)

### Community 4 - "mock_server.py"
Cohesion: 0.22
Nodes (9): BaseHTTPRequestHandler, ContractHandler, fact_value(), filter_events(), load_json(), parse_positive_int(), Any, Path (+1 more)

### Community 5 - "419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff"
Cohesion: 0.14
Nodes (13): 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff, Assets and supporting files, CJX-ready UX contract, Coding checklist for AI tools, Color and brand contract, Design fidelity contract, Entry points, Implementation sequence for AI coding tools (+5 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "ContractMockTests"
Cohesion: 0.22
Nodes (4): create_server(), main(), ContractMockTests, ThreadingHTTPServer

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

### Community 19 - "validate_contract.py"
Cohesion: 0.37
Nodes (12): derived_registration(), load_json(), local_iso(), main(), parsed_coordinates(), Any, Path, reject_nonlocal_refs() (+4 more)

### Community 20 - "EventMatch NYC API contract"
Cohesion: 0.50
Nodes (3): EventMatch NYC API contract, Run the mock, Validate

## Knowledge Gaps
- **79 isolated node(s):** `Identity`, `Current state — NO application code yet`, `Stack — decided 2026-08-15`, `Gate commands`, `Code graph` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ParkMatch NYC — Initial Frontend Direction` connect `ParkMatch NYC — Initial Frontend Direction` to `Core screens`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `Core screens` connect `Core screens` to `ParkMatch NYC — Initial Frontend Direction`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `NYC Events — Handoff Document` connect `NYC Events — Handoff Document` to `ParkMatch NYC — Initial Frontend Direction`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `Identity`, `Current state — NO application code yet`, `Stack — decided 2026-08-15` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `ParkMatch NYC — Initial Frontend Direction` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Core screens` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._