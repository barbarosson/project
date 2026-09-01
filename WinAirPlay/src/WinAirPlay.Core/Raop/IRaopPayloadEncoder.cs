using WinAirPlay.Core.Alac;

namespace WinAirPlay.Core.Raop;

/// <summary>
/// Turns a block of captured little-endian PCM into the payload of a single RTP audio packet.
/// </summary>
public interface IRaopPayloadEncoder
{
    RaopStreamCodec Codec { get; }

    /// <summary>Upper bound on the encoded size, used to size the packet buffer once.</summary>
    int GetMaxEncodedLength(int pcmByteCount);

    /// <returns>Number of bytes written to <paramref name="destination"/>.</returns>
    int Encode(ReadOnlySpan<byte> pcm, Span<byte> destination);
}

public static class RaopPayloadEncoder
{
    public static IRaopPayloadEncoder Create(
        RaopMediaFormat format,
        RaopAudioParameters audio,
        bool? forceBigEndianPcm = null)
    {
        ArgumentNullException.ThrowIfNull(format);
        ArgumentNullException.ThrowIfNull(audio);

        return format.Codec switch
        {
            RaopStreamCodec.RawPcm => new PcmPassthroughEncoder(
                forceBigEndianPcm ?? format.RequiresBigEndianPayload),
            RaopStreamCodec.AppleLossless => new AlacUncompressedEncoder(audio),
            _ => throw new ArgumentOutOfRangeException(nameof(format), format.Codec, null),
        };
    }
}

/// <summary>
/// Sends the captured samples as-is, swapping each 16-bit sample when the wire format is L16,
/// which RTP defines as network byte order.
/// </summary>
public sealed class PcmPassthroughEncoder : IRaopPayloadEncoder
{
    private readonly bool _swapSampleBytes;

    public PcmPassthroughEncoder(bool swapSampleBytes = true) => _swapSampleBytes = swapSampleBytes;

    public RaopStreamCodec Codec => RaopStreamCodec.RawPcm;

    public int GetMaxEncodedLength(int pcmByteCount) => pcmByteCount;

    public int Encode(ReadOnlySpan<byte> pcm, Span<byte> destination)
    {
        if (_swapSampleBytes)
        {
            PcmByteOrder.SwapSampleBytes(pcm, destination);
        }
        else
        {
            pcm.CopyTo(destination);
        }

        return pcm.Length;
    }
}
