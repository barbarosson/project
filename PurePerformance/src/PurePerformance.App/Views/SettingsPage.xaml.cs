using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class SettingsPage : Page
{
    public SettingsViewModel ViewModel { get; private set; } = null!;

    public SettingsPage()
    {
        InitializeComponent();
    }

    public void SetViewModel(SettingsViewModel viewModel)
    {
        if (ViewModel is not null)
        {
            ViewModel.PropertyChanged -= OnPropertyChanged;
        }

        ViewModel = viewModel;
        viewModel.PropertyChanged += OnPropertyChanged;
        Bindings.Update();
        SyncChrome();
    }

    private void OnPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(SettingsViewModel.IsUsingDevBypass)
            or nameof(SettingsViewModel.IsProLocked)
            or nameof(SettingsViewModel.ShowProAiSettings)
            or null)
        {
            SyncChrome();
        }
    }

    private void SyncChrome()
    {
        DevBypassBar.IsOpen = ViewModel.IsUsingDevBypass;
        UnlockButton.Visibility = ViewModel.IsProLocked
            ? Visibility.Visible
            : Visibility.Collapsed;
        ProAiPanel.Visibility = ViewModel.ShowProAiSettings
            ? Visibility.Visible
            : Visibility.Collapsed;
    }

    private void AiKeyBox_PasswordChanged(object sender, RoutedEventArgs e)
    {
        if (ViewModel is null) return;
        ViewModel.AiKeyInput = AiKeyBox.Password;
    }
}
