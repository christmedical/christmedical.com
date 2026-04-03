using EtlTool.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
    .Build();

var connectionString = configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "DefaultConnection is missing from appsettings.json / environment.");

using var loggerFactory = LoggerFactory.Create(builder =>
    builder
        .AddConsole()
        .SetMinimumLevel(LogLevel.Information));

// ---------------------------------------------------------------------------
// Stage 1 — Patients
// ---------------------------------------------------------------------------
var patientLogger = loggerFactory.CreateLogger<PatientMigrationService>();
patientLogger.LogInformation("=== Stage 1: Patient Migration ===");

try
{
    await new PatientMigrationService(connectionString, patientLogger).RunAsync();
}
catch (Exception ex)
{
    patientLogger.LogCritical(ex, "Patient migration failed with an unhandled exception.");
    Environment.Exit(1);
}

// ---------------------------------------------------------------------------
// Stage 2 — Visits (test batch of 5,000)
// ---------------------------------------------------------------------------
var visitLogger = loggerFactory.CreateLogger<VisitMigrationService>();
visitLogger.LogInformation("=== Stage 2: Visit Migration ===");

try
{
    await new VisitMigrationService(connectionString, visitLogger).RunAsync();
}
catch (Exception ex)
{
    visitLogger.LogCritical(ex, "Visit migration failed with an unhandled exception.");
    Environment.Exit(1);
}

loggerFactory.CreateLogger("ETL").LogInformation("All stages complete.");
