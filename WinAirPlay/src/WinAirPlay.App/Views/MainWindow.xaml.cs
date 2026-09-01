using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Threading;
using WinAirPlay.App.ViewModels;

namespace WinAirPlay.App.Views;

public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;
    private readonly DispatcherTimer _statisticsTimer;

    public MainWindow(MainViewModel viewModel)
    {
        _viewModel = viewModel ?? throw new ArgumentNullException(nameof(viewModel));

        InitializeComponent();
        DataContext = viewModel;

        _statisticsTimer = new DispatcherTimer(DispatcherPriority.Background)
        {
            Interval = TimeSpan.FromMilliseconds(150),
        };

        _statisticsTimer.Tick += (_, _) => _viewModel.RefreshStatistics();

        SourceInitialized += (_, _) => ApplyDarkTitleBar();
        Loaded += OnLoaded;
        Closing += OnClosing;
    }

    /// <summary>
    /// Without this the window keeps the light system chrome above a dark client area. Unsupported
    /// on older Windows 10 builds, where the call simply fails and the default chrome stays.
    /// </summary>
    private void ApplyDarkTitleBar()
    {
        const int UseImmersiveDarkMode = 20;

        var handle = new WindowInteropHelper(this).Handle;
        var enabled = 1;

        DwmSetWindowAttribute(handle, UseImmersiveDarkMode, ref enabled, sizeof(int));
    }

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr window, int attribute, ref int value, int size);

    /// <summary>Set by the tray host so closing the window hides it instead of ending the session.</summary>
    public bool AllowClose { get; set; }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        _statisticsTimer.Start();
        await _viewModel.InitializeAsync();
    }

    private void OnClosing(object? sender, CancelEventArgs e)
    {
        if (AllowClose)
        {
            _statisticsTimer.Stop();
            return;
        }

        e.Cancel = true;
        Hide();
    }
}
