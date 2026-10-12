using System;
using System.Linq;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Services.Assist;

namespace UplinkFtp.ViewModels;

/// <summary>AI Assist panel: local smart parse + diagnose (no cloud LLM in skeleton).</summary>
public sealed partial class AssistViewModel : ObservableObject
{
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
        "Assist uses on-device heuristics (URI parse + log diagnosis). Cloud LLM hooks are not wired yet.";

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    /// <summary>Raised after Apply fills the quick-connect bar.</summary>
    public event EventHandler? AppliedToConnectBar;

    public void Attach(MainViewModel main, LogViewModel log)
    {
        _main = main;
        _log = log;
        RefreshDiagnosis();
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
    private void RefreshDiagnosis()
    {
        var diagnosis = ConnectionAssistService.Diagnose(_log?.Lines.ToArray());
        DiagnosisTitle = diagnosis.Title;
        DiagnosisAdvice = diagnosis.Advice;

        if (diagnosis.SuggestedProtocol is not null && string.IsNullOrWhiteSpace(ConnectionText) && _main is not null)
        {
            StatusMessage =
                $"Tip: try {diagnosis.SuggestedProtocol}" +
                (diagnosis.SuggestedPort is int p ? $":{p}" : string.Empty) + ".";
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
