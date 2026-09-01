using System.Buffers.Binary;
using WinAirPlay.Core.Audio;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class PcmLevelMeterTests
{
    [Fact]
    public void Silence_MeasuresZero()
    {
        var level = PcmLevelMeter.Measure(new byte[1408], channels: 2);

        Assert.Equal(0f, level.Peak);
        Assert.True(level.IsSilent);
    }

    [Fact]
    public void FullScaleLeftChannel_DoesNotLeakIntoRight()
    {
        var pcm = BuildStereo(leftSample: short.MaxValue, rightSample: 0, frames: 16);

        var level = PcmLevelMeter.Measure(pcm, channels: 2);

        Assert.Equal(1f, level.PeakLeft, 3);
        Assert.Equal(0f, level.PeakRight);
    }

    [Fact]
    public void HalfScale_IsApproximatelyMinusSixDecibels()
    {
        var pcm = BuildStereo(leftSample: 16384, rightSample: 16384, frames: 8);

        var level = PcmLevelMeter.Measure(pcm, channels: 2);

        Assert.InRange(PcmLevel.ToDecibels(level.Peak), -6.1f, -5.9f);
    }

    [Fact]
    public void NegativeFullScale_IsClampedToOne()
    {
        var pcm = BuildStereo(leftSample: short.MinValue, rightSample: short.MinValue, frames: 4);

        var level = PcmLevelMeter.Measure(pcm, channels: 2);

        Assert.Equal(1f, level.Peak);
    }

    [Fact]
    public void Mono_ReportsSameLevelOnBothChannels()
    {
        var pcm = new byte[8];
        for (var i = 0; i < pcm.Length; i += 2)
        {
            BinaryPrimitives.WriteInt16LittleEndian(pcm.AsSpan(i, 2), 8192);
        }

        var level = PcmLevelMeter.Measure(pcm, channels: 1);

        Assert.Equal(level.PeakLeft, level.PeakRight);
    }

    [Fact]
    public void UnsupportedChannelCount_Throws() =>
        Assert.Throws<ArgumentOutOfRangeException>(() => PcmLevelMeter.Measure(new byte[8], channels: 6));

    private static byte[] BuildStereo(short leftSample, short rightSample, int frames)
    {
        var pcm = new byte[frames * 4];
        for (var frame = 0; frame < frames; frame++)
        {
            BinaryPrimitives.WriteInt16LittleEndian(pcm.AsSpan(frame * 4, 2), leftSample);
            BinaryPrimitives.WriteInt16LittleEndian(pcm.AsSpan(frame * 4 + 2, 2), rightSample);
        }

        return pcm;
    }
}
