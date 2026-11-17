using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class AdvancedCrashViewModel : ObservableObject
{
    private readonly IAdvancedCrashService _advanced;

    public AdvancedCrashViewModel(IAdvancedCrashService advanced)
    {
        _advanced = advanced;
    }

    public ObservableCollection<CrashTrendBucket> Trends { get; } = new();

    public ObservableCollection<CrashCorrelationGroup> Correlations { get; } = new();

    [ObservableProperty]
    private bool isBusy;

    [ObservableProperty]
    private string statusMessage = "Analyze correlations and trends, then export a local Markdown report.";

    [ObservableProperty]
    private string exportPath = string.Empty;

    public bool CanRun => !IsBusy;

    [RelayCommand]
    private async Task AnalyzeAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            StatusMessage = "Building trends and correlations…";
            Trends.Clear();
            Correlations.Clear();
            foreach (var t in await _advanced.GetTrendsAsync(CrashLookback.Hours72))
            {
                Trends.Add(t);
            }

            foreach (var c in await _advanced.GetCorrelationsAsync(CrashLookback.Hours72))
            {
                Correlations.Add(c);
            }

            StatusMessage = $"Done — {Trends.Count} trend bucket(s), {Correlations.Count} correlation group(s).";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Analyze failed: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
            OnPropertyChanged(nameof(CanRun));
        }
    }

    [RelayCommand]
    private async Task ExportAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            ExportPath = await _advanced.ExportReportAsync(CrashLookback.Hours72);
            StatusMessage = $"Exported local report: {ExportPath}";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Export failed: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
            OnPropertyChanged(nameof(CanRun));
        }
    }
}
