using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ChristMedical.Sync;

public static class ServiceCollectionExtensions
{
    /// <summary>Binds <c>Sync</c> from configuration and registers <see cref="SyncService"/> as singleton.</summary>
    public static IServiceCollection AddChristMedicalSync(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<SyncServiceOptions>().Bind(configuration.GetSection("Sync"));
        services.AddSingleton<SyncService>();
        return services;
    }
}
