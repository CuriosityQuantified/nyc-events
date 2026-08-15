# Graph Report - nyc-events-frontend  (2026-08-15)

## Corpus Check
- 50 files · ~30,539 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 281 nodes · 306 edges · 36 communities (22 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ce20cc35`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Development pipeline — nyc-events
- page.tsx
- events.ts
- NYC Events — Handoff Document
- ContractMockTests
- Core screens
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
- ParkMatch NYC — Initial Frontend Direction
- devDependencies
- 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff
- include
- frontend/README.md
- layout.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff` - 13 edges
3. `NYC Events — Handoff Document` - 12 edges
4. `ContractMockTests` - 10 edges
5. `ParkMatch NYC — Initial Frontend Direction` - 10 edges
6. `Development pipeline — nyc-events` - 9 edges
7. `scripts` - 8 edges
8. `verify_csv_reference()` - 7 edges
9. `include` - 7 edges
10. `Core screens` - 7 edges

## Surprising Connections (you probably didn't know these)
- `getNext7Days()` --calls--> `getUpcomingDates()`  [EXTRACTED]
  frontend/app/components/DateStrip.tsx → frontend/app/data/dates.ts
- `EventCardProps` --references--> `ParkEvent`  [EXTRACTED]
  frontend/app/components/EventCard.tsx → frontend/app/data/events.ts

## Import Cycles
- None detected.

## Communities (36 total, 14 thin omitted)

### Community 0 - "Development pipeline — nyc-events"
Cohesion: 0.14
Nodes (13): CI, Claiming work, Code graph, Conflict hazards, Current state — NO application code yet, Development pipeline — nyc-events, Gate commands, Identity (+5 more)

### Community 1 - "page.tsx"
Cohesion: 0.12
Nodes (14): BottomNav(), DesktopSidebar(), categories, FilterChips(), boroughs, Header(), ListMapToggle(), ListMapToggleProps (+6 more)

### Community 2 - "events.ts"
Cohesion: 0.15
Nodes (15): DateStrip(), DAY_NAMES, DayInfo, getNext7Days(), costBadgeClass(), costLabel(), EventCard(), EventCardProps (+7 more)

### Community 3 - "NYC Events — Handoff Document"
Cohesion: 0.11
Nodes (17): 10. Future data integrations, 11. Completion criteria for the first implementation, 1. Project concept, 2. Local project path, 3. Primary data source, 4. Local API configuration, 5. SODA3 request pattern, 6. Required synchronization architecture (+9 more)

### Community 4 - "ContractMockTests"
Cohesion: 0.11
Nodes (13): BaseHTTPRequestHandler, ContractHandler, create_server(), fact_value(), filter_events(), load_json(), main(), parse_positive_int() (+5 more)

### Community 5 - "Core screens"
Cohesion: 0.11
Nodes (19): 1. Discover, 2. Results explorer, 3. Map view, 4. Event detail, 5. Ask / AI concierge, 6. Saved events / My Plans, Above the fold, Core screens (+11 more)

### Community 6 - "Language"
Cohesion: 0.33
Nodes (5): EventMatch NYC, Language, People and their lists, Provenance, Source data

### Community 8 - "scripts"
Cohesion: 0.11
Nodes (18): dependencies, next, react, react-dom, name, private, scripts, build (+10 more)

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
Cohesion: 0.11
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 24 - "ParkMatch NYC — Initial Frontend Direction"
Cohesion: 0.12
Nodes (15): Accessibility baseline, Application shell, Consensus basis, Consensus summary, Defer, Desktop, Global freshness banner, Include (+7 more)

### Community 25 - "devDependencies"
Cohesion: 0.13
Nodes (15): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, @playwright/test, @types/node, @types/react (+7 more)

### Community 26 - "419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff"
Cohesion: 0.14
Nodes (13): 419495f4-0ca6-4d45-b6e3-43e1e35536d5 implementation handoff, Assets and supporting files, CJX-ready UX contract, Coding checklist for AI tools, Color and brand contract, Design fidelity contract, Entry points, Implementation sequence for AI coding tools (+5 more)

### Community 27 - "include"
Cohesion: 0.20
Nodes (9): exclude, include, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+1 more)

### Community 28 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **140 isolated node(s):** `DayInfo`, `DAY_NAMES`, `categories`, `boroughs`, `ListMapToggleProps` (+135 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Core screens` connect `Core screens` to `ParkMatch NYC — Initial Frontend Direction`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `ParkMatch NYC — Initial Frontend Direction` connect `ParkMatch NYC — Initial Frontend Direction` to `Core screens`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `DayInfo`, `DAY_NAMES`, `categories` to the rest of the system?**
  _140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Development pipeline — nyc-events` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12318840579710146 - nodes in this community are weakly interconnected._
- **Should `NYC Events — Handoff Document` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._