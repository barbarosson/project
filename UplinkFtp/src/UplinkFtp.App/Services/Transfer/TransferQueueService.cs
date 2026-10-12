using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;

namespace UplinkFtp.Services.Transfer;

/// <summary>
/// Async worker pool over <see cref="IFtpService"/>.
/// Pause = cancel + Paused; Resume/Retry = restart from the beginning (clear UX in Detail).
/// Protocol session currently serializes I/O on one connection; the license cap limits
/// how many jobs may be in Running at once (ready for multi-connection later).
/// </summary>
public sealed class TransferQueueService : ITransferQueueService, IAsyncDisposable
{
    private readonly IFtpService _ftp;
    private readonly ILicenseService _license;
    private readonly object _gate = new();
    private readonly List<TransferJob> _jobs = [];
    private readonly Dictionary<Guid, CancellationTokenSource> _tokens = [];
    private readonly HashSet<Guid> _pauseRequested = [];
    private readonly SemaphoreSlim _scheduleLock = new(1, 1);
    private int _active;
    private bool _disposed;

    public TransferQueueService(IFtpService ftp, ILicenseService license)
    {
        _ftp = ftp;
        _license = license;
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

    public TransferJob EnqueueUpload(string localPath, string remotePath, bool isDirectory)
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
            Detail = "Waiting for a worker slot"
        });
    }

    public TransferJob EnqueueDownload(string remotePath, string localPath, bool isDirectory)
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
            Detail = "Waiting for a worker slot"
        });
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
                job.Detail = "Paused — resume restarts from the beginning";
                RaiseJobUpdated(job);
                RaiseQueueChanged();
                return true;
            }

            if (job.State != TransferJobState.Running)
            {
                return false;
            }

            _pauseRequested.Add(jobId);
            job.Detail = "Pausing…";
            if (_tokens.TryGetValue(jobId, out cts))
            {
                // cancel outside lock below
            }

            RaiseJobUpdated(job);
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

            ResetForRestart(job, "Resumed — restarting from the beginning");
            RaiseJobUpdated(job);
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
                RaiseJobUpdated(job);
                RaiseQueueChanged();
                return true;
            }

            if (job.State == TransferJobState.Running && _tokens.TryGetValue(jobId, out cts))
            {
                job.Detail = "Cancelling…";
                RaiseJobUpdated(job);
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
            RaiseJobUpdated(job);
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
                    next.StartedAt = DateTimeOffset.Now;
                    next.ProgressPercent = 0;
                    next.BytesTransferred = 0;
                    next.Error = null;
                    var maxLabel = MaxConcurrent >= LicenseLimits.ProUnlimited ? "∞" : MaxConcurrent.ToString();
                    next.Detail = $"Running (slot {_active + 1}/{maxLabel})";
                    _active++;
                    cts = new CancellationTokenSource();
                    _tokens[next.Id] = cts;
                }

                RaiseJobUpdated(next);
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
        try
        {
            if (!_ftp.IsConnected)
            {
                throw new InvalidOperationException("Not connected to a remote server.");
            }

            var progress = new Progress<TransferProgress>(p =>
            {
                job.BytesTransferred = p.BytesTransferred;
                job.TotalBytes = p.TotalBytes;
                if (p.PercentComplete is double pct)
                {
                    job.ProgressPercent = pct;
                }
                else if (p.TotalBytes is > 0)
                {
                    job.ProgressPercent = Math.Clamp(100.0 * p.BytesTransferred / p.TotalBytes.Value, 0, 100);
                }

                if (!string.IsNullOrWhiteSpace(p.CurrentPath))
                {
                    job.Detail = p.CurrentPath;
                }

                RaiseJobUpdated(job);
            });

            if (job.Direction == TransferDirection.Upload)
            {
                if (job.IsDirectory)
                {
                    await _ftp.UploadDirectoryAsync(job.Source, job.Destination, progress, token)
                        .ConfigureAwait(false);
                }
                else
                {
                    await _ftp.UploadFileAsync(job.Source, job.Destination, progress, token)
                        .ConfigureAwait(false);
                }
            }
            else if (job.IsDirectory)
            {
                await _ftp.DownloadDirectoryAsync(job.Source, job.Destination, progress, token)
                    .ConfigureAwait(false);
            }
            else
            {
                await _ftp.DownloadFileAsync(job.Source, job.Destination, progress, token)
                    .ConfigureAwait(false);
            }

            token.ThrowIfCancellationRequested();

            job.State = TransferJobState.Successful;
            job.ProgressPercent = 100;
            job.Detail = "Completed";
            job.CompletedAt = DateTimeOffset.Now;
            RaiseJobUpdated(job);
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
                job.State = TransferJobState.Paused;
                job.Detail = "Paused — resume restarts from the beginning";
            }
            else
            {
                job.State = TransferJobState.Cancelled;
                job.Detail = "Cancelled";
                job.CompletedAt = DateTimeOffset.Now;
            }

            RaiseJobUpdated(job);
        }
        catch (Exception ex)
        {
            job.State = TransferJobState.Failed;
            job.Error = ex.Message;
            job.Detail = ex.Message;
            job.CompletedAt = DateTimeOffset.Now;
            RaiseJobUpdated(job);
        }
        finally
        {
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

    private static void ResetForRestart(TransferJob job, string detail)
    {
        job.State = TransferJobState.Queued;
        job.ProgressPercent = 0;
        job.BytesTransferred = 0;
        job.TotalBytes = null;
        job.Error = null;
        job.StartedAt = null;
        job.CompletedAt = null;
        job.Detail = detail;
    }

    private void RaiseQueueChanged() => QueueChanged?.Invoke(this, EventArgs.Empty);

    private void RaiseJobUpdated(TransferJob job) => JobUpdated?.Invoke(this, job);
}
