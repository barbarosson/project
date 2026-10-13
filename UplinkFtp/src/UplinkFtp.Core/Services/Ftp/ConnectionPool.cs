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
/// Leases connected <see cref="IRemoteProtocolClient"/> instances per <see cref="ConnectionOptions"/>.
/// Respects license max concurrent connections (Free = 1).
/// </summary>
public sealed class ConnectionPool : IConnectionPool
{
    private readonly ILicenseService _license;
    private readonly Func<RemoteProtocol, IRemoteProtocolClient> _factory;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly List<PooledEntry> _leased = [];
    private bool _disposed;

    public ConnectionPool(
        ILicenseService license,
        Func<RemoteProtocol, IRemoteProtocolClient>? clientFactory = null)
    {
        _license = license;
        _factory = clientFactory ?? CreateDefaultClient;
    }

    public int LeasedCount
    {
        get
        {
            lock (_leased) return _leased.Count;
        }
    }

    public int MaxConcurrent
    {
        get
        {
            var max = _license.GetMaxConcurrentConnections();
            return max <= 0 ? 1 : max;
        }
    }

    public async Task<IConnectionLease> LeaseAsync(
        ConnectionOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options);
        ObjectDisposedException.ThrowIf(_disposed, this);

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
            try
            {
                ObjectDisposedException.ThrowIf(_disposed, this);
                var max = MaxConcurrent;
                int leased;
                lock (_leased) leased = _leased.Count;

                if (leased < max || max >= LicenseLimits.ProUnlimited)
                {
                    var client = _factory(options.Protocol);
                    try
                    {
                        await client.ConnectAsync(options, cancellationToken).ConfigureAwait(false);
                    }
                    catch
                    {
                        await client.DisposeAsync().ConfigureAwait(false);
                        throw;
                    }

                    var entry = new PooledEntry(client, options);
                    lock (_leased) _leased.Add(entry);
                    return new ConnectionLease(this, entry);
                }
            }
            finally
            {
                _gate.Release();
            }

            // Wait briefly for a slot (Free max 1 will block until Return).
            await Task.Delay(25, cancellationToken).ConfigureAwait(false);
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        List<PooledEntry> snapshot;
        await _gate.WaitAsync().ConfigureAwait(false);
        try
        {
            lock (_leased)
            {
                snapshot = [.. _leased];
                _leased.Clear();
            }
        }
        finally
        {
            _gate.Release();
        }

        foreach (var entry in snapshot)
        {
            await entry.Client.DisposeAsync().ConfigureAwait(false);
        }

        _gate.Dispose();
    }

    internal async Task ReturnAsync(PooledEntry entry)
    {
        await _gate.WaitAsync().ConfigureAwait(false);
        try
        {
            lock (_leased)
            {
                _leased.Remove(entry);
            }
        }
        finally
        {
            _gate.Release();
        }

        try
        {
            await entry.Client.DisconnectAsync().ConfigureAwait(false);
        }
        finally
        {
            await entry.Client.DisposeAsync().ConfigureAwait(false);
        }
    }

    private static IRemoteProtocolClient CreateDefaultClient(RemoteProtocol protocol) => protocol switch
    {
        RemoteProtocol.Ftp or RemoteProtocol.Ftps => new FluentFtpProtocolClient(),
        RemoteProtocol.Sftp => new SftpProtocolClient(),
        _ => throw new NotSupportedException($"Protocol '{protocol}' is not supported.")
    };

    internal sealed class PooledEntry(IRemoteProtocolClient client, ConnectionOptions options)
    {
        public IRemoteProtocolClient Client { get; } = client;
        public ConnectionOptions Options { get; } = options;
    }

    private sealed class ConnectionLease(ConnectionPool pool, PooledEntry entry) : IConnectionLease
    {
        private int _returned;

        public IRemoteProtocolClient Client => entry.Client;

        public async ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _returned, 1) != 0)
            {
                return;
            }

            await pool.ReturnAsync(entry).ConfigureAwait(false);
        }
    }
}
