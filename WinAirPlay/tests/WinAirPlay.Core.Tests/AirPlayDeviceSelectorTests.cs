using System.Net;
using WinAirPlay.Core.Discovery;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class AirPlayDeviceSelectorTests
{
    private static readonly IReadOnlyList<AirPlayDevice> Devices = new[]
    {
        Device("Salon", "192.168.0.116", "36:CA:EF:AA:1E:18"),
        Device("Salon (2)", "192.168.0.121", "4A:86:2C:4D:E9:A6"),
        Device("Mutfak", "192.168.0.130", "11:22:33:44:55:66"),
    };

    private static AirPlayDevice Device(string name, string address, string deviceId) => new()
    {
        Name = name,
        DeviceId = deviceId,
        Addresses = new[] { IPAddress.Parse(address) },
        RaopPort = 7000,
    };

    [Fact]
    public void OneBasedIndex_SelectsTheDevice() =>
        Assert.Equal("Salon (2)", AirPlayDeviceSelector.Find(Devices, "2")?.Name);

    [Theory]
    [InlineData("0")]
    [InlineData("4")]
    [InlineData("-1")]
    public void OutOfRangeIndex_ReturnsNull(string token) =>
        Assert.Null(AirPlayDeviceSelector.Find(Devices, token));

    [Fact]
    public void IpAddress_SelectsTheDevice() =>
        Assert.Equal("Mutfak", AirPlayDeviceSelector.Find(Devices, "192.168.0.130")?.Name);

    [Fact]
    public void UnknownIpAddress_ReturnsNull() =>
        Assert.Null(AirPlayDeviceSelector.Find(Devices, "10.0.0.1"));

    [Theory]
    [InlineData("4A:86:2C:4D:E9:A6")]
    [InlineData("4a862c4de9a6")]
    public void HardwareId_SelectsTheDeviceRegardlessOfFormatting(string token) =>
        Assert.Equal("Salon (2)", AirPlayDeviceSelector.Find(Devices, token)?.Name);

    [Fact]
    public void ExactName_WinsOverPartialMatches() =>
        Assert.Equal("Salon", AirPlayDeviceSelector.Find(Devices, "Salon")?.Name);

    [Fact]
    public void UniquePartialName_IsAccepted() =>
        Assert.Equal("Mutfak", AirPlayDeviceSelector.Find(Devices, "mut")?.Name);

    [Fact]
    public void AmbiguousPartialName_ReturnsNull() =>
        Assert.Null(AirPlayDeviceSelector.Find(Devices, "Salo"));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void EmptyToken_ReturnsNull(string? token) =>
        Assert.Null(AirPlayDeviceSelector.Find(Devices, token));

    [Fact]
    public void EmptyDeviceList_ReturnsNull() =>
        Assert.Null(AirPlayDeviceSelector.Find(Array.Empty<AirPlayDevice>(), "1"));
}
