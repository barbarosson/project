using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IMemoryOptimizerService
{
    Task<MemoryInfo> GetSnapshotAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Calls EmptyWorkingSet on accessible user processes. Explains trade-offs in the UI —
    /// this trims working sets; pages may reload when apps are used again.
    /// </summary>
    Task<MemoryOptimizeResult> OptimizeAsync(CancellationToken cancellationToken = default);
}
