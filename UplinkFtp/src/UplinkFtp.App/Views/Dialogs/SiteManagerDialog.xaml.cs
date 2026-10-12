using UplinkFtp.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace UplinkFtp.Views.Dialogs;

public sealed partial class SiteManagerDialog : ContentDialog
{
    public SiteManagerViewModel ViewModel { get; }

    public SiteManagerDialog(SiteManagerViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = viewModel;
        InitializeComponent();
        viewModel.PropertyChanged += OnViewModelPropertyChanged;
    }

    private void OnViewModelPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(SiteManagerViewModel.Password) or nameof(SiteManagerViewModel.SelectedSite))
        {
            if (SitePasswordBox.Password != ViewModel.Password)
            {
                SitePasswordBox.Password = ViewModel.Password ?? string.Empty;
            }
        }
    }

    private void SitePasswordBox_PasswordChanged(object sender, RoutedEventArgs e)
    {
        ViewModel.Password = SitePasswordBox.Password;
    }

    private void SitesList_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        // SelectedSite TwoWay binding drives the form; no extra work needed.
    }
}
