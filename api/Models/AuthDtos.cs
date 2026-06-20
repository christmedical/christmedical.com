namespace ChristMedical.WebAPI.Models;

public sealed class LoginRequest
{
    public string Email { get; init; } = "";
    public string Password { get; init; } = "";
}

public sealed class TenantMembershipResponse
{
    public short TenantId { get; init; }
    public string Slug { get; init; } = "";
    public string Name { get; init; } = "";
    public string ShortName { get; init; } = "";
    public string ThemeColorHex { get; init; } = "";
    public string Role { get; init; } = "";
}

public sealed class LoginResponse
{
    public IReadOnlyList<TenantMembershipResponse> Memberships { get; init; } = [];
    public string? AccessToken { get; init; }
    public string? PreAuthToken { get; init; }
    public short? TenantId { get; init; }
    public string? TenantSlug { get; init; }
}

public sealed class SelectTenantRequest
{
    public string PreAuthToken { get; init; } = "";
    public short TenantId { get; init; }
}

public sealed class SelectTenantResponse
{
    public string AccessToken { get; init; } = "";
    public short TenantId { get; init; }
    public string TenantSlug { get; init; } = "";
}
