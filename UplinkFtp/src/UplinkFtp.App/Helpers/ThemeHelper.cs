using System;
using Microsoft.UI.Xaml;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.Helpers;

/// <summary>Applies a named ThemeCatalog profile to the WinUI shell root.</summary>
public static class ThemeHelper
{
    private static ResourceDictionary? _paletteCatalog;
    private static ResourceDictionary? _activePaletteMerge;

    public static void ApplyFromSettings(AppSettings settings, FrameworkElement? root = null)
        => Apply(settings.Theme, root);

    public static void Apply(string? themeName, FrameworkElement? root = null)
    {
        if (root is null)
        {
            return;
        }

        var profile = ThemeCatalog.Resolve(themeName);
        root.RequestedTheme = profile.ElementTheme;
        ApplyPaletteOverlay(root, profile.PaletteKey);
    }

    public static ElementTheme Parse(string? themeName)
        => ThemeCatalog.Resolve(themeName).ElementTheme;

    private static void ApplyPaletteOverlay(FrameworkElement root, string? paletteKey)
    {
        if (_activePaletteMerge is not null)
        {
            root.Resources.MergedDictionaries.Remove(_activePaletteMerge);
            _activePaletteMerge = null;
        }

        if (string.IsNullOrWhiteSpace(paletteKey))
        {
            return;
        }

        _paletteCatalog ??= LoadPaletteCatalog();
        if (_paletteCatalog is null)
        {
            return;
        }

        if (!_paletteCatalog.TryGetValue(paletteKey, out var entry) || entry is not ResourceDictionary palette)
        {
            return;
        }

        // Clone via a thin wrapper merge so we can remove this instance later.
        var merge = new ResourceDictionary();
        foreach (var key in palette.Keys)
        {
            merge[key] = palette[key];
        }

        root.Resources.MergedDictionaries.Add(merge);
        _activePaletteMerge = merge;
    }

    private static ResourceDictionary? LoadPaletteCatalog()
    {
        try
        {
            return new ResourceDictionary
            {
                Source = new Uri("ms-appx:///Themes/ThemePalettes.xaml")
            };
        }
        catch
        {
            return null;
        }
    }
}
