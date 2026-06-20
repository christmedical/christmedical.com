-- Self-contained auth users (no external identity provider; clinics run offline).
-- Mirrored at runtime by api DbSchemaInitializer.EnsureUsersTableAsync for older volumes.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id SMALLINT NOT NULL DEFAULT 1,
    email VARCHAR(256) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'clinician'
        CHECK (role IN ('clinician', 'coordinator', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Email is the login handle; unique per tenant (single tenant per deployment in v1).
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_tenant_email
    ON public.users (tenant_id, lower(email));

COMMENT ON TABLE public.users IS 'Application sign-in accounts; password_hash is an ASP.NET Core PasswordHasher value.';
COMMENT ON COLUMN public.users.role IS 'clinician | coordinator | admin.';
