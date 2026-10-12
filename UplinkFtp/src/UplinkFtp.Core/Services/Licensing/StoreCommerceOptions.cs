using System;

namespace UplinkFtp.Services.Licensing;

/// <summary>
/// Configurable Microsoft Store product / add-on IDs.
/// Leave empty until Partner Center association — never invent production Store IDs in-repo.
/// </summary>
public sealed class StoreCommerceOptions
{
    /// <summary>
    /// Durable Pro add-on Store ID from Partner Center.
    /// Env: <c>UPLINK_STORE_PRO_ADDON_ID</c>.
    /// </summary>
    public string ProAddOnStoreId { get; set; } = ReadEnv("UPLINK_STORE_PRO_ADDON_ID");

    /// <summary>
    /// Optional app Store ID (listing / diagnostics only).
    /// Env: <c>UPLINK_STORE_APP_ID</c>.
    /// </summary>
    public string AppStoreId { get; set; } = ReadEnv("UPLINK_STORE_APP_ID");

    public bool HasProAddOnId => !string.IsNullOrWhiteSpace(ProAddOnStoreId);

    private static string ReadEnv(string name)
        => Environment.GetEnvironmentVariable(name)?.Trim() ?? string.Empty;
}
