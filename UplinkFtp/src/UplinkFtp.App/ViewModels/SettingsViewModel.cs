using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ai;
using UplinkFtp.Services.Privacy;
using UplinkFtp.Services.Security;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.ViewModels;

/// <summary>Binds <see cref="AppSettings"/> for timeouts, theme, protocol defaults, privacy, AI BYOK.</summary>
public sealed partial class SettingsViewModel : ObservableObject
{
    private readonly AppSettings _settings;
    private readonly TelemetryService _telemetry;
    private readonly ICredentialStore _credentials;
    private LogViewModel? _log;

    public string[] ThemeOptions { get; } = ["System", "Light", "Dark"];

    public string[] ProtocolOptions { get; } = ["FTP", "FTPS", "SFTP"];

    public string[] AiProviderOptions { get; } = ["None", "OpenAI", "Anthropic"];

    // Doubles for WinUI NumberBox.Value TwoWay binding.
    [ObservableProperty]
    private double _connectTimeoutSeconds = 30;

    [ObservableProperty]
    private double _readTimeoutSeconds = 60;

    [ObservableProperty]
    private double _retryCount = 3;

    [ObservableProperty]
    private double _retryDelaySeconds = 1;

    [ObservableProperty]
    private string _theme = "System";

    [ObservableProperty]
    private string _defaultProtocol = "FTP";

    [ObservableProperty]
    private bool _acceptAnyCertificate;

    [ObservableProperty]
    private bool _usePassive = true;

    [ObservableProperty]
    private bool _telemetryOptIn;

    [ObservableProperty]
    private string _aiProvider = "None";

    [ObservableProperty]
    private string _aiModel = string.Empty;

    [ObservableProperty]
    private string _aiEndpoint = string.Empty;

    /// <summary>PasswordBox sync — never bound two-way into settings plaintext.</summary>
    [ObservableProperty]
    private string _aiApiKeyInput = string.Empty;

    [ObservableProperty]
    private bool _aiKeyConfigured;

    [ObservableProperty]
    private string _aiKeyStatusText = "No AI API key stored.";

    [ObservableProperty]
    private bool _clearAiApiKey;

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    /// <summary>Raised after Save so the shell can apply theme immediately.</summary>
    public event EventHandler? SettingsSaved;

    public SettingsViewModel(
        AppSettings settings,
        TelemetryService telemetry,
        ICredentialStore credentials)
    {
        _settings = settings;
        _telemetry = telemetry;
        _credentials = credentials;
        LoadFromSettings();
    }

    /// <summary>Attach the live shell log so ExportLogs can write its lines.</summary>
    public void AttachLog(LogViewModel log) => _log = log;

    public void LoadFromSettings()
    {
        ConnectTimeoutSeconds = Math.Clamp(_settings.ConnectTimeout.TotalSeconds, 1, 600);
        ReadTimeoutSeconds = Math.Clamp(_settings.ReadTimeout.TotalSeconds, 1, 3600);
        RetryCount = Math.Clamp(_settings.RetryCount, 0, 20);
        RetryDelaySeconds = Math.Clamp(_settings.RetryDelay.TotalSeconds, 0, 120);
        Theme = string.IsNullOrWhiteSpace(_settings.Theme) ? "System" : _settings.Theme;
        DefaultProtocol = _settings.DefaultProtocol switch
        {
            RemoteProtocol.Ftps => "FTPS",
            RemoteProtocol.Sftp => "SFTP",
            _ => "FTP"
        };
        AcceptAnyCertificate = _settings.AcceptAnyCertificate;
        UsePassive = _settings.UsePassive;
        TelemetryOptIn = _settings.TelemetryOptIn;
        AiProvider = _settings.AiProvider switch
        {
            AiProviderKind.OpenAi => "OpenAI",
            AiProviderKind.Anthropic => "Anthropic",
            _ => "None"
        };
        AiModel = _settings.AiModel ?? string.Empty;
        AiEndpoint = _settings.AiEndpoint ?? string.Empty;
        AiApiKeyInput = string.Empty;
        ClearAiApiKey = false;
        _ = RefreshAiKeyStatusAsync();
        StatusMessage = "Loaded current settings.";
    }

