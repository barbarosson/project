using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Helpers;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Entities;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Persistence;
using UplinkFtp.Services.Protocol;
using UplinkFtp.Services.Settings;
using UplinkFtp.Services.Transfer;

namespace UplinkFtp.ViewModels;

/// <summary>Shell ViewModel: quick connect, browsers, log, transfer queue, DnD enqueue.</summary>
public sealed partial class MainViewModel : ObservableObject, IDisposable
{
    private readonly IFtpService _ftpService;
    private readonly ILicenseService _licenseService;
    private readonly ITransferQueueService _transferQueue;
    private readonly ISiteRepository _sites;
    private readonly AppSettings _settings;
    private readonly WebLicenseService? _webLicense;

    private string? _privateKeyPath;
    private string? _pendingRemotePath;

    public LocalBrowserViewModel LocalBrowser { get; }

    public RemoteBrowserViewModel RemoteBrowser { get; }

    public LogViewModel Log { get; }

    public TransferQueueViewModel TransferQueue { get; }

    public string[] ProtocolOptions { get; } = ["FTP", "FTPS", "SFTP"];

    /// <summary>Raised when Site Manager dialog should open.</summary>
    public event EventHandler? OpenSiteManagerRequested;

    /// <summary>Raised when Settings dialog should open.</summary>
    public event EventHandler? OpenSettingsRequested;

    /// <summary>Raised when License dialog should open.</summary>
    public event EventHandler? OpenLicenseRequested;

    /// <summary>Raised when AI Assist dialog should open.</summary>
    public event EventHandler? OpenAssistRequested;

    /// <summary>Optional Assist pivot index (0 Troubleshoot … 4 Quick Edit).</summary>
    public int AssistInitialTabIndex { get; private set; }

    /// <summary>Optional remote path for Quick Edit when Assist opens.</summary>
    public string? AssistQuickEditPath { get; private set; }

    /// <summary>Raised after <see cref="ApplySite"/> so the PasswordBox can sync.</summary>
    public event EventHandler? CredentialsApplied;

    [ObservableProperty]
    private string _host = string.Empty;

    [ObservableProperty]
    private string _portText = "21";

    [ObservableProperty]
    private string _selectedProtocol = "FTP";

    [ObservableProperty]
    private string _username = string.Empty;

    /// <summary>Synced from PasswordBox in thin code-behind.</summary>
    [ObservableProperty]
    private string _password = string.Empty;

    [ObservableProperty]
    private bool _acceptAnyCertificate;

    [ObservableProperty]
    private bool _isConnected;

    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string _statusText = "Ready";

    public MainViewModel(
        IFtpService ftpService,
        ILicenseService licenseService,
        ITransferQueueService transferQueue,
        ISiteRepository sites,
        AppSettings settings,
        LocalBrowserViewModel localBrowser,
        RemoteBrowserViewModel remoteBrowser,
        LogViewModel log,
        TransferQueueViewModel transferQueueViewModel)
    {
        _ftpService = ftpService;
        _licenseService = licenseService;
        _transferQueue = transferQueue;
        _sites = sites;
        _settings = settings;
        _webLicense = licenseService as WebLicenseService;
        LocalBrowser = localBrowser;
        RemoteBrowser = remoteBrowser;
        Log = log;
        TransferQueue = transferQueueViewModel;

        AcceptAnyCertificate = settings.AcceptAnyCertificate;
        SelectedProtocol = FormatProtocolLabel(settings.DefaultProtocol);

        _transferQueue.JobUpdated += OnTransferJobUpdated;

        StatusText =
            $"{_licenseService.Channel} · {_licenseService.GetCurrentTier()} · sites≤{FormatLimit(_licenseService.GetMaxSavedSites())} · conn≤{FormatLimit(_licenseService.GetMaxConcurrentConnections())} · xfer≤{FormatLimit(_licenseService.GetMaxConcurrentTransfers())}";
        Log.Info($"{_licenseService.StatusDetail}. Drag files between panes to enqueue transfers. Pause/resume continues from byte offset for files; directories restart.");
    }

