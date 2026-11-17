using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IProfileSyncService
{
    IReadOnlyList<PcProfile> GetProfiles();

    string ActiveProfileId { get; }

    PcProfile? ActiveProfile { get; }

    PcProfile AddLocalProfile(string displayName);

    void SetActive(string profileId);

    void Rename(string profileId, string displayName);

    void Remove(string profileId);

    /// <summary>Honest cloud stub — explains that sync is not live yet.</summary>
    string CloudSyncStatus { get; }

    Task<string> TryCloudSyncAsync(CancellationToken cancellationToken = default);
}
