using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using FtpAi.Helpers;
using FtpAi.Models.Dto;
using FtpAi.Models.Enums;
using FtpAi.Services.Ftp;
using FtpAi.Services.Licensing;

namespace FtpAi.ViewModels;

/// <summary>Shell ViewModel: quick connect, browsers, log, placeholder queue, DnD transfers.</summary>
public sealed partial class MainViewModel : ObservableObject
{
    private readonly IFtpService _ftpService;
    private readonly ILicenseService _licenseService;

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
        LocalBrowserViewModel localBrowser,
        RemoteBrowserViewModel remoteBrowser,
        LogViewModel log,
        TransferQueueViewModel transferQueue)
    {
        _ftpService = ftpService;
        _licenseService = licenseService;
        LocalBrowser = localBrowser;
        RemoteBrowser = remoteBrowser;
        Log = log;
        TransferQueue = transferQueue;

        StatusText = $"ADIM 4 UI · License {_licenseService.GetCurrentTier()}";
        Log.Info("FTP AI ready — use Quick Connect or drag files between panes.");
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

        // Only auto-adjust when port still looks like a protocol default.
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
            ConnectCommand.NotifyCanExecuteChanged();
            DisconnectCommand.NotifyCanExecuteChanged();
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
            ConnectCommand.NotifyCanExecuteChanged();
            DisconnectCommand.NotifyCanExecuteChanged();
        }
    }

    /// <summary>Drop onto the remote pane (upload from local).</summary>
    public Task HandleDropOnRemoteAsync(string? dragText)
        => HandleDropAsync(dragText, targetIsRemote: true);

    /// <summary>Drop onto the local pane (download from remote).</summary>
    public Task HandleDropOnLocalAsync(string? dragText)
        => HandleDropAsync(dragText, targetIsRemote: false);

    private async Task HandleDropAsync(string? dragText, bool targetIsRemote)
    {
        var payload = TryParsePayload(dragText);
        if (payload is null)
        {
            Log.Warn("Drop ignored — unrecognized drag payload.");
            return;
        }

        if (targetIsRemote)
        {
            if (!TransferDragPayload.IsLocal(payload.Side))
            {
                Log.Warn("Drop on remote only accepts local files.");
                return;
            }

            if (!IsConnected)
            {
                Log.Warn("Connect before uploading.");
                return;
            }

            await UploadAsync(payload).ConfigureAwait(true);
        }
        else
        {
            if (!TransferDragPayload.IsRemote(payload.Side))
            {
                Log.Warn("Drop on local only accepts remote files.");
                return;
            }

            if (!IsConnected)
            {
                Log.Warn("Connect before downloading.");
                return;
            }

            await DownloadAsync(payload).ConfigureAwait(true);
        }
    }

    private async Task UploadAsync(TransferDragPayload payload)
    {
        var remotePath = RemotePath.Combine(RemoteBrowser.CurrentPath, payload.Name);
        var item = TransferQueue.Enqueue("Upload", payload.FullPath, remotePath);
        Log.Info($"Upload {payload.Name} → {remotePath}");
        IsBusy = true;
        try
        {
            if (payload.IsDirectory)
            {
                await _ftpService.UploadDirectoryAsync(payload.FullPath, remotePath).ConfigureAwait(true);
            }
            else
            {
                await _ftpService.UploadFileAsync(payload.FullPath, remotePath).ConfigureAwait(true);
            }

            item.Status = "Done";
            await RemoteBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
            Log.Info($"Upload finished: {payload.Name}");
        }
        catch (Exception ex)
        {
            item.Status = "Failed";
            item.Detail = ex.Message;
            Log.Error($"Upload failed: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task DownloadAsync(TransferDragPayload payload)
    {
        var localPath = Path.Combine(LocalBrowser.CurrentPath, payload.Name);
        var item = TransferQueue.Enqueue("Download", payload.FullPath, localPath);
        Log.Info($"Download {payload.Name} → {localPath}");
        IsBusy = true;
        try
        {
            if (payload.IsDirectory)
            {
                await _ftpService.DownloadDirectoryAsync(payload.FullPath, localPath).ConfigureAwait(true);
            }
            else
            {
                await _ftpService.DownloadFileAsync(payload.FullPath, localPath).ConfigureAwait(true);
            }

            item.Status = "Done";
            await LocalBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
            Log.Info($"Download finished: {payload.Name}");
        }
        catch (Exception ex)
        {
            item.Status = "Failed";
            item.Detail = ex.Message;
            Log.Error($"Download failed: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
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

    private TransferDragPayload? TryParsePayload(string? dragText)
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
