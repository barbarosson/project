using HaSetup.Core.Docker;

namespace HaSetup.Core.Diagnostics;

/// <summary>
/// Best-effort WSL probe for Docker Desktop on Windows (wsl.exe --status / --list --verbose).
/// </summary>
public sealed class WslStatusChecker
{
    private readonly IProcessRunner _runner;
    private readonly Func<bool> _isWindows;

    public WslStatusChecker(IProcessRunner? runner = null, Func<bool>? isWindows = null)
    {
        _runner = runner ?? new ProcessRunner();
        _isWindows = isWindows ?? OperatingSystem.IsWindows;
    }

    public async Task<WslStatus> CheckAsync(CancellationToken cancellationToken = default)
    {
        if (!_isWindows())
        {
            return new WslStatus(
                WslInstallState.Skipped,
                "WSL check skipped (not Windows).",
                Detail: null);
        }

        var status = await _runner.RunAsync("wsl.exe", ["--status"], cancellationToken).ConfigureAwait(false);
        var list = await _runner.RunAsync("wsl.exe", ["--list", "--verbose"], cancellationToken).ConfigureAwait(false);

        return Parse(status, list);
    }

    /// <summary>
    /// Pure parse helper for unit tests (no process launch).
    /// </summary>
    public static WslStatus Parse(DockerCommandResult statusResult, DockerCommandResult listResult)
    {
        var combined = JoinOutputs(statusResult, listResult);

        if (LooksLikeWslMissing(statusResult, listResult, combined))
        {
            return new WslStatus(
                WslInstallState.NotInstalled,
                "WSL was not found. Docker Desktop on Windows needs WSL 2. Install WSL, reboot if asked, then open Docker Desktop.",
                Detail: FriendlyErrorHandler.FormatDetailForLog(combined));
        }

        if (ErrorPatternCatalog.Match(combined) is { } patterned &&
            (combined.Contains("wsl", StringComparison.OrdinalIgnoreCase) ||
             combined.Contains("optional component", StringComparison.OrdinalIgnoreCase)))
        {
            return new WslStatus(
                WslInstallState.NeedsAttention,
                patterned,
                Detail: FriendlyErrorHandler.FormatDetailForLog(combined));
        }

        if (listResult.Succeeded || statusResult.Succeeded)
        {
            if (HasRunningOrStoppedDistro(listResult.StandardOutput + "\n" + listResult.StandardError) ||
                StatusLooksHealthy(statusResult))
            {
                return new WslStatus(
                    WslInstallState.Ready,
                    "WSL looks available for Docker Desktop.",
                    Detail: FriendlyErrorHandler.FormatDetailForLog(combined));
            }
        }

        if (!string.IsNullOrWhiteSpace(combined))
        {
            return new WslStatus(
                WslInstallState.NeedsAttention,
                FriendlyErrorHandler.ToUserMessage(
                    combined,
                    "WSL may need attention before Docker can run."),
                Detail: FriendlyErrorHandler.FormatDetailForLog(combined));
        }

        return new WslStatus(
            WslInstallState.Unknown,
            "Could not determine WSL status. If Docker Desktop fails to start, install or repair WSL 2.",
            Detail: null);
    }

    private static bool LooksLikeWslMissing(
        DockerCommandResult statusResult,
        DockerCommandResult listResult,
        string combined)
    {
        if (combined.Contains("not recognized", StringComparison.OrdinalIgnoreCase) ||
            combined.Contains("cannot find the file", StringComparison.OrdinalIgnoreCase) ||
            combined.Contains("Win32Exception", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // ProcessRunner returns exit -1 + message when CreateProcess fails.
        if (statusResult.ExitCode == -1 && listResult.ExitCode == -1)
        {
            return true;
        }

        return false;
    }

    private static bool StatusLooksHealthy(DockerCommandResult statusResult)
    {
        var text = statusResult.CombinedOutput;
        return statusResult.Succeeded &&
               (text.Contains("Default Version", StringComparison.OrdinalIgnoreCase) ||
                text.Contains("Default Distribution", StringComparison.OrdinalIgnoreCase) ||
                text.Contains("2", StringComparison.Ordinal));
    }

    private static bool HasRunningOrStoppedDistro(string listOutput)
    {
        if (string.IsNullOrWhiteSpace(listOutput))
        {
            return false;
        }

        // Typical: NAME STATE VERSION — look for Running/Stopped and version 2.
        return listOutput.Contains("Running", StringComparison.OrdinalIgnoreCase) ||
               listOutput.Contains("Stopped", StringComparison.OrdinalIgnoreCase);
    }

    private static string JoinOutputs(DockerCommandResult statusResult, DockerCommandResult listResult)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(statusResult.CombinedOutput))
        {
            parts.Add(statusResult.CombinedOutput.Trim());
        }

        if (!string.IsNullOrWhiteSpace(listResult.CombinedOutput))
        {
            parts.Add(listResult.CombinedOutput.Trim());
        }

        return string.Join("\n", parts);
    }
}
