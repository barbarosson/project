namespace WinAirPlay.Core.Audio;

/// <summary>
/// A source of PCM audio blocks. Implementations normalise whatever the hardware delivers into
/// <see cref="Format"/> so downstream stages never have to resample.
/// </summary>
public interface IAudioCaptureSource : IDisposable
{
    /// <summary>Format of every block raised through <see cref="FrameCaptured"/>.</summary>
    AudioFormat Format { get; }

    bool IsCapturing { get; }

    event EventHandler<AudioFrameEventArgs>? FrameCaptured;

    event EventHandler<CaptureStoppedEventArgs>? CaptureStopped;

    void Start();

    void Stop();
}
