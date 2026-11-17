using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class TutorialPage : Page
{
    public TutorialViewModel ViewModel { get; private set; } = null!;

    public TutorialPage()
    {
        InitializeComponent();
    }

    public void SetViewModel(TutorialViewModel viewModel)
    {
        ViewModel = viewModel;
        Bindings.Update();
    }
}
