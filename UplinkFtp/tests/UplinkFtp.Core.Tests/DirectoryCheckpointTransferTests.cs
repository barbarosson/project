using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Transfer;

namespace UplinkFtp.Core.Tests;

public sealed class DirectoryCheckpointTransferTests
{
    [Fact]
    public async Task Directory_upload_skips_completed_relative_paths_on_resume()
    {
        var root = Path.Combine(Path.GetTempPath(), "uplink-dir-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        var f1 = Path.Combine(root, "a.txt");
        var sub = Path.Combine(root, "sub");
        Directory.CreateDirectory(sub);
        var f2 = Path.Combine(sub, "b.txt");
        await File.WriteAllTextAsync(f1, "one");
        await File.WriteAllTextAsync(f2, "two");

        try
        {
            var ftp = new RecordingFakeFtp();
            await using var queue = new TransferQueueService(ftp, new FakeLicense(LicenseTier.Pro));

            // Restore a paused directory job that already checkpointed a.txt.
            var job = queue.RestoreJob(new TransferJob
            {
                Direction = TransferDirection.Upload,
                Source = root,
                Destination = "/remote/root",
                IsDirectory = true,
                DisplayName = "root",
                State = TransferJobState.Paused,
                SupportsResume = true,
                CompletedRelativePaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "a.txt" }
            });
            Assert.True(queue.Resume(job.Id));

            await WaitForAsync(() =>
                queue.GetSnapshot().First(j => j.Id == job.Id).State == TransferJobState.Successful);

            Assert.DoesNotContain(ftp.UploadedLocals, p =>
                string.Equals(Path.GetFileName(p), "a.txt", StringComparison.OrdinalIgnoreCase)
                && !p.Contains("sub", StringComparison.OrdinalIgnoreCase));
            Assert.Contains(ftp.UploadedLocals, p =>
                p.EndsWith("b.txt", StringComparison.OrdinalIgnoreCase));
            var done = queue.GetSnapshot().First(j => j.Id == job.Id);
            Assert.Contains("a.txt", done.CompletedRelativePaths);
            Assert.Contains("sub/b.txt", done.CompletedRelativePaths);
        }
        finally
        {
            try { Directory.Delete(root, recursive: true); } catch { /* best-effort */ }
        }
    }

    [Fact]
    public async Task Ask_without_prompt_defaults_to_overwrite_path()
    {
        var local = Path.Combine(Path.GetTempPath(), "uplink-ask-" + Guid.NewGuid().ToString("N") + ".bin");
        await File.WriteAllBytesAsync(local, [1]);
        try
        {
            var ftp = new RecordingFakeFtp();
            await using var queue = new TransferQueueService(ftp, new FakeLicense(LicenseTier.Pro));
            var job = queue.EnqueueDownload(
                "/remote/x.bin",
                local,
                isDirectory: false,
                new TransferConflictPolicy { Action = TransferConflictAction.Ask });

            await WaitForAsync(() =>
                queue.GetSnapshot().First(j => j.Id == job.Id).State == TransferJobState.Successful);

            // Existing local file + Ask without UI → overwrite (download still runs).
            Assert.True(ftp.DownloadFileCalls >= 1);
        }
        finally
        {
            File.Delete(local);
        }
    }

    private static async Task WaitForAsync(Func<bool> condition, int timeoutMs = 8000)
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

    private sealed class RecordingFakeFtp : IFtpService
    {
        public readonly List<string> UploadedLocals = [];
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
            return Task.CompletedTask;
        }
        public Task UploadFileAsync(string localPath, string remotePath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => UploadFileAsync(localPath, remotePath, 0, progress, cancellationToken);
        public Task UploadFileAsync(string localPath, string remotePath, long resumeOffset, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
        {
            UploadedLocals.Add(localPath);
            progress?.Report(new TransferProgress { BytesTransferred = 1, CurrentPath = remotePath });
            return Task.CompletedTask;
        }
        public Task DownloadDirectoryAsync(string remotePath, string localPath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task UploadDirectoryAsync(string localPath, string remotePath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IConnectionLease> OpenTransferClientAsync(CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
