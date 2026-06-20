using ChristMedical.WebAPI.Infrastructure;
using ChristMedical.WebAPI.Services;

var builder = WebApplication.CreateBuilder(args);

var rawConnection =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL");

if (rawConnection?.Contains("${{", StringComparison.Ordinal) == true)
{
    throw new InvalidOperationException(
        "ConnectionStrings__DefaultConnection contains unresolved Railway template text (${{...}}). "
        + "In the Railway dashboard use Add Reference → Postgres → pick a variable; do not paste ${{...}} literally.");
}

var normalizedConnection = PostgresConnectionString.Normalize(rawConnection);
if (!string.IsNullOrWhiteSpace(normalizedConnection))
{
    builder.Configuration.AddInMemoryCollection(
        new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = normalizedConnection,
        });
}

builder.Services.AddResponseCaching();
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IVisitService, VisitService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "dev",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

var app = builder.Build();

var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
await DbSchemaInitializer.EnsurePatientsSpiritualColumnsAsync(
    app.Configuration,
    startupLogger,
    CancellationToken.None);

await DbSchemaInitializer.EnsurePatientsLegacyAndContactColumnsAsync(
    app.Configuration,
    startupLogger,
    CancellationToken.None);

await DbSchemaInitializer.EnsurePatientsPhoneticColumnsAsync(
    app.Configuration,
    startupLogger,
    CancellationToken.None);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("dev");
app.UseResponseCaching();
app.UseAuthorization();
app.MapControllers();

app.Run();
