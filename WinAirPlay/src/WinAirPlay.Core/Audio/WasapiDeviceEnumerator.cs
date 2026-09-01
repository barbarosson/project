using NAudio.CoreAudioApi;

namespace WinAirPlay.Core.Audio;

public sealed class WasapiDeviceEnumerator : IAudioDeviceEnumerator
{
    public IReadOnlyList<AudioDeviceInfo> GetRenderDevices()
    {
        using var enumerator = new MMDeviceEnumerator();
        var defaultId = TryGetDefaultRenderDeviceId(enumerator);

        var devices = new List<AudioDeviceInfo>();
        foreach (var device in enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active))
        {
            using (device)
            {
                devices.Add(new AudioDeviceInfo(device.ID, device.FriendlyName, device.ID == defaultId));
            }
        }

        return devices;
    }

    public AudioDeviceInfo? GetDefaultRenderDevice()
    {
        using var enumerator = new MMDeviceEnumerator();
        if (!enumerator.HasDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia))
        {
            return null;
        }

        using var device = enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
        return new AudioDeviceInfo(device.ID, device.FriendlyName, true);
    }

    private static string? TryGetDefaultRenderDeviceId(MMDeviceEnumerator enumerator)
    {
        if (!enumerator.HasDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia))
        {
            return null;
        }

        using var device = enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
        return device.ID;
    }
}
