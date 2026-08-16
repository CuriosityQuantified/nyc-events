# Issue #26 frontend handoff

## Ownership

- Job: nyc-events frontend autonomous issue worker
- Lane: persistent `frontend` branch and worktree
- Issue: #26 — Google Maps tile images and Location-aggregated map
- PR: #67 — https://github.com/CuriosityQuantified/nyc-events/pull/67
- Latest implementation commit: `66a50f0`
- Main synchronization merge: `bbc5d78`
- Merged revision: `d6fd245`

## State

Implementation, required Open Design runs, specialist reviews, local gates, exact-head PR CI, and main CI completed. GitHub auto-merged PR #67 as merge commit `d6fd245`. Production deployment run `31950268463` verified the exact cutover revision, but its Playwright journeys timed out at both required viewports because `page.goto("/", { waitUntil: "networkidle" })` never reached network idle after the map-thumbnail change. The workflow rolled the frontend back; the public revision then reported `287979e`. Issue #26 was reopened.

Fullstack Issue #51 remains `in-progress`. Its exception permits concurrent frontend work only for Issue #12, so Issue #26 must remain paused and unclaimed. This recovery had no live Claude child or useful Claude result file; the dedicated Hermes frontend profile updated this handoff directly without changing application code.

## Completed acceptance areas

- Server-protected Static Maps thumbnails for compact, expanded, and detail presentations
- Text-first location facts, accessible names, dimensions, lazy loading, Google handoff, and stable unavailable/error fallbacks
- Fixed upstream, fixed rendering variants, validated GUID/coordinates/index, timeout, response-type checks, and server-only Static Maps key
- Google Maps JavaScript API with `AdvancedMarkerElement`
- Client-side Location aggregation, bounded marker sizing, 44px targets, count labels, keyboard activation, selected-location event list, list-only invalid-coordinate events, and URL-preserved List/Map state
- Phone and desktop Playwright journeys with axe, keyboard, geometry, viewport, screenshot attachments, and console/page-error assertions
- Open Design project `nyc-events-frontend-issue-26`:
  - `frontend-design`: `6a857c5c-58fc-41db-b9ec-e1861c05c471` — succeeded
  - `impeccable-design-polish`: `22d15ad7-1245-470b-a8e0-584d2019c4c8` — succeeded
  - `web-design-guidelines`: `1590d497-f4f6-4f8d-b149-b925a7f1f9fd` — succeeded

## Commands and results

- `npm ci` — passed; 0 vulnerabilities
- `npm run format:check` — passed
- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run test:unit` — 62/62 passed
- `npm run build` — passed
- `CI=true npm run test:e2e` — 56/56 passed at 390×844 and 1440×900
- `npm audit --omit=dev --audit-level=high` — 0 vulnerabilities
- `git diff --check origin/main...HEAD` — passed
- `graphify update .` after merging current main — rebuilt 1,193 nodes / 2,246 edges / 99 communities

## CI/CD delta

| Gate | Command / job | Failure caught | Current result |
| --- | --- | --- | --- |
| Static Maps route, validation, and security | `npm run test:unit` / `frontend` | malformed GUID/index, arbitrary variants, null island, credential reflection, upstream/content-type failure | 62/62 local |
| Location grouping and marker bounds | `npm run test:unit` / `frontend` | identifier/coordinate grouping errors, duplicate locations, invalid coordinates, unbounded marker growth | 62/62 local |
| Browser map and thumbnail journeys | `CI=true npm run test:e2e` / `frontend` | filter/view desynchronization, dead keyboard markers, inaccessible labels, geometry/overflow/attribution/fallback regressions, console/page errors | 56/56 local |
| Production build and types | `npm run build`, `npm run typecheck` / `frontend` | route, server/client boundary, generated type, and optimized build regressions | passed local |
| Graph freshness | `graphify update .` / `graph` | stale tracked graph output | refreshed locally |
| Exact-head PR CI | PR workflow run `31950097718` | protected and supplemental integration regressions | passed |
| Main CI | push workflow run `31950268416` | post-merge integration drift | passed for `d6fd245` |
| Production browser | production run `31950268463` | exact-revision cutover and live phone/desktop regressions | failed at 390×844 and 1440×900; rollback restored `287979e` |

## Remaining ordered actions

1. Wait until Issue #51 is closed and confirm no fullstack issue, PR, worktree, or active fullstack process remains.
2. Reclaim Issue #26 with `in-progress` and comment the recovery.
3. Diagnose run `31950268463`; distinguish a production-only thumbnail retry/request loop from an unsuitable navigation readiness condition. Preserve fail-closed console, page-error, failed-request, geometry, axe, keyboard, screenshot, and exact-revision checks.
4. Add a deterministic regression that reproduces the production failure at 390×844 and 1440×900. Do not weaken the production browser gate.
5. Run required Open Design polish/audit if the remediation changes visible behavior, then run the full frontend, production-browser, security, and graph freshness gates.
6. Remove this handoff, commit and push normally on persistent `frontend`, and create exactly one follow-up PR to `main` with `Closes #26` and the complete CI/CD delta.
7. Verify pull-request CI auto-enqueues for the exact head within 2 minutes, require every protected and supplemental check to succeed, and enable GraphQL auto-merge with method `MERGE`.
8. Require the merged revision's main CI and production deployment—including both live Playwright viewports and exact-revision evidence—to succeed before closing Issue #26.
9. Fetch, fast-forward `frontend` to `origin/main`, push `frontend`, and verify `main`/`frontend` alignment and a clean worktree.

## Blocker

Fullstack Issue #51 is open with `in-progress`, with an active fullstack worktree/process. The frontend lane exception applies only to Issue #12. Issue #26 has no `in-progress` label while paused.
