-- Phonetic name search (Double Metaphone via fuzzystrmatch).
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

ALTER TABLE public.patients
    ADD COLUMN IF NOT EXISTS first_name_phonetic VARCHAR(32),
    ADD COLUMN IF NOT EXISTS last_name_phonetic VARCHAR(32);

UPDATE public.patients
SET
    first_name_phonetic = dmetaphone(lower(trim(coalesce(first_name, '')))),
    last_name_phonetic = dmetaphone(lower(trim(coalesce(last_name, ''))))
WHERE TRUE;
