using HaSetup.Core.Backup;
using HaSetup.Core.Diagnostics;
using HaSetup.Core.Docker;
using HaSetup.Core.HomeAssistant;
using HaSetup.Core.Licensing;
using HaSetup.Core.Network;

namespace HaSetup.Core.Tests;

public class NetworkDiscoveryGuidanceTests
{
    [Fact]
    public void Guidance_ContainsDiscoveryAndManualIpHelp()
    {
        Assert.Contains("WSL2", NetworkDiscoveryGuidance.WhyAutoDiscoveryFails, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Hue", NetworkDiscoveryGuidance.ManualIpGuideBody, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("8123", NetworkDiscoveryGuidance.FirewallSectionBody, StringComparison.Ordinal);
        Assert.Contains("Experimental", NetworkDiscoveryGuidance.MdnsSectionTitle, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Premium", NetworkDiscoveryGuidance.MdnsSectionTitle, StringComparison.OrdinalIgnoreCase);
    }
}

public class FirewallRuleServiceTests
{
    [Fact]
    public void BuildRuleScript_IncludesRequiredPortsAndProtocols()
    {
        var script = FirewallRuleService.BuildRuleScript();

        Assert.Contains("8123", script, StringComparison.Ordinal);
        Assert.Contains("5353", script, StringComparison.Ordinal);
        Assert.Contains("1900", script, StringComparison.Ordinal);
        Assert.Contains("TCP", script, StringComparison.Ordinal);
        Assert.Contains("UDP", script, StringComparison.Ordinal);
        Assert.Contains(FirewallRuleService.RuleGroup, script, StringComparison.Ordinal);
        Assert.Equal(3, FirewallRuleService.ExpectedRules.Count);
    }

    [Fact]
    public async Task EnsureHaDiscoveryRulesAsync_WhenElevatedSucceeds_ReturnsSuccess()
    {
        var service = new FirewallRuleService(
            runElevated: (_, _, _) => Task.FromResult(new ElevatedProcessResult(0, "HaSetup firewall rules applied.", string.Empty)),
            isWindows: () => true);

        var result = await service.EnsureHaDiscoveryRulesAsync();

        Assert.True(result.Succeeded);
        Assert.Contains("Firewall rules added", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task EnsureHaDiscoveryRulesAsync_WhenUacCancelled_UsesFriendlyMessage()
    {
        var service = new FirewallRuleService(
            runElevated: (_, _, _) => Task.FromResult(
                new ElevatedProcessResult(1223, string.Empty, "The operation was canceled by the user.", CancelledByUser: true)),
            isWindows: () => true);

        var result = await service.EnsureHaDiscoveryRulesAsync();

        Assert.False(result.Succeeded);
        Assert.Contains("UAC", result.Message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("NativeErrorCode", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task EnsureHaDiscoveryRulesAsync_WhenNotWindows_FailsFriendly()
    {
        var service = new FirewallRuleService(
            runElevated: (_, _, _) => throw new InvalidOperationException("should not run"),
            isWindows: () => false);

        var result = await service.EnsureHaDiscoveryRulesAsync();

        Assert.False(result.Succeeded);
        Assert.Contains("Windows", result.Message, StringComparison.OrdinalIgnoreCase);
    }
}

public class DevLicenseServiceTests
{
    [Fact]
    public async Task PurchaseAsync_EnablesPremiumSimulation()
    {
        var license = new DevLicenseService(simulatePremium: false);
        Assert.False(license.IsPremium);

        var result = await license.PurchaseAsync();

        Assert.True(result.Succeeded);
        Assert.True(license.IsPremium);
        Assert.Contains("simulated", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void SetSimulatePremium_RaisesChanged()
    {
        var license = new DevLicenseService(false);
        var raised = 0;
        license.Changed += (_, _) => raised++;

        license.SetSimulatePremium(true);
        license.SetSimulatePremium(true); // no-op

        Assert.True(license.IsPremium);
        Assert.Equal(1, raised);
    }
}

public class StoreLicenseServiceTests
{
    [Fact]
    public void PremiumUnlockId_IsPlaceholderConst()
    {
        Assert.Equal("PREMIUM_UNLOCK_ID_PLACEHOLDER", StoreLicenseService.PremiumUnlockIdPlaceholder);
    }

    [Fact]
    public async Task PurchaseAsync_WithUnavailableClient_ReturnsFriendlyFailure()
    {
        var license = new StoreLicenseService(new UnavailableStorePurchaseClient());

        var result = await license.PurchaseAsync();

        Assert.False(result.Succeeded);
        Assert.False(license.IsPremium);
        Assert.Contains("PREMIUM_UNLOCK_ID_PLACEHOLDER", result.Message, StringComparison.Ordinal);
        Assert.DoesNotContain("Exception", result.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task PurchaseAsync_WhenStoreClientSucceeds_SetsPremium()
    {
        var license = new StoreLicenseService(new FakeStoreClient(owned: false, purchaseOk: true));

        var result = await license.PurchaseAsync();

        Assert.True(result.Succeeded);
        Assert.True(license.IsPremium);
    }

    [Fact]
    public async Task RefreshAsync_ReadsOwnership()
    {
        var license = new StoreLicenseService(new FakeStoreClient(owned: true, purchaseOk: false));
        await license.RefreshAsync();
        Assert.True(license.IsPremium);
    }

    private sealed class FakeStoreClient(bool owned, bool purchaseOk) : IStorePurchaseClient
    {
        public Task<bool> IsPremiumOwnedAsync(string productId, CancellationToken cancellationToken = default) =>
            Task.FromResult(owned);

        public Task<StoreClientResult> RequestPurchaseAsync(string productId, CancellationToken cancellationToken = default) =>
            Task.FromResult(new StoreClientResult(purchaseOk, purchaseOk ? "ok" : "no"));
    }
}

public class ConfigVolumeBackupServiceTests
{
    [Fact]
    public void ToDockerHostPath_NormalizesSeparatorsOnWindowsStylePath()
    {
        var path = ConfigVolumeBackupService.ToDockerHostPath("/tmp/backup-test");
        Assert.False(string.IsNullOrWhiteSpace(path));
        Assert.Contains("backup-test", path, StringComparison.Ordinal);
    }

    [Fact]
    public async Task BackupToZipAsync_WhenVolumeMissing_ReturnsFriendlyError()
    {
        var runner = new FakeProcessRunner();
        runner.Enqueue("docker", ["volume", "inspect"], new DockerCommandResult(1, string.Empty, "Error: No such volume: smart-home-ha-config"));
        var docker = new DockerClient(runner, () => "docker");
        var backup = new ConfigVolumeBackupService(docker);
        var zip = Path.Combine(Path.GetTempPath(), $"hasetup-test-{Guid.NewGuid():N}.zip");

        var result = await backup.BackupToZipAsync(zip);

        Assert.False(result.Succeeded);
        Assert.Contains("Config volume was not found", result.Message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Error: No such volume", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task BackupToZipAsync_WhenDockerSucceeds_WritesArchivePathMessage()
    {
        var zip = Path.Combine(Path.GetTempPath(), $"hasetup-ok-{Guid.NewGuid():N}.zip");
        try
        {
            var runner = new FakeProcessRunner();
            runner.Enqueue("docker", ["volume", "inspect"], new DockerCommandResult(0, "[{}]", string.Empty));
            runner.Enqueue("docker", ["pull"], new DockerCommandResult(0, "pulled", string.Empty));
            runner.Enqueue(
                "docker",
                ["run"],
                new DockerCommandResult(0, "ok", string.Empty));
            // Simulate helper writing the archive
            await File.WriteAllTextAsync(zip, "fake-archive");

            var docker = new DockerClient(runner, () => "docker");
            var backup = new ConfigVolumeBackupService(docker);

            var result = await backup.BackupToZipAsync(zip);

            Assert.True(result.Succeeded);
            Assert.Contains(zip, result.Message, StringComparison.Ordinal);
            Assert.Equal(HaConstants.VolumeName, "smart-home-ha-config");
        }
        finally
        {
            if (File.Exists(zip))
            {
                File.Delete(zip);
            }
        }
    }

    [Fact]
    public async Task RestoreFromZipAsync_WhenFileMissing_FailsFriendly()
    {
        var runner = new FakeProcessRunner();
        var docker = new DockerClient(runner, () => "docker");
        var backup = new ConfigVolumeBackupService(docker);

        var result = await backup.RestoreFromZipAsync(Path.Combine(Path.GetTempPath(), "does-not-exist-hasetup.zip"));

        Assert.False(result.Succeeded);
        Assert.Contains("not found", result.Message, StringComparison.OrdinalIgnoreCase);
    }
}

public class MdnsForwarderHostedServiceTests
{
    [Fact]
    public void Default_IsOff()
    {
        var svc = new MdnsForwarderHostedService();
        Assert.False(svc.IsEnabled);
        Assert.False(svc.IsRunning);
        Assert.False(MdnsForwarderHostedService.DefaultEnabled);
        Assert.Contains("off", svc.StatusText, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SetEnabledAsync_WithoutPremium_StaysLocked()
    {
        var svc = new MdnsForwarderHostedService();
        var result = await svc.SetEnabledAsync(true, isPremium: false);

        Assert.False(result.Succeeded);
        Assert.False(svc.IsEnabled);
        Assert.Contains("Premium", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SetEnabledAsync_WithPremium_ArmsSkeleton()
    {
        var svc = new MdnsForwarderHostedService(resolveScriptPath: () => null);
        var result = await svc.SetEnabledAsync(true, isPremium: true);

        Assert.True(result.Succeeded);
        Assert.True(svc.IsEnabled);
        Assert.True(svc.IsRunning);
        Assert.Contains("skeleton", result.Message, StringComparison.OrdinalIgnoreCase);
    }
}

public class FriendlyFirewallPatternTests
{
    [Fact]
    public void UacCancel_MapsToFriendlyMessage()
    {
        var message = FriendlyErrorHandler.ToUserMessage("The operation was canceled by the user");
        Assert.Contains("UAC", message, StringComparison.OrdinalIgnoreCase);
    }
}
