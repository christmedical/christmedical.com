namespace EtlTool.Configuration;

public static class JsonBool
{
    public static bool Parse(string? raw, bool defaultValue)
    {
        if (string.IsNullOrWhiteSpace(raw)) return defaultValue;

        return raw.Trim().ToLowerInvariant() switch
        {
            "yes" or "true"  or "1" or "y" => true,
            "no"  or "false" or "0" or "n" => false,
            _ => bool.TryParse(raw, out var b) ? b : defaultValue,
        };
    }
}
