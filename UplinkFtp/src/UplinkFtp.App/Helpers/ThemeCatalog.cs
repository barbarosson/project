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
        "Orange" => new("Orange", "Orange + black · dark", "#1A1410", "#F97316", true),
        "Red Night" => new("Red Night", "Red + black · dark", "#160A0E", "#EF4444", true),
        "Sun Rise" => new("Sun Rise", "Yellow + sky · light", "#FFF6E0", "#0284C7", false),
        "ZEN" => new("ZEN", "Black + white · calm", "#171717", "#E4E4E7", true),
        _ => new("Orbit", "Follows your system", "#EEF4F6", "#0F766E", false)
    };
}