    private static string FormatLimit(int value)
        => value >= LicenseLimits.ProUnlimited ? "∞" : value.ToString();

    /// <summary>Optional Web license service when channel is Web (null on Store).</summary>
    public WebLicenseService? WebLicense => _webLicense;

    public ISiteRepository Sites => _sites;

    public AppSettings Settings => _settings;

    public void Dispose()
    {
        _transferQueue.JobUpdated -= OnTransferJobUpdated;
        TransferQueue.Dispose();
    }

    public async Task InitializeAsync()
    {
        await LocalBrowser.InitializeAsync().ConfigureAwait(true);
    }

    /// <summary>Refresh the toolbar status line after license activate/clear/refresh.</summary>
    public void RefreshLicenseStatusText()
    {
        StatusText =
            $"{_licenseService.Channel} · {_licenseService.GetCurrentTier()} · sites≤{FormatLimit(_licenseService.GetMaxSavedSites())} · conn≤{FormatLimit(_licenseService.GetMaxConcurrentConnections())} · xfer≤{FormatLimit(_licenseService.GetMaxConcurrentTransfers())}";
    }

    /// <summary>Fills quick-connect fields from a saved site (password from credential store).</summary>
    public void ApplySite(SiteEntity site, string? password)
    {
        ArgumentNullException.ThrowIfNull(site);

        Host = site.Host;
        PortText = site.Port > 0 ? site.Port.ToString() : "0";
        SelectedProtocol = FormatProtocolLabel(ParseProtocol(site.Protocol));
        Username = site.Username ?? string.Empty;
        Password = password ?? string.Empty;
        _privateKeyPath = site.PrivateKeyPath;
        _pendingRemotePath = string.IsNullOrWhiteSpace(site.InitialRemotePath)
            ? "/"
            : site.InitialRemotePath;
        AcceptAnyCertificate = _settings.AcceptAnyCertificate;
        CredentialsApplied?.Invoke(this, EventArgs.Empty);
    }

    partial void OnSelectedProtocolChanged(string value)
    {
        if (!int.TryParse(PortText, out var port))
        {
            port = 0;
        }

        if (port is 0 or 21 or 22 or 990)
        {
            PortText = value.ToUpperInvariant() switch
            {
                "FTPS" => "990",
                "SFTP" => "22",
                _ => "21"
            };
        }
    }

    [RelayCommand]
    private void OpenSiteManager() => OpenSiteManagerRequested?.Invoke(this, EventArgs.Empty);

    [RelayCommand]
    private void OpenSettings() => OpenSettingsRequested?.Invoke(this, EventArgs.Empty);

    [RelayCommand]
    private void OpenLicense() => OpenLicenseRequested?.Invoke(this, EventArgs.Empty);

    [RelayCommand]
    private void OpenAssist()
    {
        AssistInitialTabIndex = 0;
        AssistQuickEditPath = null;
        OpenAssistRequested?.Invoke(this, EventArgs.Empty);
    }

    public void RequestAssistTroubleshoot()
    {
        AssistInitialTabIndex = 0;
        AssistQuickEditPath = null;
        OpenAssistRequested?.Invoke(this, EventArgs.Empty);
    }

    public void RequestAssistQuickEdit(string remotePath)
    {
        AssistInitialTabIndex = 4;
        AssistQuickEditPath = remotePath;
        OpenAssistRequested?.Invoke(this, EventArgs.Empty);
    }

    [RelayCommand]
    private async Task ConnectAsync()
    {
        if (IsBusy)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(Host))
        {
            Log.Warn("Host is required.");
            return;
        }

