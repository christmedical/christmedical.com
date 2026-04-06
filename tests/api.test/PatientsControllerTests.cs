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
            .Setup(s => s.ListPatientsAsync(1, 50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(patients);

        var controller = new PatientsController(service.Object);

        var result = await controller.ListAsync(1, 50, CancellationToken.None);

        var ok = Assert.IsType<ActionResult<IReadOnlyList<PatientResponse>>>(result);
        var list = Assert.IsAssignableFrom<IReadOnlyList<PatientResponse>>(Assert.IsType<OkObjectResult>(ok.Result!).Value);
        Assert.Single(list);
        Assert.Equal("A1", list[0].LegacyId);
    }

    [Fact]
    public async Task PatchNotesAsync_Returns_Ok_When_Service_Updates()
    {
        var id = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var updated = new PatientResponse
        {
            Id = id,
            LegacyId = "A1",
            DisplayNameMasked = "J*** S***",
            SpiritualStatusLabel = "No spiritual record",
            SpiritualStatusKind = "none",
            SpiritualNotes = "saved",
        };

        var body = new UpdatePatientNotesRequest { SpiritualNotes = "saved" };

        var service = new Mock<IPatientService>(MockBehavior.Strict);
        service
            .Setup(s => s.UpdatePatientNotesAsync(id, 1, body, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PatientNotesUpdateOutcome(PatientNotesUpdateStatus.Updated, updated));

        var controller = new PatientsController(service.Object);

        var result = await controller.PatchNotesAsync(id, 1, body, CancellationToken.None);

        var ok = Assert.IsType<ActionResult<PatientResponse>>(result);
        var pr = Assert.IsType<PatientResponse>(Assert.IsType<OkObjectResult>(ok.Result!).Value);
        Assert.Equal("saved", pr.SpiritualNotes);
    }

    [Fact]
    public async Task PatchNotesAsync_Returns_NotFound_When_Service_Misses()
    {
        var id = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var body = new UpdatePatientNotesRequest();

        var service = new Mock<IPatientService>(MockBehavior.Strict);
        service
            .Setup(s => s.UpdatePatientNotesAsync(id, 1, body, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PatientNotesUpdateOutcome(PatientNotesUpdateStatus.NotFound));

        var controller = new PatientsController(service.Object);

        var result = await controller.PatchNotesAsync(id, 1, body, CancellationToken.None);

        var ar = Assert.IsType<ActionResult<PatientResponse>>(result);
        Assert.IsType<NotFoundResult>(ar.Result);
    }

    [Fact]
    public async Task SearchAsync_Returns_BadRequest_When_No_Query_And_Spiritual_All()
    {
        var service = new Mock<IPatientService>(MockBehavior.Strict);
        var controller = new PatientsController(service.Object);

        var result = await controller.SearchAsync(1, null, "all", 50, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(Assert.IsType<ActionResult<IReadOnlyList<PatientResponse>>>(result).Result);
    }

    [Fact]
    public async Task SearchAsync_Returns_Ok_When_Spiritual_Filter_Only()
    {
        IReadOnlyList<PatientResponse> found = Array.Empty<PatientResponse>();
        var service = new Mock<IPatientService>(MockBehavior.Strict);
        service
            .Setup(s => s.SearchPatientsAsync(1, null, "heard", 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(found);

        var controller = new PatientsController(service.Object);

        var result = await controller.SearchAsync(1, null, "heard", 20, CancellationToken.None);

        var ok = Assert.IsType<ActionResult<IReadOnlyList<PatientResponse>>>(result);
        Assert.Same(found, Assert.IsType<OkObjectResult>(ok.Result!).Value);
    }

    [Fact]
    public async Task SearchAsync_Returns_Ok_With_Text()
    {
        var patients = new List<PatientResponse>
        {
            new()
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                LegacyId = "A1",
                DisplayNameMasked = "J*** S***",
                SpiritualStatusLabel = "No spiritual record",
                SpiritualStatusKind = "none",
            },
        };

        var service = new Mock<IPatientService>(MockBehavior.Strict);
        service
            .Setup(s => s.SearchPatientsAsync(1, "jon", "all", 50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(patients);

        var controller = new PatientsController(service.Object);

        var result = await controller.SearchAsync(1, "jon", "all", 50, CancellationToken.None);

        var ok = Assert.IsType<ActionResult<IReadOnlyList<PatientResponse>>>(result);
        var list = Assert.IsAssignableFrom<IReadOnlyList<PatientResponse>>(
            Assert.IsType<OkObjectResult>(ok.Result!).Value);
        Assert.Single(list);
    }
}
