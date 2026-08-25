# Christ Medical — EMR + spiritual care roadmap (checklist)

Living checklist for the **electronic medical records** and **spiritual / gospel engagement** aspects of the mission clinical app. Check items off as we complete them (`[ ]` → `[x]`).

**Security:** Formal hardening and compliance work is grouped **last** so day-to-day feature testing stays fast — but **treat security as a constraint on every item** (least data exposure, tenant isolation, audit thinking, no secrets in client bundles, etc.).

---

## How to use

- Work **top to bottom** within a section when it makes sense; some items can run in parallel.
- When an item ships, update this file in the same PR (or immediately after) so the checklist stays honest.

---

## A. Foundation & identity (multi-tenant EMR)

- [x] Multi-tenant mission context (tenant id, branding, PWA manifest per mission)
- [x] Core patient list + masked display + legacy id correlation
- [x] Patient search (text + spiritual filters + phonetic names)
- [x] Patient chart notes: spiritual + medical/surgical/family/allergies + gospel fields (PATCH, last-write-wins)
- [x] Home dashboard (spiritual + documentation footprint metrics)
- [x] Connectivity: pause saves when offline; resume when online
- [x] **Authentication & authorization (v1)** — login portal, JWT (12h), roles in token, tenant picker, patient routes enforce JWT tenant when present; **remaining:** require auth on mutating APIs (anonymous still allowed without JWT), MFA / session posture (section F)
- [ ] **Audit trail** — who changed what on PHI/spiritual fields, when *(even a thin v1 helps before wide rollout)*
- [ ] Session timeout + device posture expectations for clinic iPads *(align with security section)*

---

## B. Clinical documentation (EMR depth)

- [x] **Encounters / visits** — structured visit flow (date, site, chief complaint, assessment, plan); API + patient detail UI *(provider field / roles later)*
- [x] **Vitals** — capture linked to visit *(trend charts & flowsheets later)*
- [ ] **Problem list & diagnoses** — structured, coded where possible (ICD later optional)
- [ ] **Medications** — active med list, reconciliation, allergy cross-check UX
- [ ] **Immunizations / procedures** — as needed for mission scope
- [ ] **Clinical attachments** — labs, photos (storage, retention, consent) *(plan with security early)*
- [ ] **Clinical decision support** — light reminders (e.g. allergy banner, missing vitals) — *optional, later*

---

## C. Spiritual care & ministry (chart + workflow)

- [x] Gospel engagement fields on patient (heard date, hope, notes) + dashboard rollups
- [ ] **Spiritual care plan** — goals, follow-ups, assigned worker *(if desired beyond free text)*
- [ ] **Referrals / handoffs** — pastoral follow-up, local church connection *(workflow + privacy)*
- [ ] **Reporting for leadership** — exports or saved views (aggregate only where appropriate)
- [ ] **Consent & sensitivity** — UI cues for what is shared vs clinical-only *(policy-driven)*

---

## D. Operations, data quality & migration

- [x] ETL path from legacy Access → Postgres (staging + tooling)
- [x] Phonetic search columns + API/schema alignment
- [ ] **Data validation rules** — required fields per context, duplicate detection hooks
- [ ] **Backup / restore runbooks** for Postgres *(demo remains ephemeral; prod needs clarity)*
- [x] **Environment matrix** — local / demo / CI / deploy paths documented *(root **README**: `make build`, `make demo-up`, `ci.yml`, Railway + Vercel + Docker Hub secrets; explicit “staging” env name still TBD)*
- [ ] **Integration tests** (API + DB) for critical paths; E2E when ready *(today: xUnit + mocked API; DB-backed tests still open)*

---

## E. UX, accessibility & clinical safety

- [ ] **Mobile-first charting** — large tap targets, fewer steps for common tasks
- [ ] **Read-back / confirm** for high-risk actions (if/when added)
- [ ] **Accessibility** — keyboard, contrast, screen reader passes on key flows
- [ ] **Localization** — Spanish (and others) if field teams need it
- [x] **Help & training** — draft `docs/HELP_MANUAL.md` covers shipped **Home**, **Patient search**, **Patient list** (notes + offline + **encounters / vitals**); refresh when behavior changes

---

## F. Security, privacy & compliance (formal pass — *do last for “big bang” hardening, not last in mind*)

*Keep in mind while building A–E: minimize PHI in logs, enforce tenant isolation, never trust the client for authorization.*

- [ ] **Threat model** — assets (PHI + spiritual notes), actors, trust boundaries (PWA, API, DB)
- [ ] **Transport security** — TLS everywhere in prod; HSTS; API-only from browser where appropriate
- [ ] **Authentication hardening** — MFA policy for privileged roles, password/session policies
- [ ] **Authorization** — server-side checks on every mutating route; no “tenantId” trust from client alone
- [ ] **PHI minimization** — masked names in lists; expand only with permission; logging redaction
- [ ] **Encryption at rest** — DB/backups/disks per hosting provider
- [ ] **Secrets management** — CI, Railway/Vercel, Docker Hub; rotate tokens
- [ ] **Dependency & container scanning** — NuGet, npm, base images
- [ ] **Incident response** — contact tree, breach notification draft, backup test restores
- [ ] **Compliance alignment** — understand applicable regime (e.g. HIPAA-style practices if US PHI; mission-specific policies); document choices

---

## G. Quick “security while building” reminders (not a gate — a habit)

- [ ] Every new API write: **authenticated?** **tenant-scoped?** **audited?**
- [ ] Every new UI surface: **least disclosure** (masking, role-based detail)
- [ ] No secrets or real PHI in **fixtures, demos, or screenshots** committed to git

---

*Last updated: 2026-08-25 — section A auth v1 checked (login/JWT/tenant; anonymous-without-JWT still open under F); hub + clients shells shipped; CI deploy path green on main. B encounters/vitals v1 still the baseline (no flowsheet/trends yet).*
