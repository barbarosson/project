using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Security;

/// <summary>In-memory credential store for unit tests and non-Windows hosts.</summary>
public sealed class MemoryCredentialStore : ICredentialStore
{
    private readonly ConcurrentDictionary<string, string> _secrets = new(StringComparer.Ordinal);

    public Task SaveSecretAsync(
        string resourceKey,
        string userName,
        string secret,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceKey);
        ArgumentNullException.ThrowIfNull(userName);
        ArgumentNullException.ThrowIfNull(secret);

        _secrets[MakeKey(resourceKey, userName)] = secret;
        return Task.CompletedTask;
    }

    public Task<string?> GetSecretAsync(
        string resourceKey,
        string userName,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _secrets.TryGetValue(MakeKey(resourceKey, userName), out var secret);
        return Task.FromResult(secret);
    }

    public Task DeleteSecretAsync(
        string resourceKey,
        string userName,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _secrets.TryRemove(MakeKey(resourceKey, userName), out _);
        return Task.CompletedTask;
    }

    private static string MakeKey(string resourceKey, string userName)
        => resourceKey + "\u001f" + userName;
}
