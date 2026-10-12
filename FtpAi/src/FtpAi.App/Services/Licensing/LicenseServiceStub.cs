namespace FtpAi.Services.Licensing;

/// <summary>ADIM 1 placeholder — always reports Free tier.</summary>
public sealed class LicenseServiceStub : ILicenseService
{
    public LicenseTier GetCurrentTier() => LicenseTier.Free;

    public bool IsFeatureEnabled(LicenseFeature feature) => false;
}
