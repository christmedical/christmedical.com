using EtlTool;
using EtlTool.Models.Production;
using EtlTool.Models.Staging;

namespace EtlTool.Mapping;

public static class EyeExamMapper
{
    public static EyeExamRow? Map(
        StagingVisitEye src,
        IReadOnlyDictionary<string, Guid> visitByLegacyGenId,
        short tenantId)
    {
        var visitKey = LegacyIdKey.Normalize(src.VisitId);
        if (visitKey.Length == 0 || !visitByLegacyGenId.TryGetValue(visitKey, out Guid visitId))
            return null;

        var ts = ClinicalParse.ParseDateUtc(src.EyeUpdatedOn) ?? DateTime.UtcNow;

        return new EyeExamRow
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            VisitId = visitId,
            LegacyId = ClinicalParse.CleanString(src.EyeId),
            LegacyPatientId = ClinicalParse.CleanString(src.PatientId),
            ScreeningFlag = ClinicalParse.ParseBool(src.Field1),
            VaLeft = ClinicalParse.CleanString(src.VaL),
            VaRight = ClinicalParse.CleanString(src.VaR),
            TonometryR = ClinicalParse.CleanString(src.TonR),
            TonometryL = ClinicalParse.CleanString(src.TonL),
            Impression = ClinicalParse.CleanString(src.Impression),
            Plan = ClinicalParse.CleanString(src.Plan),
            ReadNear = ClinicalParse.CleanString(src.ReadNear),
            ReadDist = ClinicalParse.CleanString(src.ReadDist),
            Eom = ClinicalParse.CleanString(src.Eom),
            Pupils = ClinicalParse.CleanString(src.Pupils),
            ArR = ClinicalParse.CleanString(src.ArR),
            ArL = ClinicalParse.CleanString(src.ArL),
            VaCombined = ClinicalParse.CleanString(src.Va),
            LField = ClinicalParse.CleanString(src.LField),
            Cataracts = ClinicalParse.ParseBool(src.Cataracts),
            DryEyes = ClinicalParse.ParseBool(src.DryEyes),
            Glaucoma = ClinicalParse.ParseBool(src.Glaucoma),
            Pterygium = ClinicalParse.ParseBool(src.Pterygium),
            OtherNote = ClinicalParse.CleanString(src.Other),
            ReadersGivenAt = ClinicalParse.ParseDateUtc(src.ReadersGivenDate),
            ReadersGivenStrength = ClinicalParse.CleanString(src.ReadersGivenStrength),
            DeviceId = "MIGRATION_ETL",
            ClientUpdatedAt = ts,
            ServerRestoredAt = null,
            IsDeleted = false,
        };
    }
}
