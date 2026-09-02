using WinAirPlay.Core.Audio;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class VirtualAudioDeviceCatalogTests
{
    [Theory]
    [InlineData("CABLE Input", true)]
    [InlineData("CABLE-A Input (VB-Audio Cable A)", true)]
    [InlineData("VoiceMeeter Input (VB-Audio VoiceMeeter VAIO)", true)]
    [InlineData("VoiceMeeter Aux Input", true)]
    [InlineData("VB-Audio Virtual Cable", true)]
    [InlineData("Line 1 (Virtual Audio Cable)", true)]
    [InlineData("Speakers (Realtek)", false)]
    [InlineData("HDMI", false)]
    [InlineData("Steam Streaming Speakers", false)]
    [InlineData(null, false)]
    public void RecognisesKnownVirtualRenderEndpoints(string? name, bool expected) =>
        Assert.Equal(expected, VirtualAudioDeviceCatalog.IsVirtualRenderDevice(name));

    [Fact]
    public void Pick_PrefersClassicCableInput()
    {
        var devices = new[]
        {
            new AudioDeviceInfo("spk", "Speakers", true),
            new AudioDeviceInfo("vm", "VoiceMeeter Input", false),
            new AudioDeviceInfo("cable", "CABLE Input", false),
        };

        var picked = VirtualAudioDeviceCatalog.Pick(devices);

        Assert.Equal("cable", picked?.Id);
    }

    [Fact]
    public void Pick_HonoursPreferredIdWhenItIsVirtual()
    {
        var devices = new[]
        {
            new AudioDeviceInfo("cable", "CABLE Input", false),
            new AudioDeviceInfo("vm", "VoiceMeeter Input", false),
        };

        var picked = VirtualAudioDeviceCatalog.Pick(devices, "vm");

        Assert.Equal("vm", picked?.Id);
    }

    [Fact]
    public void Pick_IgnoresPreferredPhysicalDevice()
    {
        var devices = new[]
        {
            new AudioDeviceInfo("spk", "Speakers", true),
            new AudioDeviceInfo("cable", "CABLE Input", false),
        };

        var picked = VirtualAudioDeviceCatalog.Pick(devices, "spk");

        Assert.Equal("cable", picked?.Id);
    }
}

public class PcmVolumeTests
{
    [Fact]
    public void UnityScalar_LeavesSamplesUntouched()
    {
        var pcm = new byte[] { 0x00, 0x40, 0xFF, 0x7F };

        PcmVolume.ApplyScalar(pcm, 1f);

        Assert.Equal(new byte[] { 0x00, 0x40, 0xFF, 0x7F }, pcm);
    }

    [Fact]
    public void ZeroScalar_SilencesTheBlock()
    {
        var pcm = new byte[] { 0x00, 0x40, 0xFF, 0x7F };

        PcmVolume.ApplyScalar(pcm, 0f);

        Assert.Equal(new byte[] { 0, 0, 0, 0 }, pcm);
    }

    [Fact]
    public void HalfScalar_ScalesAPositiveSample()
    {
        var pcm = new byte[2];
        pcm[0] = 0x00;
        pcm[1] = 0x40; // 16384

        PcmVolume.ApplyScalar(pcm, 0.5f);

        var scaled = (short)(pcm[0] | (pcm[1] << 8));
        Assert.Equal(8192, scaled);
    }
}

public class AudioOutputRouterTests
{
    [Fact]
    public void Auto_WithVirtualCable_RedirectsAndDoesNotMute()
    {
        var devices = new FakeAudioDeviceEnumerator();
        devices.Devices.Add(new AudioDeviceInfo("spk", "Speakers", true));
        devices.Devices.Add(new AudioDeviceInfo("cable", "CABLE Input", false));
        var policy = new RecordingEndpointPolicy("spk");
        var router = new AudioOutputRouter(devices, policy);

        var plan = router.CreatePlan(new AudioRoutingRequest(
            AudioRoutingMode.Auto, "spk", null, MuteLocalSpeakers: true, FollowWindowsVolume: true));

        Assert.Equal(AudioRoutingKind.Redirect, plan.Kind);
        Assert.Equal("cable", plan.CaptureDeviceId);
        Assert.False(plan.MuteLocalSpeakers);
        Assert.False(plan.IndependentOfEndpointVolume);
        Assert.False(plan.ApplyEndpointVolume);
        Assert.True(plan.SwitchDefaultEndpoint);

        Assert.True(router.Apply(plan));
        Assert.Equal("cable", policy.GetDefaultRenderId(AudioDeviceRole.Multimedia));

        router.Restore();
        Assert.Equal("spk", policy.GetDefaultRenderId(AudioDeviceRole.Multimedia));
    }

