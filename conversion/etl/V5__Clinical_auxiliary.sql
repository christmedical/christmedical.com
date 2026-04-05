-- Visit-level medications (from staging.visits_rx), diagnoses (visits_dx), and eye exams (visits_eye).
-- Distinct from public.prescriptions (treatment-linked) in V1.

CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id SMALLINT NOT NULL DEFAULT 1,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    legacy_id VARCHAR(50),
    catalog_medlist_id VARCHAR(50),
    medication_code VARCHAR(255),
    medication_name VARCHAR(255),
    strength VARCHAR(50),
    dose VARCHAR(255),
    directions TEXT,
    did_not_dispense BOOLEAN DEFAULT FALSE,
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS medications_visit_id_idx ON medications (visit_id);
CREATE INDEX IF NOT EXISTS medications_tenant_id_idx ON medications (tenant_id);

CREATE TABLE IF NOT EXISTS diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id SMALLINT NOT NULL DEFAULT 1,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    legacy_id VARCHAR(50),
    dx_code VARCHAR(255),
    additional_info VARCHAR(500),
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS diagnoses_visit_id_idx ON diagnoses (visit_id);
CREATE INDEX IF NOT EXISTS diagnoses_tenant_id_idx ON diagnoses (tenant_id);

CREATE TABLE IF NOT EXISTS eye_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id SMALLINT NOT NULL DEFAULT 1,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    legacy_id VARCHAR(50),
    legacy_patient_id VARCHAR(50),
    screening_flag BOOLEAN DEFAULT FALSE,
    va_left VARCHAR(255),
    va_right VARCHAR(255),
    tonometry_r VARCHAR(255),
    tonometry_l VARCHAR(255),
    impression VARCHAR(500),
    plan TEXT,
    read_near VARCHAR(255),
    read_dist VARCHAR(255),
    eom VARCHAR(255),
    pupils VARCHAR(255),
    ar_r VARCHAR(255),
    ar_l VARCHAR(255),
    va_combined VARCHAR(255),
    l_field VARCHAR(255),
    cataracts BOOLEAN DEFAULT FALSE,
    dry_eyes BOOLEAN DEFAULT FALSE,
    glaucoma BOOLEAN DEFAULT FALSE,
    pterygium BOOLEAN DEFAULT FALSE,
    other_note VARCHAR(500),
    readers_given_at TIMESTAMPTZ,
    readers_given_strength VARCHAR(25),
    device_id VARCHAR(50),
    client_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    server_restored_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS eye_exams_visit_id_idx ON eye_exams (visit_id);
CREATE INDEX IF NOT EXISTS eye_exams_tenant_id_idx ON eye_exams (tenant_id);
