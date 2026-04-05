namespace ChristMedical.WebAPI.Branding;

/// <summary>Mission-level branding for API-served assets (icons, future emails).</summary>
public static class TenantBranding
{
    public sealed record Info(string Name, string ShortName, string PrimaryColorHex);

    private static readonly Dictionary<short, Info> Tenants = new()
    {
        [1] = new Info("Belize", "Belize", "#0d9488"),
        [2] = new Info("Demo Mission", "Demo", "#2563eb"),
    };

    public static bool TryGet(short tenantId, out Info info) =>
        Tenants.TryGetValue(tenantId, out info!);

    public static Info Default => Tenants[1];
}
