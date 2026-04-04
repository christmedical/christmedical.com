using System.Text.RegularExpressions;
using Dapper;
using EtlTool.Logging;
using EtlTool.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using Serilog;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
    .Build();

var connectionString = configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is missing from appsettings.json.");

// Resolve all file paths relative to CWD (etl-tool/ when using `dotnet run`).
string ResolveEtl(string key) =>
    Path.GetFullPath(Path.Combine(
        Directory.GetCurrentDirectory(),
        configuration[$"Etl:RepoRoot"]  ?? "..",
        configuration[$"Etl:{key}"]     ?? throw new InvalidOperationException($"Etl:{key} missing")));

var repoRoot      = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), configuration["Etl:RepoRoot"] ?? ".."));
var csvDir        = ResolveEtl("CsvOutputDir");
var sqlSchemaDir  = ResolveEtl("SqlSchemaDir");
var extractScript = configuration["Etl:ExtractScript"] ?? "conversion/etl/Extract_Access_DB.sh";

// ---------------------------------------------------------------------------
// Logging — full detail → rolling daily log file; Fatal only → stderr
// ---------------------------------------------------------------------------

var logDir = Path.Combine(Directory.GetCurrentDirectory(), "logs");
Directory.CreateDirectory(logDir);

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.File(
        path: Path.Combine(logDir, "etl-.log"),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

using var loggerFactory = LoggerFactory.Create(b => b.AddSerilog(Log.Logger));

// ---------------------------------------------------------------------------
// Console banner
// ---------------------------------------------------------------------------

var maskedCs = Regex.Replace(connectionString, @"(?i)(Password|Pwd)=[^;]*", "Password=****");

Console.WriteLine("Christ Medical — ETL Migration Tool");
Console.WriteLine($"  Connection : {maskedCs}");
Console.WriteLine($"  Repo root  : {repoRoot}");
Console.WriteLine($"  Log file   : {logDir}{Path.DirectorySeparatorChar}etl-{DateTime.Now:yyyyMMdd}.log");

// ---------------------------------------------------------------------------
// Staging row diagnostic (quick sanity check)
// ---------------------------------------------------------------------------

await using (var diagConn = new NpgsqlConnection(connectionString))
{
    try
    {
        await diagConn.OpenAsync();
        int sp = await diagConn.QuerySingleAsync<int>("SELECT COUNT(*) FROM staging.patients");
        int sv = await diagConn.QuerySingleAsync<int>("SELECT COUNT(*) FROM staging.visits_gen");
        Console.WriteLine($"\n  staging.patients   : {sp:N0} rows  (pre-run)");
        Console.WriteLine($"  staging.visits_gen : {sv:N0} rows  (pre-run)");
    }
    catch
    {
        Console.WriteLine("\n  (staging schema not yet initialised — will be created in Stage 1)");
    }
}

var progress = new EtlProgress();

// ---------------------------------------------------------------------------
// Stage 0 — Extract Access DB → CSV + regenerate V2 staging schema
// ---------------------------------------------------------------------------

progress.BeginStage("Stage 0: Extract Access Database");
Log.Information("=== Stage 0: Extract ===");

try
{
    await new ExtractionService(repoRoot, extractScript, loggerFactory.CreateLogger<ExtractionService>())
        .RunAsync(progress);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Extraction failed.");
    EtlProgress.Fatal($"Extraction aborted — {ex.Message}");
    Environment.Exit(1);
}

// ---------------------------------------------------------------------------
// Stage 1 — Reset DB and initialise schemas (V0 → V1 → V2)
// ---------------------------------------------------------------------------

progress.BeginStage("Stage 1: Initialise Database Schema");
Log.Information("=== Stage 1: Schema Init ===");

try
{
    await new SchemaService(connectionString, sqlSchemaDir, loggerFactory.CreateLogger<SchemaService>())
        .RunAsync(progress);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Schema initialisation failed.");
    EtlProgress.Fatal($"Schema init aborted — {ex.Message}");
    Environment.Exit(1);
}

// ---------------------------------------------------------------------------
// Stage 2 — Load staging (CSV → staging tables via COPY)
// ---------------------------------------------------------------------------

progress.BeginStage("Stage 2: Load Staging Tables");
Log.Information("=== Stage 2: Load Staging ===");

try
{
    await new StagingLoaderService(connectionString, csvDir, loggerFactory.CreateLogger<StagingLoaderService>())
        .RunAsync(progress);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Staging load failed.");
    EtlProgress.Fatal($"Staging load aborted — {ex.Message}");
    Environment.Exit(1);
}

// ---------------------------------------------------------------------------
// Stage 3 — Patient migration (staging → public.patients)
// ---------------------------------------------------------------------------

progress.BeginStage("Stage 3: Patient Migration");
Log.Information("=== Stage 3: Patient Migration ===");

try
{
    await new PatientMigrationService(connectionString, loggerFactory.CreateLogger<PatientMigrationService>())
        .RunAsync(progress);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Patient migration failed.");
    EtlProgress.Fatal($"Patient migration aborted — {ex.Message}");
    Environment.Exit(1);
}

// ---------------------------------------------------------------------------
// Stage 4 — Visit migration (staging → public.visits + vitals + lab_results)
// ---------------------------------------------------------------------------

progress.BeginStage("Stage 4: Visit Migration  (test batch: 5,000)");
Log.Information("=== Stage 4: Visit Migration ===");

try
{
    await new VisitMigrationService(connectionString, loggerFactory.CreateLogger<VisitMigrationService>())
        .RunAsync(progress);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Visit migration failed.");
    EtlProgress.Fatal($"Visit migration aborted — {ex.Message}");
    Environment.Exit(1);
}

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

Console.WriteLine($"\n[{DateTime.Now:HH:mm:ss}] All stages complete.");
Log.Information("All ETL stages complete.");
await Log.CloseAndFlushAsync();