        IsBusy = true;
        try
        {
            var options = new ConnectionOptions
            {
                Host = Host.Trim(),
                Port = int.TryParse(PortText, out var p) ? p : 0,
                Username = string.IsNullOrWhiteSpace(Username) ? "anonymous" : Username.Trim(),
                Password = Password,
                PrivateKeyPath = _privateKeyPath,
                Protocol = ParseProtocol(SelectedProtocol),
                AcceptAnyCertificate = AcceptAnyCertificate,
                ConnectTimeout = _settings.ConnectTimeout,
                ReadTimeout = _settings.ReadTimeout,
                RetryCount = _settings.RetryCount,
                RetryDelay = _settings.RetryDelay,
                UsePassive = _settings.UsePassive
            };

            Log.Info($"Connecting to {options.Host}:{options.ResolvePort()} via {options.Protocol}…");
            await _ftpService.ConnectAsync(options).ConfigureAwait(true);
            IsConnected = true;
            StatusText = $"Connected · {_ftpService.Name}";
            RemoteBrowser.SetConnected(true);
            var remotePath = string.IsNullOrWhiteSpace(_pendingRemotePath) ? "/" : _pendingRemotePath;
            _pendingRemotePath = null;
            await RemoteBrowser.NavigateToAsync(remotePath).ConfigureAwait(true);
            Log.Info("Connected.");
        }
        catch (Exception ex)
        {
            IsConnected = false;
            RemoteBrowser.SetConnected(false);
            StatusText = "Connection failed";
            Log.Error(ProtocolError.ToUserMessage(ex));
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task DisconnectAsync()
    {
        if (IsBusy)
        {
            return;
        }

        IsBusy = true;
        try
        {
            await _ftpService.DisconnectAsync().ConfigureAwait(true);
            IsConnected = false;
            RemoteBrowser.SetConnected(false);
            StatusText = "Disconnected";
            Log.Info("Disconnected.");
        }
        catch (Exception ex)
        {
            Log.Error(ProtocolError.ToUserMessage(ex));
        }
        finally
        {
            IsBusy = false;
        }
    }

    /// <summary>Drop onto the remote pane (enqueue upload from local).</summary>
    public Task HandleDropOnRemoteAsync(string? dragText)
        => HandleDropAsync(dragText, targetIsRemote: true);

    /// <summary>Drop onto the local pane (enqueue download from remote).</summary>
    public Task HandleDropOnLocalAsync(string? dragText)
        => HandleDropAsync(dragText, targetIsRemote: false);

    /// <summary>Button fallback: upload the selected local item to the current remote folder.</summary>
    public void EnqueueSelectedUpload(BrowserItemViewModel? item)
    {
        if (item is null || item.IsParentLink)
        {
            Log.Warn("Select a local file or folder to upload.");
            return;
        }

        if (!IsConnected)
        {
            Log.Warn("Connect before uploading.");
            return;
        }

        var remotePath = RemotePath.Combine(RemoteBrowser.CurrentPath, item.Name);
        TransferQueue.EnqueueUpload(item.FullPath, remotePath, item.IsDirectory);
        Log.Info($"Queued upload {item.Name} → {remotePath}");
    }

    /// <summary>Button fallback: download the selected remote item to the current local folder.</summary>
    public void EnqueueSelectedDownload(BrowserItemViewModel? item)
    {
        if (item is null || item.IsParentLink)
        {
            Log.Warn("Select a remote file or folder to download.");
            return;
        }

        if (!IsConnected)
        {
            Log.Warn("Connect before downloading.");
            return;
        }

        var localPath = Path.Combine(LocalBrowser.CurrentPath, item.Name);
        TransferQueue.EnqueueDownload(item.FullPath, localPath, item.IsDirectory);
        Log.Info($"Queued download {item.Name} → {localPath}");
    }

    private Task HandleDropAsync(string? dragText, bool targetIsRemote)
    {
        var payload = TryParsePayload(dragText);
        if (payload is null)
        {
            Log.Warn("Drop ignored — unrecognized drag payload. Drag from the other pane, or use Upload → / ← Download.");
            return Task.CompletedTask;
        }

        if (targetIsRemote)
        {
            if (!TransferDragPayload.IsLocal(payload.Side))
            {
                Log.Warn("Drop on remote only accepts local files.");
                return Task.CompletedTask;
            }

            if (!IsConnected)
            {
                Log.Warn("Connect before uploading.");
                return Task.CompletedTask;
            }

            var remotePath = RemotePath.Combine(RemoteBrowser.CurrentPath, payload.Name);
            TransferQueue.EnqueueUpload(payload.FullPath, remotePath, payload.IsDirectory);
            Log.Info($"Queued upload {payload.Name} → {remotePath}");
        }
        else
        {
            if (!TransferDragPayload.IsRemote(payload.Side))
            {
                Log.Warn("Drop on local only accepts remote files.");
                return Task.CompletedTask;
            }

            if (!IsConnected)
            {
                Log.Warn("Connect before downloading.");
                return Task.CompletedTask;
            }

            var localPath = Path.Combine(LocalBrowser.CurrentPath, payload.Name);
            TransferQueue.EnqueueDownload(payload.FullPath, localPath, payload.IsDirectory);
            Log.Info($"Queued download {payload.Name} → {localPath}");
        }

        return Task.CompletedTask;
    }

    private void OnTransferJobUpdated(object? sender, TransferJob job)
    {
        if (job.State == TransferJobState.Successful)
        {
            Log.Info($"{job.Direction} finished: {job.DisplayName}");
            _ = RefreshBrowsersAfterTransferAsync(job.Direction);
        }
        else if (job.State == TransferJobState.Failed)
        {
            Log.Error($"{job.Direction} failed: {job.Error ?? job.DisplayName}");
        }
        else if (job.State == TransferJobState.Paused)
        {
            if (job.SupportsResume)
            {
                Log.Warn($"{job.Direction} paused: {job.DisplayName} (resume continues from byte offset {job.ResumeOffsetBytes})");
            }
            else
            {
                Log.Warn($"{job.Direction} paused: {job.DisplayName} (directories restart from the beginning)");
            }
        }
    }

    private async Task RefreshBrowsersAfterTransferAsync(TransferDirection direction)
    {
        try
        {
            if (direction == TransferDirection.Upload)
            {
                await RemoteBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
            }
            else
            {
                await LocalBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
            }
        }
        catch (Exception ex)
        {
            Log.Warn($"Refresh after transfer: {ex.Message}");
        }
    }

    public static string CreateDragText(BrowserItemViewModel item, string side)
    {
        var payload = new TransferDragPayload
        {
            Side = side,
            FullPath = item.FullPath,
            Name = item.Name,
            IsDirectory = item.IsDirectory
        };
        return TransferDragPayload.DataFormatPrefix + JsonSerializer.Serialize(payload);
    }

    private static TransferDragPayload? TryParsePayload(string? dragText)
    {
        if (string.IsNullOrWhiteSpace(dragText) ||
            !dragText.StartsWith(TransferDragPayload.DataFormatPrefix, StringComparison.Ordinal))
        {
            return null;
        }

        try
        {
            var json = dragText[TransferDragPayload.DataFormatPrefix.Length..];
            return JsonSerializer.Deserialize<TransferDragPayload>(json);
        }
        catch
        {
            return null;
        }
    }

    private static string FormatProtocolLabel(RemoteProtocol protocol) => protocol switch
    {
        RemoteProtocol.Ftps => "FTPS",
        RemoteProtocol.Sftp => "SFTP",
        _ => "FTP"
    };

    private static RemoteProtocol ParseProtocol(string value) => value.ToUpperInvariant() switch
    {
        "FTPS" => RemoteProtocol.Ftps,
        "SFTP" => RemoteProtocol.Sftp,
        _ => RemoteProtocol.Ftp
    };
}
