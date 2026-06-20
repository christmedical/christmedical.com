using EtlTool.Mapping;
using EtlTool.Models.Staging;
using Xunit;

namespace ChristMedical.Etl.Test;

public sealed class MedicationMapperTests
{
    private const short TenantId = 4;
    private static readonly Guid VisitId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public void Map_HappyPath_MapsFieldsAndTenant()
    {
        var src = new StagingVisitRx
        {
            Rxid = " RX-1 ",
            VisitId = "GEN-77",
            MedId = " med-42 ",
            MedCode = " IBU ",
            MedName = " Ibuprofen ",
            MedStrength = " 200mg ",
            Dose = " 1 tab ",
            Directions = " BID ",
            Dnd = "-1",
            RxUpdatedOn = "2024-08-01",
        };

        var row = MedicationMapper.Map(src, VisitCache("GEN-77"), TenantId);

        Assert.NotNull(row);
        Assert.NotEqual(Guid.Empty, row!.Id);
        Assert.Equal(TenantId, row.TenantId);
        Assert.Equal(VisitId, row.VisitId);
        Assert.Equal("RX-1", row.LegacyId);
        Assert.Equal("med-42", row.CatalogMedlistId);
        Assert.Equal("IBU", row.MedicationCode);
        Assert.Equal("Ibuprofen", row.MedicationName);
        Assert.Equal("200mg", row.Strength);
        Assert.Equal("1 tab", row.Dose);
        Assert.Equal("BID", row.Directions);
        Assert.True(row.DidNotDispense);
        Assert.Equal(new DateTime(2024, 8, 1, 0, 0, 0, DateTimeKind.Utc), row.ClientUpdatedAt);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Map_VisitIdBlank_ReturnsNull(string? visitId)
    {
        var src = new StagingVisitRx { VisitId = visitId, MedName = "Aspirin" };

        Assert.Null(MedicationMapper.Map(src, VisitCache("GEN-77"), TenantId));
    }

    [Fact]
    public void Map_VisitIdNotInCache_ReturnsNull()
    {
        var src = new StagingVisitRx { VisitId = "unknown", MedName = "Aspirin" };

        Assert.Null(MedicationMapper.Map(src, VisitCache("GEN-77"), TenantId));
    }

    [Theory]
    [InlineData(null, false)]
    [InlineData("0", false)]
    [InlineData("-1", true)]
    public void Map_DidNotDispense_FromDnd(string? dnd, bool expected)
    {
        var src = new StagingVisitRx { VisitId = "GEN-77", Dnd = dnd };

        Assert.Equal(expected, MedicationMapper.Map(src, VisitCache("GEN-77"), TenantId)!.DidNotDispense);
    }

    private static Dictionary<string, Guid> VisitCache(string legacyGenId) =>
      new() { [legacyGenId] = VisitId };
}
