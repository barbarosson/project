using Microsoft.UI.Xaml;
using PurePerformance.Models;

namespace PurePerformance.Services;

public sealed class ThemeService : IThemeService
{
    private readonly UserSettingsStore _store;
    private FrameworkElement? _root;

    public ThemeService(UserSettingsStore store)
    {
        _store = store;
        Preference = store.Theme;
    }

    public AppThemePreference Preference { get; private set; }

    public event EventHandler? PreferenceChanged;

    public void SetPreference(AppThemePreference preference)
    {
        if (Preference == preference) return;

        Preference = preference;
        _store.Theme = preference;
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
    }
}
