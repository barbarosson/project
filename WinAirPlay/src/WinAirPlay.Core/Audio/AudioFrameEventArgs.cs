namespace WinAirPlay.Core.Audio;

/// <summary>
/// One fixed-size block of PCM audio.
/// </summary>
/// <remarks>
/// <see cref="Pcm"/> points at a buffer the producer reuses for the next block, so handlers must
/// consume or copy it before returning.
/// </remarks>
public sealed class AudioFrameEventArgs : EventArgs
{
    public AudioFrameEventArgs(ReadOnlyMemory<byte> pcm, AudioFormat format, long sequence, TimeSpan streamPosition)
    {
        Pcm = pcm;
        Format = format;
        Sequence = sequence;
        StreamPosition = streamPosition;
    }

    public ReadOnlyMemory<byte> Pcm { get; }

    public AudioFormat Format { get; }

    /// <summary>Monotonically increasing block counter, starting at 0 for every capture session.</summary>
    public long Sequence { get; }

    /// <summary>Position of the first sample of this block relative to the start of the session.</summary>
    public TimeSpan StreamPosition { get; }

    public int SampleFrameCount => Format.FrameCountOf(Pcm.Length);
}

public sealed class CaptureStoppedEventArgs : EventArgs
{
    public CaptureStoppedEventArgs(Exception? exception) => Exception = exception;

    public Exception? Exception { get; }
}
