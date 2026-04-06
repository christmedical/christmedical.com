using ChristMedical.WebAPI.Models;
using Dapper;
using Npgsql;

namespace ChristMedical.WebAPI.Services;

public sealed class DashboardService(IConfiguration configuration) : IDashboardService
{
    private string ConnectionString =>
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

    /// <inheritdoc />
    public async Task<DashboardSummaryResponse> GetSummaryAsync(
        short tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sqlPatients = """
            SELECT
                COUNT(*) FILTER (WHERE NOT is_deleted)::int AS "Total",
                COUNT(*) FILTER (
                    WHERE NOT is_deleted AND heard_gospel_date IS NOT NULL
                )::int AS "Heard",
                COUNT(*) FILTER (
                    WHERE NOT is_deleted
                      AND hope_gospel
                      AND heard_gospel_date IS NULL
                )::int AS "Hope",
                COUNT(*) FILTER (
                    WHERE NOT is_deleted
                      AND NOT hope_gospel
                      AND heard_gospel_date IS NULL
                )::int AS "None",
                COUNT(*) FILTER (
                    WHERE NOT is_deleted
                      AND drug_allergies IS NOT NULL
                      AND trim(drug_allergies) <> ''
                )::int AS "Allergies",
                COUNT(*) FILTER (
                    WHERE NOT is_deleted
                      AND medical_history IS NOT NULL
                      AND trim(medical_history) <> ''
                )::int AS "MedHx",
                COUNT(*) FILTER (
                    WHERE NOT is_deleted
                      AND surgical_history IS NOT NULL
                      AND trim(surgical_history) <> ''
                )::int AS "SurgHx"
            FROM patients
            WHERE tenant_id = @tenantId;
            """;

        const string sqlVisits = """
            SELECT COUNT(*)::int
            FROM visits
            WHERE tenant_id = @tenantId
              AND NOT is_deleted;
            """;

        await using var conn = new NpgsqlConnection(ConnectionString);
        var row = await conn.QuerySingleAsync<PatientAggRow>(
            new CommandDefinition(sqlPatients, new { tenantId }, cancellationToken: cancellationToken));

        int visits;
        try
        {
            visits = await conn.ExecuteScalarAsync<int>(
                new CommandDefinition(sqlVisits, new { tenantId }, cancellationToken: cancellationToken));
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedTable)
        {
            visits = 0;
        }

        return new DashboardSummaryResponse
        {
            TenantId = tenantId,
            Spiritual = new SpiritualImpactSummary
            {
                TotalPatients = row.Total,
                HeardGospel = row.Heard,
                HopeWithoutHeard = row.Hope,
                NoSpiritualRecord = row.None,
            },
            Medical = new MedicalImpactSummary
            {
                PatientsWithAllergiesDocumented = row.Allergies,
                PatientsWithMedicalHistory = row.MedHx,
                PatientsWithSurgicalHistory = row.SurgHx,
                TotalVisits = visits,
            },
        };
    }

#pragma warning disable CA1812
    private sealed class PatientAggRow
    {
        public int Total { get; set; }
        public int Heard { get; set; }
        public int Hope { get; set; }
        public int None { get; set; }
        public int Allergies { get; set; }
        public int MedHx { get; set; }
        public int SurgHx { get; set; }
    }
#pragma warning restore CA1812
}
