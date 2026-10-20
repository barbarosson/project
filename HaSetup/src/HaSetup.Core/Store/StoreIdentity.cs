namespace HaSetup.Core.Store;

/// <summary>
/// Microsoft Store / Partner Center product identity for Container Manager for HA
/// (display name — not "Smart Home Assistant").
/// App Store ID is for listing / deep-links; durable IAP add-on id is separate
/// (<see cref="Licensing.StoreLicenseService.PremiumUnlockIdPlaceholder"/>).
/// <para>
/// Policy (2026-10-20): paid listing / paid IAP submission is <b>FROZEN</b> until the
/// product promise is fixed (HomeKit/mDNS gap). Keep these constants; do not delete identity.
/// </para>
/// </summary>
public static class StoreIdentity
{
    /// <summary>Package/Identity/Name from Partner Center.</summary>
    public const string PackageIdentityName = "MODULUSTECH.ContainerManagerforHA";

    /// <summary>Package/Identity/Publisher (CN=…).</summary>
    public const string Publisher = "CN=7E7A2323-C3C3-4A9A-A4D1-832D351FC4BA";

    /// <summary>Package/Properties/PublisherDisplayName.</summary>
    public const string PublisherDisplayName = "MODULUSTECH";

    /// <summary>Package Family Name (PFN).</summary>
    public const string PackageFamilyName = "MODULUSTECH.ContainerManagerforHA_6w2d1brm94m3m";

    /// <summary>App Store product id (listing), not the IAP add-on id.</summary>
    public const string AppStoreId = "9P1W6J8VRGCV";

    public const string StoreUrl = "https://apps.microsoft.com/detail/9P1W6J8VRGCV";

    public const string StoreProtocolUrl = "ms-windows-store://pdp/?productid=9P1W6J8VRGCV";

    /// <summary>Microsoft account (MSA) application id from Partner Center.</summary>
    public const string MsaAppId = "673fda9f-91a6-4ca3-aab5-247721360711";
}
