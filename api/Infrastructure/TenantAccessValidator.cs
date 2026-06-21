namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>
/// Validates JWT tenant claim against request routing headers (subdomain is routing only).
/// </summary>
public static class TenantAccessValidator
{
    public enum AccessResultKind
    {
        AllowAnonymous,
        Allow,
        TenantMismatch,
    }

    public sealed record AccessResult(AccessResultKind Kind, short TenantId, string? Message = null);

    /// <summary>
    /// When a JWT tenant claim is present, it must match <paramref name="headerTenantId"/> (from subdomain).
    /// Query <paramref name="queryTenantId"/> is ignored when authenticated except for mismatch detection.
    /// </summary>
    public static AccessResult Validate(
        short? jwtTenantId,
        short? headerTenantId,
        short queryTenantId)
    {
        if (jwtTenantId is null)
            return new AccessResult(AccessResultKind.AllowAnonymous, queryTenantId);

        if (headerTenantId is not null && jwtTenantId != headerTenantId)
        {
            return new AccessResult(
                AccessResultKind.TenantMismatch,
                jwtTenantId.Value,
                "Token tenant does not match subdomain tenant.");
        }

        if (queryTenantId != jwtTenantId)
        {
            return new AccessResult(
                AccessResultKind.TenantMismatch,
                jwtTenantId.Value,
                "Token tenant does not match requested tenantId.");
        }

        return new AccessResult(AccessResultKind.Allow, jwtTenantId.Value);
    }
}
