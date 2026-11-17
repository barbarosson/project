namespace PurePerformance.Services;

/// <summary>
/// Stub for a future Memory Optimizer. Must never claim to "free RAM" by emptying
/// working sets in a misleading way; real implementation should explain trade-offs.
/// </summary>
public interface IMemoryOptimizerService
{
    Task<MemorySnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default);

    Task OptimizeAsync(CancellationToken cancellationToken = default);
}

public sealed record MemorySnapshot(
    ulong TotalBytes,
    ulong AvailableBytes,
    double CommitPercent);

public sealed class MemoryOptimizerServiceStub : IMemoryOptimizerService
{
    public Task<MemorySnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new MemorySnapshot(0, 0, 0));

    public Task OptimizeAsync(CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
