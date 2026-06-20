namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>
/// Reserved subdomain labels that cannot be tenant slugs.
/// </summary>
public static class ReservedSubdomains
{
    public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
    {
        "www",
        "login",
        "signin",
        "api",
        "admin",
        "app",
    };

    /// <summary>Returns true when <paramref name="slug"/> is allowed as a tenant subdomain.</summary>
    public static bool IsAllowedTenantSlug(string? slug) =>
        !string.IsNullOrWhiteSpace(slug)
        && !All.Contains(slug.Trim())
        && slug.All(c => char.IsLetterOrDigit(c) || c == '-');
}
