using System.Net.Sockets;
using System.Security.Authentication;
using UplinkFtp.Services.Protocol;

namespace UplinkFtp.Core.Tests;

public sealed class ProtocolErrorTests
{
    [Fact]
    public void Maps_timeout_and_auth()
    {
        Assert.Contains("timed out", ProtocolError.ToUserMessage(new TimeoutException()), StringComparison.OrdinalIgnoreCase);
        Assert.Contains("TLS", ProtocolError.ToUserMessage(new AuthenticationException("bad cert")), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Maps_socket_host_not_found()
    {
        var msg = ProtocolError.ToUserMessage(new SocketException((int)SocketError.HostNotFound));
        Assert.Contains("Host not found", msg, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Scrubs_secret_like_messages()
    {
        var msg = ProtocolError.ToUserMessage(new IOException("password rejected for user"));
        Assert.DoesNotContain("password", msg, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Cancel_is_clear()
    {
        Assert.Contains("cancelled", ProtocolError.ToUserMessage(new OperationCanceledException()), StringComparison.OrdinalIgnoreCase);
    }
}
