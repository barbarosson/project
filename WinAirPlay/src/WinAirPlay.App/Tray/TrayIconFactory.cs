using System;
using System.Collections.Generic;
using System.Drawing;
using WinAirPlay.App.Branding;
using WinAirPlay.App.Services;

namespace WinAirPlay.App.Tray;

/// <summary>
/// Supplies tray and window icons tinted by connection state.
/// </summary>
public sealed class TrayIconFactory : IDisposable
{
    private readonly Dictionary<StreamState, Icon> _cache = new();
    private bool _disposed;

    public Icon Get(StreamState state)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (_cache.TryGetValue(state, out var cached))
        {
            return cached;
        }

        var icon = AppBranding.GetIcon(state);
        _cache[state] = icon;
        return icon;
    }

    public System.Windows.Media.ImageSource GetImageSource(StreamState state) =>
        AppBranding.GetLogo(48, state);

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
