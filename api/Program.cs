using ChristMedical.WebAPI.Infrastructure;
using ChristMedical.WebAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddResponseCaching();
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddScoped<IPatientService, PatientService>();
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
