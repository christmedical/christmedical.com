# Christ Medical: Data Conversion Pipeline

This directory contains the initial extraction layer for the Christ Medical legacy migration. We use a multi-stage ETL (Extract, Transform, Load) pattern to move data from a legacy Microsoft Access environment into a modern, refactored PostgreSQL architecture.

## The Migration Strategy

1.  **Extract (Bash/mdbtools):** `convert.sh` exports the `.accdb` tables into flat CSV files and generates a raw PostgreSQL schema.
2.  **Staging (C#):** A C# utility loads these CSVs into a "Staging" database that mirrors the original Access structure.
3.  **Refactor (C# ETL):** Business logic runs against the Staging DB to clean, validate, and insert data into the final production schema.

---

## 1. Prerequisites (macOS Intel)

We rely on `mdbtools` to read the Access proprietary format without requiring Windows drivers.

```bash
# Install via Homebrew
brew install mdbtools
```
