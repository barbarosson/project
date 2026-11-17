using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class SystemCleanerPage : Page
{
    public SystemCleanerViewModel ViewModel { get; private set; } = null!;

    public SystemCleanerPage()
    {
        InitializeComponent();
    }

    public void SetViewModel(SystemCleanerViewModel viewModel)
    {
        ViewModel = viewModel;
        Bindings.Update();
    }
}
