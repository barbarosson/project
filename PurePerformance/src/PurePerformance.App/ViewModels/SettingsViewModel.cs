using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.UI.Xaml;
using PurePerformance.Helpers;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class SettingsViewModel : ObservableObject
{
    private readonly IThemeService _theme;
    private readonly ILicenseService _license;
    private readonly IAiAssistService _ai;
    private Window? _window;

    public SettingsViewModel(IThemeService theme, ILicenseService license, IAiAssistService ai)
    {
        _theme = theme;
        _license = license;
        _ai = ai;
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
    private bool isAccentSystem;

    [ObservableProperty]
    private bool isAccentOcean;

    [ObservableProperty]
    private bool isAccentForest;

    [ObservableProperty]
    private bool isAccentSunset;

    [ObservableProperty]
    private bool isAccentSlate;

    [ObservableProperty]
    private bool isAccentBerry;

    [ObservableProperty]
    private string licenseStatus = string.Empty;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(IsProLocked))]
    [NotifyPropertyChangedFor(nameof(CanPurchase))]
    [NotifyPropertyChangedFor(nameof(ShowProAiSettings))]
    private bool isProUnlocked;

    [ObservableProperty]
    private bool isUsingDevBypass;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(CanRefresh))]
    [NotifyPropertyChangedFor(nameof(CanPurchase))]
    private bool isBusy;

    [ObservableProperty]
    private string aiBaseUrl = string.Empty;

    [ObservableProperty]
    private string aiModel = string.Empty;

    [ObservableProperty]
    private string aiKeyInput = string.Empty;

    [ObservableProperty]
    private string aiKeyStatus = string.Empty;

    public bool IsProLocked => !IsProUnlocked;

    public bool ShowProAiSettings => IsProUnlocked;

    public bool CanRefresh => !IsBusy;

    public bool CanPurchase => !IsBusy && !IsProUnlocked;

    [ObservableProperty]
    private string themeStatus = "Theme follows Windows by default.";

    [ObservableProperty]
    private string accentStatus = "Using the Windows accent color.";

    public string FreeTierSummary { get; } =
        "Free: Crash Analyzer (copyable findings), Dashboard, Startup Optimizer, System Cleaner (named folders), Memory Optimizer, theme + accent packs.";

    public string ProTierSummary { get; } =
        "Pro (optional durable add-on): scheduled scans/reports, advanced crash trends/export, auto optimization rules, multi-PC profiles, real-time alerts, Cleaner/Startup whitelist, and optional AI fix suggestions with your own API key.";

    public string PrivacyPolicyUrl { get; } =
        "https://modulusaas.com/products/pure-performance/privacy";

    public string AddOnStoreId => _license.ProAddOnStoreId;

    public string AiHelpSummary => AiSetupHelp.Summary;

    public string AiHelpFieldGuide => AiSetupHelp.FieldGuide;

    public string AiHelpExamples => AiSetupHelp.Examples;

    public string AiHelpProviderNote => AiSetupHelp.ProviderNote;

    public string AiHelpPrivacyNote => AiSetupHelp.PrivacyNote;

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
    private void SelectAccent(string? packName)
    {
        if (!Enum.TryParse<AccentPack>(packName, ignoreCase: true, out var pack))
        {
            pack = AccentPack.System;
        }

        _theme.SetAccent(pack);
        AccentStatus = $"Accent: {AccentPalette.DisplayName(pack)}.";
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

    [RelayCommand]
    private void SaveAiSettings()
    {
        if (!IsProUnlocked)
        {
            AiKeyStatus = "Pro is required to save an AI API key.";
            return;
        }

        _ai.BaseUrl = AiBaseUrl;
        _ai.Model = AiModel;
        if (!string.IsNullOrWhiteSpace(AiKeyInput))
        {
            _ai.SaveApiKey(AiKeyInput);
            AiKeyInput = string.Empty;
        }

        AiKeyStatus = _ai.HasApiKey
            ? "API key saved in Windows PasswordVault on this PC. Base URL and model stored in local settings (not the key)."
            : "No API key stored. Paste a key above and save — the app never ships with one.";
        SyncFromServices();
    }

    [RelayCommand]
    private void ClearAiKey()
    {
        _ai.ClearApiKey();
        AiKeyInput = string.Empty;
        AiKeyStatus = "API key cleared from PasswordVault.";
        SyncFromServices();
    }

    private void SyncFromServices()
    {
        var pref = _theme.Preference;
        IsSystemTheme = pref == AppThemePreference.System;
        IsLightTheme = pref == AppThemePreference.Light;
        IsDarkTheme = pref == AppThemePreference.Dark;

        var accent = _theme.Accent;
        IsAccentSystem = accent == AccentPack.System;
        IsAccentOcean = accent == AccentPack.Ocean;
        IsAccentForest = accent == AccentPack.Forest;
        IsAccentSunset = accent == AccentPack.Sunset;
        IsAccentSlate = accent == AccentPack.Slate;
        IsAccentBerry = accent == AccentPack.Berry;
        AccentStatus = $"Accent: {AccentPalette.DisplayName(accent)}.";

        IsProUnlocked = _license.IsProUnlocked;
        IsUsingDevBypass = _license.IsUsingDevBypass;
        LicenseStatus = _license.StatusMessage;

        AiBaseUrl = _ai.BaseUrl;
        AiModel = _ai.Model;
        if (string.IsNullOrEmpty(AiKeyStatus))
        {
            AiKeyStatus = _ai.HasApiKey
                ? "An API key is stored locally (PasswordVault)."
                : "No API key stored yet.";
        }
        else if (_ai.HasApiKey && AiKeyStatus.Contains("No API key", StringComparison.OrdinalIgnoreCase))
        {
            AiKeyStatus = "An API key is stored locally (PasswordVault).";
        }
    }
}
