using ChristMedical.WebAPI.Controllers;
using ChristMedical.WebAPI.Infrastructure;
using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class FeedbackControllerTests
{
    [Fact]
    public async Task Create_returns_not_found_when_feedback_mode_off()
    {
        var service = new Mock<IFeedbackService>(MockBehavior.Strict);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { [FeedbackMode.EnvKey] = "off" })
            .Build();
        var controller = new FeedbackController(service.Object, config);

        var result = await controller.CreateAsync(new CreateFeedbackRequest(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task List_returns_not_found_when_feedback_mode_off()
    {
        var service = new Mock<IFeedbackService>(MockBehavior.Strict);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { [FeedbackMode.EnvKey] = "off" })
            .Build();
        var controller = new FeedbackController(service.Object, config);

        var result = await controller.ListAsync(null, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_returns_created_when_enabled()
    {
        var record = new FeedbackRecord
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            PagePath = "/queue",
            PinX = 0.5f,
            PinY = 0.5f,
            Note = "Test",
            ReviewerLabel = "Bob",
            Status = "open",
            ViewportW = 1200,
            ViewportH = 800,
        };

        var service = new Mock<IFeedbackService>(MockBehavior.Strict);
        service
            .Setup(s => s.CreateAsync(It.IsAny<CreateFeedbackRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);
        service
            .Setup(s => s.IsReviewerEnabledAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var config = new ConfigurationBuilder().Build();
        var controller = new FeedbackController(service.Object, config);

        var result = await controller.CreateAsync(
            new CreateFeedbackRequest
            {
                PagePath = "/queue",
                PinX = 0.5f,
                PinY = 0.5f,
                Note = "Test",
                ReviewerEmail = "bob@test.com",
                ReviewerLabel = "Bob",
                ViewportW = 1200,
                ViewportH = 800,
            },
            CancellationToken.None);

        var created = Assert.IsType<CreatedResult>(result.Result);
        Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
        Assert.Equal(record, created.Value);
    }
}
