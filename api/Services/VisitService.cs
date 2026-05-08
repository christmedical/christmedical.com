using ChristMedical.WebAPI.Models;
using Dapper;
using Npgsql;

namespace ChristMedical.WebAPI.Services;

public sealed class VisitService(IConfiguration configuration) : IVisitService
{
    private string ConnectionString =>
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

    /// <inheritdoc />
    public async Task<IReadOnlyList<VisitResponse>> ListVisitsForPatientAsync(
        Guid patientId,
        short tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT
                v.id                  AS "VisitId",
                v.patient_id          AS "PatientId",
                v.visit_date          AS "VisitDate",
                v.location_name       AS "LocationName",
                v.chief_complaint     AS "ChiefComplaint",
                v.diagnosis_text      AS "DiagnosisText",
                v.referral_notes      AS "ReferralNotes",
                v.trip_id             AS "TripId",
                vc.weight             AS "VitalsWeight",
                vc.height             AS "VitalsHeight",
                vc.pulse              AS "VitalsPulse",
                vc.bp                 AS "VitalsBp",
                vc.resp               AS "VitalsResp",
                vc.temp_f             AS "VitalsTempF",
                vc.oxygen_sat         AS "VitalsOxygenSat",
                vc.glucose            AS "VitalsGlucose",
                vc.hemoglobin         AS "VitalsHemoglobin"
            FROM visits v
            LEFT JOIN LATERAL (
                SELECT
                    weight,
                    height,
                    pulse,
                    bp,
                    resp,
                    temp_f,
                    oxygen_sat,
                    glucose,
                    hemoglobin
                FROM vitals_core z
                WHERE z.visit_id = v.id
                  AND NOT z.is_deleted
                ORDER BY z.client_updated_at DESC
                LIMIT 1
            ) vc ON TRUE
            WHERE v.patient_id = @patientId
              AND v.tenant_id = @tenantId
              AND NOT v.is_deleted
            ORDER BY v.visit_date DESC
            LIMIT 100;
            """;

        await using var conn = new NpgsqlConnection(ConnectionString);
        var rows = await conn.QueryAsync<VisitListRow>(
            new CommandDefinition(sql, new { patientId, tenantId }, cancellationToken: cancellationToken));

        return rows.Select(MapRow).ToList();
    }

    /// <inheritdoc />
    public async Task<VisitResponse?> CreateVisitAsync(
        Guid patientId,
        short tenantId,
        CreateVisitRequest request,
        CancellationToken cancellationToken = default)
    {
        var visitDate = request.VisitDate?.ToUniversalTime() ?? DateTimeOffset.UtcNow;
        var locationName = NullIfWs(request.LocationName);
        var chiefComplaint = NullIfWs(request.ChiefComplaint);
        var diagnosisText = NullIfWs(request.DiagnosisText);
        var referralNotes = NullIfWs(request.ReferralNotes);

        await using var conn = new NpgsqlConnection(ConnectionString);
        await conn.OpenAsync(cancellationToken);

        const string existsSql = """
            SELECT COUNT(*)::bigint
            FROM patients
            WHERE id = @patientId
              AND tenant_id = @tenantId
              AND NOT is_deleted;
            """;

        var count = await conn.QuerySingleAsync<long>(
            new CommandDefinition(existsSql, new { patientId, tenantId }, cancellationToken: cancellationToken));
        if (count == 0)
            return null;

        await using var tx = await conn.BeginTransactionAsync(cancellationToken);

        const string insertVisit = """
            INSERT INTO visits (
                tenant_id,
                patient_id,
                trip_id,
                visit_date,
                location_name,
                chief_complaint,
                diagnosis_text,
                referral_notes
            )
            VALUES (
                @tenantId,
                @patientId,
                @tripId,
                @visitDate,
                @locationName,
                @chiefComplaint,
                @diagnosisText,
                @referralNotes
            )
            RETURNING
                id                  AS "VisitId",
                patient_id          AS "PatientId",
                visit_date          AS "VisitDate",
                location_name       AS "LocationName",
                chief_complaint     AS "ChiefComplaint",
                diagnosis_text      AS "DiagnosisText",
                referral_notes      AS "ReferralNotes",
                trip_id             AS "TripId";
            """;

        var inserted = await conn.QuerySingleAsync<VisitInsertRow>(
            new CommandDefinition(
                insertVisit,
                new
                {
                    tenantId,
                    patientId,
                    tripId = request.TripId,
                    visitDate = visitDate.UtcDateTime,
                    locationName,
                    chiefComplaint,
                    diagnosisText,
                    referralNotes,
                },
                transaction: tx,
                cancellationToken: cancellationToken));

        VitalsResponse? vitalsResponse = null;
        if (request.Vitals is { } v && HasAnyVital(v))
        {
            const string insertVitals = """
                INSERT INTO vitals_core (
                    tenant_id,
                    visit_id,
                    weight,
                    height,
                    pulse,
                    bp,
                    resp,
                    temp_f,
                    oxygen_sat,
                    glucose,
                    hemoglobin
                )
                VALUES (
                    @tenantId,
                    @visitId,
                    @weight,
                    @height,
                    @pulse,
                    @bp,
                    @resp,
                    @tempF,
                    @oxygenSat,
                    @glucose,
                    @hemoglobin
                );
                """;

            var bp = NullIfWs(v.Bp);
            await conn.ExecuteAsync(
                new CommandDefinition(
                    insertVitals,
                    new
                    {
                        tenantId,
                        visitId = inserted.VisitId,
                        weight = v.Weight,
                        height = v.Height,
                        pulse = v.Pulse,
                        bp,
                        resp = v.Resp,
                        tempF = v.TempF,
                        oxygenSat = v.OxygenSat,
                        glucose = v.Glucose,
                        hemoglobin = v.Hemoglobin,
                    },
                    transaction: tx,
                    cancellationToken: cancellationToken));

            vitalsResponse = new VitalsResponse
            {
                Weight = v.Weight,
                Height = v.Height,
                Pulse = v.Pulse,
                Bp = bp,
                Resp = v.Resp,
                TempF = v.TempF,
                OxygenSat = v.OxygenSat,
                Glucose = v.Glucose,
                Hemoglobin = v.Hemoglobin,
            };
        }

        await tx.CommitAsync(cancellationToken);

        return MapInserted(inserted, vitalsResponse);
    }

    private static VisitResponse MapRow(VisitListRow r)
    {
        VitalsResponse? vitals = null;
        if (r.VitalsWeight.HasValue
            || r.VitalsHeight.HasValue
            || r.VitalsPulse.HasValue
            || !string.IsNullOrWhiteSpace(r.VitalsBp)
            || r.VitalsResp.HasValue
            || r.VitalsTempF.HasValue
            || r.VitalsOxygenSat.HasValue
            || r.VitalsGlucose.HasValue
            || r.VitalsHemoglobin.HasValue)
        {
            vitals = new VitalsResponse
            {
                Weight = r.VitalsWeight,
                Height = r.VitalsHeight,
                Pulse = r.VitalsPulse,
                Bp = r.VitalsBp,
                Resp = r.VitalsResp,
                TempF = r.VitalsTempF,
                OxygenSat = r.VitalsOxygenSat,
                Glucose = r.VitalsGlucose,
                Hemoglobin = r.VitalsHemoglobin,
            };
        }

        return new VisitResponse
        {
            Id = r.VisitId,
            PatientId = r.PatientId,
            VisitDate = ToOffset(r.VisitDate),
            LocationName = r.LocationName,
            ChiefComplaint = r.ChiefComplaint,
            DiagnosisText = r.DiagnosisText,
            ReferralNotes = r.ReferralNotes,
            TripId = r.TripId,
            Vitals = vitals,
        };
    }

    private static VisitResponse MapInserted(VisitInsertRow r, VitalsResponse? vitals) =>
        new()
        {
            Id = r.VisitId,
            PatientId = r.PatientId,
            VisitDate = ToOffset(r.VisitDate),
            LocationName = r.LocationName,
            ChiefComplaint = r.ChiefComplaint,
            DiagnosisText = r.DiagnosisText,
            ReferralNotes = r.ReferralNotes,
            TripId = r.TripId,
            Vitals = vitals,
        };

    private static DateTimeOffset ToOffset(DateTime dt)
    {
        if (dt.Kind == DateTimeKind.Unspecified)
            return new DateTimeOffset(DateTime.SpecifyKind(dt, DateTimeKind.Utc));
        return new DateTimeOffset(dt);
    }

    private static string? NullIfWs(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static bool HasAnyVital(CreateVitalsRequest v) =>
        v.Weight.HasValue
        || v.Height.HasValue
        || v.Pulse.HasValue
        || !string.IsNullOrWhiteSpace(v.Bp)
        || v.Resp.HasValue
        || v.TempF.HasValue
        || v.OxygenSat.HasValue
        || v.Glucose.HasValue
        || v.Hemoglobin.HasValue;

#pragma warning disable CA1812
    private sealed class VisitListRow
    {
        public Guid VisitId { get; set; }
        public Guid PatientId { get; set; }
        public DateTime VisitDate { get; set; }
        public string? LocationName { get; set; }
        public string? ChiefComplaint { get; set; }
        public string? DiagnosisText { get; set; }
        public string? ReferralNotes { get; set; }
        public Guid? TripId { get; set; }
        public decimal? VitalsWeight { get; set; }
        public decimal? VitalsHeight { get; set; }
        public int? VitalsPulse { get; set; }
        public string? VitalsBp { get; set; }
        public int? VitalsResp { get; set; }
        public decimal? VitalsTempF { get; set; }
        public int? VitalsOxygenSat { get; set; }
        public decimal? VitalsGlucose { get; set; }
        public decimal? VitalsHemoglobin { get; set; }
    }

    private sealed class VisitInsertRow
    {
        public Guid VisitId { get; set; }
        public Guid PatientId { get; set; }
        public DateTime VisitDate { get; set; }
        public string? LocationName { get; set; }
        public string? ChiefComplaint { get; set; }
        public string? DiagnosisText { get; set; }
        public string? ReferralNotes { get; set; }
        public Guid? TripId { get; set; }
    }
#pragma warning restore CA1812
}
