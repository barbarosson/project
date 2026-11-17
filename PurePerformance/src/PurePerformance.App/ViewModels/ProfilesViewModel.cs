using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Models;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class ProfilesViewModel : ObservableObject
{
    private readonly IProfileSyncService _profiles;

    public ProfilesViewModel(IProfileSyncService profiles)
    {
        _profiles = profiles;
        Reload();
    }

    public ObservableCollection<PcProfile> Profiles { get; } = new();

    [ObservableProperty]
    private string newProfileName = string.Empty;

    [ObservableProperty]
    private string statusMessage = string.Empty;

    [ObservableProperty]
    private string cloudStatus = string.Empty;

    [ObservableProperty]
    private string activeProfileId = string.Empty;

    [RelayCommand]
    private void Add()
    {
        var p = _profiles.AddLocalProfile(NewProfileName);
        NewProfileName = string.Empty;
        Reload();
        StatusMessage = $"Added local profile “{p.DisplayName}”.";
    }

    [RelayCommand]
    private void Activate(PcProfile? profile)
    {
        if (profile is null) return;
        _profiles.SetActive(profile.Id);
        Reload();
        StatusMessage = $"Active profile: {profile.DisplayName}.";
    }

    [RelayCommand]
    private void Remove(PcProfile? profile)
    {
        if (profile is null) return;
        _profiles.Remove(profile.Id);
        Reload();
        StatusMessage = "Profile removed (at least one local profile remains).";
    }

    [RelayCommand]
    private async Task CloudSyncAsync()
    {
        CloudStatus = await _profiles.TryCloudSyncAsync();
        StatusMessage = CloudStatus;
    }

    private void Reload()
    {
        Profiles.Clear();
        foreach (var p in _profiles.GetProfiles())
        {
            Profiles.Add(p);
        }

        ActiveProfileId = _profiles.ActiveProfileId;
        CloudStatus = _profiles.CloudSyncStatus;
        if (string.IsNullOrEmpty(StatusMessage))
        {
            StatusMessage = "Local multi-profile is available. Cloud sync is not connected yet.";
        }
    }
}
