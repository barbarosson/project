using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class RuleEngineViewModel : ObservableObject
{
    private readonly IRuleEngineService _rules;

    public RuleEngineViewModel(IRuleEngineService rules)
    {
        _rules = rules;
        Reload();
    }

    public ObservableCollection<WhitelistRule> Rules { get; } = new();

    [ObservableProperty]
    private string pattern = string.Empty;

    [ObservableProperty]
    private string notes = string.Empty;

    [ObservableProperty]
    private bool scopeCleaner = true;

    [ObservableProperty]
    private bool scopeStartup;

    [ObservableProperty]
    private bool scopeBoth;

    [ObservableProperty]
    private string statusMessage = "Whitelist patterns protect Cleaner paths and Startup names/commands (contains match).";

    [RelayCommand]
    private void Add()
    {
        if (string.IsNullOrWhiteSpace(Pattern))
        {
            StatusMessage = "Enter a pattern (path fragment, process name, etc.).";
            return;
        }

        var scope = ScopeBoth ? WhitelistScope.Both
            : ScopeStartup ? WhitelistScope.Startup
            : WhitelistScope.Cleaner;
        _rules.AddRule(Pattern, scope, Notes);
        Pattern = string.Empty;
        Notes = string.Empty;
        Reload();
        StatusMessage = "Rule added.";
    }

    [RelayCommand]
    private void Remove(WhitelistRule? rule)
    {
        if (rule is null) return;
        _rules.RemoveRule(rule.Id);
        Reload();
        StatusMessage = "Rule removed.";
    }

    [RelayCommand]
    private void Save()
    {
        _rules.SaveRules(Rules);
        StatusMessage = "Whitelist saved.";
    }

    private void Reload()
    {
        Rules.Clear();
        foreach (var r in _rules.GetRules())
        {
            Rules.Add(r);
        }
    }
}
