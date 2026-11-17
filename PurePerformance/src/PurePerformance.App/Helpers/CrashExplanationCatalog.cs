using PurePerformance.Models;

namespace PurePerformance.Helpers;

/// <summary>
/// Maps known Event Viewer providers / IDs to plain-English titles, explanations, and fixes.
/// </summary>
internal static class CrashExplanationCatalog
{
    public static (CrashCategory Category, string Title, string Explanation, string Fix) Describe(
        string providerName,
        int eventId,
        string? rawMessage)
    {
        var provider = providerName ?? string.Empty;

        if (IsBugCheck(provider, eventId, rawMessage))
        {
            return (
                CrashCategory.BlueScreen,
                "Windows stopped unexpectedly (blue screen)",
                "Windows recorded a bug check — the system halted to protect your data. " +
                "Common causes include faulty drivers, failing RAM, or disk issues.",
                "1) Note the stop code in Reliability Monitor or this event. " +
                "2) Update GPU/chipset drivers from the vendor. " +
                "3) Run Windows Memory Diagnostic and `chkdsk` on the system drive. " +
                "4) If it repeats after updates, check for overheating or bad hardware.");
        }

        if (IsKernelPowerUnexpected(provider, eventId))
        {
            return (
                CrashCategory.UnexpectedShutdown,
                "PC lost power or shut down without a clean exit",
                "Kernel-Power event 41 means Windows did not shut down correctly — " +
                "often a power loss, hard reset, or freeze that forced a reboot.",
                "1) Check the power supply / laptop battery and cable. " +
                "2) Disable overclocking and aggressive sleep if freezes precede this. " +
                "3) Review Crash Analyzer for matching BSOD or disk errors just before the reboot. " +
                "4) Ensure Windows Update and chipset drivers are current.");
        }

        if (IsKernelPowerRelated(provider, eventId))
        {
            return (
                CrashCategory.KernelPower,
                "Power or sleep transition issue",
                "The Kernel-Power provider reported a sleep, hibernate, or power-policy problem " +
                "that may affect stability or wake behavior.",
                "1) Update BIOS/UEFI and chipset drivers. " +
                "2) In Power Options, try a Balanced plan and disable Fast Startup temporarily. " +
                "3) If sleep fails often, check for USB devices that prevent sleep.");
        }

        if (IsApplicationHang(provider, eventId))
        {
            return (
                CrashCategory.ApplicationHang,
                "An application stopped responding",
                "Windows detected that a program stopped responding to user input (Application Hang). " +
                "This is usually app-specific rather than a full system crash.",
                "1) Update or reinstall the named application. " +
                "2) Check for GPU driver updates if the hang involves games or browsers. " +
                "3) Close heavy background apps and retry. " +
                "4) If one app hangs repeatedly, reset its settings or clear its cache.");
        }

        if (IsDiskRelated(provider, eventId, rawMessage))
        {
            return (
                CrashCategory.DiskError,
                "Disk or storage warning",
                "Windows reported a disk, NTFS, or storage controller problem. " +
                "Ignoring repeated disk errors can lead to data loss or boot failures.",
                "1) Back up important files now. " +
                "2) Open Command Prompt as admin and run `chkdsk C: /scan`. " +
                "3) Check SMART health in your SSD/HDD vendor tool. " +
                "4) Ensure SATA/NVMe cables/firmware are healthy; replace the drive if errors persist.");
        }

        return (
            CrashCategory.Other,
            $"System warning from {provider} (ID {eventId})",
            "An Error or Warning was logged that matched the Crash Analyzer filters. " +
            "Review the raw message for the exact component involved.",
            "1) Read the event message for the failing component. " +
            "2) Search Microsoft Support or the vendor for that Event ID. " +
            "3) Apply pending Windows Updates. " +
            "4) If unsure, leave the system alone and monitor for repeats — do not delete registry keys.");
    }

    private static bool IsBugCheck(string provider, int eventId, string? raw)
    {
        if (eventId == 1001 && provider.Contains("Windows Error Reporting", StringComparison.OrdinalIgnoreCase))
        {
            return raw?.Contains("blue screen", StringComparison.OrdinalIgnoreCase) == true
                   || raw?.Contains("bugcheck", StringComparison.OrdinalIgnoreCase) == true
                   || raw?.Contains("bug check", StringComparison.OrdinalIgnoreCase) == true;
        }

        return provider.Contains("BugCheck", StringComparison.OrdinalIgnoreCase)
               || (eventId == 1001 && provider.Contains("Microsoft-Windows-WER-SystemErrorReporting", StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsKernelPowerUnexpected(string provider, int eventId) =>
        eventId == 41 && provider.Contains("Kernel-Power", StringComparison.OrdinalIgnoreCase);

    private static bool IsKernelPowerRelated(string provider, int eventId) =>
        provider.Contains("Kernel-Power", StringComparison.OrdinalIgnoreCase)
        || (provider.Contains("Kernel-Power", StringComparison.OrdinalIgnoreCase) && eventId is 109 or 42 or 172);

    private static bool IsApplicationHang(string provider, int eventId) =>
        eventId == 1002
        || provider.Contains("Application Hang", StringComparison.OrdinalIgnoreCase)
        || (provider.Contains("Hang", StringComparison.OrdinalIgnoreCase) && eventId is 1002 or 1001);

    private static bool IsDiskRelated(string provider, int eventId, string? raw)
    {
        if (provider.Equals("disk", StringComparison.OrdinalIgnoreCase)
            || provider.Contains("Ntfs", StringComparison.OrdinalIgnoreCase)
            || provider.Contains("storahci", StringComparison.OrdinalIgnoreCase)
            || provider.Contains("stornvme", StringComparison.OrdinalIgnoreCase)
            || provider.Contains("Disk", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return raw?.Contains("disk", StringComparison.OrdinalIgnoreCase) == true
               && eventId is >= 7 and <= 51;
    }
}
