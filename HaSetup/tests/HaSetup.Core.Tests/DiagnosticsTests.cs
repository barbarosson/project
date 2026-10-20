using HaSetup.Core.Diagnostics;
using HaSetup.Core.Docker;

namespace HaSetup.Core.Tests;

public class FriendlyErrorHandlerTests
{
    [Theory]
    [InlineData("Cannot connect to the Docker daemon at npipe:////./pipe/docker_engine", "Docker Desktop is not running")]
    [InlineData("error during connect: This error may indicate that the docker daemon is not running", "Docker Desktop is not running")]
    [InlineData("Bind for 0.0.0.0:8123 failed: port is already allocated", "Port 8123 is already in use")]
    [InlineData("WSL 2 installation is incomplete", "WSL 2 setup is incomplete")]
    public void ToUserMessage_MatchesKnownPatterns(string raw, string expectedFragment)
    {
        var message = FriendlyErrorHandler.ToUserMessage(raw);
        Assert.Contains(expectedFragment, message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("npipe:", message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ToUserMessage_Exception_UsesPatternNotStack()
    {
        var ex = new InvalidOperationException("Cannot connect to the Docker daemon");
        var message = FriendlyErrorHandler.ToUserMessage(ex, "Start failed.");
        Assert.StartsWith("Start failed.", message, StringComparison.Ordinal);
        Assert.Contains("Docker Desktop is not running", message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void FormatDetailForLog_CompactsAndTruncates()
    {
        var longRaw = string.Join(' ', Enumerable.Repeat("stderr-line", 80));
        var detail = FriendlyErrorHandler.FormatDetailForLog(longRaw);
        Assert.NotNull(detail);
        Assert.True(detail!.Length <= FriendlyErrorHandler.MaxDetailChars);
    }
}

public class WslStatusCheckerTests
{
    [Fact]
    public void Parse_WhenWslMissing_ReturnsNotInstalled()
    {
        var status = new DockerCommandResult(-1, string.Empty, "The system cannot find the file specified");
        var list = new DockerCommandResult(-1, string.Empty, "The system cannot find the file specified");

        var result = WslStatusChecker.Parse(status, list);

        Assert.Equal(WslInstallState.NotInstalled, result.State);
        Assert.False(result.IsReady);
        Assert.Contains("WSL", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Parse_WhenListShowsDistros_ReturnsReady()
    {
        var status = new DockerCommandResult(0, "Default Version: 2\n", string.Empty);
        var list = new DockerCommandResult(
            0,
            "  NAME              STATE           VERSION\n* docker-desktop    Running         2\n",
            string.Empty);

        var result = WslStatusChecker.Parse(status, list);

        Assert.Equal(WslInstallState.Ready, result.State);
        Assert.True(result.IsReady);
    }

    [Fact]
    public void Parse_WhenOptionalComponentMissing_NeedsAttention()
    {
        var status = new DockerCommandResult(1, string.Empty, "Wsl/Service/CreateInstance/CreateVm/HCS/ERROR_VIRT_WSL_OPTIONAL_COMPONENT_REQUIRED");
        var list = new DockerCommandResult(1, string.Empty, "Wsl/Service/CreateInstance/CreateVm/HCS/ERROR_VIRT_WSL_OPTIONAL_COMPONENT_REQUIRED");

        var result = WslStatusChecker.Parse(status, list);

        Assert.Equal(WslInstallState.NeedsAttention, result.State);
        Assert.Contains("WSL optional component", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CheckAsync_WhenNotWindows_Skips()
    {
        var runner = new FakeProcessRunner();
        var checker = new WslStatusChecker(runner, isWindows: () => false);

        var result = await checker.CheckAsync();

        Assert.Equal(WslInstallState.Skipped, result.State);
        Assert.True(result.IsReady);
        Assert.Empty(runner.Calls);
    }
}

public class DockerDaemonCheckerTests
{
    [Fact]
    public async Task CheckAsync_WhenReady_PassesThrough()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue("docker", ["version"], new DockerCommandResult(0, "24.0.7\n", string.Empty));
        var docker = new DockerClient(runner, () => "docker");
        var checker = new DockerDaemonChecker(docker);

        var result = await checker.CheckAsync();

        Assert.True(result.IsReady);
        Assert.Equal("24.0.7", result.Version);
    }

    [Fact]
    public async Task CheckAsync_WhenDaemonDown_UsesFriendlyMessage()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue("docker", ["version"], new DockerCommandResult(1, string.Empty, "Cannot connect to the Docker daemon"));
        runner.Enqueue("docker", ["info"], new DockerCommandResult(1, string.Empty, "Cannot connect to the Docker daemon"));
        var docker = new DockerClient(runner, () => "docker");
        var checker = new DockerDaemonChecker(docker);

        var result = await checker.CheckAsync();

        Assert.Equal(DockerInstallState.InstalledButNotRunning, result.State);
        Assert.Contains("Docker Desktop is not running", result.Message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("npipe:", result.Message, StringComparison.OrdinalIgnoreCase);
    }
}

public class EnvironmentPreflightTests
{
    [Fact]
    public async Task EnsureReadyAsync_BlocksWhenDockerDown()
    {
        var runner = new FakeProcessRunner();
        // WSL skipped path via non-Windows checker — inject ready WSL + down Docker via custom preflight pieces.
        var wsl = new WslStatusChecker(runner, isWindows: () => false);
        runner.Enqueue("docker", ["version"], new DockerCommandResult(1, string.Empty, "Cannot connect to the Docker daemon"));
        runner.Enqueue("docker", ["info"], new DockerCommandResult(1, string.Empty, "error during connect"));
        var docker = new DockerClient(runner, () => "docker");
        var preflight = new EnvironmentPreflight(wsl, new DockerDaemonChecker(docker));

        var result = await preflight.EnsureReadyAsync();

        Assert.False(result.Ok);
        Assert.Contains("Docker Desktop is not running", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task EnsureReadyAsync_SucceedsWhenWslSkippedAndDockerReady()
    {
        var runner = new FakeProcessRunner();
        var wsl = new WslStatusChecker(runner, isWindows: () => false);
        runner.Enqueue("docker", ["version"], new DockerCommandResult(0, "25.0.0\n", string.Empty));
        var docker = new DockerClient(runner, () => "docker");
        var preflight = new EnvironmentPreflight(wsl, new DockerDaemonChecker(docker));

        var result = await preflight.EnsureReadyAsync();

        Assert.True(result.Ok);
        Assert.Contains("ready", result.Message, StringComparison.OrdinalIgnoreCase);
    }
}
