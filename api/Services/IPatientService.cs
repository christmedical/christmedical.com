using ChristMedical.WebAPI.Models;

namespace ChristMedical.WebAPI.Services;

public interface IPatientService
{
    Task<IReadOnlyList<PatientResponse>> ListBelizePatientsAsync(CancellationToken cancellationToken = default);
}
