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
    /// Default false — production UI should surface a trust prompt instead.
    /// </summary>
    public bool AcceptAnyCertificate { get; init; }

    /// <summary>Optional allow-list of certificate thumbprints (SHA-1/SHA-256 hex).</summary>
    public string[]? CertificateThumbprintAllowList { get; init; }

    public TimeSpan ConnectTimeout { get; init; } = TimeSpan.FromSeconds(30);

    public TimeSpan ReadTimeout { get; init; } = TimeSpan.FromSeconds(60);

    public int RetryCount { get; init; } = 3;

    public TimeSpan RetryDelay { get; init; } = TimeSpan.FromSeconds(1);

    /// <summary>FTP/FTPS passive (PASV) mode. Default true.</summary>
    public bool UsePassive { get; init; } = true;

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
