using HaSetup.Core.Licensing;

namespace HaSetup.App.ViewModels;

/// <summary>
/// UI helper: Premium feature labels and purchase prompts.
/// </summary>
public static class PremiumGate
{
    public const string LockSuffix = " (Premium)";

    public static string LockedLabel(string featureName) => $"{featureName}{LockSuffix}";

    public static string StatusText(ILicenseService license) =>
        license.IsPremium ? "Premium unlocked" : "Free tier — Premium features locked";

    public static string PurchasePrompt(string featureName) =>
        $"{featureName} requires Premium.\n\n" +
        "• Microsoft Store build: purchase the Premium unlock add-on.\n" +
        "• Dev / sideload: use “Simulate premium” or set HASETTUP_SIMULATE_PREMIUM=1.";
}
