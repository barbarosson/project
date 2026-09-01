namespace WinAirPlay.Core.Discovery;

/// <summary>
/// Finds AirPlay receivers on the local network. Kept behind an interface so the WPF layer and the
/// tests can work against a stub instead of real multicast traffic.
/// </summary>
public interface IAirPlayDiscovery
{
    /// <summary>
    /// Raised once per distinct mDNS answer as it arrives, before records are merged into devices.
    /// </summary>
    event EventHandler<MdnsServiceRecord>? ServiceObserved;

    Task<IReadOnlyList<AirPlayDevice>> ScanAsync(TimeSpan duration, CancellationToken cancellationToken = default);
}
