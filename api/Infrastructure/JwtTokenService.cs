using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ChristMedical.WebAPI.Infrastructure;
using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.IdentityModel.Tokens;

namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>Reads JWT tenant claim and validates against routing headers.</summary>
public sealed class TenantRequestContext(IHttpContextAccessor httpContextAccessor) : ITenantRequestContext
{
    public short? TryResolveTenantId(short queryTenantId, out string? errorMessage)
    {
        errorMessage = null;
        var http = httpContextAccessor.HttpContext;
        if (http is null)
            return queryTenantId;

        short? jwtTenant = null;
        var claim = http.User.FindFirst("tenant_id")?.Value;
        if (short.TryParse(claim, out var parsed))
            jwtTenant = parsed;

        short? headerTenant = null;
        if (short.TryParse(http.Request.Headers["X-Tenant-Id"].FirstOrDefault(), out var headerParsed))
            headerTenant = headerParsed;

        var result = TenantAccessValidator.Validate(jwtTenant, headerTenant, queryTenantId);
        if (result.Kind == TenantAccessValidator.AccessResultKind.TenantMismatch)
        {
            errorMessage = result.Message;
            return null;
        }

        return result.TenantId;
    }
}

public sealed class JwtTokenService(IConfiguration configuration)
{
    private SymmetricSecurityKey SigningKey =>
        new(Encoding.UTF8.GetBytes(configuration["JWT_SECRET"] ?? "dev-only-change-me-in-production-32chars!!"));

    public string IssuePreAuthToken(Guid userId, string email)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("purpose", "preauth"),
        };
        return IssueToken(claims, TimeSpan.FromMinutes(5));
    }

    public string IssueAccessToken(Guid userId, string email, short tenantId, string role)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("tenant_id", tenantId.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim("purpose", "access"),
        };
        return IssueToken(claims, TimeSpan.FromHours(12));
    }

    public ClaimsPrincipal? ValidatePreAuthToken(string token)
    {
        var principal = Validate(token);
        if (principal?.FindFirst("purpose")?.Value != "preauth")
            return null;
        return principal;
    }

    public ClaimsPrincipal? ValidateAccessToken(string token) =>
        Validate(token)?.FindFirst("purpose")?.Value == "access" ? Validate(token) : null;

    private ClaimsPrincipal? Validate(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        try
        {
            return handler.ValidateToken(
                token,
                new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = SigningKey,
                    ClockSkew = TimeSpan.FromMinutes(1),
                },
                out _);
        }
        catch
        {
            return null;
        }
    }

    private string IssueToken(IEnumerable<Claim> claims, TimeSpan lifetime)
    {
        var creds = new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha256);
        var jwt = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.Add(lifetime),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }
}
