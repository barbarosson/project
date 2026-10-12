using System;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ai;

namespace UplinkFtp.Services.Settings;

/// <summary>User-facing application settings (timeouts, theme, privacy, AI BYOK metadata).</summary>
public sealed class AppSettings
{
    public TimeSpan ConnectTimeout { get; set; } = TimeSpan.FromSeconds(30);

    public TimeSpan ReadTimeout { get; set; } = TimeSpan.FromSeconds(60);

    public int RetryCount { get; set; } = 3;

    public TimeSpan RetryDelay { get; set; } = TimeSpan.FromSeconds(1);

    /// <summary>
    /// Named appearance: Orbit, Daybreak, Nightwatch, Harbor, Forge.
    /// Legacy System/Light/Dark values are migrated by ThemeCatalog.
    /// </summary>
    public string Theme { get; set; } = "Orbit";

    public RemoteProtocol DefaultProtocol { get; set; } = RemoteProtocol.Ftp;

    /// <summary>Opt-in telemetry. Default false — never enabled silently.</summary>
    public bool TelemetryOptIn { get; set; }

    /// <summary>FTPS accept-any-certificate. Default false for production safety.</summary>
    public bool AcceptAnyCertificate { get; set; }

    public bool UsePassive { get; set; } = true;

    /// <summary>BYOK LLM provider. API key itself lives in Credential Locker, not here.</summary>
    public AiProviderKind AiProvider { get; set; } = AiProviderKind.None;

    /// <summary>Optional model id (e.g. gpt-4o-mini). Empty → provider default.</summary>
    public string AiModel { get; set; } = string.Empty;

    /// <summary>Optional OpenAI-compatible endpoint override.</summary>
    public string AiEndpoint { get; set; } = string.Empty;
}
