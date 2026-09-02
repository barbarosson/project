using WinAirPlay.Core.Rtsp;

namespace WinAirPlay.Core.Raop;

/// <summary>
/// Ports the receiver hands back in the SETUP response, e.g.
/// <c>RTP/AVP/UDP;unicast;mode=record;server_port=6000;control_port=6001;timing_port=6002</c>.
/// </summary>
public sealed record RaopTransport(int AudioPort, int ControlPort, int TimingPort)
{
    public static RaopTransport Parse(string? transportHeader)
    {
        var parameters = RtspMessageParser.ParseParameters(transportHeader);

        var audioPort = ReadPort(parameters, "server_port");
        if (audioPort is null)
        {
            throw new RtspException(
                $"SETUP response did not include server_port. Transport: '{transportHeader}'");
        }

        return new RaopTransport(
            audioPort.Value,
            ReadPort(parameters, "control_port") ?? 0,
            ReadPort(parameters, "timing_port") ?? 0);
    }

    private static int? ReadPort(IReadOnlyDictionary<string, string> parameters, string key)
    {
        if (!parameters.TryGetValue(key, out var raw))
        {
            return null;
        }

        // Ranges such as "6000-6001" are legal; the first port is the one we send to.
        var first = raw.Split('-', StringSplitOptions.RemoveEmptyEntries)[0];
        return int.TryParse(first, out var port) && port is > 0 and <= 65535 ? port : null;
    }
}
