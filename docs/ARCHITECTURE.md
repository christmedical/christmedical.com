# Christ Medical: Application Architecture

Canonical product decisions live in [`CHRIST_MEDICAL_SPEC_2026.md`](CHRIST_MEDICAL_SPEC_2026.md). This file is the **as-built** stack map.

## 1. System overview

Mission clinic EMR for short-term trips (Belize first). **Mostly connected** (Starlink at sites; brief blips; nightly refresh). PostgreSQL is the single source of truth. Clients talk HTTP to the .NET API — there is **no** Dotmim / SQLite replica / Dexie sync engine.

---

## 2. Technical stack

| Layer | Technology | Hosting / environment |
| :---- | :--------- | :-------------------- |
| **Web / PWA** | Next.js 15 (App Router), React 19, Tailwind 4 | Vercel |
| **Native shells** | iOS (Swift), Android (Kotlin), Desktop (Electron) | Thin WebView → login / tenant portal ([`clients/`](../clients/)) |
| **Field hub** | Docker Compose: API + Postgres | Clinic machines ([`hub/`](../hub/)) |
| **API** | ASP.NET Core 9, Dapper, Npgsql | Railway (and hub) |
| **Database** | PostgreSQL | Railway / hub / local |
| **Client cache** | IndexedDB patient snapshot (read cache) | Browser / PWA |
| **ETL** | `conversion/` + `etl-tool` (Dapper, not EF) | Local / CI |

---

## 3. Persistence & connectivity

- **Primary store:** PostgreSQL (Railway or field hub).
- **PWA cache:** IndexedDB holds up to ~2000 patients per tenant after bulk `GET /api/v1/patients` — **read cache only**. Saves pause when offline; resume when online.
- **Planned (not built):** write **outbox** with idempotent server writes + last-write-wins + audit trail (see 2026 spec §6).
- **Removed:** Dotmim Sync (`sync/` deleted), Dexie, laptop SQLite replicas, “Finish Trip uploads the data.”

Schema detail: [`DATABASE.md`](DATABASE.md), generated tables: [`schema/`](schema/).

---

## 4. Data migration (ETL)

Legacy Access → Postgres:

1. **Extract:** `mdbtools` → CSV + staging SQL.
2. **Stage:** load Access-shaped staging tables.
3. **Refactor:** `conversion/etl-tool` maps staging → production schema (Dapper / SQL).

---

## 5. Connectivity model (2026)

| Mode | Behavior |
| ---- | -------- |
| Online | JWT session; API reads/writes Postgres |
| Brief blip | UI blocks mutating saves; read from IndexedDB cache where available |
| Catch-up | Future outbox drains when stable (not implemented yet) |

Conflict policy when outbox lands: **last-write-wins** + audit log. No multi-master DB sync.

---

## 6. Deployment

- **Vercel:** Next.js PWA / marketing / login hostnames.
- **Railway:** API + Postgres (production).
- **Hub:** Compose stack for clinic servers (`make hub-up` / `christmedical-hub`).
- **GitHub Actions:** lint/build/test + deploy jobs.

---

## 7. Auth & roles (v1)

- **Login:** `api/v1/auth/login` + optional `select-tenant`; JWT Bearer (≈12h access).
- **Roles in token:** `admin` / `coordinator` / `clinician`.
- **Tenant:** JWT `tenant_id` claim; patient routes validate claim vs query/header when present.
- **Open:** anonymous API still allowed when no JWT; require-auth on mutating routes is next security work.

---

## 8. Client topology

```
Browser / PWA  ──HTTP──►  API  ──►  PostgreSQL
Native shells  ──load──►  login / tenant portal (same PWA)
Field hub      ──Compose─► API + Postgres (clinic LAN)
```
