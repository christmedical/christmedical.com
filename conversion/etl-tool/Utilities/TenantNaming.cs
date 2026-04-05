using System.Globalization;
using System.Text;

namespace EtlTool.Utilities;

public static class TenantNaming
{
    /// <summary>
    /// "Belize Central" → <c>belize_central</c> for folders and script names.
    /// </summary>
    public static string ToSnakeCaseFolder(string tenantName)
    {
        if (string.IsNullOrWhiteSpace(tenantName)) return "tenant";

        var norm = tenantName.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb   = new StringBuilder(norm.Length);
        bool lastUnder = false;

        foreach (var ch in norm)
        {
            if (char.GetUnicodeCategory(ch) is UnicodeCategory.NonSpacingMark)
                continue;

            if (char.IsLetterOrDigit(ch))
            {
                sb.Append(ch);
                lastUnder = false;
            }
            else if (char.IsWhiteSpace(ch) || ch is '-' or '_' or '.' or '/' or '\\')
            {
                if (!lastUnder && sb.Length > 0)
                {
                    sb.Append('_');
                    lastUnder = true;
                }
            }
        }

        while (sb.Length > 0 && sb[^1] == '_') sb.Length--;
        return sb.Length == 0 ? "tenant" : sb.ToString();
    }
}
