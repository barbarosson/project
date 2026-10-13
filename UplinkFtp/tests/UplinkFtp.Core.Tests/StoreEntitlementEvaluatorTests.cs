using UplinkFtp.Services.Licensing;

namespace UplinkFtp.Core.Tests;

public sealed class StoreEntitlementEvaluatorTests
{
    [Fact]
    public void Add_on_active_is_Pro_when_configured()
    {
        var tier = StoreEntitlementEvaluator.Evaluate(
            appLicenseActive: true,
            appLicenseIsTrial: true,
            proAddOnConfigured: true,
            proAddOnActive: true);
        Assert.Equal(LicenseTier.Pro, tier);
    }

    [Fact]
    public void Trial_app_without_add_on_is_Free()
    {
        var tier = StoreEntitlementEvaluator.Evaluate(
            appLicenseActive: true,
            appLicenseIsTrial: true,
            proAddOnConfigured: true,
            proAddOnActive: false);
        Assert.Equal(LicenseTier.Free, tier);
    }

    [Fact]
    public void Paid_app_license_is_Pro_when_add_on_not_configured()
    {
        var tier = StoreEntitlementEvaluator.Evaluate(
            appLicenseActive: true,
            appLicenseIsTrial: false,
            proAddOnConfigured: false,
            proAddOnActive: false);
        Assert.Equal(LicenseTier.Pro, tier);
    }

    [Fact]
    public void Inactive_license_is_Free()
    {
        var tier = StoreEntitlementEvaluator.Evaluate(
            appLicenseActive: false,
            appLicenseIsTrial: false,
            proAddOnConfigured: true,
            proAddOnActive: false);
        Assert.Equal(LicenseTier.Free, tier);
    }

    [Fact]
    public void StoreCommerceOptions_defaults_partner_center_ids_when_env_empty()
    {
        var previousAddon = Environment.GetEnvironmentVariable("UPLINK_STORE_PRO_ADDON_ID");
        var previousApp = Environment.GetEnvironmentVariable("UPLINK_STORE_APP_ID");
        try
        {
            Environment.SetEnvironmentVariable("UPLINK_STORE_PRO_ADDON_ID", null);
            Environment.SetEnvironmentVariable("UPLINK_STORE_APP_ID", null);
            var opts = new StoreCommerceOptions();
            Assert.Equal(StoreCommerceOptions.DefaultAppStoreId, opts.AppStoreId);
            Assert.Equal(StoreCommerceOptions.DefaultProAddOnStoreId, opts.ProAddOnStoreId);
            Assert.Equal("9MTN64PZGQCM", opts.ProAddOnStoreId);
            Assert.True(opts.HasProAddOnId);
            Assert.Equal(
                $"ms-windows-store://pdp/?productid={StoreCommerceOptions.DefaultAppStoreId}",
                opts.StoreProtocolUrl);
        }
        finally
        {
            Environment.SetEnvironmentVariable("UPLINK_STORE_PRO_ADDON_ID", previousAddon);
            Environment.SetEnvironmentVariable("UPLINK_STORE_APP_ID", previousApp);
        }
    }

    [Fact]
    public void StoreCommerceOptions_reads_env_overrides()
    {
        var previousAddon = Environment.GetEnvironmentVariable("UPLINK_STORE_PRO_ADDON_ID");
        var previousApp = Environment.GetEnvironmentVariable("UPLINK_STORE_APP_ID");
        try
        {
            Environment.SetEnvironmentVariable("UPLINK_STORE_PRO_ADDON_ID", " 9NBLGGH4N15H ");
            Environment.SetEnvironmentVariable("UPLINK_STORE_APP_ID", " 9OVERRIDE ");
            var opts = new StoreCommerceOptions();
            Assert.True(opts.HasProAddOnId);
            Assert.Equal("9NBLGGH4N15H", opts.ProAddOnStoreId);
            Assert.Equal("9OVERRIDE", opts.AppStoreId);
        }
        finally
        {
            Environment.SetEnvironmentVariable("UPLINK_STORE_PRO_ADDON_ID", previousAddon);
            Environment.SetEnvironmentVariable("UPLINK_STORE_APP_ID", previousApp);
        }
    }
}
