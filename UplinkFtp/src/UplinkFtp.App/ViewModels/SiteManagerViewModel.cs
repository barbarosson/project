using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Models.Entities;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Persistence;

namespace UplinkFtp.ViewModels;

/// <summary>Saved sites/folders manager with Free-tier 3-site gate.</summary>
public sealed partial class SiteManagerViewModel : ObservableObject
{
    private readonly ISiteRepository _sites;
    private readonly ILicenseService _license;

    public ObservableCollection<SiteEntity> Sites { get; } = [];

    public ObservableCollection<SiteFolderEntity> Folders { get; } = [];

    public string[] ProtocolOptions { get; } = ["ftp", "ftps", "sftp"];

    /// <summary>Raised when the user wants to connect using the selected (or form) site.</summary>
    public event EventHandler<SiteConnectRequest>? ConnectRequested;

    /// <summary>Raised when Free site limit is hit — shell should open License / Buy Pro.</summary>
    public event EventHandler? UpgradeToProRequested;

    [ObservableProperty]
    private SiteEntity? _selectedSite;

    [ObservableProperty]
    private SiteFolderEntity? _selectedFolder;

    [ObservableProperty]
    private string _name = string.Empty;

    [ObservableProperty]
    private string _host = string.Empty;

    [ObservableProperty]
    private string _portText = "21";

    [ObservableProperty]
    private string _protocol = "ftp";

    [ObservableProperty]
    private string _username = string.Empty;

    [ObservableProperty]
    private string _password = string.Empty;

    [ObservableProperty]
    private string _privateKeyPath = string.Empty;

    [ObservableProperty]
    private string _initialRemotePath = "/";

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    [ObservableProperty]
    private bool _isBusy;

    public SiteManagerViewModel(ISiteRepository sites, ILicenseService license)
    {
        _sites = sites;
        _license = license;
    }

