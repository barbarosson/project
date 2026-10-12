namespace FtpAi.Services.Licensing;

/// <summary>Placeholder license service — Free tier with a saved-site cap for ADIM 3 gating.</summary>
public sealed class LicenseServiceStub : ILicenseService
{
    public const int FreeMaxSavedSites = 5;

    public LicenseTier GetCurrentTier() => LicenseTier.Free;

    public bool IsFeatureEnabled(LicenseFeature feature) => false;

    public int GetMaxSavedSites()
        => GetCurrentTier() == LicenseTier.Pro || IsFeatureEnabled(LicenseFeature.UnlimitedSites)
            ? int.MaxValue
            : FreeMaxSavedSites;
}
