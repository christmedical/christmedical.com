# Christ Medical — Help manual (draft)

Living document for clinic staff and developers. We will refine this into official documentation and/or seed a help chat assistant.

**Last reviewed:** 2026-04-05 (dashboard, patient search, phonetic names).

---

## 1. What this application is

Christ Medical is a **multi-tenant mission clinical workspace**:

- **Web app (PWA)** — dashboard, patient search, and a scrollable patient list with masked names and editable notes.
- **API** — reads and updates Postgres; serves tenant branding and per-mission assets.
- **Conversion (ETL)** — loads legacy Access exports into PostgreSQL with phonetic name fields for search.

Tenant (mission) is selected via URL (`?tenantId=`), local storage, or `NEXT_PUBLIC_TENANT_ID`.

---

## 2. Home dashboard

The **Home** page shows mission-level **spiritual** and **medical documentation** metrics:

| Area | What it measures |
|------|-------------------|
| Spiritual impact | Counts of patients with **heard gospel** (date recorded), **hope/interest** without a heard date yet, and **no spiritual record**. Percent “heard” is relative to all non-deleted patients for the tenant. |
| Medical documentation | How many patients have **allergies**, **medical history**, or **surgical history** text on file, and how many **visit** rows exist in the database. |

These numbers help leadership see **gospel engagement** and **chart completeness** before drilling into individuals. The API must be running and connected to a populated database for charts to load.

---

## 3. Patient search

**Navigation:** **Patient search** in the top bar.

**Workflow:**

1. Type a **legacy id**, a **single name fragment**, or **two words** (first and last).
2. Optionally choose a **spiritual filter** (All · Heard gospel · Hope / interest · No record).
3. Click **Search**.

**Phonetic matching:** The server stores **Double Metaphone** codes (`dmetaphone`) for first and last names. Search matches **spelling** (case-insensitive substring) **or** the same phonetic code, so similar-sounding names (e.g. Catherine / Katherine) can still match when the spelling in the chart differs.

**Filtering without text:** If spiritual is **not** “All”, you may search with an empty box to list patients in that category (up to the result limit).

**Open chart:** Use **Open chart** on a result to jump to the **Patient list** with that person pre-selected (notes and save apply there).

---

## 4. Patient list (full list)

**Navigation:** **Patient list**.

- Loads up to **2,000** patients for the tenant (for offline cache on device).
- **Save** pushes note and spiritual field changes to the server (**last write wins** if two people edit the same patient).
- **Refresh** reloads from the API; offline fallback may show cached data (yellow banner).

---

## 5. PWA and clinical mode (iOS)

On iPhone/iPad, a prompt may invite **Add to Home Screen** for a standalone (no browser chrome) experience. Manifest and icons are **per tenant** when the API URL is configured.

---

## 6. Data and privacy

- Names in the UI are **masked** (initial + `***`) for list and search results.
- **Legacy ids** are shown for correlating with source systems.
- Phonetic fields are **derived** from legal/ chart first and last names during ETL (and can be backfilled on API startup); they are used **only for search**, not displayed in the UI.

---

## 7. Environment (technical)

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_API_URL` | Browser-facing API base (e.g. `http://localhost:5050/api`). Required for dashboard, search, and list. |
| `NEXT_PUBLIC_TENANT_ID` | Default mission id when none in URL/storage. |
| API `ConnectionStrings:DefaultConnection` | Postgres; enables dashboard/search and schema patches (including phonetic columns). |

---

## 8. Changelog (help-focused)

- **2026-04-05** — Added home dashboard (`/`), dedicated patient search with phonetic matching, `/patients` route, help manual stub, schema `first_name_phonetic` / `last_name_phonetic` with `fuzzystrmatch`.

---

*Questions or corrections: open an issue or PR in the repo.*
