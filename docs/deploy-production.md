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

### Custom domain (GoDaddy registrar + Vercel nameservers)

**Current setup:** nameservers at GoDaddy point to Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`). DNS records are managed in **Vercel → Domains → christmedical.com → DNS**, not in GoDaddy’s DNS tab.

At **GoDaddy** (registrar only):

1. **Nameservers** → Custom → `ns1.vercel-dns.com` and `ns2.vercel-dns.com` only.
2. **Domain Forwarding** → **Off** (forwarding can intercept traffic before Vercel).
3. Ignore GoDaddy **DNS Records** / **A records** — Vercel owns DNS once nameservers delegate.

In **Vercel DNS** you should have:

| Name | Type | Value |
|------|------|-------|
| `@` | ALIAS | (auto) |
| `www` | CNAME | `cname.vercel-dns.com` |

**Expected behavior:** `https://christmedical.com` → **308 redirect** → `https://www.christmedical.com` → app. That is normal when both domains are on the project.

Verify delegation (should **not** show `domaincontrol.com`):

```bash
dig +short christmedical.com NS
dig +short christmedical.com A
curl -sI https://christmedical.com | grep -i location
```

If `dig NS` still shows GoDaddy nameservers locally, flush DNS or wait for propagation (up to 24–48h). Public resolvers (8.8.8.8) should already show Vercel.

**Alternative (DNS stays at GoDaddy):** revert nameservers to GoDaddy defaults and use A records `@` and `www` → `76.76.21.21` instead (see Vercel domain settings).

Verify in Vercel:

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
- Add **PostgreSQL** (service name is often `Postgres`).
- On **christmedical-api** → **Variables**, set **`ConnectionStrings__DefaultConnection`** in **ADO.NET / Npgsql keyword form** (not a raw `postgresql://` URI pasted by hand).

#### Connection string (Railway dashboard)

**Option A — ADO.NET with variable references (recommended)**

On **christmedical-api** → **Variables** → **New Variable**:

- **Name:** `ConnectionStrings__DefaultConnection`
- **Value:** build from Postgres references (use **Add Reference**, do not type `${{` yourself):

```text
Host=${{Postgres.RAILWAY_PRIVATE_DOMAIN}};Port=5432;Database=${{Postgres.POSTGRES_DB}};Username=${{Postgres.POSTGRES_USER}};Password=${{Postgres.POSTGRES_PASSWORD}};SSL Mode=Require
```

Replace **`Postgres`** with your Postgres service’s exact name if different. Railway may expose `PGHOST`, `PGUSER`, etc. — use the reference picker and map to:

```text
Host=<PGHOST>;Port=<PGPORT>;Database=<PGDATABASE>;Username=<PGUSER>;Password=<PGPASSWORD>;SSL Mode=Require
```

**Option B — URI reference (API converts at startup)**

Reference **`DATABASE_PRIVATE_URL`** from the Postgres service. The API (`PostgresConnectionString.Normalize`) converts `postgresql://…` to ADO.NET form on boot (requires deploy from commit `6f0298c` or later).

**Do not** paste literal text like `${{Postgres.DATABASE_URL}}` — that crashes with “Format of the initialization string… at index 0”. Use Railway’s **Reference** UI so the value resolves to a real URL or keyword string.

Also set:

```text
ASPNETCORE_ENVIRONMENT=Production
```

- **Networking** → port **8080** → **Generate Domain**; use that URL as `NEXT_PUBLIC_API_URL` on Vercel.

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
- [ ] GoDaddy nameservers → Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`); forwarding **off**
- [ ] Railway `ConnectionStrings__DefaultConnection` in ADO.NET form (see §3)
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
