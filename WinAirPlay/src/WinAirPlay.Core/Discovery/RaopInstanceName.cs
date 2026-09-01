namespace WinAirPlay.Core.Discovery;

/// <summary>
/// RAOP instances are published as <c>&lt;hardware id&gt;@&lt;friendly name&gt;</c>, for example
/// <c>A1B2C3D4E5F6@HomePod mini</c>. AirPlay instances carry only the friendly name.
/// </summary>
public static class RaopInstanceName
{
    public static (string? DeviceId, string Name) Parse(string instanceName)
    {
        if (string.IsNullOrWhiteSpace(instanceName))
        {
            return (null, string.Empty);
        }

        var trimmed = instanceName.Trim();
        var separator = trimmed.IndexOf('@');

        if (separator <= 0 || separator == trimmed.Length - 1)
        {
            return (null, trimmed);
        }

        var id = NormalizeDeviceId(trimmed[..separator]);
        var name = trimmed[(separator + 1)..].Trim();

        return (id, name.Length == 0 ? trimmed : name);
    }

    /// <summary>Renders a hardware id as upper-case colon-separated hex so both services agree on it.</summary>
    public static string? NormalizeDeviceId(string? deviceId)
    {
        if (string.IsNullOrWhiteSpace(deviceId))
        {
            return null;
        }

        var compact = deviceId.Replace(":", string.Empty).Replace("-", string.Empty).Trim();

        if (compact.Length != 12 || !compact.All(Uri.IsHexDigit))
        {
            return deviceId.Trim().ToUpperInvariant();
        }

        var upper = compact.ToUpperInvariant();
        return string.Join(':', Enumerable.Range(0, 6).Select(i => upper.Substring(i * 2, 2)));
    }
}
