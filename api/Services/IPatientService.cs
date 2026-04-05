using ChristMedical.WebAPI.Models;

namespace ChristMedical.WebAPI.Services;

public interface IPatientService
{
    /// <summary>Lists up to <paramref name="limit"/> patients for <paramref name="tenantId"/> (capped at 2000).</summary>
    Task<IReadOnlyList<PatientResponse>> ListPatientsAsync(
        short tenantId,
        int limit,
        CancellationToken cancellationToken = default);

    /// <summary>Overwrites note / spiritual fields for the patient (last write wins).</summary>
    Task<PatientNotesUpdateOutcome> UpdatePatientNotesAsync(
        Guid id,
        short tenantId,
        UpdatePatientNotesRequest request,
        CancellationToken cancellationToken = default);
}
