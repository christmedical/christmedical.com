using EtlTool.Mapping;
using EtlTool.Models.Staging;
using Xunit;

namespace ChristMedical.Etl.Test;

public sealed class VisitMapperTests
{
    private const short TenantId = 3;
    private static readonly Guid CachedPatientId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public void Map_HappyPath_MapsVisitVitalsLabsAndTenant()
    {
        var src = new StagingVisit
        {
            GenId = "GEN-100",
            PatientId = "P-1",
            DateVisit = "2024-06-01T10:00:00",
            Location = "  Clinic A ",
            Diagnosis = "URI",
            Referral = "Follow-up",
            Weight = "150.5",
            Height = "65",
            Pulse = "72",
            Bp = "120/80",
            Resp = "16",
            Temp = "98.6",
            Oxygen = "99",
            GlucoseBlood = "95",
            Hemoglobin = "13.2",
            GenUpdatedOn = "2024-06-01T11:00:00",
            Protein = " trace ",
            Nitrite = "neg",
            Ketones = "  ",
        };

        var cache = PatientCache("P-1", CachedPatientId);
        var visit = VisitMapper.Map(src, cache, TenantId);

        Assert.NotNull(visit);
        Assert.NotEqual(Guid.Empty, visit!.Id);
        Assert.Equal(TenantId, visit.TenantId);
        Assert.Equal("GEN-100", visit.LegacyId);
        Assert.Equal(CachedPatientId, visit.PatientId);
        Assert.Null(visit.TripId);
        Assert.Null(visit.ChiefComplaint);
        Assert.Equal(new DateTime(2024, 6, 1, 10, 0, 0, DateTimeKind.Utc), visit.VisitDate);
        Assert.Equal("Clinic A", visit.LocationName);
        Assert.Equal("URI", visit.DiagnosisText);
        Assert.Equal("Follow-up", visit.ReferralNotes);
        Assert.Equal(new DateTime(2024, 6, 1, 11, 0, 0, DateTimeKind.Utc), visit.ClientUpdatedAt);

        var vitals = visit.Vitals!;
        Assert.Equal(visit.Id, vitals.VisitId);
        Assert.Equal(TenantId, vitals.TenantId);
        Assert.Equal(150.5m, vitals.Weight);
        Assert.Equal(65m, vitals.Height);
        Assert.Equal(72, vitals.Pulse);
        Assert.Equal("120/80", vitals.Bp);
        Assert.Equal(120, vitals.Systolic);
        Assert.Equal(80, vitals.Diastolic);
        Assert.Equal(16, vitals.Resp);
        Assert.Equal(98.6m, vitals.TempF);
        Assert.Equal(99, vitals.OxygenSat);
        Assert.Equal(95m, vitals.Glucose);
        Assert.Equal(13.2m, vitals.Hemoglobin);

        Assert.Equal(2, visit.LabResults.Count);
        Assert.Contains(visit.LabResults, l => l.TestName == "Protein" && l.ResultValue == "trace");
        Assert.Contains(visit.LabResults, l => l.TestName == "Nitrite" && l.ResultValue == "neg");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void Map_PatientIdMissingFromCache_ReturnsNull(string? patientId)
    {
        var src = MinimalVisit();
        src.PatientId = patientId;

        Assert.Null(VisitMapper.Map(src, PatientCache("P-1", CachedPatientId), TenantId));
    }

    [Fact]
    public void Map_PatientIdNotInCache_ReturnsNull()
    {
        var src = MinimalVisit();
        src.PatientId = "orphan";

        Assert.Null(VisitMapper.Map(src, PatientCache("P-1", CachedPatientId), TenantId));
    }

    [Theory]
    [InlineData("120")]
    [InlineData("120/80/70")]
    [InlineData("")]
    public void Map_BpNotTwoPart_SystolicDiastolicNull(string? bp)
    {
        var src = MinimalVisit();
        src.PatientId = "P-1";
        src.Bp = bp;

        var vitals = VisitMapper.Map(src, PatientCache("P-1", CachedPatientId), TenantId)!.Vitals!;

        Assert.Null(vitals.Systolic);
        Assert.Null(vitals.Diastolic);
    }

    [Fact]
    public void Map_GenUpdatedOnMissing_UsesUtcNowForClientUpdatedAt()
    {
        var src = MinimalVisit();
        src.PatientId = "P-1";
        src.GenUpdatedOn = null;
        var before = DateTime.UtcNow;

        var visit = VisitMapper.Map(src, PatientCache("P-1", CachedPatientId), TenantId);

        Assert.NotNull(visit);
        Assert.True(visit!.ClientUpdatedAt >= before);
        Assert.True(visit.ClientUpdatedAt <= DateTime.UtcNow.AddSeconds(2));
    }

    [Fact]
    public void Map_AllLabColumnsBlank_LabResultsEmpty()
    {
        var src = MinimalVisit();
        src.PatientId = "P-1";

        var visit = VisitMapper.Map(src, PatientCache("P-1", CachedPatientId), TenantId);

        Assert.NotNull(visit);
        Assert.Empty(visit!.LabResults);
    }

    private static StagingVisit MinimalVisit() => new()
    {
        GenId = "g1",
        PatientId = "P-1",
    };

    private static Dictionary<string, Guid> PatientCache(string legacyPatientId, Guid patientGuid) =>
      new() { [legacyPatientId] = patientGuid };
}
