using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Helpers;
using UplinkFtp.Services.Ai;
using UplinkFtp.Services.Ftp;

namespace UplinkFtp.ViewModels;

public sealed partial class RemoteBrowserViewModel : ObservableObject
{
    private readonly IFtpService _ftp;
    private readonly IAiAssistantService _ai;
    private List<BrowserItemViewModel> _fullListing = [];

    public ObservableCollection<BrowserItemViewModel> Items { get; } = [];

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
                    entry.ModifiedUtc));
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

    private void ReplaceItems(IEnumerable<BrowserItemViewModel> items)
    {
        Items.Clear();
        foreach (var item in items)
        {
            Items.Add(item);
        }
    }
}
