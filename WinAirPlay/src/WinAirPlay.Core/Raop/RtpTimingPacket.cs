using System.Buffers.Binary;

namespace WinAirPlay.Core.Raop;

/// <summary>
/// The 32-byte RTP timing packets AirPlay receivers use to measure clock offset. The receiver
/// sends a request and blocks until the sender answers, so this has to be handled before SETUP
/// completes.
/// </summary>
public static class RtpTimingPacket
{
    public const int Length = 32;

    /// <summary>RTP payload type 0x52 with the marker bit set.</summary>
    public const byte RequestType = 0xD2;

    /// <summary>RTP payload type 0x53 with the marker bit set.</summary>
    public const byte ReplyType = 0xD3;

    public static bool IsTimingRequest(ReadOnlySpan<byte> packet) =>
        packet.Length >= Length && packet[1] == RequestType;

    /// <summary>The client's send time, which the reply must echo back as the originate timestamp.</summary>
    public static ulong ReadTransmitTimestamp(ReadOnlySpan<byte> packet)
    {
        if (packet.Length < Length)
        {
            throw new ArgumentException($"Timing paketi en az {Length} bayt olmalı.", nameof(packet));
        }

        return NtpTimestamp.ReadBigEndian(packet[24..32]);
    }

    public static byte[] BuildReply(ulong originateNtp, ulong receiveNtp, ulong transmitNtp)
    {
        var packet = new byte[Length];

        packet[0] = 0x80;
        packet[1] = ReplyType;
        BinaryPrimitives.WriteUInt16BigEndian(packet.AsSpan(2, 2), 7);

        NtpTimestamp.WriteBigEndian(packet.AsSpan(8, 8), originateNtp);
        NtpTimestamp.WriteBigEndian(packet.AsSpan(16, 8), receiveNtp);
        NtpTimestamp.WriteBigEndian(packet.AsSpan(24, 8), transmitNtp);

        return packet;
    }
}
