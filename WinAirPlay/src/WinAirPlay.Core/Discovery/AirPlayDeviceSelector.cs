using System.Net;

namespace WinAirPlay.Core.Discovery;

/// <summary>
/// Resolves a user-supplied token to a discovered device. Names are not unique on a real network
/// (two receivers can both be called "Salon"), so an index, IP address or hardware id also works.
/// </summary>
public static class AirPlayDeviceSelector
{
    public static AirPlayDevice? Find(IReadOnlyList<AirPlayDevice> devices, string? token)
    {
        ArgumentNullException.ThrowIfNull(devices);

        if (devices.Count == 0 || string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var needle = token.Trim();

        if (int.TryParse(needle, out var index))
        {
            return index >= 1 && index <= devices.Count ? devices[index - 1] : null;
        }

        if (IPAddress.TryParse(needle, out var address))
        {
            return devices.FirstOrDefault(d => d.Addresses.Contains(address));
        }

        var deviceId = RaopInstanceName.NormalizeDeviceId(needle);
        var byId = devices.FirstOrDefault(d =>
            d.DeviceId is not null && string.Equals(d.DeviceId, deviceId, StringComparison.OrdinalIgnoreCase));

        if (byId is not null)
        {
            return byId;
        }

        var exactName = devices
            .Where(d => string.Equals(d.Name, needle, StringComparison.CurrentCultureIgnoreCase))
            .ToList();

        if (exactName.Count == 1)
        {
            return exactName[0];
        }

        var partialName = devices
            .Where(d => d.Name.Contains(needle, StringComparison.CurrentCultureIgnoreCase))
            .ToList();

        return partialName.Count == 1 ? partialName[0] : null;
    }
}
