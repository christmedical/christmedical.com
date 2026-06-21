-- Per-reviewer feedback widget access (standalone from clinical data).

CREATE TABLE IF NOT EXISTS public.feedback_reviewer_prefs (
    email VARCHAR(256) PRIMARY KEY,
    display_name VARCHAR(120) NOT NULL DEFAULT '',
    feedback_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_feedback_reviewer_prefs_email
    ON public.feedback_reviewer_prefs (lower(email));

COMMENT ON TABLE public.feedback_reviewer_prefs IS
    'Owner-controlled allowlist for who may use the in-app feedback widget.';
