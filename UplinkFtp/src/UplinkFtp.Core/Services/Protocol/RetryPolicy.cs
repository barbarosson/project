using System;
using System.IO;
using System.Net.Http;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Protocol;

/// <summary>Retries transient I/O failures with optional delay.</summary>
public static class RetryPolicy
{
    public static async Task ExecuteAsync(
        Func<CancellationToken, Task> action,
        int retryCount = 3,
        TimeSpan? retryDelay = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(action);
        var delay = retryDelay ?? TimeSpan.FromSeconds(1);
        var attempts = Math.Max(0, retryCount) + 1;
        Exception? last = null;

        for (var attempt = 0; attempt < attempts; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                await action(cancellationToken).ConfigureAwait(false);
                return;
            }
            catch (Exception ex) when (IsTransient(ex) && attempt < attempts - 1)
            {
                last = ex;
                if (delay > TimeSpan.Zero)
                {
                    await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
                }
            }
        }

        throw last ?? new IOException("RetryPolicy exhausted without an exception.");
    }

    public static async Task<T> ExecuteAsync<T>(
        Func<CancellationToken, Task<T>> action,
        int retryCount = 3,
        TimeSpan? retryDelay = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(action);
        var delay = retryDelay ?? TimeSpan.FromSeconds(1);
        var attempts = Math.Max(0, retryCount) + 1;
        Exception? last = null;

        for (var attempt = 0; attempt < attempts; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                return await action(cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex) when (IsTransient(ex) && attempt < attempts - 1)
            {
                last = ex;
                if (delay > TimeSpan.Zero)
                {
                    await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
                }
            }
        }

        throw last ?? new IOException("RetryPolicy exhausted without an exception.");
    }

    public static bool IsTransient(Exception ex)
    {
        for (var current = ex; current is not null; current = current.InnerException)
        {
            if (current is TimeoutException or SocketException or HttpRequestException)
            {
                return true;
            }

            // IOException covers many network failures; do not treat cancel as transient.
            if (current is IOException && current is not OperationCanceledException)
            {
                return true;
            }
        }

        return false;
    }
}
