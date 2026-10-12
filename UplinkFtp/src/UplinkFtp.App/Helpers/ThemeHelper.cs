using System;
using System.Collections.Generic;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.Helpers;

/// <summary>
/// Applies a named ThemeCatalog profile app-wide.
/// Named palettes are written into <see cref="Application.Current"/>.Resources so
/// shell, ContentDialogs, ThemeResource styles, and Application.Current.Resources
/// lookups all see the same brushes (RootGrid-only overlays were bleeding Orbit teal).
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
    private static ResourceDictionary? _rootMerge;
    /// <summary>Original Application.Resources entries for Orbit restore (null = key was absent).</summary>
    private static readonly Dictionary<string, object?> OrbitOriginals = new(StringComparer.Ordinal);
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

        if (root is not null)
        {
            root.RequestedTheme = profile.ElementTheme;
        }

        ApplyPaletteToApplication(profile.PaletteKey);
        ApplyPaletteToRoot(root, profile.PaletteKey);
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
    /// Prefer mutating the live Application brush in place so already-resolved
    /// ThemeResource references (same ElementTheme, e.g. Orange → Red Night) update.
    /// Never mutate Orbit's ThemeResource-backed originals — replace those with clones.
    /// </summary>
    private static void AssignOverlay(ResourceDictionary resources, string key, object entry)
    {
        var clone = CloneResource(entry);
        OrbitOriginals.TryGetValue(key, out var orbitOriginal);

        if (resources.TryGetValue(key, out var current)
            && current is not null
            && !ReferenceEquals(current, orbitOriginal)
            && TryCopyBrush(current, clone))
        {
            return;
        }

        resources[key] = clone;
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

    private static void ApplyPaletteToRoot(FrameworkElement? root, string? paletteKey)
    {
        if (root is null)
        {
            return;
        }

        if (_rootMerge is not null)
        {
            root.Resources.MergedDictionaries.Remove(_rootMerge);
            _rootMerge = null;
        }

        if (string.IsNullOrWhiteSpace(paletteKey))
        {
            return;
        }

        var palette = GetPalette(paletteKey);
        if (palette is null)
        {
            return;
        }

        var merge = new ResourceDictionary();
        foreach (var key in OverlayKeys)
        {
            if (palette.TryGetValue(key, out var entry) && entry is not null)
            {
                merge[key] = CloneResource(entry);
            }
        }

        root.Resources.MergedDictionaries.Add(merge);
        _rootMerge = merge;
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
            if (!OrbitOriginals.TryGetValue(key, out var original) || original is null)
            {
                resources.Remove(key);
            }
            else
            {
                resources[key] = original;
            }
        }
    }

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
