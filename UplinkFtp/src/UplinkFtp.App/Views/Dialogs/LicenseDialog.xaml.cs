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
        UpdateChannelPanels();
        viewModel.PropertyChanged += (_, e) =>
        {
            if (e.PropertyName is nameof(LicenseViewModel.IsWebChannel)
                or nameof(LicenseViewModel.ShowBuyPro))
            {
                UpdateChannelPanels();
            }
        };
    }

    private void UpdateChannelPanels()
    {
        WebKeyPanel.Visibility = ViewModel.IsWebChannel ? Visibility.Visible : Visibility.Collapsed;
        BuyProButton.Visibility = ViewModel.ShowBuyPro ? Visibility.Visible : Visibility.Collapsed;
    }
}
