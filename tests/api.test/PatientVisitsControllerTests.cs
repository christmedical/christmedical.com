using ChristMedical.WebAPI.Controllers;
using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class PatientVisitsControllerTests
{
    [Fact]
    public async Task ListAsync_Returns_Ok_With_Service_Results()
    {
        var pid = Guid.Parse("11111111-1111-1111-1111-111111111111");
        IReadOnlyList<VisitResponse> visits =
        [
            new VisitResponse
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                PatientId = pid,
                VisitDate = DateTimeOffset.Parse("2026-05-01T12:00:00Z"),
                ChiefComplaint = "Headache",
            },
        ];

        var service = new Mock<IVisitService>(MockBehavior.Strict);
        service
            .Setup(s => s.ListVisitsForPatientAsync(pid, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(visits);

        var controller = new PatientVisitsController(service.Object);

        var result = await controller.ListAsync(pid, 1, CancellationToken.None);

        var ok = Assert.IsType<ActionResult<IReadOnlyList<VisitResponse>>>(result);
        Assert.Same(visits, Assert.IsType<OkObjectResult>(ok.Result!).Value);
    }

    [Fact]
    public async Task CreateAsync_Returns_Ok_When_Service_Creates()
    {
        var pid = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var created = new VisitResponse
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            PatientId = pid,
            VisitDate = DateTimeOffset.Parse("2026-05-08T15:00:00Z"),
            LocationName = "Clinic tent",
        };
        var body = new CreateVisitRequest { LocationName = "Clinic tent" };

        var service = new Mock<IVisitService>(MockBehavior.Strict);
        service
            .Setup(s => s.CreateVisitAsync(pid, 2, body, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var controller = new PatientVisitsController(service.Object);

        var result = await controller.CreateAsync(pid, 2, body, CancellationToken.None);

        var ar = Assert.IsType<ActionResult<VisitResponse>>(result);
        Assert.Same(created, Assert.IsType<OkObjectResult>(ar.Result!).Value);
    }

    [Fact]
    public async Task CreateAsync_Returns_NotFound_When_Service_Misses_Patient()
    {
        var pid = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var body = new CreateVisitRequest();

        var service = new Mock<IVisitService>(MockBehavior.Strict);
        service
            .Setup(s => s.CreateVisitAsync(pid, 1, body, It.IsAny<CancellationToken>()))
            .ReturnsAsync((VisitResponse?)null);

        var controller = new PatientVisitsController(service.Object);

        var result = await controller.CreateAsync(pid, 1, body, CancellationToken.None);

        var ar = Assert.IsType<ActionResult<VisitResponse>>(result);
        Assert.IsType<NotFoundResult>(ar.Result);
    }
}
