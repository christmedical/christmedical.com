namespace EtlTool;

/// <summary>Normalizes Access / staging identifier text for dictionary lookups.</summary>
public static class LegacyIdKey
{
    public static string Normalize(string? value) => value?.Trim() ?? string.Empty;
}
