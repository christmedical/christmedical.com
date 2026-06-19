-- Demo seed data (small, deterministic) for ephemeral docker demo.
-- Assumes schema migrations have already run.

SET datestyle = 'ISO, MDY';

-- Tenants are implied by tenant_id; branding is handled in the app.

-- One trip record (optional but useful for future demos)
INSERT INTO public.trips (id, name, start_date, end_date, status, is_deleted)
VALUES ('11111111-1111-1111-1111-111111111111', 'Demo Trip', '2026-01-10', '2026-01-17', 'Closed', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Patients (tenant 1: Belize)
INSERT INTO public.patients (
    id,
    tenant_id,
    display_id,
    first_name,
    last_name,
    dob,
    gender,
    medical_history,
    surgical_history,
    family_history,
    drug_allergies,
    hope_gospel,
    heard_gospel_date,
    spiritual_notes,
    first_name_phonetic,
    last_name_phonetic,
    is_deleted
)
VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    1,
    'BZ-0001',
    'Maria',
    'Lopez',
    '1991-02-11',
    'F',
    'HTN; occasional headaches',
    NULL,
    'Father: diabetes',
    'Penicillin',
    TRUE,
    NULL,
    'Hope / interest expressed; asked for prayer.',
    dmetaphone(lower(trim('Maria'))),
    dmetaphone(lower(trim('Lopez'))),
    FALSE
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    1,
    'BZ-0002',
    'Jon',
    'Smith',
    '1984-07-03',
    'M',
    'Asthma (childhood)',
    'Appendectomy 2008',
    NULL,
    NULL,
    FALSE,
    '2026-01-12',
    'Heard the gospel; follow-up requested.',
    dmetaphone(lower(trim('Jon'))),
    dmetaphone(lower(trim('Smith'))),
    FALSE
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    1,
    'BZ-0003',
    'Catherine',
    'Gonzales',
    '2002-10-22',
    'F',
    NULL,
    NULL,
    NULL,
    'Shellfish',
    FALSE,
    NULL,
    'No spiritual record yet.',
    dmetaphone(lower(trim('Catherine'))),
    dmetaphone(lower(trim('Gonzales'))),
    FALSE
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    1,
    'HC-AB-01-0001',
    'Marisol',
    'Coc',
    '1991-03-14',
    'F',
    'Seasonal allergies',
    NULL,
    NULL,
    NULL,
    TRUE,
    NULL,
    'Hope / Gospel noted',
    dmetaphone(lower(trim('Marisol'))),
    dmetaphone(lower(trim('Coc'))),
    FALSE
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
    1,
    'HC-AB-01-0002',
    'Carlos',
    'Choco',
    '1988-06-02',
    'M',
    NULL,
    NULL,
    NULL,
    NULL,
    FALSE,
    NULL,
    'No spiritual record yet.',
    dmetaphone(lower(trim('Carlos'))),
    dmetaphone(lower(trim('Choco'))),
    FALSE
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
    1,
    'HC-AB-01-0003',
    'Devon',
    'Castillo',
    '1995-11-08',
    'M',
    NULL,
    NULL,
    NULL,
    NULL,
    TRUE,
    NULL,
    'Hope / interest expressed.',
    dmetaphone(lower(trim('Devon'))),
    dmetaphone(lower(trim('Castillo'))),
    FALSE
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7',
    1,
    'HC-AB-01-0004',
    'Diana',
    'Castillo',
    '1993-01-19',
    'F',
    NULL,
    NULL,
    NULL,
    NULL,
    FALSE,
    '2026-01-11',
    'Heard the gospel.',
    dmetaphone(lower(trim('Diana'))),
    dmetaphone(lower(trim('Castillo'))),
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Patients (tenant 2: Demo Mission)
INSERT INTO public.patients (
    id,
    tenant_id,
    display_id,
    first_name,
    last_name,
    dob,
    gender,
    medical_history,
    surgical_history,
    family_history,
    drug_allergies,
    hope_gospel,
    heard_gospel_date,
    spiritual_notes,
    first_name_phonetic,
    last_name_phonetic,
    is_deleted
)
VALUES
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    2,
    'DM-0001',
    'Katherine',
    'Johnson',
    '1977-05-14',
    'F',
    'Type 2 diabetes',
    NULL,
    NULL,
    NULL,
    TRUE,
    NULL,
    'Interested; requested a Bible.',
    dmetaphone(lower(trim('Katherine'))),
    dmetaphone(lower(trim('Johnson'))),
    FALSE
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    2,
    'DM-0002',
    'Pedro',
    'Martinez',
    '1968-12-01',
    'M',
    'Chronic back pain',
    NULL,
    NULL,
    'Ibuprofen',
    FALSE,
    '2026-01-15',
    'Heard; requested follow-up with pastor.',
    dmetaphone(lower(trim('Pedro'))),
    dmetaphone(lower(trim('Martinez'))),
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Visits (minimal rows for dashboard "Total visits")
INSERT INTO public.visits (
    id,
    tenant_id,
    trip_id,
    patient_id,
    visit_date,
    location_name,
    chief_complaint,
    diagnosis_text,
    is_deleted
)
VALUES
(
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    1,
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '2026-01-12T10:00:00Z',
    'Belize Clinic',
    'Headache',
    'Tension headache',
    FALSE
),
(
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    1,
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '2026-01-12T10:30:00Z',
    'Belize Clinic',
    'Cough',
    'URI',
    FALSE
),
(
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    2,
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '2026-01-15T12:00:00Z',
    'Demo Clinic',
    'Diabetes follow-up',
    'DM2',
    FALSE
)
ON CONFLICT (id) DO NOTHING;

