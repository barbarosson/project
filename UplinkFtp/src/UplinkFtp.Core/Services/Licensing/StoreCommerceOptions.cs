using System;

namespace UplinkFtp.Services.Licensing;

/// <summary>
/// Configurable Microsoft Store product / add-on IDs.
/// Defaults match Partner Center public Store IDs; override via env when needed.
/// </summary>
public sealed class StoreCommerceOptions
{
    /// <summary>Partner Center app Store ID (listing). Override with <c>UPLINK_STORE_APP_ID</c>.</summary>
    public const string DefaultAppStoreId = "9MZKMN2ZH0DG";

    /// <summary>Durable Pro add-on Store ID. Override with <c>UPLINK_STORE_PRO_ADDON_ID</c>.</summary>
    public const string DefaultProAddOnStoreId = "9MTN64PZGQCM";

    /// <summary>
    /// Durable Pro add-on Store ID from Partner Center.
    /// Env: <c>UPLINK_STORE_PRO_ADDON_ID</c>; defaults to <see cref="DefaultProAddOnStoreId"/>.
    /// </summary>
    public string ProAddOnStoreId { get; set; } = ReadEnvOrDefault("UPLINK_STORE_PRO_ADDON_ID", DefaultProAddOnStoreId);

    /// <summary>
    /// App Store ID (listing / diagnostics / PDP link).
    /// Env: <c>UPLINK_STORE_APP_ID</c>; defaults to <see cref="DefaultAppStoreId"/>.
    /// </summary>
    public string AppStoreId { get; set; } = ReadEnvOrDefault("UPLINK_STORE_APP_ID", DefaultAppStoreId);

    public bool HasProAddOnId => !string.IsNullOrWhiteSpace(ProAddOnStoreId);

    public bool HasAppStoreId => !string.IsNullOrWhiteSpace(AppStoreId);

    /// <summary>Public Store PDP deep link for the app listing.</summary>
    public string StoreProtocolUrl =>
        HasAppStoreId
            ? $"ms-windows-store://pdp/?productid={AppStoreId.Trim()}"
            : string.Empty;

    private static string ReadEnv(string name)
        => Environment.GetEnvironmentVariable(name)?.Trim() ?? string.Empty;

    private static string ReadEnvOrDefault(string name, string defaultValue)
    {
        var value = ReadEnv(name);
        return string.IsNullOrWhiteSpace(value) ? defaultValue : value;
    }
}
