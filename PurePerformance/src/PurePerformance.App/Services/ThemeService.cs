using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Media;
using PurePerformance.Helpers;
using PurePerformance.Models;
using Windows.UI;
using Windows.UI.ViewManagement;

namespace PurePerformance.Services;

public sealed class ThemeService : IThemeService
{
    private readonly UserSettingsStore _store;
    private FrameworkElement? _root;
    private Window? _window;

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
        if (_root is not null)
        {
            _root.ActualThemeChanged -= OnRootActualThemeChanged;
        }

        _root = root;
        _root.ActualThemeChanged += OnRootActualThemeChanged;
        ApplyCurrent();
    }

    public void AttachWindow(Window window)
    {
        _window = window;
        ApplyTitleBarChrome();
    }

    private void OnRootActualThemeChanged(FrameworkElement sender, object args)
    {
        ApplyTitleBarChrome();
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
        ApplyTitleBarChrome();
    }

    private void ApplyTitleBarChrome()
    {
        if (_window is null || _root is null) return;
        TitleBarChrome.Apply(_window, TitleBarChrome.IsEffectivelyDark(_root));
    }

    private static void ApplyAccentResources(FrameworkElement root, AccentPack pack)
    {
        // Always ensure contrast-safe brushes exist for Settings theme chips.
        EnsureContrastBrushes(root.Resources);

        var (baseColor, light1, light2, dark1, dark2) = pack == AccentPack.System
            ? ResolveSystemAccent()
            : AccentPalette.Resolve(pack);

        // Write to both Application and window-root dictionaries. Controls resolve
        // ThemeResources from Application; local overrides alone do not refresh live.
        if (Application.Current?.Resources is { } appResources)
        {
            SetAccentColors(appResources, baseColor, light1, light2, dark1, dark2);
        }

        SetAccentColors(root.Resources, baseColor, light1, light2, dark1, dark2);

        // Force ThemeResource rebind — dictionary writes alone leave existing
        // AccentFill / button brushes stale until a theme pass runs again.
        ForceThemeResourceRefresh(root);
    }

    private static (Color Base, Color Light1, Color Light2, Color Dark1, Color Dark2) ResolveSystemAccent()
    {
        try
        {
            var ui = new UISettings();
            return (
                ui.GetColorValue(UIColorType.Accent),
                ui.GetColorValue(UIColorType.AccentLight1),
                ui.GetColorValue(UIColorType.AccentLight2),
                ui.GetColorValue(UIColorType.AccentDark1),
                ui.GetColorValue(UIColorType.AccentDark2));
        }
        catch
        {
            // Fallback matches AccentPalette Ocean / default Windows blue.
            return AccentPalette.Resolve(AccentPack.Ocean);
        }
    }

    private static void SetAccentColors(
        ResourceDictionary resources,
        Color baseColor,
        Color light1,
        Color light2,
        Color dark1,
        Color dark2)
    {
        resources["SystemAccentColor"] = baseColor;
        resources["SystemAccentColorLight1"] = light1;
        resources["SystemAccentColorLight2"] = light2;
        resources["SystemAccentColorDark1"] = dark1;
        resources["SystemAccentColorDark2"] = dark2;

        // Replace brushes controls actually paint with so the change is visible immediately.
        SetOrReplaceBrush(resources, "AccentFillColorDefaultBrush", baseColor);
        SetOrReplaceBrush(resources, "AccentFillColorSecondaryBrush", dark1);
        SetOrReplaceBrush(resources, "AccentFillColorTertiaryBrush", dark2);
        SetOrReplaceBrush(resources, "AccentTextFillColorPrimaryBrush", baseColor);
        SetOrReplaceBrush(resources, "AccentTextFillColorSecondaryBrush", dark1);
    }

    private static void SetOrReplaceBrush(ResourceDictionary resources, string key, Color color)
    {
        if (resources.ContainsKey(key) && resources[key] is SolidColorBrush brush)
        {
            // Mutate in place when possible so existing brush references update.
            brush.Color = color;
            return;
        }

        resources[key] = new SolidColorBrush(color);
    }

    private static void ForceThemeResourceRefresh(FrameworkElement root)
    {
        var requested = root.RequestedTheme;
        var flip = root.ActualTheme == ElementTheme.Dark ? ElementTheme.Light : ElementTheme.Dark;
        root.RequestedTheme = flip;
        root.UpdateLayout();
        root.RequestedTheme = requested;
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
}
