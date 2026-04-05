using System.Text.RegularExpressions;
using Dapper;
using EtlTool.Configuration;
using EtlTool.Logging;
using EtlTool.Services;
using EtlTool.Utilities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using Serilog;

// ---------------------------------------------------------------------------
// Configuration — appsettings + optional conversion-config.json
// ---------------------------------------------------------------------------

var baseDir = Directory.GetCurrentDirectory();

var configuration = new ConfigurationBuilder()
    .SetBasePath(baseDir)
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
    .AddJsonFile("conversion-config.json", optional: true, reloadOnChange: false)
    .Build();

var connectionString = configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is missing from appsettings.json.");

var conversion = new ConversionOptions();
configuration.Bind(conversion);

// Resolve paths relative to CWD (conversion/etl-tool when using `dotnet run`, /app/conversion/etl-tool in Docker).
string ResolveEtl(string key) =>
    Path.GetFullPath(Path.Combine(
        baseDir,
        configuration[$"Etl:RepoRoot"] ?? "..",
        configuration[$"Etl:{key}"] ?? throw new InvalidOperationException($"Etl:{key} missing")));

var repoRoot = Path.GetFullPath(Path.Combine(baseDir, configuration["Etl:RepoRoot"] ?? ".."));
var csvDir = ResolveEtl("CsvOutputDir");
var sqlSchemaDir = ResolveEtl("SqlSchemaDir");
var extractScript = configuration["Etl:ExtractScript"] ?? "etl/Extract_Access_DB.sh";
var v1SchemaPath = Path.Combine(sqlSchemaDir, "V1__Initial_Schema.sql");

// Access DB resolution: conversion-config → /app/input (Docker) → input_access/*.accdb → appsettings path
var defaultAccess = ResolveEtl("AccessDb");
var inputAccessDir = Path.Combine(repoRoot, configuration["Etl:InputAccessDir"] ?? "input_access");
const string dockerInputDir = "/app/input";
const string dockerOutputDir = "/app/output";

string accessDbPath;
if (!string.IsNullOrWhiteSpace(conversion.AccessDatabasePath)
    && File.Exists(conversion.AccessDatabasePath))
{
    accessDbPath = Path.GetFullPath(conversion.AccessDatabasePath);
}
else if (Directory.Exists(dockerInputDir))
{
    var found = Directory.EnumerateFiles(dockerInputDir, "*.accdb", SearchOption.TopDirectoryOnly).FirstOrDefault();
    accessDbPath = found ?? (Directory.Exists(inputAccessDir)
        ? Directory.EnumerateFiles(inputAccessDir, "*.accdb", SearchOption.TopDirectoryOnly).FirstOrDefault()
        : null) ?? defaultAccess;
}
else if (Directory.Exists(inputAccessDir))
{
    var found = Directory.EnumerateFiles(inputAccessDir, "*.accdb", SearchOption.TopDirectoryOnly).FirstOrDefault();
    accessDbPath = found ?? defaultAccess;
}
else
{
    accessDbPath = defaultAccess;
}

var archiveBaseDir = !string.IsNullOrWhiteSpace(conversion.ArchiveOutputPath)
    ? Path.GetFullPath(conversion.ArchiveOutputPath)
    : Directory.Exists(dockerOutputDir)
        ? dockerOutputDir
        : Path.Combine(repoRoot, "output_archives");

if (conversion.TenantId is < 1 or > 32767)
{
    const string msg = "TenantId must fit PostgreSQL SMALLINT (1–32767).";
    Console.Error.WriteLine(msg);
    throw new InvalidOperationException(msg);
}

var tenantId = (short)conversion.TenantId;

Environment.SetEnvironmentVariable("REPO_ROOT", repoRoot);
Environment.SetEnvironmentVariable("ACCESS_DB_PATH", accessDbPath);
Environment.SetEnvironmentVariable("CSV_OUTPUT_DIR", csvDir);
Environment.SetEnvironmentVariable("STAGING_SCHEMA_SQL", Path.Combine(sqlSchemaDir, "V2__Inital_Staging_Schema.sql"));
Environment.SetEnvironmentVariable("ETL_FORCE_CLEAN_OUTPUT", "1");

// ---------------------------------------------------------------------------
// Logging — full detail → rolling daily log file
// ---------------------------------------------------------------------------

var logDir = Path.Combine(baseDir, "logs");
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
var snake = TenantNaming.ToSnakeCaseFolder(conversion.TenantName);

Console.WriteLine("Christ Medical — Conversion Appliance (EtlTool)");
Console.WriteLine($"  Connection : {maskedCs}");
Console.WriteLine($"  Repo root  : {repoRoot}");
Console.WriteLine($"  Tenant     : {conversion.TenantName}  (id={tenantId}, folder={snake})");
Console.WriteLine($"  Access DB  : {accessDbPath}");
Console.WriteLine($"  Keep data  : {conversion.ShouldKeepData()}  |  Archive: {conversion.ShouldCreateArchive()}");
Console.WriteLine($"  Log file   : {logDir}{Path.DirectorySeparatorChar}etl-{DateTime.Now:yyyyMMdd}.log");

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
// Stage 0 — Extract Access DB
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
// Stage 1 — Schema
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
// Stage 2 — Staging load
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
// Stage 3 — Patients
// ---------------------------------------------------------------------------

