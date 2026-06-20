using ChristMedical.WebAPI.Infrastructure;
using ChristMedical.WebAPI.Models;
using Dapper;
using Microsoft.AspNetCore.Identity;
using Npgsql;

namespace ChristMedical.WebAPI.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<SelectTenantResponse?> SelectTenantAsync(SelectTenantRequest request, CancellationToken cancellationToken = default);
}

public interface ITenantService
{
    Task<TenantRecord?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TenantMembershipResponse>> GetMembershipsAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed class TenantService(IConfiguration configuration) : ITenantService
{
    public async Task<TenantRecord?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var cs = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(cs))
            return null;

        const string sql = """
            SELECT id AS Id, slug AS Slug, name AS Name, short_name AS ShortName, theme_color_hex AS ThemeColorHex
            FROM public.tenants
            WHERE lower(slug) = lower(@slug) AND is_active = TRUE;
            """;

        await using var conn = new NpgsqlConnection(cs);
        return await conn.QuerySingleOrDefaultAsync<TenantRecord>(
            new CommandDefinition(sql, new { slug }, cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<TenantMembershipResponse>> GetMembershipsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var cs = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(cs))
            return [];

        const string sql = """
            SELECT
                t.id AS TenantId,
                t.slug AS Slug,
                t.name AS Name,
                t.short_name AS ShortName,
                t.theme_color_hex AS ThemeColorHex,
                m.role AS Role
            FROM public.user_tenant_memberships m
            JOIN public.tenants t ON t.id = m.tenant_id
            WHERE m.user_id = @userId AND t.is_active = TRUE
            ORDER BY t.name;
            """;

        await using var conn = new NpgsqlConnection(cs);
        var rows = await conn.QueryAsync<TenantMembershipResponse>(
            new CommandDefinition(sql, new { userId }, cancellationToken: cancellationToken));
        return rows.ToList();
    }
}

public sealed class AuthService(
    IConfiguration configuration,
    ITenantService tenants,
    JwtTokenService jwt) : IAuthService
{
    private readonly PasswordHasher<AuthUser> _hasher = new();

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var cs = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(cs))
            throw new InvalidOperationException("Database is not configured.");

        const string sql = """
            SELECT id, email, display_name AS DisplayName, password_hash AS PasswordHash, is_active AS IsActive
            FROM public.users
            WHERE lower(email) = lower(@email);
            """;

        await using var conn = new NpgsqlConnection(cs);
        var user = await conn.QuerySingleOrDefaultAsync<AuthUserRow>(
            new CommandDefinition(sql, new { email = request.Email.Trim() }, cancellationToken: cancellationToken));

        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException("Invalid email or password.");

        var verify = _hasher.VerifyHashedPassword(
            new AuthUser { Email = user.Email },
            user.PasswordHash,
            request.Password);
        if (verify == PasswordVerificationResult.Failed)
            throw new UnauthorizedAccessException("Invalid email or password.");

        var memberships = await tenants.GetMembershipsAsync(user.Id, cancellationToken);
        if (memberships.Count == 0)
            throw new UnauthorizedAccessException("No clinic access is assigned to this account.");

        if (memberships.Count == 1)
        {
            var m = memberships[0];
            return new LoginResponse
            {
                Memberships = memberships,
                AccessToken = jwt.IssueAccessToken(user.Id, user.Email, m.TenantId, m.Role),
                TenantId = m.TenantId,
                TenantSlug = m.Slug,
            };
        }

        return new LoginResponse
        {
            Memberships = memberships,
            PreAuthToken = jwt.IssuePreAuthToken(user.Id, user.Email),
        };
    }

    public async Task<SelectTenantResponse?> SelectTenantAsync(
        SelectTenantRequest request,
        CancellationToken cancellationToken = default)
    {
        var principal = jwt.ValidatePreAuthToken(request.PreAuthToken);
        if (principal is null)
            return null;

        if (!Guid.TryParse(principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? principal.FindFirst("sub")?.Value, out var userId))
            return null;

        var email = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
            ?? principal.FindFirst("email")?.Value
            ?? "";

        var memberships = await tenants.GetMembershipsAsync(userId, cancellationToken);
        var chosen = memberships.FirstOrDefault(m => m.TenantId == request.TenantId);
        if (chosen is null)
            return null;

        return new SelectTenantResponse
        {
            AccessToken = jwt.IssueAccessToken(userId, email, chosen.TenantId, chosen.Role),
            TenantId = chosen.TenantId,
            TenantSlug = chosen.Slug,
        };
    }

    private sealed class AuthUserRow
    {
        public Guid Id { get; init; }
        public string Email { get; init; } = "";
        public string PasswordHash { get; init; } = "";
        public bool IsActive { get; init; }
    }
}
