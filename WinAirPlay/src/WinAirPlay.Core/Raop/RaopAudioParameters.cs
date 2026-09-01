namespace WinAirPlay.Core.Raop;

/// <summary>
/// ALAC stream parameters negotiated during ANNOUNCE. The defaults are the ones every AirPlay
/// receiver understands and match the capture format from Phase 1.
/// </summary>
public sealed record RaopAudioParameters(
    int FramesPerPacket = 352,
    int SampleRate = 44100,
    int BitDepth = 16,
    int Channels = 2)
{
    public static readonly RaopAudioParameters Default = new();

    // Rice coding parameters from Apple's reference ALAC encoder; receivers expect these exact
    // values in the fmtp line even though they are encoder-side tuning knobs.
    public const int RiceHistoryMult = 40;
    public const int RiceInitialHistory = 10;
    public const int RiceLimit = 14;
    public const int MaxRun = 255;

    public int BytesPerPacket => FramesPerPacket * Channels * (BitDepth / 8);

    /// <summary>Payload of the fmtp attribute: the ALAC magic cookie in SDP form.</summary>
    public string ToFmtpParameters() => string.Join(' ',
        FramesPerPacket,
        0,               // compatible version
        BitDepth,
        RiceHistoryMult,
        RiceInitialHistory,
        RiceLimit,
        Channels,
        MaxRun,
        0,               // max coded frame size, 0 = unknown
        0,               // average bit rate, 0 = unknown
        SampleRate);
}
