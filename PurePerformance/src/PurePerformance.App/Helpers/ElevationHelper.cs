using System.Diagnostics;
using System.Security.Principal;

namespace PurePerformance.Helpers;

/// <summary>
/// Detects admin status and documents how future deep ops should request UAC elevation
/// in an MSIX Desktop Bridge (runFullTrust) context without over-requesting capabilities.
/// </summary>
/// <remarks>
/// <para>
/// Pure Performance ships as a full-trust packaged desktop app. Event log reading for the
/// Crash Analyzer generally works without elevation. Operations that modify protected
/// locations (e.g. some startup entries under HKLM, system temp folders owned by SYSTEM)
/// should prompt only when the user initiates that action — never at launch.
/// </para>
/// <para>
/// Recommended pattern for the next modules:
/// <list type="number">
/// <item>Check <see cref="IsRunningElevated"/> before the privileged call.</item>
/// <item>If not elevated, call <see cref="TryRelaunchElevated"/> (or spawn a one-shot elevated helper)
/// after explaining why in the UI.</item>
/// <item>On access denied, surface a graceful message — do not crash or silently skip.</item>
/// </list>
/// Do not declare broad restricted capabilities in Package.appxmanifest solely for convenience.
/// Prefer runFullTrust + on-demand UAC for the specific operation.
/// </para>
/// </remarks>
public static class ElevationHelper
{
    public static bool IsRunningElevated()
    {
        try
        {
            using var identity = WindowsIdentity.GetCurrent();
            var principal = new WindowsPrincipal(identity);
            return principal.IsInRole(WindowsBuiltInRole.Administrator);
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Attempts to relaunch the current process with a UAC elevation prompt.
    /// Returns false if the user cancels or the launch fails.
    /// </summary>
    public static bool TryRelaunchElevated(string? arguments = null)
    {
        try
        {
            var exe = Environment.ProcessPath;
            if (string.IsNullOrWhiteSpace(exe))
            {
                return false;
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = exe,
                UseShellExecute = true,
                Verb = "runas",
                Arguments = arguments ?? string.Empty
            };

            Process.Start(startInfo);
            return true;
        }
        catch (System.ComponentModel.Win32Exception)
        {
            // User cancelled the UAC prompt — treat as a normal outcome.
            return false;
        }
        catch
        {
            return false;
        }
    }
}
