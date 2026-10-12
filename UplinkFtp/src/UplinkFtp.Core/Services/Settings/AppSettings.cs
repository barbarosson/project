using System;
using UplinkFtp.Models.Enums;

namespace UplinkFtp.Services.Settings;

/// <summary>User-facing application settings (timeouts, theme, privacy defaults).</summary>
public sealed class AppSettings
{
    public TimeSpan ConnectTimeout { get; set; } = TimeSpan.FromSeconds(30);

    public TimeSpan ReadTimeout { get; set; } = TimeSpan.FromSeconds(60);

    public int RetryCount { get; set; } = 3;

    public TimeSpan RetryDelay { get; set; } = TimeSpan.FromSeconds(1);

    /// <summary>System, Light, or Dark.</summary>
    public string Theme { get; set; } = "System";

    public RemoteProtocol DefaultProtocol { get; set; } = RemoteProtocol.Ftp;

    /// <summary>Opt-in telemetry. Default false — never enabled silently.</summary>
    public bool TelemetryOptIn { get; set; }

    /// <summary>FTPS accept-any-certificate. Default false for production safety.</summary>
    public bool AcceptAnyCertificate { get; set; }

    public bool UsePassive { get; set; } = true;
}
