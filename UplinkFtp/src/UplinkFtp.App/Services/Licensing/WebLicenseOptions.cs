namespace UplinkFtp.Services.Licensing;

/// <summary>
/// Web-channel license configuration.
/// Leave <see cref="ValidationBaseUrl"/> empty to use offline stub keys only.
/// </summary>
public sealed class WebLicenseOptions
{
    public const string ProductId = "UplinkFtp";

    /// <summary>
    /// REST base, e.g. <c>https://license.example.com</c>.
    /// Validate endpoint: <c>POST {base}/v1/licenses/validate</c>.
    /// </summary>
    public string? ValidationBaseUrl { get; init; }

    /// <summary>
    /// Offline / CI stub keys that grant Pro without a network call
    /// (e.g. <c>UPLINK-PRO</c>). Never ship production secrets here.
    /// </summary>
    public string[] StubProKeys { get; init; } = ["UPLINK-PRO", "UPLINK-PRO-DEV"];

    /// <summary>Optional license key injected at startup (env / installer).</summary>
    public string? InitialLicenseKey { get; init; }
}
