using Microsoft.UI.Xaml;
using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IThemeService
{
    AppThemePreference Preference { get; }

    event EventHandler? PreferenceChanged;

    void SetPreference(AppThemePreference preference);

    /// <summary>
    /// Applies theme on a FrameworkElement (MainWindow content root).
    /// Uses ElementTheme only — does not set Application.RequestedTheme.
    /// </summary>
    void ApplyToRoot(FrameworkElement root);
}
