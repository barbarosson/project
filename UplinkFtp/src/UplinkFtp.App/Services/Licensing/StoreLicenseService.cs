using System;
using System.Threading;
using System.Threading.Tasks;
using Windows.Services.Store;
using WinRT.Interop;

namespace UplinkFtp.Services.Licensing;

/// <summary>
/// Microsoft Store entitlement via <see cref="StoreContext"/>.
/// When a Pro add-on Store ID is configured: Pro only if that add-on is active
/// (free app licenses stay Free). Without an add-on ID: Pro when app license is
/// active and non-trial. Failures degrade to Free.
/// </summary>
public sealed class StoreLicenseService : LicenseServiceBase
{
    private readonly StoreCommerceOptions _commerce;
    private readonly IWindowHandleProvider? _windowHandle;

    public StoreLicenseService(
        StoreCommerceOptions? commerce = null,
        IWindowHandleProvider? windowHandle = null)
    {
        _commerce = commerce ?? new StoreCommerceOptions();
        _windowHandle = windowHandle;
    }

    public override DistributionChannel Channel => DistributionChannel.Store;

    /// <summary>True when a Pro add-on Store ID is configured (purchase button can call Store).</summary>
    public bool CanRequestPurchase => _commerce.HasProAddOnId;

    public override async Task RefreshAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            var context = CreateStoreContext();
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
            var context = CreateStoreContext();
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
            return StorePurchaseMessages.FormatUnavailable(ex);
        }
    }

    /// <summary>
    /// WinUI 3 desktop: <see cref="StoreContext.RequestPurchaseAsync"/> needs
    /// <see cref="InitializeWithWindow"/> with the main HWND or it throws COMException.
    /// </summary>
    private StoreContext CreateStoreContext()
    {
        var context = StoreContext.GetDefault();
        var hwnd = _windowHandle?.GetMainWindowHandle() ?? IntPtr.Zero;
        if (hwnd != IntPtr.Zero)
        {
            InitializeWithWindow.Initialize(context, hwnd);
        }

        return context;
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
