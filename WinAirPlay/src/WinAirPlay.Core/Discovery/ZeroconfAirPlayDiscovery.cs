using System.Net;
using Zeroconf;

namespace WinAirPlay.Core.Discovery;

/// <summary>
/// mDNS discovery backed by the Zeroconf library. Browses <c>_raop._tcp</c> and
/// <c>_airplay._tcp</c> in one pass and merges the answers into <see cref="AirPlayDevice"/>s.
/// </summary>
public sealed class ZeroconfAirPlayDiscovery : IAirPlayDiscovery
{
    private static readonly TimeSpan MinimumRound = TimeSpan.FromSeconds(1);

    private readonly TimeSpan _queryInterval;

    /// <param name="queryInterval">
    /// How often the multicast query is repeated during a scan. One <c>ResolveAsync</c> call only
    /// broadcasts once at the start, and Wi-Fi drops multicast packets often enough that a single
    /// query regularly misses a HomePod, so a scan is split into several shorter rounds.
    /// </param>
    public ZeroconfAirPlayDiscovery(TimeSpan? queryInterval = null)
    {
        _queryInterval = queryInterval ?? TimeSpan.FromSeconds(3);

        if (_queryInterval < MinimumRound)
        {
            throw new ArgumentOutOfRangeException(
                nameof(queryInterval), queryInterval, "Query interval must be at least one second.");
        }
    }

    public event EventHandler<MdnsServiceRecord>? ServiceObserved;

    public async Task<IReadOnlyList<AirPlayDevice>> ScanAsync(
        TimeSpan duration,
        CancellationToken cancellationToken = default)
    {
        if (duration <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(duration), duration, "Scan duration must be positive.");
        }

        // Answers are accumulated as they arrive rather than taken from the returned list, because
        // Zeroconf only hands back hosts seen in the round it happens to finish on.
        var observed = new Dictionary<string, MdnsServiceRecord>(StringComparer.OrdinalIgnoreCase);
        var deadline = DateTime.UtcNow + duration;

        try
        {
            while (true)
            {
                var remaining = deadline - DateTime.UtcNow;
                var round = remaining < _queryInterval ? remaining : _queryInterval;

                if (round < MinimumRound)
                {
                    break;
                }

                var hosts = await ZeroconfResolver.ResolveAsync(
                    AirPlayServiceTypes.All,
                    scanTime: round,
                    retries: 1,
                    retryDelayMilliseconds: 500,
                    callback: host => Collect(observed, host),
                    cancellationToken: cancellationToken).ConfigureAwait(false);

                foreach (var host in hosts)
                {
                    Collect(observed, host);
                }
            }
        }
        catch (OperationCanceledException) when (observed.Count > 0)
        {
            // Stopped early: report whatever answered before the cancellation.
        }

        lock (observed)
        {
            return AirPlayDeviceCatalog.Build(observed.Values.ToList());
        }
    }

    private void Collect(Dictionary<string, MdnsServiceRecord> observed, IZeroconfHost host)
    {
        foreach (var record in ToRecords(host))
        {
            bool isNew;
            lock (observed)
            {
                isNew = observed.TryAdd(RecordKey(record), record);
            }

            if (isNew)
            {
                ServiceObserved?.Invoke(this, record);
            }
        }
    }

    private static string RecordKey(MdnsServiceRecord record) =>
        $"{record.Kind}|{record.InstanceName}|{record.Port}|{string.Join(',', record.Addresses)}";

    private static IEnumerable<MdnsServiceRecord> ToRecords(IZeroconfHost host)
    {
        var addresses = ParseAddresses(host.IPAddresses);
        if (addresses.Count == 0 && IPAddress.TryParse(host.IPAddress, out var single))
        {
            addresses = new[] { single };
        }

        foreach (var (key, service) in host.Services)
        {
            var kind = AirPlayServiceTypes.Classify(service.ServiceName)
                       ?? AirPlayServiceTypes.Classify(key)
                       ?? AirPlayServiceTypes.Classify(service.Name);

            if (kind is null)
            {
                continue;
            }

            yield return new MdnsServiceRecord(
                kind.Value,
                ExtractInstanceName(service.Name, key, host.DisplayName),
                addresses,
                service.Port,
                MergeTxt(service.Properties));
        }
    }

    private static IReadOnlyList<IPAddress> ParseAddresses(IEnumerable<string>? raw)
    {
        if (raw is null)
        {
            return Array.Empty<IPAddress>();
        }

        var addresses = new List<IPAddress>();
        foreach (var text in raw)
        {
            if (IPAddress.TryParse(text, out var address))
            {
                addresses.Add(address);
            }
        }

        return addresses;
    }

    /// <summary>
    /// Strips the service type off a fully qualified instance name, leaving
    /// <c>A1B2C3D4E5F6@HomePod mini</c> or <c>HomePod mini</c>.
    /// </summary>
    private static string ExtractInstanceName(string? serviceName, string key, string? displayName)
    {
        foreach (var candidate in new[] { serviceName, key })
        {
            if (string.IsNullOrWhiteSpace(candidate))
            {
                continue;
            }

            var trimmed = candidate.Trim().TrimEnd('.');

            foreach (var suffix in new[] { "_raop._tcp.local", "_airplay._tcp.local" })
            {
                var index = trimmed.IndexOf(suffix, StringComparison.OrdinalIgnoreCase);
                if (index > 0)
                {
                    return DnsLabel.Unescape(trimmed[..index].TrimEnd('.'));
                }
            }
        }

        return DnsLabel.Unescape(displayName);
    }

    private static IReadOnlyDictionary<string, string> MergeTxt(
        IReadOnlyList<IReadOnlyDictionary<string, string>>? properties)
    {
        if (properties is null || properties.Count == 0)
        {
            return MdnsServiceRecord.EmptyTxt;
        }

        var merged = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var set in properties)
        {
            foreach (var (key, value) in set)
            {
                merged[key] = value;
            }
        }

        return merged;
    }
}
