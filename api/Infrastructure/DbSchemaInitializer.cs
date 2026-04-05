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
}
