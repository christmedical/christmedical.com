using Dapper;
using EtlTool.Logging;
using EtlTool.Mapping;
using EtlTool.Models.Staging;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EtlTool.Services;

public sealed class DiagnosisMigrationService
{
    private const int InsertChunkSize = 500;

    private readonly string _connectionString;
    private readonly ILogger<DiagnosisMigrationService> _logger;

    public DiagnosisMigrationService(string connectionString, ILogger<DiagnosisMigrationService> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task RunAsync(
        short tenantId,
        EtlProgress? progress = null,
        CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var visitCache = await VisitLookupCache.BuildAsync(connection, tenantId, cancellationToken);
        var stagingRows = await ExtractAsync(connection, tenantId, cancellationToken);
        _logger.LogInformation("Extracted {Count} Dx rows tied to migrated visits.", stagingRows.Count);

        await LoadAsync(connection, stagingRows, visitCache, tenantId, progress, cancellationToken);
    }

    private static async Task<List<StagingVisitDx>> ExtractAsync(
        NpgsqlConnection connection,
        short tenantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                visitdxid    AS VisitDxId,
                visitid      AS VisitId,
                dxcode       AS DxCode,
                addlinfo     AS AddlInfo,
                dxupdatedon  AS DxUpdatedOn
            FROM staging.visits_dx AS dx
            WHERE EXISTS (
                SELECT 1
                FROM   public.visits AS v
                WHERE  v.tenant_id = @TenantId
                  AND  trim(both from coalesce(v.legacy_id, '')) = trim(both from coalesce(dx.visitid, ''))
            )
            ORDER BY dx.visitdxid
            """;

        var rows = await connection.QueryAsync<StagingVisitDx>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    private async Task LoadAsync(
        NpgsqlConnection connection,
        List<StagingVisitDx> stagingRows,
        IReadOnlyDictionary<string, Guid> visitCache,
        short tenantId,
        EtlProgress? progress,
        CancellationToken cancellationToken)
    {
        var mapped = new List<Models.Production.DiagnosisRow>(stagingRows.Count);
        var orphans = 0;

        progress?.BeginStep("Transforming visit Dx …", stagingRows.Count);
        foreach (var row in stagingRows)
        {
            var d = DiagnosisMapper.Map(row, visitCache, tenantId);
            if (d is null)
            {
                _logger.LogWarning(
                    "Orphan Dx — visitdxid '{Id}' visit '{VisitId}' has no matching visit.",
                    row.VisitDxId ?? "<null>",
                    row.VisitId ?? "<null>");
                orphans++;
            }
            else
                mapped.Add(d);

            progress?.Advance();
        }

        progress?.StepDone($"Mapped: {mapped.Count:N0}  |  Orphans: {orphans:N0}");

        const string insertSql = """
            INSERT INTO public.diagnoses (
                id, tenant_id, visit_id, legacy_id, dx_code, additional_info,
                device_id, client_updated_at, server_restored_at, is_deleted
            ) VALUES (
                @Id, @TenantId, @VisitId, @LegacyId, @DxCode, @AdditionalInfo,
                @DeviceId, @ClientUpdatedAt, @ServerRestoredAt, @IsDeleted
            )
            ON CONFLICT (id) DO NOTHING;
            """;

        int ok = 0, fail = 0;
        progress?.BeginStep("Loading diagnoses …", mapped.Count);
        foreach (var chunk in mapped.Chunk(InsertChunkSize))
        {
            await using var tx = await connection.BeginTransactionAsync(cancellationToken);
            try
            {
                await connection.ExecuteAsync(insertSql, chunk, transaction: tx);
                await tx.CommitAsync(cancellationToken);
                ok += chunk.Length;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Diagnosis chunk failed — {Count} rows.", chunk.Length);
                fail += chunk.Length;
            }

            progress?.Advance(chunk.Length);
        }

        _logger.LogInformation(
            "Diagnosis migration complete — Loaded: {Ok}  Failed: {Fail}  Orphans: {Orphans}",
            ok, fail, orphans);
        progress?.StepDone($"Loaded: {ok:N0}  Failed: {fail:N0}");
    }
}
