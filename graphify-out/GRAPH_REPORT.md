# Graph Report - nyc-events-workflow-setup  (2026-08-15)

## Corpus Check
- 17 files · ~24,251 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 112 nodes · 97 edges · 19 communities (9 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c50db908`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- ParkMatch NYC — Initial Frontend Direction
- Core screens
- NYC Events — Handoff Document
- 8. Desired user-facing features
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- Language
- CLAUDE.md
- 2. Results explorer
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

## God Nodes (most connected - your core abstractions)
1. `419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff` - 13 edges
2. `NYC Events — Handoff Document` - 12 edges
3. `ParkMatch NYC — Initial Frontend Direction` - 10 edges
4. `Development pipeline — nyc-events` - 9 edges
5. `Core screens` - 7 edges
6. `Parallel development lanes` - 5 edges
7. `8. Desired user-facing features` - 5 edges
8. `2. Results explorer` - 5 edges
9. `Language` - 4 edges
10. `3. Map view` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (19 total, 10 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state — NO application code yet, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "ParkMatch NYC — Initial Frontend Direction"
Cohesion: 0.13
Nodes (15): Accessibility baseline, Application shell, Consensus basis, Consensus summary, Defer, Desktop, Global freshness banner, Include (+7 more)

### Community 2 - "Core screens"
Cohesion: 0.14
Nodes (14): 1. Discover, 3. Map view, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens, Detail sections (+6 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.14
Nodes (12): 10. Future data integrations, 11. Completion criteria for the first implementation, 1. Project concept, 2. Local project path, 3. Primary data source, 4. Local API configuration, 5. SODA3 request pattern, 6. Required synchronization architecture (+4 more)

### Community 4 - "8. Desired user-facing features"
Cohesion: 0.40
Nodes (5): 8. Desired user-facing features, AI concierge, Event exploration, Saved preferences and notifications, Social distribution

### Community 5 - "419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff"
Cohesion: 0.14
Nodes (13): 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff, Assets and supporting files, CJX-ready UX contract, Coding checklist for AI tools, Color and brand contract, Design fidelity contract, Entry points, Implementation sequence for AI coding tools (+5 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "2. Results explorer"
Cohesion: 0.40
Nodes (5): 2. Results explorer, Event cards, Filters, Shareable state, Sort options

### Community 9 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Checks, Lane, Verification, What and why

## Knowledge Gaps
- **77 isolated node(s):** `Identity`, `Current state — NO application code yet`, `Stack — decided 2026-08-15`, `Gate commands`, `Code graph` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ParkMatch NYC — Initial Frontend Direction` connect `ParkMatch NYC — Initial Frontend Direction` to `Core screens`, `NYC Events — Handoff Document`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `Core screens` connect `Core screens` to `2. Results explorer`, `ParkMatch NYC — Initial Frontend Direction`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `NYC Events — Handoff Document` connect `NYC Events — Handoff Document` to `8. Desired user-facing features`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **What connects `Identity`, `Current state — NO application code yet`, `Stack — decided 2026-08-15` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `ParkMatch NYC — Initial Frontend Direction` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Core screens` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._