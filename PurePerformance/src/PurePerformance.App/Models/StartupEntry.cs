namespace PurePerformance.Models;

public sealed class StartupEntry
{
    public required string Id { get; init; }

    public required string Name { get; init; }

    public required string Command { get; init; }

    public required StartupLocation Location { get; init; }

    public bool IsEnabled { get; set; }

    public bool RequiresAdmin { get; init; }

    public string LocationLabel => Location switch
    {
        StartupLocation.CurrentUserRun => "Current user · Registry Run",
        StartupLocation.LocalMachineRun => "All users · Registry Run (HKLM)",
        StartupLocation.StartupFolderUser => "Current user · Startup folder",
        StartupLocation.StartupFolderCommon => "All users · Startup folder",
        _ => "Unknown"
    };

    public string StatusLabel => IsEnabled ? "Enabled at startup" : "Disabled (kept for re-enable)";
}

public enum StartupLocation
{
    CurrentUserRun,
    LocalMachineRun,
    StartupFolderUser,
    StartupFolderCommon
}
