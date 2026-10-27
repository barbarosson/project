using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Helpers;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Protocol;

namespace UplinkFtp.Services.Transfer;

/// <summary>
/// Async worker pool over <see cref="IFtpService"/>.
/// Pause keeps <see cref="TransferJob.BytesTransferred"/> as <see cref="TransferJob.ResumeOffsetBytes"/>
/// for non-directory files; resume passes that offset into protocol APIs.
/// </summary>
public sealed class TransferQueueService : ITransferQueueService, IAsyncDisposable
{
    private readonly IFtpService _ftp;
    private readonly ILicenseService _license;
    private readonly ITransferConflictPrompt? _conflictPrompt;
    private readonly TransferConflictAction _askSuggestedDefault;
    private readonly object _gate = new();
    private readonly List<TransferJob> _jobs = [];
    private readonly Dictionary<Guid, CancellationTokenSource> _tokens = [];
    private readonly HashSet<Guid> _pauseRequested = [];
    private readonly SemaphoreSlim _scheduleLock = new(1, 1);
    /// <summary>Session-scoped “apply to all” from an Ask prompt (cleared when queue drains).</summary>
    private TransferConflictAction? _applyToAllAction;
    private int _active;
    private bool _disposed;

    public TransferQueueService(
        IFtpService ftp,
        ILicenseService license,
        IConnectionPool? pool = null,
        ITransferConflictPrompt? conflictPrompt = null,
        TransferConflictAction askSuggestedDefault = TransferConflictAction.Overwrite)
    {
        _ftp = ftp;
        _license = license;
        _conflictPrompt = conflictPrompt;
        _askSuggestedDefault = askSuggestedDefault;
        // pool is unused: transfers must go through IFtpService.OpenTransferClientAsync
        // so Free (max 1 connection) reuses the primary browse session instead of
        // opening a second SSH/FTP client that often fails or races.
        _ = pool;
    }

    public event EventHandler? QueueChanged;

    public event EventHandler<TransferJob>? JobUpdated;

    public int ActiveCount
    {
        get { lock (_gate) return _active; }
    }

    public int MaxConcurrent => Math.Max(1, _license.GetMaxConcurrentTransfers());

    public IReadOnlyList<TransferJob> GetSnapshot()
    {
        lock (_gate)
        {
            return _jobs.ToList();
        }
    }

    public TransferJob EnqueueUpload(
        string localPath,
        string remotePath,
        bool isDirectory,
        TransferConflictPolicy? conflictPolicy = null)
    {
        var name = isDirectory
            ? new DirectoryInfo(localPath).Name
            : Path.GetFileName(localPath);

        return EnqueueCore(new TransferJob
        {
            Direction = TransferDirection.Upload,
            Source = localPath,
            Destination = remotePath,
            IsDirectory = isDirectory,
            DisplayName = string.IsNullOrWhiteSpace(name) ? localPath : name,
            State = TransferJobState.Queued,
            // Files: byte resume. Directories: per-file checkpoint via CompletedRelativePaths.
            SupportsResume = true,
            ConflictPolicy = conflictPolicy ?? TransferConflictPolicy.Default,
            Detail = "Waiting for a worker slot"
        });
    }

    public TransferJob EnqueueDownload(
        string remotePath,
        string localPath,
        bool isDirectory,
        TransferConflictPolicy? conflictPolicy = null)
    {
        var name = Path.GetFileName(remotePath.TrimEnd('/'));
        return EnqueueCore(new TransferJob
        {
            Direction = TransferDirection.Download,
            Source = remotePath,
            Destination = localPath,
            IsDirectory = isDirectory,
            DisplayName = string.IsNullOrWhiteSpace(name) ? remotePath : name,
            State = TransferJobState.Queued,
            SupportsResume = true,
            ConflictPolicy = conflictPolicy ?? TransferConflictPolicy.Default,
            Detail = "Waiting for a worker slot"
        });
    }

