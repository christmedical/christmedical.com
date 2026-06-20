# AGENTS.md

This repo also has detailed contributor/AI guidance in `README.md` and `HOMER.md`. Standard
lint/build/test/run commands live in `README.md` ("Local CI") and the `Makefile`; prefer those.

## Cursor Cloud specific instructions

The Cloud VM is provisioned for **native** development (no Docker). The update script only
refreshes project dependencies (`dotnet restore`, `npm ci`, Playwright Chromium). System
dependencies below are baked into the VM snapshot — do not reinstall them.

### Toolchain (already installed, persisted in snapshot)
- **.NET 9 + .NET 10 SDKs** at `~/.dotnet` (the solution mixes `net9.0` for `api`/`sync` and
  `net10.0` for `conversion/etl-tool`, so both are required). `~/.dotnet` is on `PATH` via
  `~/.bashrc`. Non-interactive scripts that don't source `~/.bashrc` should call
  `~/.dotnet/dotnet`.
- **Node 22** (system) + npm. CI uses Node 20, but 22 builds/tests fine.
- **PostgreSQL 16** installed natively (not Docker).

### Postgres (must be started each session)
The cluster does **not** auto-start. Start it before running the API or DB-backed work:

```bash
sudo service postgresql start
```

Connection (matches `api/appsettings.json` default): host `localhost`, port `5432`, db
`christ_medical`, user `postgres`, password `password`. The schema + demo data are already
loaded and persisted in the snapshot. To rebuild the DB from scratch (drop + reapply), run the
`conversion/etl/V{1,2,4,5,6,7}__*.sql` files in that order, then `demo/db/99_demo_seed.sql`
(this mirrors the order in `docker-compose.yaml` / `demo/db/Dockerfile`). The API also runs
idempotent `ALTER TABLE` patches on startup (`DbSchemaInitializer`) but does **not** create the
base schema, so the SQL files must be applied to any fresh database.

### Running the app (dev mode)
Two long-running services — run each in its own tmux session:
- **API**: from repo root `dotnet run --project api/WebAPI.csproj`. It binds to
  `http://localhost:5050` from `api/Properties/launchSettings.json` (this overrides
  `ASPNETCORE_URLS`). API base path is `/api` (e.g. `http://localhost:5050/api/v1/patients?tenantId=1`).
- **Web**: from `frontend/` run `NEXT_PUBLIC_API_URL=http://localhost:5050/api npm run dev`
  (port 3000, redirects `/` → `/queue`). `NEXT_PUBLIC_API_URL` is **required** — components throw
  if it is unset.

### Gotchas
- Docker is **not** installed, so the Docker-based flows (`make run`, `make demo-up`,
  `make db-up`) will not work here; use the native dotnet/npm/postgres flow above.
- Frontend `npm run test` / `npm run ci` runs Storybook interaction tests through Playwright
  Chromium. If they fail to launch a browser, run `npx playwright install chromium` in `frontend/`.
