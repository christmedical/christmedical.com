-- Columns used by the Web API and ETL; V1 predates these (ETL used to ALTER at runtime).
ALTER TABLE public.patients
    ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS home_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(30);
