namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>
/// Global kill switch for feedback API + widget. Default <b>on</b>; set <c>FEEDBACK_MODE=off</c> to disable.
/// Per-user access is controlled via <c>feedback_reviewer_prefs</c>.
/// </summary>
public static class FeedbackMode
{
    public const string EnvKey = "FEEDBACK_MODE";

    /// <summary>True unless explicitly set to <c>off</c>.</summary>
    public static bool IsEnabled(IConfiguration configuration)
    {
        var flag = configuration[EnvKey] ?? Environment.GetEnvironmentVariable(EnvKey);
        if (string.IsNullOrWhiteSpace(flag))
            return true;

        return !string.Equals(flag, "off", StringComparison.OrdinalIgnoreCase);
    }
}
