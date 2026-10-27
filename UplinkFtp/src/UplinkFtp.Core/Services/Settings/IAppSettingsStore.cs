using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Settings;

/// <summary>
/// Persists non-secret <see cref="AppSettings"/> under LocalAppData (JSON).
/// API keys stay in <see cref="Security.ICredentialStore"/>.
/// </summary>
public interface IAppSettingsStore
{
    /// <summary>Absolute path of the settings file (for diagnostics).</summary>
    string FilePath { get; }

    /// <summary>Load into <paramref name="target"/> (keeps instance identity for DI).</summary>
    Task LoadIntoAsync(AppSettings target, CancellationToken cancellationToken = default);

    /// <summary>Write current values from <paramref name="source"/>.</summary>
    Task SaveAsync(AppSettings source, CancellationToken cancellationToken = default);
}
