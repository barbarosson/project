using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentFTP;
using FtpAi.Helpers;
using FtpAi.Models.Dto;
using FtpAi.Models.Enums;

namespace FtpAi.Services.Ftp;

/// <summary>FTP / FTPS session backed by FluentFTP <see cref="AsyncFtpClient"/>.</summary>
internal sealed class FluentFtpProtocolClient : IRemoteProtocolClient
{
    private AsyncFtpClient? _client;
    private ConnectionOptions? _options;

    public string ProtocolName => _options?.Protocol == RemoteProtocol.Ftps
        ? "FluentFTP (FTPS)"
        : "FluentFTP (FTP)";

    public bool IsConnected => _client?.IsConnected == true;

    public async Task ConnectAsync(ConnectionOptions options, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (options.Protocol is not (RemoteProtocol.Ftp or RemoteProtocol.Ftps))
        {
            throw new ArgumentException("FluentFtpProtocolClient only supports FTP/FTPS.", nameof(options));
        }

        await DisconnectAsync(cancellationToken).ConfigureAwait(false);

        var client = new AsyncFtpClient(options.Host, options.Username, options.Password ?? string.Empty, options.ResolvePort());
        client.Config.SocketKeepAlive = true;
        client.Config.ConnectTimeout = 30_000;
        client.Config.EncryptionMode = options.Protocol == RemoteProtocol.Ftps
            ? FtpEncryptionMode.Auto
            : FtpEncryptionMode.None;
        client.Config.DataConnectionEncryption = options.Protocol == RemoteProtocol.Ftps;
        client.Config.ValidateAnyCertificate = options.AcceptAnyCertificate;

        await client.Connect(cancellationToken).ConfigureAwait(false);
        _client = client;
        _options = options;
        await EnsureKeepAliveConfiguredAsync(options, cancellationToken).ConfigureAwait(false);
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        if (_client is null)
        {
            return;
        }

        try
        {
            if (_client.IsConnected)
            {
                await _client.Disconnect(cancellationToken).ConfigureAwait(false);
            }
        }
        finally
        {
            await _client.DisposeAsync().ConfigureAwait(false);
            _client = null;
        }
    }

    public async Task<bool> IsAliveAsync(CancellationToken cancellationToken = default)
    {
        if (_client is null || !_client.IsConnected)
        {
            return false;
        }

        return await _client.IsStillConnected(timeout: 5000, token: cancellationToken).ConfigureAwait(false);
    }

    public Task EnsureKeepAliveConfiguredAsync(ConnectionOptions options, CancellationToken cancellationToken = default)
    {
        if (_client is not null)
        {
            _client.Config.SocketKeepAlive = true;
            // FluentFTP has no interval property equivalent to SSH KeepAliveInterval;
            // SocketKeepAlive + IsStillConnected (used by EnsureConnected) covers ADIM 2.
        }

        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<RemoteEntry>> ListDirectoryAsync(
        string remotePath,
        CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var path = RemotePath.Normalize(remotePath);
        var items = await client.GetListing(path, cancellationToken).ConfigureAwait(false);

        return items
            .Where(i => i.Name is not ("." or ".."))
            .Select(i => new RemoteEntry
            {
                Name = i.Name,
                FullPath = string.IsNullOrWhiteSpace(i.FullName)
                    ? RemotePath.Combine(path, i.Name)
                    : RemotePath.Normalize(i.FullName),
                IsDirectory = i.Type == FtpObjectType.Directory,
                Size = i.Type == FtpObjectType.Directory ? 0 : i.Size,
                ModifiedUtc = i.Modified == default ? null : DateTime.SpecifyKind(i.Modified, DateTimeKind.Utc)
            })
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

        var status = await client.DownloadFile(
            localPath,
            remote,
            FtpLocalExists.Overwrite,
            FtpVerify.None,
            progress is null ? null : new Progress<FtpProgress>(p =>
            {
                progress.Report(new TransferProgress
                {
                    BytesTransferred = p.TransferredBytes,
                    TotalBytes = p.Progress is > 0 and < 100
                        ? (long)(p.TransferredBytes / (p.Progress / 100.0))
                        : null,
                    CurrentPath = remote
                });
            }),
            cancellationToken).ConfigureAwait(false);

        if (status == FtpStatus.Failed)
        {
            throw new IOException($"FluentFTP download failed for '{remote}'.");
        }
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
        var status = await client.UploadFile(
            localPath,
            remote,
            FtpRemoteExists.Overwrite,
            createRemoteDir: true,
            FtpVerify.None,
            progress is null ? null : new Progress<FtpProgress>(p =>
            {
                progress.Report(new TransferProgress
                {
                    BytesTransferred = p.TransferredBytes,
                    TotalBytes = p.Progress is > 0 and < 100
                        ? (long)(p.TransferredBytes / (p.Progress / 100.0))
                        : null,
                    CurrentPath = remote
                });
            }),
            cancellationToken).ConfigureAwait(false);

        if (status == FtpStatus.Failed)
        {
            throw new IOException($"FluentFTP upload failed for '{remote}'.");
        }
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

        await client.DownloadDirectory(
            localPath,
            remote,
            FtpFolderSyncMode.Update,
            FtpLocalExists.Overwrite,
            FtpVerify.None,
            rules: null,
            progress is null ? null : new Progress<FtpProgress>(p =>
            {
                progress.Report(new TransferProgress
                {
                    BytesTransferred = p.TransferredBytes,
                    CurrentPath = p.RemotePath ?? remote
                });
            }),
            cancellationToken).ConfigureAwait(false);
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
        await client.UploadDirectory(
            localPath,
            remote,
            FtpFolderSyncMode.Update,
            FtpRemoteExists.Overwrite,
            FtpVerify.None,
            rules: null,
            progress is null ? null : new Progress<FtpProgress>(p =>
            {
                progress.Report(new TransferProgress
                {
                    BytesTransferred = p.TransferredBytes,
                    CurrentPath = p.RemotePath ?? remote
                });
            }),
            cancellationToken).ConfigureAwait(false);
    }

    public async ValueTask DisposeAsync()
    {
        await DisconnectAsync().ConfigureAwait(false);
    }

    private AsyncFtpClient RequireClient()
        => _client ?? throw new InvalidOperationException("Not connected. Call ConnectAsync first.");
}
