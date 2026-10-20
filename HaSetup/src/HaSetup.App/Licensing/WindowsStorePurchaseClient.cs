using HaSetup.Core.Diagnostics;
using HaSetup.Core.Licensing;

namespace HaSetup.App.Licensing;

/// <summary>
/// Store-signed builds should wire <c>Windows.Services.Store.StoreContext</c> here.
/// Until Partner Center replaces <see cref="StoreLicenseService.PremiumUnlockIdPlaceholder"/>,
/// this client returns a clear guidance message (no raw API errors as primary text).
/// </summary>
public sealed class WindowsStorePurchaseClient : IStorePurchaseClient
{
    public Task<bool> IsPremiumOwnedAsync(string productId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        // Skeleton: real StoreContext.GetAppLicenseAsync / GetStoreProductsAsync lands with Partner Center id.
        _ = productId;
        return Task.FromResult(false);
    }

    public Task<StoreClientResult> RequestPurchaseAsync(string productId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            if (string.Equals(productId, StoreLicenseService.PremiumUnlockIdPlaceholder, StringComparison.Ordinal))
            {
                return Task.FromResult(new StoreClientResult(
                    false,
                    "Premium Store product id is still PREMIUM_UNLOCK_ID_PLACEHOLDER. " +
                    "Create a durable add-on in Partner Center, replace the const, then re-test IAP on a Store-signed package."));
            }

#if STORE_BUILD
            // Hook point for StoreContext.GetDefault().RequestPurchaseAsync(productId) once the real id ships.
            return Task.FromResult(new StoreClientResult(
                false,
                "Store purchase API is not fully wired yet. Replace PREMIUM_UNLOCK_ID_PLACEHOLDER and enable StoreContext purchase."));
#else
            return Task.FromResult(new StoreClientResult(
                false,
                "Store IAP requires a Microsoft Store (STORE_BUILD) package. Use Simulate premium in the development build."));
#endif
        }
        catch (Exception ex)
        {
            return Task.FromResult(new StoreClientResult(
                false,
                FriendlyErrorHandler.ToUserMessage(ex, "Store purchase failed.")));
        }
    }
}
