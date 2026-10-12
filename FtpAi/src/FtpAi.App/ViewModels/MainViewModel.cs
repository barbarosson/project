using CommunityToolkit.Mvvm.ComponentModel;
using FtpAi.Services.Ftp;
using FtpAi.Services.Licensing;

namespace FtpAi.ViewModels;

/// <summary>
/// Root shell ViewModel. Connection, browser, and queue VMs arrive in later ADIMs.
/// </summary>
public partial class MainViewModel : ObservableObject
{
    private readonly IFtpService _ftpService;
    private readonly ILicenseService _licenseService;

    [ObservableProperty]
    private string _statusText = "ADIM 1 skeleton — ready for UI panels.";

    public MainViewModel(IFtpService ftpService, ILicenseService licenseService)
    {
        _ftpService = ftpService;
        _licenseService = licenseService;

        var tier = _licenseService.GetCurrentTier();
        StatusText = $"ADIM 1 skeleton · {_ftpService.Name} · License: {tier}";
    }
}
