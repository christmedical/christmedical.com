using Microsoft.AspNetCore.Mvc;

namespace ChristMedical.WebAPI.Controllers;

/// <summary>Liveness and readiness probes for hub supervisors and load balancers.</summary>
[ApiController]
public sealed class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public HealthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>Liveness: process is up (does not check the database).</summary>
    [HttpGet("health")]
    public IActionResult Get() => Ok(new { status = "ok", api = true });

    /// <summary>Readiness: API process is up and Postgres answers <c>SELECT 1</c>.</summary>
    [HttpGet("ready")]
    public async Task<IActionResult> Ready(CancellationToken cancellationToken)
    {
        var cs = _configuration.GetConnectionString("DefaultConnection");
        var (dbOk, error) = await Infrastructure.DatabaseHealth.CheckAsync(cs, cancellationToken);

        if (!dbOk)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    status = "not_ready",
                    api = true,
                    database = false,
                    error,
                });
        }

        return Ok(new { status = "ready", api = true, database = true });
    }
}
