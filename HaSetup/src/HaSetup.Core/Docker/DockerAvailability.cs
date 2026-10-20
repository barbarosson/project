namespace HaSetup.Core.Docker;

public enum DockerInstallState
{
    Ready,
    InstalledButNotRunning,
    CliMissing,
    Unknown,
}

public sealed record DockerAvailability(
    DockerInstallState State,
    string? Version,
    string Message,
    string? DockerPath = null,
    string? Detail = null)
{
    public bool IsReady => State == DockerInstallState.Ready;
}
