using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class DashboardPage : Page
{
    public DashboardViewModel ViewModel { get; private set; } = null!;

    public DashboardPage()
    {
        InitializeComponent();
    }

    public void SetViewModel(DashboardViewModel viewModel)
    {
        ViewModel = viewModel;
        Bindings.Update();
    }
}
