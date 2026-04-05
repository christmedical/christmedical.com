using System.Globalization;
using ChristMedical.WebAPI.Models;
using Dapper;
using Npgsql;

namespace ChristMedical.WebAPI.Services;

public class PatientService(IConfiguration configuration)
{
    /// <summary>Belize mission tenant (staging / prod align on SMALLINT 1).</summary>
    private const short BelizeTenantId = 1;

    private string ConnectionString =>
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

    /// <summary>
    /// Loads the first 50 patients for the Belize tenant using the requested <c>SELECT *</c>
    /// shape; columns are projected in-line so Dapper maps reliably from PostgreSQL.
    /// </summary>
    public async Task<IReadOnlyList<PatientResponse>> ListBelizePatientsAsync(CancellationToken cancellationToken = default)
    {
        // Full patient row (same fields as SELECT *, aliased for Dapper ↔ PascalCase).
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
            LIMIT 50;
            """;

        await using var conn = new NpgsqlConnection(ConnectionString);
        var rows = await conn.QueryAsync<PatientRow>(
            new CommandDefinition(sql, new { tenantId = BelizeTenantId }, cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
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