    /// <summary>Restore a previously persisted queued/failed job without starting transfer yet.</summary>
    public TransferJob RestoreJob(TransferJob job)
    {
        ArgumentNullException.ThrowIfNull(job);
        if (job.State is not (TransferJobState.Queued or TransferJobState.Failed or TransferJobState.Paused))
        {
            job.State = TransferJobState.Queued;
        }

        job.Detail ??= job.State == TransferJobState.Failed
            ? (job.Error ?? "Restored failed job — tap Retry")
            : "Restored — waiting for a worker slot";
        return EnqueueCore(job);
    }

    /// <summary>Clear session “apply to all” (e.g. after operator changes Settings).</summary>
    public void ClearApplyToAll()
    {
        lock (_gate)
        {
            _applyToAllAction = null;
        }
    }

    public bool Pause(Guid jobId)
    {
        CancellationTokenSource? cts = null;
        TransferJob? job;
        lock (_gate)
        {
            job = _jobs.FirstOrDefault(j => j.Id == jobId);
            if (job is null)
            {
                return false;
            }

            if (job.State == TransferJobState.Queued)
            {
                job.State = TransferJobState.Paused;
                job.ResumeOffsetBytes = job.SupportsResume ? job.BytesTransferred : 0;
                job.Detail = FormatPausedDetail(job);
                RaiseJobUpdatedSafe(job);
                RaiseQueueChanged();
                return true;
            }

            if (job.State != TransferJobState.Running)
            {
                return false;
            }

            _pauseRequested.Add(jobId);
            // Snapshot offset + pause copy immediately (state stays Running until cancel lands).
            if (job.SupportsResume)
            {
                job.ResumeOffsetBytes = Math.Max(job.ResumeOffsetBytes, job.BytesTransferred);
            }

            job.Detail = FormatPausedDetail(job);
            if (_tokens.TryGetValue(jobId, out cts))
            {
                // cancel outside lock below
            }

            RaiseJobUpdatedSafe(job);
        }

        cts?.Cancel();
        return true;
    }

    public bool Resume(Guid jobId)
    {
        lock (_gate)
        {
            var job = _jobs.FirstOrDefault(j => j.Id == jobId);
            if (job is null)
            {
                return false;
            }

            if (job.State is not (TransferJobState.Paused or TransferJobState.Failed or TransferJobState.Cancelled))
            {
                return false;
            }

            PrepareForResume(job);
            RaiseJobUpdatedSafe(job);
            RaiseQueueChanged();
        }

        _ = ScheduleAsync();
        return true;
    }

    public bool Cancel(Guid jobId)
    {
        CancellationTokenSource? cts = null;
        lock (_gate)
        {
            var job = _jobs.FirstOrDefault(j => j.Id == jobId);
            if (job is null)
            {
                return false;
            }

            if (job.State is TransferJobState.Successful or TransferJobState.Cancelled)
            {
                return false;
            }

            _pauseRequested.Remove(jobId);

            if (job.State is TransferJobState.Queued or TransferJobState.Paused or TransferJobState.Failed)
            {
                job.State = TransferJobState.Cancelled;
                job.Detail = "Cancelled";
                job.CompletedAt = DateTimeOffset.Now;
                RaiseJobUpdatedSafe(job);
                RaiseQueueChanged();
                return true;
            }

            if (job.State == TransferJobState.Running && _tokens.TryGetValue(jobId, out cts))
            {
                job.Detail = "Cancelling…";
                RaiseJobUpdatedSafe(job);
            }
            else
            {
                return false;
            }
        }

        cts?.Cancel();
        return true;
    }

    public bool Retry(Guid jobId) => Resume(jobId);

    public void ClearSuccessful()
    {
        lock (_gate)
        {
            _jobs.RemoveAll(j => j.State == TransferJobState.Successful);
            RaiseQueueChanged();
        }
    }

    public void ClearFailed()
    {
        lock (_gate)
        {
            _jobs.RemoveAll(j => j.State is TransferJobState.Failed or TransferJobState.Cancelled);
            RaiseQueueChanged();
        }
    }

    public ValueTask DisposeAsync()
    {
        if (_disposed)
        {
            return ValueTask.CompletedTask;
        }

        _disposed = true;
        List<CancellationTokenSource> tokens;
        lock (_gate)
        {
            tokens = _tokens.Values.ToList();
            _tokens.Clear();
            _pauseRequested.Clear();
        }

        foreach (var cts in tokens)
        {
            try { cts.Cancel(); } catch { /* ignore */ }
            cts.Dispose();
        }

        _scheduleLock.Dispose();
        return ValueTask.CompletedTask;
    }