progress.BeginStage("Stage 3: Patient Migration");
Log.Information("=== Stage 3: Patient Migration ===");

try
{
    await new PatientMigrationService(connectionString, loggerFactory.CreateLogger<PatientMigrationService>())
        .RunAsync(tenantId, progress);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Patient migration failed.");
    EtlProgress.Fatal($"Patient migration aborted — {ex.Message}");
    Environment.Exit(1);
}

// ---------------------------------------------------------------------------
// Stage 4 — Visits (only for patients migrated in Stage 3)
// ---------------------------------------------------------------------------

progress.BeginStage("Stage 4: Visit Migration");
Log.Information("=== Stage 4: Visit Migration ===");

try
{
    await new VisitMigrationService(connectionString, loggerFactory.CreateLogger<VisitMigrationService>())
        .RunAsync(tenantId, progress);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Visit migration failed.");
    EtlProgress.Fatal($"Visit migration aborted — {ex.Message}");
    Environment.Exit(1);
}

// ---------------------------------------------------------------------------
// Stage 5–7 — Visit-linked clinical (Rx / Dx / Eye)
// ---------------------------------------------------------------------------

progress.BeginStage("Stage 5: Medications (visits_rx)");
Log.Information("=== Stage 5: Medication Migration ===");
try
{
    await new MedicationMigrationService(connectionString, loggerFactory.CreateLogger<MedicationMigrationService>())
        .RunAsync(tenantId, progress);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Medication migration failed.");
    EtlProgress.Fatal($"Medication migration aborted — {ex.Message}");
    Environment.Exit(1);
}

progress.BeginStage("Stage 6: Diagnoses (visits_dx)");
Log.Information("=== Stage 6: Diagnosis Migration ===");
try
{
    await new DiagnosisMigrationService(connectionString, loggerFactory.CreateLogger<DiagnosisMigrationService>())
        .RunAsync(tenantId, progress);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Diagnosis migration failed.");
    EtlProgress.Fatal($"Diagnosis migration aborted — {ex.Message}");
    Environment.Exit(1);
}

progress.BeginStage("Stage 7: Eye exams (visits_eye)");
Log.Information("=== Stage 7: Eye Exam Migration ===");
try
{
    await new EyeExamMigrationService(connectionString, loggerFactory.CreateLogger<EyeExamMigrationService>())
        .RunAsync(tenantId, progress);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Eye exam migration failed.");
    EtlProgress.Fatal($"Eye exam migration aborted — {ex.Message}");
    Environment.Exit(1);
}

// ---------------------------------------------------------------------------
// Stage 8 — Optional portable archive
// ---------------------------------------------------------------------------

if (conversion.ShouldCreateArchive())
{
    progress.BeginStage("Stage 8: Create portable archive");
    Log.Information("=== Stage 8: Archive ===");

    try
    {
        Directory.CreateDirectory(archiveBaseDir);
        var converterPy = Path.Combine(AppContext.BaseDirectory, "convert_archive_csv_for_pg.py");
        if (!File.Exists(converterPy))
            converterPy = Path.Combine(repoRoot, "appliance", "convert_archive_csv_for_pg.py");
        if (!File.Exists(converterPy))
            throw new FileNotFoundException("convert_archive_csv_for_pg.py not found next to EtlTool.dll or under conversion/appliance/.");

        await new ArchiveExportService(connectionString, loggerFactory.CreateLogger<ArchiveExportService>())
            .WriteArchiveAsync(conversion, v1SchemaPath, archiveBaseDir, converterPy, default);
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "Archive export failed.");
        EtlProgress.Fatal($"Archive export aborted — {ex.Message}");
        Environment.Exit(1);
    }
}

// ---------------------------------------------------------------------------
// Stage 9 — Optional DB revert (KeepData = no)
// ---------------------------------------------------------------------------

if (!conversion.ShouldKeepData())
{
    if (!conversion.ShouldKeepStagingData())
        Log.Information("KeepStagingData overridden by KeepData=no.");

    progress.BeginStage("Stage 9: Revert database (KeepData=no)");
    try
    {
        await new DatabaseCleanupService(
                connectionString,
                sqlSchemaDir,
                loggerFactory.CreateLogger<DatabaseCleanupService>())
            .RevertConversionAsync(default);

        DatabaseCleanupService.EmitConsoleWarning();
        Log.Warning("Database reverted per conversion-config (KeepData=no).");
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "Cleanup (revert) failed.");
        DatabaseCleanupService.EmitConsoleWarning();
        EtlProgress.Fatal($"Cleanup aborted — {ex.Message}");
        Environment.Exit(1);
    }
}

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

Console.WriteLine($"\n[{DateTime.Now:HH:mm:ss}] All stages complete.");
Log.Information("All ETL stages complete.");
await Log.CloseAndFlushAsync();
