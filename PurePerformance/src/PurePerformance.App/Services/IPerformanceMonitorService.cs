using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IPerformanceMonitorService
{
    IAsyncEnumerable<PerformanceSample> StreamSamplesAsync(
        TimeSpan interval,
        CancellationToken cancellationToken = default);
}
