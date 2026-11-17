using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PurePerformance.Models;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class RuleEnginePage : Page
{
    public RuleEngineViewModel ViewModel { get; private set; } = null!;
    public RuleEnginePage() => InitializeComponent();
    public void SetViewModel(RuleEngineViewModel vm) { ViewModel = vm; Bindings.Update(); }

    private void Remove_Click(object sender, RoutedEventArgs e)
    {
        if (RulesList.SelectedItem is WhitelistRule rule)
            ViewModel.RemoveCommand.Execute(rule);
    }
}
