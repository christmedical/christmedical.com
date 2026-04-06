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
}
