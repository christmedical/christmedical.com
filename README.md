# Christ Medical

**Mission clinic data stack** — .NET API & ETL, Next.js dashboard, Postgres, and offline sync.

<p align="center">

[![CI](https://github.com/christmedical/christmedical.com/actions/workflows/ci.yml/badge.svg)](https://github.com/christmedical/christmedical.com/actions/workflows/ci.yml)
[![Branch reminder](https://github.com/christmedical/christmedical.com/actions/workflows/branch-protection.yml/badge.svg)](https://github.com/christmedical/christmedical.com/actions/workflows/branch-protection.yml)
[![.NET](https://img.shields.io/badge/.NET-9%20%2F%2010-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-data-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</p>

---

## What's in the repo

| Area | Path | Notes |
|------|------|--------|
| HTTP API | `api/` | ASP.NET Core 9, Railway-ready (`Dockerfile`) |
| Mission sync | `sync/` | Dotmim sync helpers for laptop ↔ hub |
| ETL | `conversion/etl-tool/` | Staging → Postgres clinical migration |
| UI | `frontend/` | Next.js 15, deploys to **Vercel** |
| Tests | `tests/`, `frontend/**/*.test.*` | .NET xUnit under `tests/`; **Vitest** + **Testing Library** in `frontend/` (`PatientList`, URL helpers, badge styles) |

---

## Local CI (what GitHub runs)

One command matches **lint + build + test** for .NET and the frontend:

```bash
make build
```

Or manually:

```bash
dotnet restore christmedical.com.sln
dotnet format christmedical.com.sln --verify-no-changes --no-restore
dotnet build christmedical.com.sln -c Release --no-restore
dotnet test christmedical.com.sln -c Release --no-build
cd frontend && npm ci && npm run ci
```

- **.NET**: `Directory.Build.props` turns on `EnforceCodeStyleInBuild`; `dotnet format` enforces `.editorconfig`.
- **Frontend**: `npm run ci` → ESLint, Vitest (including React component tests via Testing Library), `next build`.

When you change behavior or tooling, keep **tests** and this **README** aligned (see `.cursor/rules/tests-and-readme.mdc`).

---

## Development setup

### One-time setup (hooks + checks)

**Make (macOS / Linux):**

```bash
make setup
```

**Or the script:**

```bash
./scripts/dev-setup.sh
```

**Windows:** `scripts\dev-setup.bat`

### Handy Make targets

| Target | What it does |
|--------|----------------|
| `make help` | Lists targets |
| `make setup` | Dev environment setup |
| `make build` | Full lint/build/test (CI parity) |
| `make db-up` / `make db-down` | Postgres via Docker Compose |

---

## GitHub Actions — CI and deploy

- **`ci.yml`**: On every push/PR to `main` or `develop` — restore, **verify formatting**, build all solution projects, run **xUnit** + **Vitest**, production **Next.js** build. On pushes to **`main`** only, also runs deploy jobs (below).
- **`branch-protection.yml`**: Lightweight PR reminder (no failing “gotcha” on merges).

### Deploy secrets (organization or repo)

Configure these in **GitHub → Settings → Secrets and variables → Actions**:

**Railway (API)** — job *Deploy API (Railway)*  
Link the service once locally (`railway link`) if you use a `railway.toml`, or set CLI environment equivalents in the service dashboard. CI expects the token:

| Secret | Purpose |
|--------|---------|
| `RAILWAY_TOKEN` | [Railway account token](https://docs.railway.com/guides/cli#authenticating-with-the-cli) for `railway up` |

In the Railway project, set the **root directory** to the GitHub repo root and the **Dockerfile** to `api/Dockerfile` so `COPY api/ ...` matches this repo layout. Link the service with `railway link` from the machine where you develop, or mirror those settings in the dashboard.

**Vercel (frontend)** — job *Deploy frontend (Vercel)*

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Team / user id (`vercel whoami` / project settings) |
| `VERCEL_PROJECT_ID` | Project id from Vercel |

Set the **production** build command in Vercel to match local checks, e.g. `npm run ci` (or `npm run lint && npm run test && npm run build`).

---

## Branching

Work on feature branches and open PRs into `main`. Prefer **squash merge** so WIP commits collapse into one clear message.

If you need to undo a local commit on `main`:

```bash
git reset --soft HEAD~1   # keep changes
git checkout -b feature/my-fix
```

---

## Project layout (quick)

- `scripts/` — setup and maintenance  
- `.github/workflows/` — CI/CD  
- `conversion/` — SQL, staging load, ETL, appliance images  
- `docs/` — extra documentation  

Questions or improvements — open an issue or PR.
