using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class AdvancedCrashPage : Page
{
    public AdvancedCrashViewModel ViewModel { get; private set; } = null!;
    public AdvancedCrashPage() => InitializeComponent();
    public void SetViewModel(AdvancedCrashViewModel vm) { ViewModel = vm; Bindings.Update(); }
}
