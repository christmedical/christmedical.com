# Christ Medical: Product Spec 2026

Status: Draft for PO review (Howard 🩺, 2026-06-10)
Supersedes: the 2016 Mission Medical deck and the offline-first portions of docs/ARCHITECTURE.md
Companion docs: docs/EMR_ROADMAP_CHECKLIST.md (execution order), docs/DATABASE.md (schema), HOWARD.md (session log)

---

## 1. Mission

A clinical workspace for short-term medical mission trips (Belize first), run by small teams on tablets, that captures patient charts, visits, treatments, and gospel engagement, and gives leadership visibility into both medical and spiritual impact.

The 2016 effort produced a complete product design and a working Access system. The rewrite stalled for one reason: occasionally-connected sync was too large for a sole developer. Two things changed. The field now has Starlink, and the developer now has an AI implementation team. Sync is no longer required, and the rest is now tractable.

## 2. What changed since 2016

| 2016 assumption | 2026 reality |
|---|---|
| Little connectivity; days offline | Starlink at sites; mostly connected with brief blips; nightly refresh guaranteed |
| Laptops + Electron desktop clients | Tablets running the PWA in a browser |
| CouchDB / PouchDB / SQLite replicas | PostgreSQL, single source of truth |
| Store-and-forward sync engine | Write outbox with retry (Section 6) |
| Sole human developer | Director + AI implementers (Claude Code, Cursor, Jules) |
| Access database in production | Access data migrated via the conversion/ ETL; Access retires after first live trip |

Explicitly dead: Dotmim Sync, Electron, Dexie, SQLite replicas, "Finish Trip uploads the data." Any doc that still says occasionally-connected is wrong and should be reconciled to this spec.

## 3. Users and roles

2016 named Admin, User, Registration, Doctors. 2026 maps these onto the three auth roles:

| Role | Who | Can |
|---|---|---|
| admin | Trip/system administrator | Everything: users, dictionaries, trips, all patient data, reports |
| coordinator | Registration desk, trip leadership | Create/edit patients and visits, run reports, manage follow-ups, open/close trips |
| clinician | Doctors, nurses, pharmacy | Full chart read/write: visits, vitals, treatments, prescriptions, follow-ups |

Single tenant per deployment. Tenant comes from the JWT claim, never from the client.

## 4. Domain model

Core chain (unchanged from 2016, already in Postgres):

Trip -> Visit -> (Vitals, Labs, Treatments) ; Patient owns Visits ; Patient owns gospel fields.

