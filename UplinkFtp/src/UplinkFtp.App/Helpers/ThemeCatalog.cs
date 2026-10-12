using System;
using System.Linq;
using Microsoft.UI.Xaml;

namespace UplinkFtp.Helpers;

/// <summary>Named appearance profiles (evocative labels — not color names).</summary>
public static class ThemeCatalog
{
    public const string DefaultThemeName = "Orbit";

    /// <summary>Settings combo order.</summary>
    public static readonly string[] DisplayNames =
    [
        "Orbit",
        "Daybreak",
        "Nightwatch",
        "Harbor",
        "Forge"
    ];

    public static ThemeProfile Resolve(string? themeName)
    {
        var normalized = MigrateLegacyName(themeName);
        return Profiles.FirstOrDefault(p =>
                   string.Equals(p.Name, normalized, StringComparison.OrdinalIgnoreCase))
               ?? Profiles[0];
    }

    public static bool IsKnown(string? themeName)
        => Profiles.Any(p => string.Equals(p.Name, MigrateLegacyName(themeName), StringComparison.OrdinalIgnoreCase));

    /// <summary>Map older System/Light/Dark settings to the named catalog.</summary>
    public static string MigrateLegacyName(string? themeName) => themeName?.Trim() switch
    {
        null or "" => DefaultThemeName,
        "System" => "Orbit",
        "Light" => "Daybreak",
        "Dark" => "Nightwatch",
        _ => themeName.Trim()
    };

    private static readonly ThemeProfile[] Profiles =
    [
        // Follows the OS light/dark setting — like staying in sync with the machine.
        new("Orbit", ElementTheme.Default, PaletteKey: null),
        // Morning session / clear workspace (warm-tech light).
        new("Daybreak", ElementTheme.Light, PaletteKey: null),
        // Late ops / focused dark shell (warm-tech dark).
        new("Nightwatch", ElementTheme.Dark, PaletteKey: null),
        // Dockside calm — cooler light slate/teal variant.
        new("Harbor", ElementTheme.Light, PaletteKey: "Harbor"),
        // Workshop heat — charcoal shell with copper signal accents.
        new("Forge", ElementTheme.Dark, PaletteKey: "Forge")
    ];
}

/// <param name="PaletteKey">Optional key in Themes/ThemePalettes.xaml; null = default Colors.xaml.</param>
public sealed record ThemeProfile(string Name, ElementTheme ElementTheme, string? PaletteKey);

/// <summary>Swatch + feel copy for Settings theme preview cards (not color-named themes).</summary>
public sealed record ThemePreviewCard(
    string Name,
    string Feel,
    string ShellHex,
    string AccentHex,
    bool IsDark)
{
    public static ThemePreviewCard For(string name) => ThemeCatalog.MigrateLegacyName(name) switch
    {
        "Daybreak" => new("Daybreak", "Clear morning · light", "#EEF4F6", "#0F766E", false),
        "Nightwatch" => new("Nightwatch", "Late ops · dark", "#0B1418", "#2DD4BF", true),
        "Harbor" => new("Harbor", "Dockside calm · light", "#E8F0F4", "#0B6E7A", false),
        "Forge" => new("Forge", "Workshop heat · dark", "#120F0C", "#E8A06A", true),
        _ => new("Orbit", "Follows your system", "#EEF4F6", "#0F766E", false)
    };
}
