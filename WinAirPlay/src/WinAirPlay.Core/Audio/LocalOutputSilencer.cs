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
    private MMDevice? _device;
    private bool _wasMuted;
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

            _device = OpenRenderDevice(deviceId);
            _wasMuted = _device.AudioEndpointVolume.Mute;

            if (!_wasMuted)
            {
                _device.AudioEndpointVolume.Mute = true;
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

            try
            {
                if (_device is not null && !_wasMuted)
                {
                    _device.AudioEndpointVolume.Mute = false;
                }
            }
            catch (Exception)
            {
                // The device may have been unplugged while we were streaming.
            }
            finally
            {
                _device?.Dispose();
                _device = null;
                IsSilenced = false;
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
