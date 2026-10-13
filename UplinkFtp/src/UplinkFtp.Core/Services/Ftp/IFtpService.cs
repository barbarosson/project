using System;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Dto;

namespace UplinkFtp.Services.Ftp;

/// <summary>
/// Unified FTP / FTPS / SFTP session API for ViewModels and the transfer queue.
/// File-management APIs live on <see cref="IFtpFileOperations"/>.
/// </summary>
public interface IFtpService : IFtpFileOperations, IAsyncDisposable
{
    /// <summary>Active protocol display name (e.g. FluentFTP / SSH.NET SFTP).</summary>
    string Name { get; }

    bool IsConnected { get; }

    /// <summary>Last successful connection options (password retained in-process for reconnect).</summary>
    ConnectionOptions? ActiveConnection { get; }

    Task ConnectAsync(ConnectionOptions options, CancellationToken cancellationToken = default);

    Task DisconnectAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Verifies the session; reconnects with <see cref="ActiveConnection"/> when dropped.
    /// </summary>
    Task EnsureConnectedAsync(CancellationToken cancellationToken = default);

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

    /// <summary>
    /// Leases a protocol client from the connection pool for a transfer worker.
    /// Caller must dispose the lease to return the client.
    /// </summary>
    Task<IConnectionLease> OpenTransferClientAsync(CancellationToken cancellationToken = default);

    Task<string> ReadTextFileAsync(string remotePath, CancellationToken cancellationToken = default);

    Task WriteTextFileAsync(string remotePath, string content, CancellationToken cancellationToken = default);

    /// <summary>SSH shell exec — SFTP connections only.</summary>
    Task<string> ExecuteShellCommandAsync(string command, CancellationToken cancellationToken = default);
}
