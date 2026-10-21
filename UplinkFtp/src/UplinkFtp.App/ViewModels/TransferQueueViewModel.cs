using System;
using System.Collections.ObjectModel;
using System.Linq;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.UI.Dispatching;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Transfer;

namespace UplinkFtp.ViewModels;

/// <summary>Tabbed queue UI over <see cref="ITransferQueueService"/>.</summary>
public sealed partial class TransferQueueViewModel : ObservableObject, IDisposable
{
    private readonly ITransferQueueService _queue;
    private readonly DispatcherQueue _dispatcher;
    private bool _disposed;

    public ObservableCollection<TransferQueueItemViewModel> QueuedItems { get; } = [];

    public ObservableCollection<TransferQueueItemViewModel> FailedItems { get; } = [];

    public ObservableCollection<TransferQueueItemViewModel> SuccessfulItems { get; } = [];

    [ObservableProperty]
    private TransferQueueItemViewModel? _selectedQueued;

    [ObservableProperty]
    private TransferQueueItemViewModel? _selectedFailed;

    [ObservableProperty]
    private TransferQueueItemViewModel? _selectedSuccessful;

    [ObservableProperty]
    private string _summaryText = "Queue idle";

    [ObservableProperty]
    private int _selectedTabIndex;

    public TransferQueueViewModel(ITransferQueueService queue)
    {
        _queue = queue;
        // Must be constructed on the UI thread (App OnLaunched → MainWindow).
        _dispatcher = DispatcherQueue.GetForCurrentThread()
                      ?? throw new InvalidOperationException(
                          "TransferQueueViewModel requires a UI DispatcherQueue.");
        _queue.QueueChanged += OnQueueChanged;
        _queue.JobUpdated += OnJobUpdated;
        Rebuild();
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _queue.QueueChanged -= OnQueueChanged;
        _queue.JobUpdated -= OnJobUpdated;
    }

    public TransferJob EnqueueUpload(
        string localPath,
        string remotePath,
        bool isDirectory,
        TransferConflictPolicy? conflictPolicy = null)
        => _queue.EnqueueUpload(localPath, remotePath, isDirectory, conflictPolicy);

    public TransferJob EnqueueDownload(
        string remotePath,
        string localPath,
        bool isDirectory,
        TransferConflictPolicy? conflictPolicy = null)
        => _queue.EnqueueDownload(remotePath, localPath, isDirectory, conflictPolicy);

    [RelayCommand]
    private void PauseSelected()
    {
        if (SelectedQueued?.JobId is Guid id)
        {
            _queue.Pause(id);
        }
    }

    [RelayCommand]
    private void ResumeSelected()
    {
        var id = SelectedQueued?.JobId ?? SelectedFailed?.JobId;
        if (id is Guid jobId)
        {
            _queue.Resume(jobId);
            SelectedTabIndex = 0;
        }
    }

    [RelayCommand]
    private void CancelSelected()
    {
        var id = SelectedQueued?.JobId ?? SelectedFailed?.JobId;
        if (id is Guid jobId)
        {
            _queue.Cancel(jobId);
        }
    }

    [RelayCommand]
    private void RetrySelected()
    {
        if (SelectedFailed?.JobId is Guid id)
        {
            _queue.Retry(id);
            SelectedTabIndex = 0;
        }
    }

    [RelayCommand]
    private void ClearSuccessful() => _queue.ClearSuccessful();

    [RelayCommand]
    private void ClearFailed() => _queue.ClearFailed();

    private void OnQueueChanged(object? sender, EventArgs e) => Post(Rebuild);

    private void OnJobUpdated(object? sender, TransferJob job) => Post(() => Upsert(job));

    /// <summary>
    /// Always marshal to the UI dispatcher. Never run collection updates on a worker
    /// thread — that throws COMException (RPC_E_WRONG_THREAD) and can fail the transfer
    /// when progress callbacks invoke JobUpdated synchronously.
    /// </summary>
    private void Post(Action action)
    {
        if (_dispatcher.HasThreadAccess)
        {
            SafeInvoke(action);
            return;
        }

        _ = _dispatcher.TryEnqueue(() => SafeInvoke(action));
    }

    private static void SafeInvoke(Action action)
    {
        try
        {
            action();
        }
        catch
        {
            // UI refresh must never surface into transfer workers.
        }
    }

