using System.Net;
using System.Text;

namespace WinAirPlay.Core.Raop;

/// <summary>
/// Builds the SDP payload carried by the RAOP ANNOUNCE request. Receivers are strict about line
/// order and the fmtp layout, so this is kept as a pure function that can be asserted on.
/// </summary>
public static class SdpBuilder
{
    public static string BuildAnnounce(
        uint sessionId,
        IPAddress localAddress,
        IPAddress remoteAddress,
        RaopMediaFormat format,
        string? rsaAesKey = null,
        string? aesIv = null)
    {
        ArgumentNullException.ThrowIfNull(localAddress);
        ArgumentNullException.ThrowIfNull(remoteAddress);
        ArgumentNullException.ThrowIfNull(format);

        var addressType = localAddress.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6
            ? "IP6"
            : "IP4";

        var builder = new StringBuilder();
        builder.Append("v=0\r\n");
        builder.Append($"o=iTunes {sessionId} 0 IN {addressType} {localAddress}\r\n");
        builder.Append("s=iTunes\r\n");
        builder.Append($"c=IN {addressType} {remoteAddress}\r\n");
        builder.Append("t=0 0\r\n");
        builder.Append($"m=audio 0 RTP/AVP {format.PayloadType}\r\n");
        builder.Append($"a=rtpmap:{format.PayloadType} {format.RtpMap}\r\n");

        if (format.FmtpParameters is { } fmtp)
        {
            builder.Append($"a=fmtp:{format.PayloadType} {fmtp}\r\n");
        }

        if (!string.IsNullOrEmpty(rsaAesKey))
        {
            builder.Append($"a=rsaaeskey:{rsaAesKey}\r\n");
        }

        if (!string.IsNullOrEmpty(aesIv))
        {
            builder.Append($"a=aesiv:{aesIv}\r\n");
        }

        return builder.ToString();
    }
}
