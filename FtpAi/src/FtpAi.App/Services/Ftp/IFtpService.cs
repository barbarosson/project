using System.Threading;
using System.Threading.Tasks;

namespace FtpAi.Services.Ftp;

/// <summary>
/// Abstraction over FTP / FTPS / SFTP sessions.
/// Real FluentFTP + SSH.NET implementations land in ADIM 2.
/// </summary>
public interface IFtpService
{
    /// <summary>Display name for diagnostics / status bar.</summary>
    string Name { get; }

    /// <summary>Whether a remote session is currently open.</summary>
    bool IsConnected { get; }

    Task ConnectAsync(CancellationToken cancellationToken = default);

    Task DisconnectAsync(CancellationToken cancellationToken = default);
}
