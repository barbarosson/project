using System;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;

namespace UplinkFtp.Services.Privacy;

/// <summary>
/// Opt-in telemetry sink. No-op unless <see cref="IsEnabled"/> is true.
/// Never logs passwords, keys, license keys, or other secrets.
/// </summary>
public sealed class TelemetryService
{
    private static readonly string[] SecretTokens =
    [
        "password", "passwd", "secret", "token", "apikey", "api_key",
        "license", "privatekey", "private_key", "credential"
    ];

    private readonly ILogger<TelemetryService>? _logger;
    private bool _enabled;

    public TelemetryService(ILogger<TelemetryService>? logger = null, bool optedIn = false)
    {
        _logger = logger;
        _enabled = optedIn;
    }

    public bool IsEnabled => _enabled;

    public void SetOptIn(bool optedIn) => _enabled = optedIn;

    /// <summary>Records a named event when opted in. Properties are scrubbed for secrets.</summary>
    public void TrackEvent(string name, IReadOnlyDictionary<string, string>? properties = null)
    {
        if (!_enabled || string.IsNullOrWhiteSpace(name))
        {
            return;
        }

        if (_logger is null)
        {
            return;
        }

        if (properties is null || properties.Count == 0)
        {
            _logger.LogInformation("Telemetry event: {EventName}", name);
            return;
        }

        var safe = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (key, value) in properties)
        {
            if (LooksSecret(key) || LooksSecret(value))
            {
                continue;
            }

            safe[key] = value;
        }

        _logger.LogInformation("Telemetry event: {EventName} {@Properties}", name, safe);
    }

    public void TrackException(Exception exception, string? context = null)
    {
        if (!_enabled || exception is null || _logger is null)
        {
            return;
        }

        // Log type + context only — never exception messages that may contain paths/secrets.
        _logger.LogWarning(
            "Telemetry exception: {ExceptionType} context={Context}",
            exception.GetType().Name,
            context ?? string.Empty);
    }

    private static bool LooksSecret(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        foreach (var token in SecretTokens)
        {
            if (text.Contains(token, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
