using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Helpers;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Transfer;

namespace UplinkFtp.ViewModels;

/// <summary>Shell ViewModel: quick connect, browsers, log, transfer queue, DnD enqueue.</summary>
public sealed partial class MainViewModel : ObservableObject, IDisposable
{
    private readonly IFtpService _ftpService;
    private readonly ILicenseService _licenseService;
    private readonly ITransferQueueService _transferQueue;

    public LocalBrowserViewModel LocalBrowser { get; }

    public RemoteBrowserViewModel RemoteBrowser { get; }

    public LogViewModel Log { get; }

    public TransferQueueViewModel TransferQueue { get; }

    public string[] ProtocolOptions { get; } = ["FTP", "FTPS", "SFTP"];

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
    private bool _acceptAnyCertificate = true;

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
        LocalBrowserViewModel localBrowser,
        RemoteBrowserViewModel remoteBrowser,
        LogViewModel log,
        TransferQueueViewModel transferQueueViewModel)
    {
        _ftpService = ftpService;
        _licenseService = licenseService;
        _transferQueue = transferQueue;
        LocalBrowser = localBrowser;
        RemoteBrowser = remoteBrowser;
        Log = log;
        TransferQueue = transferQueueViewModel;

        _transferQueue.JobUpdated += OnTransferJobUpdated;

        StatusText =
            $"ADIM 5 queue · License {_licenseService.GetCurrentTier()} · max {_licenseService.GetMaxConcurrentTransfers()} transfers";
        Log.Info(
            $"Transfer queue ready (max {_licenseService.GetMaxConcurrentTransfers()} concurrent). Drag files between panes to enqueue.");
    }

    public void Dispose()
    {
        _transferQueue.JobUpdated -= OnTransferJobUpdated;
        TransferQueue.Dispose();
    }

    public async Task InitializeAsync()
    {
        await LocalBrowser.InitializeAsync().ConfigureAwait(true);
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
                Protocol = ParseProtocol(SelectedProtocol),
                AcceptAnyCertificate = AcceptAnyCertificate
            };

            Log.Info($"Connecting to {options.Host}:{options.ResolvePort()} via {options.Protocol}…");
            await _ftpService.ConnectAsync(options).ConfigureAwait(true);
            IsConnected = true;
            StatusText = $"Connected · {_ftpService.Name}";
            RemoteBrowser.SetConnected(true);
            await RemoteBrowser.NavigateToAsync("/").ConfigureAwait(true);
            Log.Info("Connected.");
        }
        catch (Exception ex)
        {
            IsConnected = false;
            RemoteBrowser.SetConnected(false);
            StatusText = "Connection failed";
            Log.Error(ex.Message);
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
            Log.Error(ex.Message);
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

    private Task HandleDropAsync(string? dragText, bool targetIsRemote)
    {
        var payload = TryParsePayload(dragText);
        if (payload is null)
        {
            Log.Warn("Drop ignored — unrecognized drag payload.");
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
            Log.Warn($"{job.Direction} paused: {job.DisplayName} (resume restarts from the beginning)");
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

    private static RemoteProtocol ParseProtocol(string value) => value.ToUpperInvariant() switch
    {
        "FTPS" => RemoteProtocol.Ftps,
        "SFTP" => RemoteProtocol.Sftp,
        _ => RemoteProtocol.Ftp
    };
}
