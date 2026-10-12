using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Helpers;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using Renci.SshNet;
using Renci.SshNet.Common;

namespace UplinkFtp.Services.Sftp;

/// <summary>SFTP session backed by SSH.NET <see cref="SftpClient"/>.</summary>
public sealed class SftpProtocolClient : IRemoteProtocolClient
{
    private const int BufferSize = 81920;
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
                : options.KeepAliveInterval,
            OperationTimeout = options.ReadTimeout <= TimeSpan.Zero
                ? TimeSpan.FromSeconds(60)
                : options.ReadTimeout
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
        var client = RequireClient();
        var remote = RemotePath.Normalize(remotePath);
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(localPath))!);

        var offset = resumeOffset;
        if (offset <= 0 && File.Exists(localPath))
        {
            // Caller may pass 0 while local partial exists; prefer explicit resumeOffset.
            offset = 0;
        }

        if (offset > 0)
        {
            await DownloadResumeAsync(client, remote, localPath, offset, progress, cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        await using var output = new FileStream(
            localPath,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: BufferSize,
            useAsync: true);

        await CopyRemoteToLocalAsync(client, remote, output, baseOffset: 0, progress, cancellationToken)
            .ConfigureAwait(false);
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
        var client = RequireClient();
        if (!File.Exists(localPath))
        {
            throw new FileNotFoundException("Local file not found.", localPath);
        }

        var remote = RemotePath.Normalize(remotePath);
        await EnsureRemoteDirectoryAsync(client, RemotePath.GetDirectoryName(remote), cancellationToken)
            .ConfigureAwait(false);

        if (resumeOffset > 0)
        {
            await UploadResumeAsync(client, localPath, remote, resumeOffset, progress, cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        await using var input = new FileStream(
            localPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: BufferSize,
            useAsync: true);

        var total = input.Length;
        // Use SynchronousProgress (not Progress<T>) so callbacks stay on the transfer
        // worker and never post to a captured UI SynchronizationContext mid-upload.
        IProgress<UploadFileProgressReport>? reported = progress is null
            ? null
            : new SynchronousProgress<UploadFileProgressReport>(report => progress.Report(new TransferProgress
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

    public async Task RenameAsync(string fromPath, string toPath, CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var from = RemotePath.Normalize(fromPath);
        var to = RemotePath.Normalize(toPath);
        await EnsureRemoteDirectoryAsync(client, RemotePath.GetDirectoryName(to), cancellationToken)
            .ConfigureAwait(false);
        await client.RenameFileAsync(from, to, cancellationToken).ConfigureAwait(false);
    }

    public async Task<string> ReadTextFileAsync(string remotePath, CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var remote = RemotePath.Normalize(remotePath);
        await using var stream = await client.OpenAsync(remote, FileMode.Open, FileAccess.Read, cancellationToken)
            .ConfigureAwait(false);
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        return await reader.ReadToEndAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task WriteTextFileAsync(string remotePath, string content, CancellationToken cancellationToken = default)
    {
        var client = RequireClient();
        var remote = RemotePath.Normalize(remotePath);
        await EnsureRemoteDirectoryAsync(client, RemotePath.GetDirectoryName(remote), cancellationToken)
            .ConfigureAwait(false);
        var bytes = Encoding.UTF8.GetBytes(content ?? string.Empty);
        await using var stream = await client.OpenAsync(remote, FileMode.Create, FileAccess.Write, cancellationToken)
            .ConfigureAwait(false);
        await stream.WriteAsync(bytes, cancellationToken).ConfigureAwait(false);
    }

    public async Task<string> ExecuteShellCommandAsync(string command, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command);
        var sftp = RequireClient();
        var connectionInfo = sftp.ConnectionInfo
            ?? throw new InvalidOperationException("SFTP connection info unavailable for shell exec.");

        using var ssh = new SshClient(connectionInfo);
        await ssh.ConnectAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            var result = ssh.RunCommand(command);
            var stdout = result.Result ?? string.Empty;
            var stderr = result.Error ?? string.Empty;
            if (result.ExitStatus != 0 && string.IsNullOrWhiteSpace(stdout) && !string.IsNullOrWhiteSpace(stderr))
            {
                throw new InvalidOperationException(
                    $"SSH command exited {result.ExitStatus}: {stderr.Trim()}");
            }

            if (string.IsNullOrWhiteSpace(stderr))
            {
                return stdout;
            }

            return string.IsNullOrWhiteSpace(stdout)
                ? stderr
                : stdout + Environment.NewLine + stderr;
        }
        finally
        {
            if (ssh.IsConnected)
            {
                ssh.Disconnect();
            }
        }
    }

    public async ValueTask DisposeAsync()
    {
        await DisconnectAsync().ConfigureAwait(false);
    }

    private static async Task DownloadResumeAsync(
        SftpClient client,
        string remote,
        string localPath,
        long resumeOffset,
        IProgress<TransferProgress>? progress,
        CancellationToken cancellationToken)
    {
        await using var output = new FileStream(
            localPath,
            FileMode.Append,
            FileAccess.Write,
            FileShare.None,
            bufferSize: BufferSize,
            useAsync: true);

        await CopyRemoteToLocalAsync(client, remote, output, resumeOffset, progress, cancellationToken)
            .ConfigureAwait(false);
    }

    private static async Task CopyRemoteToLocalAsync(
        SftpClient client,
        string remote,
        Stream output,
        long baseOffset,
        IProgress<TransferProgress>? progress,
        CancellationToken cancellationToken)
    {
        await using var remoteStream = await client.OpenAsync(remote, FileMode.Open, FileAccess.Read, cancellationToken)
            .ConfigureAwait(false);

        if (baseOffset > 0)
        {
            if (remoteStream.CanSeek)
            {
                remoteStream.Seek(baseOffset, SeekOrigin.Begin);
            }
            else
            {
                await SkipAsync(remoteStream, baseOffset, cancellationToken).ConfigureAwait(false);
            }
        }

        var buffer = new byte[BufferSize];
        long transferred = baseOffset;
        int read;
        while ((read = await remoteStream.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken)
                   .ConfigureAwait(false)) > 0)
        {
            await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken).ConfigureAwait(false);
            transferred += read;
            progress?.Report(new TransferProgress
            {
                BytesTransferred = transferred,
                TotalBytes = remoteStream.CanSeek ? remoteStream.Length : null,
                CurrentPath = remote
            });
        }
    }

    private static async Task UploadResumeAsync(
        SftpClient client,
        string localPath,
        string remote,
        long resumeOffset,
        IProgress<TransferProgress>? progress,
        CancellationToken cancellationToken)
    {
        await using var input = new FileStream(
            localPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: BufferSize,
            useAsync: true);

        if (resumeOffset > input.Length)
        {
            throw new InvalidOperationException(
                $"Resume offset {resumeOffset} exceeds local file size {input.Length}.");
        }

        input.Seek(resumeOffset, SeekOrigin.Begin);
        var total = input.Length;

        await using var remoteStream = await client.OpenAsync(
                remote,
                FileMode.OpenOrCreate,
                FileAccess.Write,
                cancellationToken)
            .ConfigureAwait(false);

        if (remoteStream.CanSeek)
        {
            remoteStream.Seek(resumeOffset, SeekOrigin.Begin);
        }
        else if (resumeOffset > 0)
        {
            throw new NotSupportedException("Remote SFTP stream does not support seek for resume upload.");
        }

        var buffer = new byte[BufferSize];
        long transferred = resumeOffset;
        int read;
        while ((read = await input.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken)
                   .ConfigureAwait(false)) > 0)
        {
            await remoteStream.WriteAsync(buffer.AsMemory(0, read), cancellationToken).ConfigureAwait(false);
            transferred += read;
            progress?.Report(new TransferProgress
            {
                BytesTransferred = transferred,
                TotalBytes = total,
                CurrentPath = remote
            });
        }
    }

    private static async Task SkipAsync(Stream stream, long count, CancellationToken cancellationToken)
    {
        var remaining = count;
        var buffer = new byte[BufferSize];
        while (remaining > 0)
        {
            var toRead = (int)Math.Min(buffer.Length, remaining);
            var read = await stream.ReadAsync(buffer.AsMemory(0, toRead), cancellationToken).ConfigureAwait(false);
            if (read == 0)
            {
                throw new EndOfStreamException("Unexpected end of remote stream while seeking resume offset.");
            }

            remaining -= read;
        }
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

        var info = new ConnectionInfo(options.Host, port, options.Username, authMethods.ToArray())
        {
            Timeout = options.ConnectTimeout <= TimeSpan.Zero
                ? TimeSpan.FromSeconds(30)
                : options.ConnectTimeout
        };
        return info;
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
            try
            {
                await UploadFileAsync(file, RemotePath.Combine(remoteDir, name), progress, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                throw new IOException(
                    $"Failed uploading '{name}' in '{localDir}': {ex.Message}",
                    ex);
            }
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
