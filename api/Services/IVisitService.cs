using ChristMedical.WebAPI.Models;

namespace ChristMedical.WebAPI.Services;

public interface IVisitService
{
    Task<IReadOnlyList<VisitResponse>> ListVisitsForPatientAsync(
        Guid patientId,
        short tenantId,
        CancellationToken cancellationToken = default);

    /// <summary>Returns null when the patient is missing or not in the tenant.</summary>
    Task<VisitResponse?> CreateVisitAsync(
        Guid patientId,
        short tenantId,
        CreateVisitRequest request,
        CancellationToken cancellationToken = default);
}
