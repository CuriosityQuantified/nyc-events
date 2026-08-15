# Graph Report - nyc-events  (2026-08-15)

## Corpus Check
- 6 files · ~21,221 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 77 nodes · 73 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7089526d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- Core screens
- ParkMatch NYC — Initial Frontend Direction
- NYC Events — Handoff Document
- 8. Desired user-facing features
- 3. Map view
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff` - 13 edges
2. `NYC Events — Handoff Document` - 12 edges
3. `ParkMatch NYC — Initial Frontend Direction` - 10 edges
4. `Development pipeline — nyc-events` - 7 edges
5. `Core screens` - 7 edges
6. `2. Results explorer` - 5 edges
7. `8. Desired user-facing features` - 5 edges
8. `3. Map view` - 4 edges
9. `Application shell` - 3 edges
10. `4. Event detail` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (8 total, 1 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.25
Nodes (7): CI, Code graph, Current state — NO application code yet, Development pipeline — nyc-events, Gate commands, Identity, Issue map (2026-08-15)

### Community 1 - "Core screens"
Cohesion: 0.13
Nodes (15): 1. Discover, 2. Results explorer, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens, Detail sections (+7 more)

### Community 2 - "ParkMatch NYC — Initial Frontend Direction"
Cohesion: 0.13
Nodes (15): Accessibility baseline, Application shell, Consensus basis, Consensus summary, Defer, Desktop, Global freshness banner, Include (+7 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.14
Nodes (12): 10. Future data integrations, 11. Completion criteria for the first implementation, 1. Project concept, 2. Local project path, 3. Primary data source, 4. Local API configuration, 5. SODA3 request pattern, 6. Required synchronization architecture (+4 more)

### Community 4 - "8. Desired user-facing features"
Cohesion: 0.40
Nodes (5): 8. Desired user-facing features, AI concierge, Event exploration, Saved preferences and notifications, Social distribution

### Community 5 - "3. Map view"
Cohesion: 0.50
Nodes (4): 3. Map view, Location identity, Marker sizing, Required behavior

### Community 6 - "419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff"
Cohesion: 0.14
Nodes (13): 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff, Assets and supporting files, CJX-ready UX contract, Coding checklist for AI tools, Color and brand contract, Design fidelity contract, Entry points, Implementation sequence for AI coding tools (+5 more)

## Knowledge Gaps
- **56 isolated node(s):** `Identity`, `Current state — NO application code yet`, `Gate commands`, `Code graph`, `CI` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ParkMatch NYC — Initial Frontend Direction` connect `ParkMatch NYC — Initial Frontend Direction` to `Core screens`, `NYC Events — Handoff Document`?**
  _High betweenness centrality (0.342) - this node is a cross-community bridge._
- **Why does `Core screens` connect `Core screens` to `ParkMatch NYC — Initial Frontend Direction`, `3. Map view`?**
  _High betweenness centrality (0.261) - this node is a cross-community bridge._
- **Why does `NYC Events — Handoff Document` connect `NYC Events — Handoff Document` to `8. Desired user-facing features`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **What connects `Identity`, `Current state — NO application code yet`, `Gate commands` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core screens` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `ParkMatch NYC — Initial Frontend Direction` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `NYC Events — Handoff Document` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._