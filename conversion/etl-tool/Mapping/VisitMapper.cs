using System.Globalization;
using EtlTool.Models.Production;
using EtlTool.Models.Staging;

namespace EtlTool.Mapping;

public static class VisitMapper
{
    private const string AccessNullDate = "01/00/00 00:00:00";

    /// <summary>
    /// Maps one staging visit to a composite ProductionVisit.
    /// Returns <c>null</c> when the staging patientid cannot be resolved in the
    /// patient cache — the caller is responsible for logging the orphan.
    /// </summary>
    public static ProductionVisit? Map(
        StagingVisit src,
        IReadOnlyDictionary<string, Guid> patientCache,
        short tenantId)
    {
        if (!patientCache.TryGetValue(src.PatientId ?? string.Empty, out Guid patientId))
            return null;

        var visitId = Guid.NewGuid();
        var clientTs = ParseDate(src.GenUpdatedOn) ?? DateTime.UtcNow;

        var (systolic, diastolic) = SplitBp(src.Bp);

        return new ProductionVisit
        {
            Id = visitId,
            TenantId = tenantId,
            LegacyId = src.GenId,
            TripId = null,
            PatientId = patientId,
            VisitDate = ParseDate(src.DateVisit),
            LocationName = CleanString(src.Location),
            ChiefComplaint = null,
            DiagnosisText = CleanString(src.Diagnosis),
            ReferralNotes = CleanString(src.Referral),
            DeviceId = "MIGRATION_ETL",
            ClientUpdatedAt = clientTs,
            ServerRestoredAt = null,
            IsDeleted = false,

            Vitals = new VitalsCore
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                VisitId = visitId,
                Weight = ParseDecimal(src.Weight),
                Height = ParseDecimal(src.Height),
                Pulse = ParseInt(src.Pulse),
                Bp = CleanString(src.Bp),
                Systolic = systolic,
                Diastolic = diastolic,
                Resp = ParseInt(src.Resp),
                TempF = ParseDecimal(src.Temp),
                OxygenSat = ParseInt(src.Oxygen),
                Glucose = ParseDecimal(src.GlucoseBlood),
                Hemoglobin = ParseDecimal(src.Hemoglobin),
                DeviceId = "MIGRATION_ETL",
                ClientUpdatedAt = clientTs,
                ServerRestoredAt = null,
                IsDeleted = false,
            },

            LabResults = BuildLabResults(visitId, clientTs, src, tenantId),
        };
    }

    // -------------------------------------------------------------------------
    // BP split
    // -------------------------------------------------------------------------

    /// <summary>
    /// Splits a "120/80" string into (systolic, diastolic).
    /// Returns (null, null) for any value that doesn't parse cleanly.
    /// </summary>
    private static (int? systolic, int? diastolic) SplitBp(string? bp)
    {
        if (string.IsNullOrWhiteSpace(bp)) return (null, null);

        var parts = bp.Trim().Split('/');
        if (parts.Length != 2) return (null, null);

        int? sys = int.TryParse(parts[0].Trim(), out int s) ? s : null;
        int? dia = int.TryParse(parts[1].Trim(), out int d) ? d : null;
        return (sys, dia);
    }

    // -------------------------------------------------------------------------
    // Lab result fan-out
    // -------------------------------------------------------------------------

    /// <summary>
    /// Converts each non-null urinalysis / panel column into an individual
    /// public.lab_results row, using the canonical test name as the key.
    /// </summary>
    private static List<LabResult> BuildLabResults(
        Guid visitId, DateTime clientTs, StagingVisit src, short tenantId)
    {
        var results = new List<LabResult>();

        void AddIfPresent(string testName, string? rawValue)
        {
            var value = CleanString(rawValue);
            if (value is null) return;

            results.Add(new LabResult
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                VisitId = visitId,
                TestName = testName,
                ResultValue = value,
                DeviceId = "MIGRATION_ETL",
                ClientUpdatedAt = clientTs,
                ServerRestoredAt = null,
                IsDeleted = false,
            });
        }

        AddIfPresent("BloodH", src.BloodH);
        AddIfPresent("BloodN", src.BloodN);
        AddIfPresent("Urobilin", src.Urobilin);
        AddIfPresent("Bilirubin", src.Bilirubin);
        AddIfPresent("Protein", src.Protein);
        AddIfPresent("Nitrite", src.Nitrite);
        AddIfPresent("Ketones", src.Ketones);
        AddIfPresent("Ascorbic", src.Ascorbic);
        AddIfPresent("GlucoseUrine", src.GlucoseUrine);
        AddIfPresent("Ph", src.Ph);
        AddIfPresent("SpGrav", src.SpGrav);
        AddIfPresent("Leuk", src.Leuk);
        AddIfPresent("PregTest", src.PregTest);

        return results;
    }

    // -------------------------------------------------------------------------
    // Shared helpers (same contract as PatientMapper)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Returns null for the Access null-date sentinel, empty values, or unparseable strings.
    /// Returned DateTime always has DateTimeKind.Utc.
    /// </summary>
    private static DateTime? ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var trimmed = value.Trim();
        if (trimmed.StartsWith(AccessNullDate, StringComparison.OrdinalIgnoreCase)) return null;

        return DateTime.TryParse(trimmed, CultureInfo.InvariantCulture,
            DateTimeStyles.AllowWhiteSpaces, out DateTime dt)
            ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
            : null;
    }

    /// <summary>Parses a text decimal, returning null on failure.</summary>
    private static decimal? ParseDecimal(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return decimal.TryParse(value.Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out decimal d)
            ? d
            : null;
    }

    /// <summary>
    /// Parses a text integer, tolerating trailing decimals like "99.0".
    /// Returns null on failure.
    /// </summary>
    private static int? ParseInt(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return decimal.TryParse(value.Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out decimal d)
            ? Convert.ToInt32(d)
            : null;
    }

    /// <summary>Trims the value and converts an empty result to null.</summary>
    private static string? CleanString(string? value)
    {
        if (value is null) return null;
        var trimmed = value.Trim();
        return trimmed.Length == 0 ? null : trimmed;
    }
}
