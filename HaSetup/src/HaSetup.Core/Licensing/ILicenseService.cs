namespace HaSetup.Core.Licensing;

public interface ILicenseService
{
    bool IsPremium { get; }

    event EventHandler? Changed;

    Task RefreshAsync(CancellationToken cancellationToken = default);

    Task<LicensePurchaseResult> PurchaseAsync(CancellationToken cancellationToken = default);

    Task<LicensePurchaseResult> RestoreAsync(CancellationToken cancellationToken = default);
}

public sealed record LicensePurchaseResult(bool Succeeded, bool IsPremium, string Message);
