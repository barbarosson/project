using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Helpers;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using Renci.SshNet;
using Renci.SshNet.Common;
using Renci.SshNet.Sftp;

namespace UplinkFtp.Services.Sftp;

/// <summary>SFTP session backed by SSH.NET <see cref="SftpClient"/>.</summary>
internal sealed class SftpProtocolClient : IRemoteProtocolClient
{
    private SftpClient? _client;

    public string ProtocolName => "SSH.NET (SFTP)";

    public bool IsConnected => _client?.IsConnected == true;

    public async Task ConnectAsync(ConnectionOptions options, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (options.Protocol != RemoteProtocol.Sftp)
        {
            throw new ArgumentException("SftpProtocolClient only supports SFTP.", nameof(options));
        }

        await DisconnectAsync(cancellationToken).ConfigureAwait(false);

        var connectionInfo = CreateConnectionInfo(options);
        var client = new SftpClient(connectionInfo)
        {
            KeepAliveInterval = options.KeepAliveInterval <= TimeSpan.Zero
                ? TimeSpan.FromSeconds(30)
                : options.KeepAliveInterval
        };

        await client.ConnectAsync(cancellationToken).ConfigureAwait(false);
        _client = client;
    }

    public Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (_client is null)
        {
            return Task.CompletedTask;
        }

        try
        {
            if (_client.IsConnected)
            {
                _client.Disconnect();
            }
        }
        finally
        {
            _client.Dispose();
            _client = null;
        }

