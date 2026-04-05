using System.Net;
using ChristMedical.WebAPI.Branding;
using Microsoft.AspNetCore.Mvc;

namespace ChristMedical.WebAPI.Controllers;

[ApiController]
[Route("api/v1/assets")]
public sealed class AssetsController : ControllerBase
{
    /// <summary>Per-tenant home screen icon (SVG, cacheable).</summary>
    [HttpGet("icon")]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any)]
    [Produces("image/svg+xml")]
    public IActionResult Icon([FromQuery] short tenantId = 1)
    {
        var info = TenantBranding.TryGet(tenantId, out var i) ? i : TenantBranding.Default;
        var initial = info.ShortName.Length > 0
            ? char.ToUpperInvariant(info.ShortName.Trim()[0])
            : 'C';

        // Simple maskable-safe rounded tile; primary fill from tenant palette.
        var svg =
            $"""
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="{WebUtility.HtmlEncode(info.ShortName)}">
               <rect width="512" height="512" rx="96" fill="{info.PrimaryColorHex}"/>
               <text x="256" y="330" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="220" font-weight="700" fill="#ffffff">{initial}</text>
             </svg>
             """;

        return Content(svg, "image/svg+xml");
    }
}
