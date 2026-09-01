using System;
using System.Windows;
using Forms = System.Windows.Forms;
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
    private readonly TrayIconFactory _icons = new();
    private readonly Forms.NotifyIcon _notifyIcon;
    private readonly Forms.ToolStripMenuItem _toggleItem;

    private bool _disposed;

    public TrayIconHost(MainWindow window, MainViewModel viewModel, IStreamController controller)
    {
        _window = window ?? throw new ArgumentNullException(nameof(window));
        _viewModel = viewModel ?? throw new ArgumentNullException(nameof(viewModel));
        _controller = controller ?? throw new ArgumentNullException(nameof(controller));

        _toggleItem = new Forms.ToolStripMenuItem("Bağlan", null, (_, _) => Toggle());

        var menu = new Forms.ContextMenuStrip();
        menu.Items.Add(new Forms.ToolStripMenuItem("Pencereyi Göster", null, (_, _) => ShowWindow()));
        menu.Items.Add(_toggleItem);
        menu.Items.Add(new Forms.ToolStripSeparator());
        menu.Items.Add(new Forms.ToolStripMenuItem("Çıkış", null, (_, _) => Exit()));

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
        _toggleItem.Text = state == StreamState.Streaming ? "Bağlantıyı Kes" : "Bağlan";

        var device = _controller.ConnectedDevice?.Name;
        var caption = state switch
        {
            StreamState.Streaming when device is not null => $"Yayında — {device}",
            StreamState.Streaming => "Yayında",
            StreamState.Connecting => "Bağlanıyor...",
            StreamState.Scanning => "Ağ taranıyor...",
            StreamState.Stopping => "Durduruluyor...",
            StreamState.Faulted => "Hata",
            _ => "Bağlı değil",
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
