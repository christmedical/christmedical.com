using ChristMedical.WebAPI.Infrastructure;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class CorsOriginsTests
{
    [Fact]
    public void Parse_default_includes_production_domains()
    {
        var origins = CorsOrigins.Parse(null);

        Assert.Contains("https://www.christmedical.com", origins);
        Assert.Contains("https://christmedical.com", origins);
        Assert.Contains("http://localhost:3000", origins);
    }

    [Fact]
    public void Parse_custom_list_trims_entries()
    {
        var origins = CorsOrigins.Parse(" https://example.com , https://other.test ");

        Assert.Equal(["https://example.com", "https://other.test"], origins);
    }

    [Fact]
    public void IsOriginAllowed_accepts_tenant_subdomains()
    {
        var explicitOrigins = CorsOrigins.Parse(null);
        Assert.True(CorsOrigins.IsOriginAllowed("https://belize.christmedical.com", explicitOrigins));
        Assert.True(CorsOrigins.IsOriginAllowed("https://login.christmedical.com", explicitOrigins));
        Assert.True(CorsOrigins.IsOriginAllowed("http://demo.localhost:3000", explicitOrigins));
    }

    [Fact]
    public void IsOriginAllowed_rejects_unrelated_domains()
    {
        var explicitOrigins = CorsOrigins.Parse(null);
        Assert.False(CorsOrigins.IsOriginAllowed("https://evil.example.com", explicitOrigins));
    }
}
