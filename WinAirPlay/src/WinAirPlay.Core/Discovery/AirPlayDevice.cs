using System.Net;

namespace WinAirPlay.Core.Discovery;

/// <summary>
/// An AirPlay receiver found on the LAN, merged from its <c>_raop._tcp</c> and
/// <c>_airplay._tcp</c> announcements.
/// </summary>
public sealed class AirPlayDevice
{
    public required string Name { get; init; }

    /// <summary>Hardware id in <c>AA:BB:CC:DD:EE:FF</c> form; the RTSP handshake needs it.</summary>
    public string? DeviceId { get; init; }

    public required IReadOnlyList<IPAddress> Addresses { get; init; }

    /// <summary>RTSP port used for ANNOUNCE / SETUP / RECORD. Null when the device only advertises AirPlay.</summary>
    public int? RaopPort { get; init; }

    public int? AirPlayPort { get; init; }

    public RaopCapabilities Capabilities { get; init; } = RaopCapabilities.Unknown;

    public IReadOnlyDictionary<string, string> RaopTxt { get; init; } = MdnsServiceRecord.EmptyTxt;

    public IReadOnlyDictionary<string, string> AirPlayTxt { get; init; } = MdnsServiceRecord.EmptyTxt;

    public IPAddress? Address => AddressPreference.Pick(Addresses);

    public string? Model =>
        Capabilities.Model ?? RaopTxtRecordParser.ReadString(AirPlayTxt, "model");

    public string? FirmwareVersion =>
        Capabilities.ServerVersion ?? RaopTxtRecordParser.ReadString(AirPlayTxt, "srcvers");

    /// <summary>True when this device can accept an audio stream from Phase 3 onwards.</summary>
    public bool SupportsAudioStreaming => RaopPort is > 0;

    public bool IsHomePod =>
        Capabilities.IsHomePod ||
        Model?.StartsWith("AudioAccessory", StringComparison.OrdinalIgnoreCase) == true;

    /// <summary>Friendly label for UI lists, e.g. <c>Salon (2) · HomePod</c>.</summary>
    public string DisplayName => AirPlayProductNames.FormatDisplayName(Name, Model, IsHomePod);

    /// <summary>Endpoint the RTSP client connects to in Phase 3.</summary>
    public IPEndPoint? RtspEndPoint =>
        Address is { } address && RaopPort is { } port ? new IPEndPoint(address, port) : null;

    public override string ToString() =>
        $"{DisplayName} @ {Address?.ToString() ?? "?"}:{RaopPort?.ToString() ?? "-"}";
}
