using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Sftp;

namespace UplinkFtp.Services.Ftp;

/// <summary>
/// Facade <see cref="IFtpService"/> that owns one active protocol client and
/// provides ensure-connected / reconnect for ViewModels.
/// </summary>
public sealed class FtpSessionService : IFtpService
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private IRemoteProtocolClient? _client;
    private ConnectionOptions? _active;

    public string Name => _client?.ProtocolName ?? "FtpSessionService (idle)";

    public bool IsConnected => _client?.IsConnected == true;

    public ConnectionOptions? ActiveConnection => _active;

    public async Task ConnectAsync(ConnectionOptions options, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (string.IsNullOrWhiteSpace(options.Host))
        {
            throw new ArgumentException("Host is required.", nameof(options));
        }

        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await DisposeClientAsync().ConfigureAwait(false);
            _client = CreateClient(options.Protocol);
            await _client.ConnectAsync(options, cancellationToken).ConfigureAwait(false);
            _active = options;
        }
        catch
        {
            await DisposeClientAsync().ConfigureAwait(false);
            _active = null;
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (_client is not null)
            {
                await _client.DisconnectAsync(cancellationToken).ConfigureAwait(false);
            }

            await DisposeClientAsync().ConfigureAwait(false);
            // Intentional disconnect clears reconnect target.
            _active = null;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task EnsureConnectedAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await EnsureConnectedCoreAsync(cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _gate.Release();
        }
    }

    public Task<IReadOnlyList<RemoteEntry>> ListDirectoryAsync(
        string remotePath,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.ListDirectoryAsync(remotePath, cancellationToken), cancellationToken);

    public Task DownloadFileAsync(
        string remotePath,
        string localPath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(
            c => c.DownloadFileAsync(remotePath, localPath, progress, cancellationToken),
            cancellationToken);

    public Task UploadFileAsync(
        string localPath,
        string remotePath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(
            c => c.UploadFileAsync(localPath, remotePath, progress, cancellationToken),
            cancellationToken);

    public Task DownloadDirectoryAsync(
        string remotePath,
        string localPath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(
            c => c.DownloadDirectoryAsync(remotePath, localPath, progress, cancellationToken),
            cancellationToken);

    public Task UploadDirectoryAsync(
        string localPath,
        string remotePath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(
            c => c.UploadDirectoryAsync(localPath, remotePath, progress, cancellationToken),
            cancellationToken);

    public async ValueTask DisposeAsync()
    {
        await DisconnectAsync().ConfigureAwait(false);
        _gate.Dispose();
    }

    private async Task EnsureConnectedCoreAsync(CancellationToken cancellationToken)
    {
        if (_active is null)
        {
            throw new InvalidOperationException("No connection profile available to reconnect.");
        }

        if (_client is not null && await _client.IsAliveAsync(cancellationToken).ConfigureAwait(false))
        {
            await _client.EnsureKeepAliveConfiguredAsync(_active, cancellationToken).ConfigureAwait(false);
            return;
        }

        await DisposeClientAsync().ConfigureAwait(false);
        _client = CreateClient(_active.Protocol);
        await _client.ConnectAsync(_active, cancellationToken).ConfigureAwait(false);
    }

    private async Task WithConnectionAsync(
        Func<IRemoteProtocolClient, Task> action,
        CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await EnsureConnectedCoreAsync(cancellationToken).ConfigureAwait(false);
            var client = _client ?? throw new InvalidOperationException("Not connected.");
            await action(client).ConfigureAwait(false);
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task<T> WithConnectionAsync<T>(
        Func<IRemoteProtocolClient, Task<T>> action,
        CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await EnsureConnectedCoreAsync(cancellationToken).ConfigureAwait(false);
            var client = _client ?? throw new InvalidOperationException("Not connected.");
            return await action(client).ConfigureAwait(false);
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task DisposeClientAsync()
    {
        if (_client is null)
        {
            return;
        }

        await _client.DisposeAsync().ConfigureAwait(false);
        _client = null;
    }

    private static IRemoteProtocolClient CreateClient(RemoteProtocol protocol) => protocol switch
    {
        RemoteProtocol.Ftp or RemoteProtocol.Ftps => new FluentFtpProtocolClient(),
        RemoteProtocol.Sftp => new SftpProtocolClient(),
        _ => throw new NotSupportedException($"Protocol '{protocol}' is not supported.")
    };
}
