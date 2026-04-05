using Dapper;
using EtlTool.Logging;
using EtlTool.Mapping;
using EtlTool.Models.Staging;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EtlTool.Services;

public sealed class EyeExamMigrationService
{
    private const int InsertChunkSize = 500;

    private readonly string _connectionString;
    private readonly ILogger<EyeExamMigrationService> _logger;

    public EyeExamMigrationService(string connectionString, ILogger<EyeExamMigrationService> logger)
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
        _logger.LogInformation("Extracted {Count} eye exam rows tied to migrated visits.", stagingRows.Count);

        await LoadAsync(connection, stagingRows, visitCache, tenantId, progress, cancellationToken);
    }

    private static async Task<List<StagingVisitEye>> ExtractAsync(
        NpgsqlConnection connection,
        short tenantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                eyeid                    AS EyeId,
                field1                   AS Field1,
                patientid                AS PatientId,
                visitid                  AS VisitId,
                "va l"                   AS VaL,
                "va r"                   AS VaR,
                tonr                     AS TonR,
                tonl                     AS TonL,
                impression               AS Impression,
                plan                     AS Plan,
                readnear                 AS ReadNear,
                readdist                 AS ReadDist,
                eom                      AS Eom,
                pupils                   AS Pupils,
                "ar r"                   AS ArR,
                "ar l"                   AS ArL,
                va                       AS Va,
                l                        AS LField,
                eyeupdatedon             AS EyeUpdatedOn,
                cataracts                AS Cataracts,
                dryeyes                  AS DryEyes,
                glaucoma                 AS Glaucoma,
                ptergium                 AS Pterygium,
                other                    AS Other,
                readersgivendate         AS ReadersGivenDate,
                readersgivenstrength     AS ReadersGivenStrength
            FROM staging.visits_eye AS e
            WHERE EXISTS (
                SELECT 1
                FROM   public.visits AS v
                WHERE  v.tenant_id = @TenantId
                  AND  trim(both from coalesce(v.legacy_id, '')) = trim(both from coalesce(e.visitid, ''))
            )
            ORDER BY e.eyeid
            """;

        var rows = await connection.QueryAsync<StagingVisitEye>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    private async Task LoadAsync(
        NpgsqlConnection connection,
        List<StagingVisitEye> stagingRows,
        IReadOnlyDictionary<string, Guid> visitCache,
        short tenantId,
        EtlProgress? progress,
        CancellationToken cancellationToken)
    {
        var mapped = new List<Models.Production.EyeExamRow>(stagingRows.Count);
        var orphans = 0;

        progress?.BeginStep("Transforming eye exams …", stagingRows.Count);
        foreach (var row in stagingRows)
        {
            var e = EyeExamMapper.Map(row, visitCache, tenantId);
            if (e is null)
            {
                _logger.LogWarning(
                    "Orphan eye exam — eyeid '{Id}' visit '{VisitId}' has no matching visit.",
                    row.EyeId ?? "<null>",
                    row.VisitId ?? "<null>");
                orphans++;
            }
            else
                mapped.Add(e);

            progress?.Advance();
        }

        progress?.StepDone($"Mapped: {mapped.Count:N0}  |  Orphans: {orphans:N0}");

        const string insertSql = """
            INSERT INTO public.eye_exams (
                id, tenant_id, visit_id, legacy_id, legacy_patient_id, screening_flag,
                va_left, va_right, tonometry_r, tonometry_l, impression, plan,
                read_near, read_dist, eom, pupils, ar_r, ar_l, va_combined, l_field,
                cataracts, dry_eyes, glaucoma, pterygium, other_note,
                readers_given_at, readers_given_strength,
                device_id, client_updated_at, server_restored_at, is_deleted
            ) VALUES (
                @Id, @TenantId, @VisitId, @LegacyId, @LegacyPatientId, @ScreeningFlag,
                @VaLeft, @VaRight, @TonometryR, @TonometryL, @Impression, @Plan,
                @ReadNear, @ReadDist, @Eom, @Pupils, @ArR, @ArL, @VaCombined, @LField,
                @Cataracts, @DryEyes, @Glaucoma, @Pterygium, @OtherNote,
                @ReadersGivenAt, @ReadersGivenStrength,
                @DeviceId, @ClientUpdatedAt, @ServerRestoredAt, @IsDeleted
            )
            ON CONFLICT (id) DO NOTHING;
            """;

        int ok = 0, fail = 0;
        progress?.BeginStep("Loading eye exams …", mapped.Count);
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
                _logger.LogError(ex, "Eye exam chunk failed — {Count} rows.", chunk.Length);
                fail += chunk.Length;
            }

            progress?.Advance(chunk.Length);
        }

        _logger.LogInformation(
            "Eye exam migration complete — Loaded: {Ok}  Failed: {Fail}  Orphans: {Orphans}",
            ok, fail, orphans);
        progress?.StepDone($"Loaded: {ok:N0}  Failed: {fail:N0}");
    }
}
