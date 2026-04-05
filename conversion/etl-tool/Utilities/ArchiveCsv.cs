using System.Globalization;
using System.Text;

namespace EtlTool.Utilities;

public static class ArchiveCsv
{
    public static string EscapeField(object? value) => EscapeField(value, ',');

    /// <summary>
    /// RFC 4180-style escaping for an arbitrary field separator (archive ships ¦ per tenant spec).
    /// </summary>
    public static string EscapeField(object? value, char delimiter)
    {
        if (value is null or DBNull) return "";

        string s = value switch
        {
            bool b => b ? "true" : "false",
            DateTime dt => dt.Kind == DateTimeKind.Utc
                ? dt.ToString("O", CultureInfo.InvariantCulture)
                : DateTime.SpecifyKind(dt, DateTimeKind.Utc).ToString("O", CultureInfo.InvariantCulture),
            byte[] bytes => Convert.ToBase64String(bytes),
            Guid g => g.ToString(),
            _ => Convert.ToString(value, CultureInfo.InvariantCulture) ?? "",
        };

        if (s.Contains('"', StringComparison.Ordinal)) s = s.Replace("\"", "\"\"", StringComparison.Ordinal);

        ReadOnlySpan<char> dangerous = stackalloc char[] { delimiter, '\n', '\r', '"' };
        if (s.AsSpan().IndexOfAny(dangerous) >= 0) return $"\"{s}\"";
        return s;
    }

    public static Task WriteRowAsync(StreamWriter w, IReadOnlyList<object?> values, CancellationToken ct) =>
        WriteRowAsync(w, values, ',', ct);

    public static async Task WriteRowAsync(StreamWriter w, IReadOnlyList<object?> values, char delimiter, CancellationToken ct)
    {
        var sb = new StringBuilder();
        for (int i = 0; i < values.Count; i++)
        {
            if (i > 0) sb.Append(delimiter);
            sb.Append(EscapeField(values[i], delimiter));
        }

        await w.WriteLineAsync(sb.ToString());
    }
}
