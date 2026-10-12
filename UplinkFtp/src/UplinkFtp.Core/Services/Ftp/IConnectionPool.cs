using System;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Dto;

namespace UplinkFtp.Services.Ftp;

/// <summary>Leased protocol client that returns to the pool (or disconnects) on dispose.</summary>
public interface IConnectionLease : IAsyncDisposable
{
    IRemoteProtocolClient Client { get; }
}

/// <summary>
/// Connection factory/pool. Respects <see cref="Licensing.ILicenseService.GetMaxConcurrentConnections"/>.
/// Free tier enforces max 1 live connection.
/// </summary>
public interface IConnectionPool : IAsyncDisposable
{
    /// <summary>Number of currently leased connections.</summary>
    int LeasedCount { get; }

    /// <summary>License-derived max concurrent connections.</summary>
    int MaxConcurrent { get; }

    Task<IConnectionLease> LeaseAsync(
        ConnectionOptions options,
        CancellationToken cancellationToken = default);
}
