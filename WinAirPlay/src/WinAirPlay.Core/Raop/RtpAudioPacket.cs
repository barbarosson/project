using System.Buffers.Binary;

namespace WinAirPlay.Core.Raop;

/// <summary>
/// The standard 12-byte RTP header that prefixes every audio packet sent to the receiver's
/// audio port.
/// </summary>
public static class RtpAudioPacket
{
    public const int HeaderLength = 12;

    private const byte Version2 = 0x80;
    private const byte MarkerBit = 0x80;

    public static void WriteHeader(
        Span<byte> destination,
        int payloadType,
        ushort sequence,
        uint timestamp,
        uint ssrc,
        bool marker)
    {
        if (destination.Length < HeaderLength)
        {
            throw new ArgumentException($"RTP başlığı için {HeaderLength} bayt gerekli.", nameof(destination));
        }

        if (payloadType is < 0 or > 0x7F)
        {
            throw new ArgumentOutOfRangeException(nameof(payloadType), payloadType, "Payload type 0-127 olmalı.");
        }

        destination[0] = Version2;
        destination[1] = (byte)(payloadType | (marker ? MarkerBit : 0));
        BinaryPrimitives.WriteUInt16BigEndian(destination[2..4], sequence);
        BinaryPrimitives.WriteUInt32BigEndian(destination[4..8], timestamp);
        BinaryPrimitives.WriteUInt32BigEndian(destination[8..12], ssrc);
    }
}

/// <summary>
/// The 20-byte sync packet sent to the receiver's control port. It anchors an RTP timestamp to a
/// wall-clock (NTP) instant; without it a receiver buffers audio but never starts playing.
/// </summary>
public static class RaopSyncPacket
{
    public const int Length = 20;

    /// <summary>RTP payload type 0x54 with the marker bit set.</summary>
    public const byte PayloadType = 0xD4;

    public static byte[] Build(uint playingRtpTime, ulong ntpTime, uint nextRtpTime, bool isFirst)
    {
        var packet = new byte[Length];

        // The extension bit marks the very first sync of a stream.
        packet[0] = (byte)(isFirst ? 0x90 : 0x80);
        packet[1] = PayloadType;
        BinaryPrimitives.WriteUInt16BigEndian(packet.AsSpan(2, 2), 7);
        BinaryPrimitives.WriteUInt32BigEndian(packet.AsSpan(4, 4), playingRtpTime);
        NtpTimestamp.WriteBigEndian(packet.AsSpan(8, 8), ntpTime);
        BinaryPrimitives.WriteUInt32BigEndian(packet.AsSpan(16, 4), nextRtpTime);

        return packet;
    }
}

public static class PcmByteOrder
{
    /// <summary>
    /// Converts between little-endian (what WASAPI produces) and big-endian (what RTP L16
    /// requires) by swapping every 16-bit sample. The operation is its own inverse.
    /// </summary>
    public static void SwapSampleBytes(ReadOnlySpan<byte> source, Span<byte> destination)
    {
        if (source.Length % 2 != 0)
        {
            throw new ArgumentException("16-bit PCM çift sayıda bayt içermeli.", nameof(source));
        }

        if (destination.Length < source.Length)
        {
            throw new ArgumentException("Hedef tampon kaynaktan küçük olamaz.", nameof(destination));
        }

        for (var i = 0; i < source.Length; i += 2)
        {
            destination[i] = source[i + 1];
            destination[i + 1] = source[i];
        }
    }
}
