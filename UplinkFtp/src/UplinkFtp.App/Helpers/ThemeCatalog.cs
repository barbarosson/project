using System;
using System.Linq;
using Microsoft.UI.Xaml;

namespace UplinkFtp.Helpers;

/// <summary>Named appearance profiles shown in Settings → Theme.</summary>
public static class ThemeCatalog
{
    public const string DefaultThemeName = "Sun Rise";

    /// <summary>Settings combo order.</summary>
    public static readonly string[] DisplayNames =
    [
        "Sun Rise",
        "Orange",
        "Red Night",
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
    /// Map older System/Light/Dark, Orbit, and Daybreak/Nightwatch/Harbor/Forge settings
    /// to the current four-theme catalog.
    /// </summary>
    public static string MigrateLegacyName(string? themeName) => themeName?.Trim() switch
    {
        null or "" => DefaultThemeName,
        "Orbit" or "System" or "Light" or "Daybreak" => "Sun Rise",
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
        // Soft yellow + sky blue morning light (default daytime).
        new("Sun Rise", ElementTheme.Light, PaletteKey: "SunRise"),
        // Orange + black.
        new("Orange", ElementTheme.Dark, PaletteKey: "Orange"),
        // Red + black night shell.
        new("Red Night", ElementTheme.Dark, PaletteKey: "RedNight"),
        // Near-black / off-white calm mono.
        new("ZEN", ElementTheme.Dark, PaletteKey: "ZEN")
    ];
}

/// <param name="PaletteKey">Key in Themes/ThemePalettes.xaml.</param>
public sealed record ThemeProfile(string Name, ElementTheme ElementTheme, string PaletteKey);

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
        "ZEN" => new("ZEN", "Black + white · grayscale", "#121212", "#E5E5E5", true),
        _ => new("Sun Rise", "Yellow + sky blue · light", "#FFF4C8", "#0EA5E9", false)
    };
}
