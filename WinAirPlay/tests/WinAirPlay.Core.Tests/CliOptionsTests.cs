using WinAirPlay.Cli;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class CliOptionsTests
{
    [Fact]
    public void NoArguments_DefaultsToCaptureIntoTestCaptureWav()
    {
        var options = CliOptions.Parse([]);

        Assert.Equal(CliCommand.Capture, options.Command);
        Assert.Equal("test_capture.wav", options.OutputPath);
        Assert.Null(options.DurationSeconds);
        Assert.Null(options.DeviceId);
        Assert.False(options.EmitSilenceWhenIdle);
    }

    [Fact]
    public void StreamKeepSpeakers_IsOffByDefaultAndCanBeEnabled()
    {
        Assert.False(CliOptions.Parse(["stream"]).KeepLocalSpeakers);
        Assert.True(CliOptions.Parse(["stream", "--keep-speakers"]).KeepLocalSpeakers);
    }

    [Theory]
    [InlineData("list")]
    [InlineData("--list")]
    [InlineData("-l")]
    public void ListAliases_SelectDeviceListing(string arg) =>
        Assert.Equal(CliCommand.ListDevices, CliOptions.Parse([arg]).Command);

    [Fact]
    public void CaptureOptions_AreParsed()
    {
        var options = CliOptions.Parse(["capture", "-o", "out.wav", "-s", "15", "-d", "dev-1", "--silence"]);

        Assert.Equal(CliCommand.Capture, options.Command);
        Assert.Equal("out.wav", options.OutputPath);
        Assert.Equal(15, options.DurationSeconds);
        Assert.Equal("dev-1", options.DeviceId);
        Assert.True(options.EmitSilenceWhenIdle);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-3")]
    [InlineData("abc")]
    public void InvalidDuration_Throws(string value) =>
        Assert.Throws<ArgumentException>(() => CliOptions.Parse(["--seconds", value]));

    [Fact]
    public void MissingValue_Throws() =>
        Assert.Throws<ArgumentException>(() => CliOptions.Parse(["--out"]));

    [Fact]
    public void UnknownArgument_Throws() =>
        Assert.Throws<ArgumentException>(() => CliOptions.Parse(["--nope"]));
}
