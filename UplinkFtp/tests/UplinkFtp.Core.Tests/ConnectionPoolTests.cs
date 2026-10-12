using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;

namespace UplinkFtp.Core.Tests;

public sealed class ConnectionPoolTests
{
    [Fact]
    public async Task Free_tier_allows_only_one_lease_at_a_time()
    {
        var created = 0;
        await using var pool = new ConnectionPool(
            new FakeLicense(LicenseTier.Free),
            _ =>
            {
                Interlocked.Increment(ref created);
                return new FakeClient();
            });

        var options = new ConnectionOptions { Host = "h", Protocol = RemoteProtocol.Ftp };
        await using var lease1 = await pool.LeaseAsync(options);
        Assert.Equal(1, pool.LeasedCount);

        using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(200));
        await Assert.ThrowsAnyAsync<OperationCanceledException>(async () =>
        {
            await pool.LeaseAsync(options, cts.Token);
        });

        await lease1.DisposeAsync();
        Assert.Equal(0, pool.LeasedCount);

        await using var lease2 = await pool.LeaseAsync(options);
        Assert.Equal(1, pool.LeasedCount);
        Assert.True(created >= 2);
    }

    [Fact]
    public async Task Pro_tier_can_lease_multiple()
    {
        await using var pool = new ConnectionPool(
            new FakeLicense(LicenseTier.Pro),
            _ => new FakeClient());

        var options = new ConnectionOptions { Host = "h", Protocol = RemoteProtocol.Sftp };
        await using var a = await pool.LeaseAsync(options);
        await using var b = await pool.LeaseAsync(options);
        Assert.Equal(2, pool.LeasedCount);
        Assert.True(a.Client.IsConnected);
        Assert.True(b.Client.IsConnected);
    }

    [Fact]
    public async Task Lease_connects_with_factory_client()
    {
        FakeClient? last = null;
        await using var pool = new ConnectionPool(
            new FakeLicense(LicenseTier.Pro),
            _ =>
            {
                last = new FakeClient();
                return last;
            });

        var options = new ConnectionOptions
        {
            Host = "ftp.example",
            Username = "u",
            Protocol = RemoteProtocol.Ftp
        };

        await using var lease = await pool.LeaseAsync(options);
        Assert.NotNull(last);
        Assert.Same(options.Host, last!.LastOptions!.Host);
        Assert.True(last.IsConnected);
    }

    private sealed class FakeLicense : LicenseServiceBase
    {
        public FakeLicense(LicenseTier tier) => SetTier(tier, tier.ToString());
        public override DistributionChannel Channel => DistributionChannel.Web;
        public override Task RefreshAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeClient : IRemoteProtocolClient
    {
        public string ProtocolName => "Fake";
        public bool IsConnected { get; private set; }
        public ConnectionOptions? LastOptions { get; private set; }

        public Task ConnectAsync(ConnectionOptions options, CancellationToken cancellationToken = default)
        {
            LastOptions = options;
            IsConnected = true;
            return Task.CompletedTask;
        }

        public Task DisconnectAsync(CancellationToken cancellationToken = default)
        {
            IsConnected = false;
            return Task.CompletedTask;
        }

        public Task<bool> IsAliveAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(IsConnected);

        public Task EnsureKeepAliveConfiguredAsync(ConnectionOptions options, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<IReadOnlyList<RemoteEntry>> ListDirectoryAsync(string remotePath, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<RemoteEntry>>([]);

        public Task DownloadFileAsync(string remotePath, string localPath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task DownloadFileAsync(string remotePath, string localPath, long resumeOffset, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task UploadFileAsync(string localPath, string remotePath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task UploadFileAsync(string localPath, string remotePath, long resumeOffset, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task DownloadDirectoryAsync(string remotePath, string localPath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task UploadDirectoryAsync(string localPath, string remotePath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public ValueTask DisposeAsync()
        {
            IsConnected = false;
            return ValueTask.CompletedTask;
        }
    }
}
