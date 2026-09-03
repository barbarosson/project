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
            Interval = TimeSpan.FromMilliseconds(250),
        };

        _statisticsTimer.Tick += (_, _) => _viewModel.RefreshStatistics();

        SourceInitialized += (_, _) =>
        {
            ApplyDarkTitleBar();
            AttachTaskbarMinimizeHook();
        };
        Loaded += OnLoaded;
        Closing += OnClosing;
        StateChanged += OnStateChanged;
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

    private void AttachTaskbarMinimizeHook()
    {
        var hwnd = new WindowInteropHelper(this).EnsureHandle();
        EnableMinimizeBox(hwnd);
        HwndSource.FromHwnd(hwnd)?.AddHook(TaskbarWndProc);
    }

    /// <summary>
    /// WPF + WinForms NotifyIcon often swallows SC_MINIMIZE, so a click on the
    /// already-focused taskbar button leaves the window on screen. Handle it here.
    /// </summary>
    private IntPtr TaskbarWndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        const int WmSysCommand = 0x0112;
        const int ScMinimize = 0xF020;

        if (msg == WmSysCommand && (wParam.ToInt32() & 0xFFF0) == ScMinimize)
        {
            MinimizeOffScreen();
            handled = true;
        }

        return IntPtr.Zero;
    }

    private void OnStateChanged(object? sender, EventArgs e)
    {
        if (WindowState == WindowState.Minimized)
        {
            MinimizeOffScreen();
        }
    }

    private void MinimizeOffScreen()
    {
        if (WindowState != WindowState.Minimized)
        {
            WindowState = WindowState.Minimized;
        }

        ShowInTaskbar = true;
    }

    private static void EnableMinimizeBox(IntPtr hwnd)
    {
        const int GwlStyle = -16;
        const int WsMinimizeBox = 0x00020000;

        var style = GetWindowLongPtr(hwnd, GwlStyle);
        SetWindowLongPtr(hwnd, GwlStyle, style | (nint)WsMinimizeBox);
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern nint GetWindowLongPtr(IntPtr window, int index);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern nint SetWindowLongPtr(IntPtr window, int index, nint value);

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        _statisticsTimer.Start();
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
