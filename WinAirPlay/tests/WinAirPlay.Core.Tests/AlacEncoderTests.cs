using System.Buffers.Binary;
using WinAirPlay.Core.Alac;
using WinAirPlay.Core.Raop;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class AlacBitWriterTests
{
    [Fact]
    public void BitsAreWrittenMostSignificantFirst()
    {
        var buffer = new byte[2];
        var writer = new AlacBitWriter(buffer);

        writer.Write(0b101, 3);
        writer.Write(0b1, 1);

        Assert.Equal(0b1011_0000, buffer[0]);
        Assert.Equal(4, writer.BitLength);
    }

    [Fact]
    public void ByteLength_RoundsUpToTheNextWholeByte()
    {
        var buffer = new byte[4];
        var writer = new AlacBitWriter(buffer);

        writer.Write(0, 9);

        Assert.Equal(9, writer.BitLength);
        Assert.Equal(2, writer.ByteLength);
    }

    [Fact]
    public void UnalignedByte_IsSplitAcrossTwoBytes()
    {
        var buffer = new byte[3];
        var writer = new AlacBitWriter(buffer);

        writer.Write(0b111, 3);
        writer.WriteByte(0b1010_1010);

        // 111 10101010 packs as 11110101 then 010 in the next byte.
        Assert.Equal(0b1111_0101, buffer[0]);
        Assert.Equal(0b0100_0000, buffer[1]);
        Assert.Equal(11, writer.BitLength);
    }

    [Fact]
    public void AlignedByte_IsWrittenVerbatim()
    {
        var buffer = new byte[2];
        var writer = new AlacBitWriter(buffer);

        writer.WriteByte(0xAB);

        Assert.Equal(0xAB, buffer[0]);
    }

    [Fact]
    public void WritingPastTheBuffer_Throws()
    {
        Assert.Throws<InvalidOperationException>(() =>
        {
            var writer = new AlacBitWriter(new byte[1]);
            writer.Write(0, 9);
        });
    }

    [Theory]
    [InlineData(0)]
    [InlineData(33)]
    public void InvalidBitCount_Throws(int bitCount)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
        {
            var writer = new AlacBitWriter(new byte[8]);
            writer.Write(0, bitCount);
        });
    }

    [Fact]
    public void BufferIsClearedSoStaleBitsCannotLeak()
    {
        var buffer = new byte[2];
        buffer.AsSpan().Fill(0xFF);

        var writer = new AlacBitWriter(buffer);
        writer.Write(0, 4);

        Assert.Equal(0x00, buffer[0]);
    }
}

public class AlacUncompressedEncoderTests
{
    private static readonly AlacUncompressedEncoder Encoder = new();

    [Fact]
    public void EncodedFrame_IsThreeBytesLargerThanThePcmItCarries()
    {
        // 23 header bits + payload + 3 trailer bits, rounded up to whole bytes.
        Assert.Equal(1412, Encoder.GetMaxEncodedLength(1408));
    }

    [Fact]
    public void FrameHeader_MarksAStereoUncompressedElement()
    {
        var destination = new byte[Encoder.GetMaxEncodedLength(4)];
        Encoder.Encode(new byte[4], destination);

        // 3 bits element tag (1), 16 unused bits, hassize 0, 2 unused, 1 = uncompressed.
        // The flag lands on bit 22, the last bit before the payload starts.
        Assert.Equal(0b0010_0000, destination[0]);
        Assert.Equal(0b0000_0000, destination[1]);
        Assert.Equal(0b0000_0010, destination[2] & 0b1111_1110);
    }

