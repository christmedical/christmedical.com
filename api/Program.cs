// Copyright (C) 2026 Jamey McElveen
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// This file is part of Christ Medical.
// Christ Medical is free software: you can redistribute it and/or modify it
// under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or (at your
// option) any later version. See the LICENSE file or <https://www.gnu.org/licenses/>.

using System.Text;
using ChristMedical.WebAPI.Infrastructure;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var rawConnection =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("DATABASE_PUBLIC_URL");

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

var corsOrigins = CorsOrigins.Parse(builder.Configuration["CORS_ORIGINS"]);
var jwtSecret = builder.Configuration["JWT_SECRET"] ?? "dev-only-change-me-in-production-32chars!!";

builder.Services.AddHttpContextAccessor();
builder.Services.AddResponseCaching();
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IVisitService, VisitService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITenantRequestContext, TenantRequestContext>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "app",
        policy =>
        {
            var allowedOrigins = corsOrigins;
            policy
                .SetIsOriginAllowed(origin => CorsOrigins.IsOriginAllowed(origin, allowedOrigins))
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});

var app = builder.Build();

var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
await DbSchemaBootstrap.EnsureAsync(
    app.Configuration,
    app.Environment,
    startupLogger,
    CancellationToken.None);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("app");
app.UseAuthentication();
app.UseResponseCaching();
app.UseAuthorization();
app.MapControllers();

app.Run();
