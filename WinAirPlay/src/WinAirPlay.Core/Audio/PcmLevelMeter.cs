using System.Buffers.Binary;

namespace WinAirPlay.Core.Audio;

/// <summary>Normalised (0..1) peak amplitude per channel.</summary>
public readonly record struct PcmLevel(float PeakLeft, float PeakRight)
{
    public static readonly PcmLevel Silent = new(0f, 0f);

    public float Peak => MathF.Max(PeakLeft, PeakRight);

    public bool IsSilent => Peak < 1e-4f;

    /// <summary>Converts a normalised amplitude to dBFS, floored at -96 dB.</summary>
    public static float ToDecibels(float linear) =>
        linear <= 0.0000158f ? -96f : 20f * MathF.Log10(linear);
}

/// <summary>
/// Peak measurement over 16-bit little-endian PCM. Kept free of NAudio so it can be unit tested and
/// reused by the WPF VU meter in Phase 5.
/// </summary>
public static class PcmLevelMeter
{
    public static PcmLevel Measure(ReadOnlySpan<byte> pcm16, int channels)
    {
        if (channels is not (1 or 2))
        {
            throw new ArgumentOutOfRangeException(nameof(channels), channels, "Only mono or stereo is supported.");
        }

        var peakLeft = 0f;
        var peakRight = 0f;
        var sampleIndex = 0;

        for (var offset = 0; offset + 2 <= pcm16.Length; offset += 2)
        {
            var sample = BinaryPrimitives.ReadInt16LittleEndian(pcm16.Slice(offset, 2));
            var magnitude = Math.Abs((float)sample) / short.MaxValue;
            if (magnitude > 1f)
            {
                magnitude = 1f;
            }

            var isLeft = channels == 1 || sampleIndex % 2 == 0;
            if (isLeft)
            {
                peakLeft = MathF.Max(peakLeft, magnitude);
            }
            else
            {
                peakRight = MathF.Max(peakRight, magnitude);
            }

            sampleIndex++;
        }

        return channels == 1 ? new PcmLevel(peakLeft, peakLeft) : new PcmLevel(peakLeft, peakRight);
    }
}
