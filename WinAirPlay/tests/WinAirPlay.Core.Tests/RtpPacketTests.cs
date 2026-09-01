using System.Buffers.Binary;
using WinAirPlay.Core.Raop;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class RtpAudioPacketTests
{
    [Fact]
    public void Header_CarriesVersionPayloadTypeSequenceTimestampAndSsrc()
    {
        var header = new byte[RtpAudioPacket.HeaderLength];

        RtpAudioPacket.WriteHeader(header, payloadType: 96, sequence: 0x1234,
            timestamp: 0xAABBCCDD, ssrc: 0x11223344, marker: false);

        Assert.Equal(0x80, header[0]);
        Assert.Equal(96, header[1]);
        Assert.Equal(0x1234, BinaryPrimitives.ReadUInt16BigEndian(header.AsSpan(2, 2)));
        Assert.Equal(0xAABBCCDDU, BinaryPrimitives.ReadUInt32BigEndian(header.AsSpan(4, 4)));
        Assert.Equal(0x11223344U, BinaryPrimitives.ReadUInt32BigEndian(header.AsSpan(8, 4)));
    }

    [Fact]
    public void MarkerBit_IsSetOnTheFirstPacketOnly()
    {
        var header = new byte[RtpAudioPacket.HeaderLength];

        RtpAudioPacket.WriteHeader(header, 96, 1, 0, 0, marker: true);
        Assert.Equal(0xE0, header[1]);

        RtpAudioPacket.WriteHeader(header, 96, 2, 0, 0, marker: false);
        Assert.Equal(0x60, header[1]);
    }

    [Fact]
    public void TooSmallBuffer_Throws() =>
        Assert.Throws<ArgumentException>(() =>
            RtpAudioPacket.WriteHeader(new byte[8], 96, 0, 0, 0, false));

    [Theory]
    [InlineData(-1)]
    [InlineData(128)]
    public void PayloadTypeOutsideSevenBits_Throws(int payloadType) =>
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            RtpAudioPacket.WriteHeader(new byte[12], payloadType, 0, 0, 0, false));
}

public class RaopSyncPacketTests
{
    [Fact]
    public void SyncPacket_AnchorsAnRtpTimestampToAnNtpInstant()
    {
        var packet = RaopSyncPacket.Build(
            playingRtpTime: 1000, ntpTime: 0x0102030405060708UL, nextRtpTime: 89200, isFirst: false);

        Assert.Equal(RaopSyncPacket.Length, packet.Length);
        Assert.Equal(0x80, packet[0]);
        Assert.Equal(RaopSyncPacket.PayloadType, packet[1]);
        Assert.Equal(7, BinaryPrimitives.ReadUInt16BigEndian(packet.AsSpan(2, 2)));
        Assert.Equal(1000U, BinaryPrimitives.ReadUInt32BigEndian(packet.AsSpan(4, 4)));
        Assert.Equal(0x0102030405060708UL, NtpTimestamp.ReadBigEndian(packet.AsSpan(8, 8)));
        Assert.Equal(89200U, BinaryPrimitives.ReadUInt32BigEndian(packet.AsSpan(16, 4)));
    }

    [Fact]
    public void FirstSyncPacket_SetsTheExtensionBit()
    {
        Assert.Equal(0x90, RaopSyncPacket.Build(0, 0, 0, isFirst: true)[0]);
        Assert.Equal(0x80, RaopSyncPacket.Build(0, 0, 0, isFirst: false)[0]);
    }
}

public class PcmByteOrderTests
{
    [Fact]
    public void SamplePairsAreSwapped()
    {
        var source = new byte[] { 0x01, 0x02, 0x03, 0x04 };
        var destination = new byte[4];

        PcmByteOrder.SwapSampleBytes(source, destination);

        Assert.Equal(new byte[] { 0x02, 0x01, 0x04, 0x03 }, destination);
    }

    [Fact]
    public void SwappingTwiceRestoresTheOriginal()
    {
        var original = new byte[] { 0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF };
        var once = new byte[6];
        var twice = new byte[6];

        PcmByteOrder.SwapSampleBytes(original, once);
        PcmByteOrder.SwapSampleBytes(once, twice);

        Assert.Equal(original, twice);
    }

    [Fact]
    public void LittleEndianSampleBecomesBigEndian()
    {
        var source = new byte[2];
        BinaryPrimitives.WriteInt16LittleEndian(source, -12345);

        var destination = new byte[2];
        PcmByteOrder.SwapSampleBytes(source, destination);

        Assert.Equal(-12345, BinaryPrimitives.ReadInt16BigEndian(destination));
    }

    [Fact]
    public void OddLengthInput_Throws() =>
        Assert.Throws<ArgumentException>(() => PcmByteOrder.SwapSampleBytes(new byte[3], new byte[4]));

    [Fact]
    public void UndersizedDestination_Throws() =>
        Assert.Throws<ArgumentException>(() => PcmByteOrder.SwapSampleBytes(new byte[4], new byte[2]));
}
