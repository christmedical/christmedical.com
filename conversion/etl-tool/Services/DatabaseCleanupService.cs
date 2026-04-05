using Dapper;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EtlTool.Services;

/// <summary>
/// When <c>KeepData</c> is <c>no</c>, drops <c>staging</c> and rebuilds an empty
/// <c>public</c> schema (V0 + V1) so the database is left in a clean shell state.
/// </summary>
public class DatabaseCleanupService
{
    private readonly string _connectionString;
    private readonly string _sqlSchemaDir;
    private readonly ILogger<DatabaseCleanupService> _logger;

    public DatabaseCleanupService(
        string connectionString,
        string sqlSchemaDir,
        ILogger<DatabaseCleanupService> logger)
    {
        _connectionString = connectionString;
        _sqlSchemaDir     = sqlSchemaDir;
        _logger           = logger;
    }

    public async Task RevertConversionAsync(CancellationToken ct = default)
    {
        _logger.LogWarning("KeepData is NO — reverting staging and public schemas.");

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(ct);

        await connection.ExecuteAsync(new CommandDefinition(
            "DROP SCHEMA IF EXISTS staging CASCADE;", cancellationToken: ct));

        var v0 = Path.Combine(_sqlSchemaDir, "V0__Reset_Schema.sql");
        var v1 = Path.Combine(_sqlSchemaDir, "V1__Initial_Schema.sql");

        if (!File.Exists(v0) || !File.Exists(v1))
            throw new FileNotFoundException("V0 or V1 SQL file missing for cleanup.");

        var sql0 = await File.ReadAllTextAsync(v0, ct);
        var sql1 = await File.ReadAllTextAsync(v1, ct);

        await connection.ExecuteAsync(new CommandDefinition(sql0, cancellationToken: ct));
        await connection.ExecuteAsync(new CommandDefinition(sql1, cancellationToken: ct));

        _logger.LogInformation("Cleanup complete — staging removed; public schema recreated (empty).");
    }

    public static void EmitConsoleWarning()
    {
        Console.Error.WriteLine();
        Console.Error.WriteLine("WARNING: KeepData is set to NO. All database changes from this conversion have been reverted.");
        Console.Error.WriteLine();
    }
}
