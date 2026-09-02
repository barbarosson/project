using System;
using System.Windows;
using Forms = System.Windows.Forms;
using WinAirPlay.App.Localization;
using WinAirPlay.App.Services;
using WinAirPlay.App.ViewModels;
using WinAirPlay.App.Views;

namespace WinAirPlay.App.Tray;

/// <summary>
/// Keeps the app alive in the notification area: the window only hides when closed, and the tray
/// menu can connect, disconnect and quit without ever showing it.
/// </summary>
public sealed class TrayIconHost : IDisposable
{
    private readonly MainWindow _window;
    private readonly MainViewModel _viewModel;
    private readonly IStreamController _controller;
    private readonly ILocalizationService _localization;
    private readonly TrayIconFactory _icons = new();
    private readonly Forms.NotifyIcon _notifyIcon;
    private readonly Forms.ToolStripMenuItem _showWindowItem;
    private readonly Forms.ToolStripMenuItem _toggleItem;
    private readonly Forms.ToolStripMenuItem _exitItem;

    private bool _disposed;

    public TrayIconHost(
        MainWindow window,
        MainViewModel viewModel,
        IStreamController controller,
        ILocalizationService localization)
    {
        _window = window ?? throw new ArgumentNullException(nameof(window));
        _viewModel = viewModel ?? throw new ArgumentNullException(nameof(viewModel));
        _controller = controller ?? throw new ArgumentNullException(nameof(controller));
        _localization = localization ?? throw new ArgumentNullException(nameof(localization));

        _showWindowItem = new Forms.ToolStripMenuItem(string.Empty, null, (_, _) => ShowWindow());
        _toggleItem = new Forms.ToolStripMenuItem(string.Empty, null, (_, _) => Toggle());
        _exitItem = new Forms.ToolStripMenuItem(string.Empty, null, (_, _) => Exit());

        var menu = new Forms.ContextMenuStrip();
        menu.Items.Add(_showWindowItem);
        menu.Items.Add(_toggleItem);
        menu.Items.Add(new Forms.ToolStripSeparator());
        menu.Items.Add(_exitItem);

        _notifyIcon = new Forms.NotifyIcon
        {
            Icon = _icons.Get(StreamState.Idle),
            Text = "WinAirPlay",
            Visible = true,
            ContextMenuStrip = menu,
        };

        _notifyIcon.DoubleClick += (_, _) => ShowWindow();
        _window.Icon = _icons.GetImageSource(StreamState.Idle);

        _controller.StateChanged += OnStateChanged;
        Refresh(_controller.State);
    }

    public void ShowWindow()
    {
        _window.Show();
        _window.WindowState = WindowState.Normal;
        _window.Activate();
    }

    private void Toggle() => _ = _viewModel.ToggleConnectionCommand.ExecuteAsync();

    private void Exit()
    {
        _window.AllowClose = true;
        Application.Current.Shutdown();
    }

    private void OnStateChanged(object? sender, StreamState state) =>
        _window.Dispatcher.BeginInvoke(() => Refresh(state));

    private void Refresh(StreamState state)
    {
        if (_disposed)
        {
            return;
        }

        _notifyIcon.Icon = _icons.Get(state);
        _showWindowItem.Text = _localization.Get(LocKeys.TrayShowWindow);
        _toggleItem.Text = state == StreamState.Streaming
            ? _localization.Get(LocKeys.Disconnect)
            : _localization.Get(LocKeys.Connect);
        _exitItem.Text = _localization.Get(LocKeys.TrayExit);

        var device = _controller.ConnectedDevice?.Name;
        var caption = state switch
        {
            StreamState.Streaming when device is not null =>
                _localization.Format(LocKeys.TrayStreamingWithDevice, device),
            StreamState.Streaming => _localization.Get(LocKeys.TrayStreaming),
            StreamState.Connecting => _localization.Get(LocKeys.TrayConnecting),
            StreamState.Scanning => _localization.Get(LocKeys.TrayScanning),
            StreamState.Stopping => _localization.Get(LocKeys.TrayStopping),
            StreamState.Faulted => _localization.Get(LocKeys.TrayFaulted),
            _ => _localization.Get(LocKeys.TrayNotConnected),
        };

        // The tray tooltip is capped at 63 characters; a long device name would throw otherwise.
        _notifyIcon.Text = Truncate($"WinAirPlay · {caption}", 63);
    }

    internal static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..(maxLength - 1)] + "…";

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _controller.StateChanged -= OnStateChanged;
        _notifyIcon.Visible = false;
        _notifyIcon.Dispose();
        _icons.Dispose();
    }
}
