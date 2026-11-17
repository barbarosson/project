using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Helpers;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class SystemCleanerViewModel : ObservableObject
{
    private readonly ISystemCleanerService _cleaner;

    public SystemCleanerViewModel(ISystemCleanerService cleaner)
    {
        _cleaner = cleaner;
        IsElevated = ElevationHelper.IsRunningElevated();
    }

    public ObservableCollection<CleanupTargetItem> Targets { get; } = new();

    [ObservableProperty]
    private bool isBusy;

    [ObservableProperty]
    private bool isElevated;

    [ObservableProperty]
    private string statusMessage =
        "Select named folders to clean. Pure Performance is not a registry cleaner and will not delete registry values.";

    [ObservableProperty]
    private string? resultDetails;

    [ObservableProperty]
    private string? errorMessage;

    [RelayCommand]
    private async Task RefreshAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            await LoadTargetsAsync();
        }
        finally
        {
            IsBusy = false;
            IsElevated = ElevationHelper.IsRunningElevated();
        }
    }

    private async Task LoadTargetsAsync()
    {
        ErrorMessage = null;
        StatusMessage = "Measuring cleanup targets…";
        Targets.Clear();

        try
        {
            var list = await _cleaner.GetSafeCleanupTargetsAsync();
            foreach (var t in list)
            {
                Targets.Add(new CleanupTargetItem(t));
            }

            var total = list.Sum(t => t.EstimatedBytes);
            StatusMessage = $"Ready — about {CleanupTarget.FormatBytes(total)} across {list.Count} target(s).";
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
            StatusMessage = "Could not list cleanup targets.";
        }
    }

    [RelayCommand]
    private async Task CleanAsync()
    {
        if (IsBusy) return;
        var selected = Targets.Where(t => t.IsSelected).Select(t => t.Id).ToList();
        if (selected.Count == 0)
        {
            StatusMessage = "Select at least one target.";
            return;
        }

        IsBusy = true;
        ErrorMessage = null;
        ResultDetails = null;
        StatusMessage = "Cleaning selected folders…";

        var progress = new Progress<string>(msg => StatusMessage = msg);

        try
        {
            var result = await _cleaner.CleanAsync(selected, progress);
            StatusMessage =
                $"Removed {CleanupTarget.FormatBytes(result.BytesRemoved)} " +
                $"({result.FilesRemoved} file(s); {result.FilesSkipped} skipped/locked).";
            ResultDetails = string.Join(Environment.NewLine, result.Notes);
            await LoadTargetsAsync();
        }
        catch (UnauthorizedAccessException ex)
        {
            ErrorMessage = $"Permission denied: {ex.Message}. Relaunch as admin for Windows Temp / Prefetch.";
            StatusMessage = "Clean incomplete.";
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
            StatusMessage = "Clean failed.";
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

        if (!ElevationHelper.TryRelaunchElevated())
        {
            StatusMessage = "UAC cancelled — Windows Temp / Prefetch may stay skipped.";
        }
        else
        {
            StatusMessage = "Approve UAC to relaunch elevated, then close this window.";
        }
    }
}
