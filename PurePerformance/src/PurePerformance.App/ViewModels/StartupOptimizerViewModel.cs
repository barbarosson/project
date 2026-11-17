using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Helpers;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class StartupOptimizerViewModel : ObservableObject
{
    private readonly IStartupManagerService _startup;

    public StartupOptimizerViewModel(IStartupManagerService startup)
    {
        _startup = startup;
        IsElevated = ElevationHelper.IsRunningElevated();
    }

    public ObservableCollection<StartupEntryItem> Entries { get; } = new();

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(CanInteract))]
    private bool isBusy;

    [ObservableProperty]
    private bool isElevated;

    [ObservableProperty]
    private string statusMessage =
        "Lists Registry Run keys and Startup-folder shortcuts. Disable moves items to a Pure Performance backup — nothing is permanently deleted.";

    [ObservableProperty]
    private string? errorMessage;

    public bool CanInteract => !IsBusy;

    [RelayCommand]
    private async Task RefreshAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            await LoadEntriesAsync();
        }
        finally
        {
            IsBusy = false;
            IsElevated = ElevationHelper.IsRunningElevated();
        }
    }

    private async Task LoadEntriesAsync(bool replaceAll = true)
    {
        ErrorMessage = null;
        StatusMessage = "Reading startup entries…";

        try
        {
            var list = await _startup.GetStartupEntriesAsync();
            var ordered = list
                .OrderBy(x => x.LocationLabel)
                .ThenBy(x => x.Name)
                .ToList();

            if (replaceAll || Entries.Count == 0)
            {
                Entries.Clear();
                foreach (var e in ordered)
                {
                    Entries.Add(new StartupEntryItem(e));
                }
            }
            else
            {
                MergeEntries(ordered);
            }

            StatusMessage = $"Found {Entries.Count} startup entr{(Entries.Count == 1 ? "y" : "ies")}.";
        }
        catch (UnauthorizedAccessException ex)
        {
            ErrorMessage = $"Access denied while reading startup items: {ex.Message}";
            StatusMessage = "Refresh failed.";
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
            StatusMessage = "Refresh failed.";
        }
    }

    /// <summary>
    /// Diffs the ObservableCollection in place so ListView does not reset scroll
    /// after enable/disable (Clear + re-Add would jump to the top).
    /// </summary>
    private void MergeEntries(IReadOnlyList<StartupEntry> ordered)
    {
        var existingByKey = Entries.ToDictionary(e => e.StableKey);
        var nextKeys = new HashSet<string>(
            ordered.Select(e => StartupEntryItem.MakeStableKey(e.Location, e.Name)));

        for (var i = Entries.Count - 1; i >= 0; i--)
        {
            if (!nextKeys.Contains(Entries[i].StableKey))
            {
                Entries.RemoveAt(i);
            }
        }

        for (var i = 0; i < ordered.Count; i++)
        {
            var entry = ordered[i];
            var key = StartupEntryItem.MakeStableKey(entry.Location, entry.Name);
            if (existingByKey.TryGetValue(key, out var item))
            {
                item.Apply(entry);
                var currentIndex = Entries.IndexOf(item);
                if (currentIndex >= 0 && currentIndex != i)
                {
                    Entries.Move(currentIndex, i);
                }
            }
            else
            {
                Entries.Insert(i, new StartupEntryItem(entry));
            }
        }
    }

    [RelayCommand]
    private async Task SetEnabledAsync(StartupEntryItem? item)
    {
        if (item is null || IsBusy) return;

        var desired = !item.IsEnabled;
        var stableKey = item.StableKey;
        IsBusy = true;
        ErrorMessage = null;
        StatusMessage = desired ? $"Enabling “{item.Name}”…" : $"Disabling “{item.Name}”…";

        try
        {
            var result = await _startup.SetEnabledAsync(item.Id, desired);
            item.LastMessage = result.Message;

            if (!result.Success)
            {
                ErrorMessage = result.Message;
                StatusMessage = result.NeedsElevation
                    ? "Admin required for this all-users item."
                    : "Change failed.";
                return;
            }

            // Merge refresh — keep the same item instances so ListView scroll stays put.
            await LoadEntriesAsync(replaceAll: false);

            var updated = Entries.FirstOrDefault(e => e.StableKey == stableKey);
            if (updated is not null)
            {
                updated.LastMessage = result.Message;
            }

            StatusMessage = result.Message;
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
            StatusMessage = "Change failed.";
        }
        finally
        {
            IsBusy = false;
            IsElevated = ElevationHelper.IsRunningElevated();
        }
    }

    [RelayCommand]
    private void RelaunchElevated()
    {
        if (ElevationHelper.IsRunningElevated())
        {
            StatusMessage = "Already running as administrator.";
            return;
        }

        if (ElevationHelper.TryRelaunchElevated())
        {
            StatusMessage = "Elevation prompt shown. Approve UAC to relaunch with admin rights, then close this window.";
        }
        else
        {
            StatusMessage = "UAC cancelled or elevation failed. All-users startup items stay unchanged.";
        }
    }
}
