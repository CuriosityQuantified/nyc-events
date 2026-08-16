# Frontend Issue #14 handoff

- Job/lane: NYC frontend autonomous issue worker; persistent `frontend` branch/worktree at `/Users/halgorithm/workspaces/AI/nyc-events-frontend`
- Issue: #14 — Event detail page with provenance and official NYC Parks link
- Ownership: frontend-only implementation plus tracked Graphify outputs
- Stop reason: Fullstack Issue #51 is still OPEN with `in-progress`. The lane contract blocks Issue #14 until #51 is CLOSED, even though #51 has a resolution comment and no open PR/fullstack worktree. Reverified at `2026-08-16T09:02:58Z`; the fullstack worktree is absent, but issue state and label are authoritative.

## Completed

- Added the GUID event-detail route, lane API proxy, typed fetch/error handling, safe official URL handling, list entry point, and filter-preserving return navigation.
- Added the responsive event-detail UI with source description, truthful missing-information copy, per-fact `Stated`/`Derived`/`Not listed` provenance, registration/free/accessibility handling, freshness, official NYC Parks CTA, loading/not-found/error states, mobile bottom navigation, and coherent light/dark design tokens.
- Fixed review findings: exact-field registration provenance, normalized fallback provenance, independent desktop columns, mobile CTA/nav geometry, focus scroll margins, compact mobile decision rows, terminal-state semantics, dark-mode contrast, and asserted visual baselines.
- Open Design project: `nyc-events-frontend-issue-14`.
  - `frontend-design`: run `e8349c71-7ce7-441c-9d61-b4ed893a8474` (Codex fallback after Claude auth failure)
  - `impeccable-design-polish`: run `238b1fdc-40ff-4611-a200-0649b9d393fb`
  - `web-design-guidelines`: run `be08baec-c4ae-45b8-a6b0-a4c612c1dc63`; its 2 blockers were fixed
  - Final blocker-verification run: `daa3f1b9-524c-4700-8135-611ae365d124` — `READY`, no remaining design-guideline blockers
- Direct Hermes failover completed implementation, code review, simplification, security review, and UAT because Claude returned an authentication/provider failure. Security review found no XSS, URL-scheme, injection, auth, secret, path-traversal, or unsafe-rendering blocker.

## CI/CD delta

| Gate | Command/job | Failure caught | Latest local result |
|---|---|---|---|
| Detail parser/API proxy unit tests | `npm run test:unit` | Invalid contract, encoded GUID, 404/error mapping | 39/39 passed |
| Component truthfulness/provenance tests | `npm run test:unit` | Unsupported free/accessibility claims, unsafe URL, wrong source provenance, false fallback provenance | 39/39 passed |
| Real browser journeys | `CI=true npx playwright test e2e/event-detail.spec.ts` | Entry-point/return-state, source CTA, keyboard, axe, overflow, console/page errors, missing detail | 6/6 passed on macOS |
| Linux clean-runner visual gate | Playwright v1.62.1 Noble container, same command | Missing/stale Linux snapshots and cross-runner rendering drift | 6/6 passed |
| Responsive visual regression | `toHaveScreenshot` at 390x844 and 1440x900, light+dark; Darwin+Linux baselines | Layout/theme regression | 8 baselines generated and rechecked |
| Geometry | Issue #14 Playwright journey | CTA outside viewport, mobile nav occlusion, desktop story gap | Passed |
| Dark accessibility | Issue #14 dark Playwright journey + axe | Mixed-theme/low-contrast UI | Passed mobile+desktop |
| Static gates | `npm run format:check && npm run lint && npm run typecheck` | Format/lint/type drift | Passed |
| Production build | `CI=true npm run build` | Next.js compile/route failure | Passed |
| Full browser regression | `CI=true npm test` before final dark/snapshot extension | Existing shell/filter/detail regressions | 44/44 passed; final Issue #14 delta separately passed 6/6 |
| Graphify | `PATH="$HOME/.local/bin:$PATH" graphify update .` | Stale code graph | Rebuilt; refresh once more after this handoff update |

## Git/PR/CI state

- Branch: `frontend` tracking `origin/frontend`; do not rebase, squash, switch, force-push, or delete.
- PR: none. Do not create one while #51 remains OPEN + `in-progress`.
- GitHub checks/deployment: not started because no PR exists.
- Issue #14 `in-progress` must be removed for this intentional stop.

## Ordered next actions

1. Confirm Issue #51 is CLOSED and its `in-progress` label is gone. Do not proceed on a resolution comment alone.
2. Read this handoff and verify the live branch/diff. Remove `frontend/HANDOFF.md` before the Issue #14 PR.
3. Run final full `npm test`, production build, format/lint/type gates, and both Darwin/Linux visual-regression commands.
4. Refresh Graphify after removing this handoff and pass the canonical freshness comparison.
5. Verify the exact Issue #14 checklist and retain the final Open Design `READY` evidence.
6. Push normal commits on `frontend`; create exactly one `frontend` → `main` PR with `Closes #14` and the required CI/CD delta/Open Design evidence.
7. Verify exact-head PR CI automatically enqueues within 2 minutes. Enable GraphQL auto-merge with method `MERGE`; never direct-merge, squash, rebase, or delete `frontend`.
8. After GitHub auto-merges green exact-head checks, fetch, fast-forward `frontend` to `origin/main`, push, and verify issue/branches aligned.
