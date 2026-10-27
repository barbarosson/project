using System;
using Microsoft.UI.Xaml;
using WinRT.Interop;

namespace UplinkFtp.Services.Licensing;

/// <summary>
/// Holds the active <see cref="Window"/> so Store / picker APIs can call
/// <c>InitializeWithWindow</c> with a real HWND after launch.
/// </summary>
public sealed class MainWindowHandleProvider : IWindowHandleProvider
{
    /// <summary>Set once the main window exists (typically right after construction).</summary>
    public Window? Window { get; set; }

    public IntPtr GetMainWindowHandle()
    {
        if (Window is null)
        {
            return IntPtr.Zero;
        }

        try
        {
            return WindowNative.GetWindowHandle(Window);
        }
        catch (Exception)
        {
            return IntPtr.Zero;
        }
    }
}