- **Patient**: demographics, Gov ID, next of kin (by Patient ID, displaying the linked patient's name), histories (allergies, medical, surgical, family), personal/admin notes, Gyn (G/P), flags (translator, hope, smoke, alcohol), gospel fields (hope_gospel, heard_gospel_date, spiritual_notes). Patient ID format: Location-Trip-Machine-AutoSync# (e.g. HC-AB-01-0001); preserved for legacy correlation, new IDs server-assigned.
- **Trip**: name, date range, open/closed. Business rules from 2016 stand: one open trip at a time; a trip cannot close while any workstation/session is unfinished (2026 translation: while any device has unsynced outbox entries, see Section 6).
- **Visit**: date, location (from dictionary), chief complaint, diagnoses (multi, coded), referral, vitals row, urine labs row.
- **Treatment**: typed entries on a visit. Types from 2016: General Note, Injection, Nebulizer, Procedure, Biopsy, Pap Smear, IND, Chiropractic, Laceration. Each treatment can be flagged for follow-up with a type of medical or spiritual.
- **Prescription**: medication + dose (from formulary), quantity, directions. 2016 rule kept: creating a new visit copies forward only active prescriptions (not discontinued / not-dispensed). The 2016 open TODO (how to mark refill / discontinue / did-not-dispense) is now a v1 requirement: three explicit statuses on the visit's prescription rows.
- **Dictionaries (admin-managed)**: Locations (name + code), Diagnoses (category, code, name; e.g. R01 Upper Respiratory Infection), Treatment types, Formulary (category, code, medication + dose; e.g. PA1 Acetaminophen 325mg). All editable in Settings; no hardcoded clinical lists.

## 5. Core workflows

1. **Registration**: search first (ID, name with phonetic matching, DOB; returns next-of-kin matches when searching by ID), then create if new. Duplicate creation is the known failure mode; v2 has merge, v1 has search-first UX.
2. **Visit capture**: open chart, add visit, vitals with per-field trend arrows vs previous visit (hover/tap shows prior value), labs, diagnoses from dictionary, treatments, prescriptions.
3. **Follow-up queue**: list of flagged treatments, alphabetical, filterable by medical/spiritual and by user. Resolve = enter a note (saved as a new treatment of the chosen type), flag clears, item leaves the queue. This doubles as the spiritual care workflow in roadmap section C.
4. **Trip lifecycle**: create trip (admin), devices begin trip, work, devices finish, trip closes when all devices are clean (no pending outbox writes).
5. **Print/reports** (browser print, print-optimized CSS): Patient List; Full Patient History with Meds; Blank New Patient Form; Patients per Doctor; Medications for Trip (requested in 2016, promote to v1). Plus the existing dashboard for spiritual/documentation metrics.

## 6. Connectivity model (the 2026 decision)

Mostly connected. Blips happen; long offline days do not. The bar, verbatim from the owner: the system does not need to be seamless when the connection fails, it needs to remain stable and catch up gracefully.

- **Reads**: serve from the existing IndexedDB patient cache when the network blips; revalidate when it returns. The cache is a buffer, not a database.
- **Writes**: outbox pattern. Every mutation gets a client-generated UUID (idempotency key), is queued in IndexedDB, POSTed immediately, and retried with backoff on failure and on the browser online event. The server treats the UUID as idempotent: a retried write that already landed is a no-op, never a duplicate.
- **Conflicts**: last-write-wins, with the audit trail (roadmap section A) recording who/what/when. No merge UI.
- **UX**: a small pending-changes indicator (count badge) and the existing connectivity banner. No offline mode screens, no sync dashboard.
- **Auth during blips**: 12-hour JWT covers a clinic day; re-auth happens naturally at the nightly hotel refresh.

## 7. Out of scope for v1

Duplicate patient merge, scanned document attachments, pharmacy barcodes and labels (all 2016 V2, still V2), ICD coding beyond the local dictionary, localization, clinical decision support, multi-tenant-per-deployment.

## 8. Open questions for the human PO

Carried from the 2016 deck (page 16, never resolved) plus new ones:

1. Report changes: any edits to the four legacy reports? Confirm Medications for Trip columns.
2. Which vitals/labs fields get the up/down trend indicator (all, or a subset)?
3. Does chronic illness need its own field, or does medical history cover it?
4. Is the free-text description sufficient for Pap Smear treatments?
5. What is Referral actually used for in the field (text today; does it need structure or a follow-up hook)?
6. Should Church become a dropdown (dictionary) instead of free text?
7. New: confirm the three prescription statuses (refill, discontinued, did not dispense) match pharmacy practice on the ground.
8. New: who are the named roles on the next trip (maps people to admin/coordinator/clinician)?
9. New: confirm the legacy Access system retires after the first live trip on this app, and what the fallback plan is for that trip.

## 9. Delivery plan (maps to the roadmap checklist)

1. Auth v1 (**done** — login/JWT/tenant; require-auth on mutating routes still open)
2. Delete Dotmim + reconcile docs to this spec (**done** — `sync/` removed; ARCHITECTURE/DATABASE/README aligned)
3. Write outbox + idempotent server writes (Section 6)
4. Audit trail v1 (thin: who/what/when on PHI and spiritual fields)
5. Clinical depth: coded diagnoses UI, treatments + flag/follow-up queue, prescriptions with statuses and copy-forward, formulary settings
6. Trip lifecycle + device-clean close rule
7. Print/report suite
8. UX pass on tablet ergonomics (large targets, fewest taps per visit) using the design exploration below
9. Security hardening pass (roadmap section F) before the beta trip

2016's launch sequence still applies and is the milestone frame: walkthrough with the PO, mock session, beta trip with a backup plan, full launch.

## Appendix A: v0.dev exploration prompt (patient chart)

> Design a patient chart screen for a mission clinic EMR used on tablets in the field. Stack: Next.js App Router, Tailwind 4, React 19. Layout: persistent left rail with icon actions (search, add patient, follow-ups, print, settings); top patient summary card (photo placeholder, name, Patient ID like HC-AB-01-0001, DOB/age, flags as small chips: translator, hope, smoke, alcohol); below it a visit timeline selector (date navigation, add visit) and two tabs: Overall (chief complaint, coded diagnoses as removable chips, referral, vitals grid with tiny up/down trend arrows vs prior visit, urine labs grid) and Treatments (typed treatment cards with author + date, flag-for-follow-up toggle showing medical/spiritual, prescriptions table: medication and dose, quantity, directions, status pill for active/refill/discontinued/not dispensed). Visual direction: calm clinical, high contrast for sunlight-readable tablets, large touch targets, generous spacing, subtle warm accent color, no purple-on-white SaaS clichés. Include a small pending-changes badge (e.g. "2 pending") near the save area and a slim offline banner state. Optimize for fewest taps to add a visit and record vitals.

Repeat the pattern for the follow-up queue and the trip dashboard, then port the winning direction into the repo's Storybook components.

## Appendix B: source map

- 2016 Mission Medical deck: roles, Patient ID, trip rules, chart layout, treatments/prescriptions rules, follow-up workflow, settings dictionaries, reports, V2 list, launch sequence.
- Current repo (main @ v0.2.2-ci-green): shipped dashboard, search, patient list/chart notes, encounters + vitals, ETL, tenant branding, IndexedDB read cache.
- Owner decisions 2026-06: drop sync, mostly-connected model, outbox bar ("stable, catch up gracefully"), Access data received from the original PO, PO re-engages after visible progress.
