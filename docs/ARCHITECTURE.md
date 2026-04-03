# Christ Medical: Application Architecture

This document defines the high-level architecture for the Christ Medical mission system, transitioning from a legacy MS Access database to a modern, occasionally-connected Web/PWA and Desktop ecosystem.

## 1. System Overview

The system is designed to support medical missions in Belize, where internet connectivity is intermittent. Data is entered locally on laptops (Electron) or iPads (PWA) and synchronized to a central cloud server when a connection is available.

---

## 2. Technical Stack

| Layer                 | Technology                  | Hosting / Environment |
| :-------------------- | :-------------------------- | :-------------------- |
| **Frontend**          | React (Vite) + Tailwind CSS | Vercel                |
| **Desktop Wrapper**   | Electron                    | Local (Intel MBP)     |
| **API**               | .NET 8/9 (C#) + EF Core     | Railway               |
| **Database**          | PostgreSQL                  | Railway               |
| **Local Persistence** | IndexedDB (via Dexie.js)    | Browser/Electron      |

---

## 3. Database & Persistence

The application utilizes a **Local-First** persistence model to ensure reliability during medical missions in areas with intermittent internet connectivity.

- **Primary Store:** A centralized **PostgreSQL** instance hosted on **Railway**.
- **Local Store:** **IndexedDB** (via Dexie.js) serves as the local cache on iPads (PWA) and Laptops (Electron).
- **Synchronization:** Data is synchronized using a **Store and Forward** pattern. Records are authored locally with unique UUIDs and pushed to the Railway API during the "Finish Trip" phase when a connection is detected.

> Detailed schema definitions, entity relationship diagrams (ERD), and data flow charts are documented in [Database Architecture](DATABASE.md).

---

## 4. Data Migration Pipeline (ETL)

To move data from the legacy Access DB into the refactored schema, we use a three-stage process:

1.  **Extract:** `mdbtools` exports `.accdb` to CSV and a `staging_schema.sql` file.
2.  **Stage:** A C# utility loads raw CSV data into "Staging Tables" in Postgres that mirror the original Access structure.
3.  **Refactor:** An EF Core-driven ETL service maps staging data to the final Production Schema, handling:
    - Normalization of specialized visits (Gyn, Eye, Chiro) into a unified `Treatments` model.
    - Conversion of Access `-1/0` values to Booleans.
    - Generation of the new Patient ID format: `Location-Trip-Machine-AutoSync#`.

---

## 5. Synchronization Strategy

### "Store and Forward" Model

- **Offline Mode:** Data entered in the field is saved to **IndexedDB**.
- [cite_start]**Unique Identifiers:** To prevent collisions during sync, every record uses a `MachineID` and an `AutoSync#` as part of its primary key or Display ID.
- [cite_start]**Sync Trigger:** Users manually trigger a "Finish Trip" or "Sync" action when internet is detected[cite: 101].
- **Conflict Resolution:** The central PostgreSQL database on Railway acts as the "Source of Truth." Conflicts are resolved via "Last Write Wins" based on client-side timestamps.

---

## 6. Deployment & Infrastructure

- **Vercel:** Hosts the React PWA for easy access on mobile devices/iPads.
- **Railway:** Hosts the C# API and the PostgreSQL instance.
- **GitHub:** Source control and CI/CD pipeline (ChristMedical organization).

---

## 7. Security & Roles

- [cite_start]**Admin:** Full access to Settings (Users, Locations, Diagnosis, Prescriptions)[cite: 12, 408].
- [cite_start]**User:** Access to search, patient profiles, printing, and flagging treatments for spiritual/medical follow-up[cite: 13, 409].

---

## 8. Authentication & Security

### JWT Strategy

- **Provider:** ASP.NET Core Identity + JwtBearer.
- **Storage:** JWTs are stored in `IndexedDB` to persist across app restarts on iPad/Electron.
- **Claims:** Tokens include `sub` (UserID), `role` (Admin/User), and `machine_id`.
- **Expiration:** Set to 7 days to cover the duration of a standard mission trip without requiring constant re-authentication in low-connectivity zones.

### Offline Authentication (Business Rule)

- **Initial Login:** Requires internet to validate credentials against Railway and fetch a JWT.
- **Cached Session:** If a valid JWT exists in local storage, the app allows full access to search and data entry regardless of internet status.
- **Roles:** Frontend routing is restricted based on JWT claims (e.g., hiding "Settings" for `User` role).

---

## 9. Sync & Concurrency Control

To support "Occasionally Connected" operations, the production schema implements a multi-master metadata strategy:

- **Global Unique IDs (UUID):** All primary keys use UUIDs generated at the edge (Client) to prevent ID collisions when multiple workstations sync to Railway.
- **Audit Timestamps:** Every table includes `created_at` and `updated_at` (UTC) to handle "Last Write Wins" conflict resolution.
- **Sync Status:** A `server_synced_at` timestamp tracks when a record successfully reached the Railway cloud.
- [cite_start]**Origin Tracking:** A `device_id` field identifies the specific hardware (Laptop/iPad) that authored the record, fulfilling the requirement for tracking the "Machine" in the Patient ID.
