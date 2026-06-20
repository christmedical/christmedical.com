namespace ChristMedical.WebAPI.Services;

/// <summary>Resolves effective tenant id for the current HTTP request.</summary>
public interface ITenantRequestContext
{
    /// <summary>
    /// Returns the tenant id to use for data access, or null when the caller should receive 403.
    /// </summary>
    short? TryResolveTenantId(short queryTenantId, out string? errorMessage);
}
