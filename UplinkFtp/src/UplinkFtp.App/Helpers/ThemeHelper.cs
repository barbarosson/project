using Microsoft.UI.Xaml;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.Helpers;

/// <summary>Applies Light / Dark / System theme to the WinUI shell root.</summary>
public static class ThemeHelper
{
    public static void ApplyFromSettings(AppSettings settings, FrameworkElement? root = null)
        => Apply(settings.Theme, root);

    public static void Apply(string? themeName, FrameworkElement? root = null)
    {
        if (root is null)
        {
            return;
        }

        root.RequestedTheme = Parse(themeName);
    }

    public static ElementTheme Parse(string? themeName) => themeName?.Trim() switch
    {
        "Light" => ElementTheme.Light,
        "Dark" => ElementTheme.Dark,
        _ => ElementTheme.Default
    };
}
