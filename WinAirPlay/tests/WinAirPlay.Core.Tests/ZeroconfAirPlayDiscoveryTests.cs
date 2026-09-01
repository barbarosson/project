using WinAirPlay.Core.Discovery;
using Xunit;

namespace WinAirPlay.Core.Tests;

/// <summary>
/// Guard-clause coverage only; the multicast path itself is exercised by the CLI checkpoint.
/// </summary>
public class ZeroconfAirPlayDiscoveryTests
{
    [Fact]
    public void QueryInterval_BelowOneSecond_IsRejected() =>
        Assert.Throws<ArgumentOutOfRangeException>(
            () => new ZeroconfAirPlayDiscovery(TimeSpan.FromMilliseconds(200)));

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public async Task NonPositiveDuration_IsRejected(int seconds)
    {
        var discovery = new ZeroconfAirPlayDiscovery();

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
            () => discovery.ScanAsync(TimeSpan.FromSeconds(seconds)));
    }

    [Fact]
    public void BothAirPlayServiceTypesAreScanned() =>
        Assert.Equal(
            new[] { "_raop._tcp.local.", "_airplay._tcp.local." },
            AirPlayServiceTypes.All);
}
