using HaSetup.Core.Docker;

namespace HaSetup.Core.HomeAssistant;

public interface IHaContainerService
{
    Task<HaContainerInfo> GetInfoAsync(CancellationToken cancellationToken = default);

    Task EnsureVolumeAsync(CancellationToken cancellationToken = default);

    Task PullImageAsync(CancellationToken cancellationToken = default, IProgress<string>? progress = null);

    Task CreateAndStartAsync(CancellationToken cancellationToken = default, IProgress<string>? progress = null);

    Task StartAsync(CancellationToken cancellationToken = default);

    Task StopAsync(CancellationToken cancellationToken = default);

    Task RestartAsync(CancellationToken cancellationToken = default);

    Task RemoveAsync(bool removeVolume = false, CancellationToken cancellationToken = default);

    Task<DockerCommandResult> GetLogsAsync(int tail = 100, CancellationToken cancellationToken = default);
}
