using System;
using System.Threading;
using System.Threading.Tasks;
using Windows.Services.Store;

namespace UplinkFtp.Services.Licensing;

/// <summary>
/// Microsoft Store entitlement via <see cref="StoreContext"/>.
/// Purchased (active, non-trial) → Pro; otherwise Free.
/// Unpackaged / Store API failures degrade to Free without crashing.
/// </summary>
public sealed class StoreLicenseService : LicenseServiceBase
{
    public override DistributionChannel Channel => DistributionChannel.Store;

    public override async Task RefreshAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            var context = StoreContext.GetDefault();
            // C#/WinRT projects IAsyncOperation as awaitable.
            var license = await context.GetAppLicenseAsync();
            cancellationToken.ThrowIfCancellationRequested();

            if (license is null)
            {
                SetTier(LicenseTier.Free, "Store: no license payload (Free)");
                return;
            }

            // IsActive && !IsTrial ⇒ durable purchase / full license.
            if (license.IsActive && !license.IsTrial)
            {
                SetTier(LicenseTier.Pro, "Store: purchased (Pro)");
                return;
            }

            if (license.IsActive && license.IsTrial)
            {
                SetTier(LicenseTier.Free, "Store: trial (Free limits)");
                return;
            }

            SetTier(LicenseTier.Free, "Store: inactive license (Free)");
        }
        catch (Exception ex)
        {
            // Common when unpackaged or Store services unavailable.
            SetTier(LicenseTier.Free, $"Store: unavailable — {ex.GetType().Name} (Free)");
        }
    }
}
