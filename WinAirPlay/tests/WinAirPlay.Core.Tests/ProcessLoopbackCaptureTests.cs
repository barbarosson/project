using WinAirPlay.Core.Audio;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class ProcessLoopbackCaptureTests
{
    [Fact]
    public void ProcessLoopback_ActivatesOnWindows10AndLater()
    {
        using var capture = new ProcessLoopbackCapture();

        Assert.True(capture.WaveFormat.Channels is 1 or 2 or 6 or 8);
        Assert.True(capture.WaveFormat.SampleRate >= 44100);
    }
}