    private TransferJob EnqueueCore(TransferJob job)
    {
        lock (_gate)
        {
            _jobs.Insert(0, job);
            RaiseJobUpdatedSafe(job);
            RaiseQueueChanged();
        }

        _ = ScheduleAsync();
        return job;
    }

    private async Task ScheduleAsync()
    {
        await _scheduleLock.WaitAsync().ConfigureAwait(false);
        try
        {
            while (!_disposed)
            {
                TransferJob? next;
                CancellationTokenSource cts;
                lock (_gate)
                {
                    if (_active >= MaxConcurrent)
                    {
                        break;
                    }

                    // FIFO: list is newest-first; take the oldest queued job.
                    next = _jobs.LastOrDefault(j => j.State == TransferJobState.Queued);
                    if (next is null)
                    {
                        break;
                    }

                    next.State = TransferJobState.Running;
                    next.StartedAt ??= DateTimeOffset.Now;
                    next.Error = null;
                    if (!next.SupportsResume || next.ResumeOffsetBytes <= 0)
                    {
                        next.ProgressPercent = 0;
                        next.BytesTransferred = 0;
                    }
                    else
                    {
                        next.BytesTransferred = next.ResumeOffsetBytes;
                    }

                    var maxLabel = MaxConcurrent >= LicenseLimits.ProUnlimited ? "∞" : MaxConcurrent.ToString();
                    next.Detail = next.SupportsResume && next.ResumeOffsetBytes > 0
                        ? $"Running from offset {next.ResumeOffsetBytes} (slot {_active + 1}/{maxLabel})"
                        : $"Running (slot {_active + 1}/{maxLabel})";
                    _active++;
                    cts = new CancellationTokenSource();
                    _tokens[next.Id] = cts;
                }

                RaiseJobUpdatedSafe(next);
                RaiseQueueChanged();
                _ = ProcessJobAsync(next, cts);
            }
        }
        finally
        {
            _scheduleLock.Release();
        }
    }

