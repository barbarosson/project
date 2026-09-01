using System;
using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;
using WinAirPlay.App.Services;

namespace WinAirPlay.App.Views;

/// <summary>Paints the status dot: grey when idle, amber while working, green on air, red on error.</summary>
public sealed class StateToBrushConverter : IValueConverter
{
    private static readonly SolidColorBrush Idle = Frozen(0xFF8B93A3);
    private static readonly SolidColorBrush Busy = Frozen(0xFFF2B33D);
    private static readonly SolidColorBrush Live = Frozen(0xFF3DD68C);
    private static readonly SolidColorBrush Fault = Frozen(0xFFF2555A);

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) => value switch
    {
        StreamState.Streaming => Live,
        StreamState.Faulted => Fault,
        StreamState.Scanning or StreamState.Connecting or StreamState.Stopping => Busy,
        _ => Idle,
    };

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();

    private static SolidColorBrush Frozen(uint argb)
    {
        var brush = new SolidColorBrush(Color.FromArgb(
            (byte)(argb >> 24), (byte)(argb >> 16), (byte)(argb >> 8), (byte)argb));

        brush.Freeze();
        return brush;
    }
}

public sealed class InverseBooleanConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is not true;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is not true;
}