    public async Task LoadAsync()
    {
        IsBusy = true;
        try
        {
            Sites.Clear();
            Folders.Clear();

            foreach (var folder in await _sites.GetFoldersAsync().ConfigureAwait(true))
            {
                Folders.Add(folder);
            }

            foreach (var site in await _sites.GetAllAsync().ConfigureAwait(true))
            {
                Sites.Add(site);
            }

            var max = _license.GetMaxSavedSites();
            var limitLabel = max >= LicenseLimits.ProUnlimited ? "unlimited" : max.ToString();
            StatusMessage = $"{_license.GetCurrentTier()} · {Sites.Count} site(s) · limit {limitLabel}";
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

    partial void OnSelectedSiteChanged(SiteEntity? value)
    {
        if (value is null)
        {
            return;
        }

        Name = value.Name;
        Host = value.Host;
        PortText = value.Port.ToString();
        Protocol = string.IsNullOrWhiteSpace(value.Protocol) ? "ftp" : value.Protocol.ToLowerInvariant();
        Username = value.Username;
        PrivateKeyPath = value.PrivateKeyPath ?? string.Empty;
        InitialRemotePath = value.InitialRemotePath ?? "/";
        Password = string.Empty;
        SelectedFolder = Folders.FirstOrDefault(f => f.Id == value.FolderId);
        _ = LoadPasswordAsync(value.Id);
    }

    private async Task LoadPasswordAsync(int siteId)
    {
        try
        {
            var secret = await _sites.GetPasswordAsync(siteId).ConfigureAwait(true);
            if (SelectedSite?.Id == siteId && !string.IsNullOrEmpty(secret))
            {
                Password = secret;
            }
        }
        catch
        {
            // Leave password blank if vault read fails.
        }
    }

    [RelayCommand]
    private void NewSite()
    {
        SelectedSite = null;
        Name = string.Empty;
        Host = string.Empty;
        PortText = Protocol.ToLowerInvariant() switch
        {
            "ftps" => "990",
            "sftp" => "22",
            _ => "21"
        };
        Username = string.Empty;
        Password = string.Empty;
        PrivateKeyPath = string.Empty;
        InitialRemotePath = "/";
        StatusMessage = "New site — fill the form and tap Add.";
    }

    [RelayCommand]
    private async Task AddAsync()
    {
        if (IsBusy)
        {
            return;
        }

        if (!TryBuildSite(out var site, out var error))
        {
            StatusMessage = error;
            return;
        }

        // Free 3-site gate — surface a clear message and open License (Buy Pro) upsell.
        if (!await CanAddSiteAsync().ConfigureAwait(true))
        {
            var max = _license.GetMaxSavedSites();
            StatusMessage =
                $"Free tier allows at most {max} saved sites. Opening License to upgrade to Pro…";
            UpgradeToProRequested?.Invoke(this, EventArgs.Empty);
            return;
        }

        IsBusy = true;
        try
        {
            var saved = await _sites.AddAsync(site, string.IsNullOrEmpty(Password) ? null : Password)
                .ConfigureAwait(true);
            Sites.Add(saved);
            SelectedSite = saved;
            StatusMessage = $"Added “{saved.Name}”.";
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
    private async Task SaveAsync()
    {
        if (IsBusy || SelectedSite is null)
        {
            if (SelectedSite is null)
            {
                StatusMessage = "Select a site to save, or use Add for a new one.";
            }

            return;
        }

        if (!TryBuildSite(out var site, out var error))
        {
            StatusMessage = error;
            return;
        }

        site.Id = SelectedSite.Id;
        site.CredentialKey = SelectedSite.CredentialKey;

        IsBusy = true;
        try
        {
            // null password arg keeps existing secret; empty string would clear — only pass when user typed.
            string? newPassword = null;
            if (!string.IsNullOrEmpty(Password))
            {
                newPassword = Password;
            }

            await _sites.UpdateAsync(site, newPassword).ConfigureAwait(true);

            var index = Sites.ToList().FindIndex(s => s.Id == site.Id);
            if (index >= 0)
            {
                Sites[index] = site;
            }

            SelectedSite = site;
            StatusMessage = $"Saved “{site.Name}”.";
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
    private async Task DeleteAsync()
    {
        if (IsBusy || SelectedSite is null)
        {
            StatusMessage = "Select a site to delete.";
            return;
        }

        IsBusy = true;
        try
        {
            var id = SelectedSite.Id;
            var name = SelectedSite.Name;
            await _sites.DeleteAsync(id).ConfigureAwait(true);
            var existing = Sites.FirstOrDefault(s => s.Id == id);
            if (existing is not null)
            {
                Sites.Remove(existing);
            }

            SelectedSite = null;
            NewSite();
            StatusMessage = $"Deleted “{name}”.";
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
    private async Task ConnectAsync()
    {
        SiteEntity site;
        string? password;

        if (SelectedSite is not null)
        {
            site = SelectedSite;
            password = await _sites.GetPasswordAsync(site.Id).ConfigureAwait(true);
            if (string.IsNullOrEmpty(password) && !string.IsNullOrEmpty(Password))
            {
                password = Password;
            }
        }
        else
        {
            if (!TryBuildSite(out site, out var error))
            {
                StatusMessage = error;
                return;
            }

            password = string.IsNullOrEmpty(Password) ? null : Password;
        }

        ConnectRequested?.Invoke(this, new SiteConnectRequest(site, password));
        StatusMessage = $"Connecting to {site.Host}…";
    }

    private async Task<bool> CanAddSiteAsync()
    {
        if (_license.GetCurrentTier() == LicenseTier.Pro ||
            _license.IsFeatureEnabled(LicenseFeature.UnlimitedSites))
        {
            return true;
        }

        var count = await _sites.CountAsync().ConfigureAwait(true);
        return count < _license.GetMaxSavedSites();
    }

    private bool TryBuildSite(out SiteEntity site, out string error)
    {
        site = new SiteEntity();
        error = string.Empty;

        if (string.IsNullOrWhiteSpace(Name))
        {
            error = "Name is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(Host))
        {
            error = "Host is required.";
            return false;
        }

        if (!int.TryParse(PortText, out var port) || port < 0)
        {
            error = "Port must be a non-negative number.";
            return false;
        }

        site.Name = Name.Trim();
        site.Host = Host.Trim();
        site.Port = port;
        site.Protocol = (Protocol ?? "ftp").Trim().ToLowerInvariant();
        site.Username = string.IsNullOrWhiteSpace(Username) ? "anonymous" : Username.Trim();
        site.PrivateKeyPath = string.IsNullOrWhiteSpace(PrivateKeyPath) ? null : PrivateKeyPath.Trim();
        site.InitialRemotePath = string.IsNullOrWhiteSpace(InitialRemotePath) ? "/" : InitialRemotePath.Trim();
        site.FolderId = SelectedFolder?.Id;
        return true;
    }
}

/// <summary>Payload when Site Manager requests a connect into the main shell.</summary>
public sealed class SiteConnectRequest
{
    public SiteConnectRequest(SiteEntity site, string? password)
    {
        Site = site;
        Password = password;
    }

    public SiteEntity Site { get; }

    public string? Password { get; }
}
