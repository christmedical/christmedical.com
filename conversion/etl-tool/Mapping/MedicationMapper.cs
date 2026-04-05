using EtlTool;
using EtlTool.Models.Production;
using EtlTool.Models.Staging;

namespace EtlTool.Mapping;

public static class MedicationMapper
{
    public static MedicationRow? Map(
        StagingVisitRx src,
        IReadOnlyDictionary<string, Guid> visitByLegacyGenId,
        short tenantId)
    {
        var visitKey = LegacyIdKey.Normalize(src.VisitId);
        if (visitKey.Length == 0 || !visitByLegacyGenId.TryGetValue(visitKey, out Guid visitId))
            return null;

        var ts = ClinicalParse.ParseDateUtc(src.RxUpdatedOn) ?? DateTime.UtcNow;

        return new MedicationRow
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            VisitId = visitId,
            LegacyId = ClinicalParse.CleanString(src.Rxid),
            CatalogMedlistId = ClinicalParse.CleanString(src.MedId),
            MedicationCode = ClinicalParse.CleanString(src.MedCode),
            MedicationName = ClinicalParse.CleanString(src.MedName),
            Strength = ClinicalParse.CleanString(src.MedStrength),
            Dose = ClinicalParse.CleanString(src.Dose),
            Directions = ClinicalParse.CleanString(src.Directions),
            DidNotDispense = ClinicalParse.ParseBool(src.Dnd),
            DeviceId = "MIGRATION_ETL",
            ClientUpdatedAt = ts,
            ServerRestoredAt = null,
            IsDeleted = false,
        };
    }

}
