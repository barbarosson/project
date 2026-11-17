using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class ScheduledScansPage : Page
{
    public ScheduledScansViewModel ViewModel { get; private set; } = null!;

    public ScheduledScansPage() => InitializeComponent();

    public void SetViewModel(ScheduledScansViewModel vm)
    {
        ViewModel = vm;
        Bindings.Update();
    }
}
