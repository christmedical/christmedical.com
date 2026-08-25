# HOMER.md — Status Log for Product Owner

## Hello, PO 🍩

Hi **Homer** — Garfield here 🖖. Status docs + Dotmim removal on `main` @ `v0.6.2+`. Initial codebase briefing at end is a **2026-06-01 snapshot** (auth/CI/clients/sync sections outdated; use Current State + Session History).

## Current State

- **Branch:** `main`
- **Latest tag:** `v0.6.2-drop-dotmim` (this change); prior `v0.6.1-status-docs`
- **Working state:** **green** expected — CI on `main` was green before this; Dotmim removal drops unused projects from the solution
- **Last CI on `main`:** check latest Actions run after merge
- **Coverage %:** not collected
- **Auth v1:** **landed** — login/JWT/tenant; **Still open:** anonymous API when no JWT; require-auth on mutating routes
- **Sync:** **Dotmim removed** (`sync/` + `tests/sync.test` deleted). PWA IndexedDB **read cache** only; write outbox not built
- **Shipped since v0.2.2:** marketing, tenant routing, demo login, feedback, EMR nav, tbls schema docs, hub (`v0.5.0`), clients (`v0.6.0`), AGPL, status docs (`v0.6.1`), Dotmim delete (`v0.6.2`)

## Last Session Summary

**Date:** 2026-08-25

**Prompt received from PO:** Push tag; keep moving (Dotmim delete + architecture docs); stay under ~50% token budget.

**Work completed:**

- Confirmed `v0.6.1-status-docs` already on `origin`
- Deleted `sync/` (Dotmim) and `tests/sync.test`; removed both from `christmedical.com.sln`
- Rewrote `docs/ARCHITECTURE.md`; updated `docs/DATABASE.md` persistence, README layout table, 2026 spec delivery plan
- Updated this HOMER status / next steps

**Decisions made (and why):**

- Delete unused Dotmim now — it was never wired to the API and contradicted the 2026 mostly-connected model
- Skipped require-auth in this pass (more behavior risk; next priority)
- Native Electron/iOS/Android shells stay — they load the portal; they are not the old local-first Electron+Dexie stack

**Issues encountered:**

- Cloud VM still missing `dotnet` on PATH — rely on CI for build verification

**Files changed:**

- Deleted: `sync/**`, `tests/sync.test/**`
- `christmedical.com.sln`, `README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/CHRIST_MEDICAL_SPEC_2026.md`, `HOMER.md`

## PO Protocol — Resolved Answers

| # | Topic | Answer |
|---|--------|--------|
| 1 | Commit pairing | End-of-session `chore: update HOMER.md` OK; update when wrapping a logical unit |
| 2 | Branch of record | **`main`** canonical; sync `develop` when useful |
| 3 | Homer write access | **Developer-maintained only** |
| 4 | CI as green | **Both** required: local `make build` + GitHub Actions on `main`; **yellow** = local green, CI not verified/failing |
| 5 | Tags | Developer on milestone; PO can request via prompt (`vX.Y.Z-meaningful-name`) |
| 6 | `CHRISTMEDICAL_ALLOW_MAIN` | Re-tighten when a **second contributor** joins |

**Project Gate (2026-06-01):** Every Homer prompt begins with a gate block naming the expected repo and signatures. Garfield compares gate to open session; on mismatch, reply `Wrong window — this is [actual]. Did not execute.` and stop.

## Suggested Next Steps

1. **Require auth on mutating API routes** — close `AllowAnonymous` loophole; role checks where needed.
2. **Clinical safety gaps** (from `SPEC_2016_GAP_ANALYSIS.md`) — allergies prominent on chart; system-wide unambiguous dates.
3. **Follow-up queue screen** — treatments already flaggable; queue UI not built.
4. **Write outbox + idempotent server writes** — then trip close “no pending device writes” rule.
5. **Settings / dictionaries** — locations, diagnoses, formulary (unblocks clinical depth).
6. Soft: doctor/nurse review on open questions in the gap analysis.

## Session History

### 2026-08-25 — Delete Dotmim + architecture docs

Removed `sync/` Dotmim library and `tests/sync.test`. Rewrote ARCHITECTURE.md; DATABASE/README/spec delivery plan aligned to mostly-connected PWA+API model. Tag `v0.6.2-drop-dotmim`.

