using WinAirPlay.Core.Rtsp;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class RtspMessageParserTests
{
    [Fact]
    public void SetupResponse_IsParsedIntoStatusAndHeaders()
    {
        const string head =
            "RTSP/1.0 200 OK\r\n" +
            "CSeq: 3\r\n" +
            "Session: 1A2B3C4D\r\n" +
            "Transport: RTP/AVP/UDP;unicast;mode=record;server_port=6000;control_port=6001;timing_port=6002\r\n" +
            "Audio-Jack-Status: connected";

        var (statusCode, reason, headers) = RtspMessageParser.ParseHead(head);

        Assert.Equal(200, statusCode);
        Assert.Equal("OK", reason);
        Assert.Equal("3", headers["CSeq"]);
        Assert.Equal("1A2B3C4D", headers["Session"]);
        Assert.Equal("connected", headers["Audio-Jack-Status"]);
    }

    [Fact]
    public void HeaderLookup_IsCaseInsensitive()
    {
        var (_, _, headers) = RtspMessageParser.ParseHead("RTSP/1.0 200 OK\r\nSession: ABC");

        Assert.Equal("ABC", headers["session"]);
    }

    [Fact]
    public void FoldedHeader_IsJoinedWithThePreviousLine()
    {
        const string head =
            "RTSP/1.0 200 OK\r\n" +
            "Transport: RTP/AVP/UDP;unicast;\r\n" +
            "\tserver_port=6000";

        var (_, _, headers) = RtspMessageParser.ParseHead(head);

        Assert.Equal("RTP/AVP/UDP;unicast; server_port=6000", headers["Transport"]);
    }

    [Fact]
    public void MissingReasonPhrase_IsTolerated()
    {
        var (statusCode, reason, _) = RtspMessageParser.ParseHead("RTSP/1.0 453\r\nCSeq: 1");

        Assert.Equal(453, statusCode);
        Assert.Equal(string.Empty, reason);
    }

    [Theory]
    [InlineData("HTTP/1.1 200 OK")]
    [InlineData("garbage")]
    [InlineData("RTSP/1.0 NOT-A-NUMBER OK")]
    public void NonRtspStatusLine_Throws(string statusLine) =>
        Assert.Throws<RtspException>(() => RtspMessageParser.ParseHead(statusLine));

    [Fact]
    public void Parameters_SplitOnSemicolons()
    {
        var parameters = RtspMessageParser.ParseParameters(
            "RTP/AVP/UDP;unicast;mode=record;server_port=6000;control_port=6001");

        Assert.Equal(string.Empty, parameters["unicast"]);
        Assert.Equal("record", parameters["mode"]);
        Assert.Equal("6000", parameters["server_port"]);
        Assert.Equal("6001", parameters["control_port"]);
    }

    [Fact]
    public void Parameters_OfEmptyHeader_AreEmpty() =>
        Assert.Empty(RtspMessageParser.ParseParameters(null));
}

public class RtspRequestTests
{
    [Fact]
    public void RequestWithoutBody_RendersRequestLineAndHeaders()
    {
        var request = new RtspRequest("OPTIONS", "*")
            .WithHeader("CSeq", "1")
            .WithHeader("User-Agent", "AirPlay/366.0");

        Assert.Equal(
            "OPTIONS * RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: AirPlay/366.0\r\n\r\n",
            request.ToString());
    }

    [Fact]
    public void RequestWithBody_AddsContentTypeAndLength()
    {
        var request = new RtspRequest("ANNOUNCE", "rtsp://192.168.0.10/123")
            .WithHeader("CSeq", "2")
            .WithBody("v=0\r\n", "application/sdp");

        var text = request.ToString();

        Assert.Contains("Content-Type: application/sdp\r\n", text);
        Assert.Contains("Content-Length: 5\r\n", text);
        Assert.EndsWith("\r\n\r\nv=0\r\n", text);
    }

    [Fact]
    public void MethodIsUpperCased() =>
        Assert.Equal("RECORD", new RtspRequest("record", "*").Method);

    [Fact]
    public void GetHeader_IgnoresCase()
    {
        var request = new RtspRequest("SETUP", "*").WithHeader("Transport", "RTP/AVP/UDP");

        Assert.Equal("RTP/AVP/UDP", request.GetHeader("transport"));
        Assert.Null(request.GetHeader("Session"));
    }
}
