namespace EtlTool;

/// <summary>Caps staging extraction for the conversion appliance — keep patient-derived scope consistent.</summary>
public static class MigrationBatchLimits
{
    /// <summary>Max patients pulled from staging (defines the mission cohort).</summary>
    public const int Patients = 2000;
}
