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
        "Crash Analyzer stays free. Startup Manager, System Cleaner, and Memory Optimizer are optional Pro tools. Pure Performance does not claim deceptive “PC cleaned” scores or blind registry cleaning.";

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
