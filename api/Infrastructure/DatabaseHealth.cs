using Dapper;
using Npgsql;

namespace ChristMedical.WebAPI.Infrastructure;

/// <summary>Database connectivity probe for readiness checks.</summary>
public static class DatabaseHealth
{
    /// <summary>
    /// Returns whether Postgres accepts connections and answers <c>SELECT 1</c>.
    /// </summary>
    public static async Task<(bool Ok, string? Error)> CheckAsync(
        string? connectionString,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return (false, "ConnectionStrings:DefaultConnection is not set.");
        }

        try
        {
            await using var conn = new NpgsqlConnection(connectionString);
            await conn.OpenAsync(cancellationToken);
            var one = await conn.ExecuteScalarAsync<int>(
                new CommandDefinition("SELECT 1;", cancellationToken: cancellationToken));
            return one == 1
                ? (true, null)
                : (false, "Unexpected database response.");
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }
}
