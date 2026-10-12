using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Dto;

namespace UplinkFtp.Services.Ftp;

/// <summary>
/// Protocol-specific session. Created per connection by <see cref="FtpSessionService"/> / <see cref="ConnectionPool"/>.
/// </summary>
public interface IRemoteProtocolClient : IAsyncDisposable
{
    string ProtocolName { get; }

    bool IsConnected { get; }

    Task ConnectAsync(ConnectionOptions options, CancellationToken cancellationToken = default);

    Task DisconnectAsync(CancellationToken cancellationToken = default);

    /// <summary>Cheap liveness check; may send NOOP / rely on socket state.</summary>
    Task<bool> IsAliveAsync(CancellationToken cancellationToken = default);

    Task EnsureKeepAliveConfiguredAsync(ConnectionOptions options, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemoteEntry>> ListDirectoryAsync(string remotePath, CancellationToken cancellationToken = default);

    Task DownloadFileAsync(
        string remotePath,
        string localPath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default);

    Task DownloadFileAsync(
        string remotePath,
        string localPath,
        long resumeOffset,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default);

    Task UploadFileAsync(
        string localPath,
        string remotePath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default);

    Task UploadFileAsync(
        string localPath,
        string remotePath,
        long resumeOffset,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default);

    Task DownloadDirectoryAsync(
        string remotePath,
        string localPath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default);

    Task UploadDirectoryAsync(
        string localPath,
        string remotePath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default);

    /// <summary>Rename or move a remote path (same as FTP RNFR/RNTO / SFTP rename).</summary>
    Task RenameAsync(string fromPath, string toPath, CancellationToken cancellationToken = default);

    /// <summary>Read a remote text file into memory (UTF-8).</summary>
    Task<string> ReadTextFileAsync(string remotePath, CancellationToken cancellationToken = default);

    /// <summary>Write UTF-8 text to a remote file (overwrite).</summary>
    Task WriteTextFileAsync(string remotePath, string content, CancellationToken cancellationToken = default);

    /// <summary>
    /// Run a shell command on the remote host. SFTP/SSH only; FTP/FTPS throw <see cref="NotSupportedException"/>.
    /// </summary>
    Task<string> ExecuteShellCommandAsync(string command, CancellationToken cancellationToken = default);
}
