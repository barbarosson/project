using HaSetup.Core.Diagnostics;

namespace HaSetup.Core.Docker;

/// <summary>
/// Talks to the Docker CLI. On Windows this is typically Docker Desktop's docker.exe.
/// </summary>
public sealed class DockerClient : IDockerClient
{
    private readonly IProcessRunner _runner;
    private readonly Func<string?> _resolveDockerPath;

    public DockerClient(IProcessRunner? runner = null, Func<string?>? resolveDockerPath = null)
    {
        _runner = runner ?? new ProcessRunner();
        _resolveDockerPath = resolveDockerPath ?? ResolveDockerExecutable;
    }

    public async Task<DockerAvailability> ProbeAsync(CancellationToken cancellationToken = default)
    {
        var dockerPath = _resolveDockerPath();
        if (string.IsNullOrWhiteSpace(dockerPath))
        {
            return new DockerAvailability(
                DockerInstallState.CliMissing,
                Version: null,
                Message: "Docker Desktop was not found. Install Docker Desktop to manage the local HA container.",
                DockerPath: null,
                Detail: "docker executable not found on PATH or common install locations.");
        }

        // Prefer a short server-version probe; fall back to `docker info` for richer daemon errors.
        var version = await _runner.RunAsync(dockerPath, ["version", "--format", "{{.Server.Version}}"], cancellationToken)
            .ConfigureAwait(false);

        if (version.Succeeded && !string.IsNullOrWhiteSpace(version.StandardOutput))
        {
            var serverVersion = version.StandardOutput.Trim();
            return new DockerAvailability(
                DockerInstallState.Ready,
                Version: serverVersion,
                Message: $"Docker ready (server {serverVersion}).",
                DockerPath: dockerPath);
        }

        var info = await _runner.RunAsync(dockerPath, ["info"], cancellationToken).ConfigureAwait(false);
        var detail = string.IsNullOrWhiteSpace(info.CombinedOutput)
            ? version.CombinedOutput
            : info.CombinedOutput;
        if (string.IsNullOrWhiteSpace(detail))
        {
            detail = version.CombinedOutput;
        }

        var friendly = FriendlyErrorHandler.ToUserMessage(
            detail,
            "Docker CLI was found, but the Docker engine is not ready.");

        return new DockerAvailability(
            DockerInstallState.InstalledButNotRunning,
            Version: null,
            Message: friendly,
            DockerPath: dockerPath,
            Detail: FriendlyErrorHandler.FormatDetailForLog(detail));
    }

    public async Task<DockerCommandResult> RunDockerAsync(
        IReadOnlyList<string> arguments,
        CancellationToken cancellationToken = default)
    {
        var dockerPath = _resolveDockerPath() ?? "docker";
        return await _runner.RunAsync(dockerPath, arguments, cancellationToken).ConfigureAwait(false);
    }

    internal static string? ResolveDockerExecutable()
    {
        var pathEnv = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        var separators = new[] { Path.PathSeparator };
        foreach (var dir in pathEnv.Split(separators, StringSplitOptions.RemoveEmptyEntries))
        {
            var candidate = FindDockerInDirectory(dir);
            if (candidate is not null)
            {
                return candidate;
            }
        }

        foreach (var candidate in CommonWindowsDockerPaths())
        {
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        // Last resort: rely on PATH resolution by ProcessStartInfo.
        return OperatingSystem.IsWindows() ? null : "docker";
    }

    private static string? FindDockerInDirectory(string directory)
    {
        try
        {
            var dockerExe = Path.Combine(directory, OperatingSystem.IsWindows() ? "docker.exe" : "docker");
            return File.Exists(dockerExe) ? dockerExe : null;
        }
        catch
        {
            return null;
        }
    }

    private static IEnumerable<string> CommonWindowsDockerPaths()
    {
        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

        yield return Path.Combine(programFiles, "Docker", "Docker", "resources", "bin", "docker.exe");
        yield return Path.Combine(programFiles, "Docker", "Docker", "resources", "docker.exe");
        yield return Path.Combine(programFilesX86, "Docker", "Docker", "resources", "bin", "docker.exe");
        yield return Path.Combine(localAppData, "Docker", "Docker", "resources", "bin", "docker.exe");
    }
}
