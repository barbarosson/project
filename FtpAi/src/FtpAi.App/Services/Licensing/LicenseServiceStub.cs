namespace FtpAi.Services.Licensing;

/// <summary>Placeholder license service — Free tier caps for sites and concurrent transfers.</summary>
public sealed class LicenseServiceStub : ILicenseService
{
    public const int FreeMaxSavedSites = 5;

    public const int FreeMaxConcurrentTransfers = 2;

    public const int ProMaxConcurrentTransfers = 8;

    public LicenseTier GetCurrentTier() => LicenseTier.Free;

    public bool IsFeatureEnabled(LicenseFeature feature) => false;

    public int GetMaxSavedSites()
        => GetCurrentTier() == LicenseTier.Pro || IsFeatureEnabled(LicenseFeature.UnlimitedSites)
            ? int.MaxValue
            : FreeMaxSavedSites;

    public int GetMaxConcurrentTransfers()
    {
        if (GetCurrentTier() == LicenseTier.Pro || IsFeatureEnabled(LicenseFeature.ConcurrentTransfers))
        {
            return ProMaxConcurrentTransfers;
        }

        return FreeMaxConcurrentTransfers;
    }
}
