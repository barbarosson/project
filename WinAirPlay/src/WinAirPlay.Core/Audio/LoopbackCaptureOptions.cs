namespace WinAirPlay.Core.Audio;

public sealed class LoopbackCaptureOptions
{
    /// <summary>WASAPI endpoint id to capture. <c>null</c> uses the current default render device.</summary>
    public string? DeviceId { get; set; }

    /// <summary>Format delivered to consumers, regardless of what the endpoint runs at.</summary>
    public AudioFormat TargetFormat { get; set; } = AudioFormat.AirPlay;

    /// <summary>
    /// Sample frames per emitted block. 352 is the packet size AirPlay expects, so keeping it here
    /// means later phases can hand blocks straight to the ALAC encoder.
    /// </summary>
    public int SampleFramesPerBlock { get; set; } = 352;

    /// <summary>How much converted audio may queue up before the oldest data is dropped.</summary>
    public TimeSpan BufferDuration { get; set; } = TimeSpan.FromSeconds(2);

    /// <summary>
    /// WASAPI loopback goes silent (delivers nothing) when no application is playing. Enable this to
    /// emit silent blocks instead, which a live AirPlay stream needs to stay in sync.
    /// </summary>
    public bool EmitSilenceWhenIdle { get; set; }

    /// <summary>Idle time before <see cref="EmitSilenceWhenIdle"/> starts filling the gap.</summary>
    public TimeSpan SilenceThreshold { get; set; } = TimeSpan.FromMilliseconds(120);

    /// <summary>
    /// Capture at the process mixer, before endpoint mute/volume. Required when the local
    /// speakers will be silenced for the duration of an AirPlay session.
    /// </summary>
    public bool IndependentOfEndpointVolume { get; set; }

    /// <summary>
    /// Multiply captured 16-bit PCM by the render endpoint's Windows volume scalar. Used with
    /// process loopback so volume keys still reach HomePod after the speakers are muted.
    /// </summary>
    public bool ApplyEndpointVolume { get; set; }

    /// <summary>
    /// When we muted the endpoint ourselves, ignore the mute flag and only follow the slider.
    /// </summary>
    public bool IgnoreEndpointMute { get; set; }
}
