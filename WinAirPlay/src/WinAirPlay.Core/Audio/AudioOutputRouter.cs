namespace WinAirPlay.Core.Audio;

public interface IAudioOutputRouter : IDisposable
{
    AudioOutputPlan CreatePlan(AudioRoutingRequest request);

    bool Apply(AudioOutputPlan plan);

    void Restore();
}

/// <summary>
/// When a virtual cable is present, makes it the Windows default output for the session so the
/// mix never reaches the physical speakers. Otherwise leaves the default device alone (mute
/// compatibility is handled by <see cref="ILocalOutputSilencer"/>).
/// </summary>
public sealed class AudioOutputRouter : IAudioOutputRouter
{
    private static readonly AudioDeviceRole[] Roles =
    [
        AudioDeviceRole.Console,
        AudioDeviceRole.Multimedia,
        AudioDeviceRole.Communications,
    ];

    private readonly IAudioDeviceEnumerator _devices;
    private readonly IDefaultAudioEndpointPolicy _policy;
    private readonly object _sync = new();
    private readonly Dictionary<AudioDeviceRole, string?> _previous = new();
    private bool _redirected;
    private bool _disposed;

    public AudioOutputRouter(
        IAudioDeviceEnumerator? devices = null,
        IDefaultAudioEndpointPolicy? policy = null)
    {
        _devices = devices ?? new WasapiDeviceEnumerator();
        _policy = policy ?? new PolicyConfigAudioEndpoint();
    }

    public AudioOutputPlan CreatePlan(AudioRoutingRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var devices = _devices.GetRenderDevices();
        var currentDefault = _devices.GetDefaultRenderDevice()?.Id;
        var virtualDevice = VirtualAudioDeviceCatalog.Pick(
            devices,
            request.PreferredVirtualDeviceId ?? request.CaptureDeviceId);

        var wantsRedirect = request.Mode is AudioRoutingMode.Auto or AudioRoutingMode.VirtualCable;

        if (wantsRedirect && virtualDevice is not null)
        {
            return AudioOutputPlan.Redirect(virtualDevice, currentDefault);
        }

        if (request.MuteLocalSpeakers || request.Mode == AudioRoutingMode.MuteSpeakers)
        {
            return AudioOutputPlan.Mute(request.CaptureDeviceId, request.FollowWindowsVolume);
        }

        return AudioOutputPlan.Passthrough(request.CaptureDeviceId, request.FollowWindowsVolume);
    }

    public bool Apply(AudioOutputPlan plan)
    {
        ArgumentNullException.ThrowIfNull(plan);
        ObjectDisposedException.ThrowIf(_disposed, this);

        lock (_sync)
        {
            RestoreLocked();

            if (!plan.SwitchDefaultEndpoint || string.IsNullOrWhiteSpace(plan.VirtualDeviceId))
            {
                return true;
            }

            try
            {
                foreach (var role in Roles)
                {
                    _previous[role] = _policy.GetDefaultRenderId(role);
                }

                foreach (var role in Roles)
                {
                    _policy.SetDefaultRender(plan.VirtualDeviceId, role);
                }

                _redirected = true;
                return true;
            }
            catch (Exception)
            {
                RestoreLocked();
                return false;
            }
        }
    }

    public void Restore()
    {
        lock (_sync)
        {
            RestoreLocked();
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

    private void RestoreLocked()
    {
        if (!_redirected)
        {
            _previous.Clear();
            return;
        }

        foreach (var role in Roles)
        {
            if (!_previous.TryGetValue(role, out var deviceId) || string.IsNullOrWhiteSpace(deviceId))
            {
                continue;
            }

            try
            {
                _policy.SetDefaultRender(deviceId, role);
            }
            catch (Exception)
            {
                // Best-effort: never block shutdown on a policy failure.
            }
        }

        _previous.Clear();
        _redirected = false;
    }
}
