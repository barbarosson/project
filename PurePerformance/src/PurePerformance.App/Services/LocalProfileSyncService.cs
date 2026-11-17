using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Local multi-PC profile scaffold. Cloud sync is intentionally stubbed with honest UI copy.
/// </summary>
public sealed class LocalProfileSyncService : IProfileSyncService
{
    private readonly UserSettingsStore _store;

    public LocalProfileSyncService(UserSettingsStore store)
    {
        _store = store;
    }

    public string CloudSyncStatus { get; private set; } =
        "Cloud sync is not connected yet. Profiles stay on this PC under LocalAppData. A future update may add optional account sync — nothing is uploaded today.";

    public string ActiveProfileId => _store.ActiveProfileId;

    public PcProfile? ActiveProfile =>
        GetProfiles().FirstOrDefault(p => p.Id == ActiveProfileId);

    public IReadOnlyList<PcProfile> GetProfiles() => _store.GetProfiles();

    public PcProfile AddLocalProfile(string displayName)
    {
        var list = GetProfiles().ToList();
        var profile = new PcProfile
        {
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? "New profile" : displayName.Trim(),
            MachineName = Environment.MachineName,
            IsLocal = true,
            UpdatedUtc = DateTimeOffset.UtcNow
        };
        list.Add(profile);
        _store.SaveProfiles(list);
        _store.ActiveProfileId = profile.Id;
        return profile;
    }

    public void SetActive(string profileId)
    {
        if (GetProfiles().Any(p => p.Id == profileId))
        {
            _store.ActiveProfileId = profileId;
        }
    }

    public void Rename(string profileId, string displayName)
    {
        var list = GetProfiles().ToList();
        var p = list.FirstOrDefault(x => x.Id == profileId);
        if (p is null) return;
        p.DisplayName = displayName.Trim();
        p.UpdatedUtc = DateTimeOffset.UtcNow;
        _store.SaveProfiles(list);
    }

    public void Remove(string profileId)
    {
        var list = GetProfiles().Where(p => p.Id != profileId).ToList();
        if (list.Count == 0)
        {
            return;
        }

        _store.SaveProfiles(list);
        if (ActiveProfileId == profileId)
        {
            _store.ActiveProfileId = list[0].Id;
        }
    }

    public Task<string> TryCloudSyncAsync(CancellationToken cancellationToken = default)
    {
        CloudSyncStatus =
            "Cloud sync is not available in this build. Your local profiles were left unchanged. No account sign-in and no upload were attempted.";
        return Task.FromResult(CloudSyncStatus);
    }
}
