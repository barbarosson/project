using HaSetup.Core;
using HaSetup.Core.Docker;
using HaSetup.Core.HomeAssistant;
using HaSetup.Core.Windows;

namespace HaSetup.Core.Tests;

internal sealed class FakeProcessRunner : IProcessRunner
{
    private readonly Queue<(string File, string[] Args, DockerCommandResult Result)> _scripted = new();

    public List<(string File, IReadOnlyList<string> Args)> Calls { get; } = new();

    public void Enqueue(string file, string[] argsContain, DockerCommandResult result)
    {
        _scripted.Enqueue((file, argsContain, result));
    }

    public void EnqueueSuccess(params string[] argsContain) =>
        Enqueue("docker", argsContain, new DockerCommandResult(0, "ok\n", string.Empty));

    public Task<DockerCommandResult> RunAsync(
        string fileName,
        IReadOnlyList<string> arguments,
        CancellationToken cancellationToken = default,
        string? workingDirectory = null)
    {
        Calls.Add((fileName, arguments));

        if (_scripted.Count == 0)
        {
            return Task.FromResult(new DockerCommandResult(1, string.Empty, "no scripted response"));
        }

        var next = _scripted.Dequeue();
        return Task.FromResult(next.Result);
    }
}

public class DockerClientTests
{
    [Fact]
    public async Task ProbeAsync_WhenDockerMissing_ReturnsCliMissing()
    {
        var runner = new FakeProcessRunner();
        var client = new DockerClient(runner, resolveDockerPath: () => null);

        var result = await client.ProbeAsync();

        Assert.Equal(DockerInstallState.CliMissing, result.State);
        Assert.False(result.IsReady);
        Assert.Contains("Docker Desktop", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProbeAsync_WhenServerVersionOk_ReturnsReady()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue("docker", ["version"], new DockerCommandResult(0, "24.0.7\n", string.Empty));
        var client = new DockerClient(runner, resolveDockerPath: () => "docker");

        var result = await client.ProbeAsync();

        Assert.True(result.IsReady);
        Assert.Equal("24.0.7", result.Version);
    }

    [Fact]
    public async Task ProbeAsync_WhenDaemonDown_ReturnsInstalledButNotRunning()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue("docker", ["version"], new DockerCommandResult(1, string.Empty, "Cannot connect to the Docker daemon"));
        runner.Enqueue("docker", ["info"], new DockerCommandResult(1, string.Empty, "error during connect"));
        var client = new DockerClient(runner, resolveDockerPath: () => "docker");

        var result = await client.ProbeAsync();

        Assert.Equal(DockerInstallState.InstalledButNotRunning, result.State);
        Assert.Contains("Docker Desktop is not running", result.Message, StringComparison.OrdinalIgnoreCase);
    }
}

public class HaContainerServiceTests
{
    [Fact]
    public async Task GetInfoAsync_WhenMissing_ReturnsNotCreated()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue("docker", ["inspect"], new DockerCommandResult(1, string.Empty, "Error: No such object: smart-home-ha"));
        var docker = new DockerClient(runner, () => "docker");
        var service = new HaContainerService(docker);

        var info = await service.GetInfoAsync();

