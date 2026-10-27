using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.UI.Dispatching;
using Microsoft.UI.Xaml;
using UplinkFtp.Helpers;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Entities;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Browse;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Persistence;
using UplinkFtp.Services.Protocol;
using UplinkFtp.Services.Security;
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
    private readonly IDirectoryCompareService _compare;
    private readonly IDirectorySyncService _sync;
    private readonly SshHostKeyVerifier _hostKeyVerifier;
    private readonly ITransferQueuePersistence _queuePersistence;
    private readonly ISiteBookmarkStore _bookmarks;
    private readonly IAppSettingsStore _settingsStore;
    private readonly WebLicenseService? _webLicense;
    private readonly DispatcherQueue _dispatcher;

    private string? _privateKeyPath;
    private string? _pendingRemotePath;
    private bool _syncNavigating;
    private string? _lastLocalPath;
    private string? _lastRemotePath;
    private int? _activeSiteId;
    private IReadOnlyList<DirectoryCompareRow> _lastCompareRows = [];

    public LocalBrowserViewModel LocalBrowser { get; }

    public RemoteBrowserViewModel RemoteBrowser { get; }

    public LogViewModel Log { get; }

    public TransferQueueViewModel TransferQueue { get; }

    public string[] ProtocolOptions { get; } = ["FTP", "FTPS", "SFTP"];

    public string[] ConflictActionLabels { get; } =
    [
        "Ask",
        "Overwrite",
        "Skip",
        "If newer",
        "Rename",
        "Resume"
    ];

    /// <summary>Raised when Site Manager dialog should open.</summary>
    public event EventHandler? OpenSiteManagerRequested;

    /// <summary>Raised when Settings dialog should open.</summary>
    public event EventHandler? OpenSettingsRequested;

    /// <summary>Raised when License dialog should open.</summary>
    public event EventHandler? OpenLicenseRequested;

    /// <summary>Raised when AI Assist dialog should open.</summary>
    public event EventHandler? OpenAssistRequested;

    /// <summary>Raised when Pro directory sync dry-run dialog should open.</summary>
    public event EventHandler<DirectorySyncPlan>? OpenSyncPlanRequested;

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

    [ObservableProperty]
    private bool _synchronizedBrowsing;

    [ObservableProperty]
    private string _selectedConflictAction = "Overwrite";

    [ObservableProperty]
    private bool _hasCompareResults;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(DirectorySyncButtonVisibility))]
    private bool _canUseDirectorySync;

    /// <summary>Free must not see Sync UI — Collapsed unless <see cref="LicenseFeature.Sync"/>.</summary>
    public Visibility DirectorySyncButtonVisibility
        => CanUseDirectorySync ? Visibility.Visible : Visibility.Collapsed;

    [ObservableProperty]
    private string _bookmarkStatus = string.Empty;

    public MainViewModel(
        IFtpService ftpService,
        ILicenseService licenseService,
        ITransferQueueService transferQueue,
        ISiteRepository sites,
        AppSettings settings,
        IDirectoryCompareService compare,
        IDirectorySyncService sync,
        SshHostKeyVerifier hostKeyVerifier,
        ITransferQueuePersistence queuePersistence,
        ISiteBookmarkStore bookmarks,
        IAppSettingsStore settingsStore,
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
        _compare = compare;
        _sync = sync;
        _hostKeyVerifier = hostKeyVerifier;
        _queuePersistence = queuePersistence;
        _bookmarks = bookmarks;
        _settingsStore = settingsStore;
        _webLicense = licenseService as WebLicenseService;
        LocalBrowser = localBrowser;
        RemoteBrowser = remoteBrowser;
        Log = log;
        TransferQueue = transferQueueViewModel;
        _dispatcher = DispatcherQueue.GetForCurrentThread()
                      ?? throw new InvalidOperationException("MainViewModel requires a UI DispatcherQueue.");

        AcceptAnyCertificate = settings.AcceptAnyCertificate;
        SelectedProtocol = FormatProtocolLabel(settings.DefaultProtocol);
        SynchronizedBrowsing = settings.SynchronizedBrowsing;
        SelectedConflictAction = FormatConflictAction(settings.DefaultConflictAction);
        CanUseDirectorySync = _licenseService.IsFeatureEnabled(LicenseFeature.Sync);

        _transferQueue.JobUpdated += OnTransferJobUpdated;
        _transferQueue.QueueChanged += OnQueueChangedPersist;
        LocalBrowser.Navigated += OnLocalNavigated;
        RemoteBrowser.Navigated += OnRemoteNavigated;

        StatusText =
            $"{_licenseService.Channel} · {_licenseService.GetCurrentTier()} · sites≤{FormatLimit(_licenseService.GetMaxSavedSites())} · conn≤{FormatLimit(_licenseService.GetMaxConcurrentConnections())} · xfer≤{FormatLimit(_licenseService.GetMaxConcurrentTransfers())}";
        Log.Info($"{_licenseService.StatusDetail}. Drag files between panes to enqueue transfers. Pause/resume continues from byte offset for files; directories use per-file checkpoints.");
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
        _transferQueue.QueueChanged -= OnQueueChangedPersist;
        LocalBrowser.Navigated -= OnLocalNavigated;
        RemoteBrowser.Navigated -= OnRemoteNavigated;
        TransferQueue.Dispose();
        _ = PersistQueueAsync();
    }

    public TransferConflictPolicy CurrentConflictPolicy => new()
    {
        Action = ParseConflictAction(SelectedConflictAction)
    };

    [RelayCommand]
    private void CompareDirectories()
    {
        if (!IsConnected)
        {
            Log.Warn("Connect before comparing directories.");
            return;
        }

        var rows = _compare.Compare(LocalBrowser.GetFingerprints(), RemoteBrowser.GetFingerprints());
        _lastCompareRows = rows;
        var map = rows.ToDictionary(r => r.Name, r => r.Status, StringComparer.OrdinalIgnoreCase);
        LocalBrowser.ApplyCompare(map);
        RemoteBrowser.ApplyCompare(map);
        HasCompareResults = rows.Any(r => r.Status != DirectoryCompareStatus.Same);
        var diffs = rows.Count(r => r.Status != DirectoryCompareStatus.Same);
        Log.Info(diffs == 0
            ? "Compare: directories match (size/date)."
            : $"Compare: {diffs} difference(s) highlighted. Use Enqueue diffs / Sync (Pro) to act.");
    }

    [RelayCommand]
    private void ClearCompare()
    {
        LocalBrowser.ClearCompare();
        RemoteBrowser.ClearCompare();
        HasCompareResults = false;
        _lastCompareRows = [];
    }

    [RelayCommand]
    private void EnqueueCompareUpload()
        => EnqueueCompareDifferences(CompareEnqueueMode.UploadDifferences);

    [RelayCommand]
    private void EnqueueCompareDownload()
        => EnqueueCompareDifferences(CompareEnqueueMode.DownloadDifferences);

    private void EnqueueCompareDifferences(CompareEnqueueMode mode)
    {
        if (!IsConnected)
        {
            Log.Warn("Connect before enqueueing compare differences.");
            return;
        }

        if (LocalBrowser.IsComputerRoot)
        {
            Log.Warn("Open a local folder before enqueueing differences.");
            return;
        }

        if (_lastCompareRows.Count == 0)
        {
            Log.Warn("Run Compare first.");
            return;
        }

        var plan = CompareEnqueuePlanner.Plan(_lastCompareRows, mode);
        if (plan.Count == 0)
        {
            Log.Info("No differences to enqueue for that direction.");
            return;
        }

        var localItems = LocalBrowser.Items.ToDictionary(i => i.Name, i => i, StringComparer.OrdinalIgnoreCase);
        var remoteItems = RemoteBrowser.Items.ToDictionary(i => i.Name, i => i, StringComparer.OrdinalIgnoreCase);
        var queued = 0;
        foreach (var item in plan)
        {
            if (item.Upload)
            {
                if (!localItems.TryGetValue(item.Name, out var local))
                {
                    continue;
                }

                var remotePath = RemotePath.Combine(RemoteBrowser.CurrentPath, item.Name);
                TransferQueue.EnqueueUpload(local.FullPath, remotePath, local.IsDirectory, CurrentConflictPolicy);
                queued++;
            }
            else
            {
                if (!remoteItems.TryGetValue(item.Name, out var remote))
                {
                    continue;
                }

                var localPath = Path.Combine(LocalBrowser.CurrentPath, item.Name);
                TransferQueue.EnqueueDownload(remote.FullPath, localPath, remote.IsDirectory, CurrentConflictPolicy);
                queued++;
            }
        }

        Log.Info($"Enqueued {queued} compare difference(s) ({mode}).");
    }

    [RelayCommand]
    private void PreviewDirectorySync()
    {
        CanUseDirectorySync = _licenseService.IsFeatureEnabled(LicenseFeature.Sync);
        if (!CanUseDirectorySync)
        {
            Log.Warn("Directory sync is a Pro feature. Open License to upgrade.");
            OpenLicenseRequested?.Invoke(this, EventArgs.Empty);
            return;
        }

        if (_lastCompareRows.Count == 0)
        {
            Log.Warn("Run Compare before Sync.");
            return;
        }

        // Default dry-run: local → remote, no deletes.
        var plan = _sync.BuildPlan(_lastCompareRows, DirectorySyncDirection.LocalToRemote, deleteExtras: false);
        OpenSyncPlanRequested?.Invoke(this, plan);
    }

    /// <summary>Enqueue / apply a confirmed sync plan (deletes require operator confirmation in the dialog).</summary>
    public async Task ApplySyncPlanAsync(DirectorySyncPlan plan, bool executeDeletes)
    {
        ArgumentNullException.ThrowIfNull(plan);
        if (!_licenseService.IsFeatureEnabled(LicenseFeature.Sync))
        {
            Log.Warn("Directory sync requires Pro.");
            return;
        }

        if (LocalBrowser.IsComputerRoot || !IsConnected)
        {
            Log.Warn("Open a local folder and stay connected before sync.");
            return;
        }

        var localItems = LocalBrowser.Items.ToDictionary(i => i.Name, i => i, StringComparer.OrdinalIgnoreCase);
        var remoteItems = RemoteBrowser.Items.ToDictionary(i => i.Name, i => i, StringComparer.OrdinalIgnoreCase);
        var queued = 0;
        var deleted = 0;

        foreach (var item in plan.Items)
        {
            switch (item.Action)
            {
                case DirectorySyncAction.Upload when localItems.TryGetValue(item.Name, out var local):
                    TransferQueue.EnqueueUpload(
                        local.FullPath,
                        RemotePath.Combine(RemoteBrowser.CurrentPath, item.Name),
                        local.IsDirectory,
                        CurrentConflictPolicy);
                    queued++;
                    break;
                case DirectorySyncAction.Download when remoteItems.TryGetValue(item.Name, out var remote):
                    TransferQueue.EnqueueDownload(
                        remote.FullPath,
                        Path.Combine(LocalBrowser.CurrentPath, item.Name),
                        remote.IsDirectory,
                        CurrentConflictPolicy);
                    queued++;
                    break;
                case DirectorySyncAction.DeleteRemote when executeDeletes && remoteItems.TryGetValue(item.Name, out var delRemote):
                    try
                    {
                        if (delRemote.IsDirectory)
                        {
                            await _ftpService.DeleteDirectoryAsync(delRemote.FullPath).ConfigureAwait(true);
                        }
                        else
                        {
                            await _ftpService.DeleteFileAsync(delRemote.FullPath).ConfigureAwait(true);
                        }

                        deleted++;
                    }
                    catch (Exception ex)
                    {
                        Log.Error($"Sync delete remote failed: {ex.Message}");
                    }

                    break;
                case DirectorySyncAction.DeleteLocal when executeDeletes && localItems.TryGetValue(item.Name, out var delLocal):
                    try
                    {
                        if (delLocal.IsDirectory)
                        {
                            Directory.Delete(delLocal.FullPath, recursive: true);
                        }
                        else
                        {
                            File.Delete(delLocal.FullPath);
                        }

                        deleted++;
                    }
                    catch (Exception ex)
                    {
                        Log.Error($"Sync delete local failed: {ex.Message}");
                    }

                    break;
            }
        }

        Log.Info($"Sync applied: queued {queued} transfer(s)" +
                 (executeDeletes ? $", deleted {deleted}." : " (deletes skipped)."));
        if (executeDeletes)
        {
            await LocalBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
            await RemoteBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
        }
    }

    [RelayCommand]
    private async Task PinRemotePathAsync()
    {
        if (_activeSiteId is not int siteId)
        {
            Log.Warn("Pin path requires connecting from a saved Site (Sites → Connect).");
            return;
        }

        var path = RemoteBrowser.CurrentPath;
        await _bookmarks.AddAsync(new SitePathBookmark
        {
            SiteId = siteId,
            Path = path,
            Label = path
        }).ConfigureAwait(true);
        BookmarkStatus = $"Pinned {path}";
        Log.Info($"Pinned remote path for site #{siteId}: {path}");
    }

    public async Task InitializeAsync()
    {
        await LocalBrowser.InitializeAsync().ConfigureAwait(true);
        await RestorePersistedQueueAsync().ConfigureAwait(true);
    }

    private async Task RestorePersistedQueueAsync()
    {
        try
        {
            var jobs = await _queuePersistence.LoadAsync().ConfigureAwait(true);
            if (jobs.Count == 0)
            {
                return;
            }

            foreach (var job in jobs)
            {
                // Do not auto-start until connected — leave Queued/Failed for operator Retry.
                if (job.State == TransferJobState.Queued)
                {
                    job.State = TransferJobState.Paused;
                    job.Detail = "Restored from last session — connect then Resume";
                }

                _transferQueue.RestoreJob(job);
            }

            Log.Info($"Restored {jobs.Count} transfer job(s) from last session.");
        }
        catch (Exception ex)
        {
            Log.Warn($"Queue restore skipped: {ex.Message}");
        }
    }

    private void OnQueueChangedPersist(object? sender, EventArgs e)
        => _ = PersistQueueAsync();

    private async Task PersistQueueAsync()
    {
        try
        {
            await _queuePersistence.SaveAsync(_transferQueue.GetSnapshot()).ConfigureAwait(false);
        }
        catch
        {
            // Persistence must never break the queue.
        }
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
        _activeSiteId = site.Id > 0 ? site.Id : null;
        _pendingRemotePath = string.IsNullOrWhiteSpace(site.InitialRemotePath)
            ? "/"
            : site.InitialRemotePath;
        AcceptAnyCertificate = _settings.AcceptAnyCertificate;
        CredentialsApplied?.Invoke(this, EventArgs.Empty);
        _ = LoadBookmarksHintAsync();
    }

    private async Task LoadBookmarksHintAsync()
    {
        if (_activeSiteId is not int siteId)
        {
            BookmarkStatus = string.Empty;
            return;
        }

        try
        {
            var pins = await _bookmarks.GetForSiteAsync(siteId).ConfigureAwait(true);
            BookmarkStatus = pins.Count == 0
                ? "No pinned paths"
                : string.Join(" · ", pins.Take(4).Select(p => p.Path));
        }
        catch
        {
            BookmarkStatus = string.Empty;
        }
    }

    /// <summary>Navigate to a pinned remote path for the active site.</summary>
    public async Task NavigateBookmarkAsync(string path)
    {
        if (!IsConnected)
        {
            Log.Warn("Connect before opening a bookmark.");
            return;
        }

        await RemoteBrowser.NavigateToAsync(path).ConfigureAwait(true);
        Log.Info($"Opened bookmark {path}");
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
                UsePassive = _settings.UsePassive,
                HostKeyVerifier = ParseProtocol(SelectedProtocol) == RemoteProtocol.Sftp
                    ? _hostKeyVerifier
                    : null
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

        if (LocalBrowser.IsComputerRoot)
        {
            Log.Warn("Open a drive or folder before uploading.");
            return;
        }

        if (!IsConnected)
        {
            Log.Warn("Connect before uploading.");
            return;
        }

        var remotePath = RemotePath.Combine(RemoteBrowser.CurrentPath, item.Name);
        TransferQueue.EnqueueUpload(item.FullPath, remotePath, item.IsDirectory, CurrentConflictPolicy);
        Log.Info($"Queued upload {item.Name} → {remotePath} ({SelectedConflictAction})");
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

        if (LocalBrowser.IsComputerRoot)
        {
            Log.Warn("Open a drive or folder in Local site before downloading.");
            return;
        }

        var localPath = Path.Combine(LocalBrowser.CurrentPath, item.Name);
        TransferQueue.EnqueueDownload(item.FullPath, localPath, item.IsDirectory, CurrentConflictPolicy);
        Log.Info($"Queued download {item.Name} → {localPath} ({SelectedConflictAction})");
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
            TransferQueue.EnqueueUpload(payload.FullPath, remotePath, payload.IsDirectory, CurrentConflictPolicy);
            Log.Info($"Queued upload {payload.Name} → {remotePath} ({SelectedConflictAction})");
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

            if (LocalBrowser.IsComputerRoot)
            {
                Log.Warn("Open a drive or folder in Local site before downloading.");
                return Task.CompletedTask;
            }

            var localPath = Path.Combine(LocalBrowser.CurrentPath, payload.Name);
            TransferQueue.EnqueueDownload(payload.FullPath, localPath, payload.IsDirectory, CurrentConflictPolicy);
            Log.Info($"Queued download {payload.Name} → {localPath} ({SelectedConflictAction})");
        }

        return Task.CompletedTask;
    }

    private void OnTransferJobUpdated(object? sender, TransferJob job)
    {
        // Transfer workers raise JobUpdated off the UI thread — marshal before touching Log/UI.
        if (_dispatcher.HasThreadAccess)
        {
            HandleTransferJobUpdated(job);
            return;
        }

        _ = _dispatcher.TryEnqueue(() => HandleTransferJobUpdated(job));
    }

    private void HandleTransferJobUpdated(TransferJob job)
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
            if (job.IsDirectory)
            {
                Log.Warn($"{job.Direction} paused: {job.DisplayName} (directory checkpoint: {job.CompletedRelativePaths.Count} file(s) done)");
            }
            else if (job.SupportsResume)
            {
                Log.Warn($"{job.Direction} paused: {job.DisplayName} (resume continues from byte offset {job.ResumeOffsetBytes})");
            }
            else
            {
                Log.Warn($"{job.Direction} paused: {job.DisplayName}");
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

    private void OnLocalNavigated(object? sender, string path)
    {
        if (!SynchronizedBrowsing || _syncNavigating || !IsConnected)
        {
            _lastLocalPath = path;
            return;
        }

        var previous = _lastLocalPath;
        _lastLocalPath = path;
        _ = MirrorLocalToRemoteAsync(previous, path);
    }

    private void OnRemoteNavigated(object? sender, string path)
    {
        if (!SynchronizedBrowsing || _syncNavigating)
        {
            _lastRemotePath = path;
            return;
        }

        var previous = _lastRemotePath;
        _lastRemotePath = path;
        _ = MirrorRemoteToLocalAsync(previous, path);
    }

    private async Task MirrorLocalToRemoteAsync(string? previousLocal, string localPath)
    {
        _syncNavigating = true;
        try
        {
            if (IsParentOf(previousLocal, localPath))
            {
                await RemoteBrowser.NavigateUpCommand.ExecuteAsync(null).ConfigureAwait(true);
                return;
            }

            var entered = TryGetEnteredName(previousLocal, localPath);
            if (entered is null)
            {
                return;
            }

            var match = RemoteBrowser.Items.FirstOrDefault(i =>
                !i.IsParentLink
                && i.IsDirectory
                && string.Equals(i.Name, entered, StringComparison.OrdinalIgnoreCase));
            if (match is not null)
            {
                await RemoteBrowser.OpenItemCommand.ExecuteAsync(match).ConfigureAwait(true);
            }
        }
        catch (Exception ex)
        {
            Log.Warn($"Sync browse: {ex.Message}");
        }
        finally
        {
            _syncNavigating = false;
            _lastRemotePath = RemoteBrowser.CurrentPath;
        }
    }

    private async Task MirrorRemoteToLocalAsync(string? previousRemote, string remotePath)
    {
        _syncNavigating = true;
        try
        {
            if (IsRemoteParentOf(previousRemote, remotePath))
            {
                await LocalBrowser.NavigateUpCommand.ExecuteAsync(null).ConfigureAwait(true);
                return;
            }

            var entered = TryGetEnteredRemoteName(previousRemote, remotePath);
            if (entered is null)
            {
                return;
            }

            var match = LocalBrowser.Items.FirstOrDefault(i =>
                !i.IsParentLink
                && i.IsDirectory
                && string.Equals(i.Name, entered, StringComparison.OrdinalIgnoreCase));
            if (match is not null)
            {
                await LocalBrowser.OpenItemCommand.ExecuteAsync(match).ConfigureAwait(true);
            }
        }
        catch (Exception ex)
        {
            Log.Warn($"Sync browse: {ex.Message}");
        }
        finally
        {
            _syncNavigating = false;
            _lastLocalPath = LocalBrowser.CurrentPath;
        }
    }

    private static bool IsParentOf(string? previous, string current)
    {
        if (string.IsNullOrWhiteSpace(previous) || string.IsNullOrWhiteSpace(current))
        {
            return false;
        }

        try
        {
            var parent = Directory.GetParent(previous);
            return parent is not null
                   && string.Equals(parent.FullName, Path.GetFullPath(current), StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private static bool IsRemoteParentOf(string? previous, string current)
    {
        if (string.IsNullOrWhiteSpace(previous) || string.IsNullOrWhiteSpace(current))
        {
            return false;
        }

        return string.Equals(RemotePath.GetDirectoryName(previous), RemotePath.Normalize(current), StringComparison.Ordinal);
    }

    private static string? TryGetEnteredName(string? previous, string current)
    {
        if (string.IsNullOrWhiteSpace(previous) || string.IsNullOrWhiteSpace(current))
        {
            return null;
        }

        try
        {
            var prev = Path.GetFullPath(previous).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            var cur = Path.GetFullPath(current).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            if (!cur.StartsWith(prev + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
                && !cur.StartsWith(prev + Path.AltDirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var relative = cur[prev.Length..].TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            var segment = relative.Split([Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar], StringSplitOptions.RemoveEmptyEntries);
            return segment.Length == 1 ? segment[0] : null;
        }
        catch
        {
            return null;
        }
    }

    private static string? TryGetEnteredRemoteName(string? previous, string current)
    {
        if (string.IsNullOrWhiteSpace(previous) || string.IsNullOrWhiteSpace(current))
        {
            return null;
        }

        var prev = RemotePath.Normalize(previous);
        var cur = RemotePath.Normalize(current);
        if (prev == "/")
        {
            var top = cur.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
            return top.Length == 1 ? top[0] : null;
        }

        if (!cur.StartsWith(prev + "/", StringComparison.Ordinal))
        {
            return null;
        }

        var relative = cur[(prev.Length + 1)..];
        var parts = relative.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length == 1 ? parts[0] : null;
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

    private static TransferConflictAction ParseConflictAction(string label) => label switch
    {
        "Ask" => TransferConflictAction.Ask,
        "Skip" => TransferConflictAction.Skip,
        "If newer" => TransferConflictAction.OverwriteIfNewer,
        "Rename" => TransferConflictAction.AutoRename,
        "Resume" => TransferConflictAction.Resume,
        _ => TransferConflictAction.Overwrite
    };

    private static string FormatConflictAction(TransferConflictAction action) => action switch
    {
        TransferConflictAction.Ask => "Ask",
        TransferConflictAction.Skip => "Skip",
        TransferConflictAction.OverwriteIfNewer => "If newer",
        TransferConflictAction.AutoRename => "Rename",
        TransferConflictAction.Resume => "Resume",
        _ => "Overwrite"
    };

    partial void OnSynchronizedBrowsingChanged(bool value)
    {
        _settings.SynchronizedBrowsing = value;
        _ = PersistSettingsQuietAsync();
    }

    partial void OnSelectedConflictActionChanged(string value)
    {
        _settings.DefaultConflictAction = ParseConflictAction(value);
        _ = PersistSettingsQuietAsync();
    }

    private async Task PersistSettingsQuietAsync()
    {
        try
        {
            await _settingsStore.SaveAsync(_settings).ConfigureAwait(false);
        }
        catch
        {
            // Best-effort persistence of toolbar prefs.
        }
    }

    public void RefreshProFeatureGates()
    {
        CanUseDirectorySync = _licenseService.IsFeatureEnabled(LicenseFeature.Sync);
    }
}
