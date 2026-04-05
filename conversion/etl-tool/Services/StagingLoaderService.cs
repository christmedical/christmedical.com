using System.Text;
using EtlTool.Logging;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EtlTool.Services;

/// <summary>
/// Stage 2 — Streams every CSV produced by the extract script into the
/// corresponding staging table via PostgreSQL's COPY FROM STDIN protocol.
///
/// CSV format (as produced by mdb-export):
///   - Delimiter : ¦  (U+00A6, BROKEN BAR — two bytes in UTF-8: 0xC2 0xA6)
///   - No header row  (mdb-export -H suppresses it)
///   - No field quoting
///   - Encoding  : UTF-8
/// </summary>
public class StagingLoaderService
{
    // CSV filename → staging table name (quoted for PostgreSQL)
    // Order matches the TRUNCATE statement so FK dependencies are respected.
    private static readonly (string CsvFile, string Table, string Encoding)[] TableMap =
    [
        ("Categories-Meds.csv", "\"categories-meds\"", "UTF8"),
        ("Diagnosis.csv",       "\"diagnosis\"",        "UTF8"),
        ("DoseStrength.csv",    "\"dosestrength\"",     "UTF8"),
        ("Locations.csv",       "\"locations\"",        "UTF8"),
        ("Medications.csv",     "\"medications\"",      "UTF8"),
        ("PatientTypes.csv",    "\"patienttypes\"",     "UTF8"),
        ("Patients.csv",        "\"patients\"",         "UTF8"),
        ("Visits_Chiro.csv",    "\"visits_chiro\"",     "UTF8"),
        ("Visits_Dx.csv",       "\"visits_dx\"",        "UTF8"),
        ("Visits_Eye.csv",      "\"visits_eye\"",       "UTF8"),
        ("Visits_Gen.csv",      "\"visits_gen\"",       "UTF8"),
        ("Visits_Gyn.csv",      "\"visits_gyn\"",       "UTF8"),
        ("Visits_Rx.csv",       "\"visits_rx\"",        "UTF8"),
    ];

    // mdb-export now uses comma as delimiter (no -Q flag, so fields are properly
    // quoted when they contain commas or embedded newlines).
    private const char CopyDelimiter = ',';

    private readonly string _connectionString;
    private readonly string _csvDir;
    private readonly ILogger<StagingLoaderService> _logger;

    public StagingLoaderService(string connectionString, string csvDir, ILogger<StagingLoaderService> logger)
    {
        _connectionString = connectionString;
        _csvDir = csvDir;
        _logger = logger;
    }

    public async Task RunAsync(EtlProgress? progress = null, CancellationToken ct = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(ct);

        await TruncateAllAsync(connection, ct);

        var existing = TableMap
            .Where(t => File.Exists(Path.Combine(_csvDir, t.CsvFile)))
            .ToArray();

        _logger.LogInformation("Found {Count} CSV files to load.", existing.Length);
        progress?.BeginStep("Loading staging tables ...  ", existing.Length);

        foreach (var (csvFile, table, encoding) in existing)
        {
            var csvPath = Path.Combine(_csvDir, csvFile);
            await LoadTableAsync(connection, table, csvPath, encoding, ct);
            progress?.Advance();
        }

        progress?.StepDone($"Staging loaded — {existing.Length} tables.");
    }

    // -------------------------------------------------------------------------
    // Bulk TRUNCATE (single statement, CASCADE clears FK chains)
    // -------------------------------------------------------------------------

    private async Task TruncateAllAsync(NpgsqlConnection connection, CancellationToken ct)
    {
        var tableList = string.Join(", ",
            TableMap.Select(t => $"staging.{t.Table}"));

        var sql = $"TRUNCATE TABLE {tableList} CASCADE;";

        _logger.LogInformation("Truncating staging tables...");
        await using var cmd = new NpgsqlCommand(sql, connection);
        cmd.CommandTimeout = 120;
        await cmd.ExecuteNonQueryAsync(ct);
    }

    // -------------------------------------------------------------------------
    // Per-table COPY FROM STDIN
    // -------------------------------------------------------------------------

    private async Task LoadTableAsync(
        NpgsqlConnection connection,
        string quotedTable,
        string csvPath,
        string pgEncoding,
        CancellationToken ct)
    {
        // PostgreSQL COPY FROM STDIN.  Standard CSV with comma delimiter and no header row.
        // Fields containing commas or newlines are properly quoted by mdb-export.
        var copySql = $"""
            COPY staging.{quotedTable}
            FROM STDIN
            WITH (FORMAT CSV, DELIMITER '{CopyDelimiter}', ENCODING '{pgEncoding}')
            """;

        _logger.LogInformation("COPY staging.{Table} FROM {File} (encoding={Enc})",
            quotedTable, Path.GetFileName(csvPath), pgEncoding);

        await using var importer = await connection.BeginTextImportAsync(copySql, ct);

        // Stream in 64 KB chunks; replace broken-bar with pipe in-place before writing.
        // Never materialises the whole file in memory.
        var fileEncoding = pgEncoding.Equals("LATIN1", StringComparison.OrdinalIgnoreCase)
            ? Encoding.Latin1
            : Encoding.UTF8;

        using var reader = new StreamReader(csvPath, fileEncoding);
        char[] buf = new char[65_536];
        int read;

        while ((read = await reader.ReadAsync(buf, 0, buf.Length).WaitAsync(ct)) > 0)
        {
            // Strip \r  — Windows line endings cause "unquoted carriage return" in COPY.
            // Strip \0  — OLE/binary columns (e.g. ptimage) emit raw null bytes which
            //             PostgreSQL text columns always reject.
            int writePos = 0;
            for (int i = 0; i < read; i++)
            {
                if (buf[i] != '\r' && buf[i] != '\0') buf[writePos++] = buf[i];
            }

            await importer.WriteAsync(buf, 0, writePos);
        }
    }
}
