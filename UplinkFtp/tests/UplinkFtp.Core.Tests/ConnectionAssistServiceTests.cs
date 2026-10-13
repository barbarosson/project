using UplinkFtp.Services.Assist;

namespace UplinkFtp.Core.Tests;

public sealed class ConnectionAssistServiceTests
{
    [Fact]
    public void Parse_SftpUri_ExtractsFields()
    {
        var result = ConnectionAssistService.ParseConnectionText("sftp://barba@127.0.0.1:22/home");

        Assert.True(result.Success);
        Assert.Equal("127.0.0.1", result.Host);
        Assert.Equal(22, result.Port);
        Assert.Equal("SFTP", result.Protocol);
        Assert.Equal("barba", result.Username);
        Assert.Equal("/home", result.RemotePath);
    }

    [Fact]
    public void Parse_HostPortLine_InfersSftp()
    {
        var result = ConnectionAssistService.ParseConnectionText("127.0.0.1:22");

        Assert.True(result.Success);
        Assert.Equal("127.0.0.1", result.Host);
        Assert.Equal(22, result.Port);
        Assert.Equal("SFTP", result.Protocol);
    }

    [Fact]
    public void Diagnose_ConnectionRefused_SuggestsServerCheck()
    {
        var diagnosis = ConnectionAssistService.Diagnose(
        [
            "15:42:10 [INFO] Connecting to 127.0.0.1:22 via Sftp...",
            "15:42:11 [ERROR] Connection refused"
        ]);

        Assert.Equal("Connection refused", diagnosis.Title);
        Assert.Contains("OpenSSH", diagnosis.Advice, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("SFTP", diagnosis.SuggestedProtocol);
        Assert.Equal(22, diagnosis.SuggestedPort);
    }

    [Fact]
    public void DefaultPort_MatchesProtocol()
    {
        Assert.Equal(21, ConnectionAssistService.DefaultPort("FTP"));
        Assert.Equal(990, ConnectionAssistService.DefaultPort("FTPS"));
        Assert.Equal(22, ConnectionAssistService.DefaultPort("SFTP"));
    }
}
