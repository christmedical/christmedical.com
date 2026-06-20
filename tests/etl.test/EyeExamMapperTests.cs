using EtlTool.Mapping;
using EtlTool.Models.Staging;
using Xunit;

namespace ChristMedical.Etl.Test;

public sealed class EyeExamMapperTests
{
    private const short TenantId = 5;
    private static readonly Guid VisitId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public void Map_HappyPath_MapsFieldsAndTenant()
    {
        var src = new StagingVisitEye
        {
            EyeId = " EYE-3 ",
            VisitId = " GEN-88 ",
            PatientId = " P-9 ",
            Field1 = "1",
            VaL = " 20/40 ",
            VaR = "20/20",
            TonR = "14",
            TonL = "15",
            Impression = "Healthy",
            Plan = "Recheck",
            ReadNear = "OK",
            ReadDist = "OK",
            Eom = "Full",
            Pupils = "PERRLA",
            ArR = "clear",
            ArL = "clear",
            Va = "combined",
            LField = "normal",
            Cataracts = "0",
            DryEyes = "-1",
            Glaucoma = "0",
            Pterygium = "1",
            Other = "none",
            ReadersGivenDate = "2024-09-01",
            ReadersGivenStrength = "+1.50",
            EyeUpdatedOn = "2024-09-02T12:00:00",
        };

        var row = EyeExamMapper.Map(src, VisitCache("GEN-88"), TenantId);

        Assert.NotNull(row);
        Assert.NotEqual(Guid.Empty, row!.Id);
        Assert.Equal(TenantId, row.TenantId);
        Assert.Equal(VisitId, row.VisitId);
        Assert.Equal("EYE-3", row.LegacyId);
        Assert.Equal("P-9", row.LegacyPatientId);
        Assert.True(row.ScreeningFlag);
        Assert.Equal("20/40", row.VaLeft);
        Assert.Equal("20/20", row.VaRight);
        Assert.Equal("14", row.TonometryR);
        Assert.Equal("15", row.TonometryL);
        Assert.Equal("Healthy", row.Impression);
        Assert.Equal("Recheck", row.Plan);
        Assert.Equal("OK", row.ReadNear);
        Assert.Equal("OK", row.ReadDist);
        Assert.Equal("Full", row.Eom);
        Assert.Equal("PERRLA", row.Pupils);
        Assert.Equal("clear", row.ArR);
        Assert.Equal("clear", row.ArL);
        Assert.Equal("combined", row.VaCombined);
        Assert.Equal("normal", row.LField);
        Assert.False(row.Cataracts);
        Assert.True(row.DryEyes);
        Assert.False(row.Glaucoma);
        Assert.True(row.Pterygium);
        Assert.Equal("none", row.OtherNote);
        Assert.Equal(new DateTime(2024, 9, 1, 0, 0, 0, DateTimeKind.Utc), row.ReadersGivenAt);
        Assert.Equal("+1.50", row.ReadersGivenStrength);
        Assert.Equal(new DateTime(2024, 9, 2, 12, 0, 0, DateTimeKind.Utc), row.ClientUpdatedAt);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Map_VisitIdBlank_ReturnsNull(string? visitId)
    {
        var src = new StagingVisitEye { VisitId = visitId, EyeId = "E1" };

        Assert.Null(EyeExamMapper.Map(src, VisitCache("GEN-88"), TenantId));
    }

    [Fact]
    public void Map_VisitIdNotInCache_ReturnsNull()
    {
        var src = new StagingVisitEye { VisitId = "no-such-visit", EyeId = "E1" };

        Assert.Null(EyeExamMapper.Map(src, VisitCache("GEN-88"), TenantId));
    }

    [Fact]
    public void Map_VisitIdTrimmed_MatchesCacheKey()
    {
        var src = new StagingVisitEye { VisitId = "  GEN-88  ", EyeId = "E1" };

        Assert.NotNull(EyeExamMapper.Map(src, VisitCache("GEN-88"), TenantId));
    }

    private static Dictionary<string, Guid> VisitCache(string legacyGenId) =>
      new() { [legacyGenId] = VisitId };
}
