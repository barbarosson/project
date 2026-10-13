using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Transfer;

namespace UplinkFtp.Core.Tests;

public sealed class TransferQueueServiceTests
{
    [Fact]
    public async Task Pause_then_Resume_passes_resume_offset_for_files()
    {
        var ftp = new FakeFtpService();
        var license = new FakeLicense(LicenseTier.Pro);
        await using var queue = new TransferQueueService(ftp, license);

        var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var pauseGate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        ftp.OnDownloadFile = async (remote, local, offset, progress, ct) =>
        {
            ftp.LastDownloadResumeOffset = offset;
            progress?.Report(new TransferProgress
            {
                BytesTransferred = offset + 50,
                TotalBytes = 200,
                CurrentPath = remote
            });
            started.TrySetResult();
            await pauseGate.Task.WaitAsync(ct);
        };

        var job = queue.EnqueueDownload("/remote/file.bin", "/tmp/file.bin", isDirectory: false);
        await started.Task.WaitAsync(TimeSpan.FromSeconds(5));

        // Ensure progress was applied before pause snapshots ResumeOffsetBytes.
        await WaitForAsync(() =>
            queue.GetSnapshot().First(j => j.Id == job.Id).BytesTransferred >= 50);

        Assert.True(queue.Pause(job.Id));
        var pausing = queue.GetSnapshot().First(j => j.Id == job.Id);
        Assert.True(pausing.ResumeOffsetBytes >= 50);
        Assert.Contains("continues from", pausing.Detail!, StringComparison.OrdinalIgnoreCase);

        pauseGate.TrySetCanceled();

        await WaitForAsync(() =>
            queue.GetSnapshot().First(j => j.Id == job.Id).State == TransferJobState.Paused);

        var paused = queue.GetSnapshot().First(j => j.Id == job.Id);
        Assert.True(paused.SupportsResume);
        Assert.True(paused.ResumeOffsetBytes >= 50);
        Assert.Contains("continues from", paused.Detail!, StringComparison.OrdinalIgnoreCase);
        var expectedOffset = paused.ResumeOffsetBytes;

        var resumedStarted = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        ftp.OnDownloadFile = (remote, local, offset, progress, ct) =>
        {
            ftp.LastDownloadResumeOffset = offset;
            progress?.Report(new TransferProgress
            {
                BytesTransferred = 200,
                TotalBytes = 200,
                CurrentPath = remote
            });
            resumedStarted.TrySetResult();
            return Task.CompletedTask;
        };

        Assert.True(queue.Resume(job.Id));
        await resumedStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));

        await WaitForAsync(() =>
            queue.GetSnapshot().First(j => j.Id == job.Id).State == TransferJobState.Successful);

        Assert.Equal(expectedOffset, ftp.LastDownloadResumeOffset);
        Assert.Equal(50, ftp.LastDownloadResumeOffset);
    }

    [Fact]
    public async Task Directory_jobs_do_not_byte_resume()
    {
        var ftp = new FakeFtpService();
        await using var queue = new TransferQueueService(ftp, new FakeLicense(LicenseTier.Free));

        var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var pauseGate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        ftp.OnDownloadDirectory = async (_, _, _, ct) =>
        {
            started.TrySetResult();
            await pauseGate.Task.WaitAsync(ct);
        };

        var job = queue.EnqueueDownload("/remote/dir", "/tmp/dir", isDirectory: true);
        await started.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.True(queue.Pause(job.Id));
        pauseGate.TrySetCanceled();

        await WaitForAsync(() =>
            queue.GetSnapshot().First(j => j.Id == job.Id).State == TransferJobState.Paused);

        var paused = queue.GetSnapshot().First(j => j.Id == job.Id);
        Assert.False(paused.SupportsResume);
        Assert.Contains("restarts", paused.Detail!, StringComparison.OrdinalIgnoreCase);
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

    private sealed class FakeFtpService : IFtpService
    {
        public Func<string, string, long, IProgress<TransferProgress>?, CancellationToken, Task>? OnDownloadFile { get; set; }
        public Func<string, string, IProgress<TransferProgress>?, CancellationToken, Task>? OnDownloadDirectory { get; set; }
        public long LastDownloadResumeOffset { get; set; }

        public string Name => "Fake";
        public bool IsConnected => true;
        public ConnectionOptions? ActiveConnection { get; } = new() { Host = "example.test", Protocol = RemoteProtocol.Ftp };

        public Task ConnectAsync(ConnectionOptions options, CancellationToken cancellationToken = default) => Task.CompletedTask;
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

        public Task DownloadFileAsync(string remotePath, string localPath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => DownloadFileAsync(remotePath, localPath, 0, progress, cancellationToken);

        public Task DownloadFileAsync(string remotePath, string localPath, long resumeOffset, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => (OnDownloadFile ?? ((_, _, _, _, _) => Task.CompletedTask))(remotePath, localPath, resumeOffset, progress, cancellationToken);

        public Task UploadFileAsync(string localPath, string remotePath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task UploadFileAsync(string localPath, string remotePath, long resumeOffset, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task DownloadDirectoryAsync(string remotePath, string localPath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => (OnDownloadDirectory ?? ((_, _, _, _) => Task.CompletedTask))(remotePath, localPath, progress, cancellationToken);

        public Task UploadDirectoryAsync(string localPath, string remotePath, IProgress<TransferProgress>? progress = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<IConnectionLease> OpenTransferClientAsync(CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
