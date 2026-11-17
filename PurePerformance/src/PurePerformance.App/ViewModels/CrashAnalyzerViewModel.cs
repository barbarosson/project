using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class CrashAnalyzerViewModel : ObservableObject
{
    private readonly IEventLogService _eventLogService;
    private CancellationTokenSource? _cts;

    public CrashAnalyzerViewModel(IEventLogService eventLogService)
    {
        _eventLogService = eventLogService;
        SelectedLookback = CrashLookback.Hours24;
    }

    public ObservableCollection<CrashEvent> Findings { get; } = new();

    public IReadOnlyList<CrashLookback> LookbackOptions { get; } =
    [
        CrashLookback.Hours24,
        CrashLookback.Hours72
    ];

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(LookbackLabel))]
    [NotifyPropertyChangedFor(nameof(IsLookback24))]
    [NotifyPropertyChangedFor(nameof(IsLookback72))]
    private CrashLookback selectedLookback;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(HasSelection))]
    private CrashEvent? selectedFinding;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(CanScan))]
    private bool isBusy;

    [ObservableProperty]
    private string statusMessage = "Choose a time window and scan Event Viewer for crash signals.";

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(HasError))]
    private string? errorMessage;

    public bool CanScan => !IsBusy;

    public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

    public bool HasSelection => SelectedFinding is not null;

    public bool IsLookback24
    {
        get => SelectedLookback == CrashLookback.Hours24;
        set
        {
            if (value)
            {
                SelectedLookback = CrashLookback.Hours24;
            }
        }
    }

    public bool IsLookback72
    {
        get => SelectedLookback == CrashLookback.Hours72;
        set
        {
            if (value)
            {
                SelectedLookback = CrashLookback.Hours72;
            }
        }
    }

    public string LookbackLabel => SelectedLookback == CrashLookback.Hours72
        ? "Last 72 hours"
        : "Last 24 hours";

    [RelayCommand]
    private async Task ScanAsync()
    {
        if (IsBusy)
        {
            return;
        }

        _cts?.Cancel();
        _cts?.Dispose();
        _cts = new CancellationTokenSource();
        var token = _cts.Token;

        IsBusy = true;
        ErrorMessage = null;
        Findings.Clear();
        SelectedFinding = null;
        StatusMessage = $"Scanning Application and System logs ({LookbackLabel})…";

        var count = 0;

        try
        {
            await foreach (var finding in _eventLogService.AnalyzeAsync(SelectedLookback, token))
            {
                Findings.Add(finding);
                count++;
                StatusMessage = $"Found {count} issue{(count == 1 ? "" : "s")} so far…";
            }

            StatusMessage = count == 0
                ? $"No matching Errors/Warnings in the {LookbackLabel.ToLowerInvariant()}."
                : $"Scan complete — {count} finding{(count == 1 ? "" : "s")}.";
        }
        catch (OperationCanceledException)
        {
            StatusMessage = "Scan cancelled.";
        }
        catch (UnauthorizedAccessException ex)
        {
            ErrorMessage =
                "Permission denied while reading Event Viewer logs. " +
                "Try again with an account that can open Event Viewer. " +
                $"Details: {ex.Message}";
            StatusMessage = "Scan failed — access denied.";
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Scan failed: {ex.Message}";
            StatusMessage = "Scan failed.";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private void CancelScan()
    {
        _cts?.Cancel();
    }
}
