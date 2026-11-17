using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.UI.Dispatching;
using PurePerformance.Helpers;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class DashboardViewModel : ObservableObject
{
    private readonly IPerformanceMonitorService _monitor;
    private CancellationTokenSource? _cts;
    private DispatcherQueue? _dispatcher;

    public DashboardViewModel(IPerformanceMonitorService monitor)
    {
        _monitor = monitor;
        ElevationStatus = ElevationHelper.IsRunningElevated()
            ? "Running elevated (admin)."
            : "Running as a standard user — elevate only when an all-users or protected-folder action needs it.";
    }

    public string ProductName => "Pure Performance";

    public string Tagline => "Crash Analyzer · Startup Manager · Safe optimization tools";

    public ObservableCollection<ProcessUsage> TopProcesses { get; } = new();

    [ObservableProperty]
    private string elevationStatus;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(CpuLabel))]
    private double cpuPercent;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(MemoryLabel))]
    private double memoryPercent;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(DiskLabel))]
    private double diskPercent;

    public string CpuLabel => $"{CpuPercent:0.0}%";

    public string MemoryLabel => $"{MemoryPercent:0.0}%";

    public string DiskLabel => $"{DiskPercent:0.0}%";

    [ObservableProperty]
    private string gpuLabel = "GPU: n/a";

    [ObservableProperty]
    private string memoryDetail = "Memory: —";

    [ObservableProperty]
    private string statusMessage = "Start monitoring to sample CPU, RAM, disk, and GPU (best effort).";

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(CanStart))]
    private bool isMonitoring;

    public bool CanStart => !IsMonitoring;

    [RelayCommand]
    private void StartMonitoring()
    {
        if (IsMonitoring) return;

        _dispatcher = DispatcherQueue.GetForCurrentThread();
        _cts?.Cancel();
        _cts?.Dispose();
        _cts = new CancellationTokenSource();
        IsMonitoring = true;
        StatusMessage = "Monitoring… samples run in the background.";
        _ = RunLoopAsync(_cts.Token);
    }

    [RelayCommand]
    private void StopMonitoring()
    {
        _cts?.Cancel();
    }

    public void StopIfNeeded() => StopMonitoring();

    private async Task RunLoopAsync(CancellationToken token)
    {
        try
        {
            await foreach (var sample in _monitor.StreamSamplesAsync(TimeSpan.FromSeconds(1.5), token))
            {
                var local = sample;
                var dq = _dispatcher;
                if (dq is null || !dq.TryEnqueue(() => ApplySample(local)))
                {
                    ApplySample(local);
                }
            }
        }
        catch (OperationCanceledException)
        {
            Enqueue(() => StatusMessage = "Monitoring stopped.");
        }
        catch (Exception ex)
        {
            Enqueue(() => StatusMessage = $"Monitoring error: {ex.Message}");
        }
        finally
        {
            Enqueue(() => IsMonitoring = false);
        }
    }

    private void ApplySample(PerformanceSample sample)
    {
        CpuPercent = sample.CpuPercent;
        MemoryPercent = sample.MemoryPercent;
        DiskPercent = sample.DiskPercent;
        GpuLabel = sample.GpuPercent is { } g ? $"GPU: {g:0.0}%" : "GPU: n/a (counters unavailable)";
        MemoryDetail =
            $"Memory: {CleanupTarget.FormatBytes((long)(sample.MemoryTotalBytes - sample.MemoryAvailableBytes))} / " +
            $"{CleanupTarget.FormatBytes((long)sample.MemoryTotalBytes)} in use";

        TopProcesses.Clear();
        foreach (var p in sample.TopProcesses)
        {
            TopProcesses.Add(p);
        }

        StatusMessage = $"Last sample {sample.Timestamp:T}";
    }

    private void Enqueue(Action action)
    {
        if (_dispatcher is null || !_dispatcher.TryEnqueue(() => action()))
        {
            action();
        }
    }
}
