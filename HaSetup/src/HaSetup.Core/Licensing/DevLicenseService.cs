namespace HaSetup.Core.Licensing;

/// <summary>
/// Development / sideload license: simulate Premium without Store IAP.
/// Set env <c>HASETTUP_SIMULATE_PREMIUM=1</c> or call <see cref="SetSimulatePremium"/>.
/// </summary>
public sealed class DevLicenseService : ILicenseService
{
    public const string SimulatePremiumEnvVar = "HASETTUP_SIMULATE_PREMIUM";

    private bool _simulatePremium;

    public DevLicenseService(bool? simulatePremium = null)
    {
        _simulatePremium = simulatePremium ?? ReadEnvFlag();
    }

    public bool IsPremium => _simulatePremium;

    public bool SimulatePremium
    {
        get => _simulatePremium;
        set => SetSimulatePremium(value);
    }

    public event EventHandler? Changed;

    public Task RefreshAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var fromEnv = ReadEnvFlag();
        if (fromEnv && !_simulatePremium)
        {
            _simulatePremium = true;
            Changed?.Invoke(this, EventArgs.Empty);
        }

        return Task.CompletedTask;
    }

    public Task<LicensePurchaseResult> PurchaseAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        SetSimulatePremium(true);
        return Task.FromResult(new LicensePurchaseResult(
            true,
            true,
            "Premium simulated (dev / sideload). Store IAP is not used in this build."));
    }

    public Task<LicensePurchaseResult> RestoreAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var enabled = ReadEnvFlag() || _simulatePremium;
        SetSimulatePremium(enabled);
        return Task.FromResult(new LicensePurchaseResult(
            true,
            IsPremium,
            IsPremium
                ? "Premium simulation restored (dev / sideload)."
                : "No simulated Premium. Toggle “Simulate premium” or set HASETTUP_SIMULATE_PREMIUM=1."));
    }

    public void SetSimulatePremium(bool enabled)
    {
        if (_simulatePremium == enabled)
        {
            return;
        }

        _simulatePremium = enabled;
        Changed?.Invoke(this, EventArgs.Empty);
    }

    private static bool ReadEnvFlag()
    {
        var value = Environment.GetEnvironmentVariable(SimulatePremiumEnvVar);
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return value is "1" or "true" or "TRUE" or "yes" or "YES";
    }
}
