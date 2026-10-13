using System;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Services.Licensing;

namespace UplinkFtp.ViewModels;

/// <summary>License status, Web key entry, and purchase guidance (P7 client UX).</summary>
public sealed partial class LicenseViewModel : ObservableObject
{
    private readonly ILicenseService _license;
    private readonly WebLicenseService? _webLicense;

    [ObservableProperty]
    private string _channelText = string.Empty;

    [ObservableProperty]
    private string _tierText = string.Empty;

    [ObservableProperty]
    private string _statusDetail = string.Empty;

    [ObservableProperty]
    private string _licenseKey = string.Empty;

    [ObservableProperty]
    private string _purchaseInfo = string.Empty;

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    [ObservableProperty]
    private bool _isWebChannel;

    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string _channelLine = string.Empty;

    [ObservableProperty]
    private string _tierLine = string.Empty;

    public LicenseViewModel(ILicenseService license)
    {
        _license = license;
        _webLicense = license as WebLicenseService;
        RefreshDisplay();
    }

    public void RefreshDisplay()
    {
        ChannelText = _license.Channel.ToString();
        TierText = _license.GetCurrentTier().ToString();
        ChannelLine = $"Channel: {ChannelText}";
        TierLine = $"Tier: {TierText}";
        StatusDetail = _license.StatusDetail;
        IsWebChannel = _license.Channel == DistributionChannel.Web && _webLicense is not null;

        if (_license.Channel == DistributionChannel.Store)
        {
            PurchaseInfo = "Buy Pro from Microsoft Store.";
        }
        else
        {
            var url = Environment.GetEnvironmentVariable("UPLINK_PURCHASE_URL");
            PurchaseInfo = string.IsNullOrWhiteSpace(url)
                ? "Purchase a Pro license key from your vendor, then paste it below."
                : $"Purchase Pro: {url.Trim()}";
        }

        StatusMessage = string.Empty;
    }

    [RelayCommand]
    private async Task ActivateAsync()
    {
        if (_webLicense is null)
        {
            StatusMessage = "License keys are only used on the Web / sideload channel.";
            return;
        }

        if (string.IsNullOrWhiteSpace(LicenseKey))
        {
            StatusMessage = "Enter a license key to activate.";
            return;
        }

        IsBusy = true;
        try
        {
            await _webLicense.SetLicenseKeyAsync(LicenseKey.Trim()).ConfigureAwait(true);
            RefreshDisplay();
            StatusMessage = $"Activated · {_license.GetCurrentTier()}";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task ClearAsync()
    {
        if (_webLicense is null)
        {
            StatusMessage = "Clear is only available on the Web channel.";
            return;
        }

        IsBusy = true;
        try
        {
            await _webLicense.SetLicenseKeyAsync(null).ConfigureAwait(true);
            LicenseKey = string.Empty;
            RefreshDisplay();
            StatusMessage = "License key cleared (Free).";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        IsBusy = true;
        try
        {
            await _license.RefreshAsync().ConfigureAwait(true);
            RefreshDisplay();
            StatusMessage = "Refreshed.";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }
}