    [Fact]
    public void SamplesAreStoredBigEndianAndBitShiftedByTheHeader()
    {
        var pcm = new byte[4];
        BinaryPrimitives.WriteInt16LittleEndian(pcm.AsSpan(0, 2), 0x1234);
        BinaryPrimitives.WriteInt16LittleEndian(pcm.AsSpan(2, 2), 0x5678);

        var destination = new byte[Encoder.GetMaxEncodedLength(pcm.Length)];
        Encoder.Encode(pcm, destination);

        // The payload starts at bit 23, so read it back by undoing that shift.
        var recovered = ReadBitsAsBytes(destination, startBit: 23, byteCount: 4);
        Assert.Equal(new byte[] { 0x12, 0x34, 0x56, 0x78 }, recovered);
    }

    [Fact]
    public void FrameEndsWithTheTerminatorTag()
    {
        var pcm = new byte[8];
        var destination = new byte[Encoder.GetMaxEncodedLength(pcm.Length)];
        var length = Encoder.Encode(pcm, destination);

        var terminator = ReadBits(destination, startBit: 23 + (pcm.Length * 8), bitCount: 3);

        Assert.Equal(7u, terminator);
        Assert.Equal(destination.Length, length);
    }

    [Fact]
    public void FullSizePacket_ProducesTheExpectedLength()
    {
        var pcm = new byte[1408];
        var destination = new byte[Encoder.GetMaxEncodedLength(pcm.Length)];

        Assert.Equal(1412, Encoder.Encode(pcm, destination));
    }

    [Fact]
    public void PcmBlockThatIsNotWholeStereoFrames_Throws() =>
        Assert.Throws<ArgumentException>(() => Encoder.Encode(new byte[6], new byte[64]));

    [Fact]
    public void UndersizedDestination_Throws() =>
        Assert.Throws<ArgumentException>(() => Encoder.Encode(new byte[1408], new byte[1408]));

    [Fact]
    public void OnlySixteenBitStereoIsSupported() =>
        Assert.Throws<ArgumentException>(() =>
            new AlacUncompressedEncoder(new RaopAudioParameters(Channels: 1)));

    private static uint ReadBits(ReadOnlySpan<byte> buffer, int startBit, int bitCount)
    {
        uint value = 0;

        for (var i = 0; i < bitCount; i++)
        {
            var bit = (buffer[(startBit + i) >> 3] >> (7 - ((startBit + i) & 7))) & 1;
            value = (value << 1) | (uint)bit;
        }

        return value;
    }

    private static byte[] ReadBitsAsBytes(ReadOnlySpan<byte> buffer, int startBit, int byteCount)
    {
        var result = new byte[byteCount];

        for (var i = 0; i < byteCount; i++)
        {
            result[i] = (byte)ReadBits(buffer, startBit + (i * 8), 8);
        }

        return result;
    }
}

public class RaopPayloadEncoderTests
{
    [Fact]
    public void PcmFormat_SelectsThePassthroughEncoder()
    {
        var encoder = RaopPayloadEncoder.Create(
            RaopMediaFormat.RawPcm(RaopAudioParameters.Default), RaopAudioParameters.Default);

        Assert.Equal(RaopStreamCodec.RawPcm, encoder.Codec);
        Assert.Equal(1408, encoder.GetMaxEncodedLength(1408));
    }

    [Fact]
    public void AlacFormat_SelectsTheAlacEncoder()
    {
        var encoder = RaopPayloadEncoder.Create(
            RaopMediaFormat.AppleLossless(RaopAudioParameters.Default), RaopAudioParameters.Default);

        Assert.Equal(RaopStreamCodec.AppleLossless, encoder.Codec);
        Assert.Equal(1412, encoder.GetMaxEncodedLength(1408));
    }

    [Fact]
    public void ForcedLittleEndian_LeavesPcmUntouched()
    {
        var encoder = RaopPayloadEncoder.Create(
            RaopMediaFormat.RawPcm(RaopAudioParameters.Default),
            RaopAudioParameters.Default,
            forceBigEndianPcm: false);

        var pcm = new byte[] { 0x01, 0x02, 0x03, 0x04 };
        var destination = new byte[4];
        encoder.Encode(pcm, destination);

        Assert.Equal(pcm, destination);
    }
}
