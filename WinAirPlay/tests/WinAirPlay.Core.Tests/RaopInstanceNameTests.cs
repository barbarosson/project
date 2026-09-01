using WinAirPlay.Core.Discovery;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class RaopInstanceNameTests
{
    [Fact]
    public void RaopInstance_SplitsHardwareIdFromFriendlyName()
    {
        var (deviceId, name) = RaopInstanceName.Parse("A1B2C3D4E5F6@HomePod mini");

        Assert.Equal("A1:B2:C3:D4:E5:F6", deviceId);
        Assert.Equal("HomePod mini", name);
    }

    [Fact]
    public void AirPlayInstance_HasNoHardwareId()
    {
        var (deviceId, name) = RaopInstanceName.Parse("HomePod mini");

        Assert.Null(deviceId);
        Assert.Equal("HomePod mini", name);
    }

    [Fact]
    public void FriendlyNameContainingAtSign_IsPreserved()
    {
        var (deviceId, name) = RaopInstanceName.Parse("A1B2C3D4E5F6@Ali'nin @ Odası");

        Assert.Equal("A1:B2:C3:D4:E5:F6", deviceId);
        Assert.Equal("Ali'nin @ Odası", name);
    }

    [Fact]
    public void EmptyInput_YieldsEmptyName()
    {
        var (deviceId, name) = RaopInstanceName.Parse("   ");

        Assert.Null(deviceId);
        Assert.Equal(string.Empty, name);
    }

    [Theory]
    [InlineData("a1b2c3d4e5f6", "A1:B2:C3:D4:E5:F6")]
    [InlineData("A1:B2:C3:D4:E5:F6", "A1:B2:C3:D4:E5:F6")]
    [InlineData("a1-b2-c3-d4-e5-f6", "A1:B2:C3:D4:E5:F6")]
    public void DeviceIds_NormalizeToColonSeparatedUpperCase(string raw, string expected) =>
        Assert.Equal(expected, RaopInstanceName.NormalizeDeviceId(raw));

    [Fact]
    public void NonMacDeviceId_IsUpperCasedButLeftIntact() =>
        Assert.Equal("SOMETHING-ELSE", RaopInstanceName.NormalizeDeviceId("something-else"));

    [Fact]
    public void NullDeviceId_StaysNull() =>
        Assert.Null(RaopInstanceName.NormalizeDeviceId(null));
}

public class DnsLabelTests
{
    [Fact]
    public void DecimalEscapes_BecomeCharacters() =>
        Assert.Equal("HomePod mini", DnsLabel.Unescape(@"HomePod\032mini"));

    [Fact]
    public void EscapedDot_IsLiteral() =>
        Assert.Equal("Salon.Hoparlör", DnsLabel.Unescape(@"Salon\.Hoparlör"));

    [Fact]
    public void PlainText_IsReturnedUnchanged() =>
        Assert.Equal("Mutfak", DnsLabel.Unescape("Mutfak"));

    [Fact]
    public void Null_BecomesEmpty() =>
        Assert.Equal(string.Empty, DnsLabel.Unescape(null));
}
