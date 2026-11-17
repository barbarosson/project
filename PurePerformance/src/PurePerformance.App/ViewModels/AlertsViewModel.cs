using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class AlertsViewModel : ObservableObject
{
    private readonly IRealtimeAlertService _alerts;

    public AlertsViewModel(IRealtimeAlertService alerts)
    {
        _alerts = alerts;
        _alerts.AlertRaised += (_, entry) =>
        {
            History.Insert(0, entry);
            LatestToast = entry.Message;
        };
        Load();
    }

    public ObservableCollection<AlertHistoryEntry> History { get; } = new();

    [ObservableProperty]
    private bool isEnabled = true;

    [ObservableProperty]
    private double cpuSpikePercent = 90;

    [ObservableProperty]
    private double diskSpikePercent = 90;

    [ObservableProperty]
    private double cooldownSeconds = 60;

    [ObservableProperty]
    private string statusMessage = "In-app CPU/disk spike alerts while Pure Performance is open.";

    [ObservableProperty]
    private string latestToast = string.Empty;

    [ObservableProperty]
    private bool isMonitoring;

    [RelayCommand]
    private void Save()
    {
        _alerts.SaveSettings(new AlertSettings
        {
            IsEnabled = IsEnabled,
            CpuSpikePercent = CpuSpikePercent,
            DiskSpikePercent = DiskSpikePercent,
            CooldownSeconds = (int)CooldownSeconds
        });
        StatusMessage = "Alert thresholds saved.";
    }

    [RelayCommand]
    private void Start()
    {
        _alerts.Start();
        IsMonitoring = _alerts.IsRunning;
        StatusMessage = IsMonitoring
            ? "Alert monitoring started."
            : "Could not start — Pro license required.";
    }

    [RelayCommand]
    private void Stop()
    {
        _alerts.Stop();
        IsMonitoring = false;
        StatusMessage = "Alert monitoring stopped.";
    }

    [RelayCommand]
    private void Clear()
    {
        _alerts.ClearHistory();
        History.Clear();
        LatestToast = string.Empty;
        StatusMessage = "Alert history cleared.";
    }

    private void Load()
    {
        var s = _alerts.Settings;
        IsEnabled = s.IsEnabled;
        CpuSpikePercent = s.CpuSpikePercent;
        DiskSpikePercent = s.DiskSpikePercent;
        CooldownSeconds = s.CooldownSeconds;
        History.Clear();
        foreach (var h in _alerts.GetHistory().OrderByDescending(x => x.Timestamp))
        {
            History.Add(h);
        }

        IsMonitoring = _alerts.IsRunning;
    }
}
