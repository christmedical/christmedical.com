# Christ Medical: Data Model (starter)

> Status: TARGET model, drawn from docs/CHRIST_MEDICAL_SPEC_2026.md and the tables introduced by
> queued tasks (auth, tenant routing, feedback). This is a starting reference, NOT authoritative.
> The generated docs (see "Keeping this current" below) are the source of truth; reconcile this
> against them and delete divergences. Column lists here are representative, not exhaustive.

```mermaid
erDiagram
    TENANTS ||--o{ USER_TENANTS : "has members"
    USERS ||--o{ USER_TENANTS : "belongs to"
    TENANTS ||--o{ PATIENTS : scopes
    TENANTS ||--o{ TRIPS : scopes
    TENANTS ||--o{ LOCATIONS : scopes
    TENANTS ||--o{ DIAGNOSES : scopes
    TENANTS ||--o{ TREATMENT_TYPES : scopes
    TENANTS ||--o{ FORMULARY : scopes

    PATIENTS ||--o{ VISITS : has
    PATIENTS ||--o{ PATIENTS : "next of kin"
    TRIPS ||--o{ VISITS : groups
    LOCATIONS ||--o{ VISITS : "seen at"

    VISITS ||--|| VITALS : records
    VISITS ||--|| URINE_LABS : records
    VISITS ||--o{ TREATMENTS : contains
    VISITS ||--o{ PRESCRIPTIONS : orders
    VISITS ||--o{ VISIT_DIAGNOSES : has
    DIAGNOSES ||--o{ VISIT_DIAGNOSES : codes
    TREATMENT_TYPES ||--o{ TREATMENTS : types
    FORMULARY ||--o{ PRESCRIPTIONS : "drawn from"
    USERS ||--o{ TREATMENTS : authored
    USERS ||--o{ VISITS : "created by"

    TENANTS {
        uuid id PK
        string slug "subdomain (reserved list enforced)"
        string name
        jsonb branding "theme tokens"
    }
    USERS {
        uuid id PK
        string email
        string display_name
        string password_hash "ASP.NET Identity hasher"
        boolean is_active
        timestamptz created_at
    }
    USER_TENANTS {
        uuid user_id FK
        uuid tenant_id FK
        string role "clinician | coordinator | admin"
    }
    PATIENTS {
        uuid id PK
        uuid tenant_id FK
        string legacy_patient_id "HC-AB-01-0001"
        string first_name
        string last_name
        date dob
        string sex
        string gov_id
        uuid next_of_kin_id FK "self-ref"
        string marital_status
        string village
        string church
        text allergies "surface at point of care"
        text past_medical
        text past_surgical
        text family_history
        text personal_notes
        text admin_notes
        boolean flag_translator
        boolean flag_hope
        boolean flag_smoke
        boolean flag_alcohol
        boolean hope_gospel
        date heard_gospel_date
        text spiritual_notes
        string phonetic_key "name matching"
        timestamptz created_at
    }
    TRIPS {
        uuid id PK
        uuid tenant_id FK
        string name
        date start_date
        date end_date
        string status "open | closed (one open at a time)"
    }
    VISITS {
        uuid id PK
        uuid patient_id FK
        uuid trip_id FK
        uuid location_id FK
        date visit_date
        text chief_complaint
        text referral
        uuid created_by FK
        timestamptz created_at
    }
    VITALS {
        uuid id PK
        uuid visit_id FK
        numeric height
        numeric weight
        int pulse
        string bp
        int resp
        numeric temp
        int oxygen
        numeric glucose
        numeric hemoglobin
        string preg_test
    }
    URINE_LABS {
        uuid id PK
        uuid visit_id FK
        string leukocytes
        string nitrite
        string protein
        string glucose
        string ketones
        string blood
        numeric ph
        numeric sp_gravity
    }
    TREATMENTS {
        uuid id PK
        uuid visit_id FK
        uuid treatment_type_id FK
        text description
        uuid author_id FK
        boolean follow_up_flag
        string follow_up_type "medical | spiritual"
        boolean follow_up_resolved
        timestamptz created_at
    }
    PRESCRIPTIONS {
        uuid id PK
        uuid visit_id FK
        uuid formulary_id FK
        string medication
        string dose
        int quantity
        text directions
        string status "active | refill | discontinued | not_dispensed"
    }
    VISIT_DIAGNOSES {
        uuid visit_id FK
        uuid diagnosis_id FK
    }
    LOCATIONS {
        uuid id PK
        uuid tenant_id FK
        string name
        string code
    }
    DIAGNOSES {
        uuid id PK
        uuid tenant_id FK
        string category
        string code "R03"
        string name "Sinusitis"
    }
    TREATMENT_TYPES {
        uuid id PK
        uuid tenant_id FK
        string name "General Note, Injection, Nebulizer, ..."
    }
    FORMULARY {
        uuid id PK
        uuid tenant_id FK
        string category
        string code "PA1"
        string medication
        string dose
    }
    FEEDBACK {
        uuid id PK
        string page_path
        real pin_x "viewport-relative 0-1"
        real pin_y
        text note
        string reviewer_label
        string status "open | done"
        timestamptz created_at
    }
```

Notes:

- FEEDBACK is intentionally standalone (no FK to clinical tables) so it can be dropped wholesale.
- Tenant isolation: every clinical table carries tenant_id (directly or via its parent). Confirm and test that a query for one tenant cannot read another's rows.
- The client-side write outbox lives in IndexedDB, not Postgres. Server-side, an idempotency-key store (or a unique constraint on a client-supplied request id) prevents duplicate writes on retry; add that table if not present.

## Keeping this current (the actual requirement)

Generate the schema docs from the live database so they cannot drift, and fail CI when they do:

- Tool: **tbls** (https://github.com/k1LoW/tbls). `tbls doc` writes per-table Markdown + a Mermaid ER diagram; `tbls diff` fails CI when committed docs differ from the live schema.
- Lighter alternative (diagram only): **mermerd**, which emits a single Mermaid file from the DB.

See the wiring task in the repo PR for setup.
