using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Transfer;

namespace UplinkFtp.Core.Tests;

public sealed class TransferConflictPolicyTests
{
    [Fact]
    public async Task Skip_policy_marks_download_successful_without_transfer_when_local_exists()
    {
        var local = Path.Combine(Path.GetTempPath(), "uplink-conflict-" + Guid.NewGuid().ToString("N") + ".bin");
        await File.WriteAllBytesAsync(local, [1, 2, 3]);
        try
        {
            var ftp = new CountingFakeFtp();
            await using var queue = new TransferQueueService(ftp, new FakeLicense(LicenseTier.Pro));

            var job = queue.EnqueueDownload(
                "/remote/file.bin",
                local,
                isDirectory: false,
                new TransferConflictPolicy { Action = TransferConflictAction.Skip });

            await WaitForAsync(() =>
                queue.GetSnapshot().First(j => j.Id == job.Id).State == TransferJobState.Successful);

            var done = queue.GetSnapshot().First(j => j.Id == job.Id);
            Assert.Equal("Skipped (conflict policy)", done.Detail);
            Assert.Equal(0, ftp.DownloadFileCalls);
        }
        finally
        {
            File.Delete(local);
        }
    }

    [Fact]
    public async Task AutoRename_policy_changes_local_destination()
    {
        var local = Path.Combine(Path.GetTempPath(), "uplink-rename-" + Guid.NewGuid().ToString("N") + ".bin");
        await File.WriteAllBytesAsync(local, [9]);
        try
        {
            var ftp = new CountingFakeFtp();
            await using var queue = new TransferQueueService(ftp, new FakeLicense(LicenseTier.Pro));

            var job = queue.EnqueueDownload(
                "/remote/file.bin",
                local,
                isDirectory: false,
                new TransferConflictPolicy { Action = TransferConflictAction.AutoRename });

            await WaitForAsync(() =>
                queue.GetSnapshot().First(j => j.Id == job.Id).State == TransferJobState.Successful);

            var done = queue.GetSnapshot().First(j => j.Id == job.Id);
            Assert.NotEqual(local, done.Destination);
            Assert.True(ftp.DownloadFileCalls >= 1);
            Assert.False(string.Equals(done.Destination, local, StringComparison.OrdinalIgnoreCase));
        }
        finally
        {
            File.Delete(local);
            foreach (var leftover in Directory.EnumerateFiles(Path.GetDirectoryName(local)!, Path.GetFileNameWithoutExtension(local) + "*"))
            {
                try { File.Delete(leftover); } catch { /* best-effort */ }
            }
        }
    }

    private static async Task WaitForAsync(Func<bool> condition, int timeoutMs = 5000)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            if (condition())
            {
                return;
            }

            await Task.Delay(20);
        }

        throw new TimeoutException("Condition not met in time.");
    }

    private sealed class FakeLicense : LicenseServiceBase
    {
        public FakeLicense(LicenseTier tier) => SetTier(tier, tier.ToString());
        public override DistributionChannel Channel => DistributionChannel.Web;
        public override Task RefreshAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class CountingFakeFtp : IFtpService
    {
        public int DownloadFileCalls;

        public string Name => "Fake";
        public bool IsConnected => true;
        public ConnectionOptions? ActiveConnection { get; } = new() { Host = "example.test", Protocol = RemoteProtocol.Ftp };

        public Task ConnectAsync(ConnectionOptions options, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DisconnectAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureConnectedAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IReadOnlyList<RemoteEntry>> ListDirectoryAsync(string remotePath, RemoteListOptions? options = null, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<RemoteEntry>>([]);
        public Task RenameAsync(string fromPath, string toPath, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task MoveAsync(string fromPath, string toPath, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task CreateDirectoryAsync(string remotePath, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task CreateEmptyFileAsync(string remotePath, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DeleteFileAsync(string remotePath, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DeleteDirectoryAsync(string remotePath, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SetPermissionsAsync(string remotePath, UnixFilePermissions permissions, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<UnixFilePermissions?> GetPermissionsAsync(string remotePath, CancellationToken cancellationToken = default)
            => Task.FromResult<UnixFilePermissions?>(null);
        public Task<DirectorySizeResult> CalculateDirectorySizeAsync(string remotePath, IProgress<DirectorySizeResult>? progress = null, CancellationToken cancellationToken = default)
            => Task.FromResult(new DirectorySizeResult { Path = remotePath, TotalBytes = 0, FileCount = 0, DirectoryCount = 0 });
        public Task<string> ReadTextFileAsync(string remotePath, CancellationToken cancellationToken = default) => Task.FromResult(string.Empty);
        public Task WriteTextFileAsync(string remotePath, string content, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<string> ExecuteShellCommandAsync(string command, CancellationToken cancellationToken = default)
            => Task.FromException<string>(new NotSupportedException());
        public Task DownloadFileAsync(string remotePath, string localPath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => DownloadFileAsync(remotePath, localPath, 0, progress, cancellationToken);
        public Task DownloadFileAsync(string remotePath, string localPath, long resumeOffset, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
        {
            Interlocked.Increment(ref DownloadFileCalls);
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(localPath))!);
            File.WriteAllBytes(localPath, [0]);
            progress?.Report(new TransferProgress { BytesTransferred = 1, TotalBytes = 1, CurrentPath = remotePath });
            return Task.CompletedTask;
        }
        public Task UploadFileAsync(string localPath, string remotePath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task UploadFileAsync(string localPath, string remotePath, long resumeOffset, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DownloadDirectoryAsync(string remotePath, string localPath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task UploadDirectoryAsync(string localPath, string remotePath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IConnectionLease> OpenTransferClientAsync(CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
