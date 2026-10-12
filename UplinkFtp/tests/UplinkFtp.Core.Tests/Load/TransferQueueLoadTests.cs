using System.Collections.Concurrent;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Transfer;

namespace UplinkFtp.Core.Tests.Load;

/// <summary>
/// Lightweight concurrency checks for Free vs Pro transfer caps.
/// Uses FakeFtp + Task.Delay; designed to finish in well under ~5s.
/// </summary>
public sealed class TransferQueueLoadTests
{
    [Fact]
    public async Task Free_tier_never_exceeds_one_concurrent_transfer()
    {
        var ftp = new DelayedFakeFtp(workMs: 40);
        await using var queue = new TransferQueueService(ftp, new FakeLicense(LicenseTier.Free));

        Assert.Equal(1, queue.MaxConcurrent);

        const int jobCount = 12;
        for (var i = 0; i < jobCount; i++)
        {
            queue.EnqueueDownload($"/remote/file-{i}.bin", $"/tmp/file-{i}.bin", isDirectory: false);
        }

        await WaitForAsync(() =>
            queue.GetSnapshot().Count(j => j.State == TransferJobState.Successful) == jobCount,
            timeoutMs: 4000);

        Assert.Equal(1, ftp.PeakConcurrent);
        Assert.True(ftp.PeakConcurrent <= 1);
        Assert.All(queue.GetSnapshot(), j => Assert.Equal(TransferJobState.Successful, j.State));
    }

    [Fact]
    public async Task Pro_tier_can_schedule_multiple_concurrent_transfers()
    {
        var ftp = new DelayedFakeFtp(workMs: 80);
        await using var queue = new TransferQueueService(ftp, new FakeLicense(LicenseTier.Pro));

        Assert.True(queue.MaxConcurrent > 1);

        const int jobCount = 8;
        for (var i = 0; i < jobCount; i++)
        {
            queue.EnqueueDownload($"/remote/pro-{i}.bin", $"/tmp/pro-{i}.bin", isDirectory: false);
        }

        // While work is in flight, ActiveCount should rise above Free's cap of 1.
        await WaitForAsync(() => queue.ActiveCount > 1 || ftp.PeakConcurrent > 1, timeoutMs: 2000);

        Assert.True(
            ftp.PeakConcurrent > 1,
            $"Expected Pro to run multiple transfers concurrently; peak={ftp.PeakConcurrent}");

        await WaitForAsync(() =>
            queue.GetSnapshot().Count(j => j.State == TransferJobState.Successful) == jobCount,
            timeoutMs: 4000);

        Assert.Equal(jobCount, queue.GetSnapshot().Count(j => j.State == TransferJobState.Successful));
    }

    [Fact]
    public async Task Free_enqueue_many_still_serializes_to_single_active()
    {
        var ftp = new DelayedFakeFtp(workMs: 25);
        await using var queue = new TransferQueueService(ftp, new FakeLicense(LicenseTier.Free));

        var samples = new ConcurrentBag<int>();
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        var sampler = Task.Run(async () =>
        {
            while (!cts.IsCancellationRequested)
            {
                samples.Add(queue.ActiveCount);
                await Task.Delay(5, CancellationToken.None);
            }
        });

        for (var i = 0; i < 20; i++)
        {
            queue.EnqueueUpload($"/tmp/u-{i}.bin", $"/remote/u-{i}.bin", isDirectory: false);
        }

        await WaitForAsync(() =>
            queue.GetSnapshot().Count(j => j.State == TransferJobState.Successful) == 20,
            timeoutMs: 4000);

        cts.Cancel();
        try { await sampler; } catch (OperationCanceledException) { /* expected */ }

        Assert.True(samples.Count > 0);
        Assert.All(samples, c => Assert.True(c <= 1, $"ActiveCount sample was {c}"));
        Assert.Equal(1, ftp.PeakConcurrent);
    }

    private static async Task WaitForAsync(Func<bool> condition, int timeoutMs)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            if (condition())
            {
                return;
            }

