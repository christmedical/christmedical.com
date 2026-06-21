namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>
/// Parses allowed browser origins for CORS.
/// </summary>
public static class CorsOrigins
{
    /// <summary>Default origins when <c>CORS_ORIGINS</c> is unset.</summary>
    public const string Default =
        "https://www.christmedical.com,https://christmedical.com,http://localhost:3000";

    /// <summary>Splits a comma-separated origin list.</summary>
    public static string[] Parse(string? raw) =>
        (raw ?? Default).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    /// <summary>
    /// Allows explicit configured origins plus any <c>*.christmedical.com</c> subdomain (and dev localhost).
    /// </summary>
    public static bool IsOriginAllowed(string origin, IReadOnlyList<string> explicitOrigins)
    {
        if (explicitOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
            return true;

        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
            return false;

        if (uri.Scheme is not ("http" or "https"))
            return false;

        var host = uri.Host;
        if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase))
            return true;

        if (host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase))
            return true;

        if (host.Equals("christmedical.com", StringComparison.OrdinalIgnoreCase))
            return true;

        return host.EndsWith(".christmedical.com", StringComparison.OrdinalIgnoreCase);
    }
}
