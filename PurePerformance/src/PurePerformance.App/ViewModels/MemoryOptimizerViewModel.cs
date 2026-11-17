using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class MemoryOptimizerViewModel : ObservableObject
{
    private readonly IMemoryOptimizerService _memory;

    public MemoryOptimizerViewModel(IMemoryOptimizerService memory)
    {
        _memory = memory;
    }

    [ObservableProperty]
    private bool isBusy;

    [ObservableProperty]
    private string totalLabel = "—";

    [ObservableProperty]
    private string inUseLabel = "—";

    [ObservableProperty]
    private string availableLabel = "—";

    [ObservableProperty]
    private double inUsePercent;

    [ObservableProperty]
    private string statusMessage =
        "EmptyWorkingSet trims each process’s working set. Windows may reload pages when you use those apps again — this is not “extra free RAM forever.”";

    [ObservableProperty]
    private string? lastResult;

    [ObservableProperty]
    private string? errorMessage;

    [RelayCommand]
    private async Task RefreshAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        ErrorMessage = null;

        try
        {
            var snap = await _memory.GetSnapshotAsync();
            Apply(snap);
            StatusMessage = "Memory snapshot updated.";
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task OptimizeAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        ErrorMessage = null;
        LastResult = null;
        StatusMessage = "Trimming working sets (EmptyWorkingSet)…";

        try
        {
            var result = await _memory.OptimizeAsync();
            Apply(result.After);
            LastResult = result.Summary;
            StatusMessage = "Optimize complete.";
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
            StatusMessage = "Optimize failed.";
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void Apply(MemoryInfo info)
    {
        TotalLabel = info.TotalLabel;
        InUseLabel = info.InUseLabel;
        AvailableLabel = info.AvailableLabel;
        InUsePercent = info.InUsePercent;
    }
}
