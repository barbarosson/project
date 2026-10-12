namespace FtpAi.Services.Licensing;

/// <summary>
/// Free vs Pro gating and Store/Web license validation.
/// Full Store/Web validation deferred; site-count hook is live for ADIM 3.
/// </summary>
public interface ILicenseService
{
    LicenseTier GetCurrentTier();

    bool IsFeatureEnabled(LicenseFeature feature);

    /// <summary>
    /// Max saved sites for the current tier. Free defaults to 5; Pro is effectively unlimited.
    /// </summary>
    int GetMaxSavedSites();
}

public enum LicenseTier
{
    Free,
    Pro
}

public enum LicenseFeature
{
    UnlimitedSites,
    ConcurrentTransfers,
    Sync,
    Scripting
}
