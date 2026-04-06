using System.Globalization;
using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Utilities;
using Dapper;
using Npgsql;

namespace ChristMedical.WebAPI.Services;

public sealed class PatientService(IConfiguration configuration) : IPatientService
{
    private string ConnectionString =>
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

    /// <inheritdoc />
    public async Task<IReadOnlyList<PatientResponse>> ListPatientsAsync(
        short tenantId,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var cap = Math.Clamp(limit, 1, 2000);

        const string sql = """
            SELECT
                id                  AS "Id",
                tenant_id           AS "TenantId",
                legacy_id           AS "LegacyId",
                display_id          AS "DisplayId",
                first_name          AS "FirstName",
                last_name           AS "LastName",
                dob                 AS "Dob",
                calculated_age      AS "CalculatedAge",
                gender              AS "Gender",
                marital_status      AS "MaritalStatus",
                gov_id              AS "GovId",
                next_of_kin_id      AS "NextOfKinId",
                medical_history     AS "MedicalHistory",
                surgical_history    AS "SurgicalHistory",
                family_history      AS "FamilyHistory",
                drug_allergies      AS "DrugAllergies",
                smoke               AS "Smoke",
                alcohol             AS "Alcohol",
                hope_gospel         AS "HopeGospel",
                heard_gospel_date   AS "HeardGospelDate",
                spiritual_notes     AS "SpiritualNotes",
                home_phone          AS "HomePhone",
                mobile_phone        AS "MobilePhone",
                device_id           AS "DeviceId",
                client_updated_at   AS "ClientUpdatedAt",
                server_restored_at  AS "ServerRestoredAt",
                is_deleted          AS "IsDeleted"
            FROM patients
            WHERE tenant_id = @tenantId
              AND NOT is_deleted
            ORDER BY legacy_id NULLS LAST, client_updated_at DESC
            LIMIT @take;
            """;

        await using var conn = new NpgsqlConnection(ConnectionString);
        var rows = await conn.QueryAsync<PatientRow>(
            new CommandDefinition(sql, new { tenantId, take = cap }, cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PatientResponse>> SearchPatientsAsync(
        short tenantId,
        string? query,
        string spiritualFilter,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var cap = Math.Clamp(limit, 1, 200);
        var tokens = PatientSearchTokenizer.Tokenize(query);
        var spiritualClause = SpiritualSqlClause(spiritualFilter);
        var (searchClause, dp) = BuildSearchClause(tokens);

        var sql = $"""
            SELECT
                id                  AS "Id",
                tenant_id           AS "TenantId",
                legacy_id           AS "LegacyId",
                display_id          AS "DisplayId",
                first_name          AS "FirstName",
                last_name           AS "LastName",
                dob                 AS "Dob",
                calculated_age      AS "CalculatedAge",
                gender              AS "Gender",
                marital_status      AS "MaritalStatus",
                gov_id              AS "GovId",
                next_of_kin_id      AS "NextOfKinId",
                medical_history     AS "MedicalHistory",
                surgical_history    AS "SurgicalHistory",
                family_history      AS "FamilyHistory",
                drug_allergies      AS "DrugAllergies",
                smoke               AS "Smoke",
                alcohol             AS "Alcohol",
                hope_gospel         AS "HopeGospel",
                heard_gospel_date   AS "HeardGospelDate",
                spiritual_notes     AS "SpiritualNotes",
                home_phone          AS "HomePhone",
                mobile_phone        AS "MobilePhone",
                device_id           AS "DeviceId",
                client_updated_at   AS "ClientUpdatedAt",
                server_restored_at  AS "ServerRestoredAt",
                is_deleted          AS "IsDeleted"
            FROM patients
            WHERE tenant_id = @tenantId
              AND NOT is_deleted
              {spiritualClause}
              AND ({searchClause})
            ORDER BY legacy_id NULLS LAST, client_updated_at DESC
            LIMIT @take;
            """;

        dp.Add("tenantId", tenantId);
        dp.Add("take", cap);

        await using var conn = new NpgsqlConnection(ConnectionString);
        var rows = await conn.QueryAsync<PatientRow>(
            new CommandDefinition(sql, dp, cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    private static string SpiritualSqlClause(string spiritualFilter)
    {
        return spiritualFilter.ToLowerInvariant() switch
        {
            "heard" => " AND heard_gospel_date IS NOT NULL ",
            "hope" => " AND hope_gospel AND heard_gospel_date IS NULL ",
            "none" => " AND NOT hope_gospel AND heard_gospel_date IS NULL ",
            _ => "",
        };
    }

    private static (string Clause, DynamicParameters Params) BuildSearchClause(IReadOnlyList<string> tokens)
    {
        var dp = new DynamicParameters();
        if (tokens.Count == 0)
            return ("TRUE", dp);

        if (tokens.Count == 1)
        {
            dp.Add("t0", tokens[0]);
            return ("""
                (
                       first_name ILIKE '%' || @t0 || '%'
                    OR last_name ILIKE '%' || @t0 || '%'
                    OR legacy_id ILIKE '%' || @t0 || '%'
                    OR first_name_phonetic = dmetaphone(lower(trim(@t0)))
                    OR last_name_phonetic = dmetaphone(lower(trim(@t0)))
                )
                """, dp);
        }

        dp.Add("t0", tokens[0]);
        dp.Add("t1", tokens[1]);
        return ("""
            (
                   (
                       first_name ILIKE '%' || @t0 || '%'
                   AND last_name ILIKE '%' || @t1 || '%'
                   )
                OR (
                       last_name ILIKE '%' || @t0 || '%'
                   AND first_name ILIKE '%' || @t1 || '%'
                   )
                OR (
                       first_name_phonetic = dmetaphone(lower(trim(@t0)))
                   AND last_name_phonetic = dmetaphone(lower(trim(@t1)))
                   )
                OR (
                       first_name_phonetic = dmetaphone(lower(trim(@t1)))
                   AND last_name_phonetic = dmetaphone(lower(trim(@t0)))
                   )
                OR legacy_id ILIKE '%' || @t0 || '%' || @t1 || '%'
            )
            """, dp);
    }

    /// <inheritdoc />
    public async Task<PatientNotesUpdateOutcome> UpdatePatientNotesAsync(
        Guid id,
        short tenantId,
        UpdatePatientNotesRequest request,
        CancellationToken cancellationToken = default)
    {
        DateTime? heard = null;
        if (!string.IsNullOrWhiteSpace(request.HeardGospelDate))
        {
            if (!DateOnly.TryParse(
                    request.HeardGospelDate.Trim(),
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var d))
                return new PatientNotesUpdateOutcome(PatientNotesUpdateStatus.InvalidHeardGospelDate);

            heard = DateTime.SpecifyKind(d.ToDateTime(TimeOnly.MinValue), DateTimeKind.Unspecified);
        }

        const string sql = """
            UPDATE patients
            SET
                spiritual_notes     = @SpiritualNotes,
                medical_history     = @MedicalHistory,
                surgical_history    = @SurgicalHistory,
                family_history      = @FamilyHistory,
                drug_allergies      = @DrugAllergies,
                hope_gospel         = @HopeGospel,
                heard_gospel_date   = @HeardGospelDate,
                client_updated_at   = CURRENT_TIMESTAMP
            WHERE id = @Id
              AND tenant_id = @TenantId
              AND NOT is_deleted;
            """;

        await using var conn = new NpgsqlConnection(ConnectionString);
        var affected = await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = id,
                    TenantId = tenantId,
                    request.SpiritualNotes,
                    request.MedicalHistory,
                    request.SurgicalHistory,
                    request.FamilyHistory,
                    request.DrugAllergies,
                    request.HopeGospel,
                    HeardGospelDate = heard,
                },
                cancellationToken: cancellationToken));

        if (affected == 0)
            return new PatientNotesUpdateOutcome(PatientNotesUpdateStatus.NotFound);

        var row = await FetchPatientRowAsync(conn, id, tenantId, cancellationToken);
        if (row is null)
            return new PatientNotesUpdateOutcome(PatientNotesUpdateStatus.NotFound);

        return new PatientNotesUpdateOutcome(PatientNotesUpdateStatus.Updated, Map(row));
    }

    private static async Task<PatientRow?> FetchPatientRowAsync(
        NpgsqlConnection conn,
        Guid id,
        short tenantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                id                  AS "Id",
                tenant_id           AS "TenantId",
                legacy_id           AS "LegacyId",
                first_name          AS "FirstName",
                last_name           AS "LastName",
                dob                 AS "Dob",
                hope_gospel         AS "HopeGospel",
                heard_gospel_date   AS "HeardGospelDate",
                spiritual_notes     AS "SpiritualNotes",
                medical_history     AS "MedicalHistory",
                surgical_history    AS "SurgicalHistory",
                family_history      AS "FamilyHistory",
                drug_allergies      AS "DrugAllergies"
            FROM patients
            WHERE id = @id
              AND tenant_id = @tenantId
              AND NOT is_deleted;
            """;

        return await conn.QuerySingleOrDefaultAsync<PatientRow>(
            new CommandDefinition(sql, new { id, tenantId }, cancellationToken: cancellationToken));
    }

    private static PatientResponse Map(PatientRow r)
    {
        var (statusLabel, statusKind) = ResolveSpiritualStatus(r.HopeGospel, r.HeardGospelDate);
        return new PatientResponse
        {
            Id = r.Id,
            LegacyId = r.LegacyId,
            DisplayNameMasked = MaskName(r.FirstName, r.LastName),
            DateOfBirth = r.Dob?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            HopeGospel = r.HopeGospel,
            HeardGospelDate = r.HeardGospelDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            SpiritualStatusLabel = statusLabel,
            SpiritualStatusKind = statusKind,
            SpiritualNotes = r.SpiritualNotes,
            MedicalHistory = r.MedicalHistory,
            SurgicalHistory = r.SurgicalHistory,
            FamilyHistory = r.FamilyHistory,
            DrugAllergies = r.DrugAllergies,
        };
    }

    private static (string Label, string Kind) ResolveSpiritualStatus(bool hopeGospel, DateTime? heardGospelDate)
    {
        if (heardGospelDate.HasValue)
            return ($"Heard Gospel · {heardGospelDate.Value:yyyy-MM-dd}", "heard");

        if (hopeGospel)
            return ("Hope / Gospel noted", "hope");

        return ("No spiritual record", "none");
    }

    private static string MaskName(string? firstName, string? lastName)
    {
        static string MaskPart(string? part)
        {
            if (string.IsNullOrWhiteSpace(part)) return "—";
            var s = part.Trim();
            var initial = char.ToUpperInvariant(s[0]);
            return s.Length == 1 ? $"{initial}***" : $"{initial}***";
        }

        return $"{MaskPart(firstName)} {MaskPart(lastName)}".Trim();
    }

#pragma warning disable CA1812 // Row type is constructed by Dapper
    private sealed class PatientRow
    {
        public Guid Id { get; set; }
        public short TenantId { get; set; }
        public string? LegacyId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public DateTime? Dob { get; set; }
        public bool HopeGospel { get; set; }
        public DateTime? HeardGospelDate { get; set; }
        public string? SpiritualNotes { get; set; }
        public string? MedicalHistory { get; set; }
        public string? SurgicalHistory { get; set; }
        public string? FamilyHistory { get; set; }
        public string? DrugAllergies { get; set; }
    }
#pragma warning restore CA1812
}
