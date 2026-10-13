using UplinkFtp.Services.Licensing;

namespace UplinkFtp.Core.Tests;

public sealed class LicenseLimitsTests
{
    [Fact]
    public void Free_limits_are_canonical()
    {
        Assert.Equal(3, LicenseLimits.FreeMaxSavedSites);
        Assert.Equal(1, LicenseLimits.FreeMaxConcurrentConnections);
        Assert.Equal(1, LicenseLimits.FreeMaxConcurrentTransfers);
        Assert.Equal(int.MaxValue, LicenseLimits.ProUnlimited);
    }
}
