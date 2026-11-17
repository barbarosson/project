using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IAdvancedCrashService
{
    Task<IReadOnlyList<CrashTrendBucket>> GetTrendsAsync(
        CrashLookback lookback,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CrashCorrelationGroup>> GetCorrelationsAsync(
        CrashLookback lookback,
        CancellationToken cancellationToken = default);

    Task<string> ExportReportAsync(
        CrashLookback lookback,
        CancellationToken cancellationToken = default);
}
