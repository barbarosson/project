namespace WinAirPlay.Core.Discovery;

/// <summary>Values advertised in the RAOP <c>cn</c> TXT key.</summary>
public enum RaopCodec
{
    Pcm = 0,
    Alac = 1,
    Aac = 2,
    AacEld = 3,
}

/// <summary>Values advertised in the RAOP <c>et</c> TXT key.</summary>
public enum RaopEncryption
{
    None = 0,
    RsaAes = 1,
    FairPlay = 2,
    Mfisap = 3,
    FairPlaySapV25 = 4,
    Auth = 5,
}

/// <summary>
/// What a RAOP receiver says it accepts. Phase 3 picks the RTSP handshake variant from this, and
/// Phase 4 picks the codec and encryption scheme.
/// </summary>
public sealed record RaopCapabilities(
    int SampleRate,
    int SampleSize,
    int Channels,
    IReadOnlyList<RaopCodec> Codecs,
    IReadOnlyList<RaopEncryption> EncryptionTypes,
    bool RequiresPassword,
    string? TransportProtocol,
    int? ProtocolVersion,
    string? ServerVersion,
    string? Model,
    ulong? Features,
    string? PublicKey)
{
    public static RaopCapabilities Unknown { get; } = new(
        44100, 16, 2,
        Array.Empty<RaopCodec>(),
        Array.Empty<RaopEncryption>(),
        RequiresPassword: false,
        TransportProtocol: null,
        ProtocolVersion: null,
        ServerVersion: null,
        Model: null,
        Features: null,
        PublicKey: null);

    public bool SupportsAlac => Codecs.Contains(RaopCodec.Alac);

    public bool SupportsRawPcm => Codecs.Contains(RaopCodec.Pcm);

    /// <summary>True when the receiver refuses unencrypted audio.</summary>
    public bool RequiresEncryption =>
        EncryptionTypes.Count > 0 && !EncryptionTypes.Contains(RaopEncryption.None);

    public bool SupportsRsaAes => EncryptionTypes.Contains(RaopEncryption.RsaAes);

    /// <summary>HomePods report themselves as <c>AudioAccessoryN,M</c>.</summary>
    public bool IsHomePod =>
        Model?.StartsWith("AudioAccessory", StringComparison.OrdinalIgnoreCase) == true;
}
