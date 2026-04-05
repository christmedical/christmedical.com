using Dapper;
using EtlTool;
using Npgsql;

namespace EtlTool.Services;

/// <summary>Maps staging visit identifiers (<c>visits_gen.genid</c>) to production <c>public.visits.id</c>.</summary>
public static class VisitLookupCache
{
    public static async Task<Dictionary<string, Guid>> BuildAsync(
        NpgsqlConnection connection,
        short tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT legacy_id AS LegacyId, id AS Id
            FROM   public.visits
            WHERE  tenant_id = @TenantId
              AND  legacy_id IS NOT NULL
              AND  length(trim(legacy_id)) > 0
            """;

        var rows = await connection.QueryAsync<(string LegacyId, Guid Id)>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.ToDictionary(
            static r => LegacyIdKey.Normalize(r.LegacyId),
            static r => r.Id,
            StringComparer.OrdinalIgnoreCase);
    }
}
