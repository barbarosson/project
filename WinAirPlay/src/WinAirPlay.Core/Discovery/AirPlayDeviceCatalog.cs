using System.Net;

namespace WinAirPlay.Core.Discovery;

/// <summary>
/// Merges raw mDNS records into devices. A HomePod answers on both <c>_raop._tcp</c> and
/// <c>_airplay._tcp</c>, sometimes on several interfaces, so records are grouped by hardware id.
/// </summary>
public static class AirPlayDeviceCatalog
{
    public static IReadOnlyList<AirPlayDevice> Build(IEnumerable<MdnsServiceRecord> records)
    {
        ArgumentNullException.ThrowIfNull(records);

        var groups = new Dictionary<string, List<MdnsServiceRecord>>(StringComparer.OrdinalIgnoreCase);

        foreach (var record in records)
        {
            var key = GroupKey(record);
            if (!groups.TryGetValue(key, out var group))
            {
                group = new List<MdnsServiceRecord>();
                groups[key] = group;
            }

            group.Add(record);
        }

        return groups.Values
            .Select(Merge)
            .Where(device => device.Addresses.Count > 0)
            .OrderByDescending(device => device.SupportsAudioStreaming)
            .ThenBy(device => device.Name, StringComparer.CurrentCultureIgnoreCase)
            .ToList();
    }

    private static string GroupKey(MdnsServiceRecord record)
    {
        var (deviceId, name) = RaopInstanceName.Parse(record.InstanceName);

        deviceId ??= RaopInstanceName.NormalizeDeviceId(
            RaopTxtRecordParser.ReadString(record.Txt, "deviceid"));

        if (!string.IsNullOrEmpty(deviceId))
        {
            return $"id:{deviceId}";
        }

        return !string.IsNullOrEmpty(name)
            ? $"name:{name.ToLowerInvariant()}"
            : $"addr:{record.PrimaryAddress}";
    }

    private static AirPlayDevice Merge(List<MdnsServiceRecord> group)
    {
        var raop = group.FirstOrDefault(r => r.Kind == AirPlayServiceKind.Raop);
        var airplay = group.FirstOrDefault(r => r.Kind == AirPlayServiceKind.AirPlay);

        var (raopDeviceId, raopName) = raop is null
            ? (null, null)
            : RaopInstanceName.Parse(raop.InstanceName);

        var deviceId =
            raopDeviceId
            ?? RaopInstanceName.NormalizeDeviceId(RaopTxtRecordParser.ReadString(
                airplay?.Txt ?? MdnsServiceRecord.EmptyTxt, "deviceid"))
            ?? RaopInstanceName.NormalizeDeviceId(RaopTxtRecordParser.ReadString(
                raop?.Txt ?? MdnsServiceRecord.EmptyTxt, "deviceid"));

        var name =
            FirstNonEmpty(airplay?.InstanceName, raopName, group[0].InstanceName)
            ?? deviceId
            ?? "Bilinmeyen cihaz";

        return new AirPlayDevice
        {
            Name = name,
            DeviceId = deviceId,
            Addresses = MergeAddresses(group),
            RaopPort = raop?.Port,
            AirPlayPort = airplay?.Port,
            Capabilities = RaopTxtRecordParser.Parse(raop?.Txt),
            RaopTxt = raop?.Txt ?? MdnsServiceRecord.EmptyTxt,
            AirPlayTxt = airplay?.Txt ?? MdnsServiceRecord.EmptyTxt,
        };
    }

    private static IReadOnlyList<IPAddress> MergeAddresses(List<MdnsServiceRecord> group)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var addresses = new List<IPAddress>();

        foreach (var address in group.SelectMany(r => r.Addresses))
        {
            if (seen.Add(address.ToString()))
            {
                addresses.Add(address);
            }
        }

        addresses.Sort(static (left, right) =>
        {
            var leftIsV4 = left.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork;
            var rightIsV4 = right.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork;
            return leftIsV4 == rightIsV4 ? 0 : leftIsV4 ? -1 : 1;
        });

        return addresses;
    }

    private static string? FirstNonEmpty(params string?[] candidates) =>
        candidates.FirstOrDefault(c => !string.IsNullOrWhiteSpace(c))?.Trim();
}
