namespace WinAirPlay.Core.Audio;

/// <summary>
/// How Windows audio reaches HomePod. Auto prefers a third-party virtual cable so the PC
/// speakers stay unmuted; without one it falls back to muting the render endpoint.
/// </summary>
public enum AudioRoutingMode
{
    Auto = 0,
    VirtualCable = 1,
    MuteSpeakers = 2,
}

public enum AudioRoutingKind
{
    /// <summary>Default Windows output is a virtual cable; physical speakers are not in the mix.</summary>
    Redirect,

    /// <summary>Speakers stay the default device and are muted for the session.</summary>
    Mute,

    /// <summary>Speakers stay live; HomePod is a copy. Used only when the user refuses mute.</summary>
    Passthrough,
}

public sealed record AudioRoutingRequest(
    AudioRoutingMode Mode,
    string? CaptureDeviceId,
    string? PreferredVirtualDeviceId,
    bool MuteLocalSpeakers,
    bool FollowWindowsVolume);

public sealed record AudioOutputPlan(
    AudioRoutingKind Kind,
    string? CaptureDeviceId,
    string? VirtualDeviceId,
    string? VirtualDeviceName,
    bool MuteLocalSpeakers,
    bool IndependentOfEndpointVolume,
    bool ApplyEndpointVolume,
    bool SwitchDefaultEndpoint)
{
    public static AudioOutputPlan Mute(string? captureDeviceId, bool followWindowsVolume) => new(
        AudioRoutingKind.Mute,
        captureDeviceId,
        VirtualDeviceId: null,
        VirtualDeviceName: null,
        MuteLocalSpeakers: true,
        IndependentOfEndpointVolume: true,
        ApplyEndpointVolume: followWindowsVolume,
        SwitchDefaultEndpoint: false);

    public static AudioOutputPlan Passthrough(string? captureDeviceId, bool followWindowsVolume) => new(
        AudioRoutingKind.Passthrough,
        captureDeviceId,
        VirtualDeviceId: null,
        VirtualDeviceName: null,
        MuteLocalSpeakers: false,
        IndependentOfEndpointVolume: false,
        ApplyEndpointVolume: followWindowsVolume,
        SwitchDefaultEndpoint: false);

    public static AudioOutputPlan Redirect(AudioDeviceInfo virtualDevice, string? currentDefaultId) => new(
        AudioRoutingKind.Redirect,
        virtualDevice.Id,
        virtualDevice.Id,
        virtualDevice.Name,
        MuteLocalSpeakers: false,
        IndependentOfEndpointVolume: false,
        ApplyEndpointVolume: false,
        SwitchDefaultEndpoint: !string.Equals(virtualDevice.Id, currentDefaultId, StringComparison.OrdinalIgnoreCase));
}
