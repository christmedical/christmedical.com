namespace ChristMedical.WebAPI.Models;

public sealed class DashboardSummaryResponse
{
    public required short TenantId { get; init; }
    public required SpiritualImpactSummary Spiritual { get; init; }
    public required MedicalImpactSummary Medical { get; init; }
}

public sealed class SpiritualImpactSummary
{
    /// <summary>Total patients in scope (not deleted).</summary>
    public int TotalPatients { get; init; }

    /// <summary>Rows with a heard-gospel date.</summary>
    public int HeardGospel { get; init; }

    /// <summary>Hope flag set but no heard date yet.</summary>
    public int HopeWithoutHeard { get; init; }

    /// <summary>No heard date and no hope flag.</summary>
    public int NoSpiritualRecord { get; init; }
}

public sealed class MedicalImpactSummary
{
    public int PatientsWithAllergiesDocumented { get; init; }
    public int PatientsWithMedicalHistory { get; init; }
    public int PatientsWithSurgicalHistory { get; init; }
    public int TotalVisits { get; init; }
}
