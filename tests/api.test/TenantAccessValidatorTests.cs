using ChristMedical.WebAPI.Infrastructure;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class TenantAccessValidatorTests
{
    [Fact]
    public void Anonymous_allows_query_tenant()
    {
        var result = TenantAccessValidator.Validate(null, 2, 1);
        Assert.Equal(TenantAccessValidator.AccessResultKind.AllowAnonymous, result.Kind);
        Assert.Equal((short)1, result.TenantId);
    }

    [Fact]
    public void Jwt_mismatch_with_header_is_rejected()
    {
        var result = TenantAccessValidator.Validate(1, 2, 1);
        Assert.Equal(TenantAccessValidator.AccessResultKind.TenantMismatch, result.Kind);
    }

    [Fact]
    public void Jwt_mismatch_with_query_is_rejected()
    {
        var result = TenantAccessValidator.Validate(1, 1, 2);
        Assert.Equal(TenantAccessValidator.AccessResultKind.TenantMismatch, result.Kind);
    }

    [Fact]
    public void Jwt_matches_header_and_query()
    {
        var result = TenantAccessValidator.Validate(3, 3, 3);
        Assert.Equal(TenantAccessValidator.AccessResultKind.Allow, result.Kind);
        Assert.Equal((short)3, result.TenantId);
    }
}
