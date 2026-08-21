# Issue #26 frontend handoff

## Ownership

- Job: nyc-events frontend autonomous issue worker
- Lane: persistent `frontend` branch and worktree
- Issue: #26 — Google Maps tile images and Location-aggregated map
- PR: #67 — https://github.com/CuriosityQuantified/nyc-events/pull/67
- Latest implementation commit: `66a50f0`
- Main synchronization merge: `bbc5d78`

## State

> Superseded for MVP by Issue #51 recovery: Google Maps JavaScript and Static Maps thumbnails are deferred. EventCard and EventDetail no longer render thumbnails. List/Map uses a credential-free coordinate plot with the existing Location aggregation, accessible markers, synchronized event panel, and URL/filter state. The dormant Static Maps route and component are not part of the MVP render path and require no production secret.

Implementation, required Open Design runs, specialist reviews, and local gates are complete. The PR is intentionally blocked because fullstack Issue #51 has `in-progress`; the lane contract permits concurrent frontend work only for Issue #12 while #51 is active. Do not enable auto-merge or merge PR #67 until #51 is closed and no fullstack work is active.

This recovery had no live Claude child or useful Claude result file. The dedicated Hermes frontend profile continued directly, merged current `origin/main` into `frontend` without rebase or force-push, regenerated the graph, and reran the complete frontend gate suite.

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

## Remaining ordered actions

1. Wait until Issue #51 is closed and confirm no fullstack issue, PR, worktree, or ahead/uncommitted coordinator work is active.
2. Reclaim Issue #26 with `in-progress` and comment the recovery.
3. Remove this handoff, run `graphify update .`, commit, and push normally on `frontend`.
4. Verify the PR-triggered CI run automatically enqueues for the exact pushed SHA within 2 minutes.
5. Require every protected and supplemental check for the exact head to report success; fix failures without rebase, force-push, squash, or branch deletion.
6. Update PR #67's CI/CD table with exact GitHub results and any production evidence required at that point.
7. Enable GitHub auto-merge through GraphQL `enablePullRequestAutoMerge` with merge method `MERGE`; never invoke a direct merge endpoint.
8. After GitHub merges, verify Issue #26 closed, fetch, fast-forward `frontend` to `origin/main`, push `frontend`, and verify both refs align and the worktree is clean.

## Blocker

Fullstack Issue #51 is open with `in-progress`. The frontend lane exception applies only to Issue #12. Remove Issue #26's `in-progress` label while paused.
