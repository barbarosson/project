using HaSetup.Core.Diagnostics;

namespace HaSetup.Core.Network;

/// <summary>
/// Premium / Experimental skeleton: host→WSL mDNS UDP forwarder lifecycle.
/// Default off. Does not start forwarding until <see cref="StartAsync"/> is called with Premium unlocked.
/// </summary>
public sealed class MdnsForwarderHostedService : IAsyncDisposable
{
    public const bool DefaultEnabled = false;

    private readonly Func<string, IReadOnlyList<string>, CancellationToken, Task<MdnsForwarderProcessResult>> _run;
    private readonly Func<string?> _resolveScriptPath;
    private bool _running;
    private bool _enabled;

    public MdnsForwarderHostedService(
        Func<string, IReadOnlyList<string>, CancellationToken, Task<MdnsForwarderProcessResult>>? run = null,
        Func<string?>? resolveScriptPath = null)
    {
        _run = run ?? DefaultRunAsync;
        _resolveScriptPath = resolveScriptPath ?? ResolveDefaultScriptPath;
        _enabled = DefaultEnabled;
    }

    public bool IsEnabled => _enabled;

    public bool IsRunning => _running;

    public string StatusText { get; private set; } = "mDNS helper is off (default).";

    /// <summary>
    /// Enable or disable the experimental helper. Caller must enforce Premium before enabling.
    /// </summary>
    public async Task<MdnsForwarderResult> SetEnabledAsync(
        bool enabled,
        bool isPremium,
        CancellationToken cancellationToken = default)
    {
        if (enabled && !isPremium)
        {
            _enabled = false;
            StatusText = "mDNS helper is Premium-locked. Unlock Premium to enable this experimental feature.";
            return new MdnsForwarderResult(false, StatusText);
        }

        if (!enabled)
        {
            _enabled = false;
            await StopCoreAsync(cancellationToken).ConfigureAwait(false);
            StatusText = "mDNS helper is off.";
            return new MdnsForwarderResult(true, StatusText);
        }

        _enabled = true;
        return await StartAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<MdnsForwarderResult> StartAsync(CancellationToken cancellationToken = default)
    {
        if (!_enabled)
        {
            StatusText = "mDNS helper is off (default). Enable the Experimental toggle first.";
            return new MdnsForwarderResult(false, StatusText);
        }

        if (_running)
        {
            StatusText = "mDNS helper is already running (skeleton).";
            return new MdnsForwarderResult(true, StatusText);
        }

        try
        {
            var script = _resolveScriptPath();
            if (string.IsNullOrWhiteSpace(script) || !File.Exists(script))
            {
                // Skeleton: mark as "armed" without a live forwarder process when script is missing in pack layout.
                _running = true;
                StatusText =
                    "mDNS helper armed (experimental skeleton). Script not found beside the app — " +
                    "see scripts/mdns-udp-forward.ps1. No packets are forwarded yet.";
                return new MdnsForwarderResult(true, StatusText);
            }

            var result = await _run(
                "powershell.exe",
                ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-Mode", "start"],
                cancellationToken).ConfigureAwait(false);

            if (!result.Succeeded)
            {
                _running = false;
                StatusText = FriendlyErrorHandler.ToUserMessage(
                    result.CombinedOutput,
                    "Could not start mDNS helper.");
                return new MdnsForwarderResult(
                    false,
                    StatusText,
                    FriendlyErrorHandler.FormatDetailForLog(result.CombinedOutput));
            }

            _running = true;
            StatusText = "mDNS helper started (experimental skeleton).";
            return new MdnsForwarderResult(true, StatusText);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _running = false;
            StatusText = FriendlyErrorHandler.ToUserMessage(ex, "Could not start mDNS helper.");
            return new MdnsForwarderResult(false, StatusText, FriendlyErrorHandler.FormatDetailForLog(ex.Message));
        }
    }

    public async Task StopAsync(CancellationToken cancellationToken = default)
    {
        _enabled = false;
        await StopCoreAsync(cancellationToken).ConfigureAwait(false);
        StatusText = "mDNS helper is off.";
    }

    public ValueTask DisposeAsync() => new(StopAsync());

    private async Task StopCoreAsync(CancellationToken cancellationToken)
    {
        if (!_running)
        {
            return;
        }

        try
        {
            var script = _resolveScriptPath();
            if (!string.IsNullOrWhiteSpace(script) && File.Exists(script))
            {
                await _run(
                    "powershell.exe",
                    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-Mode", "stop"],
                    cancellationToken).ConfigureAwait(false);
            }
        }
        catch
        {
            // Best-effort stop for skeleton.
        }
        finally
        {
            _running = false;
        }
    }

    private static string? ResolveDefaultScriptPath()
    {
        var baseDir = AppContext.BaseDirectory;
        var candidates = new[]
        {
            Path.Combine(baseDir, "scripts", "mdns-udp-forward.ps1"),
            Path.Combine(baseDir, "..", "..", "..", "..", "scripts", "mdns-udp-forward.ps1"),
            Path.Combine(Directory.GetCurrentDirectory(), "scripts", "mdns-udp-forward.ps1"),
        };

        foreach (var path in candidates)
        {
            try
            {
                var full = Path.GetFullPath(path);
                if (File.Exists(full))
                {
                    return full;
                }
            }
            catch
            {
                // ignore
            }
        }

        return null;
    }

    private static Task<MdnsForwarderProcessResult> DefaultRunAsync(
        string fileName,
        IReadOnlyList<string> arguments,
        CancellationToken cancellationToken)
    {
        // Skeleton default: do not spawn real processes in unit tests / non-Windows CI.
        _ = fileName;
        _ = arguments;
        _ = cancellationToken;
        return Task.FromResult(new MdnsForwarderProcessResult(0, "skeleton-noop", string.Empty));
    }
}

public sealed record MdnsForwarderResult(bool Succeeded, string Message, string? Detail = null);

public sealed record MdnsForwarderProcessResult(int ExitCode, string StandardOutput, string StandardError)
{
    public bool Succeeded => ExitCode == 0;

    public string CombinedOutput =>
        string.IsNullOrWhiteSpace(StandardError)
            ? StandardOutput.Trim()
            : string.IsNullOrWhiteSpace(StandardOutput)
                ? StandardError.Trim()
                : $"{StandardOutput.Trim()}\n{StandardError.Trim()}";
}
