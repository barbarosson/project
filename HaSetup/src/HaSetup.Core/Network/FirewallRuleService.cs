using System.Diagnostics;
using System.Text;
using HaSetup.Core.Diagnostics;

namespace HaSetup.Core.Network;

/// <summary>
/// Adds Windows Firewall inbound allow rules via elevated PowerShell (UAC).
/// Free tier — no license gate.
/// </summary>
public sealed class FirewallRuleService : IFirewallRuleService
{
    public const string RuleGroup = "Container Manager for HA";
    public const string RulePrefix = "HaSetup";

    private readonly Func<string, string, bool, Task<ElevatedProcessResult>> _runElevated;
    private readonly Func<bool> _isWindows;

    public FirewallRuleService(
        Func<string, string, bool, Task<ElevatedProcessResult>>? runElevated = null,
        Func<bool>? isWindows = null)
    {
        _runElevated = runElevated ?? RunElevatedPowerShellAsync;
        _isWindows = isWindows ?? OperatingSystem.IsWindows;
    }

    public async Task<FirewallRuleResult> EnsureHaDiscoveryRulesAsync(CancellationToken cancellationToken = default)
    {
        if (!_isWindows())
        {
            return new FirewallRuleResult(
                false,
                "Firewall rules can only be added on Windows.",
                Detail: "Non-Windows host");
        }

        cancellationToken.ThrowIfCancellationRequested();

        var script = BuildRuleScript();
        string? tempPath = null;
        try
        {
            tempPath = Path.Combine(Path.GetTempPath(), $"hasetup-fw-{Guid.NewGuid():N}.ps1");
            await File.WriteAllTextAsync(tempPath, script, Encoding.UTF8, cancellationToken).ConfigureAwait(false);

            var args = $"-NoProfile -ExecutionPolicy Bypass -File \"{tempPath}\"";
            var result = await _runElevated("powershell.exe", args, true).ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                return new FirewallRuleResult(
                    true,
                    "Firewall rules added (or already present) for 8123/TCP, 5353/UDP, and 1900/UDP.",
                    Detail: FriendlyErrorHandler.FormatDetailForLog(result.CombinedOutput));
            }

            if (result.CancelledByUser || LooksLikeUacCancel(result.CombinedOutput))
            {
                return new FirewallRuleResult(
                    false,
                    "Firewall changes were cancelled. Approve the UAC prompt to add the rules, then try again.",
                    Detail: FriendlyErrorHandler.FormatDetailForLog(result.CombinedOutput));
            }

            return new FirewallRuleResult(
                false,
                FriendlyErrorHandler.ToUserMessage(
                    result.CombinedOutput,
                    "Could not add firewall rules."),
                Detail: FriendlyErrorHandler.FormatDetailForLog(result.CombinedOutput));
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return new FirewallRuleResult(
                false,
                FriendlyErrorHandler.ToUserMessage(ex, "Could not add firewall rules."),
                Detail: FriendlyErrorHandler.FormatDetailForLog(ex.Message));
        }
        finally
        {
            if (tempPath is not null)
            {
                try
                {
                    File.Delete(tempPath);
                }
                catch
                {
                    // ignore cleanup failures
                }
            }
        }
    }

    /// <summary>PowerShell that upserts the three inbound allow rules (idempotent by DisplayName).</summary>
    public static string BuildRuleScript()
    {
        // Display names are stable so re-runs remove+recreate cleanly.
        return $$"""
            $ErrorActionPreference = 'Stop'
            $group = '{{RuleGroup}}'
            function Set-HaRule {
              param([string]$Name, [string]$Protocol, [string]$LocalPort)
              $existing = Get-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue
              if ($existing) { Remove-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue | Out-Null }
              New-NetFirewallRule -DisplayName $Name -Direction Inbound -Action Allow -Protocol $Protocol -LocalPort $LocalPort -Profile Any -Group $group | Out-Null
              Write-Output "OK $Name"
            }
            Set-HaRule -Name '{{RulePrefix}} HA UI 8123 TCP' -Protocol TCP -LocalPort 8123
            Set-HaRule -Name '{{RulePrefix}} mDNS 5353 UDP' -Protocol UDP -LocalPort 5353
            Set-HaRule -Name '{{RulePrefix}} SSDP 1900 UDP' -Protocol UDP -LocalPort 1900
            Write-Output 'HaSetup firewall rules applied.'
            """;
    }

    public static IReadOnlyList<(string DisplayName, string Protocol, int Port)> ExpectedRules { get; } =
    [
        ($"{RulePrefix} HA UI 8123 TCP", "TCP", 8123),
        ($"{RulePrefix} mDNS 5353 UDP", "UDP", 5353),
        ($"{RulePrefix} SSDP 1900 UDP", "UDP", 1900),
    ];

    private static bool LooksLikeUacCancel(string? output) =>
        !string.IsNullOrWhiteSpace(output) &&
        (output.Contains("canceled by the user", StringComparison.OrdinalIgnoreCase) ||
         output.Contains("cancelled by the user", StringComparison.OrdinalIgnoreCase) ||
         output.Contains("The operation was canceled by the user", StringComparison.OrdinalIgnoreCase));

    private static Task<ElevatedProcessResult> RunElevatedPowerShellAsync(
        string fileName,
        string arguments,
        bool useShellExecute)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                UseShellExecute = useShellExecute,
                Verb = "runas",
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden,
            };

            using var process = Process.Start(psi);
            if (process is null)
            {
                return Task.FromResult(new ElevatedProcessResult(-1, string.Empty, "Failed to start elevated PowerShell.", CancelledByUser: false));
            }

            process.WaitForExit();
            return Task.FromResult(new ElevatedProcessResult(process.ExitCode, string.Empty, string.Empty, CancelledByUser: false));
        }
        catch (System.ComponentModel.Win32Exception ex) when (ex.NativeErrorCode == 1223)
        {
            // ERROR_CANCELLED — user dismissed UAC
            return Task.FromResult(new ElevatedProcessResult(1223, string.Empty, ex.Message, CancelledByUser: true));
        }
        catch (Exception ex)
        {
            return Task.FromResult(new ElevatedProcessResult(-1, string.Empty, ex.Message, CancelledByUser: false));
        }
    }
}

public sealed record ElevatedProcessResult(
    int ExitCode,
    string StandardOutput,
    string StandardError,
    bool CancelledByUser = false)
{
    public string CombinedOutput
    {
        get
        {
            if (string.IsNullOrWhiteSpace(StandardError))
            {
                return StandardOutput.Trim();
            }

            if (string.IsNullOrWhiteSpace(StandardOutput))
            {
                return StandardError.Trim();
            }

            return $"{StandardOutput.Trim()}\n{StandardError.Trim()}";
        }
    }
};
