-- Spiritual / follow-up fields promoted from staging into public.patients for app + reporting.
ALTER TABLE public.patients
    ADD COLUMN IF NOT EXISTS heard_gospel_date DATE,
    ADD COLUMN IF NOT EXISTS spiritual_notes TEXT;

COMMENT ON COLUMN public.patients.heard_gospel_date IS 'Date the patient heard the gospel (from legacy heardgospel).';
COMMENT ON COLUMN public.patients.spiritual_notes IS 'Free-text spiritual check-up notes (church, personal notes, hope, etc.).';
