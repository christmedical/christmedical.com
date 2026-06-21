-- Mirrors ChristMedical.WebAPI.Infrastructure.DbSchemaBootstrap incremental patches.
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

ALTER TABLE public.patients
    ADD COLUMN IF NOT EXISTS heard_gospel_date DATE,
    ADD COLUMN IF NOT EXISTS spiritual_notes TEXT,
    ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS home_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS first_name_phonetic VARCHAR(32),
    ADD COLUMN IF NOT EXISTS last_name_phonetic VARCHAR(32);

UPDATE public.patients
SET
    first_name_phonetic = dmetaphone(lower(trim(coalesce(first_name, '')))),
    last_name_phonetic = dmetaphone(lower(trim(coalesce(last_name, ''))))
WHERE first_name_phonetic IS NULL
   OR last_name_phonetic IS NULL;
