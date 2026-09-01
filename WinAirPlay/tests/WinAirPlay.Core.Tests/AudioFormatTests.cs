using WinAirPlay.Core.Audio;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class AudioFormatTests
{
    [Fact]
    public void AirPlayDefault_IsCdQualityStereo()
    {
        var format = AudioFormat.AirPlay;

        Assert.Equal(44100, format.SampleRate);
        Assert.Equal(16, format.BitsPerSample);
        Assert.Equal(2, format.Channels);
    }

    [Fact]
    public void BytesPerFrame_CountsEveryChannel()
    {
        Assert.Equal(4, AudioFormat.AirPlay.BytesPerFrame);
        Assert.Equal(176400, AudioFormat.AirPlay.BytesPerSecond);
    }

    [Fact]
    public void DurationOf_OneSecondOfAudio_IsOneSecond()
    {
        var duration = AudioFormat.AirPlay.DurationOf(176400);

        Assert.Equal(TimeSpan.FromSeconds(1), duration);
    }

    [Fact]
    public void BytesFor_RoundTripsWithDurationOf()
    {
        var bytes = AudioFormat.AirPlay.BytesFor(TimeSpan.FromMilliseconds(500));

        Assert.Equal(88200, bytes);
        Assert.Equal(TimeSpan.FromMilliseconds(500), AudioFormat.AirPlay.DurationOf(bytes));
    }

    [Fact]
    public void AirPlayPacketSize_Is1408Bytes()
    {
        // 352 sample frames is what a RAOP ALAC packet carries.
        Assert.Equal(1408, 352 * AudioFormat.AirPlay.BytesPerFrame);
    }
}
