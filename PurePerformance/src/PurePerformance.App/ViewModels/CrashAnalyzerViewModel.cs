using System.Collections.ObjectModel;
using System.Text;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Models;
using PurePerformance.Services;
using Windows.ApplicationModel.DataTransfer;

namespace PurePerformance.ViewModels;

public partial class CrashAnalyzerViewModel : ObservableObject
{
    private readonly IEventLogService _eventLogService;
    private readonly ILicenseService _license;
    private readonly IAiAssistService _ai;
    private CancellationTokenSource? _cts;

    public CrashAnalyzerViewModel(
        IEventLogService eventLogService,
        ILicenseService license,
        IAiAssistService ai)
    {
        _eventLogService = eventLogService;
        _license = license;
        _ai = ai;
        SelectedLookback = CrashLookback.Hours24;
        _license.Changed += (_, _) =>
        {
            OnPropertyChanged(nameof(IsProUnlocked));
            OnPropertyChanged(nameof(CanRequestAi));
        };
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
    [NotifyPropertyChangedFor(nameof(CanCopy))]
    [NotifyPropertyChangedFor(nameof(CanRequestAi))]
    [NotifyPropertyChangedFor(nameof(ExplanationText))]
    [NotifyPropertyChangedFor(nameof(FixText))]
    [NotifyPropertyChangedFor(nameof(RawText))]
    private CrashEvent? selectedFinding;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(CanScan))]
    [NotifyPropertyChangedFor(nameof(CanCopy))]
    [NotifyPropertyChangedFor(nameof(CanRequestAi))]
    private bool isBusy;

    [ObservableProperty]
    private string statusMessage = "Choose a time window and scan Event Viewer for crash signals.";

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(HasError))]
    private string? errorMessage;

    [ObservableProperty]
    private string copyStatus = string.Empty;

    [ObservableProperty]
    private string aiSuggestion = string.Empty;

    [ObservableProperty]
    private string aiStatus = string.Empty;

    public bool CanScan => !IsBusy;

    public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

    public bool HasSelection => SelectedFinding is not null;

    public bool CanCopy => HasSelection && !IsBusy;

    public bool IsProUnlocked => _license.IsProUnlocked;

    public bool CanRequestAi => IsProUnlocked && HasSelection && !IsBusy;

    public string ExplanationText => SelectedFinding?.Explanation
        ?? "Select a finding to see a plain-English explanation.";

    public string FixText => SelectedFinding?.RecommendedFix
        ?? "Recommended fixes appear here after you select an item.";

    public string RawText => SelectedFinding?.RawMessage ?? "—";

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
        AiSuggestion = string.Empty;
        AiStatus = string.Empty;
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

    [RelayCommand]
    private void CopySelected()
    {
        if (SelectedFinding is null) return;

        var text = FormatFinding(SelectedFinding);
        var package = new DataPackage();
        package.SetText(text);
        Clipboard.SetContent(package);
        CopyStatus = "Copied finding to clipboard.";
    }

    [RelayCommand]
    private void CopyAll()
    {
        if (Findings.Count == 0)
        {
            CopyStatus = "Nothing to copy — run a scan first.";
            return;
        }

        var sb = new StringBuilder();
        foreach (var f in Findings)
        {
            sb.AppendLine(FormatFinding(f));
            sb.AppendLine(new string('-', 40));
        }

        var package = new DataPackage();
        package.SetText(sb.ToString());
        Clipboard.SetContent(package);
        CopyStatus = $"Copied {Findings.Count} finding(s) to clipboard.";
    }

    [RelayCommand]
    private async Task AskAiAsync()
    {
        if (!CanRequestAi || SelectedFinding is null) return;

        IsBusy = true;
        AiStatus = "Asking your configured AI endpoint…";
        AiSuggestion = string.Empty;
        try
        {
            var result = await _ai.SuggestFixAsync(SelectedFinding);
            if (result.Success)
            {
                AiSuggestion = result.Message;
                AiStatus = "AI suggestion ready (from your key / endpoint). Review before acting.";
            }
            else
            {
                AiSuggestion = string.Empty;
                AiStatus = result.Message;
            }
        }
        catch (Exception ex)
        {
            AiStatus = $"AI request failed: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }

    private static string FormatFinding(CrashEvent f) =>
        $"{f.Title}\n" +
        $"{f.SummaryLine}\n" +
        $"Explanation: {f.Explanation}\n" +
        $"Recommended fix: {f.RecommendedFix}\n" +
        $"Raw: {f.RawMessage}";
}
