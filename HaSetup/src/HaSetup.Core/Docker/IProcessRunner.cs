namespace HaSetup.Core.Docker;

public interface IProcessRunner
{
    Task<DockerCommandResult> RunAsync(
        string fileName,
        IReadOnlyList<string> arguments,
        CancellationToken cancellationToken = default,
        string? workingDirectory = null);
}
