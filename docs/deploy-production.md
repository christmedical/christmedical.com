# Production deploy — Vercel (frontend) + Railway (API)

Christ Medical production stack:

| Layer | Host | Project |
|-------|------|---------|
| Frontend (Next.js PWA) | [Vercel](https://vercel.com) | `christmedical-com` |
| API (.NET) | [Railway](https://railway.com) | `christmedical` / service `christmedical-api` |
| Custom domain | GoDaddy DNS → Vercel | `christmedical.com`, `www.christmedical.com` |

CI (`.github/workflows/ci.yml`) deploys both on every push to **`main`** after the build job passes.

---

## 1. GitHub Actions secrets

In **GitHub → Settings → Secrets and variables → Actions**, set:

| Secret | How to obtain |
|--------|----------------|
| `VERCEL_TOKEN` | [Vercel → Account → Tokens](https://vercel.com/account/tokens) (classic token recommended for CI) |
| `VERCEL_ORG_ID` | `frontend/.vercel/project.json` → `orgId` after `vercel link`, or Vercel project settings |
| `VERCEL_PROJECT_ID` | `frontend/.vercel/project.json` → `projectId` |
| `RAILWAY_TOKEN` | [Railway → Account → Tokens](https://railway.com/account/tokens) |

From repo root (reads `RAILWAY_TOKEN` from `.env` if present):

```bash
./scripts/set-railway-github-secret.sh
```

Vercel IDs for this repo (team **Jamey's projects**):

- `VERCEL_ORG_ID`: `team_ixcEv4DbgbMlhf2Vg3FyM3kc`
- `VERCEL_PROJECT_ID`: `prj_99z7UWCo8l6hGG71zpe4y6HYSqFj`

Railway IDs wired in CI:

- Project: `5084d868-f41c-428c-92a8-950e5464b450`
- Service: `1458908a-791e-470d-b83c-19996bdf6714` (`christmedical-api`)

---

## 2. Vercel — frontend

### Link project (once per machine)

```bash
cd frontend
vercel link --yes --scope jameys-projects-36d9ff51 --project christmedical-com
```

### Production env var

The app calls the API via `NEXT_PUBLIC_API_URL` (public; baked into the client bundle).

```bash
cd frontend
vercel env add NEXT_PUBLIC_API_URL production
# Value: Railway public API URL, e.g. https://christmedical-api-production.up.railway.app
vercel deploy --prod
```

### Custom domain (GoDaddy)

**Do not change nameservers** if DNS stays on GoDaddy (`ns49.domaincontrol.com`, `ns50.domaincontrol.com`).

Add these records in GoDaddy DNS:

| Type | Host | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| A | `www` | `76.76.21.21` |

Vercel provisions SSL after DNS propagates. Production alias: **https://www.christmedical.com**

Verify:

```bash
cd frontend
vercel domains inspect christmedical.com
```

---

## 3. Railway — API

### Project setup (once)

```bash
cd /path/to/christmedical.com
railway login
railway init    # name: christmedical — or railway link to existing project
railway add --service christmedical-api
```

In the [Railway dashboard](https://railway.com/project/5084d868-f41c-428c-92a8-950e5464b450):

- Service **christmedical-api**: `railway.toml` at repo root sets `dockerfilePath = "api/Dockerfile"` (do **not** use root `Dockerfile` — that is the ETL image and references unavailable .NET 10 preview tags).
- Add **PostgreSQL** (or external DB) and set `ConnectionStrings__DefaultConnection` for the API
- Generate a public domain for the API service; use that URL as `NEXT_PUBLIC_API_URL` on Vercel

### Deploy from laptop

```bash
railway up --detach
```

### Deploy via CI

Push to `main` (or re-run failed workflow):

```bash
gh run list --branch main --limit 5
gh run rerun <run-id> --failed
```

---

## 4. End-to-end checklist

- [ ] GitHub secrets: `VERCEL_*` + `RAILWAY_TOKEN`
- [ ] GoDaddy A records for `@` and `www` → `76.76.21.21`
- [ ] Railway API deployed with Postgres connection string
- [ ] `NEXT_PUBLIC_API_URL` on Vercel points at Railway API URL
- [ ] `make build` green locally
- [ ] CI build + both deploy jobs green on `main`

---

## 5. Local secrets (optional)

`.env` at repo root is **gitignored**. Useful for Docker Hub publish (`make deploy`) and one-shot secret upload:

```bash
# .env (never commit)
RAILWAY_TOKEN=...
VERCEL_TOKEN=...
```

`VERCEL_TOKEN` in `.env` does **not** feed GitHub Actions; use `gh secret set` or the scripts above.
