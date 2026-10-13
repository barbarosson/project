using System;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Services.Ai;
using UplinkFtp.Services.Assist;

namespace UplinkFtp.ViewModels;

/// <summary>AI Assist panel: URI parse + IAiAssistantService troubleshoot (BYOK or local).</summary>
public sealed partial class AssistViewModel : ObservableObject
{
    private readonly IAiAssistantService _ai;
    private LogViewModel? _log;
    private MainViewModel? _main;

    [ObservableProperty]
    private string _connectionText = string.Empty;

    [ObservableProperty]
    private string _parseSummary = "Paste sftp://user@host:22/path or host:port, then Apply.";

    [ObservableProperty]
    private string _diagnosisTitle = "Diagnosis";

    [ObservableProperty]
    private string _diagnosisAdvice =
        "Assist uses IAiAssistantService — local heuristics without a key; cloud when BYOK is set.";

    [ObservableProperty]
    private string _diagnosisSteps = string.Empty;

    [ObservableProperty]
    private string _aiModeText = string.Empty;

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    /// <summary>Raised after Apply fills the quick-connect bar.</summary>
    public event EventHandler? AppliedToConnectBar;

    public AssistViewModel(IAiAssistantService ai)
    {
        _ai = ai;
    }

    public void Attach(MainViewModel main, LogViewModel log)
    {
        _main = main;
        _log = log;
        _ = RefreshDiagnosisAsync();
    }

    [RelayCommand]
    private void Parse()
    {
        var result = ConnectionAssistService.ParseConnectionText(ConnectionText);
        ParseSummary = result.Summary;
        StatusMessage = result.Success ? "Parsed — click Apply to fill Connect." : "Parse failed.";
    }

    [RelayCommand]
    private void Apply()
    {
        if (_main is null)
        {
            StatusMessage = "Shell not attached.";
            return;
        }

        var result = ConnectionAssistService.ParseConnectionText(ConnectionText);
        ParseSummary = result.Summary;
        if (!result.Success)
        {
            StatusMessage = "Nothing to apply — fix the paste text first.";
            return;
        }

        if (!string.IsNullOrWhiteSpace(result.Host))
        {
            _main.Host = result.Host;
        }

        if (result.Port is int port && port > 0)
        {
            _main.PortText = port.ToString();
        }

        if (!string.IsNullOrWhiteSpace(result.Protocol))
        {
            _main.SelectedProtocol = result.Protocol;
        }

        if (!string.IsNullOrWhiteSpace(result.Username))
        {
            _main.Username = result.Username;
        }

        if (result.Password is not null)
        {
            _main.Password = result.Password;
        }

        StatusMessage = "Applied to Connect bar.";
        AppliedToConnectBar?.Invoke(this, EventArgs.Empty);
    }

    [RelayCommand]
    private async Task RefreshDiagnosisAsync()
    {
        var hasKey = await _ai.HasApiKeyAsync().ConfigureAwait(true);
        AiModeText = hasKey
            ? $"BYOK cloud ready ({_ai.ConfiguredProvider}). Troubleshoot may call your provider."
            : "Local mode — Settings → AI (BYOK) to add your API key. Checklist: docs/ai-module-checklist.md";

        if (_main is null && _log is null)
        {
            return;
        }

        try
        {
            var result = await _ai.TroubleshootAsync(new AiTroubleshootRequest
            {
                LogLines = _log?.Lines.ToArray() ?? [],
                Protocol = _main?.SelectedProtocol,
                Host = _main?.Host,
                LastCommandHint = "connect/transfer"
            }).ConfigureAwait(true);

            DiagnosisTitle = result.Title;
            DiagnosisAdvice = result.Advice;
            DiagnosisSteps = result.Steps.Count == 0
                ? string.Empty
                : string.Join(Environment.NewLine, result.Steps.Select((s, i) => $"{i + 1}. {s}"));
            StatusMessage = result.UsedCloudModel
                ? "Solved with cloud AI (BYOK)."
                : "Solved with local AI heuristics.";
        }
        catch (Exception ex)
        {
            DiagnosisTitle = "Troubleshoot failed";
            DiagnosisAdvice = ex.Message;
            DiagnosisSteps = string.Empty;
            StatusMessage = "AI troubleshoot error — check Settings → AI.";
        }
    }

    [RelayCommand]
    private void SuggestPorts()
    {
        if (_main is null)
        {
            return;
        }

        var protocol = _main.SelectedProtocol;
        var port = ConnectionAssistService.DefaultPort(protocol);
        _main.PortText = port.ToString();
        StatusMessage = $"Set port {port} for {protocol}.";
    }
}