            await Task.Delay(10);
        }

        throw new TimeoutException("Condition not met in time.");
    }

    private sealed class FakeLicense : LicenseServiceBase
    {
        public FakeLicense(LicenseTier tier) => SetTier(tier, tier.ToString());
        public override DistributionChannel Channel => DistributionChannel.Web;
        public override Task RefreshAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class DelayedFakeFtp : IFtpService
    {
        private readonly int _workMs;
        private int _inFlight;
        private int _peak;

        public DelayedFakeFtp(int workMs) => _workMs = workMs;

        public int PeakConcurrent => Volatile.Read(ref _peak);

        public string Name => "DelayedFake";
        public bool IsConnected => true;
        public ConnectionOptions? ActiveConnection { get; } = new()
        {
            Host = "load.test",
            Protocol = RemoteProtocol.Ftp
        };

        public Task ConnectAsync(ConnectionOptions options, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task DisconnectAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task EnsureConnectedAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<IReadOnlyList<RemoteEntry>> ListDirectoryAsync(string remotePath, RemoteListOptions? options = null, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<RemoteEntry>>([]);

        public Task RenameAsync(string fromPath, string toPath, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task MoveAsync(string fromPath, string toPath, CancellationToken cancellationToken = default)
            => RenameAsync(fromPath, toPath, cancellationToken);

        public Task CreateDirectoryAsync(string remotePath, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task CreateEmptyFileAsync(string remotePath, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task DeleteFileAsync(string remotePath, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task DeleteDirectoryAsync(string remotePath, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task SetPermissionsAsync(string remotePath, UnixFilePermissions permissions, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<UnixFilePermissions?> GetPermissionsAsync(string remotePath, CancellationToken cancellationToken = default)
            => Task.FromResult<UnixFilePermissions?>(null);

        public Task<DirectorySizeResult> CalculateDirectorySizeAsync(string remotePath, IProgress<DirectorySizeResult>? progress = null, CancellationToken cancellationToken = default)
            => Task.FromResult(new DirectorySizeResult { Path = remotePath, TotalBytes = 0, FileCount = 0, DirectoryCount = 0 });

        public Task<string> ReadTextFileAsync(string remotePath, CancellationToken cancellationToken = default)
            => Task.FromResult(string.Empty);

        public Task WriteTextFileAsync(string remotePath, string content, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<string> ExecuteShellCommandAsync(string command, CancellationToken cancellationToken = default)
            => Task.FromException<string>(new NotSupportedException());

        public Task DownloadFileAsync(
            string remotePath,
            string localPath,
            IProgress<TransferProgress>? progress = null,
            CancellationToken cancellationToken = default)
            => DownloadFileAsync(remotePath, localPath, 0, progress, cancellationToken);

        public Task DownloadFileAsync(
            string remotePath,
            string localPath,
            long resumeOffset,
            IProgress<TransferProgress>? progress = null,
            CancellationToken cancellationToken = default)
            => WorkAsync(progress, remotePath, cancellationToken);

        public Task UploadFileAsync(
            string localPath,
            string remotePath,
            IProgress<TransferProgress>? progress = null,
            CancellationToken cancellationToken = default)
            => UploadFileAsync(localPath, remotePath, 0, progress, cancellationToken);

        public Task UploadFileAsync(
            string localPath,
            string remotePath,
            long resumeOffset,
            IProgress<TransferProgress>? progress = null,
            CancellationToken cancellationToken = default)
            => WorkAsync(progress, localPath, cancellationToken);

        public Task DownloadDirectoryAsync(
            string remotePath,
            string localPath,
            IProgress<TransferProgress>? progress = null,
            CancellationToken cancellationToken = default)
            => WorkAsync(progress, remotePath, cancellationToken);

        public Task UploadDirectoryAsync(
            string localPath,
            string remotePath,
            IProgress<TransferProgress>? progress = null,
            CancellationToken cancellationToken = default)
            => WorkAsync(progress, localPath, cancellationToken);

        public Task<IConnectionLease> OpenTransferClientAsync(CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;

        private async Task WorkAsync(
            IProgress<TransferProgress>? progress,
            string path,
            CancellationToken cancellationToken)
        {
            var now = Interlocked.Increment(ref _inFlight);
            UpdatePeak(now);
            try
            {
                progress?.Report(new TransferProgress
                {
                    BytesTransferred = 0,
                    TotalBytes = 100,
                    CurrentPath = path
                });
                await Task.Delay(_workMs, cancellationToken);
                progress?.Report(new TransferProgress
                {
                    BytesTransferred = 100,
                    TotalBytes = 100,
                    CurrentPath = path
                });
            }
            finally
            {
                Interlocked.Decrement(ref _inFlight);
            }
        }

        private void UpdatePeak(int current)
        {
            int snapshot;
            do
            {
                snapshot = _peak;
                if (current <= snapshot)
                {
                    return;
                }
            } while (Interlocked.CompareExchange(ref _peak, current, snapshot) != snapshot);
        }
    }
}
