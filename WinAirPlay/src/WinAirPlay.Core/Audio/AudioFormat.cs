namespace WinAirPlay.Core.Audio;

/// <summary>
/// Describes an interleaved, little-endian PCM stream.
/// </summary>
public sealed record AudioFormat(int SampleRate, int BitsPerSample, int Channels)
{
    /// <summary>44.1 kHz / 16-bit / stereo: the format every AirPlay (RAOP) receiver accepts.</summary>
    public static readonly AudioFormat AirPlay = new(44100, 16, 2);

    public int BytesPerSample => BitsPerSample / 8;

    /// <summary>Size of one sample frame (one sample for every channel).</summary>
    public int BytesPerFrame => BytesPerSample * Channels;

    public int BytesPerSecond => SampleRate * BytesPerFrame;

    public int FrameCountOf(int byteCount) => byteCount / BytesPerFrame;

    public TimeSpan DurationOf(long byteCount) =>
        TimeSpan.FromSeconds((double)byteCount / BytesPerSecond);

    public int BytesFor(TimeSpan duration) =>
        (int)Math.Round(duration.TotalSeconds * SampleRate) * BytesPerFrame;

    public override string ToString() => $"{SampleRate} Hz / {BitsPerSample}-bit / {Channels}ch";
}
