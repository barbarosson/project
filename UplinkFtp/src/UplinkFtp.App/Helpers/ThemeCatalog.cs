using System;
using System.Linq;
using Microsoft.UI.Xaml;

namespace UplinkFtp.Helpers;

/// <summary>Named appearance profiles shown in Settings → Theme.</summary>
public static class ThemeCatalog
{
    public const string DefaultThemeName = "Orbit";

    /// <summary>Settings combo order.</summary>
    public static readonly string[] DisplayNames =
    [
        "Orbit",
        "Orange",
        "Red Night",
        "Sun Rise",
        "ZEN"
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

    /// <summary>
    /// Map older System/Light/Dark and Daybreak/Nightwatch/Harbor/Forge settings
    /// to the current catalog.
    /// </summary>
    public static string MigrateLegacyName(string? themeName) => themeName?.Trim() switch
    {
        null or "" => DefaultThemeName,
        "System" => "Orbit",
        "Light" or "Daybreak" => "Orange",
        "Dark" or "Nightwatch" => "Red Night",
        "Harbor" => "Sun Rise",
        "Forge" => "ZEN",
        "RedNight" => "Red Night",
        "SunRise" => "Sun Rise",
        "Zen" => "ZEN",
        _ => themeName.Trim()
    };

    private static readonly ThemeProfile[] Profiles =
    [
        // Follows the OS light/dark setting (default Colors.xaml warm-tech).
        new("Orbit", ElementTheme.Default, PaletteKey: null),
        // Orange + black.
        new("Orange", ElementTheme.Dark, PaletteKey: "Orange"),
        // Red + black night shell.
        new("Red Night", ElementTheme.Dark, PaletteKey: "RedNight"),
        // Soft yellow + sky blue morning light.
        new("Sun Rise", ElementTheme.Light, PaletteKey: "SunRise"),
        // Near-black / off-white calm mono.
        new("ZEN", ElementTheme.Dark, PaletteKey: "ZEN")
    ];
}

/// <param name="PaletteKey">Optional key in Themes/ThemePalettes.xaml; null = default Colors.xaml.</param>
public sealed record ThemeProfile(string Name, ElementTheme ElementTheme, string? PaletteKey);

/// <summary>Swatch + feel copy for Settings theme preview cards.</summary>
public sealed record ThemePreviewCard(
    string Name,
    string Feel,
    string ShellHex,
    string AccentHex,
    bool IsDark)
{
    public static ThemePreviewCard For(string name) => ThemeCatalog.MigrateLegacyName(name) switch
    {
        "Orange" => new("Orange", "Orange + black · dark", "#0C0A08", "#FF7A00", true),
        "Red Night" => new("Red Night", "Crimson + black · dark", "#0A0608", "#DC2626", true),
        "Sun Rise" => new("Sun Rise", "Yellow + sky blue · light", "#FFF4C8", "#0EA5E9", false),
        "ZEN" => new("ZEN", "Black + white · grayscale", "#121212", "#E5E5E5", true),
        _ => new("Orbit", "Follows your system · warm-tech", "#EEF4F6", "#0F766E", false)
    };
}
