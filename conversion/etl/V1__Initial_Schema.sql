-- Enable UUID support for Client-side ID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------
-- CORE TABLES
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Open',
    -- Sync Metadata
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id SMALLINT NOT NULL DEFAULT 1,
    display_id VARCHAR(50) UNIQUE, -- Format: Loc-Trip-Mach-Sync#
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    dob DATE,
    calculated_age INTEGER,
    gender VARCHAR(10),
    marital_status VARCHAR(50),
    gov_id VARCHAR(50),
    next_of_kin_id UUID REFERENCES patients(id),
    medical_history TEXT,
    surgical_history TEXT,
    family_history TEXT,
    drug_allergies TEXT,
    smoke BOOLEAN DEFAULT FALSE,
    alcohol BOOLEAN DEFAULT FALSE,
    hope_gospel BOOLEAN DEFAULT FALSE,
    -- Sync Metadata
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id SMALLINT NOT NULL DEFAULT 1,
    trip_id UUID REFERENCES trips(id),
    patient_id UUID REFERENCES patients(id),
    visit_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    location_name VARCHAR(255),
    chief_complaint TEXT,
    diagnosis_text TEXT,
    referral_notes TEXT,
    -- Sync Metadata
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------------
-- MEASUREMENTS & LABS (Refactored from visits_gen)
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS vitals_core (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id SMALLINT NOT NULL DEFAULT 1,
    visit_id UUID REFERENCES visits(id),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    pulse INTEGER,
    bp VARCHAR(20), -- e.g., "120/80"
    resp INTEGER,
    temp_f DECIMAL(4,1),
    oxygen_sat INTEGER,
    glucose DECIMAL(6,2),
    hemoglobin DECIMAL(4,1),
    -- Sync Metadata
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id SMALLINT NOT NULL DEFAULT 1,
    visit_id UUID REFERENCES visits(id),
    test_name VARCHAR(100), -- Protein, Nitrite, PH, etc.
    result_value VARCHAR(255),
    -- Sync Metadata
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------------
-- TREATMENTS & PRESCRIPTIONS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id),
    type VARCHAR(50), -- Injection, Pap, Chiro, Note
    general_notes TEXT,
    is_flagged BOOLEAN DEFAULT FALSE, -- Medical/Spiritual Follow-up
    provider_name VARCHAR(255),
    -- Sync Metadata
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id UUID REFERENCES treatments(id),
    medication_name VARCHAR(255),
    dose VARCHAR(255),
    directions TEXT,
    quantity INTEGER,
    status VARCHAR(50), -- Refill, New, Discontinued
    -- Sync Metadata
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS procedure_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id UUID REFERENCES treatments(id),
    metadata JSONB, -- Stores specialized Eye, Gyn, or Chiro booleans
    -- Sync Metadata
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);