        return Task.CompletedTask;
    }

    public Task<bool> IsAliveAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(_client?.IsConnected == true);
    }

    public Task EnsureKeepAliveConfiguredAsync(ConnectionOptions options, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (_client is not null)
        {
            _client.KeepAliveInterval = options.KeepAliveInterval <= TimeSpan.Zero
                ? TimeSpan.FromSeconds(30)
                : options.KeepAliveInterval;
        }

        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<RemoteEntry>> ListDirectoryAsync(
        string remotePath,
        CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var path = RemotePath.Normalize(remotePath);
        var entries = new List<RemoteEntry>();

        await foreach (var item in client.ListDirectoryAsync(path, cancellationToken).ConfigureAwait(false))
        {
            if (item.Name is "." or "..")
            {
                continue;
            }

            entries.Add(new RemoteEntry
            {
                Name = item.Name,
                FullPath = RemotePath.Normalize(item.FullName),
                IsDirectory = item.IsDirectory,
                Size = item.IsDirectory ? 0 : item.Length,
                ModifiedUtc = item.LastWriteTimeUtc == default ? null : item.LastWriteTimeUtc
            });
        }

        return entries
            .OrderByDescending(e => e.IsDirectory)
            .ThenBy(e => e.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task DownloadFileAsync(
        string remotePath,
        string localPath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var remote = RemotePath.Normalize(remotePath);
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(localPath))!);

        await using var output = new FileStream(
            localPath,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 81920,
            useAsync: true);

        IProgress<DownloadFileProgressReport>? reported = progress is null
            ? null
            : new Progress<DownloadFileProgressReport>(report => progress.Report(new TransferProgress
            {
                BytesTransferred = (long)report.TotalBytesDownloaded,
                CurrentPath = remote
            }));

        await client.DownloadFileAsync(remote, output, reported, cancellationToken).ConfigureAwait(false);
    }

    public async Task UploadFileAsync(
        string localPath,
        string remotePath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        if (!File.Exists(localPath))
        {
            throw new FileNotFoundException("Local file not found.", localPath);
        }

        var remote = RemotePath.Normalize(remotePath);
        await EnsureRemoteDirectoryAsync(client, RemotePath.GetDirectoryName(remote), cancellationToken)
            .ConfigureAwait(false);

        await using var input = new FileStream(
            localPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 81920,
            useAsync: true);

        var total = input.Length;
        IProgress<UploadFileProgressReport>? reported = progress is null
            ? null
            : new Progress<UploadFileProgressReport>(report => progress.Report(new TransferProgress
            {
                BytesTransferred = (long)report.TotalBytesUploaded,
                TotalBytes = total,
                CurrentPath = remote
            }));

        await client.UploadFileAsync(input, remote, canOverride: true, reported, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task DownloadDirectoryAsync(
        string remotePath,
        string localPath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var remote = RemotePath.Normalize(remotePath);
        Directory.CreateDirectory(localPath);
        await DownloadDirectoryRecursiveAsync(client, remote, localPath, progress, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task UploadDirectoryAsync(
        string localPath,
        string remotePath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        if (!Directory.Exists(localPath))
        {
            throw new DirectoryNotFoundException($"Local directory not found: {localPath}");
        }

        var remote = RemotePath.Normalize(remotePath);
        await UploadDirectoryRecursiveAsync(client, localPath, remote, progress, cancellationToken)
            .ConfigureAwait(false);
    }

    public async ValueTask DisposeAsync()
    {
        await DisconnectAsync().ConfigureAwait(false);
    }

    private static ConnectionInfo CreateConnectionInfo(ConnectionOptions options)
    {
        var port = options.ResolvePort();
        var authMethods = new List<AuthenticationMethod>();

        if (!string.IsNullOrWhiteSpace(options.PrivateKeyPath))
        {
            if (!File.Exists(options.PrivateKeyPath))
            {
                throw new FileNotFoundException("SFTP private key not found.", options.PrivateKeyPath);
            }

            var keyFile = string.IsNullOrEmpty(options.Password)
                ? new PrivateKeyFile(options.PrivateKeyPath)
                : new PrivateKeyFile(options.PrivateKeyPath, options.Password);
            authMethods.Add(new PrivateKeyAuthenticationMethod(options.Username, keyFile));
        }

        if (!string.IsNullOrEmpty(options.Password) || authMethods.Count == 0)
        {
            authMethods.Add(new PasswordAuthenticationMethod(options.Username, options.Password ?? string.Empty));
        }

        return new ConnectionInfo(options.Host, port, options.Username, authMethods.ToArray());
    }

    private async Task DownloadDirectoryRecursiveAsync(
        SftpClient client,
        string remoteDir,
        string localDir,
        IProgress<TransferProgress>? progress,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(localDir);

        await foreach (var item in client.ListDirectoryAsync(remoteDir, cancellationToken).ConfigureAwait(false))
        {
            if (item.Name is "." or "..")
            {
                continue;
            }

            var remoteChild = RemotePath.Normalize(item.FullName);
            var localChild = Path.Combine(localDir, item.Name);

            if (item.IsDirectory)
            {
                await DownloadDirectoryRecursiveAsync(client, remoteChild, localChild, progress, cancellationToken)
                    .ConfigureAwait(false);
            }
            else if (item.IsRegularFile || !item.IsDirectory)
            {
                await DownloadFileAsync(remoteChild, localChild, progress, cancellationToken).ConfigureAwait(false);
            }
        }
    }

    private async Task UploadDirectoryRecursiveAsync(
        SftpClient client,
        string localDir,
        string remoteDir,
        IProgress<TransferProgress>? progress,
        CancellationToken cancellationToken)
    {
        await EnsureRemoteDirectoryAsync(client, remoteDir, cancellationToken).ConfigureAwait(false);

        foreach (var directory in Directory.EnumerateDirectories(localDir))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var name = Path.GetFileName(directory);
            await UploadDirectoryRecursiveAsync(
                client,
                directory,
                RemotePath.Combine(remoteDir, name),
                progress,
                cancellationToken).ConfigureAwait(false);
        }

        foreach (var file in Directory.EnumerateFiles(localDir))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var name = Path.GetFileName(file);
            await UploadFileAsync(file, RemotePath.Combine(remoteDir, name), progress, cancellationToken)
                .ConfigureAwait(false);
        }
    }

    private static async Task EnsureRemoteDirectoryAsync(
        SftpClient client,
        string remoteDir,
        CancellationToken cancellationToken)
    {
        var path = RemotePath.Normalize(remoteDir);
        if (path == "/" || await client.ExistsAsync(path, cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var current = "";
        foreach (var segment in segments)
        {
            current += "/" + segment;
            if (!await client.ExistsAsync(current, cancellationToken).ConfigureAwait(false))
            {
                try
                {
                    await client.CreateDirectoryAsync(current, cancellationToken).ConfigureAwait(false);
                }
                catch (SshException)
                {
                    // Race / already created by peer — ignore if it now exists.
                    if (!await client.ExistsAsync(current, cancellationToken).ConfigureAwait(false))
                    {
                        throw;
                    }
                }
            }
        }
    }

    private SftpClient RequireClient()
        => _client ?? throw new InvalidOperationException("Not connected. Call ConnectAsync first.");
}
