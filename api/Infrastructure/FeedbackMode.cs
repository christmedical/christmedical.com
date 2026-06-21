namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>
/// Gates feedback API endpoints — must match frontend <c>NEXT_PUBLIC_FEEDBACK_MODE=on</c>.
/// </summary>
public static class FeedbackMode
{
    public const string EnvKey = "FEEDBACK_MODE";

    /// <summary>Returns true only when <c>FEEDBACK_MODE=on</c>.</summary>
    public static bool IsEnabled(IConfiguration configuration) =>
        string.Equals(
            configuration[EnvKey] ?? Environment.GetEnvironmentVariable(EnvKey),
            "on",
            StringComparison.OrdinalIgnoreCase);
}
