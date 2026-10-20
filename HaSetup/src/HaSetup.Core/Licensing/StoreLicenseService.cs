using HaSetup.Core.Diagnostics;

namespace HaSetup.Core.Licensing;

/// <summary>
/// Microsoft Store durable IAP unlock. Product id is a Partner Center placeholder until configured.
/// Real <c>StoreContext</c> calls are injected via <see cref="IStorePurchaseClient"/> (App wires WinRT on Store builds).
/// </summary>
public sealed class StoreLicenseService : ILicenseService
{
    /// <summary>
    /// Replace with the durable add-on Store product id from Partner Center.
    /// </summary>
    public const string PremiumUnlockIdPlaceholder = "PREMIUM_UNLOCK_ID_PLACEHOLDER";

    private readonly IStorePurchaseClient _store;
    private bool _isPremium;

    public StoreLicenseService(IStorePurchaseClient? store = null)
    {
        _store = store ?? new UnavailableStorePurchaseClient();
    }

    public bool IsPremium => _isPremium;

    public event EventHandler? Changed;

    public async Task RefreshAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var owned = await _store.IsPremiumOwnedAsync(PremiumUnlockIdPlaceholder, cancellationToken)
                .ConfigureAwait(false);
            SetPremium(owned);
        }
        catch (Exception ex)
        {
            // Keep last known state; surface friendly text via callers if needed.
            _ = FriendlyErrorHandler.ToUserMessage(ex, "Could not refresh Store license.");
        }
    }

    public async Task<LicensePurchaseResult> PurchaseAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _store.RequestPurchaseAsync(PremiumUnlockIdPlaceholder, cancellationToken)
                .ConfigureAwait(false);
            if (result.Succeeded)
            {
                SetPremium(true);
            }

            return new LicensePurchaseResult(
                result.Succeeded,
                IsPremium,
                string.IsNullOrWhiteSpace(result.Message)
                    ? (result.Succeeded ? "Premium unlocked." : "Purchase did not complete.")
                    : result.Message);
        }
        catch (Exception ex)
        {
            return new LicensePurchaseResult(
                false,
                IsPremium,
                FriendlyErrorHandler.ToUserMessage(ex, "Purchase failed."));
        }
    }

    public async Task<LicensePurchaseResult> RestoreAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await RefreshAsync(cancellationToken).ConfigureAwait(false);
            return new LicensePurchaseResult(
                true,
                IsPremium,
                IsPremium
                    ? "Premium license restored from Microsoft Store."
                    : "No Premium purchase found for this Microsoft account. Buy Premium to unlock backup and mDNS helper.");
        }
        catch (Exception ex)
        {
            return new LicensePurchaseResult(
                false,
                IsPremium,
                FriendlyErrorHandler.ToUserMessage(ex, "Restore failed."));
        }
    }

    private void SetPremium(bool value)
    {
        if (_isPremium == value)
        {
            return;
        }

        _isPremium = value;
        Changed?.Invoke(this, EventArgs.Empty);
    }
}

/// <summary>Abstraction over Windows.Services.Store so Core stays net8.0-testable.</summary>
public interface IStorePurchaseClient
{
    Task<bool> IsPremiumOwnedAsync(string productId, CancellationToken cancellationToken = default);

    Task<StoreClientResult> RequestPurchaseAsync(string productId, CancellationToken cancellationToken = default);
}

public sealed record StoreClientResult(bool Succeeded, string Message);

/// <summary>
/// Default when WinRT Store APIs are not wired (dev Core tests / non-Store until Partner Center id is set).
/// </summary>
public sealed class UnavailableStorePurchaseClient : IStorePurchaseClient
{
    public Task<bool> IsPremiumOwnedAsync(string productId, CancellationToken cancellationToken = default) =>
        Task.FromResult(false);

    public Task<StoreClientResult> RequestPurchaseAsync(string productId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new StoreClientResult(
            false,
            $"Store IAP is not available in this build. Configure Partner Center durable add-on id (currently {StoreLicenseService.PremiumUnlockIdPlaceholder}) and ship a Store-signed package."));
}

/// <summary>Factory: Store build → StoreLicenseService; otherwise DevLicenseService.</summary>
public static class LicenseServiceFactory
{
    public static ILicenseService CreateDefault() =>
        AppChannel.IsStoreBuild
            ? new StoreLicenseService()
            : new DevLicenseService();
}
