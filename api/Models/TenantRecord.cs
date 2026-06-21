namespace ChristMedical.WebAPI.Models;

/// <summary>Tenant registry row for subdomain routing and branding.</summary>
public sealed class TenantRecord
{
    public short Id { get; init; }
    public string Slug { get; init; } = "";
    public string Name { get; init; } = "";
    public string ShortName { get; init; } = "";
    public string ThemeColorHex { get; init; } = "#0d9488";
}
