using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PurePerformance.Models;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class AutoOptimizationPage : Page
{
    public AutoOptimizationViewModel ViewModel { get; private set; } = null!;

    public AutoOptimizationPage() => InitializeComponent();

    public void SetViewModel(AutoOptimizationViewModel vm)
    {
        ViewModel = vm;
        Bindings.Update();
    }

    private void RemoveSelected_Click(object sender, RoutedEventArgs e)
    {
        if (RulesList.SelectedItem is AutoOptimizationRule rule)
        {
            ViewModel.RemoveCommand.Execute(rule);
        }
    }
}
