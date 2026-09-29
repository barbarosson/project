using HaSetup.Core.Docker;
using HaSetup.Core.HomeAssistant;

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
        Assert.Contains("Docker Desktop", result.MessageTr, StringComparison.OrdinalIgnoreCase);
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
        Assert.Contains("çalışmıyor", result.MessageTr, StringComparison.OrdinalIgnoreCase);
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
    public async Task CreateAndStartAsync_WhenPortBusy_ThrowsTurkishHint()
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
        Assert.Contains("kullanımda", ex.Message, StringComparison.OrdinalIgnoreCase);
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
        Assert.Contains("Erişilemiyor", result.MessageTr, StringComparison.OrdinalIgnoreCase);
    }
}
