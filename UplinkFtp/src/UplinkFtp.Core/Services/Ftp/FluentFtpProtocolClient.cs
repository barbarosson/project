using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentFTP;
using UplinkFtp.Helpers;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Protocol;

namespace UplinkFtp.Services.Ftp;

/// <summary>FTP / FTPS session backed by FluentFTP <see cref="AsyncFtpClient"/>.</summary>
public sealed class FluentFtpProtocolClient : IRemoteProtocolClient
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
        client.Config.ConnectTimeout = (int)Math.Clamp(options.ConnectTimeout.TotalMilliseconds, 1_000, 600_000);
        client.Config.ReadTimeout = (int)Math.Clamp(options.ReadTimeout.TotalMilliseconds, 1_000, 600_000);
        client.Config.DataConnectionType = options.UsePassive
            ? FtpDataConnectionType.AutoPassive
            : FtpDataConnectionType.AutoActive;
        client.Config.EncryptionMode = options.Protocol == RemoteProtocol.Ftps
            ? FtpEncryptionMode.Auto
            : FtpEncryptionMode.None;
        client.Config.DataConnectionEncryption = options.Protocol == RemoteProtocol.Ftps;
        // Never enable ValidateAnyCertificate unless the caller opted in.
        client.Config.ValidateAnyCertificate = options.AcceptAnyCertificate;

        if (!options.AcceptAnyCertificate &&
            options.CertificateThumbprintAllowList is { Length: > 0 } allowList)
        {
            var allowed = new HashSet<string>(
                allowList.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()),
                StringComparer.OrdinalIgnoreCase);
            client.Config.ValidateAnyCertificate = false;
            client.ValidateCertificate += (_, e) =>
            {
                var thumb = e.Certificate?.GetCertHashString();
                e.Accept = thumb is not null && allowed.Contains(thumb);
            };
        }

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
        }

        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<RemoteEntry>> ListDirectoryAsync(
        string remotePath,
        RemoteListOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        options ??= RemoteListOptions.Default;
        var client = RequireClient();
        var path = RemotePath.Normalize(remotePath);
        var listOpts = options.IncludeHidden
            ? FtpListOption.AllFiles | FtpListOption.ForceList
            : FtpListOption.Auto;
        var items = await client.GetListing(path, listOpts, cancellationToken).ConfigureAwait(false);

        return items
            .Where(i => i.Name is not ("." or ".."))
            .Where(i => options.IncludeHidden || !i.Name.StartsWith(".", StringComparison.Ordinal))
            .Select(i => new RemoteEntry
            {
                Name = i.Name,
                FullPath = string.IsNullOrWhiteSpace(i.FullName)
                    ? RemotePath.Combine(path, i.Name)
                    : RemotePath.Normalize(i.FullName),
                IsDirectory = i.Type == FtpObjectType.Directory,
                Size = i.Type == FtpObjectType.Directory ? 0 : i.Size,
                ModifiedUtc = i.Modified == default ? null : DateTime.SpecifyKind(i.Modified, DateTimeKind.Utc),
                IsSymlink = i.Type == FtpObjectType.Link,
                LinkTarget = i.LinkTarget,
                UnixMode = ToUnixMode(i)
            })
            .OrderByDescending(e => e.IsDirectory)
            .ThenBy(e => e.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public Task DownloadFileAsync(
        string remotePath,
        string localPath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
        => DownloadFileAsync(remotePath, localPath, resumeOffset: 0, progress, cancellationToken);

    public async Task DownloadFileAsync(
        string remotePath,
        string localPath,
        long resumeOffset,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var options = _options;
        Func<CancellationToken, Task> work = ct => DownloadFileCoreAsync(remotePath, localPath, resumeOffset, progress, ct);
        if (options is { RetryCount: > 0 })
        {
            await RetryPolicy.ExecuteAsync(work, options.RetryCount, options.RetryDelay, cancellationToken)
                .ConfigureAwait(false);
        }
        else
        {
            await work(cancellationToken).ConfigureAwait(false);
        }
    }

    public Task UploadFileAsync(
        string localPath,
        string remotePath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
        => UploadFileAsync(localPath, remotePath, resumeOffset: 0, progress, cancellationToken);

    public async Task UploadFileAsync(
        string localPath,
        string remotePath,
        long resumeOffset,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var options = _options;
        Func<CancellationToken, Task> work = ct => UploadFileCoreAsync(localPath, remotePath, resumeOffset, progress, ct);
        if (options is { RetryCount: > 0 })
        {
            await RetryPolicy.ExecuteAsync(work, options.RetryCount, options.RetryDelay, cancellationToken)
                .ConfigureAwait(false);
        }
        else
        {
            await work(cancellationToken).ConfigureAwait(false);
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
            progress is null ? null : new SynchronousProgress<FtpProgress>(p =>
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
            progress is null ? null : new SynchronousProgress<FtpProgress>(p =>
            {
                progress.Report(new TransferProgress
                {
                    BytesTransferred = p.TransferredBytes,
                    CurrentPath = p.RemotePath ?? remote
                });
            }),
            cancellationToken).ConfigureAwait(false);
    }

    public async Task RenameAsync(string fromPath, string toPath, CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var from = RemotePath.Normalize(fromPath);
        var to = RemotePath.Normalize(toPath);
        var ok = await client.MoveFile(from, to, FtpRemoteExists.Overwrite, cancellationToken).ConfigureAwait(false);
        if (!ok)
        {
            ok = await client.MoveDirectory(from, to, FtpRemoteExists.Overwrite, cancellationToken)
                .ConfigureAwait(false);
        }

        if (!ok)
        {
            throw new IOException($"FluentFTP rename/move failed: '{from}' → '{to}'.");
        }
    }

    public async Task CreateDirectoryAsync(string remotePath, CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        await client.CreateDirectory(RemotePath.Normalize(remotePath), force: true, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task CreateEmptyFileAsync(string remotePath, CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var remote = RemotePath.Normalize(remotePath);
        if (await client.FileExists(remote, cancellationToken).ConfigureAwait(false))
        {
            throw new IOException($"Remote path already exists: {remote}");
        }

        var status = await client.UploadBytes(
                [],
                remote,
                FtpRemoteExists.Skip,
                createRemoteDir: true,
                progress: null,
                token: cancellationToken)
            .ConfigureAwait(false);
        if (status == FtpStatus.Failed)
        {
            throw new IOException($"FluentFTP create file failed for '{remote}'.");
        }
    }

    public async Task DeleteFileAsync(string remotePath, CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        await client.DeleteFile(RemotePath.Normalize(remotePath), cancellationToken).ConfigureAwait(false);
    }

    public async Task DeleteDirectoryAsync(string remotePath, CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        await client.DeleteDirectory(
                RemotePath.Normalize(remotePath),
                FtpListOption.Recursive,
                cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task SetPermissionsAsync(
        string remotePath,
        UnixFilePermissions permissions,
        CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        await client.SetFilePermissions(
                RemotePath.Normalize(remotePath),
                permissions.Mode,
                cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<UnixFilePermissions?> GetPermissionsAsync(
        string remotePath,
        CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        try
        {
            var mode = await client.GetChmod(RemotePath.Normalize(remotePath), cancellationToken)
                .ConfigureAwait(false);
            return mode < 0 ? null : new UnixFilePermissions(mode);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<DirectorySizeResult> CalculateDirectorySizeAsync(
        string remotePath,
        IProgress<DirectorySizeResult>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var path = RemotePath.Normalize(remotePath);
        long total = 0;
        var files = 0;
        var dirs = 0;
        var stack = new Stack<string>();
        stack.Push(path);
        var client = RequireClient();
        while (stack.Count > 0)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var current = stack.Pop();
            dirs++;
            var items = await client.GetListing(current, FtpListOption.AllFiles, cancellationToken)
                .ConfigureAwait(false);
            foreach (var item in items)
            {
                if (item.Name is "." or "..")
                {
                    continue;
                }

                if (item.Type == FtpObjectType.Directory)
                {
                    stack.Push(string.IsNullOrWhiteSpace(item.FullName)
                        ? RemotePath.Combine(current, item.Name)
                        : RemotePath.Normalize(item.FullName));
                }
                else if (item.Type == FtpObjectType.File)
                {
                    files++;
                    total += item.Size;
                }
            }

            progress?.Report(new DirectorySizeResult
            {
                Path = path,
                TotalBytes = total,
                FileCount = files,
                DirectoryCount = dirs
            });
        }

        var result = new DirectorySizeResult
        {
            Path = path,
            TotalBytes = total,
            FileCount = files,
            DirectoryCount = dirs
        };
        progress?.Report(result);
        return result;
    }

    private static int? ToUnixMode(FtpListItem item)
    {
        try
        {
            // FluentFTP exposes chmod-style special permissions on some listings.
            var owner = (int)item.OwnerPermissions;
            var group = (int)item.GroupPermissions;
            var others = (int)item.OthersPermissions;
            if (owner == 0 && group == 0 && others == 0)
            {
                return null;
            }

            return (owner << 6) | (group << 3) | others;
        }
        catch
        {
            return null;
        }
    }

    public async Task<string> ReadTextFileAsync(string remotePath, CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var remote = RemotePath.Normalize(remotePath);
        var bytes = await client.DownloadBytes(remote, cancellationToken).ConfigureAwait(false);
        return Encoding.UTF8.GetString(bytes ?? []);
    }

    public async Task WriteTextFileAsync(string remotePath, string content, CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var remote = RemotePath.Normalize(remotePath);
        var bytes = Encoding.UTF8.GetBytes(content ?? string.Empty);
        var status = await client.UploadBytes(
                bytes,
                remote,
                FtpRemoteExists.Overwrite,
                createRemoteDir: true,
                progress: null,
                token: cancellationToken)
            .ConfigureAwait(false);
        if (status == FtpStatus.Failed)
        {
            throw new IOException($"FluentFTP text upload failed for '{remote}'.");
        }
    }

    public Task<string> ExecuteShellCommandAsync(string command, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _ = command;
        return Task.FromException<string>(new NotSupportedException(
            "SSH shell commands require an SFTP connection. Switch protocol to SFTP."));
    }

    public async ValueTask DisposeAsync()
    {
        await DisconnectAsync().ConfigureAwait(false);
    }

    private async Task DownloadFileCoreAsync(
        string remotePath,
        string localPath,
        long resumeOffset,
        IProgress<TransferProgress>? progress,
        CancellationToken cancellationToken)
    {
        var client = RequireClient();
        var remote = RemotePath.Normalize(remotePath);
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(localPath))!);

        var existsMode = resumeOffset > 0 ? FtpLocalExists.Resume : FtpLocalExists.Overwrite;
        var status = await client.DownloadFile(
            localPath,
            remote,
            existsMode,
            FtpVerify.None,
            progress is null ? null : new SynchronousProgress<FtpProgress>(p =>
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

    private async Task UploadFileCoreAsync(
        string localPath,
        string remotePath,
        long resumeOffset,
        IProgress<TransferProgress>? progress,
        CancellationToken cancellationToken)
    {
        var client = RequireClient();
        if (!File.Exists(localPath))
        {
            throw new FileNotFoundException("Local file not found.", localPath);
        }

        var remote = RemotePath.Normalize(remotePath);
        var existsMode = resumeOffset > 0 ? FtpRemoteExists.Resume : FtpRemoteExists.Overwrite;
        var status = await client.UploadFile(
            localPath,
            remote,
            existsMode,
            createRemoteDir: true,
            FtpVerify.None,
            progress is null ? null : new SynchronousProgress<FtpProgress>(p =>
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

    private AsyncFtpClient RequireClient()
        => _client ?? throw new InvalidOperationException("Not connected. Call ConnectAsync first.");
}
