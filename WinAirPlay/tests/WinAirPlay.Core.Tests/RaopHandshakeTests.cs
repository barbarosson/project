using System.Net;
using WinAirPlay.Core.Raop;
using WinAirPlay.Core.Rtsp;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class SdpBuilderTests
{
    private static string Build(RaopMediaFormat? format = null) => SdpBuilder.BuildAnnounce(
        sessionId: 1234567890,
        localAddress: IPAddress.Parse("192.168.0.10"),
        remoteAddress: IPAddress.Parse("192.168.0.121"),
        format: format ?? RaopMediaFormat.AppleLossless(RaopAudioParameters.Default));

    [Fact]
    public void AlacAnnounceBody_MatchesTheRaopLayout()
    {
        const string expected =
            "v=0\r\n" +
            "o=iTunes 1234567890 0 IN IP4 192.168.0.10\r\n" +
            "s=iTunes\r\n" +
            "c=IN IP4 192.168.0.121\r\n" +
            "t=0 0\r\n" +
            "m=audio 0 RTP/AVP 96\r\n" +
            "a=rtpmap:96 AppleLossless\r\n" +
            "a=fmtp:96 352 0 16 40 10 14 2 255 0 0 44100\r\n";

        Assert.Equal(expected, Build());
    }

    [Fact]
    public void PcmAnnounceBody_UsesL16AndOmitsFmtp()
    {
        var sdp = Build(RaopMediaFormat.RawPcm(RaopAudioParameters.Default));

        Assert.Contains("m=audio 0 RTP/AVP 96\r\n", sdp);
        Assert.Contains("a=rtpmap:96 L16/44100/2\r\n", sdp);
        Assert.DoesNotContain("a=fmtp:", sdp);
    }

    [Fact]
    public void EncryptionKeys_AreAppendedOnlyWhenSupplied()
    {
        var plain = Build();
        Assert.DoesNotContain("rsaaeskey", plain);
        Assert.DoesNotContain("aesiv", plain);

        var encrypted = SdpBuilder.BuildAnnounce(
            1, IPAddress.Loopback, IPAddress.Loopback,
            RaopMediaFormat.AppleLossless(RaopAudioParameters.Default),
            rsaAesKey: "KEY", aesIv: "IV");

        Assert.Contains("a=rsaaeskey:KEY\r\n", encrypted);
        Assert.Contains("a=aesiv:IV\r\n", encrypted);
    }

    [Fact]
    public void IPv6Address_SwitchesTheSdpAddressType()
    {
        var sdp = SdpBuilder.BuildAnnounce(
            1, IPAddress.Parse("fe80::1"), IPAddress.Parse("fe80::2"),
            RaopMediaFormat.AppleLossless(RaopAudioParameters.Default));

        Assert.Contains("o=iTunes 1 0 IN IP6 fe80::1\r\n", sdp);
        Assert.Contains("c=IN IP6 fe80::2\r\n", sdp);
    }
}

public class RaopMediaFormatTests
{
    [Fact]
    public void RawPcm_NeedsByteSwappingBecauseL16IsNetworkOrder() =>
        Assert.True(RaopMediaFormat.RawPcm(RaopAudioParameters.Default).RequiresBigEndianPayload);

    [Fact]
    public void AppleLossless_KeepsTheEncoderByteOrder() =>
        Assert.False(RaopMediaFormat.AppleLossless(RaopAudioParameters.Default).RequiresBigEndianPayload);

    [Fact]
    public void For_MapsTheCodecEnum()
    {
        var audio = RaopAudioParameters.Default;

        Assert.Equal(RaopStreamCodec.RawPcm, RaopMediaFormat.For(RaopStreamCodec.RawPcm, audio).Codec);
        Assert.Equal("AppleLossless", RaopMediaFormat.For(RaopStreamCodec.AppleLossless, audio).RtpMap);
    }

    [Fact]
    public void RtpMap_FollowsTheAudioParameters()
    {
        var format = RaopMediaFormat.RawPcm(new RaopAudioParameters(SampleRate: 48000, Channels: 1));

        Assert.Equal("L16/48000/1", format.RtpMap);
    }
}

public class RaopAudioParametersTests
{
    [Fact]
    public void DefaultsMatchThePhase1CaptureFormat()
    {
        var audio = RaopAudioParameters.Default;

        Assert.Equal(352, audio.FramesPerPacket);
        Assert.Equal(44100, audio.SampleRate);
        Assert.Equal(16, audio.BitDepth);
        Assert.Equal(2, audio.Channels);
        Assert.Equal(1408, audio.BytesPerPacket);
    }

    [Fact]
    public void FmtpParameters_UseAppleReferenceEncoderValues() =>
        Assert.Equal("352 0 16 40 10 14 2 255 0 0 44100", RaopAudioParameters.Default.ToFmtpParameters());
}

public class RaopTransportTests
{
    [Fact]
    public void AllThreePortsAreExtracted()
    {
        var transport = RaopTransport.Parse(
            "RTP/AVP/UDP;unicast;mode=record;server_port=6000;control_port=6001;timing_port=6002");

        Assert.Equal(6000, transport.AudioPort);
        Assert.Equal(6001, transport.ControlPort);
        Assert.Equal(6002, transport.TimingPort);
    }

    [Fact]
    public void PortRange_UsesTheFirstPort()
    {
        var transport = RaopTransport.Parse("RTP/AVP/UDP;unicast;server_port=6000-6001");

        Assert.Equal(6000, transport.AudioPort);
    }

    [Fact]
    public void MissingOptionalPorts_DefaultToZero()
    {
        var transport = RaopTransport.Parse("RTP/AVP/UDP;unicast;server_port=6000");

        Assert.Equal(0, transport.ControlPort);
        Assert.Equal(0, transport.TimingPort);
    }

    [Theory]
    [InlineData("RTP/AVP/UDP;unicast;mode=record")]
    [InlineData("")]
    [InlineData(null)]
    public void MissingServerPort_Throws(string? header) =>
        Assert.Throws<RtspException>(() => RaopTransport.Parse(header));
}
