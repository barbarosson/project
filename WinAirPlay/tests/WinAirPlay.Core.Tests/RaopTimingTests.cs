using System.Buffers.Binary;
using WinAirPlay.Core.Raop;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class NtpTimestampTests
{
    [Fact]
    public void WholeSeconds_LandInTheHighWord()
    {
        var timestamp = NtpTimestamp.FromTimeSpanSinceEpoch(TimeSpan.FromSeconds(5));

        Assert.Equal(5UL, timestamp >> 32);
        Assert.Equal(0UL, timestamp & 0xFFFFFFFF);
    }

    [Fact]
    public void HalfASecond_IsHalfOfTheFractionRange()
    {
        var timestamp = NtpTimestamp.FromTimeSpanSinceEpoch(TimeSpan.FromSeconds(1.5));

        Assert.Equal(1UL, timestamp >> 32);
        Assert.Equal(0x80000000UL, timestamp & 0xFFFFFFFF);
    }

    [Fact]
    public void ConversionRoundTripsWithinOneMicrosecond()
    {
        var original = TimeSpan.FromSeconds(3_900_000_000.125);

        var restored = NtpTimestamp.ToTimeSpanSinceEpoch(
            NtpTimestamp.FromTimeSpanSinceEpoch(original));

        Assert.True(Math.Abs((restored - original).TotalMilliseconds) < 0.001);
    }

    [Fact]
    public void NegativeSpans_ClampToZero() =>
        Assert.Equal(0UL, NtpTimestamp.FromTimeSpanSinceEpoch(TimeSpan.FromSeconds(-1)));

    [Fact]
    public void UnixEpoch_IsThe1900OffsetKnownFromTheNtpSpec() =>
        Assert.Equal(2_208_988_800UL, NtpTimestamp.FromUtc(DateTime.UnixEpoch) >> 32);

    [Fact]
    public void BigEndianRoundTrip()
    {
        var buffer = new byte[8];
        NtpTimestamp.WriteBigEndian(buffer, 0x0123456789ABCDEFUL);

        Assert.Equal(0x01, buffer[0]);
        Assert.Equal(0xEF, buffer[7]);
        Assert.Equal(0x0123456789ABCDEFUL, NtpTimestamp.ReadBigEndian(buffer));
    }
}

public class RtpTimingPacketTests
{
    private static byte[] BuildRequest(ulong transmitTimestamp)
    {
        var packet = new byte[RtpTimingPacket.Length];
        packet[0] = 0x80;
        packet[1] = RtpTimingPacket.RequestType;
        BinaryPrimitives.WriteUInt16BigEndian(packet.AsSpan(2, 2), 7);
        NtpTimestamp.WriteBigEndian(packet.AsSpan(24, 8), transmitTimestamp);

        return packet;
    }

    [Fact]
    public void TimingRequest_IsRecognised() =>
        Assert.True(RtpTimingPacket.IsTimingRequest(BuildRequest(1234)));

    [Fact]
    public void ReplyPacket_IsNotTreatedAsARequest()
    {
        var reply = RtpTimingPacket.BuildReply(1, 2, 3);

        Assert.False(RtpTimingPacket.IsTimingRequest(reply));
    }

    [Fact]
    public void ShortPacket_IsRejected() =>
        Assert.False(RtpTimingPacket.IsTimingRequest(new byte[8]));

    [Fact]
    public void TransmitTimestamp_IsReadFromTheLastEightBytes() =>
        Assert.Equal(0xAABBCCDDEEFF0011UL,
            RtpTimingPacket.ReadTransmitTimestamp(BuildRequest(0xAABBCCDDEEFF0011UL)));

    [Fact]
    public void ReadingATruncatedPacket_Throws() =>
        Assert.Throws<ArgumentException>(() => RtpTimingPacket.ReadTransmitTimestamp(new byte[10]));

    [Fact]
    public void Reply_CarriesAllThreeTimestampsAndTheReplyType()
    {
        var reply = RtpTimingPacket.BuildReply(originateNtp: 111, receiveNtp: 222, transmitNtp: 333);

        Assert.Equal(RtpTimingPacket.Length, reply.Length);
        Assert.Equal(0x80, reply[0]);
        Assert.Equal(RtpTimingPacket.ReplyType, reply[1]);
        Assert.Equal(7, BinaryPrimitives.ReadUInt16BigEndian(reply.AsSpan(2, 2)));
        Assert.Equal(111UL, NtpTimestamp.ReadBigEndian(reply.AsSpan(8, 8)));
        Assert.Equal(222UL, NtpTimestamp.ReadBigEndian(reply.AsSpan(16, 8)));
        Assert.Equal(333UL, NtpTimestamp.ReadBigEndian(reply.AsSpan(24, 8)));
    }
}
