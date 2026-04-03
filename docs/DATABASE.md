# Database Architecture

This document details the persistence layer for the Christ Medical mission system. The architecture is built to support high-reliability data entry in low-connectivity environments through a local-first synchronization strategy.

## Persistence Model

- [**Primary Store (Cloud):** A centralized **PostgreSQL** instance hosted on **Railway** serves as the global source of truth[cite: 441, 443, 458].
- **Local Store (Client):** **IndexedDB** (via Dexie.js) or **SQLite** provides high-performance local caching for iPads (PWA) and Laptops (Electron)[cite: 451, 452].
- **Synchronization:** Implements a **Store and Forward** pattern. Data is authored locally with client-generated UUIDs and reconciled with the Railway API via a "Finish Trip" manual sync once a connection is detected[cite: 101, 440].

---

## Technical Schema

### Data Relationship Flow

The following diagram illustrates how entities move from the global mission context down to specific patient interventions[cite: 466].

```mermaid
graph TD
    %% Global Mission Context
    subgraph Mission_Context [Mission Context]
        T[Trip]
        WS[Workstation Log]
    end

    %% Central Entities
    P[Patient]
    V[Visit]

    %% Clinical Observations
    subgraph Observations [Clinical Observations]
        VC[Vitals Core]
        LR[Lab Results]
    end

    %% Clinical Interventions
    subgraph Interventions [Interventions]
        TR[Treatment]
        RX[Prescription]
        PD[Procedure Detail]
    end

    %% Relationships
    T -->|monitors| WS
    T -->|contains| V
    P -->|undergoes| V
    P -.->|self-reference| P

    V -->|records| VC
    V -->|records| LR
    V -->|executes| TR

    TR -->|details| RX
    TR -->|details| PD

    %% Styling
    style V fill:#f9f,stroke:#333,stroke-width:2px
    style P fill:#bbf,stroke:#333,stroke-width:2px
    style T fill:#dfd,stroke:#333,stroke-width:2px
```

### Entity Relationship Diagram (ERD)

This diagram defines the refactored production schema, including mandatory synchronization metadata for every table.

```mermaid
erDiagram
TRIP ||--o{ WORKSTATION_LOG : "monitors"
TRIP ||--o{ VISIT : "contains"
PATIENT ||--o{ VISIT : "undergoes"
PATIENT |o--o| PATIENT : "next_of_kin"

    VISIT ||--o{ VITALS_CORE : "records"
    VISIT ||--o{ LAB_RESULTS : "records"
    VISIT ||--o{ TREATMENT : "executes"

    TREATMENT ||--o| PRESCRIPTION : "details"
    TREATMENT ||--o| PROCEDURE_DETAIL : "details"

    TRIP {
        uuid id PK
        string name
        date start_date
        date end_date
        string status
        string device_id
        timestamp client_updated_at
        timestamp server_restored_at
        boolean is_deleted
    }

    WORKSTATION_LOG {
        uuid id PK
        uuid trip_id FK
        string ws_label
        timestamp begin_time
        timestamp end_time
        string device_id
        timestamp client_updated_at
        timestamp server_restored_at
        boolean is_deleted
    }

    PATIENT {
        uuid id PK
        string display_id
        string first_name
        string last_name
        date dob
        integer calculated_age
        string gender
        string marital_status
        string gov_id
        uuid next_of_kin_id FK
        text medical_history
        text surgical_history
        text family_history
        text drug_allergies
        boolean smoke
        boolean alcohol
        boolean hope_gospel
        string device_id
        timestamp client_updated_at
        timestamp server_restored_at
        boolean is_deleted
    }

    VISIT {
        uuid id PK
        uuid trip_id FK
        uuid patient_id FK
        timestamp visit_date
        string location_name
        text chief_complaint
        string diagnosis_text
        string referral_notes
        string device_id
        timestamp client_updated_at
        timestamp server_restored_at
        boolean is_deleted
    }

    VITALS_CORE {
        uuid id PK
        uuid visit_id FK
        decimal weight
        decimal height
        integer pulse
        string bp
        integer resp
        decimal temp_f
        integer oxygen_sat
        decimal glucose
        decimal hemoglobin
        string device_id
        timestamp client_updated_at
        timestamp server_restored_at
        boolean is_deleted
    }

    LAB_RESULTS {
        uuid id PK
        uuid visit_id FK
        string test_name
        string result_value
        string device_id
        timestamp client_updated_at
        timestamp server_restored_at
        boolean is_deleted
    }

    TREATMENT {
        uuid id PK
        uuid visit_id FK
        string type
        text general_notes
        boolean is_flagged
        string provider_name
        string device_id
        timestamp client_updated_at
        timestamp server_restored_at
        boolean is_deleted
    }

    PRESCRIPTION {
        uuid id PK
        uuid treatment_id FK
        string medication_name
        string dose
        string directions
        integer quantity
        string status
        string device_id
        timestamp client_updated_at
        timestamp server_restored_at
        boolean is_deleted
    }

    PROCEDURE_DETAIL {
        uuid id PK
        uuid treatment_id FK
        jsonb metadata
        string device_id
        timestamp client_updated_at
        timestamp server_restored_at
        boolean is_deleted
    }
```

## Synchronization Logic

### Sync & Audit Metadata

To support distributed data entry, every table in the production schema inherits the following audit and sync fields:

| Field Name               | Data Type     | Purpose                                                               | Sync Logic                                                                                                                   |
| :----------------------- | :------------ | :-------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **`id`**                 | `UUID`        | **Primary Key.** Global unique identifier for the record.             | Generated by the Client (C# Electron/PWA) to prevent ID collisions before the data ever reaches the cloud.                   |
| **`device_id`**          | `VARCHAR`     | Identifies the specific workstation (e.g., `WS-01`, `WS-02`).         | [cite_start]Directly supports the `Machine` component of the new Patient ID requirement. [cite: 18, 19]                      |
| **`client_updated_at`**  | `TIMESTAMPTZ` | The precise time the record was saved locally in the field.           | Used for "Last Write Wins" conflict resolution when multiple machines sync to Railway.                                       |
| **`server_restored_at`** | `TIMESTAMPTZ` | **Nullable.** When the server successfully ingested the data.         | [cite_start]If `NULL`, the Client knows the record is "dirty" and must be pushed during the "Finish Trip" phase. [cite: 101] |
| **`is_deleted`**         | `BOOLEAN`     | **Soft Delete.** Marks a record as removed without physical deletion. | Ensures a deletion on one iPad/Laptop is correctly propagated to the Cloud and other devices during sync.                    |
