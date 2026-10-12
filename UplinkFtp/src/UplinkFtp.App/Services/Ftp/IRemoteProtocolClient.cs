using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Dto;

namespace UplinkFtp.Services.Ftp;

/// <summary>
/// Protocol-specific session. Created per connection by <see cref="FtpSessionService"/>.
/// </summary>
internal interface IRemoteProtocolClient : IAsyncDisposable
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

    Task UploadFileAsync(
        string localPath,
        string remotePath,
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
}
