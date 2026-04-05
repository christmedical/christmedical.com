using Dapper;
using EtlTool.Logging;
using EtlTool.Mapping;
using EtlTool.Models.Staging;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EtlTool.Services;

public sealed class MedicationMigrationService
{
    private const int InsertChunkSize = 500;

    private readonly string _connectionString;
    private readonly ILogger<MedicationMigrationService> _logger;

    public MedicationMigrationService(string connectionString, ILogger<MedicationMigrationService> logger)
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
        _logger.LogInformation("Medication migration — visit cache {Count} rows.", visitCache.Count);

        var stagingRows = await ExtractAsync(connection, tenantId, cancellationToken);
        _logger.LogInformation("Extracted {Count} Rx rows tied to migrated visits.", stagingRows.Count);

        await LoadAsync(connection, stagingRows, visitCache, tenantId, progress, cancellationToken);
    }

    private static async Task<List<StagingVisitRx>> ExtractAsync(
        NpgsqlConnection connection,
        short tenantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                rx.rxid        AS Rxid,
                rx.visitid     AS VisitId,
                rx.medid       AS MedId,
                rx.directions  AS Directions,
                rx.dose        AS Dose,
                rx.dnd         AS Dnd,
                rx.rxupdatedon AS RxUpdatedOn,
                m.medcode      AS MedCode,
                m.medname      AS MedName,
                m.strength     AS MedStrength
            FROM staging.visits_rx AS rx
            LEFT JOIN staging.medications AS m
              ON trim(both from coalesce(m.medlistid, '')) = trim(both from coalesce(rx.medid, ''))
            WHERE EXISTS (
                SELECT 1
                FROM   public.visits AS v
                WHERE  v.tenant_id = @TenantId
                  AND  trim(both from coalesce(v.legacy_id, '')) = trim(both from coalesce(rx.visitid, ''))
            )
            ORDER BY rx.rxid
            """;

        var rows = await connection.QueryAsync<StagingVisitRx>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    private async Task LoadAsync(
        NpgsqlConnection connection,
        List<StagingVisitRx> stagingRows,
        IReadOnlyDictionary<string, Guid> visitCache,
        short tenantId,
        EtlProgress? progress,
        CancellationToken cancellationToken)
    {
        var mapped = new List<Models.Production.MedicationRow>(stagingRows.Count);
        var orphans = 0;

        progress?.BeginStep("Transforming visit Rx …", stagingRows.Count);
        foreach (var row in stagingRows)
        {
            var m = MedicationMapper.Map(row, visitCache, tenantId);
            if (m is null)
            {
                _logger.LogWarning(
                    "Orphan Rx — rxid '{Rxid}' visit '{VisitId}' has no matching public.visits.legacy_id.",
                    row.Rxid ?? "<null>",
                    row.VisitId ?? "<null>");
                orphans++;
            }
            else
                mapped.Add(m);

            progress?.Advance();
        }

        progress?.StepDone($"Mapped: {mapped.Count:N0}  |  Orphans: {orphans:N0}");

        const string insertSql = """
            INSERT INTO public.medications (
                id, tenant_id, visit_id, legacy_id, catalog_medlist_id,
                medication_code, medication_name, strength, dose, directions,
                did_not_dispense, device_id, client_updated_at, server_restored_at, is_deleted
            ) VALUES (
                @Id, @TenantId, @VisitId, @LegacyId, @CatalogMedlistId,
                @MedicationCode, @MedicationName, @Strength, @Dose, @Directions,
                @DidNotDispense, @DeviceId, @ClientUpdatedAt, @ServerRestoredAt, @IsDeleted
            )
            ON CONFLICT (id) DO NOTHING;
            """;

        int ok = 0, fail = 0;
        progress?.BeginStep("Loading medications …", mapped.Count);
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
                _logger.LogError(ex, "Medication chunk failed — {Count} rows.", chunk.Length);
                fail += chunk.Length;
            }

            progress?.Advance(chunk.Length);
        }

        _logger.LogInformation(
            "Medication migration complete — Loaded: {Ok}  Failed: {Fail}  Orphans: {Orphans}",
            ok, fail, orphans);
        progress?.StepDone($"Loaded: {ok:N0}  Failed: {fail:N0}");
    }
}
