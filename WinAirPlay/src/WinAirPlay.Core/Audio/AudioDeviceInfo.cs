namespace WinAirPlay.Core.Audio;

public sealed record AudioDeviceInfo(string Id, string Name, bool IsDefault)
{
    public override string ToString() => IsDefault ? $"{Name} (varsayılan)" : Name;
}

public interface IAudioDeviceEnumerator
{
    /// <summary>Active render (playback) endpoints that can be captured in loopback mode.</summary>
    IReadOnlyList<AudioDeviceInfo> GetRenderDevices();

    AudioDeviceInfo? GetDefaultRenderDevice();
}
