using Npgsql;

namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>
/// Normalizes Railway/Heroku-style <c>postgresql://</c> URLs for Npgsql keyword connection strings.
/// </summary>
public static class PostgresConnectionString
{
    /// <summary>
    /// Returns a Npgsql-compatible connection string. URI forms are converted; keyword forms pass through.
    /// </summary>
    public static string? Normalize(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return connectionString;

        var value = connectionString.Trim();
        if (!value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            return value;
        }

        var uri = new Uri(value);
        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo[0]),
            SslMode = SslMode.Require,
        };

        if (userInfo.Length > 1)
            builder.Password = Uri.UnescapeDataString(userInfo[1]);

        return builder.ConnectionString;
    }
}
