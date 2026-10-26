using System;

namespace UplinkFtp.Services.Licensing;

/// <summary>
/// Supplies the main window HWND for WinRT APIs that require
/// <c>InitializeWithWindow</c> (Store purchase UI on WinUI 3 desktop).
/// </summary>
public interface IWindowHandleProvider
{
    /// <summary>Main window handle, or <see cref="IntPtr.Zero"/> if not ready.</summary>
    IntPtr GetMainWindowHandle();
}
