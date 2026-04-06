namespace ChristMedical.WebAPI.Utilities;

/// <summary>Splits a search box into up to two name tokens (first + last / phonetic pairing).</summary>
public static class PatientSearchTokenizer
{
    /// <returns>Lowercase tokens; empty when <paramref name="raw"/> is null/whitespace.</returns>
    public static IReadOnlyList<string> Tokenize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return Array.Empty<string>();

        var parts = raw.Split(
            (char[]?)null,
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length == 0)
            return Array.Empty<string>();

        if (parts.Length == 1)
            return new[] { parts[0]!.ToLowerInvariant() };

        return new[]
        {
            parts[0]!.ToLowerInvariant(),
            parts[1]!.ToLowerInvariant(),
        };
    }
}