        Assert.False(info.Exists);
        Assert.Equal(HaLifecycleState.NotCreated, info.State);
    }

    [Fact]
    public async Task GetInfoAsync_WhenRunning_ParsesInspect()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue(
            "docker",
            ["inspect"],
            new DockerCommandResult(0, "abcdef1234567890|running|homeassistant/home-assistant:stable|true\n", string.Empty));
        var docker = new DockerClient(runner, () => "docker");
        var service = new HaContainerService(docker);

        var info = await service.GetInfoAsync();

        Assert.True(info.Exists);
        Assert.Equal(HaLifecycleState.Running, info.State);
        Assert.Equal("abcdef123456", info.ContainerId);
        Assert.Equal(HaConstants.Image, info.Image);
    }

    [Fact]
    public async Task CreateAndStartAsync_WhenMissing_CreatesWithPortAndVolume()
    {
        var runner = new FakeProcessRunner();
        // GetInfo -> missing
        runner.Enqueue("docker", ["inspect"], new DockerCommandResult(1, string.Empty, "No such object"));
        // EnsureVolume inspect fail -> create
        runner.Enqueue("docker", ["volume", "inspect"], new DockerCommandResult(1, string.Empty, "missing"));
        runner.Enqueue("docker", ["volume", "create"], new DockerCommandResult(0, HaConstants.VolumeName + "\n", string.Empty));
        // Pull
        runner.Enqueue("docker", ["pull"], new DockerCommandResult(0, "Pulled\n", string.Empty));
        // Create
        runner.Enqueue("docker", ["create"], new DockerCommandResult(0, "newid\n", string.Empty));
        // Start
        runner.Enqueue("docker", ["start"], new DockerCommandResult(0, HaConstants.ContainerName + "\n", string.Empty));

        var docker = new DockerClient(runner, () => "docker");
        var service = new HaContainerService(docker);

        await service.CreateAndStartAsync();

        var createCall = runner.Calls.First(c => c.Args.Count > 0 && c.Args[0] == "create");
        Assert.Contains(HaConstants.ContainerName, createCall.Args);
        Assert.Contains($"{HaConstants.HostPort}:{HaConstants.ContainerPort}", createCall.Args);
        Assert.Contains($"{HaConstants.VolumeName}:{HaConstants.ConfigMount}", createCall.Args);
        Assert.Contains(HaConstants.Image, createCall.Args);
        Assert.Contains("--restart", createCall.Args);
    }

    [Fact]
    public async Task CreateAndStartAsync_WhenAlreadyRunning_IsNoOp()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue(
            "docker",
            ["inspect"],
            new DockerCommandResult(0, "id|running|homeassistant/home-assistant:stable|true\n", string.Empty));
        var docker = new DockerClient(runner, () => "docker");
        var service = new HaContainerService(docker);

        await service.CreateAndStartAsync();

        Assert.Single(runner.Calls);
    }

    [Fact]
    public async Task CreateAndStartAsync_WhenPortBusy_ThrowsEnglishHint()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue("docker", ["inspect"], new DockerCommandResult(1, string.Empty, "No such object"));
        runner.Enqueue("docker", ["volume", "inspect"], new DockerCommandResult(0, "ok\n", string.Empty));
        runner.Enqueue("docker", ["pull"], new DockerCommandResult(0, "Pulled\n", string.Empty));
        runner.Enqueue(
            "docker",
            ["create"],
            new DockerCommandResult(1, string.Empty, "Bind for 0.0.0.0:8123 failed: port is already allocated"));

        var docker = new DockerClient(runner, () => "docker");
        var service = new HaContainerService(docker);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAndStartAsync());
        Assert.Contains("Port 8123", ex.Message, StringComparison.Ordinal);
        Assert.Contains("already in use", ex.Message, StringComparison.OrdinalIgnoreCase);
        // FriendlyErrorHandler must not dump raw docker stderr as the primary line.
        Assert.DoesNotContain("Bind for", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PullImageAsync_ReportsEnglishProgress()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue("docker", ["pull"], new DockerCommandResult(0, "Pulled\n", string.Empty));
        var docker = new DockerClient(runner, () => "docker");
        var service = new HaContainerService(docker);
        var lines = new List<string>();
        var progress = new Progress<string>(lines.Add);

        await service.PullImageAsync(progress: progress);

        Assert.Contains(lines, l => l.Contains("Pulling image:", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(lines, l => l.Contains(HaConstants.Image, StringComparison.Ordinal));
        Assert.Contains(lines, l => l.Contains("Image ready", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Constants_MatchMvpContract()
    {
        Assert.Equal("homeassistant/home-assistant:stable", HaConstants.Image);
        Assert.Equal(8123, HaConstants.HostPort);
        Assert.Equal("http://localhost:8123", HaConstants.LocalUrl);
        Assert.Equal("smart-home-ha-config", HaConstants.VolumeName);
    }
}

public class HaHealthCheckerTests
{
    [Fact]
    public async Task CheckAsync_WhenConnectionRefused_ReturnsUnreachable()
    {
        var checker = new HaHealthChecker();
        // Unlikely-open high port on localhost
        var result = await checker.CheckAsync(new Uri("http://127.0.0.1:59999"), TimeSpan.FromSeconds(1));

        Assert.False(result.IsReachable);
        Assert.Contains("Unreachable", result.Message, StringComparison.OrdinalIgnoreCase);
    }
}

public class AppChannelAndStoreGuidanceTests
{
    [Fact]
    public void AppChannel_SilentInstall_MatchesStoreFlag()
    {
        Assert.Equal(!AppChannel.IsStoreBuild, AppChannel.AllowsSilentDockerInstall);
        Assert.False(string.IsNullOrWhiteSpace(AppChannel.ChannelLabel));
    }

    [Fact]
    public void RequirementDisclosure_MentionsDockerSeparate()
    {
        Assert.Contains("Docker Desktop", DockerDesktopGuidance.RequirementDisclosure, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("does not install Docker", DockerDesktopGuidance.RequirementDisclosure, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void EnglishNextSteps_AreEnglish()
    {
        Assert.Contains("Next steps", EnglishNextSteps.Title, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("localhost:8123", EnglishNextSteps.Body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Sonraki", EnglishNextSteps.Title, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void StoreDeepLink_UsesDockerDesktopProductId()
    {
        Assert.Contains("XP8CBJ40XLBWKX", DockerDesktopGuidance.MicrosoftStoreDeepLink, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("xp8cbj40xlbwkx", DockerDesktopGuidance.MicrosoftStoreWebUrl, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TrySilentInstall_RespectsStoreChannel()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue("winget", ["install"], new DockerCommandResult(1, string.Empty, "winget missing"));
        var message = await DockerDesktopGuidance.TrySilentInstallAsync(runner);
        var storeBlock = "This Microsoft Store build does not install Docker Desktop";
        Assert.Equal(AppChannel.IsStoreBuild, message.Contains(storeBlock, StringComparison.Ordinal));
    }
}
