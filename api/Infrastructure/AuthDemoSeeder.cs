using ChristMedical.WebAPI.Models;
using Dapper;
using Microsoft.AspNetCore.Identity;
using Npgsql;

namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>Demo sign-in accounts for subdomain routing and feedback review.</summary>
public static class AuthDemoSeeder
{
    private const string LegacyDemoPassword = "ChristMedical1!";
    private const string DevPassword = "password";

    public static async Task EnsureAsync(NpgsqlConnection conn, ILogger logger, CancellationToken cancellationToken)
    {
        await EnsureLegacyDemoUsersIfEmptyAsync(conn, logger, cancellationToken);
    }

    private static async Task EnsureLegacyDemoUsersIfEmptyAsync(
        NpgsqlConnection conn,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var count = await conn.ExecuteScalarAsync<long>(
            new CommandDefinition("SELECT COUNT(*) FROM public.users;", cancellationToken: cancellationToken));
        if (count > 0)
        {
            logger.LogInformation("Skipping legacy auth demo seed: users table already has {Count} rows.", count);
            return;
        }

        var hasher = new PasswordHasher<AuthUser>();
        var hash = hasher.HashPassword(new AuthUser { Email = "seed@local" }, LegacyDemoPassword);

        var belizeUserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1");
        var multiUserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2");

        await UpsertUserAsync(conn, belizeUserId, "belize@christmedical.com", "Belize Clinician", hash, cancellationToken);
        await UpsertMembershipAsync(conn, belizeUserId, 1, "clinician", cancellationToken);

        await UpsertUserAsync(conn, multiUserId, "multi@christmedical.com", "Multi Clinic User", hash, cancellationToken);
        await UpsertMembershipAsync(conn, multiUserId, 1, "clinician", cancellationToken);
        await UpsertMembershipAsync(conn, multiUserId, 3, "clinician", cancellationToken);

        logger.LogInformation(
            "Seeded legacy demo auth users (password: {Password}). belize@ / multi@christmedical.com",
            LegacyDemoPassword);
    }

    /// <summary>Idempotent dev accounts used for feedback review and owner login.</summary>
    public static async Task EnsureDevAccountsAsync(
        NpgsqlConnection conn,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var hasher = new PasswordHasher<AuthUser>();
        var hash = hasher.HashPassword(new AuthUser { Email = "seed@local" }, DevPassword);

        var jameyId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3");
        var connieId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4");

        await UpsertUserAsync(conn, jameyId, "jamey@mcelveen.us", "Jamey", hash, cancellationToken);
        jameyId = await ResolveUserIdAsync(conn, "jamey@mcelveen.us", jameyId, cancellationToken);
        await UpsertMembershipAsync(conn, jameyId, 1, "admin", cancellationToken);
        await UpsertMembershipAsync(conn, jameyId, 2, "admin", cancellationToken);
        await UpsertMembershipAsync(conn, jameyId, 3, "admin", cancellationToken);

        await UpsertUserAsync(conn, connieId, "connie@mcelveen.us", "Connie", hash, cancellationToken);
        connieId = await ResolveUserIdAsync(conn, "connie@mcelveen.us", connieId, cancellationToken);
        await UpsertMembershipAsync(conn, connieId, 1, "clinician", cancellationToken);
        await UpsertMembershipAsync(conn, connieId, 2, "clinician", cancellationToken);
        await UpsertMembershipAsync(conn, connieId, 3, "clinician", cancellationToken);

        await UpsertFeedbackReviewerAsync(conn, "jamey@mcelveen.us", "Jamey", cancellationToken);
        await UpsertFeedbackReviewerAsync(conn, "connie@mcelveen.us", "Connie", cancellationToken);

        logger.LogInformation(
            "Ensured dev auth + feedback accounts (password: {Password}): jamey@ / connie@mcelveen.us",
            DevPassword);
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
        string email,
        string displayName,
        string passwordHash,
        CancellationToken cancellationToken)
    {
        var existingId = await conn.ExecuteScalarAsync<Guid?>(
            new CommandDefinition(
                "SELECT id FROM public.users WHERE lower(email) = lower(@email);",
                new { email },
                cancellationToken: cancellationToken));

        if (existingId.HasValue)
        {
            const string update = """
                UPDATE public.users
                SET password_hash = @hash, display_name = @displayName, is_active = TRUE
                WHERE id = @userId;
                """;

            await conn.ExecuteAsync(new CommandDefinition(
                update,
                new { userId = existingId.Value, displayName, hash = passwordHash },
                cancellationToken: cancellationToken));
            return;
        }

        const string insert = """
            INSERT INTO public.users (id, email, display_name, password_hash, is_active)
            VALUES (@id, @email, @displayName, @hash, TRUE);
            """;

        await conn.ExecuteAsync(new CommandDefinition(
            insert,
            new { id, email, displayName, hash = passwordHash },
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

    private static async Task UpsertFeedbackReviewerAsync(
        NpgsqlConnection conn,
        string email,
        string displayName,
        CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO public.feedback_reviewer_prefs (email, display_name, feedback_enabled, updated_at)
            VALUES (@email, @displayName, TRUE, CURRENT_TIMESTAMP)
            ON CONFLICT (email) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                feedback_enabled = TRUE,
                updated_at = CURRENT_TIMESTAMP;
            """;

        await conn.ExecuteAsync(new CommandDefinition(
            sql,
            new { email, displayName },
            cancellationToken: cancellationToken));
    }
}
