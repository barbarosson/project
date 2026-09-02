using System.Net;

namespace WinAirPlay.Core.Discovery;

public enum AirPlayServiceKind
{
    /// <summary>Remote Audio Output Protocol — the RTSP endpoint audio is streamed to.</summary>
    Raop,

    /// <summary>AirPlay control service, carries the friendly name and device metadata.</summary>
    AirPlay,
}

public static class AirPlayServiceTypes
{
    public const string Raop = "_raop._tcp.local.";
    public const string AirPlay = "_airplay._tcp.local.";

    public static readonly IReadOnlyList<string> All = new[] { Raop, AirPlay };

    public static AirPlayServiceKind? Classify(string serviceType)
    {
        if (string.IsNullOrWhiteSpace(serviceType))
        {
            return null;
        }

        var normalized = serviceType.Trim().TrimEnd('.');

        if (normalized.EndsWith("_raop._tcp.local", StringComparison.OrdinalIgnoreCase))
        {
            return AirPlayServiceKind.Raop;
        }

        return normalized.EndsWith("_airplay._tcp.local", StringComparison.OrdinalIgnoreCase)
            ? AirPlayServiceKind.AirPlay
            : null;
    }

    /// <summary>Matches fully qualified instance names such as <c>AABB@Room._raop._tcp.local</c>.</summary>
    public static AirPlayServiceKind? ClassifyFromFqdn(string? fqdn)
    {
        if (string.IsNullOrWhiteSpace(fqdn))
        {
            return null;
        }

        var normalized = fqdn.Trim().TrimEnd('.');

        if (normalized.Contains("_raop._tcp.local", StringComparison.OrdinalIgnoreCase))
        {
            return AirPlayServiceKind.Raop;
        }

        return normalized.Contains("_airplay._tcp.local", StringComparison.OrdinalIgnoreCase)
            ? AirPlayServiceKind.AirPlay
            : null;
    }
}

/// <summary>
/// One mDNS service instance, decoupled from the Zeroconf library so the mapping to
/// <see cref="AirPlayDevice"/> can be unit tested without a network.
/// </summary>
public sealed record MdnsServiceRecord(
    AirPlayServiceKind Kind,
    string InstanceName,
    IReadOnlyList<IPAddress> Addresses,
    int Port,
    IReadOnlyDictionary<string, string> Txt)
{
    public static IReadOnlyDictionary<string, string> EmptyTxt { get; } =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

    public IPAddress? PrimaryAddress => AddressPreference.Pick(Addresses);
}

public static class AddressPreference
{
    /// <summary>IPv4 first: AirPlay receivers answer on both, but RTSP setup is simpler over IPv4.</summary>
    public static IPAddress? Pick(IEnumerable<IPAddress> addresses)
    {
        IPAddress? fallback = null;

        foreach (var address in addresses)
        {
            if (address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
            {
                return address;
            }

            fallback ??= address;
        }

        return fallback;
    }
}
