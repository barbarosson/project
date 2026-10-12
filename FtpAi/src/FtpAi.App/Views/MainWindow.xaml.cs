using FtpAi.ViewModels;
using Microsoft.UI.Xaml;

namespace FtpAi.Views;

/// <summary>
/// Shell window. Panels (local/remote browsers, queue) are added in later ADIMs.
/// </summary>
public sealed partial class MainWindow : Window
{
    public MainViewModel ViewModel { get; }

    public MainWindow(MainViewModel viewModel)
    {
        ViewModel = viewModel;
        InitializeComponent();
    }
}
