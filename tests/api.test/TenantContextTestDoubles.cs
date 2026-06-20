using ChristMedical.WebAPI.Services;

namespace ChristMedical.Api.Test;

internal sealed class AllowTenantContext : ITenantRequestContext
{
    public short? TryResolveTenantId(short queryTenantId, out string? errorMessage)
    {
        errorMessage = null;
        return queryTenantId;
    }
}

internal sealed class DenyTenantContext : ITenantRequestContext
{
    public short? TryResolveTenantId(short queryTenantId, out string? errorMessage)
    {
        errorMessage = "Token tenant does not match subdomain tenant.";
        return null;
    }
}
