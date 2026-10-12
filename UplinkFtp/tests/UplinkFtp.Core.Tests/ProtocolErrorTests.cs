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
    public void PasswordAuthFailure_MapsToAuthenticationFailed_WithoutEchoingRawException()
    {
        var msg = ProtocolError.ToUserMessage(new IOException("password rejected for user foo"));
        Assert.Contains("Authentication failed", msg, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("rejected for user", msg, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void PermissionDeniedPassword_MapsToAuthenticationFailed()
    {
        var msg = ProtocolError.ToUserMessage(new Exception("Permission denied (password)."));
        Assert.Contains("Authentication failed", msg, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("(password)", msg, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void BarePermissionDenied_MapsToRemoteWriteHint()
    {
        var msg = ProtocolError.ToUserMessage(new Exception("Permission denied"));
        Assert.Contains("Remote permission denied", msg, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void EmptyOuterWithInnerMessage_UsesInner()
    {
        var msg = ProtocolError.ToUserMessage(new Exception("", new IOException("Remote disk full")));
        Assert.Contains("disk full", msg, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void SecretLikeNonAuth_IsSanitized()
    {
        var msg = ProtocolError.ToUserMessage(new IOException("cannot read password store secret"));
        Assert.Contains("secure connection", msg, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("password store", msg, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Cancel_is_clear()
    {
        Assert.Contains("cancelled", ProtocolError.ToUserMessage(new OperationCanceledException()), StringComparison.OrdinalIgnoreCase);
    }
}
