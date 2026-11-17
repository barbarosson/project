using Microsoft.UI.Xaml;
using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IThemeService
{
    AppThemePreference Preference { get; }

    AccentPack Accent { get; }

    event EventHandler? PreferenceChanged;

    void SetPreference(AppThemePreference preference);

    void SetAccent(AccentPack accent);

    /// <summary>
    /// Applies light/dark + accent on a FrameworkElement (MainWindow content root).
    /// Uses ElementTheme only — does not set Application.RequestedTheme.
    /// </summary>
    void ApplyToRoot(FrameworkElement root);

    /// <summary>
    /// Binds caption-button chrome (AppWindow.TitleBar) to the effective light/dark theme.
    /// </summary>
    void AttachWindow(Window window);
}
