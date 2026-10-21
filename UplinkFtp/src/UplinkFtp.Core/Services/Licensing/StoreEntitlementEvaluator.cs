namespace UplinkFtp.Services.Licensing;

/// <summary>Pure Free/Pro decision for Store app + durable add-on licenses (unit-tested).</summary>
public static class StoreEntitlementEvaluator
{
    /// <summary>
    /// Freemium rule: when a Pro add-on Store ID is configured, only that add-on grants Pro.
    /// Free Store apps report <c>IsActive=true</c> and <c>IsTrial=false</c> — that must stay Free.
    /// Without an add-on ID (legacy paid-app SKU), a non-trial active app license is Pro.
    /// </summary>
    public static LicenseTier Evaluate(
        bool appLicenseActive,
        bool appLicenseIsTrial,
        bool proAddOnConfigured,
        bool proAddOnActive)
    {
        if (proAddOnConfigured)
        {
            return proAddOnActive ? LicenseTier.Pro : LicenseTier.Free;
        }

        if (appLicenseActive && !appLicenseIsTrial)
        {
            return LicenseTier.Pro;
        }

        return LicenseTier.Free;
    }

    public static string Describe(
        LicenseTier tier,
        bool appLicenseActive,
        bool appLicenseIsTrial,
        bool proAddOnConfigured,
        bool proAddOnActive)
    {
        if (tier == LicenseTier.Pro)
        {
            if (proAddOnConfigured && proAddOnActive)
            {
                return "Store: Pro add-on active";
            }

            return "Store: purchased app license (Pro)";
        }

        if (proAddOnConfigured && !proAddOnActive)
        {
            if (appLicenseActive && appLicenseIsTrial)
            {
                return "Store: trial / freemium (Free limits)";
            }

            // Free listing: Store still reports an active non-trial app license.
            return "Store: free app license; Pro add-on not owned (Free)";
        }

        if (appLicenseActive && appLicenseIsTrial)
        {
            return "Store: trial / freemium (Free limits)";
        }

        return "Store: Free tier";
    }
}