    private async Task ProcessJobAsync(TransferJob job, CancellationTokenSource cts)
    {
        var token = cts.Token;
        IConnectionLease? lease = null;
        try
        {
            if (!_ftp.IsConnected && _ftp.ActiveConnection is null)
            {
                throw new InvalidOperationException("Not connected to a remote server.");
            }

            // Synchronous progress so pause can snapshot ResumeOffsetBytes without racing
            // Progress<T>'s SynchronizationContext marshal. UI listeners must not throw
            // into this callback (that previously surfaced as COMException on the job).
            var progress = new SynchronousProgress<TransferProgress>(p =>
            {
                var absolute = job.SupportsResume && job.ResumeOffsetBytes > 0
                    ? Math.Max(p.BytesTransferred, job.ResumeOffsetBytes)
                    : p.BytesTransferred;
                job.BytesTransferred = absolute;
                job.TotalBytes = p.TotalBytes;
                if (p.PercentComplete is double pct)
                {
                    job.ProgressPercent = pct;
                }
                else if (p.TotalBytes is > 0)
                {
                    job.ProgressPercent = Math.Clamp(100.0 * absolute / p.TotalBytes.Value, 0, 100);
                }

                if (!string.IsNullOrWhiteSpace(p.CurrentPath))
                {
                    job.Detail = p.CurrentPath;
                }

                RaiseJobUpdatedSafe(job);
            });

            // Pro: pool lease. Free / fakes: NotSupportedException → gated IFtpService APIs.
            IRemoteProtocolClient? leasedClient = null;
            try
            {
                lease = await _ftp.OpenTransferClientAsync(token).ConfigureAwait(false);
                leasedClient = lease.Client;
            }
            catch (NotSupportedException)
            {
                // Free tier and unit-test fakes — use session-gated upload/download below.
            }

            if (!await ApplyConflictPolicyAsync(job, leasedClient, token).ConfigureAwait(false))
            {
                job.State = TransferJobState.Successful;
                job.ProgressPercent = 100;
                job.Detail = "Skipped (conflict policy)";
                job.CompletedAt = DateTimeOffset.Now;
                RaiseJobUpdatedSafe(job);
                return;
            }

            await ExecuteTransferAsync(job, progress, leasedClient, token).ConfigureAwait(false);

            token.ThrowIfCancellationRequested();

            job.State = TransferJobState.Successful;
            job.ProgressPercent = 100;
            job.ResumeOffsetBytes = 0;
            job.Detail = "Completed";
            job.CompletedAt = DateTimeOffset.Now;
            RaiseJobUpdatedSafe(job);
        }
        catch (OperationCanceledException)
        {
            bool paused;
            lock (_gate)
            {
                paused = _pauseRequested.Remove(job.Id);
            }

            if (paused)
            {
                if (job.SupportsResume)
                {
                    job.ResumeOffsetBytes = Math.Max(job.ResumeOffsetBytes, job.BytesTransferred);
                }

                job.State = TransferJobState.Paused;
                job.Detail = FormatPausedDetail(job);
            }
            else
            {
                job.State = TransferJobState.Cancelled;
                job.Detail = "Cancelled";
                job.CompletedAt = DateTimeOffset.Now;
            }

            RaiseJobUpdatedSafe(job);
        }
        catch (Exception ex)
        {
            job.State = TransferJobState.Failed;
            job.Error = ProtocolError.ToUserMessage(ex);
            job.Detail = job.Error;
            job.CompletedAt = DateTimeOffset.Now;
            RaiseJobUpdatedSafe(job);
        }
        finally
        {
            if (lease is not null)
            {
                await lease.DisposeAsync().ConfigureAwait(false);
            }

            lock (_gate)
            {
                if (_tokens.Remove(job.Id, out var owned))
                {
                    owned.Dispose();
                }

                _pauseRequested.Remove(job.Id);
                _active = Math.Max(0, _active - 1);
            }

            RaiseQueueChanged();
            if (!_disposed)
            {
                _ = ScheduleAsync();
            }
        }
    }

    /// <summary>
    /// Returns false when the job should be marked skipped (Skip policy).
    /// May mutate Destination (AutoRename) or ResumeOffsetBytes (Resume).
    /// </summary>
    private async Task<bool> ApplyConflictPolicyAsync(
        TransferJob job,
        IRemoteProtocolClient? leased,
        CancellationToken token)
    {
        if (job.IsDirectory)
        {
            // Directory transfers resolve conflicts per child file inside the checkpoint walker.
            return true;
        }

        var policy = job.ConflictPolicy?.Action ?? TransferConflictAction.Overwrite;
        var promptPerFile = job.ConflictPolicy?.PromptPerFile == true;
        if (policy == TransferConflictAction.Ask || promptPerFile)
        {
            lock (_gate)
            {
                if (_applyToAllAction is { } applyAll)
                {
                    policy = applyAll;
                }
            }

            if (policy == TransferConflictAction.Ask || promptPerFile)
            {
                if (!await DestinationExistsAsync(job, leased, token).ConfigureAwait(false))
                {
                    return true;
                }

                policy = await ResolveAskAsync(job, token).ConfigureAwait(false);
            }
        }

        if (policy == TransferConflictAction.Overwrite)
        {
            return true;
        }

        if (job.Direction == TransferDirection.Upload)
        {
            return await ApplyUploadConflictAsync(job, leased, policy, token).ConfigureAwait(false);
        }

        return ApplyDownloadConflict(job, policy);
    }

    private async Task<TransferConflictAction> ResolveAskAsync(TransferJob job, CancellationToken token)
    {
        if (_conflictPrompt is null)
        {
            // Headless tests without a prompt: treat Ask as Overwrite to keep CI deterministic.
            return TransferConflictAction.Overwrite;
        }

        var result = await _conflictPrompt.PromptAsync(
            new TransferConflictPromptRequest
            {
                Job = job,
                ConflictPath = job.Direction == TransferDirection.Upload ? job.Destination : job.Destination,
                Direction = job.Direction,
                SuggestedAction = _askSuggestedDefault
            },
            token).ConfigureAwait(false);

        if (result is null)
        {
            return TransferConflictAction.Skip;
        }

        if (result.ApplyToAll)
        {
            lock (_gate)
            {
                _applyToAllAction = result.Action;
            }
        }

        return result.Action;
    }

