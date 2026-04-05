using Dapper;
using EtlTool;
using EtlTool.Logging;
using EtlTool.Mapping;
using EtlTool.Models.Production;
using EtlTool.Models.Staging;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EtlTool.Services;

public class VisitMigrationService
{
    private const int InsertChunkSize = 1_000;

    private readonly string _connectionString;
    private readonly ILogger<VisitMigrationService> _logger;

    public VisitMigrationService(string connectionString, ILogger<VisitMigrationService> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task RunAsync(
        short tenantId,
        EtlProgress? progress = null,
        CancellationToken ct = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(ct);

        await EnsureSchemaExtensionsAsync(connection, ct);

        var patientCache = await BuildPatientCacheAsync(connection, tenantId, ct);
        _logger.LogInformation("Patient cache loaded — {Count} entries.", patientCache.Count);

        var stagingRows = await ExtractAsync(connection, tenantId, ct);
        _logger.LogInformation("Extracted {Count} visits from staging.visits_gen.", stagingRows.Count);

        await LoadAsync(connection, stagingRows, patientCache, tenantId, progress, ct);
    }

    // -------------------------------------------------------------------------
    // Setup — add legacy_id to visits; systolic/diastolic to vitals_core
    // -------------------------------------------------------------------------

    private static async Task EnsureSchemaExtensionsAsync(NpgsqlConnection conn, CancellationToken ct)
    {
        const string ddl = """
            ALTER TABLE public.visits
                ADD COLUMN IF NOT EXISTS tenant_id SMALLINT NOT NULL DEFAULT 1,
                ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(50);

            ALTER TABLE public.vitals_core
                ADD COLUMN IF NOT EXISTS tenant_id SMALLINT NOT NULL DEFAULT 1,
                ADD COLUMN IF NOT EXISTS systolic  SMALLINT,
                ADD COLUMN IF NOT EXISTS diastolic SMALLINT;

            ALTER TABLE public.lab_results
                ADD COLUMN IF NOT EXISTS tenant_id SMALLINT NOT NULL DEFAULT 1;
            """;

        await conn.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: ct));
    }

    // -------------------------------------------------------------------------
    // Patient cache — Dictionary<legacyId, productionUuid>
    // Loaded once into memory so zero DB hits during the transform loop.
    // -------------------------------------------------------------------------

    private static async Task<Dictionary<string, Guid>> BuildPatientCacheAsync(
        NpgsqlConnection conn, short tenantId, CancellationToken ct)
    {
        const string sql = """
            SELECT legacy_id AS LegacyId, id AS Id
            FROM   public.patients
            WHERE  legacy_id IS NOT NULL
            AND    length(trim(legacy_id)) > 0
            AND    tenant_id = @TenantId
            """;

        var rows = await conn.QueryAsync<(string LegacyId, Guid Id)>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct));

        return rows.ToDictionary(
            r => LegacyIdKey.Normalize(r.LegacyId),
            r => r.Id,
            StringComparer.OrdinalIgnoreCase);
    }

    // -------------------------------------------------------------------------
    // Extract — aliases map lowercase DB column names → PascalCase C# properties
    // -------------------------------------------------------------------------

    private static async Task<List<StagingVisit>> ExtractAsync(
        NpgsqlConnection conn, short tenantId, CancellationToken ct)
    {
        const string sql = """
            SELECT
                g.genid           AS GenId,
                g.patientid       AS PatientId,
                g.datevisit       AS DateVisit,
                g.height,
                g.weight,
                g.pulse,
                g.bp,
                g.resp,
                g.temp,
                g.glucoseblood    AS GlucoseBlood,
                g.hemoglobin,
                g.diagnosis,
                g.referral,
                g.bloodh          AS BloodH,
                g.bloodn          AS BloodN,
                g.urobilin        AS Urobilin,
                g.bilirubin       AS Bilirubin,
                g.protein         AS Protein,
                g.nitrite         AS Nitrite,
                g.ketones         AS Ketones,
                g.ascorbic        AS Ascorbic,
                g.glucoseurine    AS GlucoseUrine,
                g.ph              AS Ph,
                g.spgrav          AS SpGrav,
                g.leuk            AS Leuk,
                g.pregtest        AS PregTest,
                g.md,
                g.eye,
                g.gyn,
                g.ch,
                g.dnt,
                g.genupdatedon    AS GenUpdatedOn,
                g.location,
                g.oxygen
            FROM staging.visits_gen AS g
            WHERE EXISTS (
                SELECT 1
                FROM   public.patients AS p
                WHERE  p.tenant_id = @TenantId
                  AND  p.legacy_id IS NOT NULL
                  AND  trim(both from p.legacy_id) = trim(both from coalesce(g.patientid, ''))
            )
            ORDER BY g.genid
            """;

        var rows = await conn.QueryAsync<StagingVisit>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct));

        return rows.ToList();
    }

    // -------------------------------------------------------------------------
    // Load — transform → partition orphans → chunk insert
    // -------------------------------------------------------------------------

    private async Task LoadAsync(
        NpgsqlConnection connection,
        List<StagingVisit> stagingRows,
        IReadOnlyDictionary<string, Guid> patientCache,
        short tenantId,
        EtlProgress? progress,
        CancellationToken ct)
    {
        // --- Transform phase ---
        var mapped = new List<ProductionVisit>(stagingRows.Count);
        int orphaned = 0;

        progress?.BeginStep("Transforming visits ...", stagingRows.Count);

        foreach (var row in stagingRows)
        {
            var visit = VisitMapper.Map(row, patientCache, tenantId);
            if (visit is null)
            {
                _logger.LogWarning(
                    "Orphaned visit — staging genid '{GenId}' references unknown legacy patient '{PatientId}'.",
                    row.GenId ?? "<null>",
                    row.PatientId ?? "<null>");
                orphaned++;
            }
            else
            {
                mapped.Add(visit);
            }
            progress?.Advance();
        }

        _logger.LogInformation(
            "Transform complete — Mapped: {Mapped} | Orphaned: {Orphaned}", mapped.Count, orphaned);
        progress?.StepDone($"Mapped: {mapped.Count:N0}  |  Orphaned: {orphaned:N0}");

        // --- Load phase ---
        // Each chunk runs in its own transaction. A failed chunk rolls back only that chunk.
        // For 130k+ production runs, replace Dapper ExecuteAsync with NpgsqlBinaryImporter (COPY).
        int succeeded = 0;
        int failed = 0;

        progress?.BeginStep("Loading visits ...   ", mapped.Count);

        foreach (var chunk in mapped.Chunk(InsertChunkSize))
        {
            await using var tx = await connection.BeginTransactionAsync(ct);
            try
            {
                await InsertVisitsAsync(connection, tx, chunk, ct);
                await InsertVitalsCoreAsync(connection, tx, chunk, ct);
                await InsertLabResultsAsync(connection, tx, chunk, ct);
                await tx.CommitAsync(ct);
                succeeded += chunk.Length;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(ct);
                _logger.LogError(
                    ex,
                    "Chunk insert failed — {Count} visits rolled back. First legacy_id in chunk: '{FirstId}'.",
                    chunk.Length,
                    chunk[0].LegacyId ?? "<null>");
                failed += chunk.Length;
            }
            progress?.Advance(chunk.Length);
        }

        var summary = $"Succeeded: {succeeded:N0}  |  Failed: {failed:N0}  |  Orphaned: {orphaned:N0}  |  Extracted: {stagingRows.Count:N0}";
        _logger.LogInformation("Visit migration complete — {Summary}", summary);
        progress?.StepDone(summary);
    }

    // -------------------------------------------------------------------------
    // Insert helpers — Dapper executes one prepared statement per row, pipelined
    // within the shared transaction. Nested properties (Vitals, LabResults) on
    // ProductionVisit are ignored by Dapper since they have no matching @param.
    // -------------------------------------------------------------------------

    private static async Task InsertVisitsAsync(
        NpgsqlConnection conn,
        NpgsqlTransaction tx,
        IEnumerable<ProductionVisit> visits,
        CancellationToken ct)
    {
        const string sql = """
            INSERT INTO public.visits (
                id, tenant_id, legacy_id, trip_id, patient_id, visit_date,
                location_name, chief_complaint, diagnosis_text, referral_notes,
                device_id, client_updated_at, server_restored_at, is_deleted
            ) VALUES (
                @Id, @TenantId, @LegacyId, @TripId, @PatientId, @VisitDate,
                @LocationName, @ChiefComplaint, @DiagnosisText, @ReferralNotes,
                @DeviceId, @ClientUpdatedAt, @ServerRestoredAt, @IsDeleted
            )
            ON CONFLICT (id) DO NOTHING;
            """;

        await conn.ExecuteAsync(sql, visits, transaction: tx);
    }

    private static async Task InsertVitalsCoreAsync(
        NpgsqlConnection conn,
        NpgsqlTransaction tx,
        IEnumerable<ProductionVisit> visits,
        CancellationToken ct)
    {
        const string sql = """
            INSERT INTO public.vitals_core (
                id, tenant_id, visit_id,
                weight, height, pulse, bp, systolic, diastolic,
                resp, temp_f, oxygen_sat, glucose, hemoglobin,
                device_id, client_updated_at, server_restored_at, is_deleted
            ) VALUES (
                @Id, @TenantId, @VisitId,
                @Weight, @Height, @Pulse, @Bp, @Systolic, @Diastolic,
                @Resp, @TempF, @OxygenSat, @Glucose, @Hemoglobin,
                @DeviceId, @ClientUpdatedAt, @ServerRestoredAt, @IsDeleted
            )
            ON CONFLICT (id) DO NOTHING;
            """;

        var vitals = visits
            .Select(v => v.Vitals)
            .Where(v => v is not null)
            .Cast<VitalsCore>();

        await conn.ExecuteAsync(sql, vitals, transaction: tx);
    }

    private static async Task InsertLabResultsAsync(
        NpgsqlConnection conn,
        NpgsqlTransaction tx,
        IEnumerable<ProductionVisit> visits,
        CancellationToken ct)
    {
        const string sql = """
            INSERT INTO public.lab_results (
                id, tenant_id, visit_id, test_name, result_value,
                device_id, client_updated_at, server_restored_at, is_deleted
            ) VALUES (
                @Id, @TenantId, @VisitId, @TestName, @ResultValue,
                @DeviceId, @ClientUpdatedAt, @ServerRestoredAt, @IsDeleted
            )
            ON CONFLICT (id) DO NOTHING;
            """;

        var labRows = visits.SelectMany(v => v.LabResults);

        await conn.ExecuteAsync(sql, labRows, transaction: tx);
    }
}
