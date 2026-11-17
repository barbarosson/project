using Microsoft.UI.Xaml;
using PurePerformance.ViewModels;

namespace PurePerformance;

public partial class App : Application
{
    private Window? _window;

    public App()
    {
        InitializeComponent();
        UnhandledException += OnUnhandledException;
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var viewModel = MainViewModel.CreateDefault();
        _window = new MainWindow(viewModel);
        _window.Activate();
    }

    private void OnUnhandledException(object sender, Microsoft.UI.Xaml.UnhandledExceptionEventArgs e)
    {
        // Keep the process alive for non-fatal UI issues; log path can be added later.
        System.Diagnostics.Debug.WriteLine($"Unhandled: {e.Exception}");
        e.Handled = true;
    }
}
