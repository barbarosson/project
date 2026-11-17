using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Helpers;
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

    private async Task LoadEntriesAsync()
    {
        ErrorMessage = null;
        StatusMessage = "Reading startup entries…";
        Entries.Clear();

        try
        {
            var list = await _startup.GetStartupEntriesAsync();
            foreach (var e in list.OrderBy(x => x.LocationLabel).ThenBy(x => x.Name))
            {
                Entries.Add(new StartupEntryItem(e));
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

    [RelayCommand]
    private async Task SetEnabledAsync(StartupEntryItem? item)
    {
        if (item is null || IsBusy) return;

        var desired = !item.IsEnabled;
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

            StatusMessage = result.Message;
            await LoadEntriesAsync();
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