    private async Task RefreshAiKeyStatusAsync()
    {
        var key = await _credentials.GetSecretAsync(
            AiCredentialKeys.ApiKeyResource,
            AiCredentialKeys.ApiKeyUserName).ConfigureAwait(true);
        AiKeyConfigured = !string.IsNullOrWhiteSpace(key);
        AiKeyStatusText = AiKeyConfigured
            ? "AI API key is stored in Windows Credential Locker."
            : "No AI API key stored — local Assist heuristics only.";
    }

    [RelayCommand]
    private async Task SaveAsync()
    {
        _settings.ConnectTimeout = TimeSpan.FromSeconds(Math.Clamp(ConnectTimeoutSeconds, 1, 600));
        _settings.ReadTimeout = TimeSpan.FromSeconds(Math.Clamp(ReadTimeoutSeconds, 1, 3600));
        _settings.RetryCount = (int)Math.Clamp(RetryCount, 0, 20);
        _settings.RetryDelay = TimeSpan.FromSeconds(Math.Clamp(RetryDelaySeconds, 0, 120));
        _settings.Theme = ThemeOptions.Contains(Theme) ? Theme : "System";
        _settings.DefaultProtocol = DefaultProtocol.ToUpperInvariant() switch
        {
            "FTPS" => RemoteProtocol.Ftps,
            "SFTP" => RemoteProtocol.Sftp,
            _ => RemoteProtocol.Ftp
        };
        _settings.AcceptAnyCertificate = AcceptAnyCertificate;
        _settings.UsePassive = UsePassive;
        _settings.TelemetryOptIn = TelemetryOptIn;
        _telemetry.SetOptIn(TelemetryOptIn);

        _settings.AiProvider = AiProvider switch
        {
            "OpenAI" => AiProviderKind.OpenAi,
            "Anthropic" => AiProviderKind.Anthropic,
            _ => AiProviderKind.None
        };
        _settings.AiModel = AiModel?.Trim() ?? string.Empty;
        _settings.AiEndpoint = AiEndpoint?.Trim() ?? string.Empty;

        if (ClearAiApiKey)
        {
            await _credentials.DeleteSecretAsync(
                AiCredentialKeys.ApiKeyResource,
                AiCredentialKeys.ApiKeyUserName).ConfigureAwait(true);
            ClearAiApiKey = false;
        }
        else if (!string.IsNullOrWhiteSpace(AiApiKeyInput))
        {
            await _credentials.SaveSecretAsync(
                AiCredentialKeys.ApiKeyResource,
                AiCredentialKeys.ApiKeyUserName,
                AiApiKeyInput.Trim()).ConfigureAwait(true);
            AiApiKeyInput = string.Empty;
        }

        await RefreshAiKeyStatusAsync().ConfigureAwait(true);
        StatusMessage = AiKeyConfigured
            ? "Settings saved. AI API key stored in Windows Credential Locker."
            : "Settings saved. Theme applied. AI runs locally until you add a BYOK key.";
        SettingsSaved?.Invoke(this, EventArgs.Empty);
    }

    [RelayCommand]
    private async Task ExportLogsAsync()
    {
        if (_log is null || _log.Lines.Count == 0)
        {
            StatusMessage = "No log lines to export.";
            return;
        }

        try
        {
            var dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                "UplinkFtp");
            Directory.CreateDirectory(dir);
            var path = Path.Combine(dir, $"log-{DateTime.Now:yyyyMMdd-HHmmss}.txt");
            await File.WriteAllLinesAsync(path, _log.Lines.ToArray()).ConfigureAwait(true);
            StatusMessage = $"Exported {_log.Lines.Count} line(s) to {path}";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Export failed: {ex.Message}";
        }
    }
}
