using System;
using System.Collections.Generic;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.Helpers;

/// <summary>
/// Applies a named ThemeCatalog profile app-wide.
/// Named palettes mutate the live brushes already resolved by ThemeResource
/// (Application.Current.Resources). Replacing brush identity left MainWindow on Orbit
/// while Settings (explicit Background) appeared to update alone.
/// </summary>
public static class ThemeHelper
{
    private static readonly string[] OverlayKeys =
    [
        "UplinkThemePaletteId",
        "UplinkSectionFillBrush",
        "UplinkSectionStrokeBrush",
        "UplinkAccentBrush",
        "UplinkAccentForegroundBrush",
        "UplinkAccentSoftBrush",
        "UplinkBrandBrush",
        "UplinkSignalBrush",
        "UplinkMutedTextBrush",
        "UplinkBodyTextBrush",
        "UplinkDividerBrush",
        "UplinkShellBackgroundBrush",
        "ScrollBarThumbFill",
        "ScrollBarThumbFillPointerOver",
        "ScrollBarThumbFillPressed",
        "ScrollBarThumbFillDisabled",
        "ScrollBarThumbBackground",
        "ScrollBarPanningThumbBackground",
        "ScrollBarTrackFill",
        "ScrollBarTrackFillPointerOver",
        "ScrollBarTrackFillDisabled",
        "ScrollBarTrackStroke",
        "ScrollBarTrackStrokePointerOver",
        "ScrollBarBackground",
        "ScrollBarBackgroundPointerOver",
        "ScrollBarBorderBrush",
        "ScrollBarBorderBrushPointerOver"
    ];

    private static ResourceDictionary? _paletteCatalog;
    /// <summary>Original Application.Resources entries for Orbit restore (null = key was absent).</summary>
    private static readonly Dictionary<string, object?> OrbitOriginals = new(StringComparer.Ordinal);
    /// <summary>App-level scrollbar brushes we own (ThemeDictionary entries must not be polluted).</summary>
    private static readonly Dictionary<string, Brush> AppScrollbarBrushes = new(StringComparer.Ordinal);
    private static bool _orbitSnapshotTaken;
    private static string? _activePaletteKey;

    /// <summary>Last applied profile (for ContentDialog RequestedTheme).</summary>
    public static ThemeProfile CurrentProfile { get; private set; } =
        ThemeCatalog.Resolve(ThemeCatalog.DefaultThemeName);

    public static void ApplyFromSettings(AppSettings settings, FrameworkElement? root = null)
        => Apply(settings.Theme, root);

    public static void Apply(string? themeName, FrameworkElement? root = null)
    {
        var profile = ThemeCatalog.Resolve(themeName);
        CurrentProfile = profile;

        ApplyPaletteToApplication(profile.PaletteKey);
        ApplyToShell(root, profile.ElementTheme);
    }

    /// <summary>
    /// Match dialog chrome to the active named theme (popup trees miss RootGrid merges).
    /// Brush keys live in Application.Current.Resources so live Settings preview stays in sync —
    /// do not copy palette brushes into dialog.Resources (that would shadow and go stale).
    /// </summary>
    public static void ApplyToDialog(ContentDialog dialog)
    {
        ArgumentNullException.ThrowIfNull(dialog);
        dialog.RequestedTheme = CurrentProfile.ElementTheme;
        if (GetBrush("UplinkShellBackgroundBrush") is Brush shell)
        {
            dialog.Background = shell;
        }
    }

    public static ElementTheme Parse(string? themeName)
        => ThemeCatalog.Resolve(themeName).ElementTheme;

    /// <summary>Brush from the active application palette (never a stale Orbit snapshot).</summary>
    public static Brush? GetBrush(string key)
    {
        if (Application.Current?.Resources.TryGetValue(key, out var value) == true
            && value is Brush brush)
        {
            return brush;
        }

        return null;
    }

    private static void ApplyToShell(FrameworkElement? root, ElementTheme theme)
    {
        if (root is null)
        {
            return;
        }

        // Bounce when ElementTheme is unchanged so ThemeDictionary-backed controls refresh
        // after app-level ScrollBar overrides are installed/removed.
        if (root.RequestedTheme == theme)
        {
            root.RequestedTheme = theme == ElementTheme.Dark ? ElementTheme.Light : ElementTheme.Dark;
        }

        root.RequestedTheme = theme;

        // ThemeResource can keep a stale Background local value after identity swaps; pin shell.
        if (root is Panel panel && GetBrush("UplinkShellBackgroundBrush") is Brush shell)
        {
            panel.Background = shell;
        }
    }

    private static void ApplyPaletteToApplication(string? paletteKey)
    {
        var resources = Application.Current?.Resources;
        if (resources is null)
        {
            return;
        }

        EnsureOrbitSnapshot(resources);

        if (string.IsNullOrWhiteSpace(paletteKey))
        {
            RestoreOrbit(resources);
            _activePaletteKey = null;
            return;
        }

        var palette = GetPalette(paletteKey);
        if (palette is null)
        {
            RestoreOrbit(resources);
            _activePaletteKey = null;
            return;
        }

        foreach (var key in OverlayKeys)
        {
            if (!palette.TryGetValue(key, out var entry) || entry is null)
            {
                continue;
            }

            AssignOverlay(resources, key, entry);
        }

        _activePaletteKey = paletteKey;
    }

