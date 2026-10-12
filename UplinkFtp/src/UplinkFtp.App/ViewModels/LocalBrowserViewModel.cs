using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Services.Ai;
using UplinkFtp.Services.Browse;

namespace UplinkFtp.ViewModels;

public sealed partial class LocalBrowserViewModel : ObservableObject
{
    private readonly IAiAssistantService _ai;
    private List<BrowserItemViewModel> _fullListing = [];

    public ObservableCollection<BrowserItemViewModel> Items { get; } = [];

    public ObservableCollection<string> RootPaths { get; } = [];

    public event EventHandler<string>? Navigated;

    [ObservableProperty]
    private string _currentPath = string.Empty;

    [ObservableProperty]
    private BrowserItemViewModel? _selectedItem;

    [ObservableProperty]
    private string _statusMessage = "Local";

    [ObservableProperty]
    private string _aiSearchQuery = string.Empty;

    [ObservableProperty]
    private string _aiFilterStatus = string.Empty;

    [ObservableProperty]
    private bool _hasAiFilter;

    [ObservableProperty]
    private bool _showHiddenFiles = true;

    public LocalBrowserViewModel(IAiAssistantService ai)
    {
        _ai = ai;

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
                _fullListing = [];
                return;
            }

            var path = Path.GetFullPath(CurrentPath);
            if (!string.Equals(CurrentPath, path, StringComparison.OrdinalIgnoreCase))
            {
                CurrentPath = path;
            }

            var includeHidden = ShowHiddenFiles;
            _fullListing = await Task.Run(() => BuildListing(path, includeHidden)).ConfigureAwait(true);

            if (HasAiFilter && !string.IsNullOrWhiteSpace(AiSearchQuery))
            {
                var filter = await _ai.ParseSearchQueryAsync(AiSearchQuery).ConfigureAwait(true);
                await ApplyAiFilterAsync(filter).ConfigureAwait(true);
            }
            else
            {
                ReplaceItems(_fullListing);
                StatusMessage = $"{Items.Count(i => !i.IsParentLink)} items";
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

    partial void OnShowHiddenFilesChanged(bool value) => _ = RefreshAsync();

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

    public async Task NavigateToAsync(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return;
        }

        CurrentPath = path;
        await RefreshAsync().ConfigureAwait(false);
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

    [RelayCommand]
    private async Task ApplyAiSearchAsync()
    {
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
            StatusMessage = $"{Items.Count(i => !i.IsParentLink)} items";
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
        StatusMessage = $"{count} filtered";
        AiFilterStatus = filter.Explanation;
        return Task.FromResult(count);
    }

    public async Task RenameSelectedAsync(string newName)
    {
        if (SelectedItem is null || SelectedItem.IsParentLink || string.IsNullOrWhiteSpace(newName))
        {
            return;
        }

        var dest = Path.Combine(CurrentPath, newName.Trim());
        await Task.Run(() =>
        {
            if (SelectedItem.IsDirectory)
            {
                Directory.Move(SelectedItem.FullPath, dest);
            }
            else
            {
                File.Move(SelectedItem.FullPath, dest);
            }
        }).ConfigureAwait(true);
        await RefreshAsync().ConfigureAwait(true);
    }

    public async Task DeleteSelectedAsync()
    {
        if (SelectedItem is null || SelectedItem.IsParentLink)
        {
            return;
        }

        var path = SelectedItem.FullPath;
        var isDir = SelectedItem.IsDirectory;
        await Task.Run(() =>
        {
            if (isDir)
            {
                Directory.Delete(path, recursive: true);
            }
            else
            {
                File.Delete(path);
            }
        }).ConfigureAwait(true);
        await RefreshAsync().ConfigureAwait(true);
    }

    public async Task CreateDirectoryAsync(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return;
        }

        var path = Path.Combine(CurrentPath, name.Trim());
        await Task.Run(() => Directory.CreateDirectory(path)).ConfigureAwait(true);
        await RefreshAsync().ConfigureAwait(true);
    }

    public async Task CreateEmptyFileAsync(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return;
        }

        var path = Path.Combine(CurrentPath, name.Trim());
        await Task.Run(() =>
        {
            if (File.Exists(path) || Directory.Exists(path))
            {
                throw new IOException($"'{name}' already exists.");
            }

            using var _ = File.Create(path);
        }).ConfigureAwait(true);
        await RefreshAsync().ConfigureAwait(true);
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

    private static List<BrowserItemViewModel> BuildListing(string path, bool includeHidden)
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
            if (!includeHidden && IsHidden(info))
            {
                continue;
            }

            list.Add(new BrowserItemViewModel(info.Name, info.FullName, true, 0, info.LastWriteTimeUtc));
        }

        foreach (var file in Directory.EnumerateFiles(path).OrderBy(f => f, StringComparer.OrdinalIgnoreCase))
        {
            var info = new FileInfo(file);
            if (!includeHidden && IsHidden(info))
            {
                continue;
            }

            list.Add(new BrowserItemViewModel(info.Name, info.FullName, false, info.Length, info.LastWriteTimeUtc));
        }

        return list;
    }

    private static bool IsHidden(FileSystemInfo info)
    {
        if (info.Name.StartsWith(".", StringComparison.Ordinal))
        {
            return true;
        }

        try
        {
            return (info.Attributes & FileAttributes.Hidden) != 0;
        }
        catch
        {
            return false;
        }
    }
}
