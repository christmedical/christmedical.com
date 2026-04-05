using System.Globalization;

namespace EtlTool.Mapping;

internal static class ClinicalParse
{
    private const string AccessNullDate = "01/00/00 00:00:00";

    public static string? CleanString(string? value)
    {
        if (value is null) return null;
        var trimmed = value.Trim();
        return trimmed.Length == 0 ? null : trimmed;
    }

    public static bool ParseBool(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        return value.Trim().ToLowerInvariant() switch
        {
            "-1" or "1" or "true" => true,
            _ => false,
        };
    }

    public static DateTime? ParseDateUtc(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        if (trimmed.StartsWith(AccessNullDate, StringComparison.OrdinalIgnoreCase))
            return null;

        return DateTime.TryParse(trimmed, CultureInfo.InvariantCulture,
            DateTimeStyles.AllowWhiteSpaces, out DateTime dt)
            ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
            : null;
    }
}
