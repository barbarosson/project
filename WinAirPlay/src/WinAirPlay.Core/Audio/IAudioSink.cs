namespace WinAirPlay.Core.Audio;

/// <summary>
/// A consumer of PCM audio blocks: a WAV file today, an AirPlay RTP sender later.
/// </summary>
public interface IAudioSink : IDisposable
{
    /// <summary>Format this sink expects. Must match the source it is attached to.</summary>
    AudioFormat Format { get; }

    void Write(ReadOnlySpan<byte> pcm);
}
