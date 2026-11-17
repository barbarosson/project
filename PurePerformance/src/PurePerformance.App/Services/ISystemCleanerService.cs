using PurePerformance.Models;

namespace PurePerformance.Services;

public interface ISystemCleanerService
{
    Task<IReadOnlyList<CleanupTarget>> GetSafeCleanupTargetsAsync(
        CancellationToken cancellationToken = default);

    Task<CleanupResult> CleanAsync(
        IEnumerable<string> actionIds,
        IProgress<string>? progress = null,
        CancellationToken cancellationToken = default);
}
