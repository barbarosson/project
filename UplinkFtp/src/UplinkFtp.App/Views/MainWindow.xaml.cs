using UplinkFtp.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace UplinkFtp.Views;

/// <summary>Classic 4-panel shell: quick connect, log, local/remote browsers, queue placeholder.</summary>
public sealed partial class MainWindow : Window
{
    public MainViewModel ViewModel { get; }

    public MainWindow(MainViewModel viewModel)
    {
        ViewModel = viewModel;
        InitializeComponent();

        LogPanel.Bind(ViewModel.Log);
        LocalPanel.Bind(ViewModel.LocalBrowser, ViewModel);
        RemotePanel.Bind(ViewModel.RemoteBrowser, ViewModel);
        QueuePanel.Bind(ViewModel.TransferQueue);

        Activated += OnActivatedOnce;
    }

    private async void OnActivatedOnce(object sender, WindowActivatedEventArgs args)
    {
        Activated -= OnActivatedOnce;
        await ViewModel.InitializeAsync();
    }

    private void PasswordBox_PasswordChanged(object sender, RoutedEventArgs e)
    {
        ViewModel.Password = PasswordBox.Password;
    }
}
