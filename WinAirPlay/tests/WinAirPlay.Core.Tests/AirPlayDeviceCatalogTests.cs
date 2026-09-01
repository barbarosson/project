using System.Net;
using WinAirPlay.Core.Discovery;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class AirPlayDeviceCatalogTests
{
    private static MdnsServiceRecord Raop(
        string instance = "A1B2C3D4E5F6@HomePod mini",
        string address = "192.168.1.42",
        int port = 7000,
        Dictionary<string, string>? txt = null) =>
        new(AirPlayServiceKind.Raop,
            instance,
            new[] { IPAddress.Parse(address) },
            port,
            txt ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["cn"] = "0,1",
                ["et"] = "0,3",
                ["am"] = "AudioAccessory5,1",
                ["vs"] = "366.0",
            });

    private static MdnsServiceRecord AirPlay(
        string instance = "HomePod mini",
        string address = "192.168.1.42",
        int port = 7000,
        string deviceId = "A1:B2:C3:D4:E5:F6") =>
        new(AirPlayServiceKind.AirPlay,
            instance,
            new[] { IPAddress.Parse(address) },
            port,
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["deviceid"] = deviceId,
                ["model"] = "AudioAccessory5,1",
                ["srcvers"] = "770.8.1",
            });

    [Fact]
    public void BothServicesOfOneDevice_MergeIntoASingleEntry()
    {
        var devices = AirPlayDeviceCatalog.Build(new[] { Raop(), AirPlay() });

        var device = Assert.Single(devices);
        Assert.Equal("HomePod mini", device.Name);
        Assert.Equal("A1:B2:C3:D4:E5:F6", device.DeviceId);
        Assert.Equal(7000, device.RaopPort);
        Assert.Equal(7000, device.AirPlayPort);
        Assert.Equal(IPAddress.Parse("192.168.1.42"), device.Address);
        Assert.True(device.IsHomePod);
        Assert.True(device.SupportsAudioStreaming);
    }

    [Fact]
    public void CapabilitiesComeFromTheRaopRecord()
    {
        var devices = AirPlayDeviceCatalog.Build(new[] { Raop(), AirPlay() });

        var device = Assert.Single(devices);
        Assert.True(device.Capabilities.SupportsAlac);
        Assert.Equal("366.0", device.Capabilities.ServerVersion);
    }

    [Fact]
    public void DifferentDevices_StaySeparate()
    {
        var devices = AirPlayDeviceCatalog.Build(new[]
        {
            Raop(),
            Raop("FFEEDDCCBBAA@Salon", "192.168.1.51"),
        });

        Assert.Equal(2, devices.Count);
        Assert.Contains(devices, d => d.Name == "HomePod mini");
        Assert.Contains(devices, d => d.Name == "Salon");
    }

    [Fact]
    public void MultipleInterfaces_ProduceOneDeviceWithIpv4First()
    {
        var ipv6 = new MdnsServiceRecord(
            AirPlayServiceKind.Raop,
            "A1B2C3D4E5F6@HomePod mini",
            new[] { IPAddress.Parse("fe80::1") },
            7000,
            MdnsServiceRecord.EmptyTxt);

        var devices = AirPlayDeviceCatalog.Build(new[] { ipv6, Raop() });

        var device = Assert.Single(devices);
        Assert.Equal(2, device.Addresses.Count);
        Assert.Equal(IPAddress.Parse("192.168.1.42"), device.Address);
    }

    [Fact]
    public void DuplicateAddresses_AreCollapsed()
    {
        var devices = AirPlayDeviceCatalog.Build(new[] { Raop(), Raop(), AirPlay() });

        var device = Assert.Single(devices);
        Assert.Single(device.Addresses);
    }

    [Fact]
    public void AirPlayOnlyDevice_IsListedButNotStreamable()
    {
        var devices = AirPlayDeviceCatalog.Build(new[] { AirPlay("Apple TV", deviceId: "11:22:33:44:55:66") });

        var device = Assert.Single(devices);
        Assert.Equal("Apple TV", device.Name);
        Assert.Null(device.RaopPort);
        Assert.False(device.SupportsAudioStreaming);
        Assert.Null(device.RtspEndPoint);
    }

    [Fact]
    public void StreamableDevices_AreListedFirst()
    {
        var devices = AirPlayDeviceCatalog.Build(new[]
        {
            AirPlay("Apple TV", "192.168.1.60", deviceId: "11:22:33:44:55:66"),
            Raop(),
        });

        Assert.Equal(2, devices.Count);
        Assert.True(devices[0].SupportsAudioStreaming);
        Assert.False(devices[1].SupportsAudioStreaming);
    }

    [Fact]
    public void RtspEndPoint_TargetsTheRaopPort()
    {
        var devices = AirPlayDeviceCatalog.Build(new[] { Raop(port: 7001) });

        var endPoint = Assert.Single(devices).RtspEndPoint;
        Assert.Equal(new IPEndPoint(IPAddress.Parse("192.168.1.42"), 7001), endPoint);
    }

    [Fact]
    public void RecordsWithoutAddresses_AreDropped()
    {
        var orphan = new MdnsServiceRecord(
            AirPlayServiceKind.Raop,
            "AABBCCDDEEFF@Ghost",
            Array.Empty<IPAddress>(),
            7000,
            MdnsServiceRecord.EmptyTxt);

        Assert.Empty(AirPlayDeviceCatalog.Build(new[] { orphan }));
    }

    [Fact]
    public void EmptyInput_ReturnsEmptyList() =>
        Assert.Empty(AirPlayDeviceCatalog.Build(Array.Empty<MdnsServiceRecord>()));
}

public class AirPlayServiceTypesTests
{
    [Theory]
    [InlineData("_raop._tcp.local.", AirPlayServiceKind.Raop)]
    [InlineData("_raop._tcp.local", AirPlayServiceKind.Raop)]
    [InlineData("A1B2C3@Salon._raop._tcp.local.", AirPlayServiceKind.Raop)]
    [InlineData("_airplay._tcp.local.", AirPlayServiceKind.AirPlay)]
    public void KnownServiceTypes_AreClassified(string serviceType, AirPlayServiceKind expected) =>
        Assert.Equal(expected, AirPlayServiceTypes.Classify(serviceType));

    [Theory]
    [InlineData("_googlecast._tcp.local.")]
    [InlineData("")]
    [InlineData("   ")]
    public void UnrelatedServiceTypes_AreIgnored(string serviceType) =>
        Assert.Null(AirPlayServiceTypes.Classify(serviceType));
}
