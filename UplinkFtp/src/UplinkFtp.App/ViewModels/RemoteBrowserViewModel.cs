using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Helpers;
using UplinkFtp.Models.Dto;
using UplinkFtp.Services.Ai;
using UplinkFtp.Services.Browse;
using UplinkFtp.Services.Ftp;

namespace UplinkFtp.ViewModels;

public sealed partial class RemoteBrowserViewModel : ObservableObject
{
    private readonly IFtpService _ftp;
    private readonly IAiAssistantService _ai;
    private List<BrowserItemViewModel> _fullListing = [];

    public ObservableCollection<BrowserItemViewModel> Items { get; } = [];

    public event EventHandler<string>? Navigated;

    [ObservableProperty]
    private string _currentPath = "/";

    [ObservableProperty]
    private BrowserItemViewModel? _selectedItem;

    [ObservableProperty]
    private string _statusMessage = "Not connected";

    [ObservableProperty]
    private bool _isConnected;

    [ObservableProperty]
    private string _aiSearchQuery = string.Empty;

    [ObservableProperty]
    private string _aiFilterStatus = string.Empty;

    [ObservableProperty]
    private bool _hasAiFilter;

    [ObservableProperty]
    private bool _showHiddenFiles = true;

    [ObservableProperty]
    private string _directorySizeText = string.Empty;

    public RemoteBrowserViewModel(IFtpService ftp, IAiAssistantService ai)
    {
        _ftp = ftp;
        _ai = ai;
    }

    public void SetConnected(bool connected)
    {
        IsConnected = connected;
        if (!connected)
        {
            Items.Clear();
            _fullListing = [];
            CurrentPath = "/";
            StatusMessage = "Not connected";
            ClearAiFilter();
            DirectorySizeText = string.Empty;
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
            var entries = await _ftp.ListDirectoryAsync(
                    path,
                    new RemoteListOptions { IncludeHidden = ShowHiddenFiles })
                .ConfigureAwait(true);

            _fullListing = [];
            if (path != "/")
            {
                _fullListing.Add(new BrowserItemViewModel(
                    "..",
                    RemotePath.GetDirectoryName(path),
                    isDirectory: true,
                    0,
                    null,
                    isParentLink: true));
            }

            foreach (var entry in entries)
            {
                _fullListing.Add(new BrowserItemViewModel(
                    entry.Name,
                    entry.FullPath,
                    entry.IsDirectory,
                    entry.Size,
                    entry.ModifiedUtc,
                    isSymlink: entry.IsSymlink,
                    linkTarget: entry.LinkTarget,
                    unixMode: entry.UnixMode));
            }

            if (HasAiFilter && !string.IsNullOrWhiteSpace(AiSearchQuery))
            {
                var filter = await _ai.ParseSearchQueryAsync(AiSearchQuery).ConfigureAwait(true);
                await ApplyAiFilterAsync(filter).ConfigureAwait(true);
            }
            else
            {
                ReplaceItems(_fullListing);
                StatusMessage = $"{entries.Count} items · {path}";
                AiFilterStatus = string.Empty;
            }

            Navigated?.Invoke(this, path);
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
            Items.Clear();
            _fullListing = [];
        }
    }

