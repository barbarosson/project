using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Helpers;
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
    private readonly IAppSettingsStore _settingsStore;
    private LogViewModel? _log;
    private bool _suppressThemePreview;
    private string _themeAtOpen = ThemeCatalog.DefaultThemeName;

    public string[] ThemeOptions { get; } = ThemeCatalog.DisplayNames;

    public ThemePreviewCard[] ThemePreviewCards { get; } =
        ThemeCatalog.DisplayNames.Select(ThemePreviewCard.For).ToArray();

    public string[] ProtocolOptions { get; } = ["FTP", "FTPS", "SFTP"];

    public string[] AiProviderOptions { get; } = ["None", "Gemini", "OpenAI", "Anthropic"];

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
    private string _theme = ThemeCatalog.DefaultThemeName;

    [ObservableProperty]
    private string _themePreviewHint = string.Empty;

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

    [ObservableProperty]
    private string _aiModelPlaceholder = "gemini-2.0-flash";

    [ObservableProperty]
    private string _aiEndpointPlaceholder = "Leave blank for Gemini default";

    [ObservableProperty]
    private string _aiKeyPlaceholder = "AIza… (never committed)";

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

    /// <summary>True when Save persisted the current theme (dialog may close without restore).</summary>
    public bool ThemePersisted { get; private set; }

    /// <summary>Theme that was active when the dialog opened (restore target on Close without Save).</summary>
    public string ThemeAtOpen => _themeAtOpen;

    /// <summary>Raised after Save so the shell can apply theme immediately.</summary>
    public event EventHandler? SettingsSaved;

    /// <summary>Live preview while the dialog is open — shell should apply temporarily.</summary>
    public event EventHandler<string>? ThemePreviewRequested;

    public SettingsViewModel(
        AppSettings settings,
        TelemetryService telemetry,
        ICredentialStore credentials,
        IAppSettingsStore settingsStore)
    {
        _settings = settings;
        _telemetry = telemetry;
        _credentials = credentials;
        _settingsStore = settingsStore;
        LoadFromSettings();
    }

    /// <summary>Attach the live shell log so ExportLogs can write its lines.</summary>
    public void AttachLog(LogViewModel log) => _log = log;

    public void LoadFromSettings()
    {
        _suppressThemePreview = true;
        try
        {
            ConnectTimeoutSeconds = Math.Clamp(_settings.ConnectTimeout.TotalSeconds, 1, 600);
            ReadTimeoutSeconds = Math.Clamp(_settings.ReadTimeout.TotalSeconds, 1, 3600);
            RetryCount = Math.Clamp(_settings.RetryCount, 0, 20);
            RetryDelaySeconds = Math.Clamp(_settings.RetryDelay.TotalSeconds, 0, 120);
            Theme = ThemeCatalog.MigrateLegacyName(_settings.Theme);
            _themeAtOpen = Theme;
            ThemePersisted = false;
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
                AiProviderKind.Gemini => "Gemini",
                AiProviderKind.OpenAi => "OpenAI",
                AiProviderKind.Anthropic => "Anthropic",
                _ => "None"
            };
            AiModel = _settings.AiModel ?? string.Empty;
            AiEndpoint = _settings.AiEndpoint ?? string.Empty;
            AiApiKeyInput = string.Empty;
            ClearAiApiKey = false;
            UpdateAiPlaceholders();
            UpdateThemePreviewHint();
            _ = RefreshAiKeyStatusAsync();
            StatusMessage = "Loaded current settings. Theme changes preview live — Save to keep, Close to revert.";
        }
        finally
        {
            _suppressThemePreview = false;
        }
    }

    partial void OnThemeChanged(string value)
    {
        UpdateThemePreviewHint();
        if (_suppressThemePreview)
        {
            return;
        }

        ThemePreviewRequested?.Invoke(this, ThemeCatalog.MigrateLegacyName(value));
    }

    partial void OnAiProviderChanged(string value) => UpdateAiPlaceholders();

    [RelayCommand]
    private void PreviewTheme(string? themeName)
    {
        if (string.IsNullOrWhiteSpace(themeName) || !ThemeCatalog.IsKnown(themeName))
        {
            return;
        }

        Theme = ThemeCatalog.MigrateLegacyName(themeName);
    }

    private void UpdateThemePreviewHint()
    {
        var card = ThemePreviewCard.For(Theme);
        ThemePreviewHint = $"{card.Name}: {card.Feel}. Preview applies to the shell until you Save or Close.";
    }

    private void UpdateAiPlaceholders()
    {
        switch (AiProvider)
        {
            case "Gemini":
                AiModelPlaceholder = CloudAiAssistantService.DefaultGeminiModel;
                AiEndpointPlaceholder = "Blank = Google Generative Language API";
                AiKeyPlaceholder = "AIza… (Gemini API key)";
                break;
            case "OpenAI":
                AiModelPlaceholder = CloudAiAssistantService.DefaultOpenAiModel;
                AiEndpointPlaceholder = CloudAiAssistantService.DefaultOpenAiEndpoint;
                AiKeyPlaceholder = "sk-… (OpenAI)";
                break;
            case "Anthropic":
                AiModelPlaceholder = "claude-3-5-haiku-latest";
                AiEndpointPlaceholder = "OpenAI-compatible gateway URL required";
                AiKeyPlaceholder = "sk-ant-… (via gateway)";
                break;
            default:
                AiModelPlaceholder = "Select a provider first";
                AiEndpointPlaceholder = "Optional endpoint override";
                AiKeyPlaceholder = "API key (never committed)";
                break;
        }
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
        _settings.Theme = ThemeCatalog.IsKnown(Theme) ? ThemeCatalog.MigrateLegacyName(Theme) : ThemeCatalog.DefaultThemeName;
        ThemePersisted = true;
        _themeAtOpen = _settings.Theme;
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
            "Gemini" => AiProviderKind.Gemini,
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

        await _settingsStore.SaveAsync(_settings).ConfigureAwait(true);
        await RefreshAiKeyStatusAsync().ConfigureAwait(true);
        StatusMessage = AiKeyConfigured
            ? $"Settings saved to LocalAppData. {_settings.AiProvider} key stored in Windows Credential Locker."
            : "Settings saved to LocalAppData. Theme kept. AI runs locally until you add a BYOK key.";
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
