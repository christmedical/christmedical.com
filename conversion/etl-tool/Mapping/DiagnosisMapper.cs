using EtlTool;
using EtlTool.Models.Production;
using EtlTool.Models.Staging;

namespace EtlTool.Mapping;

public static class DiagnosisMapper
{
    public static DiagnosisRow? Map(
        StagingVisitDx src,
        IReadOnlyDictionary<string, Guid> visitByLegacyGenId,
        short tenantId)
    {
        var visitKey = LegacyIdKey.Normalize(src.VisitId);
        if (visitKey.Length == 0 || !visitByLegacyGenId.TryGetValue(visitKey, out Guid visitId))
            return null;

        var ts = ClinicalParse.ParseDateUtc(src.DxUpdatedOn) ?? DateTime.UtcNow;

        return new DiagnosisRow
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            VisitId = visitId,
            LegacyId = ClinicalParse.CleanString(src.VisitDxId),
            DxCode = ClinicalParse.CleanString(src.DxCode),
            AdditionalInfo = ClinicalParse.CleanString(src.AddlInfo),
            DeviceId = "MIGRATION_ETL",
            ClientUpdatedAt = ts,
            ServerRestoredAt = null,
            IsDeleted = false,
        };
    }
}
