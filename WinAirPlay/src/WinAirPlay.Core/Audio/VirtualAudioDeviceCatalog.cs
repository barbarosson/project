namespace WinAirPlay.Core.Audio;

/// <summary>
/// Recognises third-party virtual render endpoints that apps can play into (VB-Audio Cable,
/// VoiceMeeter VAIO, Virtual Audio Cable). Those are the only devices that can take the Windows
/// mix without muting the physical speakers.
/// </summary>
public static class VirtualAudioDeviceCatalog
{
    public static AudioDeviceInfo? Pick(
        IEnumerable<AudioDeviceInfo> devices,
        string? preferredId = null)
    {
        var list = devices as IList<AudioDeviceInfo> ?? devices.ToList();
        if (list.Count == 0)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(preferredId))
        {
            var preferred = list.FirstOrDefault(device =>
                string.Equals(device.Id, preferredId, StringComparison.OrdinalIgnoreCase)
                && IsVirtualRenderDevice(device.Name));

            if (preferred is not null)
            {
                return preferred;
            }
        }

        return list
            .Where(device => IsVirtualRenderDevice(device.Name))
            .OrderBy(device => Rank(device.Name))
            .ThenBy(device => device.Name, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();
    }

    public static bool IsVirtualRenderDevice(string? friendlyName)
    {
        if (string.IsNullOrWhiteSpace(friendlyName))
        {
            return false;
        }

        var name = friendlyName.Trim().ToLowerInvariant();

        if (name.Contains("cable input", StringComparison.Ordinal))
        {
            return true;
        }

        if (name.Contains("voicemeeter", StringComparison.Ordinal)
            && name.Contains("input", StringComparison.Ordinal))
        {
            return true;
        }

        if (name.Contains("vb-audio", StringComparison.Ordinal)
            && (name.Contains("cable", StringComparison.Ordinal)
                || name.Contains("voicemeeter", StringComparison.Ordinal)
                || name.Contains("point", StringComparison.Ordinal)))
        {
            return true;
        }

        if (name.Contains("virtual audio cable", StringComparison.Ordinal))
        {
            return true;
        }

        return false;
    }

    /// <summary>Lower is better. Prefers the classic VB-Cable playback endpoint.</summary>
    private static int Rank(string friendlyName)
    {
        var name = friendlyName.ToLowerInvariant();

        if (name.Equals("cable input", StringComparison.Ordinal))
        {
            return 0;
        }

        if (name.Contains("cable input", StringComparison.Ordinal))
        {
            return 1;
        }

        if (name.Contains("voicemeeter vaio", StringComparison.Ordinal)
            || name.Equals("voicemeeter input", StringComparison.Ordinal))
        {
            return 2;
        }

        if (name.Contains("voicemeeter", StringComparison.Ordinal))
        {
            return 3;
        }

        return 4;
    }
}
