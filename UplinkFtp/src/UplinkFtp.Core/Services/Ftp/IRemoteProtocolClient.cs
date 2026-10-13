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

    Task<IReadOnlyList<RemoteEntry>> ListDirectoryAsync(
        string remotePath,
        RemoteListOptions? options = null,
        CancellationToken cancellationToken = default);

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

    Task RenameAsync(string fromPath, string toPath, CancellationToken cancellationToken = default);

    Task CreateDirectoryAsync(string remotePath, CancellationToken cancellationToken = default);

    Task CreateEmptyFileAsync(string remotePath, CancellationToken cancellationToken = default);

    Task DeleteFileAsync(string remotePath, CancellationToken cancellationToken = default);

    Task DeleteDirectoryAsync(string remotePath, CancellationToken cancellationToken = default);

    Task SetPermissionsAsync(
        string remotePath,
        UnixFilePermissions permissions,
        CancellationToken cancellationToken = default);

    Task<UnixFilePermissions?> GetPermissionsAsync(
        string remotePath,
        CancellationToken cancellationToken = default);

    Task<DirectorySizeResult> CalculateDirectorySizeAsync(
        string remotePath,
        IProgress<DirectorySizeResult>? progress = null,
        CancellationToken cancellationToken = default);

    Task<string> ReadTextFileAsync(string remotePath, CancellationToken cancellationToken = default);

    Task WriteTextFileAsync(string remotePath, string content, CancellationToken cancellationToken = default);

    /// <summary>
    /// Run a shell command on the remote host. SFTP/SSH only; FTP/FTPS throw <see cref="NotSupportedException"/>.
    /// </summary>
    Task<string> ExecuteShellCommandAsync(string command, CancellationToken cancellationToken = default);
}
