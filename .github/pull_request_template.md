## What and why

<!-- What changes, and which issue it closes. Closes #N -->

## Lane

<!-- Must match the issue's label. Delete the two that do not apply. -->

`backend` · `frontend` · `fullstack`

- [ ] Files changed stay inside this lane's tree — or the issue is labelled `fullstack`
- [ ] Shared files (`CONTEXT.md`, `docs/adr/`, `.github/`, `.claude/`) are not modified here, or this PR is *only* that change
- [ ] If this adds an Alembic migration, it is a `backend`/`fullstack` PR and `alembic heads` shows one head

## Checks

- [ ] Terms used here match `CONTEXT.md`; new domain terms were added to it
- [ ] No decision here contradicts `docs/adr/` — or a new ADR records the change
- [ ] No test reaches the network (`docs/adr/0005`)
- [ ] Source facts are rendered from stored rows, never inferred or generated
- [ ] `Not listed` is never presented as a negative claim
- [ ] No credential in code, logs, fixtures, or output
- [ ] `graphify update .` run if code changed

## Verification

<!-- What you ran, and what it printed. "Tests pass" is not verification. -->
