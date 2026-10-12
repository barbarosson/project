namespace FtpAi.Services.Licensing;

/// <summary>
/// Free vs Pro gating and Store/Web license validation.
/// Implementation deferred — dual packaging comes later.
/// </summary>
public interface ILicenseService
{
    LicenseTier GetCurrentTier();

    bool IsFeatureEnabled(LicenseFeature feature);
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
