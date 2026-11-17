using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class ProUnlockPage : Page
{
    public ProUnlockViewModel ViewModel { get; private set; } = null!;

    public ProUnlockPage()
    {
        InitializeComponent();
    }

    public void SetViewModel(ProUnlockViewModel viewModel, string featureName)
    {
        if (ViewModel is not null)
        {
            ViewModel.PropertyChanged -= OnPropertyChanged;
        }

        ViewModel = viewModel;
        viewModel.SetFeature(featureName);
        viewModel.PropertyChanged += OnPropertyChanged;
        Bindings.Update();
        DevBypassBar.IsOpen = viewModel.IsUsingDevBypass;
    }

    private void OnPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(ProUnlockViewModel.IsUsingDevBypass) or null)
        {
            DevBypassBar.IsOpen = ViewModel.IsUsingDevBypass;
        }
    }
}
