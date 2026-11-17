using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class ScheduledScansViewModel : ObservableObject
{
    private readonly IScheduledScanService _scans;

    public ScheduledScansViewModel(IScheduledScanService scans)
    {
        _scans = scans;
        Load();
    }

    [ObservableProperty]
    private bool isEnabled;

    [ObservableProperty]
    private bool isDaily;

    [ObservableProperty]
    private bool isWeekly;

    [ObservableProperty]
    private double preferredHour = 9;

    [ObservableProperty]
    private bool emailStubEnabled;

    [ObservableProperty]
    private string emailStubAddress = string.Empty;

    [ObservableProperty]
    private string statusMessage = "Configure a daily or weekly summary while the app is open.";

    [ObservableProperty]
    private string lastReportPath = string.Empty;

    [ObservableProperty]
    private bool isBusy;

    public bool CanRun => !IsBusy;

    [RelayCommand]
    private void Save()
    {
        var s = _scans.GetSettings();
        s.IsEnabled = IsEnabled;
        s.Cadence = IsDaily ? ScanCadence.Daily : ScanCadence.Weekly;
        s.PreferredHourLocal = (int)Math.Clamp(PreferredHour, 0, 23);
        s.EmailStubEnabled = EmailStubEnabled;
        s.EmailStubAddress = EmailStubAddress.Trim();
        _scans.SaveSettings(s);
        StatusMessage = "Schedule saved. Scans run while Pure Performance is open near the preferred hour.";
        Load();
    }

    [RelayCommand]
    private async Task RunNowAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            var result = await _scans.RunNowAsync();
            StatusMessage = result.Message;
            LastReportPath = result.ReportPath ?? string.Empty;
            Load();
        }
        finally
        {
            IsBusy = false;
            OnPropertyChanged(nameof(CanRun));
        }
    }

    private void Load()
    {
        var s = _scans.GetSettings();
        IsEnabled = s.IsEnabled;
        IsDaily = s.Cadence == ScanCadence.Daily;
        IsWeekly = s.Cadence == ScanCadence.Weekly;
        PreferredHour = s.PreferredHourLocal;
        EmailStubEnabled = s.EmailStubEnabled;
        EmailStubAddress = s.EmailStubAddress;
        LastReportPath = s.LastReportPath ?? string.Empty;
        if (!string.IsNullOrEmpty(s.LastReportPath))
        {
            StatusMessage = $"Last report: {s.LastReportPath}";
        }
    }
}
