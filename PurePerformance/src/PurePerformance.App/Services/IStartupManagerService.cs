using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Stub for the Startup Optimizer module (next iteration).
/// Lists Run-key / Startup-folder entries and supports safe enable/disable — never blind registry deletion.
/// </summary>
public interface IStartupManagerService
{
    Task<IReadOnlyList<OptimizationAction>> GetStartupEntriesAsync(
        CancellationToken cancellationToken = default);

    Task<bool> SetEnabledAsync(
        string entryId,
        bool enabled,
        CancellationToken cancellationToken = default);
}

/// <summary>Placeholder implementation until PP-2.</summary>
public sealed class StartupManagerServiceStub : IStartupManagerService
{
    public Task<IReadOnlyList<OptimizationAction>> GetStartupEntriesAsync(
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<OptimizationAction> empty = Array.Empty<OptimizationAction>();
        return Task.FromResult(empty);
    }

    public Task<bool> SetEnabledAsync(
        string entryId,
        bool enabled,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(false);
}
