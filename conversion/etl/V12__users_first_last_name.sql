-- Split user identity into first and last name (display_name remains full name).

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

COMMENT ON COLUMN public.users.first_name IS 'Given name for sign-in accounts.';
COMMENT ON COLUMN public.users.last_name IS 'Family name for sign-in accounts.';