    private async Task<bool> DestinationExistsAsync(
        TransferJob job,
        IRemoteProtocolClient? leased,
        CancellationToken token)
    {
        if (job.Direction == TransferDirection.Download)
        {
            return File.Exists(job.Destination);
        }

        try
        {
            var parent = RemotePath.GetDirectoryName(job.Destination);
            var name = RemotePath.GetFileName(job.Destination);
            IReadOnlyList<RemoteEntry> listing;
            if (leased is not null)
            {
                listing = await leased.ListDirectoryAsync(parent, null, token).ConfigureAwait(false);
            }
            else
            {
                listing = await _ftp.ListDirectoryAsync(parent, null, token).ConfigureAwait(false);
            }

            return listing.Any(e =>
                !e.IsDirectory && string.Equals(e.Name, name, StringComparison.OrdinalIgnoreCase));
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> ApplyUploadConflictAsync(
        TransferJob job,
        IRemoteProtocolClient? leased,
        TransferConflictAction policy,
        CancellationToken token)
    {
        IReadOnlyList<RemoteEntry> listing;
        var parent = RemotePath.GetDirectoryName(job.Destination);
        var name = RemotePath.GetFileName(job.Destination);
        try
        {
            if (leased is not null)
            {
                listing = await leased.ListDirectoryAsync(parent, null, token).ConfigureAwait(false);
            }
            else
            {
                listing = await _ftp.ListDirectoryAsync(parent, null, token).ConfigureAwait(false);
            }
        }
        catch
        {
            return true;
        }

        var existing = listing.FirstOrDefault(e =>
            !e.IsDirectory && string.Equals(e.Name, name, StringComparison.OrdinalIgnoreCase));
        if (existing is null)
        {
            return true;
        }

        switch (policy)
        {
            case TransferConflictAction.Skip:
                return false;
            case TransferConflictAction.OverwriteIfNewer:
            {
                var localInfo = new FileInfo(job.Source);
                var localNewer = localInfo.LastWriteTimeUtc > (existing.ModifiedUtc ?? DateTime.MinValue);
                var sizeDiffers = localInfo.Exists && localInfo.Length != existing.Size;
                return localNewer || sizeDiffers;
            }
            case TransferConflictAction.AutoRename:
                job.Destination = NextAvailableRemoteName(listing, parent, name);
                return true;
            case TransferConflictAction.Resume:
                if (existing.Size > 0 && new FileInfo(job.Source).Length > existing.Size)
                {
                    job.ResumeOffsetBytes = existing.Size;
                    job.SupportsResume = true;
                }

                return true;
            default:
                return true;
        }
    }

    private static bool ApplyDownloadConflict(TransferJob job, TransferConflictAction policy)
    {
        if (!File.Exists(job.Destination))
        {
            return true;
        }

        var local = new FileInfo(job.Destination);
        switch (policy)
        {
            case TransferConflictAction.Skip:
                return false;
            case TransferConflictAction.OverwriteIfNewer:
                // Without remote mtime here, keep existing file unless sizes differ — caller can Overwrite.
                return false;
            case TransferConflictAction.AutoRename:
                job.Destination = NextAvailableLocalName(job.Destination);
                return true;
            case TransferConflictAction.Resume:
                if (local.Length > 0)
                {
                    job.ResumeOffsetBytes = local.Length;
                    job.SupportsResume = true;
                }

                return true;
            default:
                return true;
        }
    }

    private static string NextAvailableRemoteName(
        IReadOnlyList<RemoteEntry> listing,
        string parent,
        string fileName)
    {
        var stem = Path.GetFileNameWithoutExtension(fileName);
        var ext = Path.GetExtension(fileName);
        var taken = new HashSet<string>(listing.Select(e => e.Name), StringComparer.OrdinalIgnoreCase);
        for (var i = 1; i < 10_000; i++)
        {
            var candidate = $"{stem} ({i}){ext}";
            if (!taken.Contains(candidate))
            {
                return RemotePath.Combine(parent, candidate);
            }
        }

        return RemotePath.Combine(parent, $"{stem}-{Guid.NewGuid():N}{ext}");
    }

    private static string NextAvailableLocalName(string path)
    {
        var dir = Path.GetDirectoryName(path) ?? ".";
        var stem = Path.GetFileNameWithoutExtension(path);
        var ext = Path.GetExtension(path);
        for (var i = 1; i < 10_000; i++)
        {
            var candidate = Path.Combine(dir, $"{stem} ({i}){ext}");
            if (!File.Exists(candidate))
            {
                return candidate;
            }
        }

        return Path.Combine(dir, $"{stem}-{Guid.NewGuid():N}{ext}");
    }

    private async Task ExecuteTransferAsync(
        TransferJob job,
        IProgress<TransferProgress> progress,
        IRemoteProtocolClient? leased,
        CancellationToken token)
    {
        var offset = job.SupportsResume ? Math.Max(0, job.ResumeOffsetBytes) : 0;

        if (job.IsDirectory)
        {
            if (job.Direction == TransferDirection.Upload)
            {
                await ExecuteDirectoryUploadAsync(job, progress, leased, token).ConfigureAwait(false);
            }
            else
            {
                await ExecuteDirectoryDownloadAsync(job, progress, leased, token).ConfigureAwait(false);
            }

            return;
        }

        if (leased is not null)
        {
            if (job.Direction == TransferDirection.Upload)
            {
                await leased.UploadFileAsync(job.Source, job.Destination, offset, progress, token)
                    .ConfigureAwait(false);
            }
            else
            {
                await leased.DownloadFileAsync(job.Source, job.Destination, offset, progress, token)
                    .ConfigureAwait(false);
            }

            return;
        }

        if (job.Direction == TransferDirection.Upload)
        {
            await _ftp.UploadFileAsync(job.Source, job.Destination, offset, progress, token)
                .ConfigureAwait(false);
        }
        else
        {
            await _ftp.DownloadFileAsync(job.Source, job.Destination, offset, progress, token)
                .ConfigureAwait(false);
        }
    }

    private async Task ExecuteDirectoryUploadAsync(
        TransferJob job,
        IProgress<TransferProgress> progress,
        IRemoteProtocolClient? leased,
        CancellationToken token)
    {
        if (!Directory.Exists(job.Source))
        {
            throw new DirectoryNotFoundException($"Local directory not found: {job.Source}");
        }

        var root = Path.GetFullPath(job.Source);
        var files = Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories).ToList();
        var done = 0;
        foreach (var localFile in files)
        {
            token.ThrowIfCancellationRequested();
            var relative = Path.GetRelativePath(root, localFile).Replace('\\', '/');
            if (job.CompletedRelativePaths.Contains(relative))
            {
                done++;
                continue;
            }

            var remoteFile = RemotePath.Combine(job.Destination, relative.Replace('\\', '/'));
            job.Detail = relative;
            RaiseJobUpdatedSafe(job);

            if (leased is not null)
            {
                await leased.UploadFileAsync(localFile, remoteFile, 0, progress, token).ConfigureAwait(false);
            }
            else
            {
                await _ftp.UploadFileAsync(localFile, remoteFile, 0, progress, token).ConfigureAwait(false);
            }

            job.CompletedRelativePaths.Add(relative);
            done++;
            job.ProgressPercent = files.Count == 0 ? 100 : 100.0 * done / files.Count;
            RaiseJobUpdatedSafe(job);
        }
    }

    private async Task ExecuteDirectoryDownloadAsync(
        TransferJob job,
        IProgress<TransferProgress> progress,
        IRemoteProtocolClient? leased,
        CancellationToken token)
    {
        Directory.CreateDirectory(job.Destination);
        var files = await ListRemoteFilesRecursiveAsync(job.Source, leased, token).ConfigureAwait(false);
        var done = 0;
        foreach (var (remoteFile, relative) in files)
        {
            token.ThrowIfCancellationRequested();
            if (job.CompletedRelativePaths.Contains(relative))
            {
                done++;
                continue;
            }

            var localFile = Path.Combine(job.Destination, relative.Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(Path.GetDirectoryName(localFile)!);
            job.Detail = relative;
            RaiseJobUpdatedSafe(job);

            if (leased is not null)
            {
                await leased.DownloadFileAsync(remoteFile, localFile, 0, progress, token).ConfigureAwait(false);
            }
            else
            {
                await _ftp.DownloadFileAsync(remoteFile, localFile, 0, progress, token).ConfigureAwait(false);
            }

            job.CompletedRelativePaths.Add(relative);
            done++;
            job.ProgressPercent = files.Count == 0 ? 100 : 100.0 * done / files.Count;
            RaiseJobUpdatedSafe(job);
        }
    }

    private async Task<List<(string RemotePath, string Relative)>> ListRemoteFilesRecursiveAsync(
        string remoteRoot,
        IRemoteProtocolClient? leased,
        CancellationToken token)
    {
        var root = RemotePath.Normalize(remoteRoot).TrimEnd('/');
        if (string.IsNullOrEmpty(root))
        {
            root = "/";
        }

        var results = new List<(string, string)>();
        var stack = new Stack<string>();
        stack.Push(root);

        while (stack.Count > 0)
        {
            token.ThrowIfCancellationRequested();
            var current = stack.Pop();
            IReadOnlyList<RemoteEntry> listing;
            if (leased is not null)
            {
                listing = await leased.ListDirectoryAsync(current, null, token).ConfigureAwait(false);
            }
            else
            {
                listing = await _ftp.ListDirectoryAsync(current, null, token).ConfigureAwait(false);
            }

            foreach (var entry in listing)
            {
                var child = RemotePath.Combine(current, entry.Name);
                if (entry.IsDirectory)
                {
                    stack.Push(child);
                    continue;
                }

                var relative = child.StartsWith(root + "/", StringComparison.OrdinalIgnoreCase)
                    ? child[(root.Length + 1)..]
                    : entry.Name;
                results.Add((child, relative.Replace('\\', '/')));
            }
        }

        return results;
    }

    private static void PrepareForResume(TransferJob job)
    {
        job.State = TransferJobState.Queued;
        job.Error = null;
        job.CompletedAt = null;

        if (job.IsDirectory && job.CompletedRelativePaths.Count > 0)
        {
            job.Detail =
                $"Resumed — skipping {job.CompletedRelativePaths.Count} completed file(s) in directory";
            return;
        }

        if (job.SupportsResume && job.ResumeOffsetBytes > 0)
        {
            job.BytesTransferred = job.ResumeOffsetBytes;
            job.Detail = $"Resumed — continuing from {job.ResumeOffsetBytes} bytes";
        }
        else
        {
            job.ProgressPercent = 0;
            job.BytesTransferred = 0;
            job.ResumeOffsetBytes = 0;
            job.TotalBytes = null;
            job.StartedAt = null;
            job.Detail = "Resumed — restarting from the beginning";
        }
    }

    private static string FormatPausedDetail(TransferJob job)
    {
        if (job.IsDirectory)
        {
            return job.CompletedRelativePaths.Count > 0
                ? $"Paused — directory checkpoint ({job.CompletedRelativePaths.Count} file(s) done)"
                : "Paused — directory will resume with per-file checkpoint";
        }

        if (job.SupportsResume && job.ResumeOffsetBytes > 0)
        {
            return $"Paused — resume continues from {job.ResumeOffsetBytes} bytes";
        }

        return job.SupportsResume
            ? "Paused — resume continues from current offset"
            : "Paused — resume restarts from the beginning";
    }

    private void RaiseQueueChanged()
    {
        try
        {
            QueueChanged?.Invoke(this, EventArgs.Empty);
        }
        catch
        {
            // UI listeners must not break the queue scheduler.
        }
    }

    private void RaiseJobUpdatedSafe(TransferJob job)
    {
        try
        {
            JobUpdated?.Invoke(this, job);
        }
        catch
        {
            // Progress runs on worker threads; a COMException from a UI listener
            // must not mark the transfer itself as failed.
        }
    }
}
