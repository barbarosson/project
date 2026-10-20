namespace HaSetup.Core.Diagnostics;

/// <summary>
/// Known stderr / exception fragments → short English user guidance.
/// Matched case-insensitively; first match wins (order matters).
/// </summary>
public static class ErrorPatternCatalog
{
    public sealed record Pattern(string Needle, string UserMessage);

    public static IReadOnlyList<Pattern> Patterns { get; } =
    [
        new(
            "cannot connect to the docker daemon",
            "Docker Desktop is not running. Open Docker Desktop from the Start menu, wait until the engine is ready, then press Refresh."),
        new(
            "error during connect",
            "Docker Desktop is not running or the engine is still starting. Open Docker Desktop, wait a moment, then try again."),
        new(
            "docker desktop is unable to start",
            "Docker Desktop could not start. Reboot if prompted, then open Docker Desktop and wait until the whale icon is idle."),
        new(
            "the system cannot find the file specified",
            "Docker CLI could not start. Reinstall Docker Desktop, then open it and press Refresh here."),
        new(
            "wsl 2 installation is incomplete",
            "WSL 2 setup is incomplete. Finish the WSL install (Microsoft docs), reboot if asked, then open Docker Desktop."),
        new(
            "wsl_e_distro_not_found",
            "A required WSL distribution is missing. Open Docker Desktop and complete its WSL setup, then try again."),
        new(
            "wsl_e_wsl_optional_component_required",
            "Windows needs the WSL optional component. Enable “Windows Subsystem for Linux”, reboot, then open Docker Desktop."),
        new(
            "wsl_optional_component",
            "Windows needs the WSL optional component. Enable “Windows Subsystem for Linux”, reboot, then open Docker Desktop."),
        new(
            "optional_component_required",
            "Windows needs the WSL optional component. Enable “Windows Subsystem for Linux”, reboot, then open Docker Desktop."),
        new(
            "there is no distribution with the supplied name",
            "WSL has no usable distribution for Docker. Open Docker Desktop and finish its first-run WSL setup."),
        new(
            "docker-desktop",
            "Docker Desktop / WSL may still be starting. Wait for Docker Desktop to finish, then press Refresh."),
        new(
            "port is already allocated",
            "Port 8123 is already in use. Stop the other container or service using that port, then try Install / Start again."),
        new(
            "address already in use",
            "Port 8123 is already in use. Stop the other process using that port, then try again."),
        new(
            "bind for",
            "Port 8123 could not be bound. Free the port or stop another local hub container, then retry."),
        new(
            "no space left on device",
            "Disk space is full. Free space on the drive used by Docker, then retry."),
        new(
            "toomanyrequests",
            "Docker Hub rate-limited the image pull. Wait a few minutes, sign in to Docker Hub if needed, then retry."),
        new(
            "pull access denied",
            "Could not pull the container image. Check your network and Docker Hub access, then retry."),
        new(
            "manifest unknown",
            "The container image tag was not found on Docker Hub. Check your network, then retry."),
        new(
            "network is unreachable",
            "Network is unreachable. Check your internet connection, then retry the image pull."),
        new(
            "i/o timeout",
            "A network timeout occurred talking to Docker or Docker Hub. Check connectivity and try again."),
        new(
            "context deadline exceeded",
            "The Docker operation timed out. Ensure Docker Desktop is running and try again."),
        new(
            "permission denied",
            "Permission was denied for a Docker operation. Ensure Docker Desktop is running and you are signed into Windows as a user allowed to use Docker."),
        new(
            "no such object",
            "The container was not found. Use Install / Start to create it again."),
        new(
            "no such container",
            "The container was not found. Use Install / Start to create it again."),
        new(
            "is not running",
            "Docker Desktop appears installed but the engine is not running. Start Docker Desktop and wait until it is ready."),
        new(
            "daemon",
            "The Docker engine did not respond. Open Docker Desktop, wait until it is ready, then press Refresh."),
    ];

    public static string? Match(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        foreach (var pattern in Patterns)
        {
            if (raw.Contains(pattern.Needle, StringComparison.OrdinalIgnoreCase))
            {
                return pattern.UserMessage;
            }
        }

        return null;
    }
}
