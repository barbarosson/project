using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Licensing;

/// <summary>
/// Free vs Pro gating. Core implementations: <see cref="WebLicenseService"/>;
/// Store channel stays in the App (WinRT).
/// </summary>
public interface ILicenseService
{
    DistributionChannel Channel { get; }

    LicenseTier GetCurrentTier();

    /// <summary>Human-readable status (trial, key source, last refresh error).</summary>
    string StatusDetail { get; }

    bool IsFeatureEnabled(LicenseFeature feature);

    int GetMaxSavedSites();

    int GetMaxConcurrentTransfers();

    /// <summary>Max simultaneous live FTP/SFTP sessions. Free = 1; Pro = unlimited.</summary>
    int GetMaxConcurrentConnections();

    /// <summary>Refresh entitlement from Store or Web API / local key.</summary>
    Task RefreshAsync(CancellationToken cancellationToken = default);
}

public enum LicenseTier
{
    Free,
    Pro
}

public enum LicenseFeature
{
    UnlimitedSites,
    ConcurrentTransfers,
    ConcurrentConnections,
    Sync,
    Scripting
}
