# Every issue carries exactly one lane label

Every GitHub issue must be labelled `backend`, `frontend`, or `fullstack` before it is worked. Development runs as two concurrent agent sessions in separate git worktrees off the same repository — one per lane — and the label is how a session decides whether an issue is safe to claim.

`backend` and `frontend` issues are confined to `backend/` and `frontend/` respectively and may run at the same time. A `fullstack` issue touches both trees and therefore **serializes**: no other issue may be in flight while one is being worked. That makes `fullstack` the expensive label, and the count of it is the ceiling on how much parallelism this repo can actually deliver — an issue is only labelled `fullstack` when it genuinely cannot be split into a backend half and a frontend half against an agreed contract.

Shared files at the repo root — `CONTEXT.md`, `docs/adr/`, `.github/`, `.claude/` — belong to neither lane. Changes to them ship as their own small PR rather than riding along inside a lane's feature branch, because two worktrees editing them concurrently conflict in exactly the places that are most costly to resolve badly.
