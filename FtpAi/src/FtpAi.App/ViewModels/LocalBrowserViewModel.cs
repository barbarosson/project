using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace FtpAi.ViewModels;

public sealed partial class LocalBrowserViewModel : ObservableObject
{
    public ObservableCollection<BrowserItemViewModel> Items { get; } = [];

    public ObservableCollection<string> RootPaths { get; } = [];

    [ObservableProperty]
    private string _currentPath = string.Empty;

    [ObservableProperty]
    private BrowserItemViewModel? _selectedItem;

    [ObservableProperty]
    private string _statusMessage = "Local";

    public LocalBrowserViewModel()
    {
        try
        {
            foreach (var drive in DriveInfo.GetDrives().Where(d => d.IsReady))
            {
                RootPaths.Add(drive.RootDirectory.FullName);
            }
        }
        catch
        {
            // Non-Windows smoke / restricted environment.
        }

        if (RootPaths.Count == 0)
        {
            RootPaths.Add(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile));
        }

        CurrentPath = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        if (string.IsNullOrWhiteSpace(CurrentPath))
        {
            CurrentPath = RootPaths[0];
        }
    }

    public Task InitializeAsync() => RefreshAsync();

    [RelayCommand]
    private async Task RefreshAsync()
    {
        try
        {
            if (string.IsNullOrWhiteSpace(CurrentPath) || !Directory.Exists(CurrentPath))
            {
                StatusMessage = "Path not found";
                Items.Clear();
                return;
            }

            var path = Path.GetFullPath(CurrentPath);
            if (!string.Equals(CurrentPath, path, StringComparison.OrdinalIgnoreCase))
            {
                CurrentPath = path;
            }

            var entries = await Task.Run(() => BuildListing(path)).ConfigureAwait(true);

            Items.Clear();
            foreach (var item in entries)
            {
                Items.Add(item);
            }

            StatusMessage = $"{Items.Count(i => !i.IsParentLink)} items";
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
        var parent = Directory.GetParent(CurrentPath);
        if (parent is null)
        {
            return;
        }

        CurrentPath = parent.FullName;
        await RefreshAsync().ConfigureAwait(false);
    }

    [RelayCommand]
    private async Task OpenItemAsync(BrowserItemViewModel? item)
    {
        if (item is null)
        {
            return;
        }

        if (item.IsDirectory || item.IsParentLink)
        {
            CurrentPath = item.FullPath;
            await RefreshAsync().ConfigureAwait(false);
        }
    }

    [RelayCommand]
    private async Task GoToRootAsync(string? root)
    {
        if (string.IsNullOrWhiteSpace(root))
        {
            return;
        }

        CurrentPath = root;
        await RefreshAsync().ConfigureAwait(false);
    }

    private static List<BrowserItemViewModel> BuildListing(string path)
    {
        var list = new List<BrowserItemViewModel>();
        var parent = Directory.GetParent(path);
        if (parent is not null)
        {
            list.Add(new BrowserItemViewModel("..", parent.FullName, isDirectory: true, 0, null, isParentLink: true));
        }

        foreach (var dir in Directory.EnumerateDirectories(path).OrderBy(d => d, StringComparer.OrdinalIgnoreCase))
        {
            var info = new DirectoryInfo(dir);
            list.Add(new BrowserItemViewModel(info.Name, info.FullName, true, 0, info.LastWriteTimeUtc));
        }

        foreach (var file in Directory.EnumerateFiles(path).OrderBy(f => f, StringComparer.OrdinalIgnoreCase))
        {
            var info = new FileInfo(file);
            list.Add(new BrowserItemViewModel(info.Name, info.FullName, false, info.Length, info.LastWriteTimeUtc));
        }

        return list;
    }
}
