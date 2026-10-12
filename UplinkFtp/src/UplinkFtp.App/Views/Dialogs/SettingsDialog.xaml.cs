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
        // Reinforce after XAML load so unpackaged runs use a wider dialog than the ~548px default.
        Resources["ContentDialogMinWidth"] = 560.0;
        Resources["ContentDialogMaxWidth"] = 640.0;
    }

    private void AiKeyBox_PasswordChanged(object sender, RoutedEventArgs e)
    {
        ViewModel.AiApiKeyInput = AiKeyBox.Password;
    }

    /// <summary>
    /// ScrollViewer + StackPanel measures children with infinite width unless the panel
    /// MaxWidth is pinned to the viewport — otherwise TextWrapping never kicks in and captions clip.
    /// </summary>
    private void SettingsScroll_SizeChanged(object sender, SizeChangedEventArgs e)
    {
        if (e.NewSize.Width <= 0)
        {
            return;
        }

        // Leave a small gutter for the vertical scrollbar thumb.
        var width = Math.Max(280, e.NewSize.Width - 8);
        SettingsPanel.Width = width;
        SettingsPanel.MaxWidth = width;
    }
}
