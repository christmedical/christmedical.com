using Dapper;
using Npgsql;

namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>
/// Idempotent patches for dev / Docker volumes created before newer init SQL was added.
/// </summary>
public static class DbSchemaInitializer
{
    public static async Task EnsurePatientsSpiritualColumnsAsync(
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var cs = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(cs))
        {
            logger.LogWarning("Skipping DB schema patch: DefaultConnection is not set.");
            return;
        }

        const string ddl = """
            ALTER TABLE public.patients
                ADD COLUMN IF NOT EXISTS heard_gospel_date DATE,
                ADD COLUMN IF NOT EXISTS spiritual_notes TEXT;
            """;

        await using var conn = new NpgsqlConnection(cs);
        await conn.OpenAsync(cancellationToken);
        await conn.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: cancellationToken));
        logger.LogInformation("Ensured patients.heard_gospel_date and patients.spiritual_notes exist.");
    }

    /// <summary>
    /// Legacy id + phone columns (ETL adds these; fresh V1-only DBs need them for list/search API).
    /// </summary>
    public static async Task EnsurePatientsLegacyAndContactColumnsAsync(
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var cs = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(cs))
        {
            logger.LogWarning("Skipping legacy/contact schema patch: DefaultConnection is not set.");
            return;
        }

        const string ddl = """
            ALTER TABLE public.patients
                ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(50),
                ADD COLUMN IF NOT EXISTS home_phone VARCHAR(30),
                ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(30);
            """;

        await using var conn = new NpgsqlConnection(cs);
        await conn.OpenAsync(cancellationToken);
        await conn.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: cancellationToken));
        logger.LogInformation("Ensured patients.legacy_id, home_phone, and mobile_phone exist.");
    }

    /// <summary>
    /// Phonetic name columns + fuzzystrmatch for dmetaphone search; backfills existing rows.
    /// </summary>
    public static async Task EnsurePatientsPhoneticColumnsAsync(
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var cs = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(cs))
        {
            logger.LogWarning("Skipping phonetic schema patch: DefaultConnection is not set.");
            return;
        }

        const string ddl = """
            CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

            ALTER TABLE public.patients
                ADD COLUMN IF NOT EXISTS first_name_phonetic VARCHAR(32),
                ADD COLUMN IF NOT EXISTS last_name_phonetic VARCHAR(32);

            UPDATE public.patients
            SET
                first_name_phonetic = dmetaphone(lower(trim(coalesce(first_name, '')))),
                last_name_phonetic = dmetaphone(lower(trim(coalesce(last_name, ''))))
            WHERE first_name_phonetic IS NULL
               OR last_name_phonetic IS NULL;
            """;

        await using var conn = new NpgsqlConnection(cs);
        await conn.OpenAsync(cancellationToken);
        await conn.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: cancellationToken));
        logger.LogInformation("Ensured patients phonetic columns and backfill.");
    }

    /// <summary>Standalone reviewer feedback table (non-clinical).</summary>
    public static async Task EnsureFeedbackTableAsync(
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var cs = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(cs))
        {
            logger.LogWarning("Skipping feedback schema patch: DefaultConnection is not set.");
            return;
        }

        const string ddl = """
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
            """;

        await using var conn = new NpgsqlConnection(cs);
        await conn.OpenAsync(cancellationToken);
        await conn.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: cancellationToken));
        logger.LogInformation("Ensured public.feedback table exists.");
    }

    /// <summary>Per-reviewer feedback widget allowlist.</summary>
    public static async Task EnsureFeedbackReviewerPrefsAsync(
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var cs = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(cs))
        {
            logger.LogWarning("Skipping feedback reviewer prefs patch: DefaultConnection is not set.");
            return;
        }

        const string ddl = """
            CREATE TABLE IF NOT EXISTS public.feedback_reviewer_prefs (
                email VARCHAR(256) PRIMARY KEY,
                display_name VARCHAR(120) NOT NULL DEFAULT '',
                feedback_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_feedback_reviewer_prefs_email
                ON public.feedback_reviewer_prefs (lower(email));
            """;

        await using var conn = new NpgsqlConnection(cs);
        await conn.OpenAsync(cancellationToken);
        await conn.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: cancellationToken));
        logger.LogInformation("Ensured public.feedback_reviewer_prefs table exists.");
    }
}
