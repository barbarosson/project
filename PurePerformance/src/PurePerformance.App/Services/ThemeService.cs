using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Media;
using PurePerformance.Helpers;
using PurePerformance.Models;
using Windows.UI;

namespace PurePerformance.Services;

public sealed class ThemeService : IThemeService
{
    private readonly UserSettingsStore _store;
    private FrameworkElement? _root;

    public ThemeService(UserSettingsStore store)
    {
        _store = store;
        Preference = store.Theme;
        Accent = store.Accent;
    }

    public AppThemePreference Preference { get; private set; }

    public AccentPack Accent { get; private set; }

    public event EventHandler? PreferenceChanged;

    public void SetPreference(AppThemePreference preference)
    {
        if (Preference == preference) return;

        Preference = preference;
        _store.Theme = preference;
        ApplyCurrent();
        PreferenceChanged?.Invoke(this, EventArgs.Empty);
    }

    public void SetAccent(AccentPack accent)
    {
        if (Accent == accent) return;

        Accent = accent;
        _store.Accent = accent;
        ApplyCurrent();
        PreferenceChanged?.Invoke(this, EventArgs.Empty);
    }

    public void ApplyToRoot(FrameworkElement root)
    {
        _root = root;
        ApplyCurrent();
    }

    private void ApplyCurrent()
    {
        if (_root is null) return;

        // ElementTheme.Default = follow Windows light/dark. Safe here.
        // Do NOT assign Application.RequestedTheme = ApplicationTheme.Default (WMC0055).
        _root.RequestedTheme = Preference switch
        {
            AppThemePreference.Light => ElementTheme.Light,
            AppThemePreference.Dark => ElementTheme.Dark,
            _ => ElementTheme.Default
        };

        ApplyAccentResources(_root, Accent);
    }

    private static void ApplyAccentResources(FrameworkElement root, AccentPack pack)
    {
        // Always ensure contrast-safe brushes exist for Settings theme chips.
        EnsureContrastBrushes(root.Resources);

        if (pack == AccentPack.System)
        {
            // Remove app overrides so WinUI falls back to the OS accent.
            RemoveIfPresent(root.Resources, "SystemAccentColor");
            RemoveIfPresent(root.Resources, "SystemAccentColorLight1");
            RemoveIfPresent(root.Resources, "SystemAccentColorLight2");
            RemoveIfPresent(root.Resources, "SystemAccentColorDark1");
            RemoveIfPresent(root.Resources, "SystemAccentColorDark2");
            RemoveIfPresent(root.Resources, "AccentFillColorDefaultBrush");
            RemoveIfPresent(root.Resources, "AccentFillColorSecondaryBrush");
            return;
        }

        var (baseColor, light1, light2, dark1, dark2) = AccentPalette.Resolve(pack);
        root.Resources["SystemAccentColor"] = baseColor;
        root.Resources["SystemAccentColorLight1"] = light1;
        root.Resources["SystemAccentColorLight2"] = light2;
        root.Resources["SystemAccentColorDark1"] = dark1;
        root.Resources["SystemAccentColorDark2"] = dark2;
        root.Resources["AccentFillColorDefaultBrush"] = new SolidColorBrush(baseColor);
        root.Resources["AccentFillColorSecondaryBrush"] = new SolidColorBrush(dark1);
    }

    private static void EnsureContrastBrushes(ResourceDictionary resources)
    {
        // Theme-chip borders/fills use these keys so Light/Dark toggles stay readable.
        if (!resources.ContainsKey("PpThemeChipBorderBrush"))
        {
            resources["PpThemeChipBorderBrush"] =
                new SolidColorBrush(Color.FromArgb(255, 128, 128, 128));
        }

        if (!resources.ContainsKey("PpThemeChipSelectedBrush"))
        {
            resources["PpThemeChipSelectedBrush"] =
                new SolidColorBrush(Color.FromArgb(60, 0, 120, 212));
        }
    }

    private static void RemoveIfPresent(ResourceDictionary resources, string key)
    {
        if (resources.ContainsKey(key))
        {
            resources.Remove(key);
        }
    }
}
