using Microsoft.UI.Xaml;
using Windows.Services.Store;

namespace PurePerformance.Services;

/// <summary>
/// Free core = Crash Analyzer, Dashboard, Startup, Cleaner, Memory.
/// Pro = scheduled scans, advanced crash tools, auto rules, profiles, alerts, whitelist, AI assist.
/// Uses Windows.Services.Store.StoreContext when packaged; unpackaged Debug uses an explicit bypass.
/// </summary>
public sealed class StoreLicenseService : ILicenseService
{
    /// <summary>
    /// *** PLACEHOLDER — NOT A REAL MICROSOFT STORE ID ***
    /// Replace with the durable add-on Store ID from Partner Center after you create it
    /// (looks like 9N…). Until then, purchase is blocked with an explicit message.
    /// See docs/PARTNER-CENTER-ADDON.md.
    /// </summary>
    public const string DefaultProAddOnStoreId = "9NXXXXXXXXXX"; // PLACEHOLDER — Partner Center

    private readonly object _gate = new();
    private bool _isProUnlocked;
    private bool _isUsingDevBypass;
    private string _statusMessage = "Checking license…";

    public StoreLicenseService()
    {
        ProAddOnStoreId = DefaultProAddOnStoreId;
        ApplyDevBypassIfNeeded();
    }

    public string ProAddOnStoreId { get; }

    public bool IsProUnlocked
    {
        get { lock (_gate) return _isProUnlocked; }
    }

    public bool IsUsingDevBypass
    {
        get { lock (_gate) return _isUsingDevBypass; }
    }

    public string StatusMessage
    {
        get { lock (_gate) return _statusMessage; }
    }

    public event EventHandler? Changed;

    public async Task RefreshAsync()
    {
        if (TryApplyDevBypass())
        {
            NotifyChanged();
            return;
        }

        if (!IsRunningPackaged())
        {
            SetState(
                unlocked: false,
                bypass: false,
                "Store license checks require an MSIX / Store install. Unpackaged Release builds stay on the free tier. Use Debug unpackaged or PUREPERFORMANCE_UNLOCK_PRO=1 for a local Pro bypass.");
            NotifyChanged();
            return;
        }

        try
        {
            var context = StoreContext.GetDefault();
            var license = await context.GetAppLicenseAsync();
            var hasPro = HasActiveProAddOn(license);

            if (hasPro)
            {
                SetState(
                    unlocked: true,
                    bypass: false,
                    "Pure Performance Pro is active (Microsoft Store license). Scheduled scans, advanced crash tools, auto rules, profiles, alerts, whitelist, and AI assist are available.");
            }
            else
            {
                SetState(
                    unlocked: false,
                    bypass: false,
                    "Free tier: Crash Analyzer, Dashboard, Startup Optimizer, System Cleaner, and Memory Optimizer. Optional Pro adds scheduled reports, advanced crash tools, auto rules, multi-PC profiles, alerts, whitelist, and AI assist.");
            }
        }
        catch (Exception ex)
        {
            SetState(
                unlocked: false,
                bypass: false,
                $"Could not read Store license ({ex.Message}). Free tools remain available.");
        }

        NotifyChanged();
        await Task.CompletedTask;
    }

