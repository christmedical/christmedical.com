using ChristMedical.WebAPI.Infrastructure;
using ChristMedical.WebAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddScoped<IPatientService, PatientService>();

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

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("dev");
app.UseAuthorization();
app.MapControllers();

app.Run();