    /// <summary>
    /// Mutate the live brush ThemeResource already holds. Never replace Uplink* brush
    /// identity — that left MainWindow on Orbit while Settings (explicit set) updated.
    /// ScrollBar keys live in ThemeDictionaries; install stable app-level brushes instead
    /// of mutating the themed instances (which would pollute Orbit Light/Dark).
    /// </summary>
    private static void AssignOverlay(ResourceDictionary resources, string key, object entry)
    {
        if (entry is string s)
        {
            resources[key] = s;
            return;
        }

        if (IsScrollbarKey(key))
        {
            AssignScrollbarOverlay(resources, key, entry);
            return;
        }

        if (resources.TryGetValue(key, out var current)
            && current is not null
            && TryCopyBrush(current, entry))
        {
            return;
        }

        resources[key] = CloneResource(entry);
    }

    private static void AssignScrollbarOverlay(ResourceDictionary resources, string key, object entry)
    {
        if (AppScrollbarBrushes.TryGetValue(key, out var live))
        {
            TryCopyBrush(live, entry);
            resources[key] = live;
            return;
        }

        var clone = CloneResource(entry);
        if (clone is Brush brush)
        {
            AppScrollbarBrushes[key] = brush;
            resources[key] = brush;
        }
        else
        {
            resources[key] = clone;
        }
    }

    private static bool TryCopyBrush(object target, object source)
    {
        if (target is SolidColorBrush targetSolid && source is SolidColorBrush sourceSolid)
        {
            targetSolid.Color = sourceSolid.Color;
            return true;
        }

        if (target is LinearGradientBrush targetGradient
            && source is LinearGradientBrush sourceGradient
            && targetGradient.GradientStops.Count == sourceGradient.GradientStops.Count)
        {
            targetGradient.StartPoint = sourceGradient.StartPoint;
            targetGradient.EndPoint = sourceGradient.EndPoint;
            for (var i = 0; i < targetGradient.GradientStops.Count; i++)
            {
                targetGradient.GradientStops[i].Color = sourceGradient.GradientStops[i].Color;
                targetGradient.GradientStops[i].Offset = sourceGradient.GradientStops[i].Offset;
            }

            return true;
        }

        return false;
    }

    private static void EnsureOrbitSnapshot(ResourceDictionary resources)
    {
        if (_orbitSnapshotTaken)
        {
            return;
        }

        foreach (var key in OverlayKeys)
        {
            // Keep live ThemeResource-backed brushes (do not clone) so Orbit can follow system again.
            OrbitOriginals[key] = resources.TryGetValue(key, out var value) ? value : null;
        }

        _orbitSnapshotTaken = true;
    }

    private static void RestoreOrbit(ResourceDictionary resources)
    {
        foreach (var key in OverlayKeys)
        {
            if (key == "UplinkThemePaletteId" || IsScrollbarKey(key))
            {
                // Drop app-level overrides so ThemeDictionaries / absence win again.
                resources.Remove(key);
                continue;
            }

            if (!OrbitOriginals.TryGetValue(key, out var original) || original is null)
            {
                resources.Remove(key);
                continue;
            }

            resources[key] = original;
            // Undo SolidColorBrush.Color / GradientStop.Color locals so ThemeResource expressions return.
            ClearBrushLocalColors(original);
        }

        AppScrollbarBrushes.Clear();
    }

    private static void ClearBrushLocalColors(object brush)
    {
        if (brush is SolidColorBrush solid)
        {
            solid.ClearValue(SolidColorBrush.ColorProperty);
            return;
        }

        if (brush is LinearGradientBrush gradient)
        {
            foreach (var stop in gradient.GradientStops)
            {
                stop.ClearValue(GradientStop.ColorProperty);
            }
        }
    }

    private static bool IsScrollbarKey(string key)
        => key.StartsWith("ScrollBar", StringComparison.Ordinal);

    private static ResourceDictionary? GetPalette(string paletteKey)
    {
        _paletteCatalog ??= LoadPaletteCatalog();
        if (_paletteCatalog is null)
        {
            return null;
        }

        return _paletteCatalog.TryGetValue(paletteKey, out var entry) && entry is ResourceDictionary palette
            ? palette
            : null;
    }

    private static object CloneResource(object value) => value switch
    {
        SolidColorBrush solid => new SolidColorBrush(solid.Color),
        LinearGradientBrush gradient => CloneGradient(gradient),
        string s => s,
        _ => value
    };

    private static LinearGradientBrush CloneGradient(LinearGradientBrush source)
    {
        var clone = new LinearGradientBrush
        {
            StartPoint = source.StartPoint,
            EndPoint = source.EndPoint
        };
        foreach (var stop in source.GradientStops)
        {
            clone.GradientStops.Add(new GradientStop { Color = stop.Color, Offset = stop.Offset });
        }

        return clone;
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