    public async Task<bool> RequestPurchaseAsync(Window window)
    {
        if (IsProUnlocked && !IsUsingDevBypass)
        {
            return true;
        }

        if (TryApplyDevBypass())
        {
            NotifyChanged();
            return true;
        }

        if (!IsRunningPackaged())
        {
            SetState(
                unlocked: false,
                bypass: false,
                "Purchase UI needs a Store-packaged build. Local unpackaged Debug already uses the Pro bypass when available.");
            NotifyChanged();
            return false;
        }

        if (string.Equals(ProAddOnStoreId, DefaultProAddOnStoreId, StringComparison.Ordinal))
        {
            SetState(
                unlocked: IsProUnlocked,
                bypass: IsUsingDevBypass,
                "Pro add-on Store ID is still the PLACEHOLDER (9NXXXXXXXXXX). Create the durable add-on in Partner Center and replace StoreLicenseService.DefaultProAddOnStoreId — see docs/PARTNER-CENTER-ADDON.md.");
            NotifyChanged();
            return false;
        }

        try
        {
            var context = StoreContext.GetDefault();
            InitializeStoreContextWithWindow(context, window);

            var result = await context.RequestPurchaseAsync(ProAddOnStoreId);
            if (result.Status is StorePurchaseStatus.Succeeded or StorePurchaseStatus.AlreadyPurchased)
            {
                await RefreshAsync();
                return IsProUnlocked;
            }

            SetState(
                unlocked: false,
                bypass: false,
                result.Status switch
                {
                    StorePurchaseStatus.NotPurchased => "Purchase was cancelled. Free tools stay available.",
                    StorePurchaseStatus.NetworkError => "Network error during purchase. Try again when online.",
                    StorePurchaseStatus.ServerError => "Store server error during purchase. Try again later.",
                    _ => $"Purchase did not complete ({result.Status}). Free tools stay available."
                });
            NotifyChanged();
            return false;
        }
        catch (Exception ex)
        {
            SetState(
                unlocked: false,
                bypass: false,
                $"Purchase failed: {ex.Message}. Free tools stay available.");
            NotifyChanged();
            return false;
        }
    }

    private bool TryApplyDevBypass()
    {
        ApplyDevBypassIfNeeded();
        return IsUsingDevBypass && IsProUnlocked;
    }

    private void ApplyDevBypassIfNeeded()
    {
        var envUnlock = string.Equals(
            Environment.GetEnvironmentVariable("PUREPERFORMANCE_UNLOCK_PRO"),
            "1",
            StringComparison.Ordinal);

#if DEBUG
        var debugUnpackaged = !IsRunningPackaged();
#else
        var debugUnpackaged = false;
#endif

        if (envUnlock || debugUnpackaged)
        {
            var reason = envUnlock
                ? "PUREPERFORMANCE_UNLOCK_PRO=1"
                : "unpackaged Debug build";
            SetState(
                unlocked: true,
                bypass: true,
                $"Pro unlocked via local/dev bypass ({reason}). This is not a Microsoft Store purchase — Store builds still require the Pro add-on.");
            return;
        }

        if (!_isProUnlocked && string.IsNullOrWhiteSpace(_statusMessage))
        {
            SetState(
                unlocked: false,
                bypass: false,
                "Free tier includes Crash Analyzer, Dashboard, Startup, Cleaner, and Memory. Optional Pro adds scheduled reports and advanced tools.");
        }
    }

    private bool HasActiveProAddOn(StoreAppLicense license)
    {
        if (string.Equals(ProAddOnStoreId, DefaultProAddOnStoreId, StringComparison.Ordinal))
        {
            return false;
        }

        if (license?.AddOnLicenses is null)
        {
            return false;
        }

        foreach (var pair in license.AddOnLicenses)
        {
            var addOn = pair.Value;
            if (addOn is null || !addOn.IsActive)
            {
                continue;
            }

            if (string.Equals(addOn.SkuStoreId, ProAddOnStoreId, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private void SetState(bool unlocked, bool bypass, string message)
    {
        lock (_gate)
        {
            _isProUnlocked = unlocked;
            _isUsingDevBypass = bypass;
            _statusMessage = message;
        }
    }

    private void NotifyChanged() => Changed?.Invoke(this, EventArgs.Empty);

    private static bool IsRunningPackaged()
    {
        try
        {
            var package = Windows.ApplicationModel.Package.Current;
            return package is not null && !string.IsNullOrEmpty(package.Id?.FullName);
        }
        catch
        {
            return false;
        }
    }

    private static void InitializeStoreContextWithWindow(StoreContext context, Window window)
    {
        try
        {
            var hwnd = WinRT.Interop.WindowNative.GetWindowHandle(window);
            WinRT.Interop.InitializeWithWindow.Initialize(context, hwnd);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"StoreContext HWND init skipped: {ex.Message}");
        }
    }
}
