using WinAirPlay.App.Localization;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class LocalizationServiceTests
{
    [Fact]
    public void Get_ReturnsEnglishStrings()
    {
        var localization = new LocalizationService();

        Assert.Equal("Connect", localization.Get(LocKeys.Connect));
        Assert.Equal("Scan", localization.Get(LocKeys.Scan));
        Assert.Equal("BUFFER (LATENCY)", localization.Get(LocKeys.BufferLatency));
        Assert.Equal("Found {0} device(s).", localization.Get(LocKeys.DevicesFound));
    }

    [Fact]
    public void Format_SubstitutesArguments()
    {
        var localization = new LocalizationService();

        Assert.Equal("Connecting to Salon...", localization.Format(LocKeys.ConnectingTo, "Salon"));
    }
}
