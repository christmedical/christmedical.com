using ChristMedical.WebAPI.Models;
using Dapper;
using Microsoft.AspNetCore.Identity;
using Npgsql;

namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>Demo sign-in accounts for subdomain routing smoke tests.</summary>
public static class AuthDemoSeeder
{
    private const string DemoPassword = "ChristMedical1!";

    public static async Task EnsureAsync(NpgsqlConnection conn, ILogger logger, CancellationToken cancellationToken)
    {
        var count = await conn.ExecuteScalarAsync<long>(
            new CommandDefinition("SELECT COUNT(*) FROM public.users;", cancellationToken: cancellationToken));
        if (count > 0)
        {
            logger.LogInformation("Skipping auth demo seed: users table already has {Count} rows.", count);
            return;
        }

        var hasher = new PasswordHasher<AuthUser>();
        var hash = hasher.HashPassword(new AuthUser { Email = "seed@local" }, DemoPassword);

        const string insertUser = """
            INSERT INTO public.users (id, email, display_name, password_hash)
            VALUES (@id, @email, @displayName, @hash);
            """;

        var belizeUserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1");
        var multiUserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2");

        await conn.ExecuteAsync(new CommandDefinition(
            insertUser,
            new
            {
                id = belizeUserId,
                email = "belize@christmedical.com",
                displayName = "Belize Clinician",
                hash,
            },
            cancellationToken: cancellationToken));

        await conn.ExecuteAsync(new CommandDefinition(
            insertUser,
            new
            {
                id = multiUserId,
                email = "multi@christmedical.com",
                displayName = "Multi Clinic User",
                hash,
            },
            cancellationToken: cancellationToken));

        const string insertMembership = """
            INSERT INTO public.user_tenant_memberships (user_id, tenant_id, role)
            VALUES (@userId, @tenantId, 'clinician');
            """;

        await conn.ExecuteAsync(new CommandDefinition(
            insertMembership,
            new { userId = belizeUserId, tenantId = (short)1 },
            cancellationToken: cancellationToken));

        await conn.ExecuteAsync(new CommandDefinition(
            insertMembership,
            new { userId = multiUserId, tenantId = (short)1 },
            cancellationToken: cancellationToken));

        await conn.ExecuteAsync(new CommandDefinition(
            insertMembership,
            new { userId = multiUserId, tenantId = (short)3 },
            cancellationToken: cancellationToken));

        logger.LogInformation(
            "Seeded demo auth users (password: {Password}). belize@ / multi@christmedical.com",
            DemoPassword);
    }
}
