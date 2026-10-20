namespace HaSetup.Core.Diagnostics;

public enum WslInstallState
{
    Ready,
    NotInstalled,
    NeedsAttention,
    Unknown,
    Skipped,
}

public sealed record WslStatus(
    WslInstallState State,
    string Message,
    string? Detail = null)
{
    public bool IsReady => State is WslInstallState.Ready or WslInstallState.Skipped;
}
