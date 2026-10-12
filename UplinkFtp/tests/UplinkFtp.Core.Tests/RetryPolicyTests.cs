using UplinkFtp.Services.Protocol;

namespace UplinkFtp.Core.Tests;

public sealed class RetryPolicyTests
{
    [Fact]
    public async Task ExecuteAsync_retries_transient_IO_then_succeeds()
    {
        var attempts = 0;
        await RetryPolicy.ExecuteAsync(
            _ =>
            {
                attempts++;
                if (attempts < 3)
                {
                    throw new IOException("transient");
                }

                return Task.CompletedTask;
            },
            retryCount: 3,
            retryDelay: TimeSpan.Zero);

        Assert.Equal(3, attempts);
    }

    [Fact]
    public async Task ExecuteAsync_throws_after_exhaustion()
    {
        var attempts = 0;
        await Assert.ThrowsAsync<IOException>(() => RetryPolicy.ExecuteAsync(
            _ =>
            {
                attempts++;
                throw new IOException("still failing");
            },
            retryCount: 2,
            retryDelay: TimeSpan.Zero));

        Assert.Equal(3, attempts);
    }

    [Fact]
    public void IsTransient_detects_network_failures()
    {
        Assert.True(RetryPolicy.IsTransient(new IOException("x")));
        Assert.True(RetryPolicy.IsTransient(new TimeoutException()));
        Assert.False(RetryPolicy.IsTransient(new ArgumentException("x")));
        Assert.False(RetryPolicy.IsTransient(new OperationCanceledException()));
    }

    [Fact]
    public async Task ExecuteAsync_T_returns_value()
    {
        var value = await RetryPolicy.ExecuteAsync(
            _ => Task.FromResult(42),
            retryCount: 0,
            retryDelay: TimeSpan.Zero);
        Assert.Equal(42, value);
    }
}
