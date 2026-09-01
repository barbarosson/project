using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using WinAirPlay.App.Services;
using DrawingColor = System.Drawing.Color;

namespace WinAirPlay.App.Branding;

/// <summary>Caches rendered logo bitmaps for the splash screen, window chrome and tray.</summary>
public static class AppBranding
{
    private static readonly object Gate = new();
    private static ImageSource? _defaultLogo;
    private static readonly Dictionary<StreamState, ImageSource> _stateLogos = new();

    public static ImageSource GetLogo(int size = 48, StreamState state = StreamState.Idle)
    {
        lock (Gate)
        {
            if (state == StreamState.Idle && size == 48 && _defaultLogo is not null)
            {
                return _defaultLogo;
            }

            if (_stateLogos.TryGetValue(state, out var cached) && size == 48)
            {
                return cached;
            }

            var accent = AccentFor(state);
            var wave = state == StreamState.Streaming ? AppLogoRenderer.DefaultWave : AccentFor(state);
            using var bitmap = AppLogoRenderer.Draw(size, accent, wave);
            var source = ToImageSource(bitmap);
            source.Freeze();

            if (size == 48)
            {
                if (state == StreamState.Idle)
                {
                    _defaultLogo = source;
                }
                else
                {
                    _stateLogos[state] = source;
                }
            }

            return source;
        }
    }

    public static Icon GetIcon(StreamState state = StreamState.Idle)
    {
        var accent = AccentFor(state);
        var wave = state == StreamState.Streaming ? AppLogoRenderer.DefaultWave : accent;

        using var bitmap = AppLogoRenderer.Draw(32, accent, wave);
        var handle = bitmap.GetHicon();

        try
        {
            using var borrowed = Icon.FromHandle(handle);
            return (Icon)borrowed.Clone();
        }
        finally
        {
            DestroyIcon(handle);
        }
    }

    private static DrawingColor AccentFor(StreamState state) => state switch
    {
        StreamState.Streaming => AppLogoRenderer.DefaultWave,
        StreamState.Faulted => DrawingColor.FromArgb(0xF2, 0x55, 0x5A),
        StreamState.Scanning or StreamState.Connecting or StreamState.Stopping =>
            DrawingColor.FromArgb(0xF2, 0xB3, 0x3D),
        _ => AppLogoRenderer.DefaultAccent,
    };

    private static ImageSource ToImageSource(Bitmap bitmap)
    {
        var handle = bitmap.GetHbitmap();

        try
        {
            return Imaging.CreateBitmapSourceFromHBitmap(
                handle,
                IntPtr.Zero,
                Int32Rect.Empty,
                BitmapSizeOptions.FromEmptyOptions());
        }
        finally
        {
            DeleteObject(handle);
        }
    }

    [DllImport("gdi32.dll")]
    private static extern bool DeleteObject(IntPtr hObject);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DestroyIcon(IntPtr handle);
}
