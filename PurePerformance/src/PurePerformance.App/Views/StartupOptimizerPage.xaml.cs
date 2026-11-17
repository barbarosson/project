using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class StartupOptimizerPage : Page
{
    public StartupOptimizerViewModel ViewModel { get; private set; } = null!;

    public StartupOptimizerPage()
    {
        InitializeComponent();
    }

    public void SetViewModel(StartupOptimizerViewModel viewModel)
    {
        ViewModel = viewModel;
        Bindings.Update();
    }
}
