using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Privacy;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.ViewModels;

/// <summary>Binds <see cref="AppSettings"/> for timeouts, theme, protocol defaults, privacy.</summary>
public sealed partial class SettingsViewModel : ObservableObject
{
    private readonly AppSettings _settings;
    private readonly TelemetryService _telemetry;
    private LogViewModel? _log;

    public string[] ThemeOptions { get; } = ["System", "Light", "Dark"];

    public string[] ProtocolOptions { get; } = ["FTP", "FTPS", "SFTP"];

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
    private string _statusMessage = string.Empty;

    /// <summary>Raised after Save so the shell can apply theme immediately.</summary>
    public event EventHandler? SettingsSaved;

    public SettingsViewModel(AppSettings settings, TelemetryService telemetry)
    {
        _settings = settings;
        _telemetry = telemetry;
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
        StatusMessage = "Loaded current settings.";
    }

    [RelayCommand]
    private void Save()
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
        StatusMessage = "Settings saved for this session. Theme applied.";
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
