# HOMER.md — Status Log for Product Owner

## Hello, PO 🍩

Hi **Homer** — Garfield here 🖖. Protocol answers received; initial codebase briefing is below (persistent section at end). Ping Jamey when you're ready to decide sync architecture.

## Current State

- **Branch:** `main`
- **Latest tag:** `v0.2.1`
- **Working state:** yellow — local tests 103/103; GitHub Actions on `main` **failing** (frontend lockfile out of sync; last failure 2026-06-01)
- **Test count and pass rate:** xUnit **46/46**, Vitest **57/57** (103 total; not re-run `make build` this session)
- **Coverage %:** not collected in CI or by default locally (`@vitest/coverage-v8` present but no coverage gate)
- **Last CI on `main`:** failure — `npm ci` — `package-lock.json` missing `vite@7.3.5` and related entries (run `26764432461`, 2026-06-01 ~15:24 UTC)
- **Last commit hash and date:** `cc3321f` — 2026-06-01 (initial codebase briefing)

## Last Session Summary

**Date:** 2026-06-01

**Prompt received from PO:** Record answers to six open questions; write full initial codebase briefing for Homer (six required sections); update session history and suggested next steps. Documentation only — no code changes.

**Work completed:**

- Incorporated Homer's protocol answers (commit pairing, branch, write access, green/yellow, tags, `CHRISTMEDICAL_ALLOW_MAIN`)
- Read solution structure, sync library, API, frontend, ETL, docs, CI history
- Added persistent **## Initial Codebase Briefing for Homer** at end of file
- Replaced placeholder suggested next steps with briefing-informed recommendations

**Decisions made (and why):**

- **Working state yellow:** local tests pass; CI red on lockfile — matches PO definition (green needs both)
- **Briefing is read-only observation:** no runtime sync test against Railway/SQLite in this session

**Issues encountered:**

- `docs/ARCHITECTURE.md` and `docs/DATABASE.md` describe EF Core, Dexie, JWT, Electron — largely **not implemented** in running code

**Files changed:**

- `HOMER.md`

## PO Protocol — Resolved Answers

| # | Topic | Answer |
|---|--------|--------|
| 1 | Commit pairing | End-of-session `chore: update HOMER.md` OK; update when wrapping a logical unit |
| 2 | Branch of record | **`main`** canonical; sync `develop` when useful |
| 3 | Homer write access | **Developer-maintained only** |
| 4 | CI as green | **Both** required: local `make build` + GitHub Actions on `main`; **yellow** = local green, CI not verified/failing |
| 5 | Tags | Developer on milestone; PO can request via prompt (`vX.Y.Z-meaningful-name`) |
| 6 | `CHRISTMEDICAL_ALLOW_MAIN` | Re-tighten when a **second contributor** joins |

## Suggested Next Steps

1. **Fix CI (release gate):** run `npm install` in `frontend/`, commit lockfile so `npm ci` passes — unblocks green status and deploy jobs on `main`.
2. **Homer: sync architecture decision** — choose Dotmim laptop SQLite ↔ Postgres hub vs. API/outbox pattern (see briefing §2–3); current code has Dotmim library **not wired** to API or Next.js.
3. **Reconcile docs vs. code:** update or deprecate `docs/ARCHITECTURE.md` after decision so PO/dev don't plan against JWT/Dexie/Electron that aren't built.
4. **Wireframes Firebase:** commit `firebase.json` + `404.html` + team `.firebaserc` **or** gitignore local project IDs — `index.html` wireframe already tracked.
5. **HIPAA-adjacent hardening** (when prioritized): auth on API, tenant enforcement server-side, audit logging — see briefing §5.

## Session History

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

*Read-only survey as of 2026-06-01. Repo ~35+ commits of active EMR/dashboard work on top of conversion foundation.*

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
- **No Electron app** in repo (only mentioned in docs).
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
- **Electron desktop** documented, not in repo
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
