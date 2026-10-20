using HaSetup.Core.Store;

namespace HaSetup.Core.Tests;

public class StoreIdentityTests
{
    [Fact]
    public void AppStoreId_IsPartnerCenterListingId()
    {
        Assert.Equal("9P1W6J8VRGCV", StoreIdentity.AppStoreId);
        Assert.Equal("MODULUSTECH.ContainerManagerforHA", StoreIdentity.PackageIdentityName);
        Assert.Equal("CN=7E7A2323-C3C3-4A9A-A4D1-832D351FC4BA", StoreIdentity.Publisher);
        Assert.Equal("MODULUSTECH", StoreIdentity.PublisherDisplayName);
        Assert.Equal("MODULUSTECH.ContainerManagerforHA_6w2d1brm94m3m", StoreIdentity.PackageFamilyName);
        Assert.Equal("673fda9f-91a6-4ca3-aab5-247721360711", StoreIdentity.MsaAppId);
    }

    [Fact]
    public void AppStoreId_IsNotConfusedWithIapPlaceholder()
    {
        Assert.NotEqual(StoreIdentity.AppStoreId, Licensing.StoreLicenseService.PremiumUnlockIdPlaceholder);
        Assert.Equal("PREMIUM_UNLOCK_ID_PLACEHOLDER", Licensing.StoreLicenseService.PremiumUnlockIdPlaceholder);
    }
}
