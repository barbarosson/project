using UplinkFtp.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace UplinkFtp.Views.Dialogs;

public sealed partial class SettingsDialog : ContentDialog
{
    public SettingsViewModel ViewModel { get; }

    public SettingsDialog(SettingsViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = viewModel;
        InitializeComponent();
    }

    private void AiKeyBox_PasswordChanged(object sender, RoutedEventArgs e)
    {
        ViewModel.AiApiKeyInput = AiKeyBox.Password;
    }
}
