using System.Text.RegularExpressions;
using Dapper;
using EtlTool.Logging;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EtlTool.Services;

/// <summary>
/// Stage 1 — Resets and rebuilds the database schema.
///
/// Execution order:
///   V0__Reset_Schema.sql     — drops all production tables
///   V1__Initial_Schema.sql   — creates production schema
///   V2__Inital_Staging_Schema.sql (raw mdb-schema output)
///              — scrubbed in-memory before execution:
///                • all Access types → TEXT
///                • NOT NULL removed
///                • WITHOUT TIME ZONE removed
///                • indexes, PKs, FK comments stripped
///                • staging schema header + search_path prepended
///
/// Doing the scrubbing here instead of in a shell script avoids Perl/sed
/// portability issues on macOS and gives us proper \b word-boundary regex.
/// </summary>
public class SchemaService
{
    private readonly string _connectionString;
    private readonly string _sqlSchemaDir;
    private readonly ILogger<SchemaService> _logger;

    // Matches Access → PostgreSQL type names as whole words only.
    // \b word boundaries prevent "ptupdatedon" → "ptupTEXTdon" (contains "date").
    private static readonly Regex TypePattern = new(
        @"\b(DATE|SERIAL|INTEGER|DOUBLE PRECISION|TIMESTAMP|BYTEA|Unknown_\d+|BOOLEAN|NUMERIC\(\d+,\s*\d+\)|VARCHAR\s*\(\d+\))\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public SchemaService(string connectionString, string sqlSchemaDir, ILogger<SchemaService> logger)
    {
        _connectionString = connectionString;
        _sqlSchemaDir     = sqlSchemaDir;
        _logger           = logger;
    }

    public async Task RunAsync(EtlProgress? progress = null, CancellationToken ct = default)
    {
        progress?.BeginStep("Resetting and initialising schema ...", 3);

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(ct);

        // V0 — nuke everything
        await ExecuteSqlFileAsync(connection, "V0__Reset_Schema.sql", ct);
        progress?.Advance();

        // V1 — production schema
        await ExecuteSqlFileAsync(connection, "V1__Initial_Schema.sql", ct);
        progress?.Advance();

        // V2 — staging schema (scrub raw mdb-schema output before executing)
        await ExecuteV2Async(connection, ct);
        progress?.Advance();

        progress?.StepDone("Schema ready.");
    }

    // -------------------------------------------------------------------------
    // V0 / V1 helpers
    // -------------------------------------------------------------------------

    private async Task ExecuteSqlFileAsync(NpgsqlConnection connection, string filename, CancellationToken ct)
    {
        var path = Path.Combine(_sqlSchemaDir, filename);
        if (!File.Exists(path))
            throw new FileNotFoundException($"SQL schema file not found: {path}");

        _logger.LogInformation("Executing {File}...", filename);
        var sql = await File.ReadAllTextAsync(path, ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, cancellationToken: ct));
        _logger.LogInformation("{File} completed.", filename);
    }

    // -------------------------------------------------------------------------
    // V2 — scrub + execute
    // -------------------------------------------------------------------------

    private async Task ExecuteV2Async(NpgsqlConnection connection, CancellationToken ct)
    {
        var path = Path.Combine(_sqlSchemaDir, "V2__Inital_Staging_Schema.sql");
        if (!File.Exists(path))
            throw new FileNotFoundException($"V2 staging schema not found: {path}");

        _logger.LogInformation("Scrubbing and executing V2__Inital_Staging_Schema.sql...");
        var raw = await File.ReadAllTextAsync(path, ct);
        var scrubbed = ScrubStagingSchema(raw);

        await connection.ExecuteAsync(new CommandDefinition(scrubbed, cancellationToken: ct));
        _logger.LogInformation("V2__Inital_Staging_Schema.sql completed.");
    }

    // -------------------------------------------------------------------------
    // Schema scrubbing (replaces the Perl/sed steps in Extract_Access_DB.sh)
    // -------------------------------------------------------------------------

    private string ScrubStagingSchema(string raw)
    {
        var s = raw;

        // 1. All known Access → PostgreSQL types become TEXT.
        //    Word boundaries prevent "ptupdatedon" → "ptupTEXTdon".
        s = TypePattern.Replace(s, "TEXT");

        // 2. Remove NOT NULL — allows empty fields to load into staging.
        s = s.Replace(" NOT NULL", "");

        // 3. Strip leftover timestamp qualifier.
        s = s.Replace(" WITHOUT TIME ZONE", "");

        // 4. Drop index definitions (noisy; staging doesn't need them).
        s = Regex.Replace(s, @"^CREATE (UNIQUE )?INDEX.*$", "", RegexOptions.Multiline);
        s = Regex.Replace(s, @"^-- CREATE INDEXES \.\.\..*$", "", RegexOptions.Multiline);

        // 5. Drop ALTER TABLE lines (primary keys).
        s = Regex.Replace(s, @"^ALTER TABLE.*$", "", RegexOptions.Multiline);

        // 6. Drop everything from the relationship comment onward.
        var relIdx = s.IndexOf("-- CREATE Relationships", StringComparison.Ordinal);
        if (relIdx >= 0) s = s[..relIdx];

        // 7. Drop COMMENT ON COLUMN lines.
        s = Regex.Replace(s, @"^COMMENT ON COLUMN.*$", "", RegexOptions.Multiline);

        // 8. Remove mdb-schema's generated file header (first 8 lines).
        var lines = s.Split('\n').Skip(8).ToArray();
        s = string.Join('\n', lines);

        // 9. Prepend our staging header (schema reset + search_path).
        const string header = """
            -- ----------------------------------------------------------
            -- Belize Medical Database Schema - Revision 5 B1 (auto-generated)
            -- ----------------------------------------------------------

            DROP SCHEMA IF EXISTS staging CASCADE;
            CREATE SCHEMA staging;

            SET search_path TO staging;

            """;

        return header + s;
    }
}
