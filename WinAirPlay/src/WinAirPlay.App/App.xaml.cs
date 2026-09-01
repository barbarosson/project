using System;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using WinAirPlay.App.Services;
using WinAirPlay.App.Tray;
using WinAirPlay.App.ViewModels;
using WinAirPlay.App.Views;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Discovery;

namespace WinAirPlay.App;

public partial class App : Application
{
    private StreamController? _controller;
    private TrayIconHost? _tray;
    private MainWindow? _window;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        DispatcherUnhandledException += OnDispatcherUnhandledException;

        var settingsStore = new JsonSettingsStore();
        var settings = settingsStore.Load();

        _controller = new StreamController(new ZeroconfAirPlayDiscovery());

        var viewModel = new MainViewModel(
            _controller,
            settingsStore,
            new WasapiDeviceEnumerator(),
            new WpfDispatcher(Dispatcher));

        _window = new MainWindow(viewModel);
        _tray = new TrayIconHost(_window, viewModel, _controller);

        if (settings.StartMinimized)
        {
            // Loaded still fires for a hidden window, so discovery starts either way.
            _window.Show();
            _window.Hide();
        }
        else
        {
            _tray.ShowWindow();
        }
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _tray?.Dispose();

        if (_controller is { } controller)
        {
            // The receiver deserves a TEARDOWN, but a hung socket must not block shutdown.
            Task.Run(async () => await controller.DisposeAsync()).Wait(TimeSpan.FromSeconds(3));
        }

        base.OnExit(e);
    }

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        var log = WriteCrashLog(e.Exception);

        MessageBox.Show(
            $"{e.Exception.Message}\n\nAyrıntılar: {log}",
            "WinAirPlay — beklenmeyen hata",
            MessageBoxButton.OK,
            MessageBoxImage.Error);

        e.Handled = true;
    }

    /// <summary>Appends the full exception to a log next to the settings file, and returns its path.</summary>
    private static string WriteCrashLog(Exception exception)
    {
        var path = System.IO.Path.Combine(
            System.IO.Path.GetDirectoryName(JsonSettingsStore.DefaultPath())!,
            "error.log");

        try
        {
            System.IO.Directory.CreateDirectory(System.IO.Path.GetDirectoryName(path)!);
            System.IO.File.AppendAllText(path, $"{DateTime.Now:u}\n{exception}\n\n");
        }
        catch (Exception)
        {
            // Nothing useful left to do if even logging fails.
        }

        return path;
    }
}
