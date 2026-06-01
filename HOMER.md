# HOMER.md — Status Log for Product Owner

## Current State

- **Branch:** `main` (PO workflow: commit and push here; keep `develop` synced from `main`)
- **Latest tag:** `v0.2.1`
- **Working state:** yellow — local tests 103/103; GitHub CI not re-verified this session
- **Test count and pass rate:** 103/103 passing locally (.NET 46/46, frontend Vitest 57/57)
- **Last commit hash and date:** _(updated after merge of develop → main this session)_

## Last Session Summary

**Date:** 2026-06-01

**Prompt received from PO:** Allow direct push to `main` for easier PO communication; sync `develop` with `main`; relax git rules; merge via PR from `develop`.

**Work completed:**

- Verified GitHub **`main` is not branch-protected** (404 from API) — only local hooks blocked direct `main` work
- Set `CHRISTMEDICAL_ALLOW_MAIN=1` (default) in `scripts/git-hooks/pre-commit` and `pre-push`
- Updated `README.md` and `scripts/README.md` branching/hook documentation
- Merged `origin/main` into `develop` (sync), then PR `develop` → `main`

**Decisions made (and why):**

- **Main as integration branch (temporary):** Reduces bridge friction between Homer ↔ Jamey ↔ Cursor; hooks stay in repo but default to allow `main` until PO asks to tighten again
- **Still use PR develop → main for this policy change:** Single reviewed merge bundles hook + doc + `HOMER.md` updates; after merge, day-to-day can be direct to `main`

**Issues encountered:**

- Prior HOMER commits used feature-branch PRs because hooks blocked `main`; not a GitHub rules issue

**Files changed:**

- `scripts/git-hooks/pre-commit`, `scripts/git-hooks/pre-push`
- `README.md`, `scripts/README.md`
- `HOMER.md`

## Open Questions for PO

1. **Commit pairing:** Should every feature commit include an updated `HOMER.md` in the same commit, or is a dedicated end-of-session `chore: update HOMER.md` commit acceptable?
2. ~~**Branch of record:**~~ **Resolved:** `main` for now; sync `develop` when needed.
3. **Homer write access:** Does Homer ever edit `HOMER.md` directly, or developer-maintained only?
4. **CI as "green":** Local `make build` only, or must GitHub Actions on `main` pass?
5. **Tag updates:** PO request only, or developer on milestone?
6. **When to re-tighten:** What signal should flip `CHRISTMEDICAL_ALLOW_MAIN` back to `0`?

## Suggested Next Steps

1. Run `scripts/install-hooks.sh` on any machine that still has old blocking hooks installed
2. Triage CI when prioritized
3. Decide on untracked `docs/wireframes/` Firebase files

## Session History

### 2026-06-01 — Main-direct workflow + develop sync

Relaxed local main guards (`CHRISTMEDICAL_ALLOW_MAIN=1`), documented in README, merged `main` into `develop`, landed via PR to `main`.

### 2026-06-01 — PO/Dev protocol bootstrap

Created `HOMER.md`, baselined local tests (103/103). Badge removal (PR #14) documented retroactively.

### 2026-05-13 — README badge removal (retroactive)

Removed failing CI/branch-protection README badges; squash-merged PR #14 to `main`.
