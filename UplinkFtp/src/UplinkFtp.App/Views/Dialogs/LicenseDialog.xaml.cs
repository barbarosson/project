using UplinkFtp.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace UplinkFtp.Views.Dialogs;

public sealed partial class LicenseDialog : ContentDialog
{
    public LicenseViewModel ViewModel { get; }

    public LicenseDialog(LicenseViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = viewModel;
        InitializeComponent();
        UpdateWebPanelVisibility();
        viewModel.PropertyChanged += (_, e) =>
        {
            if (e.PropertyName is nameof(LicenseViewModel.IsWebChannel))
            {
                UpdateWebPanelVisibility();
            }
        };
    }

    private void UpdateWebPanelVisibility()
    {
        WebKeyPanel.Visibility = ViewModel.IsWebChannel ? Visibility.Visible : Visibility.Collapsed;
    }
}
