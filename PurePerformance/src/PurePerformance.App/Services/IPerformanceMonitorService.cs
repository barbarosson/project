namespace PurePerformance.Services;

/// <summary>
/// Stub for live CPU / RAM / GPU charts on the Dashboard (PP-4).
/// </summary>
public interface IPerformanceMonitorService
{
    IAsyncEnumerable<PerformanceSample> StreamSamplesAsync(
        TimeSpan interval,
        CancellationToken cancellationToken = default);
}

public sealed record PerformanceSample(
    DateTimeOffset Timestamp,
    double CpuPercent,
    double MemoryPercent,
    double? GpuPercent);

public sealed class PerformanceMonitorServiceStub : IPerformanceMonitorService
{
    public async IAsyncEnumerable<PerformanceSample> StreamSamplesAsync(
        TimeSpan interval,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        // Yield once so consumers can wire UI; real counters come in PP-4.
        yield return new PerformanceSample(DateTimeOffset.Now, 0, 0, null);
        await Task.Delay(interval, cancellationToken).ConfigureAwait(false);
    }
}
