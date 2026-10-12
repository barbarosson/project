namespace UplinkFtp.Services.Licensing;

/// <summary>Pure Free/Pro decision for Store app + durable add-on licenses (unit-tested).</summary>
public static class StoreEntitlementEvaluator
{
    /// <summary>
    /// Freemium rule: durable Pro add-on wins when configured; otherwise paid (non-trial) app license.
    /// Store trial of the free app stays Free.
    /// </summary>
    public static LicenseTier Evaluate(
        bool appLicenseActive,
        bool appLicenseIsTrial,
        bool proAddOnConfigured,
        bool proAddOnActive)
    {
        if (proAddOnConfigured && proAddOnActive)
        {
            return LicenseTier.Pro;
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

        if (appLicenseActive && appLicenseIsTrial)
        {
            return "Store: trial / freemium (Free limits)";
        }

        if (proAddOnConfigured && !proAddOnActive)
        {
            return "Store: Pro add-on not owned (Free)";
        }

        return "Store: Free tier";
    }
}
