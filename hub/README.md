# Christ Medical hub (field server)

The **hub** is the clinic machine that runs the Christ Medical API and Postgres so tablets on the local network can work against a local stack.

This directory is the **single source of truth** for how the hub runs: Docker Compose (`api` + `db`). Platform tray apps (later PRs) only start/stop/monitor this stack.

## Prerequisites

1. **Docker Engine** (Linux) or **Docker Desktop** (Mac/Windows) with the Compose v2 plugin (`docker compose`).
   - Install: https://docs.docker.com/engine/install/
2. Outbound network once to pull images (or build the API from this repo).
3. A non-technical “server person” with sudo/group access to Docker.

## Quick start (Linux)

```bash
cd hub
cp .env.example .env
# Edit .env: POSTGRES_PASSWORD, JWT_SECRET, HUB_ADMIN_EMAIL, HUB_ADMIN_PASSWORD

chmod +x christmedical-hub
./christmedical-hub install
./christmedical-hub start
./christmedical-hub status
```

API base URL (default): `http://127.0.0.1:5050`  
- Liveness: `GET /health` → `{ "status": "ok", "api": true }`  
- Readiness: `GET /ready` → `{ "status": "ready", "api": true, "database": true }` (503 if DB down)

On first API start the container:

1. Applies schema migrations if the database is empty (idempotent bootstrap).
2. Upserts the **hub admin** from `HUB_ADMIN_*` (safe to re-run).
3. Optionally seeds demo patients when `SEED_DEMO_DATA=true` (leave `false` for a real clinic).

## CLI reference

| Command | What it does |
|---------|----------------|
| `install` | Verify Docker, create `.env` if missing, pull images |
| `start` | `docker compose up -d` and wait for `/ready` |
| `stop` | `docker compose down` (**keeps** the Postgres volume) |
| `restart` | stop + start |
| `status` | Compose status + health probes |
| `logs` | Follow container logs |
| `pull` | Pull newer images |

All commands must be run from a machine that can reach the Docker daemon. The script lives next to `docker-compose.yml`.

## Configuration (`.env`)

Copy `.env.example` → `.env`. Important keys:

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PASSWORD` | Database password (required) |
| `JWT_SECRET` | API token signing key, 32+ chars (required) |
| `API_PORT` / `POSTGRES_PORT` | Host ports (defaults `5050` / `5432`) |
| `API_IMAGE` | Image to run (default `christmedical/christmedical-api:latest`) |
| `HUB_ADMIN_EMAIL` / `HUB_ADMIN_PASSWORD` | First admin account (idempotent upsert) |
| `HUB_TENANT_ID` | Tenant for that admin (default `1` = belize seed tenant) |
| `HUB_TENANT_SLUG` / `HUB_TRIP_ID` | Operator identity metadata (optional) |
| `SEED_DEMO_DATA` | `true` only for demos |

**Do not commit `.env`.** Only `.env.example` is in git.

## Persistence

Postgres data lives in the Docker named volume `christmedical_hub_postgres_data`.  
`./christmedical-hub stop` does **not** delete it. To wipe the clinic DB (destructive):

```bash
docker compose -f docker-compose.yml --project-directory . down -v
```

## Building the API image locally

By default the hub builds from `../api/Dockerfile` into `christmedical-hub-api:local` (`./christmedical-hub start` passes `--build`).

To run a published Docker Hub image instead:

```bash
# in hub/.env
API_IMAGE=christmedical/christmedical-api:latest
```

Published images are produced by the existing `make deploy` / Docker Hub workflow — this packaging does not fork the API build.

## Tablets / LAN

Point clinic clients at `http://<hub-lan-ip>:5050/api` (or your reverse proxy). Adjust `CORS_ORIGINS` if browsers call the API from a non-default origin. `localhost` is always allowed by the API.

## What’s next (not in this PR)

- **PR 2:** tray / menu-bar supervisor (Windows + Mac) that wraps this compose stack  
- **PR 3:** Inno Setup + macOS `.dmg` installers for that tray app  

Linux remains CLI + Compose as documented here.