    partial void OnShowHiddenFilesChanged(bool value)
    {
        if (IsConnected)
        {
            _ = RefreshAsync();
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
        if (item is null)
        {
            return;
        }

        if (item.IsSymlink && !string.IsNullOrWhiteSpace(item.LinkTarget))
        {
            var target = item.LinkTarget!.StartsWith('/')
                ? RemotePath.Normalize(item.LinkTarget)
                : RemotePath.Combine(CurrentPath, item.LinkTarget);
            CurrentPath = target;
            await RefreshAsync().ConfigureAwait(false);
            return;
        }

        if (!item.IsDirectory && !item.IsParentLink)
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

    [RelayCommand]
    private async Task ApplyAiSearchAsync()
    {
        if (!_ftp.IsConnected)
        {
            AiFilterStatus = "Not connected";
            return;
        }

        if (_fullListing.Count == 0)
        {
            await RefreshAsync().ConfigureAwait(true);
        }

        var filter = await _ai.ParseSearchQueryAsync(AiSearchQuery).ConfigureAwait(true);
        var count = await ApplyAiFilterAsync(filter).ConfigureAwait(true);
        AiFilterStatus = count == 0
            ? (string.IsNullOrWhiteSpace(filter.Explanation) ? "No matches." : filter.Explanation)
            : $"AI filter: {count} file(s)";
    }

    [RelayCommand]
    private void ClearAiFilter()
    {
        HasAiFilter = false;
        AiFilterStatus = string.Empty;
        if (_fullListing.Count > 0)
        {
            ReplaceItems(_fullListing);
            var files = _fullListing.Count(i => !i.IsParentLink);
            StatusMessage = $"{files} items · {CurrentPath}";
        }
    }

    public Task<int> ApplyAiFilterAsync(AiFileFilter filter)
    {
        HasAiFilter = true;
        var parents = _fullListing.Where(i => i.IsParentLink);
        var matches = _fullListing.Where(i =>
            !i.IsParentLink
            && AiFileFilterMatcher.Matches(i.Name, i.IsDirectory, i.Size, i.ModifiedUtc, filter));
        var view = parents.Concat(matches).ToList();
        ReplaceItems(view);
        var count = view.Count(i => !i.IsParentLink);
        StatusMessage = $"{count} filtered · {CurrentPath}";
        AiFilterStatus = filter.Explanation;
        return Task.FromResult(count);
    }

    public async Task RenameSelectedAsync(string newName)
    {
        if (SelectedItem is null || SelectedItem.IsParentLink || string.IsNullOrWhiteSpace(newName))
        {
            return;
        }

        var to = RemotePath.Combine(CurrentPath, newName.Trim());
        await _ftp.RenameAsync(SelectedItem.FullPath, to).ConfigureAwait(true);
        await RefreshAsync().ConfigureAwait(true);
    }

    public async Task DeleteSelectedAsync()
    {
        if (SelectedItem is null || SelectedItem.IsParentLink)
        {
            return;
        }

        if (SelectedItem.IsDirectory)
        {
            await _ftp.DeleteDirectoryAsync(SelectedItem.FullPath).ConfigureAwait(true);
        }
        else
        {
            await _ftp.DeleteFileAsync(SelectedItem.FullPath).ConfigureAwait(true);
        }

        await RefreshAsync().ConfigureAwait(true);
    }

    public async Task CreateDirectoryAsync(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return;
        }

        await _ftp.CreateDirectoryAsync(RemotePath.Combine(CurrentPath, name.Trim())).ConfigureAwait(true);
        await RefreshAsync().ConfigureAwait(true);
    }

    public async Task CreateEmptyFileAsync(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return;
        }

        await _ftp.CreateEmptyFileAsync(RemotePath.Combine(CurrentPath, name.Trim())).ConfigureAwait(true);
        await RefreshAsync().ConfigureAwait(true);
    }

    public async Task MoveSelectedAsync(string destinationDirectory)
    {
        if (SelectedItem is null || SelectedItem.IsParentLink || string.IsNullOrWhiteSpace(destinationDirectory))
        {
            return;
        }

        var to = RemotePath.Combine(destinationDirectory.Trim(), SelectedItem.Name);
        await _ftp.MoveAsync(SelectedItem.FullPath, to).ConfigureAwait(true);
        await RefreshAsync().ConfigureAwait(true);
    }

    public async Task SetPermissionsAsync(UnixFilePermissions permissions)
    {
        if (SelectedItem is null || SelectedItem.IsParentLink)
        {
            return;
        }

        await _ftp.SetPermissionsAsync(SelectedItem.FullPath, permissions).ConfigureAwait(true);
        await RefreshAsync().ConfigureAwait(true);
    }

    public async Task CalculateSelectedSizeAsync()
    {
        if (SelectedItem is null || !SelectedItem.IsDirectory || SelectedItem.IsParentLink)
        {
            DirectorySizeText = string.Empty;
            return;
        }

        DirectorySizeText = "Calculating…";
        try
        {
            var result = await _ftp.CalculateDirectorySizeAsync(SelectedItem.FullPath).ConfigureAwait(true);
            DirectorySizeText =
                $"{SelectedItem.Name}: {FormatBytes(result.TotalBytes)} · {result.FileCount} files · {result.DirectoryCount} folders";
            StatusMessage = DirectorySizeText;
        }
        catch (Exception ex)
        {
            DirectorySizeText = ex.Message;
            StatusMessage = ex.Message;
        }
    }

    public IReadOnlyList<FileListFingerprint> GetFingerprints()
        => Items
            .Where(i => !i.IsParentLink)
            .Select(i => new FileListFingerprint
            {
                Name = i.Name,
                IsDirectory = i.IsDirectory,
                Size = i.Size,
                ModifiedUtc = i.ModifiedUtc
            })
            .ToList();

    public void ApplyCompare(IReadOnlyDictionary<string, DirectoryCompareStatus> byName)
    {
        foreach (var item in Items)
        {
            if (item.IsParentLink)
            {
                item.CompareStatus = DirectoryCompareStatus.Same;
                continue;
            }

            item.CompareStatus = byName.TryGetValue(item.Name, out var status)
                ? status
                : DirectoryCompareStatus.Same;
        }
    }

    public void ClearCompare()
    {
        foreach (var item in Items)
        {
            item.CompareStatus = DirectoryCompareStatus.Same;
        }
    }

    private void ReplaceItems(IEnumerable<BrowserItemViewModel> items)
    {
        Items.Clear();
        foreach (var item in items)
        {
            Items.Add(item);
        }
    }

    private static string FormatBytes(long bytes)
    {
        string[] units = ["B", "KB", "MB", "GB", "TB"];
        double value = bytes;
        var unit = 0;
        while (value >= 1024 && unit < units.Length - 1)
        {
            value /= 1024;
            unit++;
        }

        return unit == 0 ? $"{bytes} {units[unit]}" : $"{value:0.##} {units[unit]}";
    }
}
