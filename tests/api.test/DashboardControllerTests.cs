using ChristMedical.WebAPI.Controllers;
using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class DashboardControllerTests
{
    [Fact]
    public async Task SummaryAsync_Returns_Ok_With_Service_Data()
    {
        var summary = new DashboardSummaryResponse
        {
            TenantId = 2,
            Spiritual = new SpiritualImpactSummary
            {
                TotalPatients = 100,
                HeardGospel = 40,
                HopeWithoutHeard = 10,
                NoSpiritualRecord = 50,
            },
            Medical = new MedicalImpactSummary
            {
                PatientsWithAllergiesDocumented = 12,
                PatientsWithMedicalHistory = 30,
                PatientsWithSurgicalHistory = 5,
                TotalVisits = 200,
            },
        };

        var svc = new Mock<IDashboardService>(MockBehavior.Strict);
        svc
            .Setup(s => s.GetSummaryAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        var controller = new DashboardController(svc.Object);

        var result = await controller.SummaryAsync(2, CancellationToken.None);

        var ok = Assert.IsType<ActionResult<DashboardSummaryResponse>>(result);
        var body = Assert.IsAssignableFrom<DashboardSummaryResponse>(
            Assert.IsType<OkObjectResult>(ok.Result!).Value);
        Assert.Equal(2, body.TenantId);
        Assert.Equal(100, body.Spiritual.TotalPatients);
        Assert.Equal(200, body.Medical.TotalVisits);
    }
}
