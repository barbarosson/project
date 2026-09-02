using WinAirPlay.App.Services;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Raop;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class AppSettingsTests
{
    [Theory]
    [InlineData(0, 0)]
    [InlineData(-500, AppSettings.MinLatencyMs)]
    [InlineData(50, 50)]
    [InlineData(750, 750)]
    [InlineData(99999, AppSettings.MaxLatencyMs)]
    public void LatencyIsClampedToTheSliderRange(int input, int expected)
    {
        var settings = new AppSettings { LatencyMs = input }.Normalize();

        Assert.Equal(expected, settings.LatencyMs);
    }

    [Theory]
    [InlineData(10, AppSettings.MaxVolumeDb)]
    [InlineData(-100, AppSettings.MinVolumeDb)]
    [InlineData(-12, -12)]
    public void VolumeIsClampedToTheReceiverRange(double input, double expected)
    {
        var settings = new AppSettings { VolumeDb = input }.Normalize();

        Assert.Equal(expected, settings.VolumeDb);
    }

    [Theory]
    [InlineData(-30, 0)]
    [InlineData(-20, 33.333333333333336)]
    [InlineData(-9, 70)]
    [InlineData(0, 100)]
    public void DbToPercentMapsTheReceiverRange(double decibels, double expectedPercent)
    {
        Assert.Equal(expectedPercent, AppSettings.DbToPercent(decibels), precision: 6);
    }

    [Theory]
    [InlineData(0, -30)]
    [InlineData(70, -9)]
    [InlineData(100, 0)]
    public void PercentToDbMapsBackToTheReceiverRange(double percent, double expectedDb)
    {
        Assert.Equal(expectedDb, AppSettings.PercentToDb(percent), precision: 6);
    }

    [Fact]
    public void NonFiniteVolumeFallsBackToTheDefault()
    {
        Assert.Equal(-20, new AppSettings { VolumeDb = double.NaN }.Normalize().VolumeDb);
    }

    [Fact]
    public void UnknownCodecFallsBackToAlac()
    {
        var settings = new AppSettings { Codec = (RaopStreamCodec)42 }.Normalize();

        Assert.Equal(RaopStreamCodec.AppleLossless, settings.Codec);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void BlankIdentifiersBecomeNull(string value)
    {
        var settings = new AppSettings { LastDeviceId = value, CaptureDeviceId = value }.Normalize();

        Assert.Null(settings.LastDeviceId);
        Assert.Null(settings.CaptureDeviceId);
    }

    [Fact]
    public void CloneIsIndependentOfTheOriginal()
    {
        var original = new AppSettings { LatencyMs = 120 };
        var copy = original.Clone();

        copy.LatencyMs = 900;

        Assert.Equal(120, original.LatencyMs);
    }
}

public class JsonSettingsStoreTests : IDisposable
{
    private readonly string _path = Path.Combine(
        Path.GetTempPath(), $"winairplay-{Guid.NewGuid():N}", "settings.json");

    [Fact]
    public void SettingsSurviveARoundTrip()
    {
        var store = new JsonSettingsStore(_path);

        store.Save(new AppSettings
        {
            LastDeviceId = "4A:86:2C:4D:E9:A6",
            LastDeviceName = "Salon",
            LatencyMs = 320,
            VolumeDb = -8,
            Codec = RaopStreamCodec.RawPcm,
            StartMinimized = true,
        });

        var loaded = store.Load();

        Assert.Equal("4A:86:2C:4D:E9:A6", loaded.LastDeviceId);
        Assert.Equal("Salon", loaded.LastDeviceName);
        Assert.Equal(320, loaded.LatencyMs);
        Assert.Equal(-8, loaded.VolumeDb);
        Assert.Equal(RaopStreamCodec.RawPcm, loaded.Codec);
        Assert.True(loaded.StartMinimized);
        Assert.True(loaded.MuteLocalSpeakers);
        Assert.Equal(AudioRoutingMode.Auto, loaded.RoutingMode);
        Assert.True(loaded.FollowWindowsVolume);
    }

    [Fact]
    public void RoutingSettingsSurviveARoundTrip()
    {
        var store = new JsonSettingsStore(_path);
        store.Save(new AppSettings
        {
            RoutingMode = AudioRoutingMode.VirtualCable,
            FollowWindowsVolume = false,
            PreferredVirtualDeviceId = "cable-id",
        });

        var loaded = store.Load();

        Assert.Equal(AudioRoutingMode.VirtualCable, loaded.RoutingMode);
        Assert.False(loaded.FollowWindowsVolume);
        Assert.Equal("cable-id", loaded.PreferredVirtualDeviceId);
    }

    [Fact]
    public void MuteLocalSpeakersDefaultsToOn()
    {
        Assert.True(new AppSettings().MuteLocalSpeakers);
        Assert.True(new JsonSettingsStore(_path).Load().MuteLocalSpeakers);
    }

    [Fact]
    public void MuteLocalSpeakersFalseSurvivesARoundTrip()
    {
        var store = new JsonSettingsStore(_path);
        store.Save(new AppSettings { MuteLocalSpeakers = false });

        Assert.False(store.Load().MuteLocalSpeakers);
    }

    [Fact]
    public void MissingFileYieldsDefaults()
    {
        Assert.Equal(50, new JsonSettingsStore(_path).Load().LatencyMs);
    }

    [Fact]
    public void CorruptFileYieldsDefaultsInsteadOfThrowing()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        File.WriteAllText(_path, "{ this is not json");

        var loaded = new JsonSettingsStore(_path).Load();

        Assert.Equal(RaopStreamCodec.AppleLossless, loaded.Codec);
    }

    [Fact]
    public void OutOfRangeValuesOnDiskAreClampedOnLoad()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        File.WriteAllText(_path, """{ "LatencyMs": 999999, "VolumeDb": 50 }""");

        var loaded = new JsonSettingsStore(_path).Load();

        Assert.Equal(AppSettings.MaxLatencyMs, loaded.LatencyMs);
        Assert.Equal(AppSettings.MaxVolumeDb, loaded.VolumeDb);
    }

    public void Dispose()
    {
        var directory = Path.GetDirectoryName(_path)!;

        if (Directory.Exists(directory))
        {
            Directory.Delete(directory, recursive: true);
        }
    }
}
