using Dapper;
using EtlTool;
using EtlTool.Logging;
using EtlTool.Mapping;
using EtlTool.Models.Staging;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EtlTool.Services;

public class PatientMigrationService
{
    private readonly string _connectionString;
    private readonly ILogger<PatientMigrationService> _logger;

    public PatientMigrationService(string connectionString, ILogger<PatientMigrationService> logger)
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

        await EnsureSchemaExtensionsAsync(connection, cancellationToken);

        var stagingRows = await ExtractAsync(connection, cancellationToken);
        _logger.LogInformation("Extracted {Count} patients from staging.patients.", stagingRows.Count);

        await LoadAsync(connection, stagingRows, tenantId, progress, cancellationToken);
    }

    // -------------------------------------------------------------------------
    // Setup — add columns that are not in V1__Initial_Schema.sql
    // -------------------------------------------------------------------------

    private static async Task EnsureSchemaExtensionsAsync(
        NpgsqlConnection connection, CancellationToken ct)
    {
        const string ddl = """
            ALTER TABLE public.patients
                ADD COLUMN IF NOT EXISTS tenant_id         SMALLINT NOT NULL DEFAULT 1,
                ADD COLUMN IF NOT EXISTS legacy_id         VARCHAR(50),
                ADD COLUMN IF NOT EXISTS home_phone        VARCHAR(30),
                ADD COLUMN IF NOT EXISTS mobile_phone      VARCHAR(30),
                ADD COLUMN IF NOT EXISTS heard_gospel_date DATE,
                ADD COLUMN IF NOT EXISTS spiritual_notes   TEXT;
            """;

        await connection.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: ct));
    }

    // -------------------------------------------------------------------------
    // Extract — SELECT with aliases to bridge spaced column names → C# properties
    // -------------------------------------------------------------------------

    private static async Task<List<StagingPatient>> ExtractAsync(
        NpgsqlConnection connection, CancellationToken ct)
    {
        // BatchLimit is embedded at build-time; not const because $"" interpolation isn't const.
        string sql = $"""
            SELECT
                id,
                "last name"       AS LastName,
                "first name"      AS FirstName,
                "home phone"      AS HomePhone,
                "mobile phone"    AS MobilePhone,
                personalnotes     AS PersonalNotes,
                church,
                hope,
                dob,
                ssno              AS SsNo,
                allergies,
                medhist           AS MedHist,
                surgeries,
                maritalstatus     AS MaritalStatus,
                smoke,
                alcohol,
                famhist           AS FamHist,
                gender,
                gyng              AS GynG,
                gynp              AS GynP,
                age,
                "spanish only"    AS SpanishOnly,
                ptupdatedon       AS PtUpdatedOn,
                wherelive         AS WhereLive,
                infonotes         AS InfoNotes,
                heardgospel       AS HeardGospel,
                suffix,
                lastreaders       AS LastReaders,
                patienttype       AS PatientType,
                pttype            AS PtType
            FROM staging.patients
            LIMIT {MigrationBatchLimits.Patients}
            """;

        var result = await connection.QueryAsync<StagingPatient>(
            new CommandDefinition(sql, cancellationToken: ct));

        return result.ToList();
    }

    // -------------------------------------------------------------------------
    // Load — transform + insert inside a transaction, using SAVEPOINTs so a
    // single bad row cannot abort the entire batch (PostgreSQL requirement).
    // -------------------------------------------------------------------------

    private async Task LoadAsync(
        NpgsqlConnection connection,
        List<StagingPatient> stagingRows,
        short tenantId,
        EtlProgress? progress,
        CancellationToken ct)
    {
        const string insertSql = """
            INSERT INTO public.patients (
                id,
                tenant_id,
                legacy_id,
                first_name,
                last_name,
                dob,
                calculated_age,
                gender,
                marital_status,
                gov_id,
                next_of_kin_id,
                medical_history,
                surgical_history,
                family_history,
                drug_allergies,
                smoke,
                alcohol,
                hope_gospel,
                heard_gospel_date,
                spiritual_notes,
                home_phone,
                mobile_phone,
                device_id,
                client_updated_at,
                server_restored_at,
                is_deleted
            ) VALUES (
                @Id,
                @TenantId,
                @LegacyId,
                @FirstName,
                @LastName,
                @Dob,
                @CalculatedAge,
                @Gender,
                @MaritalStatus,
                @GovId,
                @NextOfKinId,
                @MedicalHistory,
                @SurgicalHistory,
                @FamilyHistory,
                @DrugAllergies,
                @Smoke,
                @Alcohol,
                @HopeGospel,
                @HeardGospelDate,
                @SpiritualNotes,
                @HomePhone,
                @MobilePhone,
                @DeviceId,
                @ClientUpdatedAt,
                @ServerRestoredAt,
                @IsDeleted
            )
            ON CONFLICT (id) DO NOTHING;
            """;

        await using var transaction = await connection.BeginTransactionAsync(ct);

        int succeeded = 0;
        int failed = 0;

        progress?.BeginStep("Inserting patients ...", stagingRows.Count);

        foreach (var stagingRow in stagingRows)
        {
            var savepoint = $"sp_{Guid.NewGuid():N}";
            await connection.ExecuteAsync(
                new CommandDefinition($"SAVEPOINT {savepoint}", transaction: transaction, cancellationToken: ct));

            try
            {
                var production = PatientMapper.Map(stagingRow, tenantId);

                await connection.ExecuteAsync(
                    new CommandDefinition(insertSql, production, transaction: transaction, cancellationToken: ct));

                succeeded++;
            }
            catch (Exception ex)
            {
                // Roll back only this row; the rest of the batch is preserved.
                await connection.ExecuteAsync(
                    new CommandDefinition($"ROLLBACK TO SAVEPOINT {savepoint}", transaction: transaction, cancellationToken: ct));

                _logger.LogError(
                    ex,
                    "Failed to migrate patient with legacy_id '{LegacyId}'. Skipping row.",
                    stagingRow.Id ?? "<null>");

                failed++;
            }

            progress?.Advance();
        }

        await transaction.CommitAsync(ct);

        var summary = $"Succeeded: {succeeded:N0}  |  Failed: {failed:N0}  |  Total: {stagingRows.Count:N0}";
        _logger.LogInformation("Patient migration complete — {Summary}", summary);
        progress?.StepDone(summary);
    }
}
