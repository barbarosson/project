using WinAirPlay.Core.Raop;

namespace WinAirPlay.Core.Alac;

/// <summary>
/// Produces valid ALAC frames using the format's escape hatch for uncompressed samples: the
/// bitstream and the magic cookie are exactly what a receiver expects, but the samples are stored
/// verbatim instead of being run through the predictor and Rice coder.
/// </summary>
/// <remarks>
/// This buys compatibility, not bandwidth. An uncompressed frame is three bytes larger than the
/// PCM it carries, so the wire cost stays around 1.4 Mbit/s until a real compressor replaces it.
/// </remarks>
public sealed class AlacUncompressedEncoder : IRaopPayloadEncoder
{
    /// <summary>Element tag, unused header fields, then the "not compressed" flag.</summary>
    private const int HeaderBits = 23;

    /// <summary>The 3-bit element tag that closes a frame.</summary>
    private const uint EndOfFrameTag = 7;

    private const int TrailerBits = 3;

    private readonly RaopAudioParameters _audio;

    public AlacUncompressedEncoder(RaopAudioParameters? audio = null)
    {
        _audio = audio ?? RaopAudioParameters.Default;

        if (_audio.Channels != 2 || _audio.BitDepth != 16)
        {
            throw new ArgumentException(
                $"Yalnızca 16-bit stereo destekleniyor, {_audio.BitDepth}-bit/{_audio.Channels}ch istendi.",
                nameof(audio));
        }
    }

    public RaopStreamCodec Codec => RaopStreamCodec.AppleLossless;

    public int GetMaxEncodedLength(int pcmByteCount) =>
        (HeaderBits + (pcmByteCount * 8) + TrailerBits + 7) / 8;

    public int Encode(ReadOnlySpan<byte> pcm, Span<byte> destination)
    {
        if (pcm.Length % 4 != 0)
        {
            throw new ArgumentException("16-bit stereo blok 4'ün katı olmalı.", nameof(pcm));
        }

        var length = GetMaxEncodedLength(pcm.Length);

        if (destination.Length < length)
        {
            throw new ArgumentException(
                $"Hedef en az {length} bayt olmalı, {destination.Length} bayt verildi.", nameof(destination));
        }

        var writer = new AlacBitWriter(destination[..length]);

        writer.Write(1, 3);   // element tag: a stereo channel pair
        writer.Write(0, 4);   // unused
        writer.Write(0, 8);   // unused
        writer.Write(0, 4);   // unused
        writer.Write(0, 1);   // no explicit frame size; the magic cookie already carries it
        writer.Write(0, 2);   // no wasted bytes
        writer.Write(1, 1);   // samples follow uncompressed

        for (var i = 0; i < pcm.Length; i += 4)
        {
            // Left then right, each byte-swapped to big endian.
            writer.WriteByte(pcm[i + 1]);
            writer.WriteByte(pcm[i]);
            writer.WriteByte(pcm[i + 3]);
            writer.WriteByte(pcm[i + 2]);
        }

        writer.Write(EndOfFrameTag, TrailerBits);

        return writer.ByteLength;
    }
}
