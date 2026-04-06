using ChristMedical.WebAPI.Models;

namespace ChristMedical.WebAPI.Services;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(
        short tenantId,
        CancellationToken cancellationToken = default);
}
