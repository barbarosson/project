using System;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using WinAirPlay.App.Branding;
using WinAirPlay.App.Localization;
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
    private ILocalizationService? _localization;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        DispatcherUnhandledException += OnDispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += OnDomainUnhandledException;
        AppDomain.CurrentDomain.ProcessExit += OnProcessExit;
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;
        SessionEnding += OnSessionEnding;

        var settingsStore = new JsonSettingsStore();
        var settings = settingsStore.Load();

        _localization = new LocalizationService { Language = settings.Language };

        var splash = new SplashWindow(_localization);
        splash.Show();

        _controller = new StreamController(new ZeroconfAirPlayDiscovery(), _localization);

        var viewModel = new MainViewModel(
            _controller,
            settingsStore,
            new WasapiDeviceEnumerator(),
            new WpfDispatcher(Dispatcher),
            _localization);

        _window = new MainWindow(viewModel);
        _window.Icon = AppBranding.GetLogo(32);
        _tray = new TrayIconHost(_window, viewModel, _controller, _localization);

        Dispatcher.InvokeAsync(async () =>
        {
            try
            {
                await viewModel.InitializeAsync().ConfigureAwait(true);
            }
            finally
            {
                splash.Close();

                if (settings.StartMinimized)
                {
                    _window.Show();
                    _window.Hide();
                }
                else
                {
                    _tray.ShowWindow();
                }
            }
        });
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _tray?.Dispose();

        if (_controller is { } controller)
        {
            // Unmute immediately so a slow RTSP teardown cannot leave the PC silent.
            controller.RestoreLocalSpeakers();

            try
            {
                Task.Run(async () => await controller.DisposeAsync().ConfigureAwait(false))
                    .Wait(TimeSpan.FromSeconds(3));
            }
            catch (Exception)
            {
                controller.RestoreLocalSpeakers();
            }
        }

        base.OnExit(e);
    }

    private void OnSessionEnding(object sender, SessionEndingCancelEventArgs e) =>
        RestoreSpeakersSafely();

    private void OnProcessExit(object? sender, EventArgs e) =>
        RestoreSpeakersSafely();

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        RestoreSpeakersSafely();
        var log = WriteCrashLog(e.Exception);
        var localization = _localization ?? new LocalizationService();

        MessageBox.Show(
            localization.Format(LocKeys.CrashDetails, e.Exception.Message, log),
            localization.Get(LocKeys.CrashTitle),
            MessageBoxButton.OK,
            MessageBoxImage.Error);

        e.Handled = true;
    }

    private void OnDomainUnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        RestoreSpeakersSafely();

        if (e.ExceptionObject is Exception exception)
        {
            WriteCrashLog(exception);
        }
    }

    private void OnUnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
    {
        RestoreSpeakersSafely();
        WriteCrashLog(e.Exception);
        e.SetObserved();
    }

    private void RestoreSpeakersSafely()
    {
        try
        {
            _controller?.RestoreLocalSpeakers();
        }
        catch (Exception)
        {
            // Never let unmute failures replace the original crash.
        }
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
