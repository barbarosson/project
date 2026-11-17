namespace PurePerformance.Models;

/// <summary>
/// User theme choice. "System" maps to ElementTheme.Default on the window root —
/// never Application.RequestedTheme=Default (that is invalid / WMC0055).
/// </summary>
public enum AppThemePreference
{
    System = 0,
    Light = 1,
    Dark = 2
}
