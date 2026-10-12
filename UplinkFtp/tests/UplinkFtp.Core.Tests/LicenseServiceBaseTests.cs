using UplinkFtp.Services.Licensing;

namespace UplinkFtp.Core.Tests;

public sealed class LicenseServiceBaseTests
{
    [Fact]
    public void Free_tier_exposes_free_limits()
    {
        var sut = new FakeLicenseService(LicenseTier.Free);
        Assert.Equal(LicenseLimits.FreeMaxSavedSites, sut.GetMaxSavedSites());
        Assert.Equal(LicenseLimits.FreeMaxConcurrentTransfers, sut.GetMaxConcurrentTransfers());
        Assert.Equal(LicenseLimits.FreeMaxConcurrentConnections, sut.GetMaxConcurrentConnections());
        Assert.False(sut.IsFeatureEnabled(LicenseFeature.Sync));
    }

    [Fact]
    public void Pro_tier_is_unlimited()
    {
        var sut = new FakeLicenseService(LicenseTier.Pro);
        Assert.Equal(LicenseLimits.ProUnlimited, sut.GetMaxSavedSites());
        Assert.Equal(LicenseLimits.ProUnlimited, sut.GetMaxConcurrentTransfers());
        Assert.Equal(LicenseLimits.ProUnlimited, sut.GetMaxConcurrentConnections());
        Assert.True(sut.IsFeatureEnabled(LicenseFeature.ConcurrentConnections));
        Assert.True(sut.IsFeatureEnabled(LicenseFeature.Scripting));
    }

    private sealed class FakeLicenseService : LicenseServiceBase
    {
        public FakeLicenseService(LicenseTier tier)
        {
            SetTier(tier, tier == LicenseTier.Pro ? "Fake Pro" : "Fake Free");
        }

        public override DistributionChannel Channel => DistributionChannel.Web;

        public override Task RefreshAsync(CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }
}
