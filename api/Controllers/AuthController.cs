using ChristMedical.WebAPI.Infrastructure;
using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChristMedical.WebAPI.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    /// <summary>Global login — returns memberships; single-tenant users receive an access token immediately.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> LoginAsync(
        [FromBody] LoginRequest body,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await auth.LoginAsync(body, cancellationToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>Issues a tenant-scoped JWT after multi-tenant picker selection.</summary>
    [HttpPost("select-tenant")]
    [ProducesResponseType(typeof(SelectTenantResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SelectTenantResponse>> SelectTenantAsync(
        [FromBody] SelectTenantRequest body,
        CancellationToken cancellationToken)
    {
        var response = await auth.SelectTenantAsync(body, cancellationToken);
        if (response is null)
            return BadRequest(new { message = "Invalid session or clinic selection." });

        return Ok(response);
    }
}

[ApiController]
[Route("api/v1/tenants")]
public sealed class TenantsController(ITenantService tenants) : ControllerBase
{
    /// <summary>Resolve tenant branding by subdomain slug (public).</summary>
    [HttpGet("by-slug/{slug}")]
    [ProducesResponseType(typeof(TenantRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TenantRecord>> GetBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        if (!ReservedSubdomains.IsAllowedTenantSlug(slug))
            return NotFound();

        var tenant = await tenants.GetBySlugAsync(slug, cancellationToken);
        return tenant is null ? NotFound() : Ok(tenant);
    }
}
