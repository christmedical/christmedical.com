using Dapper;
using Npgsql;

namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>
/// Applies core SQL migrations on empty Postgres (e.g. fresh Railway database).
/// </summary>
public static class DbSchemaBootstrap
{
    /// <summary>SQL files applied when <c>public.patients</c> is missing (in order).</summary>
    public static IReadOnlyList<string> SchemaScriptNames => SchemaScripts;

    private static readonly string[] SchemaScripts =
    [
        "V1__Initial_Schema.sql",
        "V4__Patients_spiritual.sql",
        "V6__patients_phonetic.sql",
        "V7__patients_legacy_contact.sql",
        "V9__tenants_and_auth.sql",
    ];

    public static async Task EnsureAsync(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var cs = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(cs))
        {
            logger.LogWarning("Skipping DB bootstrap: DefaultConnection is not set.");
            return;
        }

        var sqlRoot = ResolveSqlRoot(environment);
        await using var conn = new NpgsqlConnection(cs);
        await conn.OpenAsync(cancellationToken);

        if (!await PatientsTableExistsAsync(conn, cancellationToken))
        {
            EnsureSqlScriptsPresent(sqlRoot);
            logger.LogInformation("Empty database detected; applying core schema scripts from {Path}.", sqlRoot);
            foreach (var script in SchemaScripts)
            {
                await ExecuteSqlFileAsync(conn, Path.Combine(sqlRoot, script), logger, cancellationToken);
            }

            if (!await PatientsTableExistsAsync(conn, cancellationToken))
            {
                throw new InvalidOperationException(
                    "Database bootstrap finished but public.patients is still missing. "
                    + "Check Railway deploy logs for SQL script errors.");
            }
        }

        await ApplyIncrementalPatchesAsync(conn, logger, cancellationToken);

        await EnsureTenantsAndAuthAsync(conn, sqlRoot, logger, cancellationToken);

        await EnsureFeedbackTableAsync(conn, sqlRoot, logger, cancellationToken);

        await EnsureFeedbackReviewerPrefsAsync(conn, sqlRoot, logger, cancellationToken);

        await AuthDemoSeeder.EnsureDevAccountsAsync(conn, logger, cancellationToken);

        if (ShouldSeedDemoData(configuration))
            await AuthDemoSeeder.EnsureAsync(conn, logger, cancellationToken);

        await HubAdminSeeder.EnsureAsync(conn, configuration, logger, cancellationToken);