    private void Rebuild()
    {
        var snapshot = _queue.GetSnapshot();
        SyncCollection(QueuedItems, snapshot.Where(IsActiveTab));
        SyncCollection(FailedItems, snapshot.Where(j => j.State is TransferJobState.Failed or TransferJobState.Cancelled));
        SyncCollection(SuccessfulItems, snapshot.Where(j => j.State == TransferJobState.Successful));
        UpdateSummary(snapshot);
    }

    private void Upsert(TransferJob job)
    {
        RemoveFromAll(job.Id);

        if (IsActiveTab(job))
        {
            InsertOrUpdate(QueuedItems, job);
        }
        else if (job.State is TransferJobState.Failed or TransferJobState.Cancelled)
        {
            InsertOrUpdate(FailedItems, job);
        }
        else if (job.State == TransferJobState.Successful)
        {
            InsertOrUpdate(SuccessfulItems, job);
        }

        UpdateSummary(_queue.GetSnapshot());
    }

    private void UpdateSummary(System.Collections.Generic.IReadOnlyList<TransferJob> snapshot)
    {
        var queued = snapshot.Count(IsActiveTab);
        var failed = snapshot.Count(j => j.State is TransferJobState.Failed or TransferJobState.Cancelled);
        var ok = snapshot.Count(j => j.State == TransferJobState.Successful);
        var maxLabel = _queue.MaxConcurrent >= LicenseLimits.ProUnlimited
            ? "∞"
            : _queue.MaxConcurrent.ToString();
        SummaryText =
            $"Active {queued} · Failed {failed} · Done {ok} · Workers {_queue.ActiveCount}/{maxLabel}";
    }

    private static bool IsActiveTab(TransferJob job)
        => job.State is TransferJobState.Queued or TransferJobState.Running or TransferJobState.Paused;

    private static void SyncCollection(
        ObservableCollection<TransferQueueItemViewModel> target,
        System.Collections.Generic.IEnumerable<TransferJob> jobs)
    {
        var list = jobs
            .OrderByDescending(j => j.EnqueuedAt)
            .Select(TransferQueueItemViewModel.FromJob)
            .ToList();

        target.Clear();
        foreach (var item in list)
        {
            target.Add(item);
        }
    }

    private static void InsertOrUpdate(ObservableCollection<TransferQueueItemViewModel> target, TransferJob job)
    {
        var existing = target.FirstOrDefault(i => i.JobId == job.Id);
        if (existing is null)
        {
            target.Insert(0, TransferQueueItemViewModel.FromJob(job));
            return;
        }

        existing.Apply(job);
    }

    private void RemoveFromAll(Guid id)
    {
        Remove(QueuedItems, id);
        Remove(FailedItems, id);
        Remove(SuccessfulItems, id);
    }

    private static void Remove(ObservableCollection<TransferQueueItemViewModel> target, Guid id)
    {
        for (var i = target.Count - 1; i >= 0; i--)
        {
            if (target[i].JobId == id)
            {
                target.RemoveAt(i);
            }
        }
    }
}

public sealed partial class TransferQueueItemViewModel : ObservableObject
{
    public Guid JobId { get; private set; }

    [ObservableProperty]
    private string _direction = string.Empty;

    [ObservableProperty]
    private string _displayName = string.Empty;

    [ObservableProperty]
    private string _source = string.Empty;

    [ObservableProperty]
    private string _destination = string.Empty;

    [ObservableProperty]
    private string _status = string.Empty;

    [ObservableProperty]
    private string _detail = string.Empty;

    [ObservableProperty]
    private double _progressPercent;

    [ObservableProperty]
    private bool _showProgress;

    [ObservableProperty]
    private bool _isDirectory;

    public static TransferQueueItemViewModel FromJob(TransferJob job)
    {
        var vm = new TransferQueueItemViewModel();
        vm.Apply(job);
        return vm;
    }

    public void Apply(TransferJob job)
    {
        JobId = job.Id;
        Direction = job.Direction.ToString();
        DisplayName = job.DisplayName;
        Source = job.Source;
        Destination = job.Destination;
        Status = job.State.ToString();
        Detail = job.Detail ?? job.Error ?? string.Empty;
        ProgressPercent = job.ProgressPercent;
        ShowProgress = job.State is TransferJobState.Running or TransferJobState.Paused
                       || (job.State == TransferJobState.Successful && job.ProgressPercent > 0);
        IsDirectory = job.IsDirectory;
    }
}
