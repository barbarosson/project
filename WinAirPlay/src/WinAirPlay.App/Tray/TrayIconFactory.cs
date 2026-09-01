using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using WinAirPlay.App.Services;

namespace WinAirPlay.App.Tray;

/// <summary>
/// Draws the tray glyph at runtime — a speaker with broadcast arcs, tinted by connection state —
/// so the app ships without binary icon assets.
/// </summary>
public sealed class TrayIconFactory : IDisposable
{
    private const int Size = 32;

    private readonly Dictionary<StreamState, Icon> _cache = new();
    private bool _disposed;

    public Icon Get(StreamState state)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (_cache.TryGetValue(state, out var cached))
        {
            return cached;
        }

        var icon = Render(ColorFor(state), IsLive(state));
        _cache[state] = icon;
        return icon;
    }

    /// <summary>The same glyph as a WPF image, for the window's title bar and taskbar entry.</summary>
    public System.Windows.Media.ImageSource GetImageSource(StreamState state)
    {
        var source = System.Windows.Interop.Imaging.CreateBitmapSourceFromHIcon(
            Get(state).Handle,
            System.Windows.Int32Rect.Empty,
            System.Windows.Media.Imaging.BitmapSizeOptions.FromEmptyOptions());

        source.Freeze();
        return source;
    }

    private static bool IsLive(StreamState state) => state == StreamState.Streaming;

    private static Color ColorFor(StreamState state) => state switch
    {
        StreamState.Streaming => Color.FromArgb(0x3D, 0xD6, 0x8C),
        StreamState.Faulted => Color.FromArgb(0xF2, 0x55, 0x5A),
        StreamState.Scanning or StreamState.Connecting or StreamState.Stopping => Color.FromArgb(0xF2, 0xB3, 0x3D),
        _ => Color.FromArgb(0xC2, 0xC8, 0xD4),
    };

    private static Icon Render(Color tint, bool filledArcs)
    {
        using var bitmap = new Bitmap(Size, Size);
        using (var graphics = Graphics.FromImage(bitmap))
        {
            graphics.SmoothingMode = SmoothingMode.AntiAlias;
            graphics.Clear(Color.Transparent);

            using var body = new SolidBrush(tint);
            using var pen = new Pen(tint, 2.4f) { StartCap = LineCap.Round, EndCap = LineCap.Round };

            // Speaker: a small box on the left with a cone opening to the right.
            graphics.FillRectangle(body, 5, 12, 5, 8);
            graphics.FillPolygon(body, new[]
            {
                new PointF(10f, 12f),
                new PointF(16f, 6f),
                new PointF(16f, 26f),
                new PointF(10f, 20f),
            });

            // Two arcs stand for the wireless link; they fade out when nothing is streaming.
            using var quietPen = new Pen(Color.FromArgb(110, tint), 2.4f)
            {
                StartCap = LineCap.Round,
                EndCap = LineCap.Round,
            };

            var arcPen = filledArcs ? pen : quietPen;
            graphics.DrawArc(arcPen, 13, 10, 10, 12, -60, 120);
            graphics.DrawArc(arcPen, 12, 5, 17, 22, -55, 110);
        }

        var handle = bitmap.GetHicon();

        try
        {
            // Clone so the icon survives DestroyIcon and owns its own unmanaged handle.
            using var borrowed = Icon.FromHandle(handle);
            return (Icon)borrowed.Clone();
        }
        finally
        {
            DestroyIcon(handle);
        }
    }

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DestroyIcon(IntPtr handle);

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;

        foreach (var icon in _cache.Values)
        {
            icon.Dispose();
        }

        _cache.Clear();
    }
}