    [Fact]
    public void Auto_WithoutVirtualCable_MutesAndFollowsWindowsVolume()
    {
        var devices = new FakeAudioDeviceEnumerator();
        devices.Devices.Add(new AudioDeviceInfo("spk", "Speakers", true));
        var router = new AudioOutputRouter(devices, new RecordingEndpointPolicy("spk"));

        var plan = router.CreatePlan(new AudioRoutingRequest(
            AudioRoutingMode.Auto, null, null, MuteLocalSpeakers: true, FollowWindowsVolume: true));

        Assert.Equal(AudioRoutingKind.Mute, plan.Kind);
        Assert.True(plan.MuteLocalSpeakers);
        Assert.True(plan.IndependentOfEndpointVolume);
        Assert.True(plan.ApplyEndpointVolume);
        Assert.False(plan.SwitchDefaultEndpoint);
    }

    [Fact]
    public void MuteSpeakersMode_IgnoresAnAvailableCable()
    {
        var devices = new FakeAudioDeviceEnumerator();
        devices.Devices.Add(new AudioDeviceInfo("spk", "Speakers", true));
        devices.Devices.Add(new AudioDeviceInfo("cable", "CABLE Input", false));
        var router = new AudioOutputRouter(devices, new RecordingEndpointPolicy("spk"));

        var plan = router.CreatePlan(new AudioRoutingRequest(
            AudioRoutingMode.MuteSpeakers, "spk", null, MuteLocalSpeakers: true, FollowWindowsVolume: true));

        Assert.Equal(AudioRoutingKind.Mute, plan.Kind);
        Assert.Equal("spk", plan.CaptureDeviceId);
    }

    [Fact]
    public void VirtualCableMode_WithoutCable_FallsBackToMute()
    {
        var devices = new FakeAudioDeviceEnumerator();
        devices.Devices.Add(new AudioDeviceInfo("spk", "Speakers", true));
        var router = new AudioOutputRouter(devices, new RecordingEndpointPolicy("spk"));

        var plan = router.CreatePlan(new AudioRoutingRequest(
            AudioRoutingMode.VirtualCable, null, null, MuteLocalSpeakers: true, FollowWindowsVolume: true));

        Assert.Equal(AudioRoutingKind.Mute, plan.Kind);
    }

    [Fact]
    public void Apply_IsNoOpWhenTheCableIsAlreadyDefault()
    {
        var devices = new FakeAudioDeviceEnumerator();
        devices.Devices.Add(new AudioDeviceInfo("cable", "CABLE Input", true));
        var policy = new RecordingEndpointPolicy("cable");
        var router = new AudioOutputRouter(devices, policy);

        var plan = router.CreatePlan(new AudioRoutingRequest(
            AudioRoutingMode.Auto, null, null, true, true));

        Assert.False(plan.SwitchDefaultEndpoint);
        Assert.True(router.Apply(plan));
        Assert.Empty(policy.Sets);
    }
}

internal sealed class RecordingEndpointPolicy : IDefaultAudioEndpointPolicy
{
    private readonly Dictionary<AudioDeviceRole, string?> _current = new();

    public RecordingEndpointPolicy(string? multimediaDefault)
    {
        foreach (AudioDeviceRole role in Enum.GetValues<AudioDeviceRole>())
        {
            _current[role] = multimediaDefault;
        }
    }

    public List<(string Id, AudioDeviceRole Role)> Sets { get; } = new();

    public string? GetDefaultRenderId(AudioDeviceRole role) =>
        _current.GetValueOrDefault(role);

    public void SetDefaultRender(string deviceId, AudioDeviceRole role)
    {
        Sets.Add((deviceId, role));
        _current[role] = deviceId;
    }
}
