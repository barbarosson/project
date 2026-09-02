using NAudio.CoreAudioApi;

namespace WinAirPlay.Core.Audio;

/// <summary>
/// Silences the PC's render endpoint for the duration of an AirPlay session, then puts it back
/// exactly as it was. Pair with process-loopback capture: device-loopback would go silent too.
/// </summary>
public interface ILocalOutputSilencer : IDisposable
{
    bool IsSilenced { get; }

    void Silence(string? deviceId);

    void Restore();
}

public sealed class WasapiLocalOutputSilencer : ILocalOutputSilencer
{
    private readonly object _sync = new();
    private string? _deviceId;
    private bool _weMuted;
    private bool _disposed;

    public bool IsSilenced { get; private set; }

    public void Silence(string? deviceId)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        lock (_sync)
        {
            if (IsSilenced)
            {
                return;
            }

            using var device = OpenRenderDevice(deviceId);
            _deviceId = device.ID;
            _weMuted = !device.AudioEndpointVolume.Mute;

            if (_weMuted)
            {
                device.AudioEndpointVolume.Mute = true;
            }

            IsSilenced = true;
        }
    }

    public void Restore()
    {
        lock (_sync)
        {
            if (!IsSilenced)
            {
                return;
            }

            var shouldUnmute = _weMuted;
            var deviceId = _deviceId;
            var restored = false;

            try
            {
                if (shouldUnmute)
                {
                    restored = TrySetMute(deviceId, mute: false);
                }
            }
            finally
            {
                IsSilenced = false;
                _weMuted = false;
                _deviceId = null;
            }

            if (!restored && shouldUnmute)
            {
                TryUnmuteFallback(deviceId);
            }
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        Restore();
        _disposed = true;
    }

    /// <summary>
    /// Opens a fresh MMDevice for each call so mute/unmute never depends on a COM object that
    /// belonged to a now-dead STA apartment.
    /// </summary>
    private static bool TrySetMute(string? deviceId, bool mute)
    {
        try
        {
            using var device = OpenRenderDevice(deviceId);
            device.AudioEndpointVolume.Mute = mute;
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    private static void TryUnmuteFallback(string? deviceId)
    {
        if (!string.IsNullOrWhiteSpace(deviceId) && TrySetMute(deviceId, mute: false))
        {
            return;
        }

        TrySetMute(null, mute: false);
    }

    internal static MMDevice OpenRenderDevice(string? deviceId)
    {
        var enumerator = new MMDeviceEnumerator();

        try
        {
            if (!string.IsNullOrWhiteSpace(deviceId))
            {
                return enumerator.GetDevice(deviceId);
            }

            if (!enumerator.HasDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia))
            {
                throw new InvalidOperationException("Sistemde varsayılan bir ses çıkış cihazı bulunamadı.");
            }

            return enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
        }
        finally
        {
            enumerator.Dispose();
        }
    }
}
