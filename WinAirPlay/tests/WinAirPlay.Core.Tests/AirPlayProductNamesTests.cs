using WinAirPlay.Core.Discovery;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class AirPlayProductNamesTests
{
    [Theory]
    [InlineData("AudioAccessory5,1", true, "HomePod")]
    [InlineData("AudioAccessory6,1", true, "HomePod mini")]
    [InlineData("AppleTV5,3", false, "Apple TV")]
    public void Resolve_ReturnsFriendlyProductName(string model, bool isHomePod, string expected) =>
        Assert.Equal(expected, AirPlayProductNames.Resolve(model, isHomePod));

    [Fact]
    public void FormatDisplayName_AppendsProductWhenMissingFromRoomName()
    {
        var label = AirPlayProductNames.FormatDisplayName("Salon (2)", "AudioAccessory5,1", isHomePod: true);

        Assert.Equal("Salon (2) · HomePod", label);
    }
}

public class AirPlayServiceTypesFqdnTests
{
    [Theory]
    [InlineData("4A862C4DE9A6@Salon (2)._raop._tcp.local.", AirPlayServiceKind.Raop)]
    [InlineData("Salon._airplay._tcp.local", AirPlayServiceKind.AirPlay)]
    public void ClassifyFromFqdn_MatchesInstanceServiceNames(string fqdn, AirPlayServiceKind expected) =>
        Assert.Equal(expected, AirPlayServiceTypes.ClassifyFromFqdn(fqdn));
}
