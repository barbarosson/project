using HaSetup.Core.Docker;

namespace HaSetup.Core.Diagnostics;

public sealed record PreflightResult(bool Ok, string Message, string? Detail = null);

/// <summary>
/// WSL + Docker daemon gate used before Install / Start container operations.
/// </summary>
public sealed class EnvironmentPreflight
{
    private readonly WslStatusChecker _wsl;
    private readonly DockerDaemonChecker _dockerDaemon;

    public EnvironmentPreflight(WslStatusChecker wsl, DockerDaemonChecker dockerDaemon)
    {
        _wsl = wsl;
        _dockerDaemon = dockerDaemon;
    }

    public EnvironmentPreflight(IProcessRunner runner, IDockerClient docker)
        : this(new WslStatusChecker(runner), new DockerDaemonChecker(docker))
    {
    }

    public async Task<PreflightResult> EnsureReadyAsync(CancellationToken cancellationToken = default)
    {
        var wsl = await _wsl.CheckAsync(cancellationToken).ConfigureAwait(false);
        if (!wsl.IsReady)
        {
            return new PreflightResult(false, wsl.Message, wsl.Detail);
        }

        var docker = await _dockerDaemon.CheckAsync(cancellationToken).ConfigureAwait(false);
        if (!docker.IsReady)
        {
            return new PreflightResult(false, docker.Message, docker.Detail);
        }

        return new PreflightResult(
            true,
            "WSL and Docker daemon are ready.",
            Detail: docker.Version is null ? null : $"Docker server {docker.Version}");
    }
}
