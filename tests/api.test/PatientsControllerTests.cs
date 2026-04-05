using ChristMedical.WebAPI.Controllers;
using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class PatientsControllerTests
{
    [Fact]
    public async Task ListAsync_Returns_Ok_With_Service_Results()
    {
        var patients = new List<PatientResponse>
        {
            new()
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                LegacyId = "A1",
                DisplayNameMasked = "J*** S***",
                SpiritualStatusLabel = "Heard Gospel · 2024-01-02",
                SpiritualStatusKind = "heard",
            },
        };

        var service = new Mock<IPatientService>(MockBehavior.Strict);
        service
            .Setup(s => s.ListBelizePatientsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(patients);

        var controller = new PatientsController(service.Object);

        var result = await controller.ListAsync(CancellationToken.None);

        var ok = Assert.IsType<ActionResult<IReadOnlyList<PatientResponse>>>(result);
        var list = Assert.IsAssignableFrom<IReadOnlyList<PatientResponse>>(Assert.IsType<OkObjectResult>(ok.Result!).Value);
        Assert.Single(list);
        Assert.Equal("A1", list[0].LegacyId);
    }
}
