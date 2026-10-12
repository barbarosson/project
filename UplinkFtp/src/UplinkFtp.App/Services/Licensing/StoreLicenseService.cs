using System;
using System.Threading;
using System.Threading.Tasks;
using Windows.Services.Store;

namespace UplinkFtp.Services.Licensing;

/// <summary>
/// Microsoft Store entitlement via <see cref="StoreContext"/>.
/// Pro when durable Pro add-on is active (if <see cref="StoreCommerceOptions.ProAddOnStoreId"/> set),
/// else when app license is active and non-trial. Failures degrade to Free.
/// </summary>
public sealed class StoreLicenseService : LicenseServiceBase
{
    private readonly StoreCommerceOptions _commerce;

    public StoreLicenseService(StoreCommerceOptions? commerce = null)
    {
        _commerce = commerce ?? new StoreCommerceOptions();
    }

    public override DistributionChannel Channel => DistributionChannel.Store;

    /// <summary>True when a Pro add-on Store ID is configured (purchase button can call Store).</summary>
    public bool CanRequestPurchase => _commerce.HasProAddOnId;

    public override async Task RefreshAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            var context = StoreContext.GetDefault();
            var license = await context.GetAppLicenseAsync();
            cancellationToken.ThrowIfCancellationRequested();

            if (license is null)
            {
                SetTier(LicenseTier.Free, "Store: no license payload (Free)");
                return;
            }

            var addOnActive = IsProAddOnActive(license, _commerce.ProAddOnStoreId);
            var tier = StoreEntitlementEvaluator.Evaluate(
                license.IsActive,
                license.IsTrial,
                _commerce.HasProAddOnId,
                addOnActive);

            SetTier(
                tier,
                StoreEntitlementEvaluator.Describe(
                    tier,
                    license.IsActive,
                    license.IsTrial,
                    _commerce.HasProAddOnId,
                    addOnActive));
        }
        catch (Exception ex)
        {
            // Common when unpackaged or Store services unavailable.
            SetTier(LicenseTier.Free, $"Store: unavailable — {ex.GetType().Name} (Free)");
        }
    }

    /// <summary>
    /// Opens the Store purchase UI for the configured Pro add-on.
    /// Graceful when not associated / ID missing / Store API fails.
    /// </summary>
    public async Task<string> RequestPurchaseProAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!_commerce.HasProAddOnId)
        {
            return "Pro add-on Store ID is not configured. After Partner Center, set UPLINK_STORE_PRO_ADDON_ID (or StoreCommerceOptions.ProAddOnStoreId) and rebuild the Store channel.";
        }

        try
        {
            var context = StoreContext.GetDefault();
            var result = await context.RequestPurchaseAsync(_commerce.ProAddOnStoreId.Trim());
            cancellationToken.ThrowIfCancellationRequested();

            await RefreshAsync(cancellationToken).ConfigureAwait(true);

            return result.Status switch
            {
                StorePurchaseStatus.Succeeded => "Purchase succeeded. Pro entitlement refreshed.",
                StorePurchaseStatus.AlreadyPurchased => "Already purchased. Pro entitlement refreshed.",
                StorePurchaseStatus.NotPurchased => "Purchase cancelled or not completed.",
                StorePurchaseStatus.NetworkError => "Store network error. Try again when online.",
                StorePurchaseStatus.ServerError => "Store server error. Try again later.",
                _ => $"Purchase finished with status: {result.Status}."
            };
        }
        catch (Exception ex)
        {
            return $"Store purchase unavailable ({ex.GetType().Name}). Associate the app with the Store and sign in with a sandbox/test account.";
        }
    }

    private static bool IsProAddOnActive(StoreAppLicense appLicense, string? proAddOnStoreId)
    {
        if (string.IsNullOrWhiteSpace(proAddOnStoreId) || appLicense.AddOnLicenses is null)
        {
            return false;
        }

        var id = proAddOnStoreId.Trim();
        foreach (var pair in appLicense.AddOnLicenses)
        {
            // Keys are typically Store IDs; also compare StoreLicense.SkuStoreId when present.
            if (!string.Equals(pair.Key, id, StringComparison.OrdinalIgnoreCase)
                && (pair.Value?.SkuStoreId is null
                    || !string.Equals(pair.Value.SkuStoreId, id, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            if (pair.Value is { IsActive: true })
            {
                return true;
            }
        }

        return false;
    }
}
