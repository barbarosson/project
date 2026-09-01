namespace WinAirPlay.Core.Raop;

public enum RaopStreamCodec
{
    /// <summary>Uncompressed 16-bit PCM, announced as L16. Simplest path, ~1.4 Mbit/s.</summary>
    RawPcm,

    /// <summary>Apple Lossless, what iTunes and iOS actually send.</summary>
    AppleLossless,
}

/// <summary>
/// The media description that goes into the ANNOUNCE SDP and the payload type that must then be
/// stamped on every RTP packet.
/// </summary>
public sealed record RaopMediaFormat(
    RaopStreamCodec Codec,
    int PayloadType,
    string RtpMap,
    string? FmtpParameters)
{
    /// <summary>RTP L16 is defined as network byte order, unlike the little-endian PCM Windows gives us.</summary>
    public bool RequiresBigEndianPayload => Codec == RaopStreamCodec.RawPcm;

    public static RaopMediaFormat For(RaopStreamCodec codec, RaopAudioParameters audio) => codec switch
    {
        RaopStreamCodec.RawPcm => RawPcm(audio),
        RaopStreamCodec.AppleLossless => AppleLossless(audio),
        _ => throw new ArgumentOutOfRangeException(nameof(codec), codec, null),
    };

    public static RaopMediaFormat RawPcm(RaopAudioParameters audio) => new(
        RaopStreamCodec.RawPcm,
        PayloadType: 96,
        RtpMap: $"L16/{audio.SampleRate}/{audio.Channels}",
        FmtpParameters: null);

    public static RaopMediaFormat AppleLossless(RaopAudioParameters audio) => new(
        RaopStreamCodec.AppleLossless,
        PayloadType: 96,
        RtpMap: "AppleLossless",
        FmtpParameters: audio.ToFmtpParameters());
}
