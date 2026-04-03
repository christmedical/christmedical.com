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

var logger = loggerFactory.CreateLogger<PatientMigrationService>();

logger.LogInformation("Starting Patient Migration ETL…");

try
{
    var service = new PatientMigrationService(connectionString, logger);
    await service.RunAsync();
    logger.LogInformation("ETL run finished successfully.");
}
catch (Exception ex)
{
    logger.LogCritical(ex, "ETL run failed with an unhandled exception.");
    Environment.Exit(1);
}
