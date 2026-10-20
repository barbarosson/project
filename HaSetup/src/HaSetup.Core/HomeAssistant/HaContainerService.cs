using System.Globalization;
using HaSetup.Core.Diagnostics;
using HaSetup.Core.Docker;

namespace HaSetup.Core.HomeAssistant;

public sealed class HaContainerService : IHaContainerService
{
    private readonly IDockerClient _docker;

    public HaContainerService(IDockerClient docker)
    {
        _docker = docker;
    }

    public async Task<HaContainerInfo> GetInfoAsync(CancellationToken cancellationToken = default)
    {
        var result = await _docker.RunDockerAsync(
            [
                "inspect",
                "--format",
                "{{.Id}}|{{.State.Status}}|{{.Config.Image}}|{{.State.Running}}",
                HaConstants.ContainerName,
            ],
            cancellationToken).ConfigureAwait(false);

        if (!result.Succeeded)
        {
            var combined = result.CombinedOutput;
            if (combined.Contains("No such object", StringComparison.OrdinalIgnoreCase) ||
                combined.Contains("No such container", StringComparison.OrdinalIgnoreCase))
            {
                return HaContainerInfo.Missing;
            }

            return new HaContainerInfo(
                HaLifecycleState.Unknown,
                ContainerId: null,
                StatusText: combined,
                Image: null,
                Exists: false);
        }

        var parts = result.StandardOutput.Trim().Split('|');
        if (parts.Length < 3)
        {
            return new HaContainerInfo(
                HaLifecycleState.Unknown,
                ContainerId: null,
                StatusText: result.StandardOutput.Trim(),
                Image: null,
                Exists: true);
        }

        var id = parts[0];
        var status = parts[1];
        var image = parts[2];
        var state = MapState(status);

        return new HaContainerInfo(state, TruncateId(id), status, image, Exists: true);
    }

    public async Task EnsureVolumeAsync(CancellationToken cancellationToken = default)
    {
        var inspect = await _docker.RunDockerAsync(["volume", "inspect", HaConstants.VolumeName], cancellationToken)
            .ConfigureAwait(false);
        if (inspect.Succeeded)
        {
            return;
        }

        var create = await _docker.RunDockerAsync(["volume", "create", HaConstants.VolumeName], cancellationToken)
            .ConfigureAwait(false);
        if (!create.Succeeded)
        {
            throw Fail("Could not create the config volume.", create.CombinedOutput);
        }
    }

    public async Task PullImageAsync(CancellationToken cancellationToken = default, IProgress<string>? progress = null)
    {
        progress?.Report($"Pulling image: {HaConstants.Image}");
        var pull = await _docker.RunDockerAsync(["pull", HaConstants.Image], cancellationToken).ConfigureAwait(false);
        if (!pull.Succeeded)
        {
            throw Fail("Image pull failed.", pull.CombinedOutput);
        }

        progress?.Report("Image ready.");
    }

    public async Task CreateAndStartAsync(CancellationToken cancellationToken = default, IProgress<string>? progress = null)
    {
        var existing = await GetInfoAsync(cancellationToken).ConfigureAwait(false);
        if (existing.Exists)
        {
            if (existing.State == HaLifecycleState.Running)
            {
                progress?.Report("Local HA container is already running.");
                return;
            }

            progress?.Report("Starting existing container…");
            await StartAsync(cancellationToken).ConfigureAwait(false);
            return;
        }

        await EnsureVolumeAsync(cancellationToken).ConfigureAwait(false);
        await PullImageAsync(cancellationToken, progress).ConfigureAwait(false);

        progress?.Report("Creating container…");
        var create = await _docker.RunDockerAsync(
            [
                "create",
                "--name", HaConstants.ContainerName,
                "--restart", "unless-stopped",
                "-e", "TZ=UTC",
                "-v", $"{HaConstants.VolumeName}:{HaConstants.ConfigMount}",
                "-p", $"{HaConstants.HostPort}:{HaConstants.ContainerPort}",
                HaConstants.Image,
            ],
            cancellationToken).ConfigureAwait(false);

        if (!create.Succeeded)
        {
            throw Fail("Could not create the container.", create.CombinedOutput);
        }

        progress?.Report("Starting container…");
        await StartAsync(cancellationToken).ConfigureAwait(false);
        progress?.Report("Local HA container started.");
    }

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        var result = await _docker.RunDockerAsync(["start", HaConstants.ContainerName], cancellationToken)
            .ConfigureAwait(false);
        if (!result.Succeeded)
        {
            throw Fail("Could not start the container.", result.CombinedOutput);
        }
    }

    public async Task StopAsync(CancellationToken cancellationToken = default)
    {
        var result = await _docker.RunDockerAsync(["stop", HaConstants.ContainerName], cancellationToken)
            .ConfigureAwait(false);
        if (!result.Succeeded)
        {
            throw Fail("Could not stop the container.", result.CombinedOutput);
        }
    }

    public async Task RestartAsync(CancellationToken cancellationToken = default)
    {
        var result = await _docker.RunDockerAsync(["restart", HaConstants.ContainerName], cancellationToken)
            .ConfigureAwait(false);
        if (!result.Succeeded)
        {
            throw Fail("Could not restart the container.", result.CombinedOutput);
        }
    }

    public async Task RemoveAsync(bool removeVolume = false, CancellationToken cancellationToken = default)
    {
        var info = await GetInfoAsync(cancellationToken).ConfigureAwait(false);
        if (!info.Exists)
        {
            return;
        }

        if (info.State == HaLifecycleState.Running || info.State == HaLifecycleState.Restarting)
        {
            await StopAsync(cancellationToken).ConfigureAwait(false);
        }

        var remove = await _docker.RunDockerAsync(["rm", "-f", HaConstants.ContainerName], cancellationToken)
            .ConfigureAwait(false);
        if (!remove.Succeeded)
        {
            throw Fail("Could not remove the container.", remove.CombinedOutput);
        }

        if (removeVolume)
        {
            var vol = await _docker.RunDockerAsync(["volume", "rm", HaConstants.VolumeName], cancellationToken)
                .ConfigureAwait(false);
            if (!vol.Succeeded)
            {
                throw Fail("Could not remove the config volume.", vol.CombinedOutput);
            }
        }
    }

    private static InvalidOperationException Fail(string context, string? raw) =>
        new(FriendlyErrorHandler.ToUserMessage(raw, context));

    public Task<DockerCommandResult> GetLogsAsync(int tail = 100, CancellationToken cancellationToken = default) =>
        _docker.RunDockerAsync(["logs", "--tail", tail.ToString(CultureInfo.InvariantCulture), HaConstants.ContainerName], cancellationToken);

    private static HaLifecycleState MapState(string status) => status.Trim().ToLowerInvariant() switch
    {
        "created" => HaLifecycleState.Created,
        "running" => HaLifecycleState.Running,
        "exited" => HaLifecycleState.Exited,
        "restarting" => HaLifecycleState.Restarting,
        "paused" => HaLifecycleState.Paused,
        "dead" => HaLifecycleState.Dead,
        "removing" => HaLifecycleState.Removing,
        _ => HaLifecycleState.Unknown,
    };

    private static string TruncateId(string id) =>
        id.Length <= 12 ? id : id[..12];
}
