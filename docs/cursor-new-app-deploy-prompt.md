# Cursor prompt: greenfield app deploy template

Copy everything below the `---` into a **new Cursor chat** when standing up the next Christ Medical–style app (Next.js PWA + .NET API + Postgres). Paste your repo name and domain where indicated.

Opinionated defaults reflect what we learned shipping **christmedical.com** (June 2026): empty Railway Postgres, missing `/api` suffix on Vercel, CORS, and historical log noise from failed deploys.

---

## Prompt (copy from here)

```
PROJECT GATE
Repo: <org>/<repo>   # e.g. christmedical/christmedical.com
If the working directory is not this repo, say so and stop.
Branch: main for deploy fixes; feature work on feat/* branches. Do not push main casually.

GOAL
Stand up production: Vercel (Next.js frontend) + Railway (.NET API + Postgres) with CI deploy on push to main. First deploy must succeed on an EMPTY database (no manual psql step).

ARCHITECTURE (non-negotiable)
- One Next.js app on Vercel (PWA, standalone output).
- One .NET 9 Web API on Railway (Dockerfile under api/, NOT repo root).
- Postgres on Railway; schema applied at API startup from bundled SQL (DbSchemaBootstrap pattern).
- Frontend calls API via NEXT_PUBLIC_API_URL — value MUST end with /api (e.g. https://api.example.com/api), because routes are /api/v1/...
- CORS on API allows production apex + www + localhost:3000 (env CORS_ORIGINS override OK).
- GET /health for Railway healthcheck (not /).

REPO LAYOUT (create if missing)
- api/Dockerfile          — COPY conversion/etl/V*.sql into /app/sql/
- api/Infrastructure/DbSchemaBootstrap.cs — apply V1..V7 when public.patients missing; optional SEED_DEMO_DATA
- api/Infrastructure/CorsOrigins.cs
- api/Controllers/HealthController.cs
- railway.toml            — dockerfilePath = "api/Dockerfile", healthcheckPath = "/health"
- .github/workflows/ci.yml — build/test job; deploy-api (railway up); deploy-frontend (vercel deploy --prod)
- docs/deploy-production.md — secrets, DNS, connection string, human checklist

RAILWAY (API service)
Variables on christmedical-api (use Reference picker, never literal ${{...}}):
- ConnectionStrings__DefaultConnection — ADO.NET from Postgres reference:
  Host=${{Postgres.RAILWAY_PRIVATE_DOMAIN}};Port=5432;Database=${{Postgres.POSTGRES_DB}};Username=${{Postgres.POSTGRES_USER}};Password=${{Postgres.POSTGRES_PASSWORD}};SSL Mode=Require
- ASPNETCORE_ENVIRONMENT=Production
- SEED_DEMO_DATA=true   # first deploy only; demo patients for smoke test
- CORS_ORIGINS=https://www.<domain>,https://<domain>,http://localhost:3000
Networking: port 8080, Generate Domain → use as API base (without /api) for docs; Vercel gets base + /api.

VERCEL (frontend)
Secrets in GitHub Actions: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, RAILWAY_TOKEN
Production env:
- NEXT_PUBLIC_API_URL=https://<railway-host>/api   # trailing /api required

DNS (human — document in PR, do not automate)
- Registrar nameservers → Vercel only (ns1.vercel-dns.com, ns2.vercel-dns.com).
- Ignore registrar DNS tab after delegation.
- Apex + www in Vercel Domains; apex 308 → www acceptable.
- For subdomain routing later: wildcard *.domain + wildcard cert in Vercel (human task).

LOCAL .env (gitignored, never commit)
- RAILWAY_TOKEN, VERCEL_TOKEN (or VERGEL_TOKEN typo — fix it)
- DATABASE_PUBLIC_URL for one-off psql migrations if bootstrap fails
- NEXT_PUBLIC_API_URL=http://localhost:5050/api for local docker compose

IMPLEMENTATION CHECKLIST (agent)
1. DbSchemaBootstrap runs before Kestrel serves traffic; never ALTER TABLE patients if table missing.
2. Dockerfile copies SQL into /app/sql/.
3. Program.cs normalizes postgresql:// URLs; rejects unresolved ${{ in connection string.
4. make build passes (dotnet test + frontend npm run ci).
5. Smoke after deploy:
   curl https://<api>/health
   curl "https://<api>/api/v1/patients?tenantId=1&limit=3"
6. Update docs/deploy-production.md and README deploy section.
7. Tag release v0.x.y-<feature> after green production smoke test.

ANTI-PATTERNS (learned the hard way)
- Do NOT use root Dockerfile on Railway (ETL image, wrong .NET version).
- Do NOT run DbSchemaInitializer ALTER-only patches without checking table exists first.
- Do NOT set NEXT_PUBLIC_API_URL without /api — frontend will 404 on /v1/patients.
- Do NOT diagnose production from old Railway log timestamps; filter by active deployment ID.
- Do NOT paste DATABASE_URL ${{Postgres...}} literally in Railway dashboard.

ACCEPTANCE
- Empty Railway Postgres → API starts, /health 200, patients endpoint returns JSON (seed or []).
- Vercel production loads site; browser network calls hit .../api/v1/... not .../v1/...
- CI deploy-api + deploy-frontend green on push to main.
- docs/deploy-production.md matches reality.

When done: report deployment URLs, Vercel env value used, and any human DNS steps remaining.
```

---

## How to use

1. Create the GitHub repo and link Vercel + Railway projects first (or let the agent document IDs after `vercel link` / `railway link`).
2. Paste the prompt above into Cursor Agent mode.
3. After first green deploy, tag (e.g. `v0.1.0-production-live`) and iterate features on `feat/*` branches.

## Related docs in this repo

- [deploy-production.md](./deploy-production.md) — Christ Medical–specific IDs and DNS
- [HELP_MANUAL.md](./HELP_MANUAL.md) — local dev and env vars
