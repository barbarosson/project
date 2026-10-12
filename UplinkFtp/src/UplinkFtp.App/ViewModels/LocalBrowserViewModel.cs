using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Services.Ai;

namespace UplinkFtp.ViewModels;

public sealed partial class LocalBrowserViewModel : ObservableObject
{
    private readonly IAiAssistantService _ai;
    private List<BrowserItemViewModel> _fullListing = [];

    public ObservableCollection<BrowserItemViewModel> Items { get; } = [];

    public ObservableCollection<string> RootPaths { get; } = [];

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

            _fullListing = await Task.Run(() => BuildListing(path)).ConfigureAwait(true);

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
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
            Items.Clear();
            _fullListing = [];
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

    private void ReplaceItems(IEnumerable<BrowserItemViewModel> items)
    {
        Items.Clear();
        foreach (var item in items)
        {
            Items.Add(item);
        }
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
