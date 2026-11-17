using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Stub for System Cleaner (temp files, caches). Explicitly excludes aggressive registry cleaners.
/// UI copy must name exactly which folders/files are removed.
/// </summary>
public interface ISystemCleanerService
{
    Task<IReadOnlyList<OptimizationAction>> GetSafeCleanupTargetsAsync(
        CancellationToken cancellationToken = default);

    Task<long> CleanAsync(
        IEnumerable<string> actionIds,
        IProgress<string>? progress = null,
        CancellationToken cancellationToken = default);
}

public sealed class SystemCleanerServiceStub : ISystemCleanerService
{
    public Task<IReadOnlyList<OptimizationAction>> GetSafeCleanupTargetsAsync(
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<OptimizationAction> preview =
        [
            new OptimizationAction
            {
                Id = "user-temp",
                DisplayName = "User temporary files",
                WhatItDoes = "Removes files only under %TEMP% that are not locked by running apps.",
                RequiresAdmin = false,
                Risk = OptimizationRisk.Safe
            }
        ];
        return Task.FromResult(preview);
    }

    public Task<long> CleanAsync(
        IEnumerable<string> actionIds,
        IProgress<string>? progress = null,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(0L);
}