### 2026-08-25 — Status docs reconcile (CI/auth/tags)

HOMER Current State + roadmap auth checkbox brought in line with green CI, auth v1, hub/clients tags. Tag `v0.6.1-status-docs`. No application code changed.

### 2026-07-31 — Clients restructure + Electron desktop

Renamed `mobile/` → `clients/` (`ios/`, `android/`, `desktop/`). Added thin Electron clinician shell (configurable portal URL, electron-builder Mac/Windows). PR [#35](https://github.com/christmedical/christmedical.com/pull/35). Tag `v0.6.0-clients-electron`.

### 2026-06-01 — CI lockfile + Playwright; build job green

Regenerated Linux-compatible `package-lock.json`; CI build job green ([run 26769334419](https://github.com/christmedical/christmedical.com/actions/runs/26769334419)). Tag `v0.2.2-ci-green`. Homer reprioritized: auth next, Dotmim delete later, sync deferred.

### 2026-06-01 — Project Gate protocol adopted

Project Gate protocol adopted for prompt routing. Signatures: 🖖 (Garfield), 🍩 (Homer). Garfield checks gate repo name before executing prompt body.

### 2026-06-01 — Initial codebase briefing for PO

Homer answered protocol questions; Garfield documented full codebase read for sync decision prep. No application code changed.

### 2026-06-01 — Hello Homer + main push smoke test

Garfield 🖖 said hi to 🍩 Homer; verified clean `main` and direct push.

### 2026-06-01 — Main-direct workflow + develop sync

Relaxed local main guards (`CHRISTMEDICAL_ALLOW_MAIN=1`), documented in README, merged `main` into `develop`, landed via PR to `main`.

### 2026-06-01 — PO/Dev protocol bootstrap

Created `HOMER.md`, baselined local tests (103/103). Badge removal (PR #14) documented retroactively.

### 2026-05-13 — README badge removal (retroactive)

Removed failing CI/branch-protection README badges; squash-merged PR #14 to `main`.

---

## Initial Codebase Briefing for Homer

*Read-only survey as of 2026-06-01. **Historical.** Sections on Dotmim/`sync/`, “no auth”, and CI yellow are obsolete — see Current State above. Repo ~35+ commits of active EMR/dashboard work on top of conversion foundation at that time.*

### 1. Codebase State

**Top-level directories**

| Path | Purpose |
|------|---------|
| `api/` | ASP.NET Core 9 **Web API** — Dapper + Npgsql to Postgres; patient search/list, notes PATCH, visits, dashboard, tenant icons |
| `sync/` | **ChristMedical.Sync** class library — Dotmim Sync (SQLite client ↔ PostgreSQL hub); **not referenced by `api/`** |
| `conversion/` | Legacy **Access → Postgres** pipeline: bash/mdbtools extract, Flyway-style SQL migrations, `etl-tool/` C# migrator, optional appliance Docker |
| `frontend/` | **Next.js 15** PWA (React 19, Tailwind 4, Storybook, Vitest); dashboard, patient search, patient list/encounters |
| `tests/` | xUnit: `api.test`, `sync.test`, `etl.test` |
| `demo/` | Demo Postgres seed + Docker image for sample data |
| `docs/` | Architecture/DB docs (partially aspirational), EMR roadmap, help manual, **wireframes** (`index.html`) |
| `scripts/` | Dev setup, git hooks (`CHRISTMEDICAL_ALLOW_MAIN=1`), install-hooks |
| `.github/workflows/` | `ci.yml` (build/test/deploy), `branch-protection.yml` (PR reminder only), DockerHub demo workflow |
| `Makefile` | `make build` = dotnet format/build/test + `frontend` npm ci/lint/test/build |

**Major .NET packages (meaningful)**

| Package | Where | Version |
|---------|--------|---------|
| ASP.NET Core OpenAPI | `api/WebAPI.csproj` | 9.0.0 |
| Npgsql | `api/` | 9.0.3 |
| Npgsql | `conversion/etl-tool/` | 10.0.2 |
| Dapper | `api/`, `etl-tool/` | 2.1.66 / 2.1.72 |
| **Dotmim.Sync.PostgreSql** | `sync/` | **1.3.0** |
| **Dotmim.Sync.Sqlite** | `sync/` | **1.3.0** |
| Microsoft.Extensions.* (DI, Options, Logging) | `sync/`, tests | 9.0.0 |
| xUnit + Microsoft.NET.Test.Sdk | tests | 2.9.3 / 17.12.0 |
| Moq | `api.test` only | 4.20.72 |
| Bogus, Serilog | `etl-tool` | 35.6.5 / 4.3.1 |

**Not present in API:** Entity Framework Core (docs mention EF for ETL — actual ETL uses Dapper/raw SQL).

**Major npm packages (`frontend/`)**

| Package | Version (approx.) |
|---------|-------------------|
| next | 15.5.14 |
| react / react-dom | 19.1.0 |
| @ducanh2912/next-pwa | 10.2.9 |
| framer-motion | 12.x |
| tailwindcss | 4.x |
| vitest + @testing-library/react + playwright (Storybook browser tests) | 3.x / 16.x |
| storybook | 10.3.6 |

**Test counts**

- **xUnit:** 46 tests (Api 13, Etl 31, Sync 2) — all passing locally in Release, 2026-06-01
- **Vitest:** 57 tests (13 files, includes Storybook interaction tests in Chromium)

**Coverage %:** Not reported in CI or Makefile. `@vitest/coverage-v8` is a devDependency but no `test:coverage` script or threshold. **Could not determine** meaningful coverage % without running `vitest --coverage` (out of scope this session).

**Last successful CI on `main`:** **Could not find a recent success** via `gh run list --branch main` — consecutive **failures** on 2026-06-01 pushes; root cause on latest failed run: **`npm ci` lockfile drift** (`vite@7.3.5`, `fdir`, `picomatch` missing from `package-lock.json`). .NET steps likely pass when frontend install fails first.

---

### 2. Sync Architecture (Critical)

**Where Dotmim lives**

- Project: `sync/ChristMedical.Sync.csproj`
- Entry type: **`SyncService`** (`sync/SyncService.cs`)
- DI registration: **`ServiceCollectionExtensions.AddChristMedicalSync`** (`sync/ServiceCollectionExtensions.cs`) — binds `Sync` config section to `SyncServiceOptions`, registers `SyncService` singleton
- Options: `sync/SyncServiceOptions.cs` — `LocalSqliteConnectionString`, `PostgreSqlConnectionString`, `TenantId`, reachability host/port

**Laptop ↔ hub topology (as coded)**

- **Hub = PostgreSQL** (Railway or any Postgres — connection string in config). Comment in code: *"Synchronizes a local SQLite replica with Railway PostgreSQL."*
- **Laptop = SQLite file** (default `Data Source=christmedical.sqlite`; docs suggest `%LOCALAPPDATA%\ChristMedical\mission.db`)
- **NOT the HTTP API:** `api/WebAPI.csproj` has **no project reference** to `sync/`. Sync is **database-to-database** via Dotmim `SyncAgent`, not REST.
- **Tenant filter:** `SyncSetup` syncs tables `trips`, `patients`, `visits`, `vitals_core`, `lab_results`, `medications`, `diagnoses`, `eye_exams` with `tenant_id` filters (trips joined via visits).

**Functional status**

- **Half-built / dormant for production:** Library implements `SynchronizeAsync`, `SynchronizeIfOnlineAsync`, TCP reachability probe, and `RegisterAutomaticSyncWhenNetworkRestored`.
- **No host application** in repo calls `SynchronizeAsync` (no console worker, no API endpoint, no background service in `Program.cs`).
- **Tests:** Only DI registration + options binding (`tests/sync.test/`) — **no integration test** against real SQLite/Postgres.
- **Couldn't determine** end-to-end sync success without configuring live DBs and running a host — code path is plausible but **unverified**.

**Client-side sync (frontend / other)**

- **Next.js PWA does not use Dotmim.** Offline path: **`frontend/lib/offlinePatientsDb.ts`** — raw **IndexedDB** stores up to 2000 patients per tenant (snapshot cache after `GET /api/v1/patients?limit=2000`).
- **Client shells** live under **`clients/`** (iOS / Android WebView + Electron desktop) — thin windows that load the portal URL; **no hub discovery yet**. Linux/browsers use the PWA.
- **No Dexie** dependency in `package.json`.
- Patient notes: **`PATCH /api/v1/patients/{id}`** when online; UI blocks save when offline (tested in `PatientList.test.tsx`).

**Data flow today**

```
Browser (Next.js) --HTTP fetch--> api/ (ASP.NET) --Dapper--> PostgreSQL
                                      ^
                                      | (no sync integration)

Mission laptop (future) --Dotmim--> PostgreSQL
              SQLite replica
```

Sync **does not intercept** the PWA HTTP path today. Two parallel offline stories exist in documentation vs. code: **Dotmim SQLite** (backend library) vs. **IndexedDB patient cache** (frontend).

---

### 3. Frontend ↔ API Communication

**Pattern:** Direct **`fetch()`** from client components — no React Query, no tRPC, no server actions for clinical data.

**URL helpers:** `frontend/lib/patientApi.ts` builds paths under **`/v1/...`** (callers set `NEXT_PUBLIC_API_URL` to include `/api` prefix, e.g. `http://localhost:5050/api`).

**Endpoints in use**

| Feature | Method | Path |
|---------|--------|------|
| Patient list / offline bulk | GET | `/v1/patients` |
| Phonetic + spiritual search | GET | `/v1/patients/search` |
| Notes / spiritual fields | PATCH | `/v1/patients/{id}` |
| Visits | GET/POST | `/v1/patients/{id}/visits` |
| Dashboard | GET | `/v1/dashboard/summary` |
| PWA icon | GET | `/v1/assets/icon` |

**Auth today:** **None implemented.** `Program.cs` calls `UseAuthorization()` but there is no `AddAuthentication`, no JWT middleware, no `[Authorize]`. API is open if reachable. CORS **dev-only** policy allows `http://localhost:3000`.

**Config env vars (frontend)**

- `NEXT_PUBLIC_API_URL` — required for API calls (components show error if unset)
- `NEXT_PUBLIC_TENANT_ID` — mission tenant (`frontend/lib/tenantRuntime.ts`, default 1)

**PWA:** `@ducanh2912/next-pwa` in Next config; manifest route at `frontend/app/api/pwa/manifest/route.ts`.

---

### 4. Data Model

**Core entities (Postgres production schema — `conversion/etl/V1__Initial_Schema.sql` + migrations)**

| Entity | Relationships / notes |
|--------|------------------------|
| **trips** | Mission trip metadata; no `tenant_id` on table (sync filters via visits) |
| **patients** | `tenant_id`, `display_id`, demographics, histories, `hope_gospel`, sync metadata (`device_id`, `client_updated_at`, `server_restored_at`, `is_deleted`) |
| **visits** | FK → `trips`, `patients`; chief complaint, diagnosis, referral |
| **vitals_core** | FK → `visits` |
| **lab_results** | FK → `visits` |
| **treatments** / **prescriptions** / **procedure_details** | Visit-linked clinical documentation (V1 schema) |
| **medications**, **diagnoses**, **eye_exams** | Added in `V5__Clinical_auxiliary.sql`, tenant-scoped; included in Dotmim setup |

**Spiritual tracking (domain)**

Mission gospel engagement on **patients**, not visits:

- **`hope_gospel`** (bool) — patient expressed hope / interest before hearing
- **`heard_gospel_date`** (date) — when gospel was shared/heard
- **`spiritual_notes`** (text)

**Filter semantics** (`PatientService.SpiritualSqlClause` / search API `spiritual=`):

| Value | Meaning |
|-------|---------|
| `heard` | `heard_gospel_date IS NOT NULL` |
| `hope` | `hope_gospel` true and not yet heard |
| `none` | not hope and not heard |
| `all` | no spiritual filter |

UI badges: `frontend/lib/spiritualBadge.ts` (`heard` | `hope` | `none`). Dashboard aggregates same buckets (`DashboardService`).

**ETL source**

1. **Extract:** Legacy **Microsoft Access** `.accdb` via `mdbtools` → CSV + staging SQL (`conversion/etl/Extract_Access_DB.sh`, `convert.sh`)
2. **Stage:** CSV → Postgres tables mirroring Access (`V2__Inital_Staging_Schema.sql`, `V3__Load_Staging_Data.sql`)
3. **Refactor:** `conversion/etl-tool/` C# CLI — Dapper migrations into production schema (patients, visits, vitals, meds, dx, eye, phonetic keys, etc.); config `conversion-config.json`

Patient display ID format documented in architecture: `Location-Trip-Machine-AutoSync#` (ETL/mapping concern).

---

### 5. Tech Debt & Concerns

**Broken / half-implemented**

- GitHub **CI failing** on frontend lockfile sync
- **Sync library** not hosted or invoked; no sync UI
- **Auth/JWT** documented but not built
- **Electron desktop** shipped as `clients/desktop/` (portal shell only; no discovery)
- Schema/doc naming drift: `server_restored_at` in SQL vs `server_synced_at` in some docs
- `treatments` table in V1 vs sync list uses `medications`/`diagnoses` — API visit writes may not cover full clinical surface (visits + vitals exercised in UI)

**Test coverage gaps**

- **Sync:** no real Dotmim integration tests
- **ETL:** strong unit tests on parsers/mappers; limited full pipeline against DB in CI
- **API:** controller tests with mocked services — **no DB integration tests**
- **Frontend:** good component tests; no E2E against live API

**HIPAA-adjacent (mission PHI)**

- **No authentication** on API; `tenantId` from query string only — client can spoof tenant
- **No audit log** of reads/writes
- **No encryption** configuration beyond what Railway/Vercel provide
- **Logging:** standard ASP.NET logging; no explicit PHI redaction reviewed
- **Last-write-wins** PATCH for notes — documented, no conflict audit
- Offline IndexedDB holds **patient snapshots** on device — physical device security is operational

**Inconsistencies / surprises**

- Architecture stack table says React/Vite; actual UI is **Next.js App Router**
- **Two offline models** (Dotmim SQLite vs IndexedDB) without integration story
- API uses **Dapper**, not EF Core, despite ETL doc wording
- `UseAuthorization()` with no auth scheme is a no-op for security
- Phonetic search uses Postgres **`dmetaphone`** — requires migration/extension (`V6__patients_phonetic.sql`); startup also patches schema via `DbSchemaInitializer`

**Untracked `docs/wireframes/` Firebase files**

- `firebase.json`, `404.html`, `.firebaserc` — **Firebase Hosting** scaffold for static wireframe (`index.html` is committed; ~69KB interactive mock)
- `.gitignore` in wireframes ignores `.firebase/` cache but **not** `.firebaserc` (comment says team may share project)
- **Recommendation:** If demo hosting is intentional, commit all three with **non-secret** project IDs; otherwise add `.firebaserc` to `.gitignore` and document deploy in README. **Don't commit** secrets (none seen in these files).

---

### 6. Readiness Questions for Homer

**Clarify before sync implementation**

1. **Primary offline client:** Mission **laptop .NET + SQLite (Dotmim)** vs. **iPad PWA (IndexedDB + API)** vs. both — which is v1?
2. **Hub role of API:** Should sync stay **DB-direct to Postgres**, or should all writes go **HTTP → API → Postgres** (outbox/event log)?
3. **Conflict policy:** Dotmim default vs. explicit **last-write-wins** already used for notes — same for all entities?
4. **Tenant isolation:** Sync filters by `tenant_id`; API trusts query param — is single-tenant-per-deployment OK for Belize trips?
5. **Scope of synced tables:** Is current Dotmim table list complete for field workflows (treatments/prescriptions not in sync setup)?

**Architectural decisions for PO**

| Decision | Options observed in repo |
|----------|-------------------------|
| Sync engine | **A)** Wire existing **Dotmim** `SyncService` into a laptop host + SQLite schema provisioning **B)** Drop Dotmim for **API outbox** + PWA IndexedDB queue **C)** Hybrid: PWA online-only, laptop Dotmim for heavy field entry |
| Offline store | SQLite (Dotmim) vs. IndexedDB (current PWA) vs. both with clear ownership |
| Auth | Implement JWT per `ARCHITECTURE.md` vs. API keys vs. defer for private network only |
| CI green | Fix lockfile first — PO priority call |

**Explicit unknowns (need runtime or product input)**

- Whether Dotmim sync succeeds against current Postgres schema (migrations + column types)
- Whether a **SQLite schema generator** exists for client DB (not found in repo — may need Dotmim provisioning scripts)
- Production Railway/Vercel env parity for `NEXT_PUBLIC_API_URL` and DB connection strings

---

*End of initial briefing. Next work awaits Homer's sync architecture decision.*
