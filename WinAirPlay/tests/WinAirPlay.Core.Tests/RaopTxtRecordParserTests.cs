using WinAirPlay.Core.Discovery;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class RaopTxtRecordParserTests
{
    /// <summary>TXT payload as broadcast by a HomePod mini running recent firmware.</summary>
    private static Dictionary<string, string> HomePodTxt() => new(StringComparer.OrdinalIgnoreCase)
    {
        ["txtvers"] = "1",
        ["ch"] = "2",
        ["cn"] = "0,1,2,3",
        ["et"] = "0,3,5",
        ["sr"] = "44100",
        ["ss"] = "16",
        ["tp"] = "UDP",
        ["vn"] = "65537",
        ["vs"] = "366.0",
        ["am"] = "AudioAccessory5,1",
        ["ft"] = "0x4A7FCA00,0xBC354BD0",
        ["pw"] = "false",
        ["pk"] = "b0f2e1d4",
    };

    [Fact]
    public void HomePodAnnouncement_IsParsedIntoCapabilities()
    {
        var caps = RaopTxtRecordParser.Parse(HomePodTxt());

        Assert.Equal(44100, caps.SampleRate);
        Assert.Equal(16, caps.SampleSize);
        Assert.Equal(2, caps.Channels);
        Assert.Equal("UDP", caps.TransportProtocol);
        Assert.Equal("366.0", caps.ServerVersion);
        Assert.Equal("AudioAccessory5,1", caps.Model);
        Assert.Equal("b0f2e1d4", caps.PublicKey);
        Assert.False(caps.RequiresPassword);
        Assert.True(caps.IsHomePod);
    }

    [Fact]
    public void CodecList_IncludesAlac()
    {
        var caps = RaopTxtRecordParser.Parse(HomePodTxt());

        Assert.Equal(
            new[] { RaopCodec.Pcm, RaopCodec.Alac, RaopCodec.Aac, RaopCodec.AacEld },
            caps.Codecs);
        Assert.True(caps.SupportsAlac);
        Assert.True(caps.SupportsRawPcm);
    }

    [Fact]
    public void EncryptionList_WithZero_MeansEncryptionIsOptional()
    {
        var caps = RaopTxtRecordParser.Parse(HomePodTxt());

        Assert.Contains(RaopEncryption.None, caps.EncryptionTypes);
        Assert.False(caps.RequiresEncryption);
    }

    [Fact]
    public void EncryptionList_WithoutZero_MeansEncryptionIsMandatory()
    {
        var txt = HomePodTxt();
        txt["et"] = "1,3";

        var caps = RaopTxtRecordParser.Parse(txt);

        Assert.True(caps.RequiresEncryption);
        Assert.True(caps.SupportsRsaAes);
    }

    [Fact]
    public void Features_CombineTwoHexWordsLowFirst()
    {
        var caps = RaopTxtRecordParser.Parse(HomePodTxt());

        Assert.Equal(0xBC354BD04A7FCA00UL, caps.Features);
    }

    [Fact]
    public void Features_WithSingleWord_UsesItAsLowBits()
    {
        var features = RaopTxtRecordParser.ReadFeatures(
            new Dictionary<string, string> { ["ft"] = "0x527FFEE4" }, "ft");

        Assert.Equal(0x527FFEE4UL, features);
    }

    [Fact]
    public void MissingKeys_FallBackToAirPlayDefaults()
    {
        var caps = RaopTxtRecordParser.Parse(new Dictionary<string, string> { ["txtvers"] = "1" });

        Assert.Equal(44100, caps.SampleRate);
        Assert.Equal(16, caps.SampleSize);
        Assert.Equal(2, caps.Channels);
        Assert.Empty(caps.Codecs);
        Assert.False(caps.RequiresEncryption);
    }

    [Fact]
    public void EmptyTxt_ReturnsUnknown() =>
        Assert.Same(RaopCapabilities.Unknown, RaopTxtRecordParser.Parse(new Dictionary<string, string>()));

    [Fact]
    public void MalformedNumbers_AreIgnoredRatherThanThrowing()
    {
        var txt = new Dictionary<string, string>
        {
            ["sr"] = "not-a-number",
            ["cn"] = "1,abc,2",
            ["ft"] = "garbage",
        };

        var caps = RaopTxtRecordParser.Parse(txt);

        Assert.Equal(44100, caps.SampleRate);
        Assert.Equal(new[] { RaopCodec.Alac, RaopCodec.Aac }, caps.Codecs);
        Assert.Null(caps.Features);
    }

    [Theory]
    [InlineData("true", true)]
    [InlineData("1", true)]
    [InlineData("false", false)]
    [InlineData("0", false)]
    public void PasswordFlag_AcceptsBothSpellings(string raw, bool expected)
    {
        var caps = RaopTxtRecordParser.Parse(new Dictionary<string, string> { ["pw"] = raw });

        Assert.Equal(expected, caps.RequiresPassword);
    }
}
