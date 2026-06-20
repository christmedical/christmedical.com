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
}
