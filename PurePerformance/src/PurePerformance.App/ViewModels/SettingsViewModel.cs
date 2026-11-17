using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.UI.Xaml;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class SettingsViewModel : ObservableObject
{
    private readonly IThemeService _theme;
    private readonly ILicenseService _license;
    private Window? _window;

    public SettingsViewModel(IThemeService theme, ILicenseService license)
    {
        _theme = theme;
        _license = license;
        SyncFromServices();
        _theme.PreferenceChanged += (_, _) => SyncFromServices();
        _license.Changed += (_, _) => SyncFromServices();
    }

    public void AttachWindow(Window window) => _window = window;

    [ObservableProperty]
    private bool isSystemTheme;

    [ObservableProperty]
    private bool isLightTheme;

    [ObservableProperty]
    private bool isDarkTheme;

    [ObservableProperty]
    private string licenseStatus = string.Empty;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(IsProLocked))]
    [NotifyPropertyChangedFor(nameof(CanPurchase))]
    private bool isProUnlocked;

    [ObservableProperty]
    private bool isUsingDevBypass;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(CanRefresh))]
    [NotifyPropertyChangedFor(nameof(CanPurchase))]
    private bool isBusy;

    public bool IsProLocked => !IsProUnlocked;

    public bool CanRefresh => !IsBusy;

    public bool CanPurchase => !IsBusy && !IsProUnlocked;

    [ObservableProperty]
    private string themeStatus = "Theme follows Windows by default.";

    public string FreeTierSummary { get; } =
        "Free: Crash Analyzer reads Application and System event logs and explains common crash causes in plain English. Dashboard monitoring stays available.";

    public string ProTierSummary { get; } =
        "Pro (optional): Startup Manager, System Cleaner (named folders only — not a registry cleaner), and Memory Optimizer.";

    public string PrivacyPolicyUrl { get; } =
        "https://modulusaas.com/products/pure-performance/privacy";

    public string AddOnStoreId => _license.ProAddOnStoreId;

    [RelayCommand]
    private void SelectSystemTheme()
    {
        _theme.SetPreference(AppThemePreference.System);
        ThemeStatus = "Following Windows light / dark setting.";
        SyncFromServices();
    }

    [RelayCommand]
    private void SelectLightTheme()
    {
        _theme.SetPreference(AppThemePreference.Light);
        ThemeStatus = "Light theme applied to this window.";
        SyncFromServices();
    }

    [RelayCommand]
    private void SelectDarkTheme()
    {
        _theme.SetPreference(AppThemePreference.Dark);
        ThemeStatus = "Dark theme applied to this window.";
        SyncFromServices();
    }

    [RelayCommand]
    private async Task RefreshLicenseAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            await _license.RefreshAsync();
            SyncFromServices();
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task PurchaseProAsync()
    {
        if (IsBusy) return;
        if (_window is null)
        {
            LicenseStatus = "Window not ready for Store purchase UI.";
            return;
        }

        IsBusy = true;
        try
        {
            await _license.RequestPurchaseAsync(_window);
            SyncFromServices();
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void SyncFromServices()
    {
        var pref = _theme.Preference;
        IsSystemTheme = pref == AppThemePreference.System;
        IsLightTheme = pref == AppThemePreference.Light;
        IsDarkTheme = pref == AppThemePreference.Dark;
        IsProUnlocked = _license.IsProUnlocked;
        IsUsingDevBypass = _license.IsUsingDevBypass;
        LicenseStatus = _license.StatusMessage;
    }
}
