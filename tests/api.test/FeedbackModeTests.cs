using ChristMedical.WebAPI.Infrastructure;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class FeedbackModeTests
{
    [Fact]
    public void IsEnabled_false_by_default()
    {
        var config = new ConfigurationBuilder().Build();
        Assert.False(FeedbackMode.IsEnabled(config));
    }

    [Fact]
    public void IsEnabled_true_when_on()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { [FeedbackMode.EnvKey] = "on" })
            .Build();
        Assert.True(FeedbackMode.IsEnabled(config));
    }

    [Fact]
    public void IsEnabled_false_for_other_values()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { [FeedbackMode.EnvKey] = "true" })
            .Build();
        Assert.False(FeedbackMode.IsEnabled(config));
    }
}
