using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.UI.Xaml;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class ProUnlockViewModel : ObservableObject
{
    private readonly ILicenseService _license;
    private Window? _window;

    public ProUnlockViewModel(ILicenseService license)
    {
        _license = license;
        Sync();
        _license.Changed += (_, _) => Sync();
    }

    public void AttachWindow(Window window) => _window = window;

    public void SetFeature(string featureName)
    {
        FeatureName = featureName;
        Headline = $"{featureName} is part of Pure Performance Pro";
    }

    [ObservableProperty]
    private string featureName = "Pro feature";

    [ObservableProperty]
    private string headline = "Pure Performance Pro";

    [ObservableProperty]
    private string statusMessage = string.Empty;

    [ObservableProperty]
    private bool isUsingDevBypass;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(CanAct))]
    private bool isBusy;

    public bool CanAct => !IsBusy;

    public string HonestCopy { get; } =
        "Core tools stay free (Crash Analyzer, Dashboard, Startup, Cleaner, Memory). Pro is an optional durable Store add-on for scheduled reports, advanced crash tools, auto rules, multi-PC profiles, alerts, whitelist/rules, and bring-your-own AI assist. No deceptive junk scores.";

    [RelayCommand]
    private async Task PurchaseAsync()
    {
        if (IsBusy || _window is null) return;
        IsBusy = true;
        try
        {
            await _license.RequestPurchaseAsync(_window);
            Sync();
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            await _license.RefreshAsync();
            Sync();
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void Sync()
    {
        StatusMessage = _license.StatusMessage;
        IsUsingDevBypass = _license.IsUsingDevBypass;
    }
}
