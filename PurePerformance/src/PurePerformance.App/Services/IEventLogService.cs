using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IEventLogService
{
    /// <summary>
    /// Streams crash-related Errors/Warnings from Application and System logs
    /// without blocking the UI thread.
    /// </summary>
    IAsyncEnumerable<CrashEvent> AnalyzeAsync(
        CrashLookback lookback,
        CancellationToken cancellationToken = default);
}
