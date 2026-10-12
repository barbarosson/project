using CommunityToolkit.Mvvm.ComponentModel;
using FtpAi.Services.Ftp;
using FtpAi.Services.Licensing;
using FtpAi.Services.Persistence;

namespace FtpAi.ViewModels;

/// <summary>
/// Root shell ViewModel. Connection, browser, and queue VMs arrive in later ADIMs.
/// </summary>
public partial class MainViewModel : ObservableObject
{
    private readonly IFtpService _ftpService;
    private readonly ILicenseService _licenseService;
    private readonly ISiteRepository _sites;

    [ObservableProperty]
    private string _statusText = "ADIM 3 security/db — ready for UI panels.";

    public MainViewModel(
        IFtpService ftpService,
        ILicenseService licenseService,
        ISiteRepository sites)
    {
        _ftpService = ftpService;
        _licenseService = licenseService;
        _sites = sites;

        var tier = _licenseService.GetCurrentTier();
        var maxSites = _licenseService.GetMaxSavedSites();
        StatusText =
            $"ADIM 3 security/db · {_ftpService.Name} · License: {tier} (max sites {maxSites})";
    }
}
