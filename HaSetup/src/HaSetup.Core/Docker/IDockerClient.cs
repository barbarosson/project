namespace HaSetup.Core.Docker;

public interface IDockerClient
{
    Task<DockerAvailability> ProbeAsync(CancellationToken cancellationToken = default);

    Task<DockerCommandResult> RunDockerAsync(
        IReadOnlyList<string> arguments,
        CancellationToken cancellationToken = default);
}
