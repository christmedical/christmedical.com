using ChristMedical.WebAPI.Infrastructure;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class ReservedSubdomainsTests
{
    [Theory]
    [InlineData("login")]
    [InlineData("www")]
    [InlineData("api")]
    public void Reserved_slugs_are_blocked(string slug)
    {
        Assert.False(ReservedSubdomains.IsAllowedTenantSlug(slug));
    }

    [Theory]
    [InlineData("belize")]
    [InlineData("cornerstone")]
    [InlineData("demo-mission")]
    public void Clinic_slugs_are_allowed(string slug)
    {
        Assert.True(ReservedSubdomains.IsAllowedTenantSlug(slug));
    }
}
