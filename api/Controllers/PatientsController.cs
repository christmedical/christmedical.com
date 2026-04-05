using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChristMedical.WebAPI.Controllers;

[ApiController]
[Route("api/v1/patients")]
public class PatientsController(PatientService patients) : ControllerBase
{
    /// <summary>First 50 Belize (tenant 1) patients with legacy id and spiritual / clinical notes.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PatientResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PatientResponse>>> ListAsync(CancellationToken cancellationToken)
    {
        var patientsList = await patients.ListBelizePatientsAsync(cancellationToken);
        return Ok(patientsList);
    }
}
