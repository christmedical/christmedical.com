-- Standalone reviewer feedback (not clinical). Safe to drop when review cycle ends.

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    page_path TEXT NOT NULL,
    pin_x REAL NOT NULL CHECK (pin_x >= 0 AND pin_x <= 1),
    pin_y REAL NOT NULL CHECK (pin_y >= 0 AND pin_y <= 1),
    note TEXT NOT NULL,
    reviewer_label TEXT NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'done')),
    user_agent TEXT,
    viewport_w INT NOT NULL,
    viewport_h INT NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_feedback_created_at
    ON public.feedback (created_at DESC);

CREATE INDEX IF NOT EXISTS ix_feedback_page_path
    ON public.feedback (page_path);

CREATE INDEX IF NOT EXISTS ix_feedback_status
    ON public.feedback (status);

COMMENT ON TABLE public.feedback IS 'Early-reviewer UI feedback pins; standalone from clinical data.';
