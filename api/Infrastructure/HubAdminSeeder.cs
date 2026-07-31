using ChristMedical.WebAPI.Models;
using Dapper;
using Microsoft.AspNetCore.Identity;
using Npgsql;

namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>
/// Idempotent first-admin seed for field hub installs, driven by <c>HUB_ADMIN_*</c> env vars.
/// </summary>
public static class HubAdminSeeder
{
    /// <summary>Parsed hub admin settings from configuration / environment.</summary>
    public sealed record Options(
        string Email,
        string Password,
        string FirstName,
        string LastName,
        short TenantId,
        string Role);

    /// <summary>
    /// Reads hub admin options. Returns <c>null</c> when email or password is missing
    /// (hub admin seed is then skipped).
    /// </summary>
    public static Options? TryReadOptions(IConfiguration configuration)
    {
        var email = FirstNonEmpty(
            configuration["HUB_ADMIN_EMAIL"],
            Environment.GetEnvironmentVariable("HUB_ADMIN_EMAIL"));
        var password = FirstNonEmpty(
            configuration["HUB_ADMIN_PASSWORD"],
            Environment.GetEnvironmentVariable("HUB_ADMIN_PASSWORD"));

        if (email is null || password is null)
            return null;

        var firstName = FirstNonEmpty(
            configuration["HUB_ADMIN_FIRST_NAME"],
            Environment.GetEnvironmentVariable("HUB_ADMIN_FIRST_NAME")) ?? "Admin";
        var lastName = FirstNonEmpty(
            configuration["HUB_ADMIN_LAST_NAME"],
            Environment.GetEnvironmentVariable("HUB_ADMIN_LAST_NAME")) ?? "User";
        var role = FirstNonEmpty(
            configuration["HUB_ADMIN_ROLE"],
            Environment.GetEnvironmentVariable("HUB_ADMIN_ROLE")) ?? "admin";

        var tenantRaw = FirstNonEmpty(
            configuration["HUB_TENANT_ID"],
            Environment.GetEnvironmentVariable("HUB_TENANT_ID")) ?? "1";
        if (!short.TryParse(tenantRaw, out var tenantId) || tenantId < 1)
            tenantId = 1;

        return new Options(email.Trim(), password, firstName.Trim(), lastName.Trim(), tenantId, role.Trim());
    }

    /// <summary>Upserts the configured hub admin when options are present.</summary>
    public static async Task EnsureAsync(
        NpgsqlConnection conn,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var options = TryReadOptions(configuration);
        if (options is null)
        {
            logger.LogInformation("Hub admin seed skipped (HUB_ADMIN_EMAIL / HUB_ADMIN_PASSWORD not set).");
            return;
        }

        await EnsureAsync(conn, options, logger, cancellationToken);
    }

    /// <summary>Upserts the hub admin user and tenant membership (idempotent).</summary>
    public static async Task EnsureAsync(
        NpgsqlConnection conn,
        Options options,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var hasher = new PasswordHasher<AuthUser>();
        var hash = hasher.HashPassword(new AuthUser { Email = options.Email }, options.Password);
        var id = Guid.Parse("cccccccc-cccc-cccc-cccc-ccccccccccc1");

        await UpsertUserAsync(conn, id, options, hash, cancellationToken);
        id = await ResolveUserIdAsync(conn, options.Email, id, cancellationToken);
        await UpsertMembershipAsync(conn, id, options.TenantId, options.Role, cancellationToken);

        logger.LogInformation(
            "Ensured hub admin {Email} (tenant {TenantId}, role {Role}).",
            options.Email,
            options.TenantId,
            options.Role);
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }

    private static async Task<Guid> ResolveUserIdAsync(
        NpgsqlConnection conn,
        string email,
        Guid fallbackId,
        CancellationToken cancellationToken)
    {
        var id = await conn.ExecuteScalarAsync<Guid?>(
            new CommandDefinition(
                "SELECT id FROM public.users WHERE lower(email) = lower(@email);",
                new { email },
                cancellationToken: cancellationToken));
        return id ?? fallbackId;
    }

    private static async Task UpsertUserAsync(
        NpgsqlConnection conn,
        Guid id,
        Options options,
        string passwordHash,
        CancellationToken cancellationToken)
    {
        var displayName = string.IsNullOrEmpty(options.LastName.Trim())
            ? options.FirstName.Trim()
            : $"{options.FirstName.Trim()} {options.LastName.Trim()}";

        var existingId = await conn.ExecuteScalarAsync<Guid?>(
            new CommandDefinition(
                "SELECT id FROM public.users WHERE lower(email) = lower(@email);",
                new { email = options.Email },
                cancellationToken: cancellationToken));

        if (existingId.HasValue)
        {
            const string update = """
                UPDATE public.users
                SET
                    password_hash = @hash,
                    first_name = @firstName,
                    last_name = @lastName,
                    display_name = @displayName,
                    is_active = TRUE
                WHERE id = @userId;
                """;

            await conn.ExecuteAsync(new CommandDefinition(
                update,
                new
                {
                    userId = existingId.Value,
                    firstName = options.FirstName,
                    lastName = options.LastName,
                    displayName,
                    hash = passwordHash,
                },
                cancellationToken: cancellationToken));
            return;
        }

        const string insert = """
            INSERT INTO public.users (id, email, first_name, last_name, display_name, password_hash, is_active)
            VALUES (@id, @email, @firstName, @lastName, @displayName, @hash, TRUE);
            """;

        await conn.ExecuteAsync(new CommandDefinition(
            insert,
            new
            {
                id,
                email = options.Email,
                firstName = options.FirstName,
                lastName = options.LastName,
                displayName,
                hash = passwordHash,
            },
            cancellationToken: cancellationToken));
    }

    private static async Task UpsertMembershipAsync(
        NpgsqlConnection conn,
        Guid userId,
        short tenantId,
        string role,
        CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO public.user_tenant_memberships (user_id, tenant_id, role)
            VALUES (@userId, @tenantId, @role)
            ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = EXCLUDED.role;
            """;

        await conn.ExecuteAsync(new CommandDefinition(
            sql,
            new { userId, tenantId, role },
            cancellationToken: cancellationToken));
    }
}
