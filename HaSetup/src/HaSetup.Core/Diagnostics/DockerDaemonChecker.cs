using HaSetup.Core.Docker;

namespace HaSetup.Core.Diagnostics;

/// <summary>
/// Strengthened Docker daemon preflight: CLI resolve + version/info with timeout.
/// </summary>
public sealed class DockerDaemonChecker
{
    public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(20);

    private readonly IDockerClient _docker;
    private readonly TimeSpan _timeout;

    public DockerDaemonChecker(IDockerClient docker, TimeSpan? timeout = null)
    {
        _docker = docker ?? throw new ArgumentNullException(nameof(docker));
        _timeout = timeout ?? DefaultTimeout;
    }

    public async Task<DockerAvailability> CheckAsync(CancellationToken cancellationToken = default)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(_timeout);

        try
        {
            var availability = await _docker.ProbeAsync(timeoutCts.Token).ConfigureAwait(false);
            if (availability.IsReady)
            {
                return availability;
            }

            var friendly = FriendlyErrorHandler.ToUserMessage(
                availability.Detail ?? availability.Message,
                context: null);

            // Keep structured state; replace raw Message/Detail for UI consumers.
            return availability with
            {
                Message = string.IsNullOrWhiteSpace(friendly) ? availability.Message : friendly,
                Detail = FriendlyErrorHandler.FormatDetailForLog(availability.Detail ?? availability.Message),
            };
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new DockerAvailability(
                DockerInstallState.InstalledButNotRunning,
                Version: null,
                Message: "Docker did not respond in time. Open Docker Desktop, wait until the engine is ready, then press Refresh.",
                Detail: $"Probe timed out after {_timeout.TotalSeconds:0}s.");
        }
        catch (Exception ex)
        {
            return new DockerAvailability(
                DockerInstallState.Unknown,
                Version: null,
                Message: FriendlyErrorHandler.ToUserMessage(ex, "Docker check failed."),
                Detail: FriendlyErrorHandler.FormatDetailForLog(ex.Message));
        }
    }
}
