using Dapper;
using EtlTool.Mapping;
using EtlTool.Models.Production;
using EtlTool.Models.Staging;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EtlTool.Services;

public class VisitMigrationService
{
    private const int TestBatchLimit  = 5_000;
    private const int InsertChunkSize = 1_000;

    private readonly string _connectionString;
    private readonly ILogger<VisitMigrationService> _logger;

    public VisitMigrationService(string connectionString, ILogger<VisitMigrationService> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task RunAsync(CancellationToken ct = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(ct);

        await EnsureSchemaExtensionsAsync(connection, ct);

        var patientCache = await BuildPatientCacheAsync(connection, ct);
        _logger.LogInformation("Patient cache loaded — {Count} entries.", patientCache.Count);

        var stagingRows = await ExtractAsync(connection, ct);
        _logger.LogInformation("Extracted {Count} visits from staging.visits_gen.", stagingRows.Count);

        await LoadAsync(connection, stagingRows, patientCache, ct);
    }

    // -------------------------------------------------------------------------
    // Setup — add legacy_id to visits; systolic/diastolic to vitals_core
    // -------------------------------------------------------------------------

    private static async Task EnsureSchemaExtensionsAsync(NpgsqlConnection conn, CancellationToken ct)
    {
        const string ddl = """
            ALTER TABLE public.visits
                ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(50);

            ALTER TABLE public.vitals_core
                ADD COLUMN IF NOT EXISTS systolic  SMALLINT,
                ADD COLUMN IF NOT EXISTS diastolic SMALLINT;
            """;

        await conn.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: ct));
    }

    // -------------------------------------------------------------------------
    // Patient cache — Dictionary<legacyId, productionUuid>
    // Loaded once into memory so zero DB hits during the transform loop.
    // -------------------------------------------------------------------------

    private static async Task<Dictionary<string, Guid>> BuildPatientCacheAsync(
        NpgsqlConnection conn, CancellationToken ct)
    {
        const string sql = """
            SELECT legacy_id AS LegacyId, id AS Id
            FROM   public.patients
            WHERE  legacy_id IS NOT NULL
            """;

        var rows = await conn.QueryAsync<(string LegacyId, Guid Id)>(
            new CommandDefinition(sql, cancellationToken: ct));

        return rows.ToDictionary(
            r => r.LegacyId,
            r => r.Id,
            StringComparer.OrdinalIgnoreCase);
    }

    // -------------------------------------------------------------------------
    // Extract — aliases map lowercase DB column names → PascalCase C# properties
    // -------------------------------------------------------------------------

    private static async Task<List<StagingVisit>> ExtractAsync(
        NpgsqlConnection conn, CancellationToken ct)
    {
        string sql = $"""
            SELECT
                genid           AS GenId,
                patientid       AS PatientId,
                datevisit       AS DateVisit,
                height,
                weight,
                pulse,
                bp,
                resp,
                temp,
                glucoseblood    AS GlucoseBlood,
                hemoglobin,
                diagnosis,
                referral,
                bloodh          AS BloodH,
                bloodn          AS BloodN,
                urobilin        AS Urobilin,
                bilirubin       AS Bilirubin,
                protein         AS Protein,
                nitrite         AS Nitrite,
                ketones         AS Ketones,
                ascorbic        AS Ascorbic,
                glucoseurine    AS GlucoseUrine,
                ph              AS Ph,
                spgrav          AS SpGrav,
                leuk            AS Leuk,
                pregtest        AS PregTest,
                md,
                eye,
                gyn,
                ch,
                dnt,
                genupdatedon    AS GenUpdatedOn,
                location,
                oxygen
            FROM staging.visits_gen
            LIMIT {TestBatchLimit}
            """;

        var rows = await conn.QueryAsync<StagingVisit>(
            new CommandDefinition(sql, cancellationToken: ct));

        return rows.ToList();
    }

    // -------------------------------------------------------------------------
    // Load — transform → partition orphans → chunk insert
    // -------------------------------------------------------------------------

    private async Task LoadAsync(
        NpgsqlConnection connection,
        List<StagingVisit> stagingRows,
        IReadOnlyDictionary<string, Guid> patientCache,
        CancellationToken ct)
    {
        // Transform all rows up-front; collect orphans without hitting the DB.
        var mapped   = new List<ProductionVisit>(stagingRows.Count);
        int orphaned = 0;

        foreach (var row in stagingRows)
        {
            var visit = VisitMapper.Map(row, patientCache);
            if (visit is null)
            {
                _logger.LogWarning(
                    "Orphaned visit — staging genid '{GenId}' references unknown legacy patient '{PatientId}'.",
                    row.GenId   ?? "<null>",
                    row.PatientId ?? "<null>");
                orphaned++;
                continue;
            }
            mapped.Add(visit);
        }

        _logger.LogInformation(
            "Transform complete — Mapped: {Mapped} | Orphaned: {Orphaned}",
            mapped.Count, orphaned);

        // Chunk the mapped visits and insert each chunk inside its own transaction.
        // If a chunk fails the whole chunk rolls back; other chunks are unaffected.
        // For 130k+ production runs, replace Dapper ExecuteAsync with NpgsqlBinaryImporter (COPY).
        int succeeded = 0;
        int failed    = 0;

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
        }

        _logger.LogInformation(
            "Visit migration complete — Succeeded: {Succeeded} | Failed: {Failed} | Orphaned: {Orphaned} | Total extracted: {Total}",
            succeeded, failed, orphaned, stagingRows.Count);
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
                id, legacy_id, trip_id, patient_id, visit_date,
                location_name, chief_complaint, diagnosis_text, referral_notes,
                device_id, client_updated_at, server_restored_at, is_deleted
            ) VALUES (
                @Id, @LegacyId, @TripId, @PatientId, @VisitDate,
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
                id, visit_id,
                weight, height, pulse, bp, systolic, diastolic,
                resp, temp_f, oxygen_sat, glucose, hemoglobin,
                device_id, client_updated_at, server_restored_at, is_deleted
            ) VALUES (
                @Id, @VisitId,
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
                id, visit_id, test_name, result_value,
                device_id, client_updated_at, server_restored_at, is_deleted
            ) VALUES (
                @Id, @VisitId, @TestName, @ResultValue,
                @DeviceId, @ClientUpdatedAt, @ServerRestoredAt, @IsDeleted
            )
            ON CONFLICT (id) DO NOTHING;
            """;

        var labRows = visits.SelectMany(v => v.LabResults);

        await conn.ExecuteAsync(sql, labRows, transaction: tx);
    }
}
