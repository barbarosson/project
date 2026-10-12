using System;
using UplinkFtp.Models.Enums;

namespace UplinkFtp.Models.Dto;

/// <summary>Connection profile passed to <see cref="Services.Ftp.IFtpService.ConnectAsync"/>.</summary>
public sealed class ConnectionOptions
{
    public required string Host { get; init; }

    /// <summary>0 = protocol default (21 / 990 / 22).</summary>
    public int Port { get; init; }

    public string Username { get; init; } = "anonymous";

    public string? Password { get; init; }

    /// <summary>Optional OpenSSH private key path for SFTP.</summary>
    public string? PrivateKeyPath { get; init; }

    public RemoteProtocol Protocol { get; init; } = RemoteProtocol.Ftp;

    /// <summary>
    /// When true, FTPS accepts any server certificate (dev / self-signed).
    /// Production UI should surface a trust prompt instead.
    /// </summary>
    public bool AcceptAnyCertificate { get; init; }

    public TimeSpan KeepAliveInterval { get; init; } = TimeSpan.FromSeconds(30);

    public int ResolvePort() => Port > 0
        ? Port
        : Protocol switch
        {
            RemoteProtocol.Ftps => 990,
            RemoteProtocol.Sftp => 22,
            _ => 21
        };
}
