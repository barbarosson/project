using Microsoft.UI.Xaml;

namespace PurePerformance.Services;

public interface ILicenseService
{
    /// <summary>True when Pro tools (Startup / Cleaner / Memory) may run.</summary>
    bool IsProUnlocked { get; }

    /// <summary>True when Pro is unlocked only via local/dev bypass (not a Store license).</summary>
    bool IsUsingDevBypass { get; }

    /// <summary>Honest status line for Settings / Pro gate UI.</summary>
    string StatusMessage { get; }

    /// <summary>Partner Center durable add-on Store ID (placeholder until created).</summary>
    string ProAddOnStoreId { get; }

    event EventHandler? Changed;

    Task RefreshAsync();

    /// <summary>
    /// Opens the Store purchase UI for the Pro add-on when packaged.
    /// Returns true if Pro is unlocked after the call.
    /// </summary>
    Task<bool> RequestPurchaseAsync(Window window);
}
