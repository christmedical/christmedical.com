using EtlTool.Mapping;
using EtlTool.Models.Staging;
using Xunit;

namespace ChristMedical.Etl.Test;

public sealed class DiagnosisMapperTests
{
  private const short TenantId = 2;
  private static readonly Guid VisitId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

  [Fact]
  public void Map_HappyPath_MapsFieldsAndTenant()
  {
    var src = new StagingVisitDx
    {
      VisitDxId = " DX-9 ",
      VisitId = "  GEN-55  ",
      DxCode = " J06.9 ",
      AddlInfo = " acute ",
      DxUpdatedOn = "2024-07-04T08:30:00",
    };

    var row = DiagnosisMapper.Map(src, VisitCache("GEN-55"), TenantId);

    Assert.NotNull(row);
    Assert.NotEqual(Guid.Empty, row!.Id);
    Assert.Equal(TenantId, row.TenantId);
    Assert.Equal(VisitId, row.VisitId);
    Assert.Equal("DX-9", row.LegacyId);
    Assert.Equal("J06.9", row.DxCode);
    Assert.Equal("acute", row.AdditionalInfo);
    Assert.Equal("MIGRATION_ETL", row.DeviceId);
    Assert.False(row.IsDeleted);
    Assert.Equal(new DateTime(2024, 7, 4, 8, 30, 0, DateTimeKind.Utc), row.ClientUpdatedAt);
  }

  [Theory]
  [InlineData(null)]
  [InlineData("")]
  [InlineData("   ")]
  public void Map_VisitIdBlank_ReturnsNull(string? visitId)
  {
    var src = new StagingVisitDx { VisitId = visitId, DxCode = "A00" };

    Assert.Null(DiagnosisMapper.Map(src, VisitCache("GEN-55"), TenantId));
  }

  [Fact]
  public void Map_VisitIdNotInCache_ReturnsNull()
  {
    var src = new StagingVisitDx { VisitId = "missing", DxCode = "A00" };

    Assert.Null(DiagnosisMapper.Map(src, VisitCache("GEN-55"), TenantId));
  }

  [Fact]
  public void Map_DxUpdatedOnMissing_UsesUtcNow()
  {
    var src = new StagingVisitDx
    {
      VisitId = "GEN-55",
      DxCode = "Z00",
      DxUpdatedOn = null,
    };
    var before = DateTime.UtcNow;

    var row = DiagnosisMapper.Map(src, VisitCache("GEN-55"), TenantId);

    Assert.NotNull(row);
    Assert.True(row!.ClientUpdatedAt >= before);
    Assert.True(row.ClientUpdatedAt <= DateTime.UtcNow.AddSeconds(2));
  }

  private static Dictionary<string, Guid> VisitCache(string legacyGenId) =>
    new() { [legacyGenId] = VisitId };
}
