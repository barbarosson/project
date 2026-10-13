using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Helpers;
using UplinkFtp.Services.Ftp;

namespace UplinkFtp.ViewModels;

public sealed partial class RemoteBrowserViewModel : ObservableObject
{
    private readonly IFtpService _ftp;

    public ObservableCollection<BrowserItemViewModel> Items { get; } = [];

    [ObservableProperty]
    private string _currentPath = "/";

    [ObservableProperty]
    private BrowserItemViewModel? _selectedItem;

    [ObservableProperty]
    private string _statusMessage = "Not connected";

    [ObservableProperty]
    private bool _isConnected;

    public RemoteBrowserViewModel(IFtpService ftp)
    {
        _ftp = ftp;
    }

    public void SetConnected(bool connected)
    {
        IsConnected = connected;
        if (!connected)
        {
            Items.Clear();
            CurrentPath = "/";
            StatusMessage = "Not connected";
        }
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        if (!_ftp.IsConnected)
        {
            SetConnected(false);
            return;
        }

        try
        {
            IsConnected = true;
            var path = RemotePath.Normalize(CurrentPath);
            CurrentPath = path;
            var entries = await _ftp.ListDirectoryAsync(path).ConfigureAwait(true);

            Items.Clear();
            if (path != "/")
            {
                Items.Add(new BrowserItemViewModel(
                    "..",
                    RemotePath.GetDirectoryName(path),
                    isDirectory: true,
                    0,
                    null,
                    isParentLink: true));
            }

            foreach (var entry in entries)
            {
                Items.Add(new BrowserItemViewModel(
                    entry.Name,
                    entry.FullPath,
                    entry.IsDirectory,
                    entry.Size,
                    entry.ModifiedUtc));
            }

            StatusMessage = $"{entries.Count} items · {path}";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
            Items.Clear();
        }
    }

    [RelayCommand]
    private async Task NavigateUpAsync()
    {
        if (!_ftp.IsConnected)
        {
            return;
        }

        CurrentPath = RemotePath.GetDirectoryName(CurrentPath);
        await RefreshAsync().ConfigureAwait(false);
    }

    [RelayCommand]
    private async Task OpenItemAsync(BrowserItemViewModel? item)
    {
        if (item is null || (!item.IsDirectory && !item.IsParentLink))
        {
            return;
        }

        CurrentPath = RemotePath.Normalize(item.FullPath);
        await RefreshAsync().ConfigureAwait(false);
    }

    public async Task NavigateToAsync(string path)
    {
        CurrentPath = RemotePath.Normalize(path);
        await RefreshAsync().ConfigureAwait(false);
    }
}
