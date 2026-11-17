using Microsoft.UI;
using Microsoft.UI.Xaml;
using Windows.UI;

namespace PurePerformance.Helpers;

/// <summary>
/// Caption-button colors for windows with <c>ExtendsContentIntoTitleBar</c>.
/// Without this, min/max/close glyphs stay system-dark and disappear on a dark client area.
/// </summary>
public static class TitleBarChrome
{
    public static void Apply(Window window, bool isDark)
    {
        var titleBar = window.AppWindow?.TitleBar;
        if (titleBar is null)
        {
            return;
        }

        // Let the extended content show through the caption strip.
        titleBar.ButtonBackgroundColor = Colors.Transparent;
        titleBar.ButtonInactiveBackgroundColor = Colors.Transparent;

        if (isDark)
        {
            titleBar.ButtonForegroundColor = Colors.White;
            titleBar.ButtonHoverForegroundColor = Colors.White;
            titleBar.ButtonPressedForegroundColor = Colors.White;
            titleBar.ButtonInactiveForegroundColor = Color.FromArgb(255, 160, 160, 160);
            titleBar.ButtonHoverBackgroundColor = Color.FromArgb(0x33, 0xFF, 0xFF, 0xFF);
            titleBar.ButtonPressedBackgroundColor = Color.FromArgb(0x55, 0xFF, 0xFF, 0xFF);
        }
        else
        {
            titleBar.ButtonForegroundColor = Colors.Black;
            titleBar.ButtonHoverForegroundColor = Colors.Black;
            titleBar.ButtonPressedForegroundColor = Colors.Black;
            titleBar.ButtonInactiveForegroundColor = Color.FromArgb(255, 96, 96, 96);
            titleBar.ButtonHoverBackgroundColor = Color.FromArgb(0x33, 0x00, 0x00, 0x00);
            titleBar.ButtonPressedBackgroundColor = Color.FromArgb(0x55, 0x00, 0x00, 0x00);
        }
    }

    public static bool IsEffectivelyDark(FrameworkElement root) =>
        root.ActualTheme == ElementTheme.Dark;
}
