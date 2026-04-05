# Christ Medical: Data Conversion Pipeline

This directory is the **conversion** workspace (kept separate from the main application). It holds the ETL **.NET project** (`etl-tool/`), Access **extract** scripts (`etl/`), **data/**, and the **appliance** Docker stack (`docker-compose.yml` — run from `conversion/`).

This directory contains the initial extraction layer for the Christ Medical legacy migration. We use a multi-stage ETL (Extract, Transform, Load) pattern to move data from a legacy Microsoft Access environment into a modern, refactored PostgreSQL architecture.

## The Migration Strategy

1.  **Extract (Bash/mdbtools):** `convert.sh` exports the `.accdb` tables into flat CSV files and generates a raw PostgreSQL schema.
2.  **Staging (C#):** A C# utility loads these CSVs into a "Staging" database that mirrors the original Access structure.
3.  **Refactor (C# ETL):** Business logic runs against the Staging DB to clean, validate, and insert data into the final production schema.

---

## Prerequisites (macOS Intel)

We rely on `mdbtools` to read the Access proprietary format without requiring Windows drivers.

```bash
# Install via Homebrew
brew install mdbtools
```

---

```SQL
COMMENT ON COLUMN "patients"."ssno" IS 'Social Security # (only if Pap is being performed)';
COMMENT ON COLUMN "patients"."allergies" IS 'Any known drug allergies';
COMMENT ON COLUMN "patients"."medhist" IS 'Any past medical history (DM, HTN,  Cancer)';
COMMENT ON COLUMN "patients"."surgeries" IS 'Any past surgeries including C-Sections';
COMMENT ON COLUMN "patients"."maritalstatus" IS 'Married, Single, Divorced, Common Law';
COMMENT ON COLUMN "patients"."smoke" IS 'Does Pt. smoke even if only occasionally';
COMMENT ON COLUMN "patients"."alcohol" IS 'Does Pt. drink alcohol even if only occasionally';
COMMENT ON COLUMN "patients"."famhist" IS 'Any past FAMILY medical history (DM, HTN,  Cancer)';
COMMENT ON COLUMN "patients"."gender" IS 'Male or Female';
COMMENT ON COLUMN "patients"."gyng" IS 'Number of births';
COMMENT ON COLUMN "patients"."gynp" IS 'Number of pregnancies';

COMMENT ON COLUMN "visits_rx"."dnd" IS 'Did not Dispense';
```
