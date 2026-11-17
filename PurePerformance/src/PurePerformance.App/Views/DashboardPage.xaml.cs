using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Navigation;
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

    protected override void OnNavigatedFrom(NavigationEventArgs e)
    {
        // Keep monitoring if user wants; only stop when window closes via MainWindow if needed.
        base.OnNavigatedFrom(e);
    }
}
