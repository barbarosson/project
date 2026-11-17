using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class AutoOptimizationViewModel : ObservableObject
{
    private readonly IAutoOptimizationService _auto;

    public AutoOptimizationViewModel(IAutoOptimizationService auto)
    {
        _auto = auto;
        Reload();
    }

    public ObservableCollection<AutoOptimizationRule> Rules { get; } = new();

    [ObservableProperty]
    private string statusMessage = "Conditional suggestions for Cleaner / Startup / Memory. Auto-apply is off by default.";

    [ObservableProperty]
    private bool isBusy;

    public bool CanRun => !IsBusy;

    [RelayCommand]
    private void AddRule()
    {
        Rules.Add(_auto.AddDefaultRule());
        StatusMessage = "Added a sample rule. Edit thresholds carefully; auto-apply only runs non-admin Cleaner targets.";
    }

    [RelayCommand]
    private void Save()
    {
        _auto.SaveRules(Rules);
        StatusMessage = "Rules saved.";
    }

    [RelayCommand]
    private void Remove(AutoOptimizationRule? rule)
    {
        if (rule is null) return;
        _auto.RemoveRule(rule.Id);
        Reload();
    }

    [RelayCommand]
    private async Task EvaluateAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            _auto.SaveRules(Rules);
            var messages = await _auto.EvaluateAsync();
            Reload();
            StatusMessage = messages.Count == 0
                ? "No rules matched."
                : string.Join(" · ", messages);
        }
        catch (Exception ex)
        {
            StatusMessage = $"Evaluate failed: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
            OnPropertyChanged(nameof(CanRun));
        }
    }

    private void Reload()
    {
        Rules.Clear();
        foreach (var r in _auto.GetRules())
        {
            Rules.Add(r);
        }
    }
}
