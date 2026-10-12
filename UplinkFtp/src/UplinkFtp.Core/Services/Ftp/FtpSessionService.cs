using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Sftp;

namespace UplinkFtp.Services.Ftp;

/// <summary>
/// Facade <see cref="IFtpService"/> that owns one primary protocol client for browse
/// and leases transfer clients from <see cref="IConnectionPool"/>.
/// Free tier: max one live connection enforced via license + pool.
/// </summary>
public sealed class FtpSessionService : IFtpService
{
    private readonly ILicenseService _license;
    private readonly IConnectionPool _pool;
    private readonly Func<RemoteProtocol, IRemoteProtocolClient> _factory;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private IRemoteProtocolClient? _client;
    private ConnectionOptions? _active;
    private bool _ownsPool;

    public FtpSessionService(ILicenseService license, IConnectionPool? pool = null)
        : this(license, pool, clientFactory: null)
    {
    }

    public FtpSessionService(
        ILicenseService license,
        IConnectionPool? pool,
        Func<RemoteProtocol, IRemoteProtocolClient>? clientFactory)
    {
        _license = license;
        _factory = clientFactory ?? CreateDefaultClient;
        if (pool is null)
        {
            _pool = new ConnectionPool(license, _factory);
            _ownsPool = true;
        }
        else
        {
            _pool = pool;
        }
    }

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
            EnforceConnectionLimit(options);

            await DisposeClientAsync().ConfigureAwait(false);
            _client = _factory(options.Protocol);
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
        RemoteListOptions? options = null,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.ListDirectoryAsync(remotePath, options, cancellationToken), cancellationToken);

    public Task DownloadFileAsync(
        string remotePath,
        string localPath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
        => DownloadFileAsync(remotePath, localPath, resumeOffset: 0, progress, cancellationToken);

    public Task DownloadFileAsync(
        string remotePath,
        string localPath,
        long resumeOffset,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(
            c => c.DownloadFileAsync(remotePath, localPath, resumeOffset, progress, cancellationToken),
            cancellationToken);

    public Task UploadFileAsync(
        string localPath,
        string remotePath,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
        => UploadFileAsync(localPath, remotePath, resumeOffset: 0, progress, cancellationToken);

    public Task UploadFileAsync(
        string localPath,
        string remotePath,
        long resumeOffset,
        IProgress<TransferProgress>? progress = null,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(
            c => c.UploadFileAsync(localPath, remotePath, resumeOffset, progress, cancellationToken),
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

    public async Task<IConnectionLease> OpenTransferClientAsync(CancellationToken cancellationToken = default)
    {
        var options = _active ?? throw new InvalidOperationException("Not connected. Call ConnectAsync first.");

        // Free (max 1): do NOT hand out the primary client. Concurrent browse + transfer
        // on the same SSH.NET/FluentFTP instance races and surfaces as COMException /
        // "secure connection" failures. Callers catch NotSupportedException and use the
        // gated IFtpService Upload*/Download* APIs instead (same session, serialized).
        if (_license.GetMaxConcurrentConnections() <= LicenseLimits.FreeMaxConcurrentConnections)
        {
            await EnsureConnectedAsync(cancellationToken).ConfigureAwait(false);
            throw new NotSupportedException(
                "Free tier transfers use the session-gated IFtpService APIs.");
        }

        return await _pool.LeaseAsync(options, cancellationToken).ConfigureAwait(false);
    }

    public Task RenameAsync(string fromPath, string toPath, CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.RenameAsync(fromPath, toPath, cancellationToken), cancellationToken);

    public Task MoveAsync(string fromPath, string toPath, CancellationToken cancellationToken = default)
        => RenameAsync(fromPath, toPath, cancellationToken);

    public Task CreateDirectoryAsync(string remotePath, CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.CreateDirectoryAsync(remotePath, cancellationToken), cancellationToken);

    public Task CreateEmptyFileAsync(string remotePath, CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.CreateEmptyFileAsync(remotePath, cancellationToken), cancellationToken);

    public Task DeleteFileAsync(string remotePath, CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.DeleteFileAsync(remotePath, cancellationToken), cancellationToken);

    public Task DeleteDirectoryAsync(string remotePath, CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.DeleteDirectoryAsync(remotePath, cancellationToken), cancellationToken);

    public Task SetPermissionsAsync(
        string remotePath,
        UnixFilePermissions permissions,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.SetPermissionsAsync(remotePath, permissions, cancellationToken), cancellationToken);

    public Task<UnixFilePermissions?> GetPermissionsAsync(
        string remotePath,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.GetPermissionsAsync(remotePath, cancellationToken), cancellationToken);

    public Task<DirectorySizeResult> CalculateDirectorySizeAsync(
        string remotePath,
        IProgress<DirectorySizeResult>? progress = null,
        CancellationToken cancellationToken = default)
        => WithConnectionAsync(
            c => c.CalculateDirectorySizeAsync(remotePath, progress, cancellationToken),
            cancellationToken);

    public Task<string> ReadTextFileAsync(string remotePath, CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.ReadTextFileAsync(remotePath, cancellationToken), cancellationToken);

    public Task WriteTextFileAsync(string remotePath, string content, CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.WriteTextFileAsync(remotePath, content, cancellationToken), cancellationToken);

    public Task<string> ExecuteShellCommandAsync(string command, CancellationToken cancellationToken = default)
        => WithConnectionAsync(c => c.ExecuteShellCommandAsync(command, cancellationToken), cancellationToken);

    public async ValueTask DisposeAsync()
    {
        await DisconnectAsync().ConfigureAwait(false);
        if (_ownsPool)
        {
            await _pool.DisposeAsync().ConfigureAwait(false);
        }

        _gate.Dispose();
    }

    private void EnforceConnectionLimit(ConnectionOptions options)
    {
        var max = _license.GetMaxConcurrentConnections();
        if (max >= LicenseLimits.ProUnlimited)
        {
            return;
        }

        // Free (max 1): allow idle→connect and reconnect to the same endpoint; block a second host.
        if (_active is not null && IsConnected && !SameEndpoint(_active, options))
        {
            throw new InvalidOperationException(
                $"Free tier allows at most {max} concurrent connection. Disconnect first or upgrade to Pro.");
        }
    }

    private static bool SameEndpoint(ConnectionOptions a, ConnectionOptions b)
        => string.Equals(a.Host, b.Host, StringComparison.OrdinalIgnoreCase)
           && a.ResolvePort() == b.ResolvePort()
           && a.Protocol == b.Protocol;

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
        _client = _factory(_active.Protocol);
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

    private static IRemoteProtocolClient CreateDefaultClient(RemoteProtocol protocol) => protocol switch
    {
        RemoteProtocol.Ftp or RemoteProtocol.Ftps => new FluentFtpProtocolClient(),
        RemoteProtocol.Sftp => new SftpProtocolClient(),
        _ => throw new NotSupportedException($"Protocol '{protocol}' is not supported.")
    };
}