        if (ShouldSeedDemoData(configuration))
        {
            await SeedDemoDataIfEmptyAsync(conn, sqlRoot, logger, cancellationToken);
        }
    }

    private static void EnsureSqlScriptsPresent(string sqlRoot)
    {
        if (!Directory.Exists(sqlRoot))
        {
            throw new InvalidOperationException(
                $"SQL migration folder not found at {sqlRoot}. "
                + "api/Dockerfile must COPY conversion/etl/*.sql into /app/sql/.");
        }

        var missing = SchemaScripts.Where(s => !File.Exists(Path.Combine(sqlRoot, s))).ToArray();
        if (missing.Length > 0)
        {
            throw new InvalidOperationException(
                $"Missing SQL migration scripts in {sqlRoot}: {string.Join(", ", missing)}");
        }
    }

    private static string ResolveSqlRoot(IWebHostEnvironment environment)
    {
        var candidates = new[]
        {
            Path.Combine(environment.ContentRootPath, "sql"),
            Path.Combine(AppContext.BaseDirectory, "sql"),
        };
        return candidates.FirstOrDefault(Directory.Exists) ?? candidates[0];
    }

    private static async Task<bool> PatientsTableExistsAsync(
        NpgsqlConnection conn,
        CancellationToken cancellationToken)
    {
        return await conn.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'patients'
                );
                """,
                cancellationToken: cancellationToken));
    }

    private static bool ShouldSeedDemoData(IConfiguration configuration)
    {
        var flag = configuration["SEED_DEMO_DATA"] ?? Environment.GetEnvironmentVariable("SEED_DEMO_DATA");
        return string.Equals(flag, "true", StringComparison.OrdinalIgnoreCase)
            || string.Equals(flag, "1", StringComparison.OrdinalIgnoreCase);
    }

    private static async Task SeedDemoDataIfEmptyAsync(
        NpgsqlConnection conn,
        string sqlRoot,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var count = await conn.ExecuteScalarAsync<long>(
            new CommandDefinition("SELECT COUNT(*) FROM public.patients;", cancellationToken: cancellationToken));
        if (count > 0)
        {
            logger.LogInformation("Skipping demo seed: patients table already has {Count} rows.", count);
            return;
        }

        var seedPath = Path.Combine(sqlRoot, "99_demo_seed.sql");
        if (!File.Exists(seedPath))
        {
            logger.LogWarning("Demo seed script not found at {Path}.", seedPath);
            return;
        }

        logger.LogInformation("Seeding demo patients (SEED_DEMO_DATA enabled).");
        await ExecuteSqlFileAsync(conn, seedPath, logger, cancellationToken);
        await AuthDemoSeeder.EnsureAsync(conn, logger, cancellationToken);
    }

    private static async Task EnsureTenantsAndAuthAsync(
        NpgsqlConnection conn,
        string sqlRoot,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var tenantsExists = await conn.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'tenants'
                );
                """,
                cancellationToken: cancellationToken));

        if (!tenantsExists)
        {
            var path = Path.Combine(sqlRoot, "V9__tenants_and_auth.sql");
            EnsureSqlScriptsPresentForTenants(path);
            logger.LogInformation("Applying tenants/auth schema from {Path}.", path);
            await ExecuteSqlFileAsync(conn, path, logger, cancellationToken);
        }

        await EnsureUsersFirstLastNameAsync(conn, sqlRoot, logger, cancellationToken);
    }

    private static void EnsureSqlScriptsPresentForTenants(string path)
    {
        if (!File.Exists(path))
        {
            throw new InvalidOperationException(
                $"Missing tenants/auth migration at {path}. Dockerfile must COPY V9__tenants_and_auth.sql.");
        }
    }

    private static async Task EnsureUsersFirstLastNameAsync(
        NpgsqlConnection conn,
        string sqlRoot,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var usersExists = await conn.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'users'
                );
                """,
                cancellationToken: cancellationToken));

        if (!usersExists)
            return;

        var hasFirstName = await conn.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public'
                    AND table_name = 'users'
                    AND column_name = 'first_name'
                );
                """,
                cancellationToken: cancellationToken));

        if (!hasFirstName)
        {
            const string ddl = """
                ALTER TABLE public.users
                    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
                    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
                """;

            await conn.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: cancellationToken));
            logger.LogInformation("Applied users first_name and last_name columns.");
        }
    }

    private static async Task EnsureFeedbackTableAsync(
        NpgsqlConnection conn,
        string sqlRoot,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var exists = await conn.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'feedback'
                );
                """,
                cancellationToken: cancellationToken));

        if (exists)
            return;

        var path = Path.Combine(sqlRoot, "V10__feedback.sql");
        if (!File.Exists(path))
        {
            throw new InvalidOperationException(
                $"Missing feedback migration at {path}. Dockerfile must COPY V10__feedback.sql.");
        }

        logger.LogInformation("Applying feedback schema from {Path}.", path);
        await ExecuteSqlFileAsync(conn, path, logger, cancellationToken);
    }

    private static async Task EnsureFeedbackReviewerPrefsAsync(
        NpgsqlConnection conn,
        string sqlRoot,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var exists = await conn.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'feedback_reviewer_prefs'
                );
                """,
                cancellationToken: cancellationToken));

        if (exists)
            return;

        var path = Path.Combine(sqlRoot, "V11__feedback_reviewer_prefs.sql");
        if (!File.Exists(path))
        {
            throw new InvalidOperationException(
                $"Missing feedback reviewer prefs migration at {path}. Dockerfile must COPY V11__feedback_reviewer_prefs.sql.");
        }

        logger.LogInformation("Applying feedback reviewer prefs from {Path}.", path);
        await ExecuteSqlFileAsync(conn, path, logger, cancellationToken);
    }

    private static async Task ApplyIncrementalPatchesAsync(
        NpgsqlConnection conn,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        if (!await PatientsTableExistsAsync(conn, cancellationToken))
        {
            logger.LogWarning("Skipping incremental patient schema patches: public.patients does not exist.");
            return;
        }

        const string ddl = """
            CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

            ALTER TABLE public.patients
                ADD COLUMN IF NOT EXISTS heard_gospel_date DATE,
                ADD COLUMN IF NOT EXISTS spiritual_notes TEXT,
                ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(50),
                ADD COLUMN IF NOT EXISTS home_phone VARCHAR(30),
                ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(30),
                ADD COLUMN IF NOT EXISTS first_name_phonetic VARCHAR(32),
                ADD COLUMN IF NOT EXISTS last_name_phonetic VARCHAR(32);

            UPDATE public.patients
            SET
                first_name_phonetic = dmetaphone(lower(trim(coalesce(first_name, '')))),
                last_name_phonetic = dmetaphone(lower(trim(coalesce(last_name, ''))))
            WHERE first_name_phonetic IS NULL
               OR last_name_phonetic IS NULL;
            """;

        await conn.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: cancellationToken));
        logger.LogInformation("Applied incremental patient schema patches.");
    }

    private static async Task ExecuteSqlFileAsync(
        NpgsqlConnection conn,
        string path,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var sql = await File.ReadAllTextAsync(path, cancellationToken);
        logger.LogInformation("Executing SQL script {Script}.", Path.GetFileName(path));
        await using var cmd = new NpgsqlCommand(sql, conn);
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }
}
