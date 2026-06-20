-- Tenants registry + auth with many-to-many user<->tenant memberships.
-- Replaces V8 single-tenant users model (V8 is not applied by bootstrap; use this instead).

CREATE TABLE IF NOT EXISTS public.tenants (
    id SMALLINT PRIMARY KEY,
    slug VARCHAR(63) NOT NULL,
    name VARCHAR(120) NOT NULL,
    short_name VARCHAR(40) NOT NULL,
    theme_color_hex VARCHAR(7) NOT NULL DEFAULT '#0d9488',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tenants_slug
    ON public.tenants (lower(slug));

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(256) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email
    ON public.users (lower(email));

CREATE TABLE IF NOT EXISTS public.user_tenant_memberships (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tenant_id SMALLINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'clinician'
        CHECK (role IN ('clinician', 'coordinator', 'admin')),
    PRIMARY KEY (user_id, tenant_id)
);

INSERT INTO public.tenants (id, slug, name, short_name, theme_color_hex)
VALUES
    (1, 'belize', 'Belize', 'Belize', '#0d9488'),
    (2, 'demo', 'Demo Mission', 'Demo', '#2563eb'),
    (3, 'cornerstone', 'Cornerstone Clinic', 'Cornerstone', '#cd7f32')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.tenants IS 'Mission/clinic registry; subdomain slug maps to tenants.slug.';
COMMENT ON TABLE public.user_tenant_memberships IS 'Users may belong to multiple tenants; JWT carries one active tenant per session.';
